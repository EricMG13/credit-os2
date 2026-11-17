// J3-001: after tracing a Forecast figure to Evidence, the browser's Back lands at the top of the
// Forecast page, not at the figure. Run from the repository root: timeout 600 node <this file>
"use strict";
const lib = require("./_j3lib.cjs");

lib.runProbe("001", async ({ page, origin, id }) => {
  const scroll = () =>
    page.evaluate(() => Math.round(document.querySelector("main").scrollTop));
  await page.goto(`${origin}/report/${id}#forecast`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const figure = page.locator("figure").filter({ hasText: "Revenue" }).first();
  await figure.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const before = await scroll();
  await figure.getByRole("button", { name: /Show sources/ }).first().click();
  await page.getByRole("dialog").getByRole("link", { name: "Open in Evidence" }).click();
  await page.waitForTimeout(1500);
  const onEvidence = await scroll();
  await page.goBack();
  await page.waitForTimeout(2500);
  const after = await scroll();
  const top = await figure.evaluate((el) => Math.round(el.getBoundingClientRect().top));
  const height = page.viewportSize().height;
  return {
    reproduced: top >= height || Math.abs(after - before) > 200,
    summary:
      `Revenue figure traced at scroll ${before}; Evidence opened at scroll ${onEvidence}; ` +
      `after Back scroll is ${after} and the figure's top is ${top} px from the window top ` +
      `(window height ${height}); a position that returns to the figure would be about ${before}.`,
  };
});
