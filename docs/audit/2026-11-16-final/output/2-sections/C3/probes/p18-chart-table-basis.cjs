// C3-028: a chart's Table form drops the 'Basis and limitation' column; a row's limitation is visible only in the trace drawer (CM-025, CM-022).
const { main } = require("./lib.cjs");
main("p18-chart-table-basis", async ({ page, report }) => {
  await page.goto(report("modules/CP-1"));
  const group = page.getByRole("radiogroup", { name: "Leverage: Chart or Table" });
  await group.waitFor();
  await group.getByRole("radio", { name: "Table" }).click();
  await page.waitForTimeout(250);
  const tableText = await page.evaluate(() => { let p = document.querySelector('[role=radiogroup][aria-label^="Leverage"]'); for (let k = 0; k < 6; k += 1) { if (p.querySelector("table")) break; p = p.parentElement; } return p.innerText; });
  const trigger = page.locator('button[aria-label="Show sources for FY2024"]').first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  const drawerText = await dialog.innerText();
  const pageText = await page.locator("main").innerText();
  const inTable = /Synthetic/.test(tableText);
  const inDrawer = /Basis and limitation\s+[—-]\s+Synthetic/.test(drawerText);
  return { defect: !inTable && inDrawer, expected: "the table form carries the published rows, unit, basis and source line (CM-025)", leverageTableForm: tableText.replace(/\s+/g, " "), basisAndLimitationInTableForm: inTable, basisAndLimitationInDrawer: inDrawer, sameColumnDrawnInPlainTables: /Synthetic; gross debt includes finance leases/.test(pageText) };
});
