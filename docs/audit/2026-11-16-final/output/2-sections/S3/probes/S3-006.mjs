// S3-006: the module navigator has no search at the top and no labelled picker on narrow screens (CM-028, CT-044).
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  for (const w of [1440, 390]) {
    const page = await newPage(browser, app.base, modulePath("recovery"), { w, h: 844 });
    const nav = page.getByRole("navigation", { name: "Modules and sections" });
    const inputs = await nav.locator("input, select, [role=combobox], [role=searchbox], [role=listbox]").count();
    const h2 = await page.locator("h2").first().evaluate((e) => Math.round(e.getBoundingClientRect().top));
    const entries = await nav.getByRole("link").count();
    say(`width ${w}: search/picker controls in the navigator: ${inputs}; module links always listed: ${entries}; module heading starts ${h2}px from the top of the viewport`);
    if (inputs === 0) defect(`width ${w}: no search field or picker in the navigator`);
    await page.context().close();
  }
});
app.cleanup();
