// C3-003: switching module keeps the previous module's scroll offset, so the new page opens part-way down.
const { main } = require("./lib.cjs");
main("p03-scroll-after-module-switch", async ({ page, report }) => {
  await page.goto(report("modules/CP-1"));
  await page.getByRole("heading", { name: "Financial foundation", exact: true }).waitFor();
  await page.waitForTimeout(500);
  await page.evaluate(() => { document.querySelector("main").scrollTop = 1500; });
  await page.waitForTimeout(300);
  await page.locator('aside a[href="#modules/CP-2A"]').first().click();
  await page.getByRole("heading", { name: "Downside", exact: true }).first().waitFor();
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const m = document.querySelector("main");
    const bl = [...document.querySelectorAll("main section[aria-label='Bottom line']")][0];
    return { mainScrollTop: m.scrollTop, bottomLineTopInViewport: bl ? Math.round(bl.getBoundingClientRect().top - m.getBoundingClientRect().top) : null, hash: location.hash };
  });
  return { defect: r.mainScrollTop > 300, expected: "the new module's page opens at its top (Bottom line visible)", detail: r };
});
