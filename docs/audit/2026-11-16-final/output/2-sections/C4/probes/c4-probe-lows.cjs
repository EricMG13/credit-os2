// Measurements behind the Low and Info findings of C4 (each prints one line per finding id).
// From the repository root, proof.serve on C4_PORT, finished synthetic run in C4_RUN or /tmp/cs-C4/run-id.txt:
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-lows.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const P = (...a) => console.log(...a);
    const ctx = await lib.newContext(browser, log);
    const page = await ctx.newPage();
    const base = `${lib.BASE}/report/${lib.runId()}`;
    await page.goto(`${base}#forecast`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    // C4-008: Chart/Table toggle, ArrowRight moves focus without selecting
    const g = page.getByRole("radiogroup", { name: "Revenue: Chart or Table" });
    await g.getByRole("radio", { name: "Chart" }).focus();
    await page.keyboard.press("ArrowRight");
    P("C4-008 after ArrowRight: focus =", await page.evaluate(() => document.activeElement.textContent.trim()), "| Chart aria-checked =", await g.getByRole("radio", { name: "Chart" }).getAttribute("aria-checked"), "| Table aria-checked =", await g.getByRole("radio", { name: "Table" }).getAttribute("aria-checked"));
    // C4-009: duplicate accessible names
    const names = await page.evaluate(() => [...document.querySelectorAll("button[aria-label^='Show sources for']")].map((b) => b.getAttribute("aria-label")));
    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    P("C4-009 duplicate trace names:", JSON.stringify([...new Set(dup)]), "count of 'Show sources for Cash proxy by scenario' =", names.filter((n) => n === "Show sources for Cash proxy by scenario").length);
    // C4-016: text under 13px
    const small = await page.evaluate(() => {
      const out = new Map();
      for (const t of document.getElementById("main").querySelectorAll("svg text")) { const f = parseFloat(getComputedStyle(t).fontSize); if (f < 13) out.set("svg text " + f + "px", (out.get("svg text " + f + "px") || 0) + 1); }
      for (const e of document.getElementById("main").querySelectorAll("span,p,div")) { if (e.children.length) continue; const f = parseFloat(getComputedStyle(e).fontSize); const t = e.textContent.trim(); if (t && f < 13) out.set(`html ${f}px "${t.slice(0, 26)}"`, 1); }
      return [...out.entries()];
    });
    P("C4-016 under 13px:", JSON.stringify(small));
    // C4-015: scroll containers that are not keyboard reachable
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const scrollers = await page.evaluate(() => [...document.querySelectorAll("table")].map((t) => { const c = t.closest(".overflow-x-auto"); return c && c.scrollWidth > c.clientWidth ? { cap: (t.closest("section,figure")?.querySelector("h3,h4")?.textContent || "").slice(0, 28), scrollWidth: c.scrollWidth, clientWidth: c.clientWidth, tabIndex: c.tabIndex, role: c.getAttribute("role"), label: c.getAttribute("aria-label") } : null; }).filter(Boolean));
    P("C4-015 clipped tables at 390px:", JSON.stringify(scrollers));
    // C4-014: calendar markers
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}#calendar`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(600);
    const m = page.locator("button[data-event-category]").first();
    P("C4-014 marker size:", JSON.stringify(await m.boundingBox()), "tabindex", await m.getAttribute("tabindex"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    P("C4-014 marker pointer-events at 390px:", await m.evaluate((e) => getComputedStyle(e).pointerEvents));
    // C4-011: Securities yield label wraps
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}#modules/CP-3`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(700);
    const y = await page.evaluate(() => { const f = [...document.querySelectorAll("*")].filter((e) => e.children.length === 0 && /^7\.0100/.test(e.textContent.trim())); return f.map((e) => ({ text: e.textContent.trim(), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width), lh: getComputedStyle(e).lineHeight })); });
    P("C4-011 yield label boxes:", JSON.stringify(y));
    P(JSON.stringify({ blocked: log.blocked, console: log.console, pageErrors: log.pageErrors }));
  } finally { await browser.close(); }
})();
