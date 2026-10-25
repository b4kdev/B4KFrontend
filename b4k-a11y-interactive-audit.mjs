import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BASE } from './qa-routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const AXE_PATH = join(__dirname, 'node_modules/axe-core/axe.min.js');
const REPORT_DATE = new Date().toISOString().split('T')[0];
const OUT_DIR = join(__dirname, 'reports/a11y-interactive');
const OUT_REPORT = join(OUT_DIR, `${REPORT_DATE}-wcag-interactive-audit.md`);

const LOCALES = ['ko', 'en', 'ja', 'zh-TW', 'pt-BR'];
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
    label: 'Map, place selected',
    viewports: ['mobile', 'desktop'],
    // ?poi=<id> opens the place on the map; set QA_POI_ID to a place that exists on the server.
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}/map?poi=${process.env.QA_POI_ID || 106018}`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
    },
  },
  {
    id: 'map-plan-active',
    label: 'Map, plan open',
    viewports: ['mobile', 'desktop'],
    // ?plan=<id> loads that plan into the plan editor (needs a plan the visitor may open).
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}/map?plan=1`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
    },
  },
  {
    id: 'mobile-drawer-open',
    label: 'Phone menu drawer open',
    viewports: ['mobile'],
    // The Home top bar's menu button opens the drawer.
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
      await page.locator('button:has(svg.lucide-menu):visible').first().click();
      await page.waitForTimeout(400);
    },
  },
  {
    id: 'sign-in-gate',
    label: 'Sign-in gate',
    viewports: ['mobile', 'desktop'],
    // A guest's Save on an Explore card opens the gate (centered dialog on desktop, sheet on phones).
    async goto(page, locale) {
      await page.goto(`${BASE}/${locale}/explore/k-pop`, { waitUntil: 'networkidle', timeout: 15000 });
      await dismissCookieBanner(page);
      await page.locator('button[aria-pressed]:has(svg.lucide-bookmark):visible').first().click();
      await page.waitForTimeout(400);
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
          const results = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }));

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
