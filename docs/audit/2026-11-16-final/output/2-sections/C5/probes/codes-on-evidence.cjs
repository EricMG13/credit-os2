// C5 probe: module codes (CP-x), retired strings and routing text in the rendered text of every Evidence screen.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>   Output: C5_OUT (default /tmp/cs-C5/scratch/codes.json)
"use strict";
const fs = require("fs");
const lib = require("./c5lib.cjs");
const OUT = process.env.C5_OUT || "/tmp/cs-C5/scratch/codes.json";
const RETIRED = /report\.html|workbook|excel|export to|post-mortem|decision ledger|calibration|next module|downstream|hand ?off to|VMO2|CP-MEMO|memo\b|orchestrator selects|Master Index|run command sheet/i;
lib.withRun(async ({ page, base, run, log }) => {
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  const tokens = Object.entries(snap.workspace.outputs).map(([id, o]) => [o.module, `${encodeURIComponent(id)}~${o.sha256}`]);
  const screens = [["summary", "summary"], ["trace", "trace"], ["sources", "sources"], ["gaps", "gaps"], ["checks", "checks"], ["record", "record"], ...tokens.map(([m, t]) => [`handoff ${m}`, t])];
  const res = [];
  for (const [name, hash] of screens) {
    await page.goto(`${base}/report/${run}#evidence/${hash}`); await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => { d.open = true; }));
    const found = await page.evaluate((retired) => {
      const out = { codes: [], retired: [] };
      const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
      let n;
      const re = /\bCP-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g;
      while ((n = walker.nextNode())) {
        const t = n.textContent; const el = n.parentElement;
        if (!t.trim()) continue;
        let m;
        while ((m = re.exec(t))) out.codes.push({ code: m[0], tag: el.tagName, cls: /mono/.test(el.className) || el.tagName === "CODE" ? "mono" : "", ctx: t.trim().slice(0, 90) });
        const rr = new RegExp(retired, "i");
        if (rr.test(t)) out.retired.push({ tag: el.tagName, ctx: t.trim().slice(0, 120) });
      }
      return out;
    }, RETIRED.source);
    res.push({ name, codes: found.codes, retired: found.retired });
  }
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  for (const r of res) console.log(r.name.padEnd(18), "codes:", r.codes.length, "| headings:", r.codes.filter((c) => /^H\d$/.test(c.tag)).map((c) => c.code).join(",") || "-", "| retired:", r.retired.map((x) => x.ctx.slice(0, 50)).join(" // ") || "-");
  console.log(JSON.stringify({ blocked: log.blocked, pageErrors: log.pageErrors }));
}).catch((e) => { console.error(e); process.exit(1); });
