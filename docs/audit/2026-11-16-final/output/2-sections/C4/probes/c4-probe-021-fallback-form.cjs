// C4-021: a chart that cannot be drawn falls back to a sentence plus the raw table, not the 'Not established
// for this run' gap panel; one covenant with no stated threshold (or a negative current value such as net
// cash) removes the bullet chart for every test. Data are rewritten in the browser (snapshot / portfolio
// interception); the service and the application are not changed.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-021-fallback-form.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  let defects = 0;
  try {
    const variants = {
      "no portfolio basis": { portfolio: true },
      "covenant threshold not supplied": { cov: (rows) => { rows[0].cells[1] = "Not supplied: not stated"; } },
      "covenant negative current (net cash)": { cov: (rows) => { rows[0].cells[2] = "-1.5"; } },
    };
    for (const [name, v] of Object.entries(variants)) {
      const ctx = await lib.newContext(browser, log, { width: 1440, height: 900 });
      const page = await ctx.newPage();
      if (v.portfolio) await page.route("**/connected/portfolio/*", (route) => route.fulfill({ json: { basis: null } }));
      if (v.cov) {
        await page.route("**/connected/snapshot*", async (route) => {
          const r = await route.fetch();
          const b = await r.json();
          const o = Object.values(b.workspace.outputs).find((x) => x.module === "CP-4");
          const t = b.workspace.handoffs[o.sha256].flatMap((s) => s.blocks).find((bl) => bl.type === "table" && bl.headers[0] === "Test");
          v.cov(t.rows);
          return route.fulfill({ response: r, json: b });
        });
      }
      await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(800);
      const text = await page.locator("main").innerText();
      const title = v.portfolio ? "Portfolio limits" : "Covenant headroom";
      const i = text.indexOf(title);
      const seg = text.slice(i, i + 260).replace(/\n+/g, " | ");
      const sentence = /Source table available\. (The chart could not be drawn|This report does not record)/.test(seg);
      const gapPanel = /Not established for this run/.test(seg);
      if (sentence && !gapPanel) defects += 1;
      console.log(`${name}: ${seg.slice(0, 150)} | sentence-with-table: ${sentence} | gap panel: ${gapPanel}`);
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await ctx.close();
    }
    console.log(defects ? `DEFECT PRESENT (${defects} of 3 states)` : "no defect seen");
    process.exitCode = defects ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
