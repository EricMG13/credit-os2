// S3-007: a trace of null draws nothing, so 11 of the 13 fixture modules show a bottom line, a key finding and a
// limitation with no trace control, and capital structure's table and four tests have none either.
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  const modules = ["industry-and-competition", "financial-performance", "cash-flow-and-liquidity", "covenants-and-documentation", "management-and-governance", "peer-comparison", "rating-outlook", "environmental-social-and-governance", "forecast", "credit-snapshot", "capital-structure"];
  let bare = 0;
  for (const mod of modules) {
    const page = await newPage(browser, app.base, modulePath(mod));
    const r = await page.evaluate(() => {
      const count = (sel) => document.querySelectorAll(sel).length;
      const inBand = document.querySelector("section[aria-label='Bottom line'] button[aria-label^='Show sources']") !== null;
      const findings = [...document.querySelectorAll("ol > li")].filter((li) => !li.querySelector("button[aria-label^='Show sources']")).length;
      const lims = [...document.querySelectorAll("section[aria-label=Limitations] li")].filter((li) => !li.querySelector("button[aria-label^='Show sources']")).length;
      const tests = [...document.querySelectorAll("[role=group][aria-labelledby] li")].filter((li) => !li.closest("section[aria-label=Limitations]") && !li.querySelector("button[aria-label^='Show sources']")).filter((li) => !li.querySelector("button[aria-label^='Show sources']")).length;
      const stmt = [...document.querySelectorAll("table")].filter((t) => /Debt and leverage by year/.test(t.querySelector("caption")?.textContent ?? "") && !t.closest("section")?.querySelector("button[aria-label^='Show sources']")).length;
      return { inBand, findings, lims, tests, stmt, total: count("button[aria-label^='Show sources']") };
    });
    say(`${mod}: bottom line control ${r.inBand}; findings without control ${r.findings}; limitations without control ${r.lims}; tests without control ${r.tests}; statement without control ${r.stmt}`);
    if (!r.inBand || r.findings || r.lims || r.tests || r.stmt) bare += 1;
    await page.context().close();
  }
  if (bare > 0) defect(`${bare} of ${modules.length} module pages draw a paragraph, row or table with no trace control and no marker that no source was recorded`);
});
app.cleanup();
