// Completes one synthetic run (with the executed agreement) on a running proof.serve and writes
// its id to /tmp/cs-C4/run-id.txt. Pattern follows 0-baseline/probes/connected/connected-inventory.cjs.
"use strict";
const lib = require("./c4-lib.cjs");
const { BASE, REPO, path, fs } = lib;

async function main() {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const context = await lib.newContext(browser, log);
    const page = await context.newPage();
    await page.goto(`${BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).fill("Northbridge Synthetic Group");
    await page.getByRole("textbox", { name: "As-of date", exact: true }).fill("2025-03-31");
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
    await page.locator("input[type=file]").first().setInputFiles([
      path.join(REPO, "proof", "northbridge-filing.txt"),
      path.join(REPO, "proof", "northbridge-portfolio.xlsx"),
      path.join(REPO, "proof", "northbridge-credit-agreement.txt"),
    ]);
    await page.getByRole("list", { name: "Documents added" }).waitFor();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
    await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
    await page.getByRole("button", { name: "Continue to context", exact: true }).click();
    await page.getByRole("heading", { name: "More context", exact: true }).waitFor();
    await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
    await page.getByRole("button", { name: "Review run", exact: true }).click();
    await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
    await page.waitForTimeout(800);
    const limits = page.getByRole("region", { name: "Limits to decide" });
    for (const box of await limits.getByRole("checkbox").all()) if (!(await box.isChecked())) await box.check();
    await page.getByRole("checkbox", { name: /^Approve:/ }).check();
    await page.getByRole("button", { name: "Submit run", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    if ((await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).count()) !== 1) throw new Error("not synthetic");
    await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
    await page.waitForURL(/\/run\//, { timeout: 20000 });
    const run = page.url().split("/run/")[1];
    let status = "timeout";
    for (let i = 0; i < 200; i += 1) {
      status = await page.getByRole("status").first().innerText().catch(() => "");
      if (/Finished|Failed|Stopped|Interrupted|Cancelled/.test(status)) break;
      await page.waitForTimeout(1500);
    }
    console.log(JSON.stringify({ run, status, blocked: log.blocked }));
    fs.writeFileSync("/tmp/cs-C4/run-id.txt", run + "\n");
  } finally {
    await browser.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
