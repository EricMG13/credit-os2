// C3-014: the Chart/Table switch is a radiogroup whose arrow keys move focus without selecting and whose radios are each a Tab stop.
const { main } = require("./lib.cjs");
main("p12-radiogroup-arrow", async ({ page, report }) => {
  await page.goto(report("modules/CP-1"));
  const group = page.getByRole("radiogroup", { name: "Leverage: Chart or Table" });
  await group.waitFor();
  const chart = group.getByRole("radio", { name: "Chart" });
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  const afterArrow = { tableChecked: await group.getByRole("radio", { name: "Table" }).getAttribute("aria-checked"), focused: await page.evaluate(() => document.activeElement.textContent) };
  const tabStops = await group.getByRole("radio").evaluateAll((els) => els.map((e) => e.tabIndex));
  return { defect: afterArrow.tableChecked !== "true" || tabStops.every((t) => t === 0), expected: "ARIA radiogroup: Arrow moves and selects; one Tab stop", afterArrow, tabStops };
});
