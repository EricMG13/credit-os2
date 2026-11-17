// C4-003: every trace control on the Forecast model (cases, scope notes, cash flow model, scenario
// chart, trend charts) opens the same drawer: "Forecast inputs (machine-readable)".
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-003-generic-drawer.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const names = ["Model scope qualification 1", "Model scope qualification 2", "Base case", "Downside shock", "Cash flow model", "Revenue", "Closing cash", "Closing debt"];
    const seen = new Map();
    for (const name of names) {
      const b = page.getByRole("button", { name: `Show sources for ${name}`, exact: true }).first();
      await b.scrollIntoViewIfNeeded();
      await b.click();
      const d = page.getByRole("dialog");
      await d.waitFor();
      const text = (await d.innerText()).replace(/\s+/g, " ").slice(0, 200);
      console.log(`${name} -> ${text}`);
      seen.set(text, (seen.get(text) || 0) + 1);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
    }
    const distinct = seen.size;
    console.log(distinct === 1 ? `DEFECT PRESENT (${names.length} controls, ${distinct} distinct drawer)` : `${distinct} distinct drawers`);
    process.exitCode = distinct === 1 ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
