// C3-024: Overview draws no key charts (ruling decision 3, H5.4, CM-042) although the run holds data for catalogue rows that name Overview.
// C3-025: the Modules navigator has no search at its top (ruling decision 5, CM-028, CT-044).
const { main } = require("./lib.cjs");
main("p15-overview-key-charts-and-module-search", async ({ page, report }) => {
  const out = {};
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page.waitForTimeout(600);
  out.overview = await page.evaluate(() => ({ svgCharts: document.querySelectorAll("main svg.recharts-surface, main figure, main [role=img]").length, chartTitles: [...document.querySelectorAll("main h2, main h3")].map((h) => h.textContent.trim()).filter((t) => /chart|trend|leverage|maturit|transmission|readiness|calendar/i.test(t)), chartIndexLink: [...document.querySelectorAll("main a")].some((a) => /chart index/i.test(a.textContent)) }));
  await page.goto("about:blank");
  await page.goto(report("modules/CP-2"));
  await page.getByRole("heading", { name: "Fundamental credit", exact: true }).waitFor();
  await page.waitForTimeout(600);
  out.cp2Owns = await page.evaluate(() => [...document.querySelectorAll("main h2, main h3")].map((h) => h.textContent.trim()).filter((t) => /transmission|Monitoring/i.test(t)));
  out.navigator = await page.evaluate(() => { const aside = document.querySelector("aside:not(.order-last)"); return { inputs: aside.querySelectorAll("input, [role=search], [role=searchbox], [type=search]").length, firstControls: [...aside.querySelectorAll("a, button")].slice(0, 3).map((e) => e.textContent.trim()) }; });
  return { defect: out.overview.svgCharts === 0 || out.navigator.inputs === 0, expected: "Overview repeats the key charts the run has data for, with a link to the chart index; the navigator has search at its top", detail: out };
});
