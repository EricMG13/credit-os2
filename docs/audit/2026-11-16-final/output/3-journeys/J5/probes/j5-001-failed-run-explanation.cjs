// J5-001: a run that failed at a module (no agreement chosen; Will refuse limit accepted) shows the
// run as Failed but the module as Interrupted, three "Module draft rejected." events with no reason,
// and no sentence saying why or what to change. Run from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-001-failed-run-explanation.cjs
"use strict";
const lib = require("./_j5lib.cjs");
const OUT = process.env.J5_PROBE_OUT || "/tmp/jr/j5-scratch/probe-out";
require("node:fs").mkdirSync(OUT, { recursive: true });

lib.segment("p001", async ({ page, origin }) => {
  // Produced through the screen: filing only, no agreement chosen, the "Will refuse" limit accepted.
  const id = await lib.submitRun(page, origin, {
    issuer: "Badco", files: ["filing"], workbook: false, agreement: false,
  });
  const rec = await lib.waitEnded(origin, id);
  await page.waitForTimeout(2500);
  const body = await page.locator("main").innerText();
  await page.screenshot({ path: `${OUT}/j5-001-failed-run.png` });
  const legal = await page.locator("li", { hasText: "Legal & covenants" }).first().innerText().catch(() => "");
  const rejected = (body.match(/Module draft rejected\./g) || []).length;
  const actions = await page.locator("main a, main button").evaluateAll((els) => els.map((e) => e.textContent.trim()));
  const explains = /agreement|governing document|no executed|why/i.test(body);
  return {
    reproduced: rec.status === "failed" && /Interrupted/.test(legal) && rejected >= 1 && !explains,
    summary:
      `run ${id} status=${rec.status} reason=${JSON.stringify(rec.reason)}; Legal & covenants row=` +
      `${JSON.stringify(legal.replace(/\s+/g, " "))}; "Module draft rejected." x${rejected}; page names the ` +
      `agreement or a reason: ${explains}; actions on the page: ${JSON.stringify(actions)}`,
  };
});
