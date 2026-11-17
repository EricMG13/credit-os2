// S1-006: "Clear filters" (library home, no-match state) is missing from the stage 0 inventory, and focus falls to <body> when it is pressed.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/clear-filters-focus.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { makeDist, pageUrl, open, cleanup, FOCUS, sleep, repo } from "./s1-lib.mjs";
const inv = readFileSync(path.join(repo, "docs/audit/2026-11-16-final/output/0-baseline/clickables.jsonl"), "utf8");
console.log("lines in clickables.jsonl that name 'Clear filters': " + (inv.match(/Clear filters/g) ?? []).length);
const dir = makeDist("fixture");
try {
  const { browser, page, log } = await open({ width: 1440, height: 900 });
  try {
    for (const hash of ["#/", "#/library"]) {
      await page.goto("about:blank"); await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(250);
      await page.getByRole("textbox", { name: "Search issuers" }).fill("zzz"); await sleep(250);
      const clear = page.getByRole("button", { name: "Clear filters" });
      await clear.focus(); await page.keyboard.press("Enter"); await sleep(300);
      console.log(`${hash}: after Enter on Clear filters -> cards=${await page.evaluate(() => document.querySelectorAll("main h2").length)}, activeElement is body: ${await page.evaluate(() => document.activeElement === document.body)}, focus=${JSON.stringify((await page.evaluate(FOCUS)).tag)}`);
      await page.keyboard.press("Tab");
      console.log(`${hash}: next Tab lands on: ${JSON.stringify(await page.evaluate(FOCUS))}`);
    }
    console.log("log " + JSON.stringify(log));
  } finally { await browser.close(); }
} finally { cleanup(); }
