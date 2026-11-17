// P13: /start?from=<finished run>: what is carried (answers, documents, attachments), the as-of note, Inspect on carried
// documents, and the review sheet that follows. It first makes its own finished run through the page (lib.finishedRun: the
// agreement is uploaded and chosen as the executed one); no run id is passed by hand.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p13-from-run.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
const val = (page, label) => page.getByRole("textbox", { name: label, exact: true });
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const run = await L.finishedRun(ctx);
    out.run = run;
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start?from=${run}`);
    await val(page, "Issuer name").waitFor();
    await page.waitForTimeout(500);
    out.fields = { name: await val(page, "Issuer name").inputValue(), id: await val(page, "Issuer ID").inputValue(), idReadOnly: await val(page, "Issuer ID").evaluate((e) => e.readOnly), asOf: await val(page, "As-of date").inputValue(), yourName: await val(page, "Your name").inputValue() };
    out.texts = await page.locator("main p").allInnerTexts().then((t) => t.filter((x) => /Starting|Set to today|earlier/.test(x)));
    out.docsListed = await page.locator("[aria-label='Documents added'] li").count();
    out.noDocsText = await page.getByText("No documents yet.").count();
    out.continueDisabled = await page.getByRole("button", { name: "Continue to purpose" }).isDisabled();
    out.inspectDisabled = await page.getByRole("button", { name: "Inspect documents" }).isDisabled();
    await L.shot(page, "p13-from-1440");
    await val(page, "Your name").fill("Audit Z");
    await page.getByRole("button", { name: "Inspect documents" }).click();
    await page.waitForTimeout(1200);
    out.afterInspect = { status: await page.locator("p[role=status]").allInnerTexts(), rows: await page.locator("[aria-label='Documents added'] li").allInnerTexts().then((t) => t.map((x) => x.replace(/\n+/g, " | "))), alerts: await page.locator("[role=alert]").allInnerTexts() };
    // Remove a carried doc (server delete) then continue
    if (out.afterInspect.rows.length > 1) {
      const before = log.requests.length;
      await page.getByRole("button", { name: /^Remove / }).first().click();
      await page.waitForTimeout(800);
      out.removeCarried = { requests: log.requests.slice(before), rows: await page.locator("[aria-label='Documents added'] li").count(), alerts: await page.locator("[role=alert]").allInnerTexts() };
    }
    await L.toPurpose(page);
    out.purpose = { checked: await page.getByRole("radio", { checked: true }).getAttribute("aria-label"), level: await page.getByRole("combobox", { name: /Run form level/ }).inputValue(), kind: await page.getByRole("combobox", { name: /Case kind/ }).inputValue(), purpose: await page.getByRole("combobox", { name: /Run purpose/ }).inputValue() };
    await L.toContext(page);
    out.context = { legal: await page.getByRole("combobox", { name: "Legal documents" }).inputValue(), workbook: await page.getByRole("combobox", { name: "Portfolio workbook" }).inputValue().catch(() => "(not drawn)"), asOf: null };
    await page.getByRole("button", { name: "Review run" }).click();
    await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
    await page.waitForTimeout(500);
    const text = await page.locator("main").innerText();
    out.review = text.split("\n").filter((l) => /Compared|first run|Changes|Legal documents|Portfolio workbook|As-of|Submitted|Documents read|\.txt|\.xlsx|Will refuse|Gap|Limited|Check/.test(l)).slice(0, 30);
    await L.shot(page, "p13-from-review-1440");
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
