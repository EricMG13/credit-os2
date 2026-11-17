// Low findings S5-016, S5-021, S5-025: bare empty state, a long unbroken word in the breadcrumb, heading levels.
import { dist, url, launch, context, text, cleanup, RUN, web } from "./_lib.mjs";
import path from "node:path";
const browser = await launch();
try {
  const ctx = await context(browser); const page = await ctx.newPage();
  await page.goto(url(path.join(web, "dist"), "/model/runs")); await page.waitForTimeout(300);
  console.log("S5-016 shipped #/model/runs:", await text(page), "| images/icons in main:", await page.locator("main svg, main img").count(), "| links in main:", await page.locator("main a").count());
  const d = dist("fixture");
  for (const r of ["analysis", "forecast"]) {
    await page.goto(url(d, RUN + r)); await page.waitForSelector("main h1");
    console.log(`S5-025 ${r}:`, (await page.locator("h1,h2,h3,h4").evaluateAll((hs) => hs.map((h) => h.tagName + " " + h.textContent.trim().slice(0, 26)))).join(" | "));
  }
  const long = dist("long", (runs) => { runs[0].header.issuerName = "Holdings" + "x".repeat(60); });
  const narrow = await context(browser, { viewport: { width: 390, height: 844 } }); const p2 = await narrow.newPage();
  await p2.goto(url(long, RUN + "front")); await p2.waitForSelector("main h1"); await p2.waitForTimeout(300);
  console.log("S5-021 390px, issuer name with a 68-character word: main scrollWidth/clientWidth", await p2.evaluate(() => [document.querySelector("main").scrollWidth, document.querySelector("main").clientWidth]), "breadcrumb right edge", await p2.evaluate(() => Math.round(document.querySelector("nav[aria-label=Breadcrumb]").getBoundingClientRect().right)));
} finally { await browser.close(); cleanup(); }
