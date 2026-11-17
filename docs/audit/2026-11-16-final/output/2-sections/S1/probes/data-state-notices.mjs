// S1-012 and S1-013: the data states of the static app are one bare sentence; unlike causes read alike; the reader's own reason is drawn raw; any other schema string is called "newer".
// Run from the repository root: timeout 200 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/data-state-notices.mjs
import { rmSync } from "node:fs";
import path from "node:path";
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const variants = {
  "data.js file absent": null,
  "data.js has a syntax error": "window.CREDIT_OS_DATA = {;",
  "data.js sets nothing": "",
  "window.CREDIT_OS_DATA = null": "window.CREDIT_OS_DATA = null;",
  "issuers is a string": 'window.CREDIT_OS_DATA = { schema: "credit-os-data/1", issuers: "x" };',
  "schema credit-os-data/2 (newer)": 'window.CREDIT_OS_DATA = { schema: "credit-os-data/2", issuers: [] };',
  "schema credit-os-data/0 (older)": 'window.CREDIT_OS_DATA = { schema: "credit-os-data/0", issuers: [] };',
  "schema is some other string": 'window.CREDIT_OS_DATA = { schema: "something-else", issuers: [] };',
  "library slice is invalid": 'window.CREDIT_OS_DATA = { schema: "credit-os-data/1", issuers: [], library: { nope: 1 } };',
  "model slice is not an object": 'window.CREDIT_OS_DATA = { schema: "credit-os-data/1", issuers: [], model: 7 };',
};
try {
  const { browser, page, log } = await open({ width: 1440, height: 900 });
  try {
    for (const [name, text] of Object.entries(variants)) {
      const dir = makeDist(text ?? "");
      if (text === null) rmSync(path.join(dir, "data.js"));
      const hash = name.startsWith("model") ? "#/model" : "#/library/home";
      await page.goto("about:blank"); await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(200);
      console.log(`${name.padEnd(34)} ${hash.padEnd(15)} -> ` + JSON.stringify(await page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "))));
    }
    const dir = makeDist("shipped");
    await page.goto("about:blank"); await page.goto(pageUrl(dir, "#/no-such-page")); await page.waitForSelector("h1"); await sleep(150);
    console.log(`${"address with no page".padEnd(34)} ${"#/no-such-page".padEnd(15)} -> ` + JSON.stringify(await page.evaluate(() => ({ main: document.querySelector("main").innerText.replace(/\s+/g, " "), linksInMain: document.querySelectorAll("main a, main button").length }))));
  } finally { await browser.close(); }
} finally { cleanup(); }
