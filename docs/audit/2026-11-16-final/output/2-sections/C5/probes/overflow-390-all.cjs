// C5 probe: horizontal overflow of the report scroll area (main) on every Evidence screen at 390 px and 1440 px, with real synthetic data.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  const mods = Object.entries(snap.workspace.outputs).map(([id, o]) => [o.module, `${encodeURIComponent(id)}~${o.sha256}`]);
  const screens = ["summary", "trace", "sources", "gaps", "checks", "record", "record/CP-1", "checks/CP-4", ...mods.map(([, t]) => t), ...mods.slice(0, 3).map(([, t]) => t + "-33")];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const over = [];
    for (const s of screens) {
      await page.goto(`${base}/report/${run}#evidence/${s}`); await page.reload(); await page.waitForTimeout(450);
      await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => { d.open = true; }));
      const m = await page.evaluate(() => { const e = document.querySelector("main"); return { sw: e.scrollWidth, cw: e.clientWidth }; });
      if (m.sw > m.cw + 1) over.push(`${s.slice(0, 40)}${s.length > 40 ? "…" : ""} (${m.sw} > ${m.cw})`);
    }
    console.log(`${width}px: ${screens.length} screens, ${over.length} overflow`, over.join("; "));
  }
}).catch((e) => { console.error(e); process.exit(1); });
