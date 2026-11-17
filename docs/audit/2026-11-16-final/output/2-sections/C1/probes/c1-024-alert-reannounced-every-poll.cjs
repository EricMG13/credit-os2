// C1-024: on the run page of a finished run whose report answers a non-404 error, RunProgress clears the error at
// the start of each 2 s poll and sets it again when the report request fails, so the role=alert element is removed
// and inserted again every cycle (a screen reader announces it again each time; the line also flickers).
"use strict";
const L = require("./lib.cjs");
const json = (o, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(o) });
const ID = "20261117-000000-78";
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const page = await L.open(context, log);
      let reportPolls = 0;
      await page.route(`**/connected/activity/${ID}`, (r) => r.fulfill(json({ id: ID, status: "finished", reason: "", issuer_name: "Alpha", as_of: "2025-03-31", pathway: "credit_snapshot", modules: [["CP-0", "done"], ["Report", "done"]], observed_at: "2026-11-17T08:00:00Z", cap: "25.00", spent: "1.00", events: [], started_at: "2026-11-17T07:00:00Z", ended_at: "2026-11-17T07:10:00Z" })));
      await page.route(`**/connected/report/${ID}`, async (r) => { reportPolls += 1; await new Promise((res) => setTimeout(res, 400)); r.fulfill(json({ error: "internal error" }, 500)); });
      await page.addInitScript(() => {
        window.__alerts = { added: 0, removed: 0 };
        const hit = (n) => n.nodeType === 1 && (n.matches?.("[role=alert]") || n.querySelector?.("[role=alert]"));
        new MutationObserver((ms) => { for (const m of ms) { m.addedNodes.forEach((n) => { if (hit(n)) window.__alerts.added += 1; }); m.removedNodes.forEach((n) => { if (hit(n)) window.__alerts.removed += 1; }); } }).observe(document, { subtree: true, childList: true });
      });
      await page.goto(`${L.BASE}/run/${ID}`);
      await page.waitForTimeout(11000);
      const alerts = await page.evaluate(() => window.__alerts);
      console.log("report polls:", reportPolls, "alert element insertions/removals:", JSON.stringify(alerts));
      L.verdict(alerts.added >= 3 && alerts.removed >= 2, "the same error alert is removed and re-inserted on every poll");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
