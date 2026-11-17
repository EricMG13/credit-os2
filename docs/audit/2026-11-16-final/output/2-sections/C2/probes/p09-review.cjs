// P09: the Review and start step with the three Northbridge files: the full sheet text, every Edit button, the limit
// checkboxes, Leave out, the approval, what un-approves, focus after Edit and the stepper, readiness rows. JSON out.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p09-review.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50)}"`;
});
const readiness = (page) => page.getByRole("complementary", { name: "Readiness" }).innerText().then((t) => t.split("\n").filter(Boolean).join(" | "));
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await L.reachReview(page, { agreement: false });
    out.focusOnArrival = await active(page);
    out.headings = await page.$$eval("h1,h2,h3,h4,h5,h6", (h) => h.map((x) => `${x.tagName} ${x.textContent.trim()}`));
    out.sheetText = (await page.locator("main").innerText()).split("\n").filter(Boolean);
    out.readiness0 = await readiness(page);
    await L.shot(page, "p09-review-1440");
    out.buttons = await page.locator("main button").evaluateAll((bs) => bs.filter((b) => b.offsetParent).map((b) => `${(b.getAttribute("aria-label") || b.textContent).trim()}${b.disabled ? " [disabled]" : ""}`));
    out.limitCards = await page.getByRole("region", { name: "Limits to decide" }).locator("li").allInnerTexts();
    // Approve disabled until decisions made
    const approve = page.getByRole("checkbox", { name: /^Approve:/ });
    out.approveDisabledBefore = await approve.isDisabled();
    out.approveDescribedBy = await approve.getAttribute("aria-describedby");
    // accept first limit only
    const boxes = page.getByRole("region", { name: "Limits to decide" }).getByRole("checkbox");
    out.limitBoxes = await boxes.count();
    await boxes.nth(0).check();
    out.readinessAfterOne = await readiness(page);
    out.blockerAfterOne = await page.locator("#run-submit-blocker").innerText();
    for (let i = 1; i < out.limitBoxes; i += 1) await boxes.nth(i).check();
    out.approveEnabledAfterAll = !(await approve.isDisabled());
    out.blockerAfterAll = await page.locator("#run-submit-blocker").innerText();
    await approve.check();
    out.readinessApproved = await readiness(page);
    out.blockerApproved = await page.locator("#run-submit-blocker").count();
    await L.shot(page, "p09-review-approved-1440");
    // unchecking a limit un-approves
    await boxes.nth(0).uncheck();
    out.approvedAfterUncheckLimit = await approve.isChecked();
    await boxes.nth(0).check();
    await approve.check();
    // Edit buttons: each goes to its step, focus lands on heading, approval dropped
    const edits = ["Edit issuer and documents", "Edit purpose and modules", "Edit context"];
    out.edits = {};
    for (const e of edits) {
      await page.getByRole("button", { name: e, exact: true }).click();
      await page.waitForTimeout(300);
      out.edits[e] = { heading: await page.$$eval("h2", (h) => h[0].textContent), focus: await active(page), stepper: await page.getByRole("list", { name: "Steps in this run" }).locator("button").allInnerTexts().then((t) => t.map((x) => x.replace(/\s+/g, " ")).join(" / ")), readiness: await readiness(page) };
      await L.toContext(page).catch(async () => { await page.getByRole("button", { name: /Continue to|Review run/ }).first().click(); });
      // walk forward to review
      for (let i = 0; i < 3; i += 1) {
        const h = await page.$$eval("h2", (hs) => hs[0].textContent);
        if (h === "Review and start") break;
        if (h === "Documents") await page.getByRole("button", { name: "Continue to purpose" }).click();
        else if (h === "Purpose") await page.getByRole("button", { name: "Continue to context" }).click();
        else if (h === "More context") await page.getByRole("button", { name: "Review run" }).click();
        await page.waitForTimeout(900);
      }
      out.edits[e].afterReturn = { heading: await page.$$eval("h2", (h) => h[0].textContent), limitsKept: await page.getByRole("region", { name: "Limits to decide" }).getByRole("checkbox").evaluateAll((b) => b.map((x) => x.checked)), approved: await page.getByRole("checkbox", { name: /^Approve:/ }).isChecked() };
      // re-approve for next loop
      const bx = page.getByRole("region", { name: "Limits to decide" }).getByRole("checkbox");
      for (const b of await bx.all()) if (!(await b.isChecked())) await b.check();
      await page.getByRole("checkbox", { name: /^Approve:/ }).check();
    }
    // Stepper back buttons from Review
    out.stepperButtons = await page.getByRole("list", { name: "Steps in this run" }).locator("button").allInnerTexts();
    await page.getByRole("button", { name: "Go back to Purpose" }).click();
    out.stepperBackToPurpose = { heading: await page.$$eval("h2", (h) => h[0].textContent), focus: await active(page) };
    // Leave out (if offered)
    await page.getByRole("button", { name: "Continue to context" }).click();
    await page.getByRole("button", { name: "Review run" }).click();
    await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
    await page.waitForTimeout(500);
    const leave = page.getByRole("button", { name: /^Leave out/ });
    out.leaveOutCount = await leave.count();
    if (out.leaveOutCount) {
      out.leaveOutLabel = await leave.first().innerText();
      await leave.first().click();
      await page.waitForTimeout(500);
      out.afterLeaveOut = { heading: await page.$$eval("h2", (h) => h[0].textContent), focus: await active(page), modulesChecked: await page.getByRole("group", { name: "Requested modules" }).getByRole("checkbox").evaluateAll((b) => b.filter((x) => !x.checked).map((x) => x.parentElement.textContent.trim())).catch(() => "n/a (Basic: group not drawn)") };
    }
    await L.shot(page, "p09-after-leaveout-1440");
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
