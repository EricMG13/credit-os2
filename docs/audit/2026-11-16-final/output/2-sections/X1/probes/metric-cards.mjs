// Three headline-figure cards in the static fixture: the kit MetricCard (components/metric), the library
// MetricTile and the model MetricTile. Shows X1-003. Usage (repository root):
//   node docs/audit/2026-11-16-final/output/2-sections/X1/probes/metric-cards.mjs
import path from "node:path";
import { fixtureDist, launch, newPage, removeFolder, tempFolder } from "./lib.mjs";

const tmp = tempFolder("metric");
const base = await fixtureDist(path.join(tmp, "dist"));
const browser = await launch();
try {
  const { context, page } = await newPage(browser);
  const grab = async (addr, cardSel, figSel) => {
    await page.goto(base + addr);
    await page.waitForSelector("h1");
    await page.waitForTimeout(500);
    return page.evaluate(([cardSel, figSel]) => {
      const card = document.querySelector(cardSel);
      if (!card) return null;
      const fig = card.querySelector(figSel) ?? card;
      const c = getComputedStyle(card);
      const f = getComputedStyle(fig);
      return { figure: `${f.fontSize} ${f.fontFamily.split(",")[0]}`, radius: c.borderRadius, padding: c.padding, shadow: c.boxShadow === "none" ? "none" : "yes", sample: fig.textContent.trim().slice(0, 12) };
    }, [cardSel, figSel]);
  };
  console.log("MetricCard (components/metric, #/model/transdigm/2025-06-30/portfolio-fit):", await grab("#/model/transdigm/2025-06-30/portfolio-fit", "article.rounded-lg", "span.tabular-nums"));
  console.log("library MetricTile (#/library/halden-aerostructures/2026-09-30/overview):", await grab("#/library/halden-aerostructures/2026-09-30/overview", "li.rounded-xl", "[class*='text-[30px]']"));
  console.log("model MetricTile (#/model/transdigm/2025-06-30/front):", await grab("#/model/transdigm/2025-06-30/front", "article.rounded-ds-lg", "span.tabular-nums"));
  await context.close();
} finally {
  await browser.close();
  removeFolder(tmp);
}
