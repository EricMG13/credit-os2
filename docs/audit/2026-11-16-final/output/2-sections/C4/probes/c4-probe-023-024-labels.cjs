// C4-023: Rates, FX & hedging draws a one-option select ("Compare with the 5% move": only "10%").
// C4-024: choosing the 'Downside shock' case relabels it 'Downside case' in the grid header.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-023-024-labels.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  let defects = 0;
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#modules/CP-2E`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(700);
    const sel = page.locator("main select:visible");
    const opts = await sel.first().locator("option").allInnerTexts();
    console.log("C4-023 select options:", JSON.stringify(opts));
    if (opts.length === 1) { defects += 1; console.log("DEFECT PRESENT: a select with one option offers no choice"); }
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(700);
    await page.locator("input[name=forecast-case]").nth(1).check({ force: true });
    await page.waitForTimeout(300);
    const card = await page.locator("#forecast-cases").innerText();
    const head = (await page.locator("#forecast-model table").last().locator("thead").innerText()).replace(/\s+/g, " ");
    console.log("C4-024 card name:", /Downside shock/.test(card) ? "Downside shock" : "?", "| grid header:", head.slice(0, 80));
    if (/Downside shock/.test(card) && /Downside case/.test(head)) { defects += 1; console.log("DEFECT PRESENT: card says 'Downside shock', grid header says 'Downside case'"); }
    await page.locator("#forecast-model").screenshot({ path: "docs/audit/2026-11-16-final/output/2-sections/C4/evidence/forecast-downside-selected-header.png", clip: undefined }).catch(() => {});
    process.exitCode = defects ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
