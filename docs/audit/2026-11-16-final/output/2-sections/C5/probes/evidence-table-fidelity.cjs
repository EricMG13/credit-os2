// C5 probe: every table row drawn on a handoff evidence view equals a row of the delivered handoff Markdown (independent parse).
// Usage (repo root): C5_ROOT=/tmp/cs-C5/root [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const fs = require("fs");
const path = require("path");
const lib = require("./c5lib.cjs");
const ROOT = process.env.C5_ROOT || "/tmp/cs-C5/root";
const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\*\*/g, "").replace(/`/g, "").replace(/\\\|/g, "|"));
lib.withRun(async ({ page, base, run }) => {
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  const dir = path.join(ROOT, "_engine/runs", run, "deliveries");
  const sha = fs.readdirSync(dir)[0];
  let pageRows = 0, mismatched = [], mdRows = 0, missingFromPage = [];
  for (const [id, o] of Object.entries(snap.workspace.outputs)) {
    const md = fs.readFileSync(path.join(dir, sha, `${o.module}.md`), "utf8").split("\n");
    const mdTables = md.filter((l, i) => l.startsWith("|") && !/^\|[\s:-]+(\|[\s:-]+)*\|?$/.test(l)).map(cells);
    await page.goto(`${base}/report/${run}#evidence/${encodeURIComponent(id)}~${o.sha256}`); await page.reload(); await page.waitForTimeout(500);
    const rows = await page.evaluate(() => [...document.querySelectorAll("main article table")].flatMap((t) => [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => c.textContent.trim()))));
    const key = (r) => JSON.stringify(r.map((c) => c.replace(/\s+/g, " ")));
    const mdSet = new Set(mdTables.map(key));
    const pgSet = new Set(rows.map(key));
    pageRows += rows.length; mdRows += mdTables.length;
    for (const r of rows) if (!mdSet.has(key(r))) mismatched.push([o.module, r]);
    for (const r of mdTables) if (!pgSet.has(key(r))) missingFromPage.push([o.module, r]);
  }
  console.log(`page rows ${pageRows}, markdown table rows (header+body) ${mdRows}`);
  console.log(`page rows not in the markdown: ${mismatched.length}`, JSON.stringify(mismatched.slice(0, 5)));
  console.log(`markdown rows not drawn: ${missingFromPage.length}`, JSON.stringify(missingFromPage.slice(0, 12)));
}).catch((e) => { console.error(e); process.exit(1); });
