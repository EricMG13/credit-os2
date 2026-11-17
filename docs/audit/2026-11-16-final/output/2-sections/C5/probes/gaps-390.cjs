// C5 probe: the Gaps tab at 390 px with ordinary gap text (no unbroken strings), by intercepting the snapshot.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
// Prints whether the report's scroll area is wider than the window and how wide the Gaps card is.
"use strict";
const lib = require("./c5lib.cjs");
const SHOTS = process.env.C5_SHOTS || "/tmp/cs-C5/scratch";
lib.withRun(async ({ page, base, run, log }) => {
  await page.route(/\/connected\/snapshot/, async (route) => {
    const response = await route.fetch(); const json = await response.json();
    const o = Object.values(json.workspace.outputs).find((x) => x.module === "CP-2D");
    const gaps = json.workspace.handoffs[o.sha256].find((s) => s.heading === "Gaps");
    gaps.blocks = [{ type: "table", line: 900, headers: ["Gap", "Severity", "Effect on conclusion"], rows: [
      { line: 902, cells: ["Covenant schedule missing", "High", "Headroom to the leverage covenant cannot be computed for the 2026 test date."] },
      { line: 903, cells: ["Rating agency report stale", "Medium", "The rating outlook is a year old."] },
      { line: 904, cells: ["Peer set thin", "Low", "Only three comparable issuers were found."] }] }];
    return route.fulfill({ response, json });
  });
  const result = {};
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/report/${run}#evidence/gaps`); await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    result[width] = await page.evaluate(() => {
      const main = document.querySelector("main"); const card = [...main.querySelectorAll("section")].find((s) => s.querySelector("h3")?.textContent.startsWith("Gaps"));
      const table = card.querySelector("table"); const wrap = table.parentElement;
      return { viewport: innerWidth, mainClientWidth: main.clientWidth, mainScrollWidth: main.scrollWidth, cardWidth: Math.round(card.getBoundingClientRect().width), cardRight: Math.round(card.getBoundingClientRect().right), tableWidth: Math.round(table.getBoundingClientRect().width), wrapperWidth: Math.round(wrap.getBoundingClientRect().width), wrapperScrolls: wrap.scrollWidth > wrap.clientWidth };
    });
    if (width === 390) await page.screenshot({ path: `${SHOTS}/gaps-ordinary-390.png` });
  }
  console.log(JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ blocked: log.blocked, pageErrors: log.pageErrors }));
}).catch((e) => { console.error(e); process.exit(1); });
