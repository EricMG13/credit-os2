// S2 probe: the shipped build (web/dist/index.html with its empty data.js) on every S2 route type.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/shipped-empty-state.mjs
import { open, hash, shippedUrl } from "./harness.mjs";
const ADDR = ["/library/home", "/library/halden-aerostructures/history", "/library/halden-aerostructures/2026-09-30/overview", "/library/halden-aerostructures/2026-09-30/changes"];
const { browser, page, blocked, consoleLines } = await open();
try {
  for (const a of ADDR) {
    await page.goto(hash(shippedUrl, a));
    await page.waitForTimeout(400);
    const t = await page.evaluate(() => ({ h1: document.querySelector("h1")?.textContent, text: document.querySelector("main").innerText.replace(/\s+/g, " ").trim(), links: [...document.querySelectorAll("main a, main button")].map((x) => x.textContent.trim()) }));
    console.log(a.padEnd(56), "h1:", JSON.stringify(t.h1), "| main text:", JSON.stringify(t.text), "| controls in main:", JSON.stringify(t.links));
  }
  console.log("blocked", blocked.length, "console", consoleLines.length);
} finally { await browser.close(); }
