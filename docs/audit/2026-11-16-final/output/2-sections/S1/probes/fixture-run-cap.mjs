// S1-007: the bare #/run draws a "Full credit review" with a spend bar capped at USD 20.00; the Full tier cap is USD 25 (R-09).
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/fixture-run-cap.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { makeDist, pageUrl, open, cleanup, sleep, repo } from "./s1-lib.mjs";
const run = JSON.parse(readFileSync(path.join(repo, "web/fixtures/run.json"), "utf8")).slice;
console.log("fixture runs: " + JSON.stringify(run.runs.filter((r) => r.spend).map((r) => [r.id, r.labels[0], r.spend.bar?.label ?? r.spend])));
console.log("docs/rulings/2026-11-15-pathway-tiers-and-caps.md says: " + readFileSync(path.join(repo, "docs/rulings/2026-11-15-pathway-tiers-and-caps.md"), "utf8").split("\n").filter((l) => /Full|Lite|Deep/.test(l) && /25|15|40/.test(l)).slice(0, 3).join(" // "));
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(pageUrl(dir, "#/run")); await page.waitForSelector("h1"); await sleep(300);
    const t = await page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "));
    console.log("on screen at #/run: " + t.slice(t.indexOf("Running"), t.indexOf("Running") + 160));
  } finally { await browser.close(); }
} finally { cleanup(); }
