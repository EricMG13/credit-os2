// P10: browser Back, Forward, Reload and a link click in the middle of the form (steps 1 to 4), whether anything
// warns before the typed work is lost, plus Leave out and the stepper from the review sheet. JSON out.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p10-navigation.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50)}"`;
});
(async () => {
  const log = L.newLog();
  const out = { dialogs: [] };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    page.on("dialog", async (d) => { out.dialogs.push(`${d.type()}: ${d.message().slice(0, 100)}`); await d.dismiss(); });
    const earlier = await L.finishedRun(ctx); // a finished run to start from, made through the page
    await page.goto(`${L.BASE}/runs`);
    await page.getByRole("link", { name: /Start a run/ }).first().click().catch(() => {});
    await page.waitForURL(/\/start/).catch(() => {});
    out.arrivedFromRuns = page.url().replace(L.BASE, "");
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(page);
    await L.addFiles(page, ["filing", "workbook"]);
    await L.toPurpose(page);
    await L.toContext(page);
    out.urlAtStep3 = page.url().replace(L.BASE, "");
    out.historyLength = await page.evaluate(() => history.length);
    await page.goBack();
    await page.waitForTimeout(800);
    out.afterBackAtStep3 = { url: page.url().replace(L.BASE, ""), h2: await page.$$eval("h2", (h) => h.map((x) => x.textContent)).catch(() => []) };
    await page.goForward();
    await page.waitForTimeout(800);
    out.afterForward = { url: page.url().replace(L.BASE, ""), h2: await page.$$eval("h2", (h) => h.map((x) => x.textContent)), name: await page.getByRole("textbox", { name: "Issuer name", exact: true }).inputValue().catch(() => null), rows: await page.locator("[aria-label='Documents added'] li").count() };
    // Reload at step 1 with typed values
    await L.fillIdentity(page, { name: "Audit Z" }).catch(() => {});
    await page.reload();
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    out.afterReload = { name: await page.getByRole("textbox", { name: "Your name", exact: true }).inputValue(), rows: await page.locator("[aria-label='Documents added'] li").count() };
    // Direct open of /start?from=<bad>
    for (const q of ["?from=does-not-exist", "?from=../../etc/passwd", "?from=", `?from=${earlier}&from=other`, "?x=1"]) {
      await page.goto(`${L.BASE}/start${q}`);
      await page.waitForTimeout(1200);
      out[`start${q}`] = { notice: await page.locator("[role=alert]").allInnerTexts(), status: await page.locator("p[role=status]").allInnerTexts(), intro: await page.getByText(/Starting from run/).count(), name: await page.getByRole("textbox", { name: "Issuer name", exact: true }).inputValue().catch(() => null) };
    }
    // Direct URL variants
    for (const u of ["/start/", "/start#x", "/START", "/start/extra"]) {
      const r = await page.goto(`${L.BASE}${u}`);
      out[`GET ${u}`] = { status: r.status(), h1: await page.locator("h1").allInnerTexts() };
    }
    // keyboard: Enter inside Issuer name submits the form (advance) when documents exist
    await page.goto(`${L.BASE}/start`);
    await L.addFiles(page, ["filing"]);
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
    await page.getByRole("textbox", { name: "Your name", exact: true }).press("Enter");
    await page.waitForTimeout(1500);
    out.enterInName = await page.$$eval("h2", (h) => h[0].textContent);
  } catch (e) {
    out.error = String(e).slice(0, 700);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
