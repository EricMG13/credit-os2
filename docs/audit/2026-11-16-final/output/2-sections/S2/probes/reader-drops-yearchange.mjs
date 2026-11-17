// S2 probe: delivered year-on-year and tone fields are accepted by the static reader and silently not drawn.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/reader-drops-yearchange.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant((l) => {
  const r = l.slice.issuers.find((i) => i.id === "halden-aerostructures").runs.find((x) => x.id === "2026-09-30");
  r.overview.metrics[2].yearChange = { key: "net_leverage", change: "-0.3", unit: "x", prior: "4.9x at 30 Jun 2026" };
  r.changes.changes[0].tone = "better";
});
const { browser, page, consoleLines } = await open();
try {
  await page.goto(hash(v.url, "/library/halden-aerostructures/2026-09-30/overview"));
  await page.waitForTimeout(400);
  const o = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  await page.goto(hash(v.url, "/library/halden-aerostructures/2026-09-30/changes"));
  await page.waitForTimeout(400);
  const c = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  console.log("slice accepted (no error text):", !/could not be read/.test(o + c));
  console.log("year-on-year '-0.3' / '4.9x at 30 Jun 2026' drawn on the Overview tile:", /-0\.3\b/.test(o) || o.includes("4.9x at 30 Jun 2026"));
  console.log("word 'better' drawn on the Changes card:", /\bbetter\b/i.test(c));
  console.log("console messages:", consoleLines.length);
} finally { await browser.close(); v.cleanup(); }
