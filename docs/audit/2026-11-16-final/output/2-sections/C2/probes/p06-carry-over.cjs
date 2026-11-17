// P06: "Carry over from latest run" and "This is a different issuer": effect, focus after the button is replaced,
// unknown issuer, empty ID, and keyboard operation. Needs one finished run for issuer northbridge-synthetic-group
// (run p01-submit-flow.cjs first on a fresh service).
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p06-carry-over.cjs
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
  const out = {};
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await val(page, "Issuer name").waitFor();
    // unknown issuer
    await val(page, "Issuer name").fill("Zzzz Unknown Co");
    await page.getByRole("button", { name: "Carry over from latest run" }).click();
    await page.waitForTimeout(600);
    out.carryUnknown = { status: await page.locator("p[role=status]").allInnerTexts(), alerts: await page.locator("[role=alert]").allInnerTexts(), focus: await active(page) };
    // empty ID
    await val(page, "Issuer ID").fill("");
    await page.getByRole("button", { name: "Carry over from latest run" }).click();
    await page.waitForTimeout(400);
    out.carryEmptyId = { alerts: await page.locator("[role=alert]").allInnerTexts(), focus: await active(page) };
    // known issuer via keyboard
    await val(page, "Issuer name").fill("Northbridge Synthetic Group");
    await val(page, "Issuer ID").fill("northbridge-synthetic-group");
    await page.getByRole("button", { name: "Carry over from latest run" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    out.carryKnown = {
      status: await page.locator("p[role=status]").allInnerTexts(),
      alerts: await page.locator("[role=alert]").allInnerTexts(),
      name: await val(page, "Issuer name").inputValue(),
      idReadOnly: await val(page, "Issuer ID").evaluate((e) => e.readOnly),
      asOf: await val(page, "As-of date").inputValue(),
      rows: await page.locator("[aria-label='Documents added'] li").allInnerTexts(),
      button: await page.getByRole("button", { name: /different issuer|Carry over/ }).allInnerTexts(),
      focusAfterKeyboardActivation: await active(page),
      intro: await page.getByText(/Starting from run/).allInnerTexts(),
      inspectDisabled: await page.getByRole("button", { name: "Inspect documents" }).isDisabled(),
      continueDisabled: await page.getByRole("button", { name: "Continue to purpose" }).isDisabled(),
    };
    await L.shot(page, "p06-carry-1440");
    await page.getByRole("button", { name: "This is a different issuer" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    out.afterReset = { name: await val(page, "Issuer name").inputValue(), rows: await page.locator("[aria-label='Documents added'] li").count(), button: await page.getByRole("button", { name: /different issuer|Carry over/ }).allInnerTexts(), focusAfterKeyboardActivation: await active(page) };
  } catch (e) {
    out.error = String(e).slice(0, 600);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
