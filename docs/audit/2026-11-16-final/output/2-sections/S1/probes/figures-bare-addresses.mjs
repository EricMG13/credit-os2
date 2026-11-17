// Compares figures drawn at the bare addresses #/, #/model and #/run (fixture data) with the fixture JSON they come from.
// Run from the repository root: timeout 200 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/figures-bare-addresses.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { makeDist, pageUrl, open, cleanup, sleep, repo } from "./s1-lib.mjs";
const fx = (g) => JSON.parse(readFileSync(path.join(repo, "web", "fixtures", `${g}.json`), "utf8"));
const lib = fx("library").slice, model = fx("model").slice, run = fx("run").slice;
const dir = makeDist("fixture");
const rows = [];
const check = (screen, what, expected, hay) => rows.push({ screen, what, expected, found: hay.includes(expected) });
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(pageUrl(dir, "#/")); await page.waitForSelector("h1"); await sleep(300);
    const text = await page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "));
    for (const c of lib.home.cards) {
      if (c.kind !== "issuer") continue;
      check("#/", `${c.name} name`, c.name, text);
      check("#/", `${c.name} as of`, c.asOf, text);
      check("#/", `${c.name} progress`, c.progress.text, text);
      for (const [k, m] of Object.entries(c.measures)) if (m) check("#/", `${c.name} ${k}`, m.text, text);
    }
    await page.goto("about:blank"); await page.goto(pageUrl(dir, "#/model")); await page.waitForSelector("h1"); await sleep(300);
    const mt = await page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "));
    console.log("MODEL bare text:", mt.slice(0, 200));
    await page.goto("about:blank"); await page.goto(pageUrl(dir, "#/run")); await page.waitForSelector("h1"); await sleep(300);
    const rt = await page.evaluate(() => document.querySelector("main").innerText.replace(/\s+/g, " "));
    console.log("RUN bare text:", rt.slice(0, 600));
    const cur = run.runs.find((r) => r.id === run.current);
    check("#/run", "spend", cur.spend.bar.label.replace(" of USD 20.00", ""), rt);
    check("#/run", "spend cap as stored", "of USD 20.00", rt);
    check("#/run", "finished", cur.finished.value, rt);
    check("#/run", "elapsed", cur.elapsed.value, rt);
    check("#/run", "issuer", cur.issuer, rt);
    for (const s of cur.modules.steps.slice(0, 3)) check("#/run", `module ${s.name}`, s.name, rt);
  } finally { await browser.close(); }
} finally { cleanup(); }
console.log(`checked ${rows.length} figures, ${rows.filter((r) => r.found).length} found, ${rows.filter((r) => !r.found).length} not found`);
for (const r of rows.filter((x) => !x.found)) console.log("NOT FOUND", JSON.stringify(r));
console.log(JSON.stringify(rows.slice(0, 60)));
