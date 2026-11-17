// S6-006: the Purpose choice is held in the step's own state and never read by the next step.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  await open("#/run/start/purpose");
  await page.getByText("Earnings update", { exact: true }).click();
  console.log("selected:", JSON.stringify(await page.getByRole("radio", { checked: true }).evaluateAll((e) => e.map((x) => x.getAttribute("aria-label")))));
  await page.getByRole("link", { name: "Next" }).click();
  await page.waitForTimeout(250);
  const t = await page.locator("main").innerText();
  const row = t.match(/Purpose\n([^\n]+)/g);
  console.log("Confirm step rows:", JSON.stringify(row), "| modules:", JSON.stringify(t.match(/Modules\n([^\n]+)/)?.[1]));
  await page.getByRole("link", { name: "Previous" }).click();
  await page.waitForTimeout(250);
  console.log("back on Purpose, selected:", JSON.stringify(await page.getByRole("radio", { checked: true }).evaluateAll((e) => e.map((x) => x.getAttribute("aria-label")))));
  verdict(/Full credit review/.test(t) ? 1 : 0);
});
