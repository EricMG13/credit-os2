// S1-008: one trailing slash is ignored by the route matcher and by the bare group addresses, but not by #/kit.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/trailing-slash.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    for (const hash of ["#/library", "#/library/", "#/model", "#/model/", "#/library/home", "#/library/home/", "#/kit", "#/kit/"]) {
      await page.goto("about:blank"); await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(150);
      console.log(`${hash.padEnd(16)} -> h1 "${await page.evaluate(() => document.querySelector("h1").textContent)}"`);
    }
  } finally { await browser.close(); }
} finally { cleanup(); }
