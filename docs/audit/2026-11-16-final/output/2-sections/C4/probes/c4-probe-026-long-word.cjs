// C4-026: one unbroken 220-character word in a model note, a limitation or a case description widens the whole
// report (header, tabs and every card) to about 2,190 px. The model text is rewritten in the browser
// (snapshot interception); the service and the application are not changed.
"use strict";
const lib = require("./c4-lib.cjs");
const WORD = "x".repeat(220);
const places = {
  note: (cf) => cf.notes.push(`Unbroken ${WORD} end.`),
  limit: (cf) => cf.limits.push(`Unbroken ${WORD} end.`),
  case: (cf) => { cf.notes[1] = `Base case is ${WORD} the reference case.`; },
};
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  let defects = 0;
  try {
    for (const [name, mutate] of Object.entries(places)) {
      const ctx = await lib.newContext(browser, log, { width: 1440, height: 900 });
      const page = await ctx.newPage();
      await page.route("**/connected/snapshot*", async (route) => {
        const r = await route.fetch();
        const b = await r.json();
        mutate(b.workspace.models[0].cashflow);
        return route.fulfill({ response: r, json: b });
      });
      await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(800);
      const r = await page.evaluate(() => { const m = document.getElementById("main"); return { scrollWidth: m.scrollWidth, clientWidth: m.clientWidth }; });
      const bad = r.scrollWidth > r.clientWidth + 2;
      if (bad) defects += 1;
      console.log(`${name}: main scrollWidth ${r.scrollWidth} vs clientWidth ${r.clientWidth} ${bad ? "(page wider than the window)" : "(wraps)"}`);
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await ctx.close();
    }
    console.log(defects ? `DEFECT PRESENT (${defects} of 3 places)` : "no defect seen");
    process.exit(defects ? 1 : 0);
  } finally { await browser.close(); }
})();
