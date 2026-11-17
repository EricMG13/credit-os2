// S5-004: a trace control navigates away from the Model; Back returns to a reset page.
import { dist, url, launch, context, text, cleanup, RUN } from "./_lib.mjs";
const browser = await launch();
try {
  const d = dist("fixture");
  const ctx = await context(browser); const page = await ctx.newPage();
  await page.goto(url(d, RUN + "statements")); await page.waitForSelector("main h1");
  await page.locator("label", { hasText: "Downside case" }).first().click();
  await page.evaluate(() => { document.querySelector("main").scrollTop = 1500; });
  const cases = () => page.getByRole("radio", { name: /case$/ }).evaluateAll((rs) => rs.map((r) => r.checked));
  console.log("before: case checked", JSON.stringify(await cases()), "scrollTop", await page.evaluate(() => document.querySelector("main").scrollTop));
  const trace = page.getByRole("link", { name: "Show the sources for Debt by instrument" });
  await trace.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  console.log("after Enter: address", page.url().split("#")[1], "| dialog count", await page.locator("[role=dialog]").count(), "|", (await text(page)).slice(0, 60));
  await page.goBack(); await page.waitForTimeout(500);
  console.log("after Back: case checked", JSON.stringify(await cases()), "scrollTop", await page.evaluate(() => document.querySelector("main").scrollTop), "activeElement", await page.evaluate(() => document.activeElement.tagName));
} finally { await browser.close(); cleanup(); }
