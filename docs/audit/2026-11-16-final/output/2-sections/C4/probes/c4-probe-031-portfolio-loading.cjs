// C4-031: while /connected/portfolio/<run> is loading, the Portfolio limits card asserts that the report
// "does not record a validated portfolio basis"; the chart replaces it when the answer arrives.
// The request is delayed 3.5 s in the browser; the service and the application are not changed.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-031-portfolio-loading.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    await page.route("**/connected/portfolio/*", async (route) => { await new Promise((r) => setTimeout(r, 3500)); try { await route.continue(); } catch { /* page closed */ } });
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForTimeout(1500);
    const during = /does not record a validated portfolio basis/.test(await page.locator("main").innerText());
    await page.waitForTimeout(3500);
    const after = /does not record a validated portfolio basis/.test(await page.locator("main").innerText());
    console.log(`claim shown while loading: ${during}; claim shown after the answer: ${after}`);
    await page.unrouteAll({ behavior: "ignoreErrors" });
    console.log(during && !after ? "DEFECT PRESENT (a gap is asserted before the answer is known)" : "no defect seen");
    process.exitCode = during && !after ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
