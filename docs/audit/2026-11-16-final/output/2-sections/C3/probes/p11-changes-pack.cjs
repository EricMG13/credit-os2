// C3-011/012/013: the Changes tab with a comparison pack (the synthetic launcher cannot make a second run: proof/launcher.py:101).
// Rewrites the snapshot in the browser: adds an earlier run, a comparison pack and a CP-8 handoff. Prints what the page draws.
const { main, inject, outputOf } = require("./lib.cjs");
main("p11-changes-pack", async ({ page, context, run, report }) => {
  const earlier = "20240401-000000-01";
  await inject(context, (snap) => {
    const cur = snap.workspace.runs[run];
    snap.workspace.runs[earlier] = { ...JSON.parse(JSON.stringify(cur)), folder: earlier, asOf: "2024-03-31", period: "As of 31 March 2024", modules: {}, changes: null };
    const sd = (value, unit, period) => ({ value, unit, period });
    cur.changes = { lead: "CP-2", first_run: false, note: null, problem: null,
      pack: { prior: { run: earlier, as_of: "2024-03-31", pathway: cur.pathway }, current: { as_of: cur.asOf, pathway: cur.pathway }, omitted: {},
        measures: [
          { key: "coverage", label: "EBITDA / cash interest", unit: "x", comparable: "yes", prior: sd("3.20", "x", "FY2023"), current: sd("4.00", "x", "FY2024"), difference: "0.80", same_period: false },
          { key: "leverage", label: "Total debt / EBITDA", unit: "x", comparable: "yes", prior: sd("3.75", "x", "FY2023"), current: sd("2.80", "x", "FY2024"), difference: "-0.95", same_period: false } ],
        modules: [ { module: "CP-1", title: "Financial foundation", ran_prior: true, ran_current: true, prior_bottom_line: "Leverage was 3.75x.", current_bottom_line: "Leverage fell to 2.80x." } ] },
      verdicts: { measures: { coverage: { kind: "comparable", label: "Same definition", reason: "Same definition", analysis_change: "" }, leverage: { kind: "comparable", label: "Same definition", reason: "Same definition", analysis_change: "" } }, modules: {} } };
    const id = `${run}/CP-8.md`;
    snap.workspace.outputs[id] = { ...outputOf(snap, "CP-2"), id, module: "CP-8", sha256: "cp8sha", summary: null, charts: [], chartGaps: [], events: [], maps: [], confidence: undefined };
    cur.modules["CP-8"] = { outputs: [id], default: id };
    snap.workspace.handoffs.cp8sha = [ { heading: "Findings", level: 2, line: 1, blocks: [] }, { heading: "Bottom line", level: 3, line: 3, blocks: [{ type: "text", line: 4, end: 4, text: "Leverage fell." }] } ];
  });
  await page.goto(report("changes"));
  await page.getByRole("heading", { name: "Changes since the last run" }).waitFor();
  await page.waitForTimeout(600);
  const cards = await page.evaluate(() => [...document.querySelectorAll("main ul li")].map((li) => li.innerText.replace(/\s+/g, " ")).filter((t) => /from/.test(t)).slice(0, 4));
  await page.goto("about:blank");
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  const tile = await page.evaluate(() => [...document.querySelectorAll("main dl > div")].map((t) => t.innerText.replace(/\s+/g, " ")).find((t) => /Interest coverage/.test(t)));
  await page.goto("about:blank");
  await page.goto(report("modules"));
  await page.waitForTimeout(600);
  const nav = await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="Modules and sections"] a')].map((a) => a.textContent.trim()));
  const tabs = await page.evaluate(() => document.querySelector('nav[aria-label="Report sections"]').innerText.replace(/\s+/g, " "));
  const signMissing = cards.some((c) => /EBITDA \/ cash interest/.test(c) && /\b0\.80x/.test(c) && !/\+0\.80x/.test(c)) && /\+0\.80x/.test(tile || "");
  const cp8Twice = nav.includes("Changes since the last run");
  return { defect: signMissing || cp8Twice, signMissing, cp8Twice, cards, overviewTile: tile, modulesNav: nav, tabs };
});
