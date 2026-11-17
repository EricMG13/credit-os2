// P25: the "No action needed (N)" disclosure on the review sheet (reached with the executed agreement chosen): mouse and
// keyboard toggle, its text, and whether the Limits section and the approval count agree. JSON out.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p25-no-action-needed.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    // a new issuer has no earlier run, which is when the sheet carries a passive (no action needed) item
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page, { issuer: `Fresh Issuer ${Date.now() % 100000} Ltd` });
    await L.addFiles(page, ["filing", "workbook", "agreement"]);
    await L.toPurpose(page); await L.toContext(page);
    await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
    await L.toReview(page);
    const sum = page.locator("summary", { hasText: "No action needed" });
    out.count = await sum.count();
    out.label = await sum.innerText();
    await sum.click();
    out.openAfterClick = await sum.evaluate((e) => e.parentElement.open);
    out.text = await sum.evaluate((e) => e.parentElement.innerText);
    await sum.focus(); await page.keyboard.press("Enter");
    out.openAfterEnter = await sum.evaluate((e) => e.parentElement.open);
    await page.keyboard.press("Space");
    out.openAfterSpace = await sum.evaluate((e) => e.parentElement.open);
    out.limitCards = await page.getByRole("region", { name: "Limits to decide" }).locator("li").count();
    out.decidedLabel = await page.getByText(/of \d+ decided/).innerText();
  } catch (e) { out.error = String(e).slice(0, 500); } finally { await browser.close(); }
  console.log(JSON.stringify(out, null, 1));
})();
