// J3-007: Evidence > Trace with no item chosen shows the same handoff download list as Summary and
// no guidance on how to pick an item to trace. Run from the repository root:
// timeout 600 node <this file>
"use strict";
const lib = require("./_j3lib.cjs");

lib.runProbe("007", async ({ page, origin, id }) => {
  const read = async (hash) => {
    await page.goto(`${origin}/report/${id}#${hash}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    return page.locator("main").innerText();
  };
  const summary = await read("evidence/summary");
  const trace = await read("evidence/trace");
  const body = (t) => t.slice(t.indexOf("Handoffs"));
  const downloads = (trace.match(/Download /gu) ?? []).length;
  const guidance =
    /\b(select|choose|pick)\b|open a (passage|figure|trace)|trace icon|from a (passage|figure)/iu.test(
      trace.slice(trace.indexOf("Script checks")),
    );
  return {
    reproduced: trace.includes("Download all handoffs") && downloads > 10 && !guidance,
    summary:
      `Trace tab (no item chosen) lists ${downloads} "Download ..." buttons, the Summary tab's ` +
      `Handoffs list is ${body(summary).startsWith(body(trace).slice(0, 200)) ? "identical to it" : "similar"}; ` +
      `text telling the reader how to pick something to trace: ${guidance}.`,
  };
});
