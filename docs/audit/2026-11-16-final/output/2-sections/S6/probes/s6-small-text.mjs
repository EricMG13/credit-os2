// S6-022: text the S6 pages draw below 13 px (D-30), listed by size.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  const found = new Map();
  for (const h of ["#/run/start/documents", "#/run/start/purpose", "#/run/start/context", "#/run/activity/running", "#/run/activity/failed"]) {
    await open(h);
    const rows = await page.evaluate(() => [...document.querySelectorAll("main *")].filter((e) => !e.closest(".sr-only") && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && e.getBoundingClientRect().width > 0)
      .map((e) => [parseFloat(getComputedStyle(e).fontSize), e.textContent.trim().slice(0, 30), e.className.toString().match(/text-(xs|\[9px\])/)?.[0]]).filter(([fs]) => fs < 13));
    for (const [fs, t, c] of rows) found.set(`${fs}px ${c ?? "?"} "${t}"`, h);
  }
  for (const [k, h] of found) console.log(k.padEnd(60), h);
  verdict(found.size > 0 ? 1 : 0);
});
