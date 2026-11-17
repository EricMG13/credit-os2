// S2 probe: a 70-character qualifier on a For-and-against point at 1440, 390 and 320 px.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/long-qualifier.mjs [shotPath390]
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant((l) => {
  const r = l.slice.issuers.find((i) => i.id === "halden-aerostructures").runs.find((x) => x.id === "2026-09-30");
  r.overview.sides.columns[0].items[0].qualifier = "Unhedged portion estimated by management from the last hedging schedule";
});
try {
  for (const width of [1440, 390, 320]) {
    const { browser, page } = await open({ width });
    try {
      await page.goto(hash(v.url, "/library/halden-aerostructures/2026-09-30/overview"));
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => { const m = document.querySelector("main"); const badge = [...document.querySelectorAll("main span")].find((s) => s.textContent.startsWith("Unhedged portion estimated by")); const li = badge.closest("li").getBoundingClientRect(); return { pageScrollsSidewaysBy: m.scrollWidth - m.clientWidth, badgeRight: Math.round(badge.getBoundingClientRect().right), tileRight: Math.round(li.right), viewport: innerWidth }; });
      console.log(width, JSON.stringify(r), r.badgeRight > r.tileRight ? "-> badge leaves its tile" : "ok");
      if (width === 390 && process.argv[2]) { await page.locator("li:has-text('Unhedged portion estimated by')").first().scrollIntoViewIfNeeded(); await page.screenshot({ path: process.argv[2] }); }
    } finally { await browser.close(); }
  }
} finally { v.cleanup(); }
