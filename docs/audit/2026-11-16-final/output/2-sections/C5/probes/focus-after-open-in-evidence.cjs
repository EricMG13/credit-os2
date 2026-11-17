// C5 probe: where keyboard focus is after activating "Open in Evidence" from a drawer (the opener's page is replaced by the Evidence view).
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  const out = [];
  for (const screen of ["overview", "modules/CP-1", "forecast"]) {
    await page.goto(`${base}/report/${run}#${screen}`); await page.reload(); await page.waitForTimeout(700);
    const btn = page.locator('button[aria-label^="Show sources for"]').first();
    await btn.focus(); await page.keyboard.press("Enter");
    const d = page.getByRole("dialog"); await d.waitFor();
    await d.getByRole("link", { name: "Open in Evidence" }).focus();
    await page.keyboard.press("Enter"); await page.waitForTimeout(600);
    const a = await page.evaluate(() => { const el = document.activeElement; return { tag: el?.tagName, label: (el?.getAttribute("aria-label") || el?.textContent || "").trim().slice(0, 40), isBody: el === document.body, inMain: !!el?.closest("main") }; });
    out.push({ from: screen, url: page.url().split("#")[1].slice(0, 30), focus: a });
    await page.keyboard.press("Tab");
    out[out.length - 1].nextTab = await page.evaluate(() => (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").trim().slice(0, 40));
  }
  console.log(JSON.stringify(out, null, 1));
}).catch((e) => { console.error(e); process.exit(1); });
