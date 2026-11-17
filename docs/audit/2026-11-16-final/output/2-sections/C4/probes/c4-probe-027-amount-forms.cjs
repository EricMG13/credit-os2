// C4-027 (Low): chart amounts accept only an ASCII hyphen-minus and comma-thousands; a negative written with
// U+2212 or in parentheses, a space or no-break space as thousands separator, or a unit suffix removes the chart.
// C4-028 (Medium, hostile-input): "3,75" is read as 375 and plotted at 375 beside "2.80".
// Data are rewritten in the browser (snapshot interception); the service and the application are not changed.
"use strict";
const lib = require("./c4-lib.cjs");
const MINUS = "−";
const variants = {
  "C4-027 EBITDA bridge, step written with U+2212": { module: "CP-1", first: "Step", fn: (r) => { r[2].cells[1] = `${MINUS}10`; }, title: "EBITDA bridge" },
  "C4-027 EBITDA bridge, step written (10)": { module: "CP-1", first: "Step", fn: (r) => { r[2].cells[1] = "(10)"; }, title: "EBITDA bridge" },
  "C4-027 Liquidity bridge, step with U+2212": { module: "CP-2D", first: "Step", fn: (r) => { r[2].cells[1] = `${MINUS}450`; }, title: "Liquidity bridge" },
  "C4-027 Revenue, '2 100' with a space": { module: "CP-1", first: "Period", fn: (r) => { r[0].cells[1] = "2 100"; }, title: "Revenue and EBITDA", pick: (h) => h[1] === "Revenue" },
  "C4-027 Revenue, '2,100m' with a suffix": { module: "CP-1", first: "Period", fn: (r) => { r[0].cells[1] = "2,100m"; }, title: "Revenue and EBITDA", pick: (h) => h[1] === "Revenue" },
  "C4-028 Leverage, '3,75' (decimal comma)": { module: "CP-1", first: "Period", fn: (r) => { r[0].cells[1] = "3,75"; }, title: "Leverage", pick: (h) => h[1] === "Total debt / EBITDA", scale: true },
};
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  let defects = 0;
  try {
    for (const [name, v] of Object.entries(variants)) {
      const ctx = await lib.newContext(browser, log, { width: 1440, height: 900 });
      const page = await ctx.newPage();
      await page.route("**/connected/snapshot*", async (route) => {
        const r = await route.fetch();
        const b = await r.json();
        const o = Object.values(b.workspace.outputs).find((x) => x.module === v.module);
        const tables = b.workspace.handoffs[o.sha256].flatMap((s) => s.blocks).filter((bl) => bl.type === "table" && bl.headers[0] === v.first);
        v.fn((v.pick ? tables.find((x) => v.pick(x.headers)) : tables[0]).rows);
        return route.fulfill({ response: r, json: b });
      });
      await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(800);
      const all = await page.locator("main").innerText();
      const i = all.indexOf(v.title);
      const seg = all.slice(i, i + 700);
      let bad;
      if (v.scale) {
        const ticks = await page.getByRole("figure", { name: v.title }).evaluate((f) => [...f.querySelectorAll("svg text")].map((t) => Number(t.textContent.replace(/,/g, ""))).filter((n) => Number.isFinite(n)));
        bad = Math.max(...ticks) >= 100;
        console.log(`${name}: axis and label numbers ${JSON.stringify(ticks)} (published values are at most 3.75) -> ${bad ? "DEFECT: bar drawn at 375" : "ok"}`);
      } else {
        bad = /Source table available\. The chart could not be drawn on a common basis\./.test(seg);
        console.log(`${name}: ${bad ? "chart replaced by the sentence and the table" : "chart drawn"}`);
      }
      if (bad) defects += 1;
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await ctx.close();
    }
    console.log(defects ? `DEFECT PRESENT (${defects} of ${Object.keys(variants).length})` : "no defect seen");
    process.exit(defects ? 1 : 0);
  } finally { await browser.close(); }
})();
