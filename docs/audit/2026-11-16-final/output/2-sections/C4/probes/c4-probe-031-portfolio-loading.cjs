// C4-031: while /connected/portfolio/<run> is loading, the Portfolio limits card asserts that the report
// "does not record a validated portfolio basis"; the chart replaces it when the answer arrives.
// The request is delayed 3.5 s in the browser; the service and the application are not changed.
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
    process.exit(during && !after ? 1 : 0);
  } finally { await browser.close(); }
})();
