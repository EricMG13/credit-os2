// C3-030: the document title is the same for every module ("Modules — <issuer> — Credit OS") and a module change is not announced (D-36, D-43).
const { main } = require("./lib.cjs");
main("p20-module-title-announce", async ({ page, report }) => {
  const titles = {};
  for (const m of ["CP-1", "CP-2A", "CP-6"]) {
    await page.goto("about:blank");
    await page.goto(report(`modules/${m}`));
    await page.waitForTimeout(700);
    titles[m] = await page.title();
  }
  await page.goto(report("modules/CP-1"));
  await page.waitForTimeout(600);
  await page.locator('aside a[href="#modules/CP-2A"]').first().click();
  await page.waitForTimeout(600);
  const liveRegions = await page.evaluate(() => [...document.querySelectorAll("[aria-live], [role=status], [role=alert]")].map((e) => e.textContent.trim().slice(0, 40)));
  const distinct = new Set(Object.values(titles)).size;
  return { defect: distinct === 1 && liveRegions.length === 0, expected: "a title that names the module, and an announcement or focus move when the module changes", titles, liveRegionsAfterModuleChange: liveRegions };
});
