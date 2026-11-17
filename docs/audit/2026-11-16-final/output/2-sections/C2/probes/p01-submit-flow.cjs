// P01: the whole synthetic flow Documents -> Purpose -> Context -> Review -> Submit dialog -> run page.
// Checks the dialog (title, spend sentence, Cancel, Escape, outside click, focus return) before choosing
// "Start synthetic run" (synthetic, USD 0.00, proof.serve). Prints a JSON result.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p01-submit-flow.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");

(async () => {
  const log = L.newLog();
  const out = { checks: {} };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page);
    await L.addFiles(page, ["filing", "workbook", "agreement"]);
    await L.shot(page, "p01-1-docs");
    await L.toPurpose(page);
    await L.toContext(page);
    await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
    await L.toReview(page);
    await L.shot(page, "p01-4-review-undecided");
    const submit = page.getByRole("button", { name: /^Submit/ });
    out.checks.submitDisabledBeforeApproval = await submit.isDisabled();
    out.checks.blockerText = await page.locator("#run-submit-blocker").innerText().catch(() => null);
    await L.decideAndApprove(page);
    out.checks.submitEnabledAfterApproval = !(await submit.isDisabled());
    out.checks.costText = await page.locator("#run-submit-cost").innerText();
    // Dialog: open, read, Cancel -> focus
    await submit.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    out.checks.dialogTitle = await dialog.getByRole("heading").innerText();
    out.checks.dialogText = await dialog.locator("p").innerText();
    out.checks.dialogButtons = await dialog.getByRole("button").allInnerTexts();
    await L.shot(page, "p01-5-dialog");
    out.checks.focusInsideDialogOnOpen = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    out.checks.focusAfterEscape = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40));
    await submit.click();
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await dialog.waitFor({ state: "detached" });
    out.checks.focusAfterCancel = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40));
    await submit.click();
    await dialog.waitFor();
    await page.mouse.click(5, 5); // outside
    await page.waitForTimeout(400);
    out.checks.dialogClosedByOutsideClick = (await dialog.count()) === 0;
    if (await dialog.count()) await page.keyboard.press("Escape");
    // Confirm
    await submit.click();
    await dialog.waitFor();
    const before = log.requests.length;
    await dialog.getByRole("button", { name: /^Start/ }).click();
    await page.waitForURL(/\/run\//, { timeout: 30000 });
    out.run = page.url().replace(L.BASE, "");
    out.checks.submitRequests = log.requests.slice(before).filter((r) => r.includes("submit") || r.includes("POST"));
    out.checks.endStatus = await L.waitForEnd(page);
    await L.shot(page, "p01-6-run-end");
  } catch (e) {
    out.error = String(e).slice(0, 500);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 2));
})();
