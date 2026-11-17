// S6-007: the "Runs" breadcrumb on any run page goes to #/run, which draws the one run the slice names as current.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  let wrong = 0;
  for (const r of ["failed", "capped", "finished", "interrupted"]) {
    await open(`#/run/activity/${r}`);
    const from = await page.locator("[role=status],[role=alert]").first().innerText().catch(() => "");
    await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Runs" }).click();
    await page.waitForTimeout(250);
    const state = await page.locator("main").innerText();
    const list = await page.locator("main ul li, main table").count();
    const badge = /Running/.test(state) ? "Running" : "other";
    console.log(`from ${r}: Runs -> ${await page.evaluate(() => location.hash)}  shows one run (${badge}), list/table elements for runs: ${await page.locator("main table").count()}`);
    if (badge === "Running") wrong++;
  }
  verdict(wrong > 0 ? 1 : 0);
});
