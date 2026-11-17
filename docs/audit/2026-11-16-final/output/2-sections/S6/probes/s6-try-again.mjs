// S6-009: "Try again" on the unreadable-activity alert is a link to its own address.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  await open("#/run/activity/unreadable");
  const before = await page.locator("main").innerText();
  const href = await page.getByRole("link", { name: "Try again" }).getAttribute("href");
  await page.getByRole("link", { name: "Try again" }).click();
  await page.waitForTimeout(400);
  const after = await page.locator("main").innerText();
  console.log("href:", href, "| address now:", await page.evaluate(() => location.hash), "| page text changed:", before !== after);
  verdict(before === after ? 1 : 0);
});
