// S2 probe: what the Changes page keeps when the presentation is switched from Cards to Table.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/changes-table-columns.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { makeVariant, open, hash } from "./harness.mjs";
const lib = JSON.parse(readFileSync(path.join(process.cwd(), "web", "fixtures", "library.json"), "utf8")).slice;
const run = lib.issuers.find((i) => i.id === "halden-aerostructures").runs.find((r) => r.id === "2026-09-30");
const v = makeVariant();
const { browser, page } = await open();
try {
  await page.goto(hash(v.url, "/library/halden-aerostructures/2026-09-30/changes"));
  await page.waitForTimeout(400);
  const cards = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  await page.getByRole("radio", { name: "Table" }).click();
  await page.waitForTimeout(300);
  const table = (await page.locator("main table").innerText()).replace(/\s+/g, " ");
  console.log("table columns:", JSON.stringify(await page.getByRole("columnheader").allTextContents()));
  for (const f of ["kind", "change", "cause", "effect"]) {
    const inCards = run.changes.changes.filter((c) => c[f] && cards.includes(c[f])).length;
    const inTable = run.changes.changes.filter((c) => c[f] && table.includes(c[f])).length;
    console.log(`${f.padEnd(7)} drawn on Cards for ${inCards} of ${run.changes.changes.length} changes; in the Table for ${inTable}`);
  }
} finally { await browser.close(); v.cleanup(); }
