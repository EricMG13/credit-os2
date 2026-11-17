// P20: review sheet at narrow widths with an ordinary file name that has no spaces
// ("Northbridge_Group_Annual_Report_and_Accounts_2025_Final.txt", 58 characters). Measures the width of the review column
// and whether the Edit buttons and the Submit button stay inside the window. JSON out.
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p20-narrow-review-overflow.cjs
"use strict";
const L = require("./lib.cjs");
const fs = require("node:fs");
const NAME = "Northbridge_Group_Annual_Report_and_Accounts_2025_Final.txt";
(async () => {
  fs.mkdirSync("/tmp/cs-C2/files", { recursive: true });
  fs.writeFileSync(`/tmp/cs-C2/files/${NAME}`, fs.readFileSync(L.FILES.filing));
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    for (const [width, height] of [[390, 5200], [600, 4200], [820, 3800], [1100, 3200]]) {
      const ctx = await L.context(browser, { log, width, height });
      const page = await ctx.newPage();
      L.watch(page, log);
      await page.goto(`${L.BASE}/start`);
      await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
      await L.fillIdentity(page);
      await page.locator("input[type=file]").first().setInputFiles([`/tmp/cs-C2/files/${NAME}`, L.FILES.workbook]);
      await page.getByRole("list", { name: "Documents added" }).waitFor();
      await L.toPurpose(page); await L.toContext(page); await L.toReview(page);
      out[width] = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const edit = [...document.querySelectorAll("button")].filter((b) => /^Edit /.test(b.textContent));
        const submit = [...document.querySelectorAll("button")].find((b) => /^Submit/.test(b.textContent));
        const sheet = document.querySelector("h3")?.closest("section") || document.querySelector("main");
        const col = [...document.querySelectorAll("h2")].find((h) => h.textContent === "Review and start").parentElement.parentElement;
        return { viewport: vw, columnWidth: Math.round(col.getBoundingClientRect().width), editRights: edit.map((b) => Math.round(b.getBoundingClientRect().right)), editOffscreen: edit.filter((b) => b.getBoundingClientRect().right > vw).length, editTotal: edit.length, submitRight: Math.round(submit.getBoundingClientRect().right), submitLeft: Math.round(submit.getBoundingClientRect().left) };
      });
      if (width === 390) await page.screenshot({ path: `${L.SCRATCH}/p20-review-realistic-name-390.png` });
      await ctx.close();
    }
  } catch (e) { out.error = String(e).slice(0, 600); } finally { await browser.close(); }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
