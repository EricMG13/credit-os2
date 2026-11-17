// S1-020: the skip link's href is "#main"; followed outside the click handler (new tab, middle click, copied link) the hash router draws "Page not found".
// Run from the repository root: timeout 100 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/skip-link-new-tab.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(pageUrl(dir, "#/model")); await page.waitForSelector("h1"); await sleep(200);
    const href = await page.evaluate(() => document.querySelector("a.sr-only, a[href='#main']").getAttribute("href"));
    console.log("skip link href: " + href);
    await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); await sleep(200);
    console.log("Enter on the skip link: hash " + (await page.evaluate(() => location.hash)) + ", h1 " + (await page.evaluate(() => document.querySelector("h1").textContent)));
    await page.goto("about:blank"); await page.goto(pageUrl(dir, "#main")); await page.waitForSelector("h1"); await sleep(200);
    console.log("the same href opened as an address (#main): h1 " + (await page.evaluate(() => document.querySelector("h1").textContent)) + ", main text: " + (await page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "))));
  } finally { await browser.close(); }
} finally { cleanup(); }
