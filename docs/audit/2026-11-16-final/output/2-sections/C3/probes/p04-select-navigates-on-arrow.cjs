// C3-004: below 1001 px the Module <select> navigates on every ArrowDown (change of context on input).
const { main } = require("./lib.cjs");
main("p04-select-navigates-on-arrow", async ({ page, report }) => {
  await page.goto(report("modules/CP-1"));
  await page.getByRole("heading", { name: "Financial foundation", exact: true }).waitFor();
  const sel = page.getByRole("combobox", { name: "Module" });
  await sel.focus();
  const before = await page.evaluate(() => location.hash);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({ hash: location.hash, focus: document.activeElement === document.body ? "BODY" : document.activeElement.tagName }));
  return { defect: after.hash !== before, expected: "browsing options with the arrow keys changes nothing until the choice is committed", before, after };
}, { width: 390, height: 844 });
