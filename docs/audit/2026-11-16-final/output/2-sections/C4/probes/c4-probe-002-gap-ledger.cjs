// C4-002: the Forecast tab prints one near-identical limitation bullet per model line that the
// forecast inputs do not name (a gap ledger on a findings page).
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-002-gap-ledger.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const items = await page.locator("main li").allInnerTexts();
    const same = items.filter((t) => /the forecast inputs do not name the row and period of this line/.test(t));
    same.forEach((t) => console.log("BULLET:", t));
    console.log(same.length >= 3 ? `DEFECT PRESENT (${same.length} near-identical bullets)` : "no defect seen");
    process.exitCode = same.length >= 3 ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
