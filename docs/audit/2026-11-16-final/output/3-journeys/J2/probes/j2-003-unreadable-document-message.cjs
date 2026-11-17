// J2-003: an unreadable document is reported as a Python decoder error, for the first file only, and no row is marked.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-003-unreadable-document-message.cjs
"use strict";
const fs = require("node:fs");
const L = require("./_j2lib.cjs");

const dir = "/tmp/jr/j2-probe-003-input";
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
// A "PDF" that is really a PNG header, and a truncated workbook: files an analyst picks by mistake.
fs.writeFileSync(`${dir}/annual-report.pdf`, Buffer.from("\x89PNG\r\n\x1a\n", "latin1"));
fs.writeFileSync(`${dir}/holdings.xlsx`, fs.readFileSync(`${L.REPO}/proof/northbridge-portfolio.xlsx`).subarray(0, 300));
const pick = (name, type) => ({ name, mimeType: type, buffer: fs.readFileSync(`${dir}/${name}`) });

L.run("j2-probe-003", async ({ page, origin }) => {
  await page.goto(origin + "/start");
  await page.getByLabel("Issuer name", { exact: true }).waitFor();
  await L.fillIssuer(page);
  await page.getByLabel("Documents", { exact: true }).setInputFiles([
    pick("annual-report.pdf", "application/pdf"),
    pick("holdings.xlsx", L.XLSX),
    L.caseFile("northbridge-filing.txt"),
  ]);
  await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
  await L.sleep(2500);
  const alerts = await page.locator("[role=alert]").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  const rows = (await L.text(page)).split("\n").filter((l) => /^(Selected|Inspected|Ignored)$/.test(l.trim()));
  console.log("alerts:", JSON.stringify(alerts));
  console.log("row badges after Inspect:", JSON.stringify(rows));
  const raw = alerts.some((a) => /codec|decode|byte 0x|position \d+/.test(a));
  const oneOnly = alerts.length === 1 && !/holdings/.test(alerts[0]);
  const unmarked = rows.every((r) => r === "Selected");
  console.log(raw && oneOnly && unmarked
    ? "REPRODUCED: one Python decoder message for annual-report.pdf only; holdings.xlsx is not mentioned; every row still reads Selected."
    : "NOT REPRODUCED");
});
