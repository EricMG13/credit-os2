// S5-008: metric definitions (Front page) and n.a. or Withheld reasons (Statements) are hover/focus tooltips; a tap shows nothing.
import { dist, url, launch, context, cleanup, RUN } from "./_lib.mjs";
const browser = await launch();
try {
  const withReasons = (runs) => { for (const s of runs[0].statements.statements) for (const row of s.rows) for (const e of row.cells) for (const c of [].concat(e)) if (c.kind !== "figure") c.reason = "The sources do not state it."; };
  const d = dist("reasons", withReasons);
  const tips = (p) => p.locator("[role=tooltip]").allInnerTexts();
  for (const [label, opts] of [["desktop, keyboard focus", {}], ["touch, tap", { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }]]) {
    const ctx = await context(browser, opts); const page = await ctx.newPage();
    await page.goto(url(d, RUN + "front")); await page.waitForSelector("main h1");
    const about = page.getByRole("button", { name: "About Net leverage" });
    if (opts.hasTouch) await about.tap(); else await about.focus();
    await page.waitForTimeout(600);
    console.log(`[${label}] Front: definition tooltip ->`, JSON.stringify(await tips(page)));
    await page.goto(url(d, RUN + "statements")); await page.waitForSelector("main h1");
    await page.getByRole("tab", { name: "Cash flow" }).click();
    const cell = page.locator("tbody tr", { hasText: "Cash interest" }).locator("td").nth(1).getByRole("button");
    if (opts.hasTouch) await cell.tap(); else await cell.focus();
    await page.waitForTimeout(600);
    console.log(`[${label}] Statements: n.a. reason tooltip ->`, JSON.stringify(await tips(page)));
    await ctx.close();
  }
} finally { await browser.close(); cleanup(); }
