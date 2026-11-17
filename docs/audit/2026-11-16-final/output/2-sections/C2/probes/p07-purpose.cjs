// P07: the Purpose step: eight pathway cards (names, order, module counts, cap per card), keyboard (arrows, Space,
// Tab), what changes when a pathway is chosen (Run purpose choices, readiness cap), the three selects, and Previous.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p07-purpose.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()}${a.getAttribute("role") ? `[${a.getAttribute("role")}]` : ""} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().slice(0, 40)}"`;
});
(async () => {
  const log = L.newLog();
  const out = { cards: [], keyboard: [], caps: {}, selects: {} };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page);
    await L.addFiles(page, ["filing", "workbook"]);
    await L.toPurpose(page);
    out.focusAfterStepChange = await active(page);
    out.headings = await page.$$eval("h1,h2,h3", (h) => h.map((x) => `${x.tagName} ${x.textContent.trim()}`));
    out.guidance = await page.getByText("The purpose determines which modules run.").count();
    const radios = page.getByRole("radio");
    const n = await radios.count();
    for (let i = 0; i < n; i += 1) {
      const r = radios.nth(i);
      out.cards.push({ name: await r.getAttribute("aria-label"), checked: await r.isChecked() });
    }
    out.cardText = (await page.getByRole("radiogroup", { name: "Pathway" }).innerText()).split("\n").filter(Boolean);
    out.selectsDefault = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll("select")].map((s) => [s.labels?.[0]?.textContent.trim().split("\n")[0].slice(0, 25), [...s.options].map((o) => o.text + (o.selected ? "*" : ""))])));
    // Keyboard: focus selected radio, arrows
    await page.getByRole("radio", { name: "Full credit assessment" }).focus();
    for (const key of ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Space"]) {
      await page.keyboard.press(key);
      const checked = await page.getByRole("radio", { checked: true }).getAttribute("aria-label");
      out.keyboard.push({ key, focus: await active(page), checked });
    }
    // Tab order across the step
    await page.getByRole("radiogroup", { name: "Pathway" }).getByText("Full credit assessment", { exact: true }).click();
    await page.getByRole("radio", { name: "Full credit assessment" }).focus();
    const tabs = [];
    for (let i = 0; i < 6; i += 1) { await page.keyboard.press("Tab"); tabs.push(await active(page)); }
    out.tabAfterRadios = tabs;
    // each card: choose, read the cap in readiness and purposes offered
    for (const label of ["Lite credit assessment", "Full credit assessment", "Deep credit assessment", "Earnings Update", "Relative Value", "Covenant & Refinancing", "Distressed & Restructuring", "Portfolio Decision"]) {
      await page.getByRole("radiogroup", { name: "Pathway" }).getByText(label, { exact: true }).click();
      out.caps[label] = {
        cap: await page.getByRole("complementary", { name: "Readiness" }).innerText().then((t) => t.split("\n").filter(Boolean).slice(-2).join(" / ")),
        purposes: await page.getByRole("combobox", { name: /Run purpose/ }).evaluate((s) => [...s.options].map((o) => o.text + (o.selected ? "*" : ""))),
        checked: await page.getByRole("radio", { checked: true }).getAttribute("aria-label"),
      };
    }
    await L.shot(page, "p07-purpose-earnings-1440");
    // Level select options and what advanced adds
    const level = page.getByRole("combobox", { name: /Run form level/ });
    out.selects.levelOptions = await level.evaluate((s) => [...s.options].map((o) => `${o.value}:${o.text}`));
    out.selects.caseKind = await page.getByRole("combobox", { name: /Case kind/ }).evaluate((s) => [...s.options].map((o) => `${o.value}:${o.text}${o.selected ? "*" : ""}`));
    out.selects.levelHelp = await page.getByText(/Advanced adds model/).innerText();
    out.selects.caseHelp = await page.getByText(/Web research runs for public/).innerText();
    // Previous
    await page.getByRole("button", { name: "Previous" }).click();
    await page.getByRole("heading", { name: "Documents", exact: true }).waitFor();
    out.afterPrevious = { focus: await active(page), rows: await page.locator("[aria-label='Documents added'] li").count(), stepper: await page.getByRole("list", { name: "Steps in this run" }).innerText().then((t) => t.replace(/\n+/g, " ")) };
  } catch (e) {
    out.error = String(e).slice(0, 600);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
