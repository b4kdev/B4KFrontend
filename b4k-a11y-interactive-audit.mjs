import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE = 'http://localhost:3001';
const AXE_PATH = join(__dirname, 'node_modules/axe-core/axe.min.js');
const REPORT_DATE = new Date().toISOString().split('T')[0];
const OUT_DIR = join(__dirname, 'reports/a11y-interactive');
const OUT_REPORT = join(OUT_DIR, `${REPORT_DATE}-wcag-interactive-audit.md`);

const LOCALES = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'];
const VIEWPORTS = {
  mobile:  { width: 375,  height: 812 },
  desktop: { width: 1280, height: 800 },
};

// Cookie consent banner (CookieBanner.tsx) shows on first load and physically
// overlaps bottom-anchored elements (e.g. the desktop Sidebar's Sign In
// button) — dismiss it before any click-based interaction, same as a real
// user would have to.
async function dismissCookieBanner(page) {
  const dismissBtn = page.locator('[role="region"] button:has(svg.lucide-x)');
  if (await dismissBtn.count() > 0) {
    await dismissBtn.first().click();
    await page.waitForTimeout(200);
  }
}

// Every state below was traced to an actual trigger in the component source
// (not guessed selectors) — see B4KStudio/audits/2026-07-21 session notes.
// Selectors are icon-class based (lucide-react renders `lucide-<name>` class
// names), not translated text, so they hold across all 7 locales.
const STATES = [
  {
    id: 'map-poi-selected',
    label: 'MP_10-13 Map POI selected',
    viewports: ['mobile', 'desktop'],
    // MapView.tsx reads ?poi=<id> on mount and sets selectedPoiId directly —
    // no click/SDK interaction needed. id=1 may not resolve to a real POI
    // depending on backend data, but the selected-state UI shell (LeftPanel/
    // POIBottomSheet) renders regardless, which is what needs auditing.
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}/map?poi=1`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
    },
  },
  {
    id: 'map-plan-active',
    label: 'MP_20-23 Map plan active',
    viewports: ['mobile', 'desktop'],
    // ?plan=<id> triggers a GET /api/plans/:id and loads it into edit mode.
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}/map?plan=1`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
    },
  },
  {
    id: 'map-ai-overlay',
    label: 'MP_30-35 Map AI overlay',
    viewports: ['mobile', 'desktop'],
    // ?ai=open sets aiOverlayOpen(true) directly (MapView.tsx ~line 118).
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}/map?ai=open`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
    },
  },
  {
    id: 'mobile-drawer-open',
    label: 'HD_01-08 Mobile nav drawer open',
    viewports: ['mobile'],
    // TopNav hamburger (Menu icon) toggles MobileDrawer's `open` state, which
    // slides the <aside> from -translate-x-full to translate-x-0 over
    // --dur-reveal (250ms). Click the real trigger rather than assuming the
    // off-screen drawer is safely clickable pre-open.
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
      await page.locator('header button:has(svg.lucide-menu)').click();
      await page.waitForTimeout(400);
    },
  },
  {
    id: 'auth-gate-desktop',
    label: 'AG_01-04 Auth Gate modal (desktop sidebar trigger)',
    viewports: ['desktop'],
    // Sidebar.tsx guest branch: button with User icon calls open('profile_nav').
    // Sidebar itself is `hidden lg:flex` so only visible/actionable at desktop.
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
      await page.locator('aside.hidden.lg\\:flex button:has(svg.lucide-user)').first().click();
      await page.waitForTimeout(300);
    },
  },
  {
    id: 'auth-gate-mobile',
    label: 'AG_01-04 Auth Gate modal (mobile drawer trigger)',
    viewports: ['mobile'],
    // Open the drawer first (real trigger), then click its guest profile row.
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
      await page.locator('header button:has(svg.lucide-menu)').click();
      await page.waitForTimeout(400);
      await page.locator('aside[role="dialog"].translate-x-0 button:has(svg.lucide-user)').first().click();
      await page.waitForTimeout(300);
    },
  },
];

// Known gap: DraftResumeFreshModal / DraftConflictModal need a pre-existing
// draft (localStorage or DB state) to trigger — not covered here. Needs a
// seed step (write a draft to localStorage before goto) if picked up later.

async function run() {
  const browser = await chromium.launch();
  const axeScriptContent = readFileSync(AXE_PATH, 'utf8');

  const allResults = [];

  for (const locale of LOCALES) {
    for (const state of STATES) {
      for (const vpName of state.viewports) {
        const vp = VIEWPORTS[vpName];
        const context = await browser.newContext({
          viewport: vp,
          deviceScaleFactor: vpName === 'mobile' ? 2 : 1,
        });
        const page = await context.newPage();

        try {
          await state.goto(page, locale);
          await page.waitForTimeout(500);

          await page.evaluate(axeScriptContent);
          const results = await page.evaluate(async () => await window.axe.run());

          allResults.push({
            state, locale, viewport: vpName,
            violations: results.violations,
            error: null,
          });
          console.log(`  ${state.label} [${locale}/${vpName}] — violations: ${results.violations.length}`);
        } catch (err) {
          console.error(`  ${state.label} [${locale}/${vpName}] — ERROR: ${err.message}`);
          allResults.push({ state, locale, viewport: vpName, violations: [], error: err.message });
        } finally {
          await page.close();
          await context.close();
        }
      }
    }
  }

  await browser.close();

  const erroredResults = allResults.filter(r => r.error);
  const cleanResults = allResults.filter(r => !r.error);
  const totalViolations = cleanResults.reduce((sum, r) => sum + r.violations.length, 0);

  let md = `# WCAG Interactive-State Accessibility Audit — B4KFrontend\n\n`;
  md += `> **Audit Date:** ${REPORT_DATE}\n`;
  md += `> **Standard:** WCAG 2.2 Level AA\n`;
  md += `> **Coverage:** ${STATES.length} interaction-triggered states × 7 locales, each on its real viewport(s). Complements the cold-page-load audit (\`b4k-a11y-audit.mjs\`), which cannot see any of these.\n`;
  md += `> **Not covered:** DraftResumeFreshModal / DraftConflictModal (need seeded draft state) — see script header.\n\n`;

  md += `## Executive Summary\n\n`;
  if (erroredResults.length > 0) {
    md += `🛑 **${erroredResults.length} state/locale/viewport combinations failed to trigger and were NOT audited.** See "Trigger Errors".\n\n`;
  }
  md += totalViolations === 0 && erroredResults.length === 0
    ? `✅ All clear across ${allResults.length} combinations.\n\n`
    : `⚠️ **${totalViolations} violations** across ${cleanResults.filter(r => r.violations.length > 0).length} combinations.\n\n`;

  const violationsByCode = {};
  for (const res of cleanResults) for (const v of res.violations) violationsByCode[v.id] = (violationsByCode[v.id] || 0) + 1;
  md += `### Common Violations\n\n| Rule ID | Count |\n|---|---|\n`;
  for (const [code, count] of Object.entries(violationsByCode).sort((a, b) => b[1] - a[1])) {
    md += `| \`${code}\` | ${count} |\n`;
  }
  md += `\n`;

  if (erroredResults.length > 0) {
    md += `## Trigger Errors\n\n| State | Locale | Viewport | Error |\n|---|---|---|---|\n`;
    for (const res of erroredResults) md += `| ${res.state.label} | ${res.locale} | ${res.viewport} | ${res.error} |\n`;
    md += `\n`;
  }

  md += `## Detailed Results\n\n| State | Locale | Viewport | Status | Violations | Details |\n|---|---|---|---|---|---|\n`;
  for (const res of allResults) {
    const statusMark = res.error ? '❌ Error' : (res.violations.length === 0 ? '✅ Pass' : '⚠️ Fail');
    const vDetails = res.violations.map(v => '`' + v.id + '` (' + v.impact + ')').join(', ') || '-';
    md += `| ${res.state.label} | ${res.locale} | ${res.viewport} | ${statusMark} | ${res.violations.length} | ${vDetails} |\n`;
  }
  md += `\n`;

  const failedResults = cleanResults.filter(r => r.violations.length > 0);
  if (failedResults.length > 0) {
    md += `## Findings & Remediations\n\n`;
    for (const res of failedResults) {
      md += `### ${res.state.label} (${res.locale}, ${res.viewport})\n\n`;
      for (const v of res.violations) {
        md += `#### 🛑 \`${v.id}\` — ${v.help} (${v.impact})\n`;
        md += `- ${v.description}\n`;
        for (const node of v.nodes) {
          md += `  - Selector: \`${node.target.join(' > ')}\`\n`;
          md += `    \`\`\`html\n    ${node.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n    \`\`\`\n`;
        }
      }
      md += `\n`;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_REPORT, md);
  console.log(`Report written: ${OUT_REPORT}`);
  console.log(`Total: ${allResults.length} audits — ${erroredResults.length} errors, ${totalViolations} violations.`);
}

run().catch(err => { console.error(err); process.exit(1); });
