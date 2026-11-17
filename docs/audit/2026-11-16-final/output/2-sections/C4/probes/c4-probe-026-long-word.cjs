// C4-026: one unbroken 150 to 220 character word in module or model text widens the whole report (header, tabs
// and every card) far past the window: Forecast note, limitation and case description; Downside scenario
// anchor and scope. The text is rewritten in the browser (snapshot interception); the service and the
// application are not changed.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-026-long-word.cjs
"use strict";
const lib = require("./c4-lib.cjs");
const WORD = "x".repeat(220);
const cases = {
  "forecast note": { hash: "forecast", mutate: (b) => b.workspace.models[0].cashflow.notes.push(`Unbroken ${WORD} end.`) },
  "forecast limitation": { hash: "forecast", mutate: (b) => b.workspace.models[0].cashflow.limits.push(`Unbroken ${WORD} end.`) },
  "forecast case description": { hash: "forecast", mutate: (b) => { b.workspace.models[0].cashflow.notes[1] = `Base case is ${WORD} the reference case.`; } },
  "downside anchor and scope (CP-2A)": {
    hash: "modules/CP-2A",
    mutate: (b) => {
      const o = Object.values(b.workspace.outputs).find((x) => x.module === "CP-2A");
      const t = b.workspace.handoffs[o.sha256].flatMap((s) => s.blocks).find((bl) => bl.type === "table" && bl.headers[0] === "Scenario ID");
      t.rows[1].cells[4] = `Anchor${"y".repeat(150)}`;
      t.rows[1].cells[5] = `Left out ${"z".repeat(150)}`;
    },
  },
};
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  let defects = 0;
  try {
    for (const [name, { hash, mutate }] of Object.entries(cases)) {
      const ctx = await lib.newContext(browser, log, { width: 1440, height: 900 });
      const page = await ctx.newPage();
      await page.route("**/connected/snapshot*", async (route) => {
        const r = await route.fetch();
        const b = await r.json();
        mutate(b);
        return route.fulfill({ response: r, json: b });
      });
      await page.goto(`${lib.BASE}/report/${lib.runId()}#${hash}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(800);
      const r = await page.evaluate(() => { const m = document.getElementById("main"); return { scrollWidth: m.scrollWidth, clientWidth: m.clientWidth }; });
      const bad = r.scrollWidth > r.clientWidth + 2;
      if (bad) defects += 1;
      console.log(`${name}: main scrollWidth ${r.scrollWidth} vs clientWidth ${r.clientWidth} ${bad ? "(page wider than the window)" : "(wraps)"}`);
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await ctx.close();
    }
    console.log(defects ? `DEFECT PRESENT (${defects} of ${Object.keys(cases).length} places)` : "no defect seen");
    process.exitCode = defects ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
