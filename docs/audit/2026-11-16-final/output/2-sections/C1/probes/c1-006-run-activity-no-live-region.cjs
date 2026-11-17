// C1-006: Run activity (/runs) re-reads the list every 5 s and changes run state on screen, but exposes no live
// region: a screen-reader user is never told a run started, ended or failed (rubric D-43). The service answer is
// supplied in the browser: first poll one running run, later polls the same run ended as failed.
"use strict";
const L = require("./lib.cjs");
const json = (o) => ({ status: 200, contentType: "application/json", body: JSON.stringify(o) });
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const page = await L.open(context, log);
      let n = 0;
      const run = { id: "20261117-000000-01", issuer_name: "Alpha", pathway: "credit_snapshot", status: "running", reason: "", submitted_by: "Eric G", started_at: "2026-11-17T07:00:00Z", name_differs: false, stalled: false, files: 2, modules: [["CP-0", "done"], ["CP-1", "running"], ["Report", "waiting"]] };
      await page.route("**/connected/activity", (r) => { n += 1; r.fulfill(json(n < 2 ? { updated: "2026-11-17T08:00:00Z", held: "", unreadable: 0, runs: [run], ended: [], ended_total: 0 } : { updated: "2026-11-17T08:00:05Z", held: "", unreadable: 0, runs: [], ended: [{ id: run.id, issuer_name: "Alpha", pathway: "credit_snapshot", status: "failed", reason: "x", ended_at: "2026-11-17T08:00:04Z", submitted_by: "Eric G" }], ended_total: 1 })); });
      await page.goto(`${L.BASE}/runs`);
      await L.settle(page, 800);
      const live = () => page.evaluate(() => document.querySelectorAll("main [role=status],main [aria-live],main [role=alert]").length);
      const before = await live();
      const before_text = (await page.locator("main").innerText()).includes("Running");
      await page.waitForTimeout(6500);
      const after = await live();
      const changed = (await page.locator("main").innerText()).includes("Ended without a report");
      console.log(JSON.stringify({ liveRegionsWhileRunning: before, liveRegionsAfterStateChange: after, screenChanged: changed, polls: n }));
      L.verdict(before === 0 && after === 0 && changed && before_text, "the on-screen run state changed (running -> ended without a report) with no live region anywhere in main");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
