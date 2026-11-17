// S5-003: every address the Model pages link into the library, and where it lands in the fixture.
import { dist, url, launch, context, text, cleanup, RUN } from "./_lib.mjs";
const browser = await launch();
try {
  const d = dist("fixture");
  const ctx = await context(browser); const page = await ctx.newPage();
  const byHref = new Map();
  for (const r of ["front", "analysis", "statements", "portfolio-fit", "limitations", "forecast"]) {
    await page.goto(url(d, RUN + r)); await page.waitForSelector("main h1");
    for (const [href, name] of await page.locator("main a[href^='#/']").evaluateAll((as) => as.map((a) => [a.getAttribute("href"), a.getAttribute("aria-label") || a.textContent.trim()]))) {
      if (!byHref.has(href)) byHref.set(href, []);
      byHref.get(href).push(name);
    }
  }
  for (const [href, names] of [...byHref].sort()) {
    if (!href.startsWith("#/library/") && href !== "#/") continue;
    await page.goto(url(d, href.slice(1))); await page.waitForTimeout(250);
    console.log(`${String(names.length).padStart(3)} links -> ${href}\n      lands on: ${(await text(page)).slice(0, 110)}`);
  }
  const ids = await page.evaluate(() => 0);
  console.log("distinct trace addresses among 'Show the sources' controls:", new Set([...byHref].filter(([, n]) => n.some((x) => x.startsWith("Show the sources"))).map(([h]) => h)).size);
} finally { await browser.close(); cleanup(); }
