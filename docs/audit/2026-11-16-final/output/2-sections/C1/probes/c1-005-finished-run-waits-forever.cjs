// C1-005: a run page for a finished run whose report is never published polls /connected/report/<id> every 2 s
// for ever and keeps saying "Waiting for the report to become available…" (no limit, no explanation, no way out).
"use strict";
const L = require("./lib.cjs");
const json = (o, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(o) });
const ID = "20261117-000000-77";
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const page = await L.open(context, log);
      let polls = 0;
      await page.route(`**/connected/activity/${ID}`, (r) => r.fulfill(json({ id: ID, status: "finished", reason: "", issuer_name: "Alpha", as_of: "2025-03-31", pathway: "credit_snapshot", modules: [["CP-0", "done"], ["Report", "done"]], observed_at: "2026-11-17T08:00:00Z", cap: "25.00", spent: "1.00", events: [], started_at: "2026-11-17T07:00:00Z", ended_at: "2026-11-17T07:10:00Z" })));
      await page.route(`**/connected/report/${ID}`, (r) => { polls += 1; r.fulfill(json({ error: "unknown report" }, 404)); });
      await page.goto(`${L.BASE}/run/${ID}`);
      await L.settle(page, 800);
      await page.waitForTimeout(12000);
      const status = await page.locator("main").evaluate((el) => ({ waiting: /Waiting for the report to become available/.test(el.innerText), alerts: el.querySelectorAll("[role=alert]").length, openReport: [...el.querySelectorAll("a")].some((a) => /Open report/.test(a.innerText)) }));
      console.log("report polls in about 13 s:", polls, JSON.stringify(status));
      await L.shot(page, "c1-005-finished-no-report");
      L.verdict(polls >= 5 && status.waiting && status.alerts === 0 && !status.openReport, "page keeps polling every 2 s and says 'Waiting…' with no time limit, no explanation and no action");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
