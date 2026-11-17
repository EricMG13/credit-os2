// S2 probe: text set below 13px (D-30) and pointer targets below 24 px (D-41) on every S2 address.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/scan-type-and-targets.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const ADDR = [
  "/library/home", "/library/halden-aerostructures/history", "/library/corvane-packaging/history",
  "/library/halden-aerostructures/2026-09-30/overview", "/library/halden-aerostructures/2026-09-30/changes",
  "/library/halden-aerostructures/2026-03-31/overview", "/library/halden-aerostructures/2025-09-30/changes",
];
const v = makeVariant();
const SCAN = () => {
  const small = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || el.closest("[aria-hidden=true]") && false) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const px = parseFloat(cs.fontSize);
    if (px < 13) {
      const key = px + "px | " + el.className.toString().split(/\s+/).filter((c) => /^text-|font-/.test(c)).join(" ");
      const e = small.get(key) ?? { count: 0, sample: t.slice(0, 40) };
      e.count++; small.set(key, e);
    }
  }
  const targets = [];
  for (const e of document.querySelectorAll("a[href],button,input,[role=switch],[role=radio],[role=columnheader][aria-sort],[role=button]")) {
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (e.closest("a[href]") !== e && e.tagName === "A") continue;
    const inline = e.tagName === "A" && getComputedStyle(e).display === "inline";
    if ((r.width < 24 || r.height < 24) && !inline) targets.push(`${e.tagName} ${e.getAttribute("aria-label") ?? e.textContent.trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return { small: [...small.entries()], targets };
};
const { browser, page } = await open({ width: 1440, height: 900 });
try {
  for (const a of ADDR) {
    await page.goto(hash(v.url, a));
    await page.waitForTimeout(400);
    const r = await page.evaluate(SCAN);
    console.log("==", a);
    for (const [k, e] of r.small) console.log("  <13px:", k, "x" + e.count, JSON.stringify(e.sample));
    for (const t of [...new Set(r.targets)].slice(0, 8)) console.log("  target<24:", t);
  }
} finally { await browser.close(); v.cleanup(); }
