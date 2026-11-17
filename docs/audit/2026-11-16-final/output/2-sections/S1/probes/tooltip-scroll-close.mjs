// S1-005: a tooltip opened by keyboard focus is closed by the scroll that the same focus causes; it survives only when nothing scrolls.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/tooltip-scroll-close.mjs
import { makeDist, pageUrl, open, cleanup, FOCUS, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
const tips = (page) => page.locator("[role=tooltip]").allTextContents();
try {
  const { browser, page, log } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(pageUrl(dir, "#/kit")); await page.waitForSelector("h1"); await sleep(200);
    await page.evaluate(() => { window.__ev = []; const t0 = performance.now(); new MutationObserver((ms) => { for (const m of ms) for (const n of [...m.addedNodes, ...m.removedNodes]) if (n.nodeType === 1 && (n.matches?.("[role=tooltip]") || n.querySelector?.("[role=tooltip]"))) window.__ev.push(`${m.addedNodes.length ? "tooltip added" : "tooltip removed"} @${Math.round(performance.now() - t0)}ms`); }).observe(document.body, { childList: true, subtree: true }); document.querySelector("main").addEventListener("scroll", () => window.__ev.push(`main scroll @${Math.round(performance.now() - t0)}ms`)); });
    await page.evaluate(() => document.querySelector('a[href="#main"]').focus());
    for (let i = 0; i < 120; i++) { await page.keyboard.press("Tab"); await sleep(30); if ((await page.evaluate(FOCUS)).label === "About Net leverage") break; }
    await sleep(1200);
    console.log("1. Tab onto 'About Net leverage' (the page scrolls to it): events=" + JSON.stringify(await page.evaluate(() => window.__ev)) + " tooltips now=" + JSON.stringify(await tips(page)));
    await page.evaluate(() => { window.__ev.length = 0; });
    await page.keyboard.press("Shift+Tab"); await sleep(250); await page.keyboard.press("Tab"); await sleep(900);
    console.log("2. leave and re-enter with no scroll: tooltips now=" + JSON.stringify(await tips(page)));
    await page.evaluate(() => { document.querySelector("main").scrollTop += 3; }); await sleep(400);
    console.log("3. scroll main by 3px while it is open: tooltips now=" + JSON.stringify(await tips(page)));
    console.log("log " + JSON.stringify(log));
  } finally { await browser.close(); }
} finally { cleanup(); }
