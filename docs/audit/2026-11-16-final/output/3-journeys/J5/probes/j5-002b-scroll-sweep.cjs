const lib = require("./_j5lib.cjs");
// J5-002 (sweep): at 390 px, lists every table or graph on every report page that scrolls sideways and
// whether its scroll wrapper is keyboard-focusable and labelled. Run from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-002b-scroll-sweep.cjs
"use strict";
const fs = require("node:fs");
lib.segment("p002b", async ({ page, origin }) => {
  const id = await lib.submitRun(page, origin);
  await lib.waitEnded(origin, id); await lib.waitPublished(origin, id);
  await page.setViewportSize({ width: 390, height: 844 });
  const tabs = ["overview", "changes", "history", "forecast", "calendar", ...["CP-0", "CP-1", "CP-1A", "CP-DR", "CP-4", "CP-2", "CP-2A", "CP-2E", "CP-2D", "CP-2G", "CP-3C", "CP-3", "CP-5", "CP-6"].map((m) => `modules/${m}`), "evidence/summary", "evidence/trace", "evidence/sources", "evidence/gaps", "evidence/checks", "evidence/record"];
  const rows = [];
  for (const tab of tabs) {
    await page.goto(`${origin}/report/${id}#${tab}`);
    await page.waitForTimeout(700);
    for (const sm of await page.locator("main summary").all()) await sm.click().catch(() => {});
    await page.waitForTimeout(300);
    const res = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("main table, main svg[role=img], main [data-scroll]")) {
        let p = el.parentElement;
        while (p && !["auto", "scroll"].includes(getComputedStyle(p).overflowX)) p = p.parentElement;
        if (!p || p.scrollWidth <= p.clientWidth + 1) continue;
        out.push(`${el.tagName.toLowerCase()}[${(el.querySelector("caption")?.textContent || el.getAttribute("aria-label") || el.querySelector("th")?.textContent || "").trim().slice(0, 40)}] cw=${p.clientWidth} sw=${p.scrollWidth} tabindex=${p.getAttribute("tabindex")} label=${p.getAttribute("aria-label")}`);
      }
      return out;
    });
    for (const r of res) rows.push(`${tab}: ${r}`);
  }
  for (const r of rows) console.log("SCROLL", r);
  const bare = rows.filter((r) => /tabindex=null label=null/.test(r));
  console.log(`${rows.length} scrolling tables or graphs; ${bare.length} with no tabindex and no label`);
  return { reproduced: bare.length >= 3, summary: bare.join(" ; ") };
});
