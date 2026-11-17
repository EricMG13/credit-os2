// C4-004: the Debt stack, drawn with a missing balance, has coloured segments and a plain list with no key.
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const fig = page.getByRole("figure", { name: "Debt stack" });
    const r = await fig.evaluate((f) => {
      const segs = [...f.querySelectorAll("[role=img]")].map((s) => ({ label: s.getAttribute("aria-label"), color: getComputedStyle(s).backgroundColor, tabindex: s.getAttribute("tabindex") }));
      const rows = [...f.querySelectorAll("li")].map((li) => ({ text: li.textContent, swatch: !!li.querySelector("i,[style*='background'],span[class*='bg-']:empty") }));
      return { segs, rows, hasLegend: !!f.querySelector("[aria-label*='egend'], ul[class*='legend']") };
    });
    console.log(JSON.stringify(r));
    const defect = r.segs.length >= 2 && r.rows.every((row) => !row.swatch) && !r.hasLegend;
    console.log(defect ? "DEFECT PRESENT (segments are colour-only; the list rows carry no swatch)" : "no defect seen");
    await fig.screenshot({ path: "/tmp/cs-C4/scratch/debt-stack-probe.png" });
    process.exit(defect ? 1 : 0);
  } finally { await browser.close(); }
})();
