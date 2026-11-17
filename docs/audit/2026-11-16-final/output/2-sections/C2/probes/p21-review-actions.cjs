// P21: review-sheet actions: Leave out (Advanced and Basic), Put back, No action needed disclosure, every Edit button and every
// stepper "Go back to" button (target step, focus, what is kept), the breadcrumb link. JSON out.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p21-review-actions.cjs
"use strict";
const L = require("./lib.cjs");
const active = (page) => page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return "BODY"; return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50)}"`; });
const h2 = (page) => page.$$eval("h2", (h) => h[0]?.textContent);
async function forwardToReview(page) {
  for (let i = 0; i < 4; i += 1) {
    const h = await h2(page);
    if (h === "Review and start") return;
    if (h === "Documents") await page.getByRole("button", { name: "Continue to purpose" }).click();
    else if (h === "Purpose") await page.getByRole("button", { name: "Continue to context" }).click();
    else if (h === "More context") await page.getByRole("button", { name: "Review run" }).click();
    await page.waitForTimeout(1000);
  }
}
(async () => {
  const log = L.newLog();
  const out = { edits: {}, goBack: {} };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    // Advanced level so that Leave out changes the Requested modules
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page); await L.addFiles(page, ["filing", "workbook", "agreement"]);
    await L.toPurpose(page);
    await page.getByRole("combobox", { name: /Run form level/ }).selectOption("advanced");
    await L.toContext(page);
    await page.getByRole("combobox", { name: "Portfolio workbook" }).selectOption({ label: "northbridge-portfolio.xlsx" });
    await L.toReview(page);
    out.noActionSummary = await page.locator("summary", { hasText: "No action needed" }).count();
    const leave = page.getByRole("button", { name: /^Leave out/ });
    out.leaveOut = { count: await leave.count(), label: await leave.first().innerText().catch(() => null) };
    await leave.first().click();
    await page.waitForTimeout(500);
    out.afterLeaveOut = { h2: await h2(page), focus: await active(page), unchecked: await page.getByRole("group", { name: "Requested modules" }).getByRole("checkbox").evaluateAll((b) => b.filter((x) => !x.checked).map((x) => x.parentElement.textContent.trim())) };
    await forwardToReview(page);
    out.afterReturn = { left: await page.getByText(/^Left out:/).allInnerTexts(), putBack: await page.getByRole("button", { name: "Put back" }).count(), modulesHeading: await page.getByRole("heading", { name: /^Modules \(/ }).innerText(), changesRow: await page.locator("dt", { hasText: "Changes" }).locator("xpath=following-sibling::dd[1]").allInnerTexts() };
    await L.shot(page, "p21-leftout-review");
    await page.getByRole("button", { name: "Put back" }).click();
    await page.waitForTimeout(600);
    out.afterPutBack = { h2: await h2(page), focus: await active(page), putBack: await page.getByRole("button", { name: "Put back" }).count(), modulesHeading: await page.getByRole("heading", { name: /^Modules \(/ }).innerText().catch(() => "n/a") };
    out.reviewAfterPutBack = out.afterPutBack.h2;
    // Edit buttons and stepper back buttons
    if ((await h2(page)) !== "Review and start") await forwardToReview(page);
    for (const name of ["Edit issuer and documents", "Edit purpose and modules", "Edit context", "Edit issuer details", "Edit context details", "Edit valuation and peers", "Edit module options", "Edit scenario assumptions"]) {
      const b = page.getByRole("button", { name, exact: true });
      if (!(await b.count())) { out.edits[name] = "not drawn"; continue; }
      await b.click();
      await page.waitForTimeout(300);
      out.edits[name] = { h2: await h2(page), focus: await active(page) };
      await forwardToReview(page);
    }
    for (const name of ["Go back to Documents", "Go back to Purpose", "Go back to More context"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await page.waitForTimeout(300);
      out.goBack[name] = { h2: await h2(page), focus: await active(page), stepperButtons: await page.getByRole("list", { name: "Steps in this run" }).locator("button").count() };
      await forwardToReview(page);
    }
    // breadcrumb
    await page.getByRole("link", { name: "Library", exact: true }).first().click();
    await page.waitForTimeout(600);
    out.breadcrumb = { url: page.url().replace(L.BASE, ""), leftWithoutWarning: true };
    await page.goBack();
    await page.waitForTimeout(600);
    out.afterBack = { url: page.url().replace(L.BASE, ""), h2: await h2(page) };
  } catch (e) { out.error = String(e).slice(0, 600); } finally { await browser.close(); }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
