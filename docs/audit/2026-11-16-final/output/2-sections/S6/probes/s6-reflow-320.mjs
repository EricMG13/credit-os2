// S6-013: at 320 CSS px the Start step's Submit button (whitespace-nowrap, 307 px) is wider than the card and the page.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, ctxFor }) => {
  let fails = 0;
  for (const width of [390, 320]) {
    const ctx = await ctxFor({ width, height: 700 });
    const page = await ctx.newPage();
    await open("#/run/start/start", page);
    const r = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("main button")].find((b) => b.textContent.includes("Submit"));
      const card = document.querySelector("main .shadow-1").getBoundingClientRect();
      const m = document.querySelector("main");
      return { viewport: innerWidth, cardRight: Math.round(card.right), button: [Math.round(btn.getBoundingClientRect().left), Math.round(btn.getBoundingClientRect().right)], mainScrollWidth: m.scrollWidth, mainClientWidth: m.clientWidth, nowrap: getComputedStyle(btn).whiteSpace };
    });
    const over = r.cardRight > r.viewport - 15 || r.mainScrollWidth > r.mainClientWidth;
    if (over) fails++;
    console.log(width, JSON.stringify(r), over ? "<< card past the right gutter or main scrolls sideways" : "");
  }
  verdict(fails);
});
