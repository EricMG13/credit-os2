// P05: Issuer name / Issuer ID / As-of / Your name: native validation, derived ID, analyst-name rule, error focus,
// carry-over from latest run, reset. Prints one JSON object.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p05-identity.cjs
"use strict";
const L = require("./lib.cjs");

const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().slice(0, 50)}"`;
});
const val = (page, label) => page.getByRole("textbox", { name: label, exact: true });

(async () => {
  const log = L.newLog();
  const out = { slug: {}, native: {}, analyst: {} };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await val(page, "Issuer name").waitFor();
    await L.addFiles(page, ["filing"]);
    // derived Issuer ID for various names
    for (const n of ["Société Générale S.A.", "Ørsted A/S", "Эрикссон", "日本電信電話", "A", "  Trailing  ", "x".repeat(60), "Nokia Oyj (2025)"]) {
      await val(page, "Issuer name").fill(n);
      out.slug[n.slice(0, 30)] = await val(page, "Issuer ID").inputValue();
    }
    // Native validation messages
    const msg = (loc) => loc.evaluate((e) => ({ valid: e.validity.valid, message: e.validationMessage, pattern: e.pattern, required: e.required }));
    await val(page, "Issuer name").fill("Эрикссон");
    out.native.cyrillicIdMessage = await msg(val(page, "Issuer ID"));
    await val(page, "Issuer ID").fill("Northbridge Group");
    out.native.upperCaseIdMessage = await msg(val(page, "Issuer ID"));
    out.native.idHelpText = await page.locator("label", { hasText: "Issuer ID" }).innerText();
    // Continue with an invalid ID: what does the user see? (native bubble not in DOM; check URL/step stays and no alert)
    await val(page, "Your name").fill("Audit Z");
    await page.getByRole("button", { name: "Continue to purpose" }).click();
    await page.waitForTimeout(500);
    out.native.afterContinueInvalidId = { headings: await page.$$eval("h2", (h) => h.map((x) => x.textContent)), alerts: await page.locator("[role=alert]").allInnerTexts(), focus: await active(page) };
    // Empty issuer name
    await val(page, "Issuer name").fill("");
    await val(page, "Issuer ID").fill("ok-id");
    await page.getByRole("button", { name: "Continue to purpose" }).click();
    await page.waitForTimeout(300);
    out.native.afterContinueEmptyName = { alerts: await page.locator("[role=alert]").allInnerTexts(), focus: await active(page), nameMessage: await msg(val(page, "Issuer name")) };
    // Whitespace-only name
    await val(page, "Issuer name").fill("   ");
    await page.getByRole("button", { name: "Continue to purpose" }).click();
    await page.waitForTimeout(800);
    out.native.afterContinueBlankName = { alerts: await page.locator("[role=alert]").allInnerTexts(), focus: await active(page), headings: await page.$$eval("h2", (h) => h.map((x) => x.textContent)), problemBtn: await page.getByRole("button", { name: /problem to fix/ }).allInnerTexts() };
    await page.getByRole("button", { name: "Go back to Documents" }).click();
    await val(page, "Issuer name").waitFor();
    await val(page, "Issuer name").fill("Northbridge Synthetic Group");
    await val(page, "Issuer ID").fill("northbridge-synthetic-group");
    // The analyst name is checked only at Review run: reach it with a bad name
    out.analyst.requiredMarked = await val(page, "Your name").evaluate((e) => ({ required: e.required, ariaRequired: e.getAttribute("aria-required") }));
    await val(page, "Your name").fill("bad");
    await L.toPurpose(page);
    await L.toContext(page);
    await page.getByRole("button", { name: "Review run", exact: true }).click();
    await page.waitForTimeout(1500);
    out.analyst.atReview = { headings: await page.$$eval("h2", (h) => h.map((x) => x.textContent)), alerts: await page.locator("[role=alert]").allInnerTexts() };
    await L.shot(page, "p05-name-error-1440");
    out.errorAttrs = await val(page, "Your name").evaluate((e) => ({ invalid: e.getAttribute("aria-invalid"), describedby: e.getAttribute("aria-describedby") }));
    out.errorFocus = await active(page);
    await page.getByRole("button", { name: /problem to fix/ }).click();
    out.errorButtonFocus = await active(page);
    await val(page, "Your name").fill("Eric G");
    out.afterFixAlerts = await page.locator("[role=alert]").allInnerTexts();
    out.afterFixProblemButton = await page.getByRole("button", { name: /problem to fix/ }).count();
  } catch (e) {
    out.error = String(e).slice(0, 600);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
