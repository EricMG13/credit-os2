// S2 probe: horizontal overflow of <main> (the shell's scroll container) at 1440, 390 and 320 px on every S2 address.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/reflow.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const ADDR = [
  "/library/home", "/library/halden-aerostructures/history", "/library/corvane-packaging/history", "/library/brevane-marine/history",
  "/library/halden-aerostructures/2026-09-30/overview", "/library/halden-aerostructures/2026-09-30/changes",
  "/library/halden-aerostructures/2026-03-31/overview", "/library/halden-aerostructures/2026-03-31/changes",
  "/library/halden-aerostructures/2025-09-30/overview", "/library/halden-aerostructures/2025-09-30/changes",
  "/library/brevane-marine/r-0412/overview", "/library/brevane-marine/r-0412/changes",
  "/library/halden-aerostructures/2026-06-30/overview",
];
const v = makeVariant();
try {
  for (const width of [1440, 390, 320]) {
    const { browser, page } = await open({ width });
    try {
      for (const a of ADDR) {
        await page.goto(hash(v.url, a));
        await page.waitForTimeout(350);
        const r = await page.evaluate(() => {
          const m = document.querySelector("main");
          const off = [...m.querySelectorAll("*")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && !e.closest("[class*=overflow-x-auto]"); });
          const top = off.find((e) => e.tagName === "A" || e.tagName === "BUTTON") ?? off[0];
          return { over: m.scrollWidth - m.clientWidth, who: top ? (top.getAttribute("aria-label") || top.textContent.trim().slice(0, 30)) + " right=" + Math.round(top.getBoundingClientRect().right) : "" };
        });
        if (r.over > 0) console.log(String(width).padEnd(5), a.padEnd(58), "main scrolls sideways by", r.over, "px;", r.who);
      }
    } finally { await browser.close(); }
  }
} finally { v.cleanup(); }
console.log("done");
