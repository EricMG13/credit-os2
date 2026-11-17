// S1-010: Back does not restore the scroll position of the page (main is the scroll container, not the window).
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/back-scroll.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(pageUrl(dir, "#/kit")); await page.waitForSelector("h1"); await sleep(250);
    await page.evaluate(() => { const m = document.querySelector("main"); m.scrollTop = m.scrollHeight; });
    const before = await page.evaluate(() => document.querySelector("main").scrollTop);
    await page.getByRole("link", { name: "Open the library", exact: true }).click(); await sleep(300);
    await page.goBack(); await sleep(400);
    console.log(`kit scrolled to ${before}px; after link and Back: hash ${await page.evaluate(() => location.hash)}, main.scrollTop ${await page.evaluate(() => document.querySelector("main").scrollTop)}`);
  } finally { await browser.close(); }
} finally { cleanup(); }
