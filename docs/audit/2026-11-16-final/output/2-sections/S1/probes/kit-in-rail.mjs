// S1-004: the Kit page is offered in the static rail; it shows sample figures, buttons that do nothing and looping animations.
// Run from the repository root: timeout 150 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/kit-in-rail.mjs
import { makeDist, pageUrl, shippedUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page, log } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(shippedUrl("")); await page.waitForSelector("h1"); await sleep(200);
    console.log("rail on the shipped (empty) library: " + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("nav[aria-label=Areas] a")].map((a) => a.getAttribute("aria-label") + " " + a.getAttribute("href")))));
    await page.getByRole("link", { name: "Kit", exact: true }).click(); await sleep(300);
    console.log("Kit opens: " + (await page.evaluate(() => location.hash + " h1=" + document.querySelector("h1").textContent)));
    console.log("sample figures drawn as metric cards: " + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("article")].map((a) => a.innerText.replace(/\s+/g, " ")))));
    console.log("any 'sample' wording in the Metric card section: " + (await page.evaluate(() => /sample/i.test(document.querySelector('section[aria-labelledby=kit-metric]').innerText))));
    // sample controls with no effect: press each and compare the address, dialog count and page text length
    const names = ["Primary", "Secondary", "Tertiary", "Primary destructive", "Add sources", "Open run", "Action", "Leading icon", "Trailing icon"];
    const results = [];
    for (const n of names) {
      const b = page.getByRole("button", { name: n, exact: true }).first();
      await b.scrollIntoViewIfNeeded();
      const before = await page.evaluate(() => ({ h: location.hash, d: document.querySelectorAll("[role=dialog]").length, t: document.querySelector("main").innerText.length }));
      await b.click(); await sleep(150);
      const after = await page.evaluate(() => ({ h: location.hash, d: document.querySelectorAll("[role=dialog]").length, t: document.querySelector("main").innerText.length }));
      results.push({ n, changed: JSON.stringify(before) !== JSON.stringify(after) });
    }
    console.log("buttons whose press changes nothing: " + JSON.stringify(results));
    // the paid-run sample
    await page.getByRole("button", { name: "Start run", exact: true }).click(); await sleep(300);
    console.log("paid-run sample dialog: " + (await page.getByRole("dialog").innerText()).replace(/\s+/g, " "));
    await page.getByRole("button", { name: "Start the run" }).click(); await sleep(300);
    console.log("after 'Start the run': dialogs=" + (await page.getByRole("dialog").count()) + " hash=" + (await page.evaluate(() => location.hash)));
    console.log("sample input labelled Reporting currency: " + (await page.getByRole("textbox", { name: "Reporting currency" }).count()));
    console.log("running animations: " + JSON.stringify(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity).map((a) => a.animationName))));
    console.log("log " + JSON.stringify(log));
  } finally { await browser.close(); }
} finally { cleanup(); }
