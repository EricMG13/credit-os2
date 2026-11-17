// C5 probe: every Forecast figure opens a drawer with the same statement and no per-figure derivation; Open in Evidence lands on a raw JSON dump.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  await page.goto(`${base}/report/${run}#forecast`); await page.reload(); await page.waitForTimeout(900);
  const sel = 'button[aria-label^="Show sources for"]';
  const n = await page.locator(sel).count();
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    const b = page.locator(sel).nth(i);
    await b.evaluate((el) => { for (let d = el.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true; });
    await b.scrollIntoViewIfNeeded(); await b.click();
    const d = page.getByRole("dialog"); await d.waitFor();
    const statement = (await d.locator("p.text-body").first().innerText()).trim();
    const heading = await d.locator("h2").first().innerText();
    const sub = await d.locator("header p").first().innerText();
    rows.push({ control: await b.getAttribute("aria-label"), heading, sub, statement });
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  }
  const forecastInputs = rows.filter((r) => r.heading.startsWith("Forecast inputs"));
  console.log(JSON.stringify(forecastInputs.map((r) => [r.control, r.sub, r.statement]), null, 1));
  console.log(`RESULT: ${forecastInputs.length} of ${n} Forecast controls open the drawer "${forecastInputs[0]?.heading}" at ${forecastInputs[0]?.sub} with ${new Set(forecastInputs.map((r) => r.statement)).size} distinct statement(s)`);
}).catch((e) => { console.error(e); process.exit(1); });
