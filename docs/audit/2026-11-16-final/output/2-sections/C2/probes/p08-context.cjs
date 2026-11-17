// P08: the More context step at Basic and Advanced level, for several pathways: which controls are drawn, the row
// editors (add, edit, remove, focus after remove), every Requested-modules checkbox, valuation, assumptions,
// module options, native validation, and the Standard level. Prints one JSON object.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p08-context.cjs
"use strict";
const L = require("./lib.cjs");
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().slice(0, 40)}"`;
});
const controls = (page) => page.evaluate(() => [...document.querySelectorAll("main input, main select, main textarea, main summary, main button")]
  .filter((e) => e.offsetParent !== null && !e.closest("aside"))
  .map((e) => `${e.tagName.toLowerCase()}${e.type && e.tagName === "INPUT" ? ":" + e.type : ""} ${(e.getAttribute("aria-label") || e.labels?.[0]?.textContent || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}`));
const pathwayCard = (page, label) => page.getByRole("radiogroup", { name: "Pathway" }).getByText(label, { exact: true });

(async () => {
  const log = L.newLog();
  const out = { ctl: {}, rows: {}, modules: {}, native: {} };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page);
    await L.addFiles(page, ["filing", "workbook", "agreement"]);
    await L.toPurpose(page);
    // per pathway at Basic
    for (const label of ["Lite credit assessment", "Full credit assessment", "Deep credit assessment", "Earnings Update", "Relative Value", "Covenant & Refinancing", "Distressed & Restructuring", "Portfolio Decision"]) {
      await pathwayCard(page, label).click();
      await L.toContext(page);
      out.ctl[`basic:${label}`] = await controls(page);
      await page.getByRole("button", { name: "Go back to Purpose" }).click();
      await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
    }
    // Standard level equals Basic?
    await pathwayCard(page, "Full credit assessment").click();
    await page.getByRole("combobox", { name: /Run form level/ }).selectOption("standard");
    await L.toContext(page);
    out.ctl["standard:Full"] = await controls(page);
    out.standardSameAsBasic = JSON.stringify(out.ctl["standard:Full"]) === JSON.stringify(out.ctl["basic:Full credit assessment"]);
    await page.getByRole("button", { name: "Go back to Purpose" }).click();
    await page.getByRole("combobox", { name: /Run form level/ }).selectOption("advanced");
    await pathwayCard(page, "Deep credit assessment").click();
    await L.toContext(page);
    out.ctl["advanced:Deep"] = await controls(page);
    await L.shot(page, "p08-advanced-1440");
    // Requested modules: every checkbox
    const boxes = page.getByRole("group", { name: "Requested modules" }).getByRole("checkbox");
    const n = await boxes.count();
    out.modules.count = n;
    out.modules.names = await page.getByRole("group", { name: "Requested modules" }).locator("label").allInnerTexts();
    out.modules.initialChecked = await boxes.evaluateAll((els) => els.filter((e) => e.checked).length);
    // uncheck each in turn (restore after) and note what is disabled
    const effects = [];
    for (let i = 0; i < Math.min(n, 40); i += 1) {
      const box = boxes.nth(i);
      await box.uncheck();
      effects.push({ i, checkedAfter: await boxes.evaluateAll((els) => els.filter((e) => e.checked).length) });
      await box.check();
    }
    out.modules.uncheckEffects = effects.map((e) => e.checkedAfter).join(",");
    // reduce to one module: last one disabled?
    for (let i = 1; i < n; i += 1) await boxes.nth(i).uncheck();
    out.modules.afterAllButFirst = { checked: await boxes.evaluateAll((els) => els.filter((e) => e.checked).map((e) => e.parentElement.textContent.trim())), disabled: await boxes.evaluateAll((els) => els.filter((e) => e.disabled).map((e) => e.parentElement.textContent.trim())) };
    // Keyboard on a checkbox: Space toggles
    await boxes.nth(2).focus();
    await page.keyboard.press("Space");
    out.modules.spaceToggled = await boxes.nth(2).isChecked();
    for (let i = 1; i < n; i += 1) if (!(await boxes.nth(i).isChecked())) await boxes.nth(i).check();
    // Change pathway resets module selection silently?
    await boxes.nth(3).uncheck();
    out.modules.uncheckedBeforePathwayChange = await boxes.evaluateAll((els) => els.filter((e) => !e.checked).length);
    await page.getByRole("button", { name: "Go back to Purpose" }).click();
    await pathwayCard(page, "Full credit assessment").click();
    await L.toContext(page);
    out.modules.afterPathwayChange = await page.getByRole("group", { name: "Requested modules" }).getByRole("checkbox").evaluateAll((els) => ({ n: els.length, unchecked: els.filter((e) => !e.checked).length }));
    // Turns validation
    const turns = page.getByRole("spinbutton", { name: "Turns per module" });
    for (const v of ["0", "65", "1.5", "", "-3", "64", "1"]) {
      await turns.fill(v);
      out.native[`turns=${v}`] = await turns.evaluate((e) => ({ valid: e.validity.valid, msg: e.validationMessage, value: e.value }));
    }
    await turns.fill("32");
    // Details: Issuer details, valuation, module options, assumptions
    for (const t of ["Issuer details", "Valuation and peers", "Module options", "Scenario assumptions"]) {
      const sum = page.locator("summary", { hasText: t });
      await sum.focus();
      await page.keyboard.press("Enter");
      const open = await sum.evaluate((e) => e.parentElement.open);
      await page.keyboard.press("Space");
      const open2 = await sum.evaluate((e) => e.parentElement.open);
      out.modules[`details:${t}`] = { afterEnter: open, afterSpace: open2, focus: await active(page) };
    }
    await L.shot(page, "p08-advanced-open-1440");
    out.ctl["advanced:Deep:open"] = await controls(page);
    // Row editors
    for (const [add, remove] of [["Add facility", "Remove Facility 1"], ["Add quote", "Remove Quote 1"], ["Add rating", "Remove Rating 1"], ["Add research question", "Remove Question 1"]]) {
      const btn = page.getByRole("button", { name: add, exact: true });
      await btn.scrollIntoViewIfNeeded();
      await btn.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150);
      const rec = { added: await page.getByRole("button", { name: remove, exact: true }).count(), focusAfterAdd: await active(page) };
      rec.controls = await page.evaluate((r) => { const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === r); const box = b.closest("div.relative"); return [...box.querySelectorAll("input,select,textarea")].map((e) => `${e.tagName.toLowerCase()} ${(e.labels?.[0]?.textContent || "").trim().slice(0, 25)}`); }, remove);
      await page.getByRole("button", { name: remove, exact: true }).click();
      rec.afterRemove = { count: await page.getByRole("button", { name: remove, exact: true }).count(), focus: await active(page), live: await page.locator("[aria-live], [role=status]").allInnerTexts() };
      out.rows[add] = rec;
    }
    // add up to max for facility to check max/disabled
    const addF = page.getByRole("button", { name: "Add facility", exact: true });
    let c = 0;
    while (!(await addF.isDisabled()) && c < 60) { await addF.click(); c += 1; }
    out.rows.facilityMax = { added: c, disabled: await addF.isDisabled(), helper: await addF.evaluate((e) => e.parentElement.parentElement.textContent.slice(0, 200)) };
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
