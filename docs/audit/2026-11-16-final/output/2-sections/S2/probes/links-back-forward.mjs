// S2 probe: every link of an S2 screen, opened with the keyboard (Enter), then Back and Forward; reports the address, the h1 and the focus.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/links-back-forward.mjs [address ...]
import { makeVariant, open, hash } from "./harness.mjs";
const STARTS = process.argv.length > 2 ? process.argv.slice(2) : ["/library/home", "/library/halden-aerostructures/history", "/library/corvane-fasteners/history", "/library/halden-aerostructures/2026-09-30/changes", "/library/halden-aerostructures/2025-09-30/changes", "/library/no-such-issuer/history"];
const v = makeVariant();
const { browser, page, blocked, consoleLines } = await open();
const here = () => page.url().split("#")[1];
try {
  for (const start of STARTS) {
    await page.goto(hash(v.url, start));
    await page.waitForTimeout(400);
    const hrefs = await page.$$eval("main a[href]", (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
    console.log("==", start, hrefs.length, "distinct links");
    for (const h of hrefs) {
      await page.goto(hash(v.url, start));
      await page.waitForTimeout(250);
      await page.locator(`main a[href="${h}"]`).first().focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(350);
      const to = here();
      const h1 = await page.$$eval("h1", (e) => e.map((x) => x.textContent.trim().slice(0, 28)).join("/"));
      await page.goBack(); await page.waitForTimeout(250);
      const back = here();
      await page.goForward(); await page.waitForTimeout(250);
      const fwd = here();
      const ok = to === h.slice(1) && back === start && fwd === to;
      console.log(ok ? "ok  " : "FAIL", h.slice(0, 70).padEnd(72), "-> h1:", h1);
    }
  }
  console.log("blocked", blocked.length, "console", consoleLines.length);
} finally { await browser.close(); v.cleanup(); }
