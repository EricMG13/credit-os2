// P15: harmony scan. Visits every Start step (Basic and Advanced, each pathway's Purpose and Context, the review sheet and
// the dialog) and greps all visible text, aria-labels, titles, placeholders and option texts for things the matrices say
// must not be shown: module codes (CP-), Excel/workbook export, memo, short snapshot, reporting currency, US$m, orchestrator
// wording, report.html. Also lists text that mentions Teams, Yahoo, OpenAI, USD. JSON out.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p15-harmony-scan.cjs
"use strict";
const L = require("./lib.cjs");
const PATTERNS = { moduleCode: /\bCP-[A-Z0-9]+\b/, excel: /export (to )?excel|\.xlsx? (export|download)|download workbook|workbook export/i, memo: /\bmemo\b/i, shortSnapshot: /short (credit )?snapshot|short_snapshot|CP-L10/i, currency: /reporting currency|reporting_currency/i, usdm: /US\$\s?m|US\$ millions/i, orchestrator: /orchestrat|navigation-only|M365/i, reportHtml: /report\.html/i, teams: /teams/i, yahoo: /yahoo/i, openai: /openai/i };
async function text(page) {
  return page.evaluate(() => {
    const pieces = [document.body.innerText];
    for (const el of document.querySelectorAll("[aria-label],[title],[placeholder],option")) {
      pieces.push(el.getAttribute("aria-label") || "", el.getAttribute("title") || "", el.getAttribute("placeholder") || "", el.tagName === "OPTION" ? el.textContent : "");
    }
    return pieces.filter(Boolean).join("\n");
  });
}
(async () => {
  const log = L.newLog();
  const out = { hits: {}, screens: [] };
  const scan = async (page, label) => {
    const t = await text(page);
    out.screens.push(label);
    for (const [k, re] of Object.entries(PATTERNS)) {
      for (const line of t.split("\n")) if (re.test(line)) { (out.hits[k] ||= new Set()).add(`${label}: ${line.slice(0, 160)}`); }
    }
  };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await scan(page, "documents-empty");
    await L.fillIdentity(page); await L.addFiles(page, ["filing", "workbook", "agreement"]);
    await page.getByRole("button", { name: "Inspect documents" }).click();
    await page.waitForTimeout(1200);
    await scan(page, "documents-inspected");
    await L.toPurpose(page);
    for (const p of ["Lite credit assessment", "Full credit assessment", "Deep credit assessment", "Earnings Update", "Relative Value", "Covenant & Refinancing", "Distressed & Restructuring", "Portfolio Decision"]) {
      await page.getByRole("radiogroup", { name: "Pathway" }).getByText(p, { exact: true }).click();
      await scan(page, `purpose:${p}`);
      for (const level of ["basic", "advanced"]) {
        await page.getByRole("combobox", { name: /Run form level/ }).selectOption(level);
        await L.toContext(page);
        for (const t of ["Issuer details", "Valuation and peers", "Module options", "Scenario assumptions"]) { const s = page.locator("summary", { hasText: t }); if (await s.count()) await s.click(); }
        for (const b of ["Add facility", "Add quote", "Add rating", "Add research question"]) { const btn = page.getByRole("button", { name: b, exact: true }); if (await btn.isEnabled()) await btn.click(); }
        await scan(page, `context:${p}:${level}`);
        await page.getByRole("button", { name: "Go back to Purpose" }).click();
        await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
      }
    }
    await page.getByRole("combobox", { name: /Run form level/ }).selectOption("basic");
    await page.getByRole("radiogroup", { name: "Pathway" }).getByText("Deep credit assessment", { exact: true }).click();
    await L.toContext(page);
    await L.toReview(page);
    await scan(page, "review:deep-basic");
    await L.decideAndApprove(page);
    await page.getByRole("button", { name: "Submit run", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await scan(page, "dialog");
  } catch (e) {
    out.error = String(e).slice(0, 600);
  } finally {
    await browser.close();
  }
  for (const k of Object.keys(out.hits)) out.hits[k] = [...out.hits[k]].slice(0, 12);
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
