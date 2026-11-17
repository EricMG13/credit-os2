// C4-025: when the published model matches no single forward-credit handoff, every trace control on the
// Forecast model vanishes and the page says nothing. The model's `download` field is rewritten in the
// browser (snapshot interception); the service and the application are not changed.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-025-silent-no-trace.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    const count = async () => page.evaluate(() => [...document.querySelectorAll("button[aria-label^='Show sources for']")].length);
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const before = await count();
    await page.route("**/connected/snapshot*", async (route) => {
      const r = await route.fetch();
      const b = await r.json();
      b.workspace.models[0].download = "../runs/other/deliveries/other/annual.md";
      return route.fulfill({ response: r, json: b });
    });
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(900);
    const after = await count();
    const text = await page.locator("main").innerText();
    const said = /could not be (matched|linked)|no source|not linked|sources are not available/i.test(text);
    console.log(`trace controls before: ${before}, after: ${after}; page explains the loss: ${said}`);
    await page.unrouteAll({ behavior: "ignoreErrors" });
    const defect = after < before && !said;
    console.log(defect ? "DEFECT PRESENT" : "no defect seen");
    process.exitCode = defect ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
