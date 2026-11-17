// C5 probe: the handoff evidence view draws the handoff's Markdown as text: "- " bullets, a code fence, a bare "CP-1" heading, the Sources list.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  const mods = Object.entries(snap.workspace.outputs).map(([id, o]) => [o.module, `${encodeURIComponent(id)}~${o.sha256}`]);
  let total = { bullets: 0, fences: 0, bareHeadings: 0, hashLists: 0 };
  for (const [m, tok] of mods) {
    await page.goto(`${base}/report/${run}#evidence/${tok}`); await page.reload(); await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const lines = [...document.querySelectorAll("main article p, main article pre")].map((e) => e.textContent);
      return { bullets: lines.filter((t) => /^\s*- /.test(t)).length, fences: lines.filter((t) => /```/.test(t)).length, bareHeadings: [...document.querySelectorAll("main article h3")].filter((h) => /^CP-[A-Z0-9]+$/.test(h.textContent.trim())).length, hashLists: lines.filter((t) => /^\s*- \S+ [a-f0-9]{64}/.test(t)).length, sample: lines.find((t) => /^\s*- \S+ [a-f0-9]{64}/.test(t))?.slice(0, 90) };
    });
    for (const k of Object.keys(total)) total[k] += r[k];
    if (m === "CP-6" || m === "CP-2G") console.log(m, JSON.stringify(r));
  }
  const g = mods.find(([m]) => m === "CP-2G");
  await page.goto(`${base}/report/${run}#evidence/${g[1]}-93`); await page.reload(); await page.waitForTimeout(500);
  const pre = await page.locator("main article pre").first().innerText().catch(() => "");
  console.log("CP-2G line 93 <pre> starts with:", JSON.stringify(pre.slice(0, 40)), "| length", pre.length, "| newlines", (pre.match(/\n/g) || []).length);
  console.log("TOTAL over", mods.length, "handoff views:", JSON.stringify(total));
}).catch((e) => { console.error(e); process.exit(1); });
