// P16: field-to-request wiring. On the Context step (Advanced, Deep pathway, every details section open, one row added in
// each editor) every text, number, date, select, textarea and checkbox is given a distinctive value; the summary request
// body is captured and each value is looked up in it. Reports fields whose value never reaches the request, fields the
// browser refuses natively, and what the service says. The submit request is never sent.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p16-field-wiring.cjs
"use strict";
const L = require("./lib.cjs");
(async () => {
  const log = L.newLog();
  const out = { fields: [], missing: [], invalid: [], alerts: [] };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    let body = null;
    page.on("request", (r) => { if (/\/summary$/.test(r.url())) body = r.postData(); });
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page); await L.addFiles(page, ["filing", "workbook", "agreement"]);
    await L.toPurpose(page);
    await page.getByRole("radiogroup", { name: "Pathway" }).getByText("Deep credit assessment", { exact: true }).click();
    await page.getByRole("combobox", { name: /Run form level/ }).selectOption("advanced");
    await L.toContext(page);
    for (const t of ["Issuer details", "Valuation and peers", "Module options", "Scenario assumptions"]) await page.locator("summary", { hasText: t }).click();
    for (const b of ["Add facility", "Add quote", "Add rating", "Add research question"]) await page.getByRole("button", { name: b, exact: true }).click();
    await page.getByRole("combobox", { name: "Legal documents" }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement" }).selectOption({ label: "northbridge-credit-agreement.txt" });
    // a valuation basis that reveals more fields: set peer source and basis to the last options first
    for (const label of ["Valuation basis"]) { const s = page.getByRole("combobox", { name: label }); const opts = await s.evaluate((e) => [...e.options].map((o) => o.value)); out.basisOptions = opts; }
    // Generic fill
    const fill = async () => {
      const handles = await page.locator("main input:not([type=file]):not([type=hidden]), main select, main textarea").elementHandles();
      let n = 0;
      for (const h of handles) {
        const info = await h.evaluate((e) => ({ tag: e.tagName.toLowerCase(), type: e.type, label: (e.labels?.[0]?.textContent || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 50), vis: e.offsetParent !== null, disabled: e.disabled, readOnly: e.readOnly, id: e.id, name: e.name }));
        if (!info.vis || info.disabled || info.readOnly) continue;
        if (["Issuer name", "Issuer ID", "As-of date", "Your name", "Documents", "Document folder"].includes(info.label) || info.label.startsWith("ModelGPT")) continue;
        n += 1;
        const token = `T${String(n).padStart(2, "0")}`;
        let value = null;
        if (info.tag === "select") { const opts = await h.evaluate((e) => [...e.options].map((o) => o.value)); value = opts.length > 1 ? opts[opts.length - 1] : opts[0]; await h.selectOption(value); }
        else if (info.type === "checkbox") { await h.check().catch(() => {}); value = "checked"; }
        else if (info.type === "date") { value = `2025-01-${String(1 + (n % 27)).padStart(2, "0")}`; await h.fill(value); }
        else if (info.type === "number") { value = String(10 + (n % 50)); await h.fill(value); }
        else { value = token; await h.fill(value); }
        out.fields.push({ n, ...info, value });
      }
      return n;
    };
    out.filled = await fill();
    // second pass for fields revealed by the first
    out.fields = [];
    out.filled2 = await fill();
    await page.getByRole("button", { name: "Review run" }).click();
    await page.waitForTimeout(2000);
    out.alerts = await page.locator("[role=alert]").allInnerTexts();
    out.heading = await page.$$eval("h2", (h) => h[0].textContent);
    out.invalidNative = await page.evaluate(() => [...document.querySelectorAll("input,select,textarea")].filter((e) => !e.validity.valid).map((e) => `${(e.labels?.[0]?.textContent || e.name || "").trim().slice(0, 30)}: ${e.validationMessage}`));
    out.bodyCaptured = body !== null;
    if (body) {
      for (const f of out.fields) if (typeof f.value === "string" && f.value.startsWith("T") && !body.toLowerCase().includes(f.value.toLowerCase())) out.missing.push(`${f.label} (${f.value})`);
      out.bodyKeys = Object.keys(JSON.parse(body)); out.body = JSON.parse(body);
    }
    await L.shot(page, "p16-after-review-1440");
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.fields = out.fields.map((f) => `${f.n} ${f.tag}${f.type && f.tag === "input" ? ":" + f.type : ""} ${f.label} = ${f.value}`);
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
