// C3-005: "On this page" offers "Key findings" on Financial foundation, whose handoff has no Key findings passage; it scrolls to a table.
const { main } = require("./lib.cjs");
main("p05-key-findings-label-cp1", async ({ page, report }) => {
  await page.goto(report("modules/CP-1"));
  await page.getByRole("heading", { name: "Financial foundation", exact: true }).waitFor();
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Modules and sections"]');
    const entry = [...nav.querySelectorAll("button")].find((b) => /Key findings/.test(b.textContent));
    const headings = [...document.querySelectorAll("main h2, main h3")].map((h) => h.textContent.trim());
    return { navHasKeyFindings: Boolean(entry), pageHasKeyFindingsHeading: headings.includes("Key findings"), headings: headings.slice(0, 12) };
  });
  let target = null;
  if (r.navHasKeyFindings) {
    await page.locator('nav[aria-label="Modules and sections"] button', { hasText: "Key findings" }).first().click();
    await page.waitForTimeout(500);
    target = await page.evaluate(() => (document.activeElement.querySelector("h2,h3") || {}).textContent || document.activeElement.textContent.slice(0, 40));
  }
  return { defect: r.navHasKeyFindings && !r.pageHasKeyFindingsHeading, expected: "no 'Key findings' entry where the module wrote none (CM-006)", detail: r, entryScrollsTo: target };
});
