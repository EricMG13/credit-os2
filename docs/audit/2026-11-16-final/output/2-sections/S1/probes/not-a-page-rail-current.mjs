// S1-011: an address that is not a library page is still drawn as Library: the rail marks Library current, and with the data missing every area's address shows the h1 "Library".
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/not-a-page-rail-current.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const fixture = makeDist("fixture");
const missing = makeDist("");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    for (const [name, dir, hash] of [["fixture", fixture, "#/no-such-page"], ["fixture", fixture, "#/model/garbage"], ["data missing", missing, "#/model/transdigm/2025-06-30/front"], ["data missing", missing, "#/run/activity/running"], ["data missing", missing, "#/run/start/context"]]) {
      await page.goto("about:blank"); await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(150);
      console.log(`${name.padEnd(13)} ${hash.padEnd(40)} -> ` + JSON.stringify(await page.evaluate(() => ({ h1: document.querySelector("h1").textContent, current: [...document.querySelectorAll("nav a[aria-current=page]")].map((a) => a.getAttribute("aria-label")), text: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(0, 80) }))));
    }
  } finally { await browser.close(); }
} finally { cleanup(); }
