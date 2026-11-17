// C3-002: after choosing another module in the Modules navigator, keyboard focus drops to <body>.
const { main } = require("./lib.cjs");
main("p02-focus-after-module-switch", async ({ page, report }) => {
  await page.goto(report("modules/CP-1"));
  await page.getByRole("heading", { name: "Financial foundation", exact: true }).waitFor();
  const link = page.locator('aside a[href="#modules/CP-2A"]').first();
  await link.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Downside", exact: true }).first().waitFor();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => { const a = document.activeElement; return a === document.body ? "BODY" : `${a.tagName}[${a.getAttribute("aria-label") || a.getAttribute("href") || (a.textContent || "").slice(0, 30)}]`; });
  return { defect: after === "BODY", expected: "focus stays on the activated entry or moves to the new module heading", activeElementAfterEnter: after };
});
