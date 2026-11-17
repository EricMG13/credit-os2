// S5-001 and S5-002: a run with no forecast (or one case, or one failing part) is unreadable as a whole,
// and the reader's raw path text is what the page shows.
import { dist, url, launch, context, text, cleanup, blocked } from "./_lib.mjs";
const browser = await launch();
try {
  const variants = {
    "no forecast": (runs) => { delete runs[0].forecast; },
    "one case": (runs) => { runs[0].cases = runs[0].cases.slice(0, 1); },
    "front.headline removed from one of two runs": (runs) => {
      const second = structuredClone(runs[0]); second.run = "2023-06-30"; delete second.front.headline; runs.push(second);
    },
  };
  for (const [name, edit] of Object.entries(variants)) {
    const d = dist("v", edit);
    const ctx = await context(browser); const page = await ctx.newPage();
    const addr = name.startsWith("front") ? "/model/transdigm/2023-06-30/front" : "/model/transdigm/2025-06-30/forecast";
    await page.goto(url(d, "/model/runs")); await page.waitForTimeout(300);
    console.log(`[${name}] index: ${await text(page)}`);
    await page.goto(url(d, addr)); await page.waitForTimeout(300);
    console.log(`[${name}] ${addr}: ${await text(page)}`);
    await ctx.close();
  }
  console.log("blocked:", JSON.stringify(blocked));
} finally { await browser.close(); cleanup(); }
