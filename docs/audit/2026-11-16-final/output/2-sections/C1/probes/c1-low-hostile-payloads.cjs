// C1-010, C1-011, C1-012: payloads outside the documented shape. Each case is supplied in the browser; the
// real service does not send them. Prints what the page shows; exit 1 when any case blanks the page or shows a
// raw parser message.
"use strict";
const L = require("./lib.cjs");
const json = (o, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(o) });
const entry = (o = {}) => ({ id: "x1", issuer: "ISS", name: "Iss", title: "Full credit assessment", date: "2025-03-31", sector: "Telecom", period: "FY2024", metrics: {}, ...o });
const live = (o) => ({ id: "20261117-000000-01", issuer_name: "Alpha", pathway: "credit_snapshot", status: "running", reason: "", submitted_by: "Eric G", started_at: "2026-11-17T07:00:00Z", name_differs: false, stalled: false, files: 2, modules: [["CP-0", "done"], ["CP-1", "running"]], ...o });
const run = (o) => ({ id: "20261117-000000-01", status: "failed", reason: "", issuer_name: "Alpha", as_of: "2025-03-31", pathway: "credit_snapshot", modules: [["CP-0", "done"]], observed_at: "2026-11-17T08:00:00Z", cap: "25.00", spent: "3.10", events: [], started_at: "2026-11-17T07:00:00Z", ended_at: "2026-11-17T07:10:00Z", ...o });
const act = (ended, runs = []) => ({ updated: "2026-11-17T08:00:00Z", held: "", unreadable: 0, runs, ended, ended_total: ended.length });
const CASES = [
  ["C1-010 entry without metrics", "/", "**/connected/library", json({ catalogue: { real: [entry({ metrics: undefined })] }, workspace: { runs: {} } })],
  ["C1-010 index without workspace", "/", "**/connected/library", json({ catalogue: { real: [entry()] } })],
  ["C1-011 ended run with unknown status", "/runs", "**/connected/activity", json(act([{ id: "20261110-000000-01", issuer_name: "B", pathway: "credit_snapshot", status: "cancelled", reason: "r", ended_at: "2026-11-16T10:00:00Z", submitted_by: "x" }]))],
  ["C1-011 module state outside the set", "/runs", "**/connected/activity", json(act([], [live({ modules: [["CP-1", "paused"]] })]))],
  ["C1-011 run event kind outside the set", "/run/20261117-000000-01", "**/connected/activity/20261117-000000-01", json(run({ events: [{ at: "2026-11-17T07:00:00Z", kind: "module_paused", module: "CP-1" }] }))],
  ["C1-012 library answer is HTML", "/", "**/connected/library", { status: 200, contentType: "text/html", body: "<html>oops</html>" }],
  ["C1-012 snapshot answer is HTML", "/report/anything", "**/connected/snapshot**", { status: 200, contentType: "text/html", body: "<html>oops</html>" }],
];
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    let defects = 0;
    try {
      for (const [label, url, pattern, reply] of CASES) {
        const { context, log } = await L.newContext(browser);
        const page = await L.open(context, log);
        await page.route(pattern, (r) => r.fulfill(reply));
        await page.goto(L.BASE + url);
        await L.settle(page, 900);
        const text = (await page.locator("body").innerText()).replace(/\n+/g, " | ");
        const crashed = /This page could not be loaded/.test(text);
        const raw = /Unexpected token|is not valid JSON/.test(text);
        if (crashed || raw) defects += 1;
        console.log(`${label}: crashed=${crashed} rawParserText=${raw} | ${text.slice(0, 140)}`);
        await context.close();
      }
      L.verdict(defects > 0, `${defects} of ${CASES.length} cases crashed the page or showed a parser message`);
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
