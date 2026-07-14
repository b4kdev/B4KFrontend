const { chromium } = require('/Users/sun/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const { mkdirSync } = require('fs');
const { join } = require('path');

const BASE = 'http://localhost:3001';
const OUT = '/tmp/b4k-screenshots';
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  { id: '01-home',             path: '/en',                    label: 'HM_01 Home' },
  { id: '02-map',              path: '/en/map',                label: 'MP_01-08 Map default' },
  { id: '09-itinerary',        path: '/en/itinerary/1',        label: 'IT_01 Itinerary detail' },
  { id: '10-explore-kpop',     path: '/en/explore/k-pop',      label: 'CT_KP Explore K-Pop' },
  { id: '11-explore-kdrama',   path: '/en/explore/k-drama',    label: 'CT_KD Explore K-Drama' },
  { id: '12-explore-kbeauty',  path: '/en/explore/k-beauty',   label: 'CT_KB Explore K-Beauty' },
  { id: '13-explore-kculture', path: '/en/explore/k-culture',  label: 'CT_KC Explore K-Culture' },
  { id: '14-profile',          path: '/en/profile/me',         label: 'PR_01-08 Profile header' },
  { id: '15-profile-trips',    path: '/en/profile/me/trips',   label: 'PR_10-16 Profile trips' },
  { id: '17-profile-badges',   path: '/en/profile/me/badges',  label: 'PR_30-32 Profile badges' },
  { id: '18-profile-settings', path: '/en/profile/me/settings',label: 'PR_50-53 Profile settings' },
  { id: '19-badges',           path: '/en/badges',             label: 'BD_01-12 Badges catalog' },
  { id: '20-leaderboard',      path: '/en/leaderboard',        label: 'LB_01-04 Leaderboard' },
  { id: '22-onboarding',       path: '/en/onboarding',         label: 'ON_01-04 Onboarding' },
  { id: '23-notifications',    path: '/en/notifications',      label: 'NTF_01-06 Notifications' },
  { id: '24-help',             path: '/en/help',               label: 'HLP_01-05 Help' },
  { id: '06-plan-manual',      path: '/en/plan/manual',        label: 'FL1 Manual plan (stub)' },
  { id: '07-plan-auto',        path: '/en/plan/auto',          label: 'FL2 Auto-gen plan (stub)' },
  { id: '08-plan-ai',          path: '/en/plan/ai',            label: 'FL3 AI chat plan (stub)' },
];

const VIEWPORTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
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
      const url = BASE + route.path;
      const filename = `${route.id}-${vp.name}.png`;
      const filepath = join(OUT, filename);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(800);
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

  const ok = results.filter(r => r.file).length;
  const fail = results.filter(r => !r.file).length;
  console.log(`\n=== ${ok} captured, ${fail} failed ===`);
  console.log('\n⚠️  STATEFUL (manual):');
  console.log('  03 MP_10-13 Map POI selected — click map marker');
  console.log('  04 MP_20-23 Map plan active  — load plan then screenshot');
  console.log('  05 MP_30-35 Map AI overlay   — open AI on /map');
  console.log('  16 PR_20-22 Profile saved    — route missing');
  console.log('  21 AG_01-04 Auth gate        — trigger from gated action');
}

run().catch(e => { console.error(e); process.exit(1); });
