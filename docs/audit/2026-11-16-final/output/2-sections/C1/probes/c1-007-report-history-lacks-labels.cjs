// C1-007: the report frame's Report history tab draws no modules-run, no status for other runs and no
// 'Earlier format' / 'Earlier methods' label (CM-032, CM-060). Reads the source and the drawn history row.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const L = require("./lib.cjs");
(async () => {
  const dir = path.join(L.REPO, "web", "src", "pages", "connected");
  const files = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|ts)$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p); } })(dir);
  const hits = files.filter((f) => /Earlier format|Earlier methods/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(L.REPO, f));
  console.log("files under web/src/pages/connected drawing 'Earlier format' or 'Earlier methods':", JSON.stringify(hits));
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const id = await L.ensureRun(context, log);
      const page = await L.open(context, log, `/report/${id}#history`);
      await L.settle(page, 1000);
      const row = await page.locator("section:has(h2:text-is('Report history')) li").first().innerText();
      console.log("history row text:", JSON.stringify(row.replace(/\n+/g, " | ")));
      await L.shot(page, "c1-007-history");
      const lacksModules = !/modules?/i.test(row);
      L.verdict(hits.length === 0 && lacksModules, "no module count in the row, no earlier-format/earlier-methods label anywhere in the connected source");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
