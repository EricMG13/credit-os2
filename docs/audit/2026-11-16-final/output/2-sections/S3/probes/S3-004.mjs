// S3-004: the six chart kinds the module page receives are drawn as their Table side only; the kit has the charts.
import { existsSync, readFileSync } from "node:fs";
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp();
await run(async ({ browser, say, defect }) => {
  const kit = ["StackChart", "ColumnsChart", "BulletChart", "WaterfallChart", "ScatterPlot", "RangeStripChart", "ChartFrame"].filter((n) => existsSync(`web/src/components/chart/${n}.tsx`));
  say(`chart components present in web/src/components/chart: ${kit.join(", ")}`);
  const src = readFileSync("web/src/pages/library/parts/ChartTableBlock.tsx", "utf8");
  say(`ChartTableBlock.tsx says: ${src.match(/The Chart side[^\n]*\n[^\n]*/)?.[0].replace(/\s+/g, " ")}`);
  const page = await newPage(browser, app.base, modulePath("capital-structure"));
  const cards = await page.locator("#main section").evaluateAll((secs) =>
    secs.filter((s) => s.querySelector("table")).map((s) => ({ name: s.getAttribute("aria-label") ?? s.querySelector("h3")?.textContent, svg: s.querySelectorAll("svg:not([aria-hidden=true]), canvas, [role=img]").length, toggle: !!s.querySelector("[role=radiogroup], [role=tablist]") })));
  for (const c of cards) say(`${c.name}: charts drawn ${c.svg}, Chart/Table toggle ${c.toggle}`);
  const six = cards.filter((c) => /Debt stack|Maturities|Headroom|Liquidity walk|against peers|peer range/.test(c.name ?? ""));
  if (kit.length >= 6 && six.length === 6 && six.every((c) => c.svg === 0 && !c.toggle)) defect("all six chart kinds are tables only: no chart, no Chart or Table toggle, although the kit has the chart components");
});
app.cleanup();
