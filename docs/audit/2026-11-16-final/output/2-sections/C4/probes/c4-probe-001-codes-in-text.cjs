// C4-001: module codes, "Python" and "handoff" appear in reader text on the Forecast tab.
// Needs proof.serve on C4_PORT with a finished synthetic run (c4-setup-run.cjs). From the repo root:
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-001-codes-in-text.cjs
"use strict";
const { execFileSync } = require("node:child_process");
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  let found = 0;
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const text = await page.locator("main").innerText();
    for (const line of text.split("\n")) {
      if (/\bCP-[A-Z0-9]+\b|Python|handoff/i.test(line)) { console.log("FORECAST TEXT:", line.slice(0, 160)); found += 1; }
    }
  } finally { await browser.close(); }
  // a chart-gap reason that names a module code and a page (state rewritten in the browser)
  const out = execFileSync("node", [require("node:path").join(__dirname, "c4-states.cjs")], { env: { ...process.env, C4_STATE: "chart-gap", C4_CHARS: "20000" }, encoding: "utf8", timeout: 90000 });
  const gap = /Not established: see Filing p\.12[^|]*/.exec(out);
  if (gap) { console.log("CHART GAP TEXT:", gap[0]); found += 1; }
  console.log(found ? `DEFECT PRESENT (${found} lines)` : "no defect seen");
  process.exit(found ? 1 : 0);
})();
