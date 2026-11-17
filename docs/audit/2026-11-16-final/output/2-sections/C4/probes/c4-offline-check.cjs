// R8 check for the C4 screens: every host but loopback is aborted and logged; fonts and icons must have drawn.
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    for (const width of [1440, 390]) {
      const ctx = await lib.newContext(browser, log, { width, height: 900 });
      const page = await ctx.newPage();
      for (const hash of ["forecast", "calendar", "modules/CP-2A", "modules/CP-2E", "modules/CP-3", "modules/CP-1", "modules/CP-4"]) {
        await page.goto(`${lib.BASE}/report/${lib.runId()}#${hash}`);
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(600);
        const r = await page.evaluate(async () => {
          await document.fonts.ready;
          const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`);
          const svg = document.querySelectorAll("main svg").length;
          const empty = [...document.querySelectorAll("main figure")].filter((f) => f.getBoundingClientRect().height < 40).length;
          return { loaded, svg, emptyFigures: empty };
        });
        console.log(width, hash, JSON.stringify(r));
      }
      await ctx.close();
    }
    console.log("blocked (non-loopback) requests:", log.blocked.length, JSON.stringify(log.blocked.slice(0, 5)));
    console.log("failed requests:", log.failed.length, "| HTTP >= 400:", log.bad.length, "| console errors/warnings:", log.console.length, "| page errors:", log.pageErrors.length);
    process.exit(log.blocked.length ? 1 : 0);
  } finally { await browser.close(); }
})();
