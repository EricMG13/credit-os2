// P04: how the Documents step treats each unusual file on its own (accent name, png, docx, empty, 52 MB, duplicate names).
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p04-document-types.cjs
"use strict";
const L = require("./lib.cjs");
const path = require("node:path");
const fs = require("node:fs");
const F = "/tmp/cs-C2/files";
const cases = [
  ["accent", ["Åccent-Résumé.txt"]],
  ["png", ["image.png"]],
  ["docx", ["notes.docx"]],
  ["empty", ["empty.txt"]],
  ["big52", ["big52.txt"]],
  ["filing+png+docx", ["__filing", "image.png", "notes.docx"]],
  ["same-name-twice", ["dup.txt", "sub/inner/dup.txt"]],
  ["hidden", [".hidden.txt"]],
];
(async () => {
  const log = L.newLog();
  const out = { cases: {} };
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    for (const [label, names] of cases) {
      const page = await ctx.newPage();
      L.watch(page, log);
      const rec = {};
      try {
        await page.goto(`${L.BASE}/start`);
        await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
        const paths = names.map((n) => (n === "__filing" ? L.FILES.filing : path.join(F, n)));
        await page.locator("input[type=file]").first().setInputFiles(paths);
        await page.waitForTimeout(300);
        rec.rowsAfterAdd = await page.locator("[aria-label='Documents added'] li").allInnerTexts().catch(() => []);
        rec.noDocsText = await page.getByText("No documents yet.").count();
        rec.continueDisabled = await page.getByRole("button", { name: "Continue to purpose" }).isDisabled();
        if (!rec.continueDisabled) {
          await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
          await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
          await page.waitForTimeout(label === "big52" ? 6000 : 2000);
          rec.notice = await page.locator("[role=alert]").allInnerTexts();
          rec.status = await page.locator("p[role=status]").allInnerTexts();
          rec.rowsAfterInspect = (await page.locator("[aria-label='Documents added'] li").allInnerTexts()).map((t) => t.replace(/\n+/g, " | ").slice(0, 200));
        }
      } catch (e) {
        rec.error = String(e).slice(0, 300);
      }
      out.cases[label] = rec;
      await page.close();
    }
  } finally {
    await browser.close();
  }
  out.log = log;
  console.log(JSON.stringify(out, null, 2));
})();
