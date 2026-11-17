// S1-001: "Start a run" on the library home drawn at the bare addresses goes to #/run, which is Run activity (a saved example), not the run start page.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/start-a-run-link.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page, log } = await open({ width: 1440, height: 900 });
  try {
    for (const hash of ["", "#/", "#/library", "#/library/home"]) {
      await page.goto("about:blank"); await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(250);
      const href = await page.evaluate(() => [...document.querySelectorAll("main a")].find((a) => a.textContent.trim() === "Start a run")?.getAttribute("href"));
      await page.getByRole("link", { name: "Start a run" }).first().click(); await sleep(400);
      const landed = await page.evaluate(() => ({ hash: location.hash, h1: document.querySelector("h1")?.textContent, text: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(0, 170) }));
      console.log(`from ${hash || "(empty)"}: link href=${href} -> ${JSON.stringify(landed)}`);
    }
    // the start page itself lives at #/run/start/<draft>
    await page.goto("about:blank"); await page.goto(pageUrl(dir, "#/run/start/context")); await page.waitForSelector("h1"); await sleep(250);
    console.log("start page at #/run/start/context: h1=" + (await page.evaluate(() => document.querySelector("h1").textContent)));
    console.log("log " + JSON.stringify(log));
  } finally { await browser.close(); }
} finally { cleanup(); }
