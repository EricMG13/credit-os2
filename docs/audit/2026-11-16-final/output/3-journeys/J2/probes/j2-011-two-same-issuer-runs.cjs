// J2-011: two runs of the same issuer, date and pathway started together are both accepted and finish; the library then
// shows two history rows the analyst cannot tell apart, and each run's Changes says it is the first listed run.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-011-two-same-issuer-runs.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-011", async ({ page, context, origin, log }) => {
  const other = await context.newPage();
  L.setup(other, log);
  const dialogA = await L.toDialog(page, origin);
  const dialogB = await L.toDialog(other, origin);
  const startedAt = Date.now();
  await L.confirm(dialogA);
  await L.confirm(dialogB);
  await page.waitForURL(/\/run\//);
  await other.waitForURL(/\/run\//);
  const idA = page.url().split("/").pop();
  const idB = other.url().split("/").pop();
  const [a, b] = await Promise.all([L.waitEnded(page), L.waitEnded(other)]);
  console.log(`run ${idA}: ${a}; run ${idB}: ${b}; started together, both ended within ${Date.now() - startedAt} ms of the two Start clicks`);
  const changesOf = async (id) => {
    await page.goto(`${origin}/report/${id}#changes`);
    for (let i = 0; i < 40; i += 1) {
      const lines = (await L.text(page, "main")).split("\n").filter(Boolean).filter((l) => /first listed run|No earlier run/.test(l));
      if (lines.length >= 2) return lines.join(" ");
      await L.sleep(300);
    }
    return "(Changes text did not appear)";
  };
  const changesA = await changesOf(idA);
  const changesB = await changesOf(idB);
  console.log(`Changes of ${idA}: ${changesA}`);
  console.log(`Changes of ${idB}: ${changesB}`);
  await page.goto(`${origin}/report/${idB}#history`);
  await L.sleep(1500);
  const rows = (await L.text(page, "main")).split("\n").map((l) => l.trim()).filter(Boolean);
  const from = rows.indexOf("Report history");
  console.log("Report history rows:", rows.slice(from, from + 12).join(" | "));
  const labels = rows.slice(from + 1).filter((l) => /^Full credit assessment$/.test(l));
  await page.goto(origin + "/");
  await L.sleep(1500);
  console.log("library home card link text:", (await L.text(page)).match(/\d+ runs?/g));
  console.log(a === "Finished" && b === "Finished" && labels.length === 2 && /first listed run/.test(changesA) && /first listed run/.test(changesB)
    ? "REPRODUCED: two runs finished; two history rows with the same label and date; each Changes page says it is the first listed run."
    : "NOT REPRODUCED");
});
