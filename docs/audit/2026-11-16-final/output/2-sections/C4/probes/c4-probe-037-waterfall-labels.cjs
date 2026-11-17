// C4-037: at 390 px the EBITDA bridge's x-axis labels touch or overlap.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-037-waterfall-labels.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log, { width: 390, height: 844 });
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const r = await page.getByRole("figure", { name: "EBITDA bridge" }).evaluate((f) => {
      const texts = [...f.querySelectorAll("svg text")].filter((t) => /EBITDA|Restructuring|Disposal/.test(t.textContent));
      // group tspans per label (a label is one <text> with wrapped tspans)
      const boxes = texts.map((t) => { const b = t.getBoundingClientRect(); return { text: t.textContent.slice(0, 30), left: Math.round(b.left), right: Math.round(b.right) }; }).sort((a, b) => a.left - b.left);
      const gaps = boxes.slice(1).map((b, i) => b.left - boxes[i].right);
      return { boxes, gaps };
    });
    console.log(JSON.stringify(r));
    const defect = r.gaps.some((g) => g < 2);
    console.log(defect ? "DEFECT PRESENT (adjacent axis labels touch or overlap)" : "no defect seen");
    process.exitCode = defect ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
