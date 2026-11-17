// S2 probe: does a link on an S2 page open the next page at its top?
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/scroll-after-navigation.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open({ width: 1440, height: 900 });
const top = () => page.evaluate(() => document.querySelector("main")?.scrollTop ?? -1);
const out = [];
try {
  // 1. Overview, scrolled to the Modules section, then open a module through its item.
  await page.goto(hash(v.url, "/library/halden-aerostructures/2026-09-30/overview"));
  await page.waitForTimeout(500);
  await page.evaluate(() => { const m = document.querySelector("main"); m.scrollTop = m.scrollHeight; });
  await page.waitForTimeout(200);
  out.push(["overview scrollTop before click", await top()]);
  await page.getByRole("link", { name: /^Capital structure/ }).click();
  await page.waitForTimeout(600);
  out.push(["after click, hash", page.url().split("#")[1], "main scrollTop", await top()]);
  out.push(["h1 position top (px from viewport top)", await page.$eval("h1", (e) => Math.round(e.getBoundingClientRect().top))]);
  // 2. History: scroll to the bottom, then follow "Open report" on the oldest entry.
  await page.goto(hash(v.url, "/library/halden-aerostructures/history"));
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.evaluate(() => { const m = document.querySelector("main"); m.scrollTop = m.scrollHeight; });
  await page.waitForTimeout(200);
  out.push(["history scrollTop before click", await top()]);
  await page.getByRole("link", { name: "Open report" }).last().click();
  await page.waitForTimeout(600);
  out.push(["after click, hash", page.url().split("#")[1], "main scrollTop", await top()]);
  out.push(["h1 position top", await page.$eval("h1", (e) => Math.round(e.getBoundingClientRect().top))]);
  // 3. Keyboard: focus after the route change.
  out.push(["focus after route change", await page.evaluate(() => document.activeElement?.tagName)]);
} finally { await browser.close(); v.cleanup(); }
for (const l of out) console.log(...l);
