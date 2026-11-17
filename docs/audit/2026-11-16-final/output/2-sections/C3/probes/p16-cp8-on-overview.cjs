// C3-026: when CP-8 delivered (a run with a comparison), its Bottom line and Limitations are listed on Overview (CM-062: not shown).
// The synthetic launcher cannot make a second run (proof/launcher.py:101), so a CP-8 output is added to the snapshot in the browser.
const { main, inject, outputOf } = require("./lib.cjs");
main("p16-cp8-on-overview", async ({ page, context, run, report }) => {
  await inject(context, (snap) => {
    const cur = snap.workspace.runs[run];
    const id = `${run}/CP-8.md`;
    snap.workspace.outputs[id] = { ...outputOf(snap, "CP-2"), id, module: "CP-8", sha256: "cp8sha", summary: null, charts: [], chartGaps: [], events: [], maps: [], confidence: undefined };
    cur.modules["CP-8"] = { outputs: [id], default: id };
    snap.workspace.handoffs.cp8sha = [
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      { heading: "Bottom line", level: 3, line: 3, blocks: [{ type: "text", line: 4, end: 4, text: "Leverage fell, and the credit view improved." }] },
      { heading: "Limitations", level: 3, line: 6, blocks: [{ type: "text", line: 7, end: 7, text: "The earlier run did not state gross debt." }] },
    ];
  });
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page.waitForTimeout(600);
  const text = await page.locator("main").innerText();
  const found = { name: /Changes since the last run/.test(text), bottomLine: /Leverage fell, and the credit view improved/.test(text), limitation: /earlier run did not state gross debt/.test(text) };
  return { defect: found.bottomLine || found.limitation, expected: "CP-8's findings are not on Overview (CM-062; AGENTS.md: shown on the Changes page)", found };
});
