// J5-010 (Info): the limits an analyst accepts on the review sheet are not recorded anywhere in the
// finished report. Writes j5-010-review-limits.txt and j5-010-report-texts.txt to $J5_PROBE_OUT.
// Run from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-010-accepted-limits.cjs
"use strict";
const fs = require("node:fs");
const lib = require("./_j5lib.cjs");
const OUT = process.env.J5_PROBE_OUT || "/tmp/jr/j5-scratch/probe-out";
fs.mkdirSync(OUT, { recursive: true });

lib.segment("p010", async ({ page, origin }) => {
  let limits = "";
  // No portfolio workbook and no quotes: the sheet lists a Gap and two Checks; all are accepted.
  const id = await lib.submitRun(page, origin, {
    issuer: "Gapco One", files: ["filing", "agreement"], workbook: false,
    onReview: async (p) => {
      await p.waitForTimeout(800);
      limits = await p.getByRole("region", { name: "Limits to decide" }).innerText();
    },
  });
  await lib.waitEnded(origin, id);
  await lib.waitPublished(origin, id);
  fs.writeFileSync(`${OUT}/j5-010-review-limits.txt`, limits + "\n");
  const tabs = ["overview", "modules/CP-3", "evidence/summary", "evidence/gaps", "evidence/record"];
  let all = "";
  for (const tab of tabs) {
    await page.goto(`${origin}/report/${id}#${tab}`);
    await page.waitForTimeout(1200);
    all += `\n===== #${tab}\n${await page.locator("main").innerText()}\n`;
  }
  fs.writeFileSync(`${OUT}/j5-010-report-texts.txt`, all);
  const phrases = ["No quotes", "price talk", "management claims", "No filed financial report", "accepted"];
  const found = phrases.filter((ph) => all.toLowerCase().includes(ph.toLowerCase()));
  const gapsSays = /This run lists no gaps/.test(all);
  return {
    reproduced: found.length === 0 && gapsSays && /Gap/.test(limits),
    summary: `review sheet limits: ${JSON.stringify(limits.replace(/\s+/g, " ").slice(0, 260))}; accepted-limit phrases found in the report pages: ${JSON.stringify(found)}; Evidence > Gaps says "This run lists no gaps.": ${gapsSays}`,
  };
});
