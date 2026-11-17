// C3-029: on a module page the charts and figure tiles come before Key findings, Contrary evidence and Limitations (CM-002, CM-005).
const { main } = require("./lib.cjs");
main("p19-module-reading-order", async ({ page, report }) => {
  const out = {};
  for (const mod of ["CP-2A", "CP-2E", "CP-2D", "CP-4"]) {
    await page.goto("about:blank");
    await page.goto(report(`modules/${mod}`));
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(600);
    out[mod] = await page.evaluate(() => {
      const hs = [...document.querySelectorAll("main h2, main h3, main h4")].map((h) => ({ text: h.textContent.trim().slice(0, 40), top: Math.round(h.getBoundingClientRect().top + document.querySelector("main").scrollTop) }));
      const kf = hs.find((h) => h.text === "Key findings");
      const firstChart = document.querySelector("#module-figures");
      const chartTop = firstChart ? Math.round(firstChart.getBoundingClientRect().top + document.querySelector("main").scrollTop) : null;
      const chartHeight = firstChart ? Math.round(firstChart.getBoundingClientRect().height) : null;
      return { keyFindingsTop: kf && kf.top, figuresTop: chartTop, figuresHeight: chartHeight };
    });
  }
  const before = Object.values(out).filter((v) => v.figuresHeight && v.keyFindingsTop > v.figuresTop).length;
  return { defect: before > 0, expected: "Bottom line, Key findings, Contrary evidence, Limitations, then typed records, figures and tables (CM-005)", figuresBeforeKeyFindings: before, detail: out };
});
