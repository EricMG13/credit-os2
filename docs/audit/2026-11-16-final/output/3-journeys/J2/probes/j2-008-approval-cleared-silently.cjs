// J2-008 (Low): changing the purpose after approving clears the approval and every limit decision,
// and nothing on the review sheet says that this happened or why.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-008-approval-cleared-silently.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-008", async ({ page, origin }) => {
  await L.toApproved(page, origin); // Full credit assessment, three limits accepted, summary approved
  const before = await L.text(page);
  const readiness = (t) => t.slice(t.indexOf("Readiness")).replace(/\n+/g, " | ").slice(0, 330);
  console.log("approved (Full):", readiness(before));
  console.log("approval ticked:", await L.consentBox(page).isChecked());

  await page.getByRole("button", { name: "Edit purpose and modules" }).click();
  await page.getByText("Lite credit assessment", { exact: true }).first().click();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page.getByLabel(/Anything the analysis should know/u).waitFor();
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  await page.getByRole("button", { name: /^Submit/ }).waitFor();
  await L.sleep(1000);

  const after = await L.text(page);
  console.log("after changing purpose to Lite:", readiness(after));
  console.log("approval ticked:", await L.consentBox(page).isChecked());
  const limits = await page.getByRole("region", { name: "Limits to decide" }).getByRole("checkbox").evaluateAll((els) => els.map((e) => e.checked));
  console.log("limit boxes ticked:", JSON.stringify(limits));
  console.log("Submit disabled:", await page.getByRole("button", { name: /^Submit/ }).isDisabled());
  const explains = /cleared|no longer|changed|approval was|approve again|start again|reset/i.test(after.slice(after.indexOf("Limits to decide")));
  console.log("sheet says why the approval and decisions were cleared:", explains);
  console.log(!explains && limits.every((c) => c === false)
    ? "REPRODUCED: approval and decisions cleared; the sheet only counts '0 of 2' and never says they were cleared or why."
    : "NOT REPRODUCED");
});
