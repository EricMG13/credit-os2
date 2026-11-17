// S2 probe: trace controls per paragraph, row or figure on the Overview. Counts the controls inside each block and lists blocks with none.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/dates-no-trace.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open();
try {
  await page.goto(hash(v.url, "/library/halden-aerostructures/2026-09-30/overview"));
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const out = {};
    const byHeading = (h) => [...document.querySelectorAll("main section")].find((s) => s.querySelector(":scope > div > h2")?.textContent.trim() === h);
    const count = (els) => els.map((e) => e.querySelectorAll("button[aria-label^='Show sources']").length);
    out["Key findings"] = count([...byHeading("Key findings").querySelectorAll("ol > li")]);
    out["Dates to watch"] = count([...byHeading("Dates to watch").querySelectorAll("li")].filter((li) => li.querySelector("h3")));
    out["Headline figures"] = count([...document.querySelectorAll("section[aria-label='Headline figures'] > ul > li")]);
    out["Limitations"] = count([...document.querySelectorAll("section[aria-label=Limitations] ul > li")]);
    out["For and against points"] = count([...byHeading("For and against").querySelectorAll("ul > li")]);
    return out;
  });
  for (const [k, counts] of Object.entries(r)) console.log(k.padEnd(24), "items:", counts.length, "trace controls per item:", JSON.stringify(counts));
} finally { await browser.close(); v.cleanup(); }
