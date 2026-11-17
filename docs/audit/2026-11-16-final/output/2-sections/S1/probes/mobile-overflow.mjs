// S1-009: at 480 px wide and narrower the rail's content (44 px link + 18 px label) is taller than its box, so the document scrolls by 1 px.
// Run from the repository root: timeout 150 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/mobile-overflow.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  for (const [w, h] of [[320, 640], [390, 844], [480, 800], [481, 800], [767, 900]]) {
    const { browser, page } = await open({ width: w, height: h });
    try {
      await page.goto(pageUrl(dir, "#/model")); await page.waitForSelector("h1"); await sleep(200);
      console.log(`${w}x${h}: ` + JSON.stringify(await page.evaluate(() => ({ documentScrollHeight: document.documentElement.scrollHeight, viewportHeight: document.documentElement.clientHeight, railBottom: document.querySelector("aside").getBoundingClientRect().bottom, railContentBottom: document.querySelector("nav li").getBoundingClientRect().bottom, linkHeight: document.querySelector("nav a").getBoundingClientRect().height, scrollYAfterScrollTo100: (window.scrollTo(0, 100), window.scrollY) }))));
    } finally { await browser.close(); }
  }
} finally { cleanup(); }
