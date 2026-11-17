// C3-006: the trace drawer prints a module code in a sentence the service wrote ("not in the CP-0 inventory") (D-13 part 1).
const { main } = require("./lib.cjs");
main("p06-drawer-module-code", async ({ page, report }) => {
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  const hits = [];
  const buttons = page.getByRole("button", { name: "Show sources for this passage" });
  const n = await buttons.count();
  for (let i = 0; i < n; i += 1) {
    await buttons.nth(i).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    const text = await dialog.innerText();
    const m = text.match(/.*\bCP-[0-9A-Z]+\b.*/g);
    if (m) hits.push({ trigger: i, lines: m });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }
  return { defect: hits.length > 0, expected: "no module code in the drawer's own sentences (the module's name instead)", hits };
});
