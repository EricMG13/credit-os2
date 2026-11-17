// C5 probe: the "Comparison measures" table on Evidence > Trace, reached by giving the run an earlier run in the intercepted snapshot
// (the synthetic service can only produce a first run). Checks value, period, unit and difference against the numbers injected.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run, log }) => {
  await page.route(/\/connected\/snapshot/, async (route) => {
    const response = await route.fetch(); const json = await response.json();
    const r = Object.values(json.workspace.runs)[0];
    json.workspace.runs["20240401-000000-01"] = { ...JSON.parse(JSON.stringify(r)), folder: "20240401-000000-01", run: "20240401-000000-01", asOf: "2024-03-31", changes: null, modules: {} };
    r.changes = { lead: "CP-8", first_run: false, note: null, problem: null, verdicts: { measures: { leverage: { kind: "comparable", label: "Comparable", reason: "Same period basis" } } },
      pack: { prior: { run: "20240401-000000-01", as_of: "2024-03-31", pathway: "credit_snapshot" }, current: { as_of: "2025-03-31", pathway: "credit_snapshot" },
        measures: [
          { key: "leverage", label: "Net leverage", prior: { value: "3.00", unit: "x", period: "FY2023" }, current: { value: "2.25", unit: "x", period: "FY2024" }, unit: "x", same_period: false, comparable: "yes" },
          { key: "cash", label: "Cash", prior: { value: "0", unit: "US$m", period: "FY2023" }, current: { value: null, unit: "US$m", period: "FY2024" }, unit: "US$m", same_period: false, comparable: "yes" },
          { key: "rev", label: "Revenue", prior: { value: "2,000", unit: "US$m", period: "FY2023" }, current: { value: "2,250", unit: "US$m", period: "FY2024" }, unit: "US$m", same_period: false, comparable: "yes" },
          { key: "mixed", label: "Mixed units", prior: { value: "5", unit: "x", period: "FY2023" }, current: { value: "5", unit: "%", period: "FY2024" }, unit: "x", same_period: false, comparable: "yes" },
        ] } };
    return route.fulfill({ response, json });
  });
  const out = {};
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/report/${run}#evidence/trace`); await page.reload(); await page.waitForTimeout(900);
    out[width] = await page.evaluate(() => {
      const h = [...document.querySelectorAll("main h3")].find((e) => e.textContent.includes("Comparison measures"));
      const t = h?.parentElement.querySelector("table");
      return { present: !!h, rows: t ? [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim())) : null, cardWidth: (() => { const c = h?.parentElement; return c ? Math.round(c.getBoundingClientRect().width) : null; })(), wrapperScrolls: (() => { const w = t?.parentElement; return w ? w.scrollWidth > w.clientWidth : null; })(), viewport: innerWidth, docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, mainOverflow: document.querySelector("main").scrollWidth > document.querySelector("main").clientWidth };
    });
  }
  await page.setViewportSize({ width: 390, height: 900 }); await page.goto(`${base}/report/${run}#evidence/trace`); await page.reload(); await page.waitForTimeout(700); await page.screenshot({ path: (process.env.C5_SHOTS || "/tmp/cs-C5/scratch") + "/comparison-390.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}/report/${run}#evidence/trace/CP-8`); await page.reload(); await page.waitForTimeout(600);
  out.cp8Filter = (await page.locator("main").innerText()).includes("Comparison measures");
  await page.goto(`${base}/report/${run}#evidence/trace/CP-1`); await page.reload(); await page.waitForTimeout(600);
  out.cp1FilterHidesComparison = !(await page.locator("main").innerText()).includes("Comparison measures");
  console.log(JSON.stringify(out, null, 1));
}).catch((e) => { console.error(e); process.exit(1); });
