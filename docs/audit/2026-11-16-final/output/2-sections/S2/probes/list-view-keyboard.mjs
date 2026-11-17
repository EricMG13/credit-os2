// S2 probe: keyboard path through the Library home List view (role=grid): can an issuer be opened and a figure's description read without the mouse?
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/list-view-keyboard.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page, consoleLines } = await open();
const f = () => page.evaluate(() => { const e = document.activeElement; return e.tagName + "|" + (e.getAttribute("role") || "") + "|" + (e.getAttribute("aria-label") || e.textContent.trim().slice(0, 28)); });
try {
  await page.goto(hash(v.url, "/library/home"));
  await page.waitForTimeout(400);
  await page.getByRole("radio", { name: "List" }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  // Tab until the grid takes focus
  for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); const a = await f(); if (a.startsWith("TR|row|") || a.includes("|grid|")) { console.log("Tab reaches the grid at stop", i + 1, "->", a); break; } }
  const trail = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press("ArrowRight"); const a = await f(); trail.push(a); if (/^BUTTON\|\|4\.6x/.test(a)) break; }
  console.log("ArrowRight trail:", trail.join(" > "));
  await page.waitForTimeout(900);
  console.log("tooltip visible while the figure has keyboard focus:", await page.getByRole("tooltip").count());
  await page.keyboard.press("Home");
  const link = [];
  for (let i = 0; i < 3; i++) { await page.keyboard.press("ArrowLeft"); link.push(await f()); }
  console.log("ArrowLeft trail:", link.join(" > "));
  console.log("console", consoleLines.length);
} finally { await browser.close(); v.cleanup(); }
