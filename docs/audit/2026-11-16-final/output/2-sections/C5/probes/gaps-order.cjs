// C5 probe: the Gaps tab lists gaps in handoff order; it is not grouped by stated severity (content-matrix CM-075).
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  await page.route(/\/connected\/snapshot/, async (route) => {
    const response = await route.fetch(); const json = await response.json();
    const o = Object.values(json.workspace.outputs).find((x) => x.module === "CP-2D");
    const gaps = json.workspace.handoffs[o.sha256].find((s) => s.heading === "Gaps");
    gaps.blocks = [{ type: "table", line: 900, headers: ["Gap", "Severity", "Detail"], rows: [
      { line: 902, cells: ["Low one", "Low", "a"] }, { line: 903, cells: ["High one", "High", "b"] }, { line: 904, cells: ["Medium one", "Medium", "c"] }, { line: 905, cells: ["Low two", "Low", "d"] }, { line: 906, cells: ["High two", "High", "e"] }] }];
    return route.fulfill({ response, json });
  });
  await page.goto(`${base}/report/${run}#evidence/gaps`); await page.reload(); await page.waitForTimeout(900);
  const rows = await page.locator("main table tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.children].slice(0, 3).map((c) => c.textContent.trim().replace(/\s+/g, " "))));
  console.log(JSON.stringify(rows));
  console.log("severity groups or headings on the page:", await page.locator("main h4, main [role=group]").count());
}).catch((e) => { console.error(e); process.exit(1); });
