// C1-031: when one poll of /connected/activity fails, Run activity replaces the whole list and the counts with an
// empty-state panel (magnifier icon, neutral tone, no alert role) until the next poll 5 s later.
// Answers are supplied in the browser: poll 1 one running run, poll 2 a 500, poll 3 the run again.
"use strict";
const L = require("./lib.cjs");
const json = (o, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(o) });
const run = { id: "20261117-000000-01", issuer_name: "Alpha", pathway: "credit_snapshot", status: "running", reason: "", submitted_by: "Eric G", started_at: "2026-11-17T07:00:00Z", name_differs: false, stalled: false, files: 2, modules: [["CP-0", "done"], ["CP-1", "running"], ["Report", "waiting"]] };
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const page = await L.open(context, log);
      let n = 0;
      await page.route("**/connected/activity", (r) => {
        n += 1;
        if (n === 2) return r.fulfill(json({ error: "boom" }, 500));
        return r.fulfill(json({ updated: "2026-11-17T08:00:00Z", held: "", unreadable: 0, runs: [run], ended: [], ended_total: 0 }));
      });
      await page.goto(`${L.BASE}/runs`);
      await L.settle(page, 800);
      const before = await page.locator("main").innerText();
      await page.waitForTimeout(5600);
      const during = await page.evaluate(() => ({ text: document.querySelector("main").innerText.replace(/\n+/g, " | "), alerts: document.querySelectorAll("main [role=alert],main [role=status]").length, icon: document.querySelectorAll("main svg").length }));
      await L.shot(page, "c1-031-read-failure");
      await page.waitForTimeout(5000);
      const after = await page.locator("main").innerText();
      console.log(JSON.stringify({ listBefore: /Alpha/.test(before), duringFailure: during, listAfterNextPoll: /Alpha/.test(after), polls: n }));
      const defect = /Alpha/.test(before) && /could not be read/.test(during.text) && !/Alpha/.test(during.text) && during.alerts === 0;
      L.verdict(defect, "one failed poll hides every run and the counts behind a neutral empty-state panel with no alert role");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
