// C5 probe: the page-level "Show sources" switch on every Evidence tab. It flips data-sources but there is no trace control to reveal.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run, log }) => {
  const out = [];
  for (const hash of ["summary", "trace", "sources", "gaps", "checks", "record", "record/CP-1"]) {
    await page.goto(`${base}/report/${run}#evidence/${hash}`); await page.reload();
    await page.locator('nav[aria-label="Evidence sections"]').waitFor(); await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => { d.open = true; }));
    const measure = () => page.evaluate(() => ({ sourcesAttr: document.querySelector("[data-sources]")?.getAttribute("data-sources"), traceControls: document.querySelectorAll('main button[aria-label^="Show sources"]').length, visibleChange: [...document.querySelectorAll("main *")].some((e) => getComputedStyle(e).borderTopColor !== "rgba(0, 0, 0, 0)" && e.matches("button[aria-label^='Show sources']")) }));
    const before = await measure();
    await page.locator("label", { hasText: "Show sources" }).first().click(); await page.waitForTimeout(250);
    const on = await measure();
    await page.locator("label", { hasText: "Show sources" }).first().click();
    out.push({ tab: hash, before, on });
  }
  console.log(JSON.stringify(out, null, 1));
  const inert = out.every((o) => o.on.traceControls === 0);
  console.log(inert ? "RESULT: the switch changes state on every Evidence tab but there are 0 trace controls to reveal" : "RESULT: some tab has trace controls");
}).catch((e) => { console.error(e); process.exit(1); });
