// S1-016: the top-level `issuers` list is read only by an unreachable branch of App.tsx, yet one malformed entry turns every page into "Library data is missing".
// Run from the repository root: timeout 150 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/issuers-list-coupling.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { makeDist, pageUrl, open, cleanup, sleep, repo } from "./s1-lib.mjs";
console.log("readers of data.issuers in web/src (outside tests and Signal):");
console.log("  App.tsx lines 31 and 36 (inside LibraryBody, reached only when the result is ok and no route matched)");
const good = makeDist("fixture");
const bad = makeDist("fixture");
const text = readFileSync(path.join(bad, "data.js"), "utf8");
const obj = JSON.parse(JSON.parse(text.match(/JSON\.parse\((".*")\);/s)[1]));
obj.issuers = [{ id: "x" }];
writeFileSync(path.join(bad, "data.js"), "window.CREDIT_OS_DATA = " + JSON.stringify(obj) + ";");
const noSlice = makeDist('window.CREDIT_OS_DATA = { schema: "credit-os-data/1", issuers: [{ id: "a", name: "Acme" }] };');
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    for (const [name, dir, hash] of [["complete fixture", good, "#/library/home"], ["one issuers entry without a name, every slice intact", bad, "#/library/home"], ["one issuers entry without a name, every slice intact", bad, "#/model"], ["one issuers entry without a name, every slice intact", bad, "#/library/halden-aerostructures/2026-09-30/overview"], ["issuers lists Acme, no library slice (the 'No runs yet' / issuer-name branch is never drawn)", noSlice, "#/"]]) {
      await page.goto("about:blank"); await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(200);
      console.log(`${name} ${hash}: ` + JSON.stringify(await page.evaluate(() => ({ h1: document.querySelector("h1").textContent, main: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(0, 70) }))));
    }
  } finally { await browser.close(); }
} finally { cleanup(); }
