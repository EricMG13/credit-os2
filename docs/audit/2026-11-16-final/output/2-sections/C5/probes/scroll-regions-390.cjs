// C5 probe: at 390 px the handoff evidence tables with fewer than five columns scroll sideways but cannot take keyboard focus.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>   (PublishedTable sets tabIndex only when columns >= 5: ReportContent.tsx)
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  const [id, o] = Object.entries(snap.workspace.outputs).find(([, x]) => x.module === "CP-1");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${base}/report/${run}#evidence/${encodeURIComponent(id)}~${o.sha256}`); await page.reload(); await page.waitForTimeout(900);
  const regions = await page.evaluate(() => [...document.querySelectorAll("main .overflow-x-auto")].map((el) => ({ scrolls: el.scrollWidth > el.clientWidth, focusable: el.tabIndex >= 0, role: el.getAttribute("role"), cols: el.querySelectorAll("thead th").length })));
  const bad = regions.filter((r) => r.scrolls && !r.focusable);
  console.log(JSON.stringify(regions));
  console.log(`RESULT: ${bad.length} of ${regions.length} table regions scroll sideways at 390 px and are not keyboard focusable (column counts: ${bad.map((b) => b.cols).join(",")})`);
}).catch((e) => { console.error(e); process.exit(1); });
