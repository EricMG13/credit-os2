// C5 probe: calculationNodes (report/calculations.ts) through the trace drawer, with a Calculations register injected into the intercepted snapshot.
// Cases: nested ids, a blank result (missing, not zero), a zero result, a duplicated id, a cycle, a chain deeper than 8.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  await page.route(/\/connected\/snapshot/, async (route) => {
    const response = await route.fetch(); const json = await response.json();
    const o = Object.values(json.workspace.outputs).find((x) => x.module === "CP-6");
    const secs = json.workspace.handoffs[o.sha256];
    for (const s of secs) for (const b of s.blocks) if (b.type === "text" && /^Basis: annual\.txt/m.test(b.text)) b.text = "Net debt is USD 1,125 million.\nBasis: C1; D1; E1; F1";
    const calc = secs.find((s) => s.heading === "Calculations");
    const chain = Array.from({ length: 11 }, (_, i) => ({ line: 950 + i, cells: [`G${i + 1}`, `step ${i + 1}`, "x", `${i + 1}`, i < 10 ? `G${i + 2}` : ""] }));
    calc.blocks = [{ type: "table", line: 940, headers: ["ID", "Calculation", "Inputs", "Result", "Source"], rows: [
      { line: 941, cells: ["C1", "Net debt", "Gross debt - Cash", "1125", "C2; C3"] },
      { line: 942, cells: ["C2", "Gross debt", "FY2024", "1400", "T4.4"] },
      { line: 943, cells: ["C3", "Cash", "FY2024", "", ""] },
      { line: 944, cells: ["D1", "Zero example", "x", "0", ""] },
      { line: 945, cells: ["E1", "Duplicate A", "x", "10", ""] }, { line: 946, cells: ["E1", "Duplicate B", "x", "20", ""] },
      { line: 947, cells: ["F1", "Cycle one", "x", "1", "F2"] }, { line: 948, cells: ["F2", "Cycle two", "x", "2", "F1"] },
      ...chain] }];
    return route.fulfill({ response, json });
  });
  await page.goto(`${base}/report/${run}#overview`); await page.reload(); await page.waitForTimeout(900);
  // the overview shows CP-6's key findings paragraph; find its trace button by name
  const btn = page.getByRole("button", { name: "Show sources for this passage" }).first();
  await btn.click();
  const d = page.getByRole("dialog"); await d.waitFor();
  console.log((await d.innerText()).replace(/\n+/g, " | "));
  // chain test
  await page.keyboard.press("Escape");
  console.log("(duplicate E1 and the depth-8 chain are judged from the drawer text above: an id with duplicate rows and ids beyond depth 8 are not drawn, and nothing says so)");
}).catch((e) => { console.error(e); process.exit(1); });
