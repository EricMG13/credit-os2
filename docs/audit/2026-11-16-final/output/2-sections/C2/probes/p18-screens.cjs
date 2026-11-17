// P18: tall-viewport screenshots of each Start step at 1440 and 390 px (the page scrolls inside its own container, so a
// tall window is the way to see all of it). Writes to C2_SCRATCH (default /tmp/cs-C2/scratch); the ones cited by a finding
// are copied to evidence/.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p18-screens.cjs
"use strict";
const L = require("./lib.cjs");
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    for (const [width, height] of [[1440, 2600], [390, 5200]]) {
      const ctx = await L.context(browser, { log, width, height });
      const page = await ctx.newPage();
      L.watch(page, log);
      await page.goto(`${L.BASE}/start`);
      await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
      await L.shot(page, `screen-1-documents-empty-${width}`);
      await L.fillIdentity(page); await L.addFiles(page, ["filing", "workbook", "agreement"]);
      await page.getByRole("button", { name: "Inspect documents" }).click();
      await page.waitForTimeout(1200);
      await L.shot(page, `screen-1-documents-inspected-${width}`);
      await L.toPurpose(page);
      await L.shot(page, `screen-2-purpose-${width}`);
      await page.getByRole("combobox", { name: /Run form level/ }).selectOption("advanced");
      await L.toContext(page);
      await L.shot(page, `screen-3-context-advanced-${width}`);
      for (const t of ["Issuer details", "Valuation and peers", "Module options", "Scenario assumptions"]) await page.locator("summary", { hasText: t }).click();
      for (const b of ["Add facility", "Add quote", "Add rating", "Add research question"]) await page.getByRole("button", { name: b, exact: true }).click();
      await L.shot(page, `screen-3-context-advanced-open-${width}`);
      for (const r of ["Remove Facility 1", "Remove Quote 1", "Remove Rating 1", "Remove Question 1"]) await page.getByRole("button", { name: r, exact: true }).click();
      await page.getByRole("combobox", { name: "Legal documents" }).selectOption("executed");
      await page.getByRole("combobox", { name: "The agreement" }).selectOption({ label: "northbridge-credit-agreement.txt" });
      await L.toReview(page);
      await L.shot(page, `screen-4-review-${width}`);
      await L.decideAndApprove(page);
      await page.getByRole("button", { name: "Submit run", exact: true }).click();
      await page.getByRole("dialog").waitFor();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${L.SCRATCH}/screen-5-dialog-${width}.png` });
      await ctx.close();
    }
  } catch (e) { out.error = String(e).slice(0, 500); } finally { await browser.close(); }
  console.log(JSON.stringify(out));
})();
