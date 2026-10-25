import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { BASE, ROUTES } from './qa-routes.mjs';

const OUT = '/tmp/b4k-screenshots';
mkdirSync(OUT, { recursive: true });


const VIEWPORTS = [
  { name: 'mobile',   width: 375,  height: 812 },
  { name: 'desktop',  width: 1280, height: 800 },
];

async function run() {
  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE}/en${route.path}`;
      const filename = `${route.id}-${vp.name}.png`;
      const filepath = join(OUT, filename);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        // wait a beat for any animations
        await page.waitForTimeout(600);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`✓ ${filename}`);
        results.push({ label: route.label, vp: vp.name, file: filepath, id: route.id });
      } catch (e) {
        console.log(`✗ ${filename} — ${e.message.split('\n')[0]}`);
        results.push({ label: route.label, vp: vp.name, file: null, id: route.id, error: e.message });
      }
    }

    await context.close();
  }

  await browser.close();

  console.log('\n=== DONE ===');
  const ok = results.filter(r => r.file).length;
  const fail = results.filter(r => !r.file).length;
  console.log(`${ok} screenshots captured, ${fail} failed`);

  // Print stateful screens that need manual capture
  console.log('\nStates that need a click (place selected, plan open, sign-in gate): b4k-a11y-interactive-audit.mjs.');
}

run().catch(e => { console.error(e); process.exit(1); });
