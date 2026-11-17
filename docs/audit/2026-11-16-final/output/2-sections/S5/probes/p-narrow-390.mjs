// S5-005, S5-006, S5-007: the Statements table, its tab list and the range strips at 390 px.
import { dist, url, launch, context, cleanup, RUN } from "./_lib.mjs";
const browser = await launch();
try {
  const d = dist("fixture");
  const ctx = await context(browser, { viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  await page.goto(url(d, RUN + "statements")); await page.waitForSelector("main h1"); await page.waitForTimeout(300);
  console.log(JSON.stringify(await page.evaluate(() => {
    const wrap = document.querySelector("div.overflow-x-auto"); const ths = wrap.querySelectorAll("thead th");
    const tl = document.querySelector("[role=tablist]"); const main = document.querySelector("main");
    return {
      "S5-005 table window px": wrap.clientWidth, "label column px": Math.round(ths[0].getBoundingClientRect().width),
      "px left for figure columns": wrap.clientWidth - Math.round(ths[0].getBoundingClientRect().width),
      "S5-006 tab list px": tl.scrollWidth, "card interior px": tl.clientWidth, "tab list overflow-x": getComputedStyle(tl).overflowX,
      "main scrollWidth/clientWidth": [main.scrollWidth, main.clientWidth],
      "tab right edges": [...tl.querySelectorAll("[role=tab]")].map((t) => [t.textContent, Math.round(t.getBoundingClientRect().right)]),
    };
  })));
  await page.goto(url(d, RUN + "forecast")); await page.waitForSelector("main h1"); await page.waitForTimeout(300);
  const strip = page.locator("h3", { hasText: "What drives each case" }).locator("xpath=ancestor::div[contains(@class,'group/trace')][1]");
  await strip.screenshot({ path: process.env.S5_SHOT ?? "/dev/null" }).catch(() => {});
  console.log("S5-007 strips card width px:", await strip.evaluate((c) => Math.round(c.getBoundingClientRect().width)), "(see evidence/forecast-strips-390.png)");
} finally { await browser.close(); cleanup(); }
