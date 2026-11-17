// J5-002: at 390 px wide, tables run past the right edge with no cue, and some of the scroll
// wrappers are neither labelled nor keyboard-focusable. Run from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-002-narrow-tables-cut-off.cjs
"use strict";
const lib = require("./_j5lib.cjs");
const OUT = process.env.J5_PROBE_OUT || "/tmp/jr/j5-scratch/probe-out";
require("node:fs").mkdirSync(OUT, { recursive: true });

// For the first element matching `sel`: bring its scroll wrapper into view with the wrapper scrolled
// to its left end (what the reader sees first), then report the element's edges and what the wrapper declares.
const wrapperOf = (page, sel) =>
  page.locator(sel).first().evaluate((el) => {
    let p = el.parentElement;
    while (p && !["auto", "scroll"].includes(getComputedStyle(p).overflowX)) p = p.parentElement;
    if (p) {
      p.scrollIntoView({ block: "center", inline: "start" });
      p.scrollLeft = 0;
    }
    const r = el.getBoundingClientRect();
    return {
      left: Math.round(r.left), right: Math.round(r.right), vw: document.documentElement.clientWidth,
      wrapper: p ? { cw: p.clientWidth, sw: p.scrollWidth, tabindex: p.getAttribute("tabindex"), role: p.getAttribute("role"), label: p.getAttribute("aria-label") } : null,
    };
  });

lib.segment("p002", async ({ page, origin }) => {
  const id = await lib.submitRun(page, origin);
  await lib.waitEnded(origin, id);
  await lib.waitPublished(origin, id);
  // a failed run (filing only, no agreement) so that Run activity lists one
  const bad = await lib.submitRun(page, origin, { issuer: "Badco", files: ["filing"], workbook: false, agreement: false });
  await lib.waitEnded(origin, bad);
  await page.setViewportSize({ width: 390, height: 844 });
  const found = {};
  // 1 Library, List view: the Report column holds "Open report"
  await page.goto(origin + "/");
  await page.getByText("List", { exact: true }).first().click();
  await page.waitForTimeout(800);
  found.libraryList = await wrapperOf(page, "table a:has-text('Open report'), table button:has-text('Open report')");
  await page.screenshot({ path: `${OUT}/j5-002-library-list-390.png` });
  // 2 Committee decision: Published exposures and proposals (a collapsed block), Limit value column
  await page.goto(`${origin}/report/${id}#modules/CP-6`);
  await page.waitForTimeout(1200);
  await page.getByText("Published exposures and proposals", { exact: true }).first().click();
  await page.waitForTimeout(500);
  found.cp6Limit = await wrapperOf(page, "th:has-text('Limit value')");
  await page.screenshot({ path: `${OUT}/j5-002-cp6-exposures-390.png` });
  // 3 Forecast: Scenario comparison, FY2027E column
  await page.goto(`${origin}/report/${id}#forecast`);
  await page.waitForTimeout(1200);
  found.forecastScenario = await wrapperOf(page, "table:has(caption:has-text('Scenario comparison')) th:has-text('FY2027E')");
  await page.screenshot({ path: `${OUT}/j5-002-forecast-scenarios-390.png` });
  // 4 Run activity, "Ended without a report": the Reason column
  await page.goto(origin + "/runs");
  await page.waitForTimeout(1200);
  found.runActivityReason = await wrapperOf(page, "th:has-text('Reason')");
  await page.screenshot({ path: `${OUT}/j5-002-run-activity-390.png` });
  const cut = Object.values(found).filter((f) => f.right > f.vw);
  const hidden = Object.values(found).filter((f) => f.left >= f.vw);
  const unlabelled = Object.values(found).filter((f) => f.right > f.vw && f.wrapper && f.wrapper.tabindex === null && !f.wrapper.label);
  return {
    reproduced: cut.length >= 4 && unlabelled.length >= 3,
    summary: `cells past the 390 px edge: ${cut.length} of 4 checked (${hidden.length} wholly out of sight) (Library List "Open report", CP-6 "Limit value", Forecast "FY2027E", Run activity "Reason"); ` +
      `scroll wrappers with no tabindex and no label: ${unlabelled.length}; detail: ${JSON.stringify(found)}`,
  };
});
