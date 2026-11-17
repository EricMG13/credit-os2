// C4-001: module codes, "Python", "handoff" and "Sent back by the build" appear in reader text on the Forecast tab
// and in its gap reasons. One plain command from the repository root; it starts and stops its own proof.serve
// and completes its own synthetic run (c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-001-codes-in-text.cjs
// Exit code 1 and "DEFECT PRESENT" while the defect exists.
"use strict";
const lib = require("./c4-lib.cjs");
const states = require("./c4-states.cjs");
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
    await ctx.close();
    // states reached by rewriting the snapshot in the browser (the service is unchanged)
    const gap = await states.run(browser, log, { state: "chart-gap", chars: 20000 });
    const g = /Not established: see Filing p\.12[^|]*/.exec(gap);
    if (g) { console.log("CHART GAP TEXT:", g[0]); found += 1; }
    const other = await states.run(browser, log, { state: "other-grid", chars: 40000 });
    const head = /Other forecast cases \| Line item\s+Downside \(CP-2G drivers\)/.exec(other);
    if (head) { console.log("OTHER GRID HEADER:", head[0]); found += 1; }
    const sent = await states.run(browser, log, { state: "sent-back", chars: 40000 });
    if (/Sent back by the build\./.test(sent)) { console.log("SENT BACK TEXT: Sent back by the build."); found += 1; }
    console.log(found ? `DEFECT PRESENT (${found} lines)` : "no defect seen");
    process.exitCode = found ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
