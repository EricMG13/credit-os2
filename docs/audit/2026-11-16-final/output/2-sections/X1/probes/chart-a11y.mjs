// The Trend chart on the kit page: what the drawing exposes to assistive technology.
// Shows X1-007. Usage (repository root): node docs/audit/2026-11-16-final/output/2-sections/X1/probes/chart-a11y.mjs
import { launch, newPage, kitUrl } from "./lib.mjs";

const browser = await launch();
try {
  const { context, page, blocked, consoleMsgs } = await newPage(browser);
  await page.goto(kitUrl);
  await page.waitForSelector("h1");
  const svg = page.locator("figure").first().locator("svg.recharts-surface");
  const attrs = await svg.evaluate((e) => ({
    role: e.getAttribute("role"),
    tabindex: e.getAttribute("tabindex"),
    ariaLabel: e.getAttribute("aria-label"),
    ariaDescribedby: e.getAttribute("aria-describedby"),
    title: e.querySelector("title")?.textContent,
    desc: e.querySelector("desc")?.textContent ?? null,
  }));
  console.log("chart svg:", attrs);
  console.log(await page.locator("figure").first().ariaSnapshot());
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  console.log("tooltip after ArrowRight:", await page.evaluate(() => document.querySelector(".recharts-tooltip-wrapper")?.textContent));
  console.log("blocked:", blocked, "console:", consoleMsgs);
  await context.close();
} finally {
  await browser.close();
}
