// J2-016 (Low): the report address of a run that is still running says the report "could not be loaded".
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-016-report-address-while-running.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-016", async ({ page, origin }) => {
  const dialog = await L.toDialog(page, origin);
  await L.confirm(dialog);
  await page.waitForURL(/\/run\//);
  const id = page.url().split("/").pop();
  await page.goto(`${origin}/report/${id}`); // the address an analyst would have copied or bookmarked
  await L.sleep(800);
  const early = (await L.text(page, "main")).replace(/\n+/g, " | ");
  console.log(`report address of ${id} while the run is still going: ${early.slice(0, 160)}`);
  await page.goto(`${origin}/run/${id}`);
  console.log("run page then ended:", await L.waitEnded(page));
  await page.goto(`${origin}/report/${id}`);
  await L.sleep(2500);
  console.log("same address after the run ended:", (await L.text(page, "main")).replace(/\n+/g, " | ").slice(0, 120));
  console.log(/could not be loaded/.test(early) && !/running|still|progress/i.test(early)
    ? "REPRODUCED: the early address says 'could not be loaded' and does not say the run is still going."
    : "NOT REPRODUCED");
});
