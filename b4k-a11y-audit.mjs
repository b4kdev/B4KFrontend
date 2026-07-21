import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE = 'http://localhost:3001';
const AXE_PATH = join(__dirname, 'node_modules/axe-core/axe.min.js');
const REPORT_DATE = new Date().toISOString().split('T')[0];
const OUT_DIR = join(__dirname, 'reports/a11y');
const OUT_REPORT = join(OUT_DIR, `${REPORT_DATE}-wcag-audit.md`);

// CLAUDE.md Section 1 — supported languages
const LOCALES = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'pt-BR'];

// path is relative to the locale root, e.g. '' -> /en, '/map' -> /en/map
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
  { id: '06-plan-manual',        path: '/plan/manual',           label: 'FL1 Manual plan (stub)' },
  { id: '07-plan-auto',          path: '/plan/auto',             label: 'FL2 Auto-gen plan (stub)' },
  { id: '08-plan-ai',            path: '/plan/ai',               label: 'FL3 AI chat plan (stub)' },
];

// Cold page loads only — does NOT cover interaction-triggered states (Auth
// Gate modal, Map POI/Plan/AI-overlay states, bottom sheets). Needs a
// separate interaction-driven script once those trigger selectors are stable.

const VIEWPORTS = [
  { name: 'mobile',   width: 375,  height: 812 },
  { name: 'desktop',  width: 1280, height: 800 },
];

async function run() {
  const browser = await chromium.launch();
  const axeScriptContent = readFileSync(AXE_PATH, 'utf8');

  const allResults = [];

  for (const locale of LOCALES) {
    for (const vp of VIEWPORTS) {
      console.log(`Auditing ${locale} / ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.name === 'mobile' ? 2 : 1,
      });

      for (const route of ROUTES) {
        const page = await context.newPage();
        const url = `${BASE}/${locale}${route.path}`;

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(1000); // let any dynamic widgets settle

          await page.evaluate(axeScriptContent);

          const results = await page.evaluate(async () => {
            return await window.axe.run();
          });

          allResults.push({
            route,
            locale,
            viewport: vp.name,
            passes: results.passes,
            violations: results.violations,
            incomplete: results.incomplete,
            error: null,
          });

          console.log(`  ${route.label} [${locale}/${vp.name}] — passes: ${results.passes.length}, violations: ${results.violations.length}`);
        } catch (err) {
          console.error(`  ${route.label} [${locale}/${vp.name}] — ERROR: ${err.message}`);
          allResults.push({
            route,
            locale,
            viewport: vp.name,
            passes: [],
            violations: [],
            incomplete: [],
            error: err.message,
          });
        } finally {
          await page.close();
        }
      }

      await context.close();
    }
  }

  await browser.close();

  console.log(`Generating report at ${OUT_REPORT}...`);
  let md = `# WCAG Compliance & Accessibility Audit Report — B4KFrontend\n\n`;
  md += `> **Audit Date:** ${REPORT_DATE}\n`;
  md += `> **Standard:** WCAG 2.2 Level AA\n`;
  md += `> **Tooling:** Playwright + Axe-Core\n`;
  md += `> **Locales:** ${LOCALES.join(', ')}\n`;
  md += `> **Coverage:** cold page loads only — no interaction-triggered states (Auth Gate, Map POI/Plan/AI-overlay, bottom sheets).\n\n`;

  const erroredResults = allResults.filter(r => r.error);
  const cleanResults = allResults.filter(r => !r.error);
  const totalViolations = cleanResults.reduce((sum, r) => sum + r.violations.length, 0);
  const failedPagesCount = cleanResults.filter(r => r.violations.length > 0).length;

  md += `## Executive Summary\n\n`;
  if (erroredResults.length > 0) {
    md += `🛑 **${erroredResults.length} page/locale/viewport combinations failed to load and were NOT audited.** `;
    md += `Results below do not cover them — this is not a clean pass. See "Load Errors" section.\n\n`;
  }
  if (totalViolations === 0 && erroredResults.length === 0) {
    md += `✅ **All clear!** No accessibility violations were detected across any of the tested pages, locales, and viewports.\n\n`;
  } else if (totalViolations === 0) {
    md += `⚠️ No violations found on the pages that loaded, but ${erroredResults.length} combinations never loaded — not a full clear.\n\n`;
  } else {
    md += `⚠️ **Action Required:** Found **${totalViolations} accessibility violations** across **${failedPagesCount} page/locale/viewport combinations**.\n\n`;
  }

  md += `### Violation Breakdown by Impact\n\n`;

  const impactCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const violationsByCode = {};

  for (const res of cleanResults) {
    for (const v of res.violations) {
      impactCounts[v.impact] = (impactCounts[v.impact] || 0) + 1;
      violationsByCode[v.id] = (violationsByCode[v.id] || 0) + 1;
    }
  }

  md += `| Impact | Count |\n|---|---|\n`;
  md += `| 🔴 Critical | ${impactCounts.critical || 0} |\n`;
  md += `| 🟠 Serious | ${impactCounts.serious || 0} |\n`;
  md += `| 🟡 Moderate | ${impactCounts.moderate || 0} |\n`;
  md += `| 🔵 Minor | ${impactCounts.minor || 0} |\n\n`;

  md += `### Common Violations\n\n`;
  md += `| Rule ID | Count | Description |\n|---|---|---|\n`;
  const sortedCodes = Object.entries(violationsByCode).sort((a, b) => b[1] - a[1]);
  for (const [code, count] of sortedCodes) {
    const matchedV = cleanResults.flatMap(r => r.violations).find(v => v.id === code);
    md += `| \`${code}\` | ${count} | ${matchedV?.description || ''} |\n`;
  }
  md += `\n`;

  if (erroredResults.length > 0) {
    md += `## Load Errors (not audited)\n\n`;
    md += `| Screen / Route | Locale | Viewport | Error |\n|---|---|---|---|\n`;
    for (const res of erroredResults) {
      md += `| ${res.route.label} | ${res.locale} | ${res.viewport} | ${res.error} |\n`;
    }
    md += `\n`;
  }

  md += `## Detailed Page Results\n\n`;
  md += `| Screen / Route | Locale | Viewport | Status | Violations | Details |\n|---|---|---|---|---|---|\n`;
  for (const res of allResults) {
    const statusMark = res.error ? '❌ Error' : (res.violations.length === 0 ? '✅ Pass' : '⚠️ Fail');
    const vCount = res.violations.length;
    const vDetails = res.violations.map(v => '`' + v.id + '` (' + v.impact + ')').join(', ') || '-';
    md += `| ${res.route.label} | ${res.locale} | ${res.viewport} | ${statusMark} | ${vCount} | ${vDetails} |\n`;
  }
  md += `\n`;

  const failedResults = cleanResults.filter(r => r.violations.length > 0);
  if (failedResults.length > 0) {
    md += `## Findings & Remediations\n\n`;

    for (const res of failedResults) {
      md += `### ${res.route.label} (${res.locale}, ${res.viewport} viewport)\n`;
      md += `**Path:** \`/${res.locale}${res.route.path}\`\n\n`;

      for (const v of res.violations) {
        md += `#### 🛑 \`${v.id}\` — ${v.help} (${v.impact})\n`;
        md += `- **Description:** ${v.description}\n`;
        md += `- **Help URL:** [Axe Rule ${v.id}](${v.helpUrl})\n`;
        md += `- **Impacted Elements:**\n`;

        for (const node of v.nodes) {
          md += `  - Selector: \`${node.target.join(' > ')}\`\n`;
          md += `    \`\`\`html\n    ${node.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n    \`\`\`\n`;
          if (node.failureSummary) {
            md += `    *Failure Summary:* ${node.failureSummary.replace(/\\n/g, ' ')}\n`;
          }
        }
        md += `\n`;
      }
      md += `\n`;
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_REPORT, md);
  console.log('Report written successfully!');
  console.log(`Total: ${allResults.length} audits — ${erroredResults.length} errors, ${totalViolations} violations across ${failedPagesCount} combos.`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
