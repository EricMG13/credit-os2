// S2 probe: (1) nothing leaves the machine and the fonts/icons draw on the S2 addresses (ruling R8, D-10);
// (2) the document title on each S2 address (WCAG 2.4.2).
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/offline-fonts-title.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const ADDR = ["/library/home", "/library/halden-aerostructures/history", "/library/halden-aerostructures/2026-09-30/overview", "/library/halden-aerostructures/2026-09-30/changes"];
const v = makeVariant();
const { browser, page, blocked, requests, consoleLines } = await open();
try {
  for (const a of ADDR) {
    await page.goto(hash(v.url, a));
    await page.waitForTimeout(500);
    const r = await page.evaluate(async () => {
      await document.fonts.ready;
      const faces = [...document.fonts].map((f) => f.family.replace(/"/g, "") + " " + f.weight + " " + f.status);
      const used = ["h1", "main p", "main button"].map((s) => { const e = document.querySelector(s); return e ? s + ": " + getComputedStyle(e).fontFamily.split(",")[0] : s + ": (none)"; });
      return { title: document.title, loaded: faces.filter((f) => f.endsWith("loaded")).length, notLoaded: faces.filter((f) => !f.endsWith("loaded")), used, svgIcons: document.querySelectorAll("main svg").length };
    });
    console.log(a, JSON.stringify(r));
  }
  const external = requests.filter((u) => !/^(file|data|blob):/.test(u) && !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(u));
  console.log("requests:", requests.length, "to other hosts:", external.length, "aborted:", blocked.length, "console/page errors:", consoleLines.length);
} finally { await browser.close(); v.cleanup(); }
