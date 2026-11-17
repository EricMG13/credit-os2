// C3-032: text set at 12 px on report pages (D-30: nothing under 13 px): the readiness reasons, navigator group captions, chart labels.
const { main } = require("./lib.cjs");
main("p22-text-under-13px", async ({ page, report }) => {
  const out = {};
  for (const hash of ["overview", "modules/CP-0", "modules/CP-1", "modules/CP-6"]) {
    await page.goto("about:blank");
    await page.goto(report(hash));
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(600);
    out[hash] = await page.evaluate(() => {
      const html = [...document.querySelectorAll("main *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.offsetParent !== null && !e.closest("svg") && parseFloat(getComputedStyle(e).fontSize) < 13).map((e) => `${parseFloat(getComputedStyle(e).fontSize)}px ${e.tagName} ${e.textContent.trim().slice(0, 36)}`);
      const svg = [...document.querySelectorAll("main svg text")].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 13).length;
      return { htmlTextUnder13: html, svgTextUnder13: svg };
    });
  }
  const readiness = out["modules/CP-0"].htmlTextUnder13.filter((t) => /synthetic filing|Financing terms/.test(t));
  return { defect: readiness.length > 0 || out["modules/CP-1"].svgTextUnder13 > 0, expected: "nothing set below 13 px (D-30); a limitation is never smaller than the text around it (D-32)", readinessReasonsAt12px: readiness, detail: out };
});
