// C1-017 (text under 13 px), C1-020 (Report history overflows at 390/320), C1-021 (long issuer-name links, 320 px header).
"use strict";
const L = require("./lib.cjs");
const json = (o) => ({ status: 200, contentType: "application/json", body: JSON.stringify(o) });
const longName = "Very Long Issuer Holdings Intermediate Finance Luxembourg Sàrl and Subsidiaries Group";
const live = (o) => ({ id: "20261117-000000-01", issuer_name: longName, pathway: "credit_snapshot", status: "running", reason: "Waiting for a slot on the shared launcher.", submitted_by: "Eric G", started_at: "2026-11-17T07:00:00Z", name_differs: false, stalled: false, files: 2, modules: [["CP-0", "done"], ["CP-1", "running"], ["Report", "waiting"]], ...o });
const activity = { updated: "2026-11-17T08:00:00Z", held: "", unreadable: 0, runs: [live({}), live({ id: "20261117-000000-02", status: "queued", issuer_name: "Northbridge Synthetic Group" })], ended: [], ended_total: 0 };
const small = () => {
  const out = {};
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement; const t = n.textContent.trim();
    if (!t || el.closest(".sr-only")) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 13) out[`${fs}px ${t.slice(0, 26)}`] = 1;
  }
  return Object.keys(out).slice(0, 8);
};
const overflow = () => { const m = document.querySelector("main"); return { scrollWidth: m.scrollWidth, clientWidth: m.clientWidth }; };
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    const defects = [];
    try {
      {
        const { context, log } = await L.newContext(browser, { width: 1440 });
        const id = await L.ensureRun(context, log);
        const page = await L.open(context, log, `/run/${id}`);
        await L.settle(page, 900);
        console.log("run page text under 13px:", JSON.stringify(await page.evaluate(small)));
        const run = await page.evaluate(small);
        if (run.length) defects.push("text under 13 px on the run page");
        await context.close();
        for (const width of [390, 320]) {
          const c = await L.newContext(browser, { width, height: 800 });
          const p = await L.open(c.context, c.log, `/report/${id}#history`);
          await L.settle(p, 1000);
          const o = await p.evaluate(overflow);
          console.log(`history @${width}:`, JSON.stringify(o));
          if (o.scrollWidth > o.clientWidth) defects.push(`Report history scrolls sideways at ${width}`);
          await c.context.close();
          const d = await L.newContext(browser, { width, height: 800 });
          const q = await L.open(d.context, d.log);
          await q.route("**/connected/activity", (r) => r.fulfill(json(activity)));
          await q.goto(`${L.BASE}/runs`);
          await L.settle(q, 900);
          const oo = await q.evaluate(overflow);
          console.log(`runs @${width}:`, JSON.stringify(oo));
          if (oo.scrollWidth > oo.clientWidth) defects.push(`Run activity scrolls sideways at ${width}`);
          await d.context.close();
        }
      }
      L.verdict(defects.length > 0, defects.join("; "));
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
