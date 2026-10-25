// Launch quality check: LCP under 2.5 s, CLS under 0.1, and touch targets of at least 44 px on phones,
// on the key pages (Home, Map, a place, Explore) at 375 and 1512. Run it against a production build
// (`npm run build && npm start`), since the dev server's timings are not representative:
//   QA_BASE_URL=http://localhost:3000 node b4k-vitals-audit.mjs
// Exit code 1 when a page misses a limit. Targets: on phones every visible link, button, input and
// control is 44 x 44 or larger (hit areas included); one under that must be at least 24 x 24 with no
// other target inside a 24 px circle on its center (WCAG 2.5.8); inline links in a sentence are exempt. Lab numbers on a fast machine: field
// data comes from Speed Insights.
import { chromium } from 'playwright';
import { BASE } from './qa-routes.mjs';

const POI = process.env.QA_POI_ID || '106018';
const PAGES = [
  { label: 'Home', path: '/en' },
  { label: 'Map', path: '/en/map' },
  { label: 'Place', path: `/en/place/${POI}` },
  { label: 'Explore', path: '/en/explore' },
];
const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812, touch: true },
  { name: 'desktop', width: 1512, height: 982, touch: false },
];
const LCP_MAX = 2500;
const CLS_MAX = 0.1;
const TARGET_MIN = 44;

// Collected in the page from the first paint: largest contentful paint and the layout shift sum.
const OBSERVE = () => {
  window.__vitals = { lcp: 0, cls: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
};

// Visible, uncovered interactive elements whose tap area (the box, grown by a ::before hit area as the
// components/library parts draw it) is under the minimum and whose 24 px circle touches another target.
const SMALL_TARGETS = (min) => {
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=checkbox], [role=switch], [role=tab], [role=option]';
  const hitBox = (el) => {
    const r = el.getBoundingClientRect();
    const b = getComputedStyle(el, '::before');
    if (b.content === 'none' || b.position !== 'absolute') return r;
    const px = (v) => (v.endsWith('px') ? parseFloat(v) : 0);
    const left = r.left + px(b.left), top = r.top + px(b.top);
    const w = Math.max(r.width, r.width - px(b.left) - px(b.right)), h = Math.max(r.height, r.height - px(b.top) - px(b.bottom));
    return { left, top, width: w, height: h, right: left + w, bottom: top + h };
  };
  const els = [...document.querySelectorAll(sel)].filter((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (!(r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight)) return false;
    const top = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1));
    return !!top && (el === top || el.contains(top) || top.contains(el));
  });
  const boxes = els.map(hitBox);
  const center = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  const out = [];
  els.forEach((el, i) => {
    const r = boxes[i];
    if (r.width >= min && r.height >= min) return;
    // Inline links inside running text are exempt.
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 20) return;
    // WCAG 2.5.8 spacing: a 24 px circle on the target's center may not touch another target.
    const [cx, cy] = center(r);
    const crowded = boxes.some((o, j) => {
      if (j === i || els[j].contains(el) || el.contains(els[j])) return false;
      const dx = Math.max(o.left - cx, 0, cx - o.right), dy = Math.max(o.top - cy, 0, cy - o.bottom);
      return Math.hypot(dx, dy) < 12;
    });
    if (r.width >= 24 && r.height >= 24 && !crowded) return;
    const name = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
    out.push(`${name} (${Math.round(r.width)}x${Math.round(r.height)})`);
  });
  return out;
};

const browser = await chromium.launch();
let failed = 0;
for (const vp of VIEWPORTS) {
  for (const pg of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch, isMobile: vp.touch });
    const page = await ctx.newPage();
    await page.addInitScript(OBSERVE);
    try {
      await page.goto(BASE + pg.path, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      const { lcp, cls } = await page.evaluate(() => window.__vitals);
      const small = vp.touch ? await page.evaluate(SMALL_TARGETS, TARGET_MIN) : [];
      const bad = lcp > LCP_MAX || cls > CLS_MAX || small.length > 0;
      if (bad) failed++;
      console.log(`${bad ? 'FAIL' : 'PASS'}  ${pg.label} ${vp.name}: LCP ${Math.round(lcp)} ms, CLS ${cls.toFixed(3)}${vp.touch ? `, small targets ${small.length}` : ''}`);
      for (const s of small) console.log(`        ${s}`);
    } catch (err) {
      failed++;
      console.log(`ERROR ${pg.label} ${vp.name}: ${err.message.split('\n')[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(failed ? `\n${failed} page(s) over a limit` : '\nAll pages within the limits');
process.exit(failed ? 1 : 0);
