// Low findings S5-010, S5-011, S5-012, S5-017, S5-019: case state, copy that says every chart follows the case,
// tables with no row trace controls, the document title and the Bars view's sign cue.
import { dist, url, launch, context, cleanup, RUN } from "./_lib.mjs";
const browser = await launch();
try {
  const d = dist("fixture");
  const ctx = await context(browser); const page = await ctx.newPage();
  const checked = () => page.getByRole("radio", { name: /case$/ }).evaluateAll((rs) => rs.map((r) => r.checked));
  await page.goto(url(d, RUN + "statements")); await page.waitForSelector("main h1");
  console.log("S5-011 copy on Statements:", (await page.locator("main section").first().innerText()).replace(/\s+/g, " ").slice(0, 120));
  await page.locator("label", { hasText: "Downside case" }).first().click();
  console.log("S5-010 Statements, Downside chosen:", JSON.stringify(await checked()));
  const tabs = page.getByRole("navigation", { name: "Pages" }); await tabs.getByRole("link", { name: "Portfolio fit" }).click(); await page.waitForTimeout(200); await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Model" }).click(); await page.waitForTimeout(300);
  console.log("S5-010 after Portfolio fit and back to Model:", JSON.stringify(await checked()));
  await page.goto(url(d, RUN + "forecast")); await page.waitForSelector("main h1");
  console.log("S5-010 Forecast after choosing Downside on Statements:", JSON.stringify(await checked()));
  for (const r of ["analysis", "statements", "portfolio-fit", "forecast"]) {
    await page.goto(url(d, RUN + r)); await page.waitForSelector("main h1");
    const groups = page.locator('[role=radiogroup][aria-label$="Chart or Table"]'); const n = await groups.count(); const out = [];
    for (let i = 0; i < n; i++) {
      const g = groups.nth(i);
      await g.getByRole("radio", { name: "Table", exact: true }).click();
      out.push((await g.getAttribute("aria-label")).replace(": Chart or Table", "") + "=" + await g.evaluate((x) => x.closest("[class*='group/trace']").querySelectorAll("tbody a[aria-label^='Show the sources']").length));
    }
    console.log(`S5-012 ${r}: row trace controls per table form ->`, out.join("; "));
  }
  console.log("S5-017 document.title:", await page.title(), "| address", page.url().split("#")[1]);
  await page.goto(url(d, RUN + "statements")); await page.waitForSelector("main h1");
  await page.getByRole("radio", { name: "Bars", exact: true }).click();
  console.log("S5-019 Bars view, Depreciation row, sign and bar side:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("tbody tr")][3].querySelectorAll("td")[0].querySelector("[data-bar]").dataset.sign + " / margin-left " + getComputedStyle(document.querySelector("[data-bar]")).marginLeft)));
} finally { await browser.close(); cleanup(); }
