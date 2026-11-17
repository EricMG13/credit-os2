// P03: the Documents step: empty state, keyboard order, file chooser, folder chooser, drop, unusual files,
// remove, inspect, native validation, carry-over. Prints one JSON object of observations.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p03-documents.cjs
"use strict";
const L = require("./lib.cjs");
const path = require("node:path");
const F = "/tmp/cs-C2/files";

const name = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return "BODY";
  return `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.labels?.[0]?.textContent || a.textContent || "").trim().slice(0, 40)}"${a.disabled ? " [disabled]" : ""}`;
});

(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    const page = await ctx.newPage();
    L.watch(page, log);
    await page.goto(`${L.BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    out.title = await page.title();
    out.headings = await page.$$eval("h1,h2,h3,h4", (hs) => hs.map((h) => `${h.tagName} ${h.textContent.trim()}`));
    out.h1count = await page.locator("h1").count();
    out.stepsList = await page.getByRole("list", { name: "Steps in this run" }).innerText();
    out.noDocsText = await page.getByText("No documents yet.").count();
    out.continueDisabled = await page.getByRole("button", { name: "Continue to purpose" }).isDisabled();
    out.inspectDisabled = await page.getByRole("button", { name: "Inspect documents" }).isDisabled();
    out.previousDisabled = await page.getByRole("button", { name: "Previous" }).isDisabled();
    out.blocker = await page.locator("#run-step-blocker").innerText().catch(() => null);
    out.continueDescribedBy = await page.getByRole("button", { name: "Continue to purpose" }).getAttribute("aria-describedby");
    // defaults
    out.defaults = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll("input,select,textarea")].filter((e) => e.type !== "file").map((e) => [e.labels?.[0]?.textContent.trim().slice(0, 30) || e.getAttribute("aria-label") || e.name, e.value])));
    // Tab order from the top
    await page.evaluate(() => { document.body.focus(); window.scrollTo(0, 0); });
    await page.mouse.click(1, 1);
    const tabs = [];
    for (let i = 0; i < 22; i += 1) { await page.keyboard.press("Tab"); tabs.push(await name(page)); }
    out.tabOrder = tabs;
    // File chooser (button) and folder chooser (button)
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Choose files" }).click()]);
    out.chooseFilesMultiple = chooser.isMultiple();
    await chooser.setFiles([L.FILES.filing]);
    await page.getByRole("list", { name: "Documents added" }).waitFor();
    const [fchooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "Choose a folder" }).click()]);
    out.chooseFolderMultiple = fchooser.isMultiple();
    await fchooser.setFiles(path.join(F, "sub")); // directory upload
    await page.waitForTimeout(400);
    out.afterFolder = await page.getByRole("list", { name: "Documents added" }).innerText();
    // Hidden / unusual files
    await page.locator("input[type=file]").first().setInputFiles([path.join(F, ".hidden.txt")]);
    await page.waitForTimeout(300);
    out.afterHiddenOnly = await page.getByRole("list", { name: "Documents added" }).locator("li").count();
    out.statusAfterHidden = await page.locator("p[role=status]").allInnerTexts();
    // Long name, accents, png, docx, empty
    await page.locator("input[type=file]").first().setInputFiles([...[
      "long-" + "a".repeat(200) + ".txt", "image.png", "notes.docx", "empty.txt"].map((n) => path.join(F, n))]);
    await page.waitForTimeout(300);
    await L.shot(page, "p03-unusual-files-1440");
    out.rows = await page.getByRole("list", { name: "Documents added" }).locator("li").allInnerTexts();
    // Remove before inspection (client only) for the folder file
    const rmBefore = log.requests.length;
    await page.getByRole("button", { name: /^Remove dup\.txt$|^Remove inner\/dup\.txt$|^Remove .*dup\.txt$/ }).first().click().catch((e) => { out.removeErr = String(e).slice(0, 200); });
    out.removeRequestsBeforeDraft = log.requests.slice(rmBefore);
    // Inspect documents
    const before = log.requests.length;
    await page.getByRole("button", { name: "Inspect documents" }).click();
    await page.waitForFunction(() => /inspected/.test(document.querySelector("p[role=status]")?.textContent || ""), null, { timeout: 15000 }).catch(() => {});
    out.inspectRequests = log.requests.slice(before);
    out.statusAfterInspect = await page.locator("p[role=status]").allInnerTexts();
    out.rowsAfterInspect = await page.getByRole("list", { name: "Documents added" }).locator("li").allInnerTexts();
    await L.shot(page, "p03-after-inspect-1440");
    out.badAfterInspect = log.bad.slice();
  } catch (e) {
    out.error = String(e).slice(0, 600);
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 2));
})();
