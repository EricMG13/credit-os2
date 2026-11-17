// C4-005: the Table form of each run chart omits the published "Basis and limitation" column.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-005-table-form-basis.cjs
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
    let missing = 0;
    for (const t of ["Leverage", "Interest cover", "Liquidity", "Debt maturities", "Revenue and EBITDA", "Debt stack", "EBITDA bridge", "Liquidity bridge", "Refinancing need", "Covenant headroom"]) {
      const g = page.getByRole("radiogroup", { name: `${t}: Chart or Table` });
      await g.getByRole("radio", { name: "Table" }).click();
      const head = (await g.locator("xpath=ancestor::figure[1]").locator("table thead").innerText()).replace(/\s+/g, " ");
      const shows = /Basis/i.test(head);
      if (!shows) missing += 1;
      console.log(`${t}: table head = ${head} | basis column shown: ${shows}`);
    }
    // what the handoff publishes for these rows
    console.log("handoff: proof/handoffs/CP-1.md '### Chart data: leverage' header ends 'Reporting unit | Basis and limitation'");
    console.log(missing ? `DEFECT PRESENT (${missing} of 10 table forms omit the basis column)` : "no defect seen");
    process.exitCode = missing ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
