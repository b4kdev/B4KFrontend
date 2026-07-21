import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE = 'http://localhost:3001';
const REPORT_DATE = new Date().toISOString().split('T')[0];
const OUT_DIR = join(__dirname, 'reports/i18n-overflow');
const OUT_REPORT = join(OUT_DIR, `${REPORT_DATE}-i18n-overflow-audit.md`);

// CLAUDE.md Section 1 / tokens.md §Typography — word-break rules differ per
// locale (zh-CN/zh-TW must NOT use keep-all, it causes 375px overflow). This
// script catches actual rendered overflow, not just token config.
const LOCALES = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'];

const ROUTES = [
  { id: '01-home',               path: '',                       label: 'HM_01 Home' },
  { id: '02-map',                path: '/map',                   label: 'MP_01-08 Map default' },
  { id: '09-itinerary',          path: '/plan/1',                label: 'IT_01 Itinerary detail' },
  { id: '10-explore-kpop',       path: '/explore/k-pop',         label: 'CT_KP Explore K-Pop' },
  { id: '11-explore-kdrama',     path: '/explore/k-drama',       label: 'CT_KD Explore K-Drama' },
  { id: '12-explore-kbeauty',    path: '/explore/k-beauty',      label: 'CT_KB Explore K-Beauty' },
  { id: '13-explore-kculture',   path: '/explore/k-culture',     label: 'CT_KC Explore K-Culture' },
  { id: '14-profile',            path: '/profile',               label: 'PR_01-08 Profile header' },
  { id: '15-profile-trips',      path: '/profile/trips',         label: 'PR_10-16 Profile trips' },
  { id: '16-profile-saved',      path: '/profile/saved',         label: 'PR_20-22 Profile saved' },
  { id: '17-profile-badges',     path: '/profile/badges',        label: 'PR_30-32 Profile badges' },
  { id: '18-profile-settings',   path: '/profile/settings',      label: 'PR_50-53 Profile settings' },
  { id: '19-badges',             path: '/badges',                label: 'BD_01-12 Badges catalog' },
  { id: '20-leaderboard',        path: '/leaderboard',           label: 'LB_01-04 Leaderboard' },
  { id: '21-saved',              path: '/saved',                 label: 'SV_01 Saved (POI + Plans)' },
  { id: '22-search',             path: '/search',                label: 'SR_01 Search results' },
  { id: '23-notifications',      path: '/notifications',         label: 'NTF_01-06 Notifications' },
  { id: '24-help',               path: '/help',                  label: 'HLP_01-05 Help' },
  { id: '25-legal-privacy',      path: '/legal/privacy',         label: 'LGL Privacy policy' },
  { id: '26-legal-terms',        path: '/legal/terms',           label: 'LGL Terms' },
  { id: '27-legal-cookies',      path: '/legal/cookies',         label: 'LGL_05 Cookie preferences' },
  { id: '28-offline',            path: '/offline',               label: 'OFF_01-04 Offline state' },
];

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
];

// Runs in-page. Two checks:
// 1. Page-level: does the document itself scroll horizontally (worst case).
// 2. Element-level: leaf text nodes whose own box overflows its content box,
//    excluding elements that declare overflow-x auto/scroll on themselves
//    (those are intentional — carousels, scroll lists).
function scanOverflow() {
  const pageOverflow = document.documentElement.scrollWidth > window.innerWidth + 2;

  const hits = [];
  const all = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,button,a,label,li,div');
  for (const el of all) {
    if (el.children.length > 0) continue; // leaf only
    const text = el.textContent?.trim();
    if (!text) continue;
    const style = getComputedStyle(el);
    if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue;
    if (el.scrollWidth > el.clientWidth + 2) {
      hits.push({
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 60),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        wordBreak: style.wordBreak,
        overflowWrap: style.overflowWrap,
      });
      if (hits.length >= 25) break; // cap noise per page
    }
  }

  return { pageOverflow, hits };
}

async function run() {
  const browser = await chromium.launch();
  const allResults = [];

  for (const locale of LOCALES) {
    for (const vp of VIEWPORTS) {
      console.log(`Scanning ${locale} / ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

      for (const route of ROUTES) {
        const page = await context.newPage();
        const url = `${BASE}/${locale}${route.path}`;

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(500);
          const { pageOverflow, hits } = await page.evaluate(scanOverflow);

          allResults.push({ route, locale, viewport: vp.name, pageOverflow, hits, error: null });
          if (pageOverflow || hits.length > 0) {
            console.log(`  ${route.label} [${locale}/${vp.name}] — pageOverflow: ${pageOverflow}, elements: ${hits.length}`);
          }
        } catch (err) {
          console.error(`  ${route.label} [${locale}/${vp.name}] — ERROR: ${err.message}`);
          allResults.push({ route, locale, viewport: vp.name, pageOverflow: false, hits: [], error: err.message });
        } finally {
          await page.close();
        }
      }

      await context.close();
    }
  }

  await browser.close();

  const erroredResults = allResults.filter(r => r.error);
  const cleanResults = allResults.filter(r => !r.error);
  const pageOverflowResults = cleanResults.filter(r => r.pageOverflow);
  const elementOverflowResults = cleanResults.filter(r => r.hits.length > 0);

  let md = `# i18n Text-Overflow Audit — B4KFrontend\n\n`;
  md += `> **Audit Date:** ${REPORT_DATE}\n`;
  md += `> **Coverage:** 7 locales × 2 viewports × ${ROUTES.length} routes = ${LOCALES.length * VIEWPORTS.length * ROUTES.length} combos\n`;
  md += `> **Method:** \`document.documentElement.scrollWidth > innerWidth\` (page-level) + leaf text-element \`scrollWidth > clientWidth\` (element-level), excluding elements with intentional \`overflow-x: auto/scroll\`.\n\n`;

  md += `## Executive Summary\n\n`;
  if (erroredResults.length > 0) md += `🛑 ${erroredResults.length} combos failed to load — not scanned.\n\n`;
  md += pageOverflowResults.length === 0 && elementOverflowResults.length === 0
    ? `✅ No horizontal overflow detected across ${cleanResults.length} scanned combos.\n\n`
    : `⚠️ **${pageOverflowResults.length} combos have page-level horizontal overflow.** **${elementOverflowResults.length} combos have overflowing text elements.**\n\n`;

  const byLocale = {};
  for (const r of cleanResults) {
    if (!r.pageOverflow && r.hits.length === 0) continue;
    byLocale[r.locale] = (byLocale[r.locale] || 0) + 1;
  }
  md += `### Affected combos by locale\n\n| Locale | Count |\n|---|---|\n`;
  for (const [loc, count] of Object.entries(byLocale).sort((a, b) => b[1] - a[1])) md += `| \`${loc}\` | ${count} |\n`;
  md += `\n`;

  md += `## Detailed Results\n\n| Screen / Route | Locale | Viewport | Page Overflow | Overflowing Elements |\n|---|---|---|---|---|\n`;
  for (const res of allResults) {
    if (res.error) { md += `| ${res.route.label} | ${res.locale} | ${res.viewport} | ❌ Error | ${res.error} |\n`; continue; }
    if (!res.pageOverflow && res.hits.length === 0) continue; // only list problems
    md += `| ${res.route.label} | ${res.locale} | ${res.viewport} | ${res.pageOverflow ? '⚠️ Yes' : 'No'} | ${res.hits.length} |\n`;
  }
  md += `\n(Clean combos omitted from this table — see summary count above for total scanned.)\n\n`;

  if (elementOverflowResults.length > 0) {
    md += `## Overflowing Elements — Detail\n\n`;
    for (const res of elementOverflowResults) {
      md += `### ${res.route.label} (${res.locale}, ${res.viewport})\n\n`;
      md += `| Tag | Text | scrollWidth | clientWidth | word-break | overflow-wrap |\n|---|---|---|---|---|---|\n`;
      for (const h of res.hits) {
        md += `| \`${h.tag}\` | ${h.text.replace(/\|/g, '\\|')} | ${h.scrollWidth} | ${h.clientWidth} | ${h.wordBreak} | ${h.overflowWrap} |\n`;
      }
      md += `\n`;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_REPORT, md);
  console.log(`Report written: ${OUT_REPORT}`);
  console.log(`Total: ${allResults.length} combos — ${erroredResults.length} errors, ${pageOverflowResults.length} page-overflow, ${elementOverflowResults.length} element-overflow.`);
}

run().catch(err => { console.error(err); process.exit(1); });
