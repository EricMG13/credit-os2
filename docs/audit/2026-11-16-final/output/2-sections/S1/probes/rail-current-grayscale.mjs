// S1-019: the rail's current item differs from the others only by hue and a faint tint; measured contrast between the cues and a grayscale capture.
// Run from the repository root: timeout 100 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/rail-current-grayscale.mjs
import path from "node:path";
import { makeDist, pageUrl, open, cleanup, sleep, repo } from "./s1-lib.mjs";
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const px = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(pageUrl(dir, "#/model")); await page.waitForSelector("h1"); await sleep(250);
    const c = await page.evaluate(() => { const cur = document.querySelector("nav a[aria-current=page]"), other = document.querySelector("nav a:not([aria-current])"); return { curIcon: getComputedStyle(cur.querySelector("svg")).color, otherIcon: getComputedStyle(other.querySelector("svg")).color, curBg: getComputedStyle(cur).backgroundColor, railBg: getComputedStyle(other).backgroundColor, curBorder: getComputedStyle(cur).borderTopWidth, curOutline: getComputedStyle(cur).outlineStyle }; });
    console.log(JSON.stringify(c));
    console.log("current icon vs other icon: " + ratio(px(c.curIcon), px(c.otherIcon)).toFixed(2) + ":1");
    console.log("current tint vs rail: " + ratio(px(c.curBg), px(c.railBg)).toFixed(2) + ":1 (WCAG 1.4.11 asks 3:1 for a state indicator; D-39 asks a second cue besides colour)");
    await page.addStyleTag({ content: "html{filter:grayscale(1)}" }).catch(async () => { await page.evaluate(() => { document.documentElement.style.filter = "grayscale(1)"; }); });
    await sleep(200);
    await page.screenshot({ path: path.join(repo, "docs/audit/2026-11-16-final/output/2-sections/S1/evidence/rail-grayscale.png"), clip: { x: 0, y: 0, width: 200, height: 270 } });
  } finally { await browser.close(); }
} finally { cleanup(); }
