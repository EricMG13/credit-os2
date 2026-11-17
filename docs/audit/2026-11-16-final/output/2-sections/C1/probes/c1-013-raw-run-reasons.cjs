// C1-013: run reasons are drawn verbatim. (1) The real service: a launcher-refused run (proof.serve refuses a second
// run of an issuer) fails with 'launcher exited 2; see logs/<run>.log'. (2) Texts the scheduler stores for a run the
// library refused (scheduler.py:517 + library_index.py Refused messages) are supplied in the browser and show a module
// code and a delivery path.
"use strict";
const L = require("./lib.cjs");
const json = (o) => ({ status: 200, contentType: "application/json", body: JSON.stringify(o) });
const REASON = "not listed: the delivery does not record CP-1's handoff (deliveries/6db777d690651e26d1fa6a9706bd571fa0f4fba908d022d6cfa87407d92b5585/view.json is missing)";
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    const defects = [];
    try {
      const { context, log } = await L.newContext(browser);
      await L.ensureRun(context, log);
      // (1) real failure: a second submission for the same issuer is refused by the synthetic launcher
      const page = await L.open(context, log);
      const failed = await L.submitSynthetic(page, { agreement: true });
      const end = await L.waitForEnd(page);
      await page.waitForTimeout(1500);
      const alert = await page.locator("main [role=alert]").first().innerText().catch(() => "");
      console.log(`real run ${failed} ended ${end}; alert: ${JSON.stringify(alert)}`);
      if (/launcher exited \d+|logs\//.test(alert)) defects.push("launcher exit code and log path drawn on the run page");
      await L.shot(page, "c1-013-failed-run");
      // (2) library-refusal reason on both screens
      const id = "20261117-000000-33";
      const p2 = await L.open(context, log);
      await p2.route("**/connected/activity", (r) => r.fulfill(json({ updated: "2026-11-17T08:00:00Z", held: "", unreadable: 0, runs: [], ended: [{ id, issuer_name: "Alpha", pathway: "credit_snapshot", status: "failed", reason: REASON, ended_at: "2026-11-17T07:10:00Z", submitted_by: "Eric G" }], ended_total: 1 })));
      await p2.goto(`${L.BASE}/runs`);
      await L.settle(p2, 900);
      const table = await p2.locator("main").innerText();
      console.log("Run activity shows 'CP-1':", /CP-1\b/.test(table), "| shows delivery path:", /deliveries\//.test(table));
      if (/CP-1\b/.test(table)) defects.push("module code CP-1 on Run activity");
      const p3 = await L.open(context, log);
      await p3.route(`**/connected/activity/${id}`, (r) => r.fulfill(json({ id, status: "failed", reason: REASON, issuer_name: "Alpha", as_of: "2025-03-31", pathway: "credit_snapshot", modules: [["CP-0", "done"], ["Report", "waiting"]], observed_at: "2026-11-17T08:00:00Z", cap: "25.00", spent: "1.00", events: [], started_at: "2026-11-17T07:00:00Z", ended_at: "2026-11-17T07:10:00Z" })));
      await p3.goto(`${L.BASE}/run/${id}`);
      await L.settle(p3, 900);
      const text = await p3.locator("main").innerText();
      console.log("run page shows 'CP-1':", /CP-1\b/.test(text), "| shows delivery path:", /deliveries\//.test(text));
      if (/CP-1\b/.test(text)) defects.push("module code CP-1 on the run page");
      L.verdict(defects.length > 0, defects.join("; "));
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
