// S6-002: confirming the Submit dialog on the static Start step removes the opener; focus falls to <body>.
import { active, verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  await open("#/run/start/start");
  const submit = page.getByRole("button", { name: /^Submit, spend up to/ });
  await submit.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  console.log("dialog open, focus:", await active(page));
  await page.getByRole("button", { name: /^Start run, up to/ }).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  const after = await active(page);
  const status = await page.locator("[role=status]").count();
  console.log("after confirm: hash", await page.evaluate(() => location.hash), "| focus:", after, "| role=status elements:", status);
  verdict(after === "body" ? 1 : 0);
});
