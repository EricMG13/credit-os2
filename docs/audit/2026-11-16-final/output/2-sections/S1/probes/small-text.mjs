// S1-014: text set below the 13 px floor (D-30) in the shell rail labels and on the Kit page.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/small-text.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
const SCAN = `(() => { const out = {}; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const t = w.currentNode; if (!t.textContent.trim()) continue; const e = t.parentElement; const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") continue; const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue; const fs = parseFloat(cs.fontSize); if (fs < 13) (out[fs + "px"] ??= []).push(t.textContent.trim().slice(0, 24)); } return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { count: v.length, sample: v.slice(0, 8) }])); })()`;
try {
  for (const [w, h, hash] of [[390, 844, "#/model"], [1440, 900, "#/kit"]]) {
    const { browser, page } = await open({ width: w, height: h });
    try {
      await page.goto(pageUrl(dir, hash)); await page.waitForSelector("h1"); await sleep(250);
      console.log(`${w}px ${hash}: ` + JSON.stringify(await page.evaluate(SCAN)));
    } finally { await browser.close(); }
  }
} finally { cleanup(); }
