// S2 probe: unusual addresses on the four S2 routes must give the "No such issuer / run" state or "not found", never a blank page or an error.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/odd-addresses.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const ADDR = [
  "/library/__proto__/history", "/library/constructor/x/overview", "/library/halden-aerostructures/__proto__/changes",
  "/library/%E0%A4%A/history", "/library/halden-aerostructures/2026-09-30%2Foverview/overview", "/library/halden%2Daerostructures/history",
  "/library/HALDEN-AEROSTRUCTURES/history", "/library/halden-aerostructures/history/", "/library/halden-aerostructures/2026-09-30/overview/",
  "/library/" + "x".repeat(3000) + "/history", "/library/home/history", "/library/halden-aerostructures/2026-09-30/overview?x=1",
  "/library/halden-aerostructures/2026-09-30", "/library/halden-aerostructures",
];
const v = makeVariant();
const { browser, page, consoleLines, blocked } = await open();
try {
  for (const a of ADDR) {
    await page.goto(hash(v.url, a));
    await page.waitForTimeout(250);
    const t = await page.evaluate(() => ({ h1: [...document.querySelectorAll("h1")].map((x) => x.textContent.trim().slice(0, 40)), body: document.querySelector("main")?.innerText.replace(/\s+/g, " ").slice(0, 90) }));
    console.log(a.slice(0, 70).padEnd(72), JSON.stringify(t.h1), "|", t.body);
  }
  console.log("console/page errors:", consoleLines.length, consoleLines.slice(0, 3), "blocked:", blocked.length);
} finally { await browser.close(); v.cleanup(); }
