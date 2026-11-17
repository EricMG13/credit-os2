// J5 Low findings in one service session (J5-005 to J5-009). Writes
// j5-low-checks.json to $J5_PROBE_OUT (default /tmp/jr/j5-scratch/probe-out) and prints one line each.
// Run from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-low-checks.cjs
"use strict";
const fs = require("node:fs");
const lib = require("./_j5lib.cjs");
const OUT = process.env.J5_PROBE_OUT || "/tmp/jr/j5-scratch/probe-out";
fs.mkdirSync(OUT, { recursive: true });
const LONG = "Northbridge Synthetic Group International Holdings and Subsidiaries Limited (formerly Northbridge Synthetic Trading Company plc) Senior Secured Notes Issuer Designated Activity Company";
const text = async (page) => (await page.locator("main").innerText()).replace(/\n+/g, " | ");

lib.segment("plow", async ({ page, origin }) => {
  const r = {};
  // J5-005: two runs of one issuer, the later-submitted one dated a year earlier (no earlier run existed for it)
  const a = await lib.submitRun(page, origin, { issuer: "Northbridge Synthetic Group", asOf: "2025-03-31" });
  await lib.waitEnded(origin, a); await lib.waitPublished(origin, a);
  const b = await lib.submitRun(page, origin, { issuer: "Northbridge Synthetic Group", asOf: "2024-03-31" });
  await lib.waitEnded(origin, b); await lib.waitPublished(origin, b);
  await page.goto(`${origin}/report/${a}#history`); await page.waitForTimeout(1000);
  r.j5_005_history = (await text(page)).split("Report history")[1]?.trim();
  await page.goto(`${origin}/report/${a}#changes`); await page.waitForTimeout(1000);
  r.j5_005_changes = (await text(page)).split("Evidence | ")[1]?.trim();
  await page.screenshot({ path: `${OUT}/j5-005-changes.png` });
  await page.goto(`${origin}/report/${a}#history`); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/j5-005-history.png` });
  // J5-007: the address of a run that has no report
  const bad = await lib.submitRun(page, origin, { issuer: "Badco", files: ["filing"], workbook: false, agreement: false });
  await lib.waitEnded(origin, bad);
  await page.goto(`${origin}/report/${bad}#overview`); await page.waitForTimeout(1500);
  r.j5_007_failed_report = await text(page);
  await page.screenshot({ path: `${OUT}/j5-007-no-report.png` });
  // J5-006: a very long issuer name
  const l = await lib.submitRun(page, origin, { issuer: LONG, asOf: "2025-03-31" });
  await lib.waitEnded(origin, l); await lib.waitPublished(origin, l);
  await page.goto(origin + "/"); await page.waitForTimeout(1000);
  r.j5_006_card_id = (await page.locator("main").innerText()).split("\n").find((t) => /^NORTHBRIDGE-SYNTHETIC-GROUP-INTER/.test(t));
  r.j5_006_title_len = (await (async () => { await page.goto(`${origin}/report/${l}#overview`); await page.waitForTimeout(800); return (await page.title()).length; })());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/report/${l}#history`); await page.waitForTimeout(1000);
  const head = await page.locator("h1").first().boundingBox();
  r.j5_006_h1_390 = { height: Math.round(head.height), viewport: 844 };
  await page.screenshot({ path: `${OUT}/j5-006-long-name-390.png` });
  // J5-008: Report history page at 390 px sticks out of the window; Overview does not
  const edges = async () => page.evaluate(() => ({ vw: document.documentElement.clientWidth, items: [...document.querySelectorAll("section[aria-label=Company], nav[aria-label='Report sections'], main section")].slice(0, 4).map((e) => `${e.tagName.toLowerCase()}[${e.getAttribute("aria-label") || ""}] right=${Math.round(e.getBoundingClientRect().right)}`) }));
  await page.goto(`${origin}/report/${a}#history`); await page.waitForTimeout(1000);
  r.j5_008_history_390 = await edges();
  await page.screenshot({ path: `${OUT}/j5-008-history-390.png` });
  await page.goto(`${origin}/report/${a}#overview`); await page.waitForTimeout(1000);
  r.j5_008_overview_390 = await edges();
  // J5-009: touch targets under 24 px (WCAG 2.2 AA 2.5.8) on the issuer calendar
  await page.goto(`${origin}/report/${a}#calendar`); await page.waitForTimeout(1200);
  r.j5_009_small = await page.evaluate(() => {
    const els = [...document.querySelectorAll("main button, main a, main input, main summary")].filter((e) => { const x = e.getBoundingClientRect(); return x.width > 0 && x.height > 0 && !e.closest(".sr-only"); });
    const box = (e) => { const x = e.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2, x.width, x.height]; };
    const small = els.filter((e) => { const [, , w, h] = box(e); return (w < 24 || h < 24) && !(e.tagName === "A" && e.closest("p, li")); });
    const gap = (e) => { const [x, y, w, h] = box(e); let m = 1e9; for (const o of els) { if (o === e || o.contains(e) || e.contains(o)) continue; const [ox, oy, ow, oh] = box(o); m = Math.min(m, Math.hypot(Math.max(0, Math.abs(x - ox) - (w + ow) / 2), Math.max(0, Math.abs(y - oy) - (h + oh) / 2))); } return Math.round(m); };
    const buttons = small.filter((e) => e.tagName === "BUTTON");
    return { smallTargets: small.length, buttonsUnder24: buttons.length, buttonsWithin10pxOfAnother: buttons.filter((e) => gap(e) < 10).length, sample: buttons.slice(0, 3).map((e) => `${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)} gap ${gap(e)}px: ${(e.getAttribute("aria-label") || e.textContent).trim().slice(0, 50)}`) };
  });
  // J5-011: two different issuers, identical figures (the proof's canned handoffs ignore the name)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin + "/");
  await page.waitForTimeout(1200);
  r.j5_011_cards = await page.locator("main h3").evaluateAll((hs) => hs.map((h) => { const card = h.closest("article, section, div[class*=card], li") || h.parentElement.parentElement; return `${h.textContent.trim().slice(0, 40)} :: ${card.innerText.replace(/\s+/g, " ").slice(h.textContent.length, h.textContent.length + 160)}`; }));
  await page.screenshot({ path: `${OUT}/j5-011-library-two-issuers.png` });
  fs.writeFileSync(`${OUT}/j5-low-checks.json`, JSON.stringify(r, null, 2));
  for (const [k, v] of Object.entries(r)) console.log(k, JSON.stringify(v).slice(0, 420));
  return { reproduced: true, summary: "see lines above and j5-low-checks.json" };
});
