// Writes the screenshots the S1 findings cite into the evidence folder (clipped, under 300 KB each).
// Run from the repository root: timeout 150 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/evidence-screenshots.mjs
import path from "node:path";
import { makeDist, pageUrl, open, cleanup, sleep, repo } from "./s1-lib.mjs";
const out = path.join(repo, "docs/audit/2026-11-16-final/output/2-sections/S1/evidence");
const dir = makeDist("fixture");
try {
  {
    const { browser, page } = await open({ width: 390, height: 844 });
    try {
      await page.goto(pageUrl(dir, "#/model")); await page.waitForSelector("h1"); await sleep(250);
      await page.screenshot({ path: path.join(out, "rail-390.png"), clip: { x: 0, y: 724, width: 390, height: 120 } });
    } finally { await browser.close(); }
  }
  {
    const { browser, page } = await open({ width: 1440, height: 900 });
    try {
      await page.goto(pageUrl(dir, "#/kit")); await page.waitForSelector("h1"); await sleep(250);
      await page.locator('section[aria-labelledby="kit-metric"]').scrollIntoViewIfNeeded(); await sleep(150);
      await page.screenshot({ path: path.join(out, "kit-metric-cards.png"), clip: { x: 68, y: 0, width: 1372, height: 900 } });
      await page.getByRole("button", { name: "Start run", exact: true }).scrollIntoViewIfNeeded();
      await page.getByRole("button", { name: "Start run", exact: true }).click(); await sleep(400);
      await page.screenshot({ path: path.join(out, "kit-paid-run-dialog.png"), clip: { x: 420, y: 250, width: 600, height: 400 } });
      await page.keyboard.press("Escape"); await sleep(200);
      await page.goto("about:blank"); await page.goto(pageUrl(dir, "#/run")); await page.waitForSelector("h1"); await sleep(400);
      await page.screenshot({ path: path.join(out, "run-bare-cap-usd20.png"), clip: { x: 68, y: 0, width: 1372, height: 420 } });
    } finally { await browser.close(); }
  }
} finally { cleanup(); }
