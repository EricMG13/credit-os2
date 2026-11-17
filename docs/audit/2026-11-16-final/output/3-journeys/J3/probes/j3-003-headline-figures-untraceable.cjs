// J3-003: the five headline figure cards on Overview carry no trace control, with or without the
// "Show sources" switch. Run from the repository root: timeout 600 node <this file>
"use strict";
const lib = require("./_j3lib.cjs");

lib.runProbe("003", async ({ page, origin, id }) => {
  await page.goto(`${origin}/report/${id}#overview`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const cards = page.locator("main dl > div");
  const count = await cards.count();
  const countButtons = async () => {
    let total = 0;
    for (let i = 0; i < Math.min(count, 50); i += 1) {
      total += await cards.nth(i).locator("button, a").count();
    }
    return total;
  };
  const off = await countButtons();
  const toggle = page.getByRole("switch", { name: /Show sources/ });
  const box = await toggle.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  const switchedOn = await toggle.isChecked();
  const on = await countButtons();
  // For contrast: a figure on a module page does have one.
  await page.goto(`${origin}/report/${id}#modules/CP-1`);
  await page.waitForTimeout(1500);
  const leverage = await page
    .locator("figure")
    .filter({ hasText: "Leverage" })
    .first()
    .getByRole("button", { name: /Show sources/ })
    .count();
  return {
    reproduced: count >= 1 && off === 0 && on === 0,
    summary:
      `${count} headline figure cards on Overview; trace controls inside them: ${off} with the ` +
      `switch off, ${on} with it on (switch checked: ${switchedOn}); the Leverage chart on ` +
      `Financial foundation has ${leverage}.`,
  };
});
