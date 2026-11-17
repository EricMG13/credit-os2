// C4-034: a link in the body of the Forecast tab (the module links above each run chart group) opens the module
// page with the scroll position of the Forecast tab, so the reader lands part-way down (or at the foot) of the
// module page, and focus is left on <body>.
// Run (one plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run, see c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-034-scroll-after-link.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const ctx = await lib.newContext(browser, log, { width: 1440, height: 900 });
    const page = await ctx.newPage();
    await page.goto(`${lib.BASE}/report/${lib.runId()}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    const link = page.locator("section[aria-label='Run charts'] a", { hasText: "Committee decision" });
    await link.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => document.getElementById("main").scrollTop);
    await link.click();
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const m = document.getElementById("main");
      const h = [...m.querySelectorAll("h2")].find((e) => e.getBoundingClientRect().height > 0);
      return { scrollTop: m.scrollTop, scrollHeight: m.scrollHeight, headingTop: h ? Math.round(h.getBoundingClientRect().top) : null, headingText: h && h.textContent.trim(), active: document.activeElement.tagName };
    });
    console.log(`scrollTop on Forecast ${before}; on the module page ${r.scrollTop} of ${r.scrollHeight}; module heading '${r.headingText}' at y=${r.headingTop}; focus on ${r.active}`);
    const defect = r.scrollTop > 200 || (r.headingTop !== null && r.headingTop < 0);
    console.log(defect ? "DEFECT PRESENT (the module page opens scrolled; its title is off screen)" : "no defect seen");
    process.exitCode = defect ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
