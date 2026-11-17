// S1-003: on a phone-width screen the visible label under each rail icon is not part of the link: tapping it does nothing, and the label is read twice.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/rail-label-tap.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 390, height: 844 });
  try {
    await page.goto(pageUrl(dir, "#/kit")); await page.waitForSelector("h1"); await sleep(250);
    const geo = await page.evaluate(() => [...document.querySelectorAll("nav[aria-label=Areas] li")].map((li) => { const a = li.querySelector("a").getBoundingClientRect(); const s = li.querySelector("span").getBoundingClientRect(); return { name: li.querySelector("a").getAttribute("aria-label"), link: [Math.round(a.width), Math.round(a.height)], label: [Math.round(s.width), Math.round(s.height)], labelInsideLink: li.querySelector("a").contains(li.querySelector("span")), labelFontPx: getComputedStyle(li.querySelector("span")).fontSize }; }));
    console.log("geometry " + JSON.stringify(geo));
    await page.locator('nav[aria-label="Areas"] li:nth-child(2) span').click(); await sleep(300);
    console.log("tap on the label 'Model': hash is " + (await page.evaluate(() => location.hash)) + " (expected #/model)");
    await page.locator('nav[aria-label="Areas"] a[aria-label="Model"]').click(); await sleep(300);
    console.log("tap on the icon 'Model': hash is " + (await page.evaluate(() => location.hash)));
    console.log(await page.locator('nav[aria-label="Areas"]').ariaSnapshot());
  } finally { await browser.close(); }
} finally { cleanup(); }
