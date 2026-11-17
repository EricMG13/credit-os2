// C1-003: Run activity's Waiting and Ended tables sit in an overflow-hidden panel; columns that do not fit are
// cut off and cannot be scrolled to (Waiting: Pathway at 1280-1440 px with Running beside it; Ended: Ended and
// Reason at 768 px, everything but Issuer at 390 px). The service answer is supplied in the browser.
"use strict";
const L = require("./lib.cjs");
const json = (o) => ({ status: 200, contentType: "application/json", body: JSON.stringify(o) });
const live = (o) => ({ id: "20261117-000000-01", issuer_name: "Northbridge Synthetic Group", pathway: "credit_snapshot", status: "running", reason: "", submitted_by: "Eric G", started_at: "2026-11-17T07:00:00Z", name_differs: false, stalled: false, files: 2, modules: [["CP-0", "done"], ["CP-1", "running"], ["CP-2", "waiting"], ["Report", "waiting"]], ...o });
const names = ["Northbridge Synthetic Group", "Telecom Italia Capital S.A. and subsidiaries", "Vodafone Group Plc", "International Consolidated Airlines Group, S.A."];
const activity = {
  updated: "2026-11-17T08:00:00Z", held: "", unreadable: 0,
  runs: [live({}), ...names.map((n, i) => live({ id: `20261117-000000-1${i}`, status: "queued", issuer_name: n, pathway: "deep_credit_assessment", modules: [], started_at: "" }))],
  ended: names.map((n, i) => ({ id: `20261110-000000-0${i}`, issuer_name: n, pathway: "deep_credit_assessment", status: ["failed", "capped", "rejected", "interrupted"][i], reason: "The agreement could not be read, so no module ran and no cost was recorded for this attempt.", ended_at: "2026-11-16T10:00:00Z", submitted_by: "Eric G" })),
  ended_total: 4,
};
const measure = () => {
  const out = {};
  for (const label of ["Waiting runs", "Runs that ended without a report"]) {
    const table = document.querySelector(`table[aria-label="${label}"]`);
    const wrap = table?.closest("div.overflow-hidden");
    if (!table || !wrap) { out[label] = null; continue; }
    const w = wrap.getBoundingClientRect();
    const clipped = [...table.querySelectorAll("th")].filter((th) => { const r = th.getBoundingClientRect(); return r.right > w.right + 1; }).map((th) => th.innerText.trim());
    out[label] = { overflowX: getComputedStyle(wrap).overflowX, panelWidth: Math.round(w.width), tableWidth: Math.round(table.getBoundingClientRect().width), clippedColumns: clipped };
  }
  return out;
};
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    let defect = false;
    try {
      for (const width of [1440, 1280, 768, 390]) {
        const { context, log } = await L.newContext(browser, { width, height: 900 });
        const page = await L.open(context, log);
        await page.route("**/connected/activity", (r) => r.fulfill(json(activity)));
        await page.goto(`${L.BASE}/runs`);
        await L.settle(page, 900);
        const m = await page.evaluate(measure);
        console.log(width, JSON.stringify(m));
        for (const v of Object.values(m)) if (v && v.clippedColumns.length) defect = true;
        if (width === 1440 || width === 390) { await page.evaluate(() => document.querySelector("main").scrollTo(0, 99999)); await L.shot(page, `c1-003-run-activity-${width}`); }
        await context.close();
      }
      L.verdict(defect, "table columns are cut off inside overflow-hidden panels (clippedColumns not empty)");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
