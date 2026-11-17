// C4-036: the EBITDA break points are drawn as an ordered list sorted by the required decline, an order the
// handoff table (B1, B2, B3) does not carry.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-036-breakpoint-order.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#modules/CP-2A`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const sec = page.locator("section[aria-label='EBITDA break points']");
    const order = async () => (await sec.locator("ol > li").allInnerTexts()).map((t) => t.split("\n")[0]);
    const held = await order();
    await sec.getByRole("combobox").selectOption({ index: 1 });
    await page.waitForTimeout(300);
    const shocked = await order();
    console.log("handoff order (T2DS.6): FCF reaches zero, Cover reaches watch level, Net leverage watch level");
    console.log("page order, interest held:", JSON.stringify(held));
    console.log("page order, k = 0.05:", JSON.stringify(shocked));
    const defect = shocked[0] === "Cover reaches watch level";
    console.log(defect ? "DEFECT PRESENT (page re-ranks the break points; the module wrote no ranking for this table)" : "no defect seen");
    process.exitCode = defect ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
