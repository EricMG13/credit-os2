// S1-002: the document title is "Credit OS" on every static address, and a route change moves no focus and announces nothing.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/title-and-route-change.mjs
import { makeDist, pageUrl, open, cleanup, FOCUS, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    const titles = {};
    for (const hash of ["#/", "#/model", "#/run", "#/kit", "#/no-such-page", "#/library/halden-aerostructures/history", "#/library/halden-aerostructures/2026-09-30/overview", "#/model/transdigm/2025-06-30/front"]) {
      await page.goto("about:blank"); await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(200);
      titles[hash] = { title: await page.title(), h1: await page.evaluate(() => document.querySelector("h1").textContent) };
    }
    console.log("titles " + JSON.stringify(titles, null, 1));
    console.log("distinct titles: " + new Set(Object.values(titles).map((t) => t.title)).size + " of " + Object.keys(titles).length);
    // keyboard navigation through the rail
    await page.goto("about:blank"); await page.goto(pageUrl(dir, "#/kit")); await page.waitForSelector("h1"); await sleep(200);
    await page.locator('nav[aria-label="Areas"] a[aria-label="Model"]').focus();
    await page.keyboard.press("Enter"); await sleep(300);
    console.log("after Enter on Model: " + JSON.stringify({ hash: await page.evaluate(() => location.hash), h1: await page.evaluate(() => document.querySelector("h1").textContent), focus: await page.evaluate(FOCUS), title: await page.title(), liveRegions: await page.evaluate(() => document.querySelectorAll("[aria-live],[role=status],[role=alert],[role=log]").length) }));
  } finally { await browser.close(); }
} finally { cleanup(); }
