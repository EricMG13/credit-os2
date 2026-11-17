// The static fixture's Forecast page: the range strip row whose range is null but whose two case
// values are delivered. Shows X1-023. Usage (repository root):
//   node docs/audit/2026-11-16-final/output/2-sections/X1/probes/range-null-row.mjs
import path from "node:path";
import { fixtureDist, launch, newPage, removeFolder, tempFolder } from "./lib.mjs";

const tmp = tempFolder("rangenull");
const base = await fixtureDist(path.join(tmp, "dist"));
const browser = await launch();
try {
  const { context, page, consoleMsgs } = await newPage(browser);
  await page.goto(base + "#/model/transdigm/2025-06-30/forecast");
  await page.waitForSelector("h1");
  await page.waitForTimeout(600);
  console.log(
    await page.evaluate(() =>
      [...document.querySelectorAll("[data-row]")].map((r) => ({
        row: r.querySelector("b")?.textContent,
        sub: r.querySelector("[data-sub]")?.textContent,
        rangeStrips: r.querySelectorAll("[data-range]").length,
        markersDrawn: r.querySelectorAll("[data-marker]").length,
        valueTexts: [...r.querySelectorAll("[data-value]")].map((v) => v.textContent),
        trackText: r.children[1]?.textContent,
      })),
    ),
  );
  console.log("console:", consoleMsgs);
  await context.close();
} finally {
  await browser.close();
  removeFolder(tmp);
}
