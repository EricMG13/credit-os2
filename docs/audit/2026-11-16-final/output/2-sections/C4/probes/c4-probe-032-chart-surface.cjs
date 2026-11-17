// C4-032: every Recharts surface on the Forecast tab is a tab stop with role=application, named only by the chart
// title, with an empty <desc>.
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
    const r = await page.evaluate(() => [...document.querySelectorAll("figure svg.recharts-surface")].map((s) => ({ figure: s.closest("figure").querySelector("h3,h4")?.textContent, role: s.getAttribute("role"), tabindex: s.getAttribute("tabindex"), title: s.querySelector("title")?.textContent, desc: s.querySelector("desc")?.textContent })));
    r.forEach((x) => console.log(JSON.stringify(x)));
    const defect = r.length > 0 && r.every((x) => x.role === "application" && x.tabindex === "0" && x.desc === "");
    console.log(defect ? `DEFECT PRESENT (${r.length} chart surfaces: tab stop, role=application, title only, empty desc)` : "no defect seen");
    process.exit(defect ? 1 : 0);
  } finally { await browser.close(); }
})();
