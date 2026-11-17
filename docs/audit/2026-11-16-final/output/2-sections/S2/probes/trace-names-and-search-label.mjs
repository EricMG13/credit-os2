// S2 probe: accessible names of the trace controls on the Overview (how many share one name) and of the search field (D-37).
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/trace-names-and-search-label.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open();
try {
  await page.goto(hash(v.url, "/library/halden-aerostructures/2026-09-30/overview"));
  await page.waitForTimeout(400);
  const names = await page.$$eval("button[aria-label^='Show sources']", (bs) => bs.map((b) => b.getAttribute("aria-label")));
  const counts = {};
  for (const n of names) counts[n] = (counts[n] ?? 0) + 1;
  console.log("trace control names on the Overview:", JSON.stringify(counts));
  const rest = await page.$$eval("button[aria-label^='Show sources']", (bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)} icon opacity ${getComputedStyle(b.querySelector("svg")).opacity}`; }));
  console.log("at rest (no hover, no focus, Show sources off):", rest.length, "controls drawn;", [...new Set(rest)].join("; "));
  await page.goto(hash(v.url, "/library/home"));
  await page.waitForTimeout(400);
  const s = await page.getByRole("textbox", { name: "Search issuers" }).evaluate((e) => ({ placeholder: e.placeholder, ariaLabel: e.getAttribute("aria-label"), visibleLabelElements: e.labels?.length ?? 0, precededByVisibleText: !!e.closest("div")?.parentElement?.querySelector("label") }));
  console.log("search field:", JSON.stringify(s));
} finally { await browser.close(); v.cleanup(); }
