// P19: very long unbroken text on the review sheet at 390 px and 1440 px: a 200-character file name, a 150-character issuer
// name, a long research question and note. Measures horizontal overflow of the page and of any element, and where the
// "Limits to decide" section sits on the sheet. JSON out.
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p19-long-text-review.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
const fs = require("node:fs");
const LONG = "long-" + "a".repeat(200) + ".txt";
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    for (const [width, height] of [[390, 6000], [1440, 3200]]) {
      const ctx = await L.context(browser, { log, width, height });
      const page = await ctx.newPage();
      L.watch(page, log);
      await page.goto(`${L.BASE}/start`);
      await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
      await page.getByRole("textbox", { name: "Issuer name", exact: true }).fill("N".repeat(150));
      await page.getByRole("textbox", { name: "As-of date", exact: true }).fill("2025-03-31");
      await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
      await page.locator("input[type=file]").first().setInputFiles([L.FILES.filing, L.FILES.workbook, `/tmp/cs-C2/files/${LONG}`]);
      await page.getByRole("list", { name: "Documents added" }).waitFor();
      out[`rows${width}`] = await page.locator("[aria-label='Documents added'] li").count();
      const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      await L.toPurpose(page);
      await L.toContext(page);
      await page.getByRole("textbox", { name: "Anything the analysis should know" }).fill("Z".repeat(400) + " tail");
      await page.locator("summary", { hasText: "Issuer details" }).click();
      await page.getByRole("textbox", { name: "Borrower (legal entity)" }).fill("B".repeat(180));
      await page.getByRole("button", { name: "Add research question" }).click();
      await page.getByRole("textbox", { name: "Question", exact: true }).fill("Q".repeat(300));
      await page.getByRole("button", { name: "Review run" }).click();
      await page.waitForTimeout(2500);
      out[`alerts${width}`] = await page.locator("[role=alert]").allInnerTexts();
      out[`heading${width}`] = await page.$$eval("h2", (h) => h[0].textContent);
      if (out[`heading${width}`] === "Review and start") {
        const m = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const wide = [...document.querySelectorAll("main *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1; }).slice(0, 8).map((e) => `${e.tagName.toLowerCase()} right=${Math.round(e.getBoundingClientRect().right)} "${e.textContent.trim().slice(0, 30)}"`);
          const lim = [...document.querySelectorAll("h3")].find((h) => h.textContent === "Limits to decide");
          const scroller = document.querySelector("main");
          return { pageOverflow: document.documentElement.scrollWidth - vw, wide, limitsTop: Math.round(lim.getBoundingClientRect().top - document.querySelector("h1").getBoundingClientRect().top), pageHeight: scroller.scrollHeight, notGiven: document.body.innerText.split("\n").filter((l) => l.trim() === "Not given").length, sheetBlocks: [...document.querySelectorAll("[role=group]")].length, acceptLabels: [...document.querySelectorAll("label")].map((l) => l.textContent.trim()).filter((t) => /^I (accept|have)/.test(t)) };
        });
        out[`review${width}`] = m;
        await page.screenshot({ path: `${L.SCRATCH}/p19-review-long-${width}.png` });
      }
      out[`docOverflow${width}`] = docOverflow;
      await ctx.close();
    }
  } catch (e) { out.error = String(e).slice(0, 600); } finally { await browser.close(); }
  out.log = log;
  console.log(JSON.stringify(out, null, 1));
})();
