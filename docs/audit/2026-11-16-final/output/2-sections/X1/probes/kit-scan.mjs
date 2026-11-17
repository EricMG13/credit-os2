// Kit page (#/kit, shipped web/dist opened from disk) at 1440 and 390: offline fonts, heading fonts,
// text under 13 px, looping animations, reduced-motion loops, console errors, blocked requests.
// Shows findings X1-001 (text under 13 px) and X1-002 (empty-state heading font), and the offline pass.
// Usage (repository root): node docs/audit/2026-11-16-final/output/2-sections/X1/probes/kit-scan.mjs
import { launch, newPage, kitUrl } from "./lib.mjs";

const browser = await launch();
try {
  for (const [w, h] of [
    [1440, 900],
    [390, 844],
  ]) {
    const { context, page, blocked, consoleMsgs, pageErrors } = await newPage(browser, { width: w, height: h });
    await page.goto(kitUrl);
    await page.waitForSelector("h1");
    await page.evaluate(() => document.fonts.ready);
    const r = await page.evaluate(() => {
      const faces = [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`);
      const vis = (el) => {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return b.width > 0 && b.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
      };
      const headFont = {};
      for (const hd of document.querySelectorAll("h1,h2,h3,h4")) {
        const f = getComputedStyle(hd).fontFamily.split(",")[0].replace(/"/g, "");
        (headFont[f] ??= []).push(`${hd.tagName} ${hd.textContent.trim().slice(0, 28)}`);
      }
      const small = {};
      const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
      const seen = new Set();
      while (walker.nextNode()) {
        const n = walker.currentNode;
        const el = n.parentElement;
        if (!n.textContent.trim() || seen.has(el) || !vis(el)) continue;
        seen.add(el);
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 13) (small[`${fs}px`] ??= new Set()).add(`${el.tagName.toLowerCase()}: ${n.textContent.trim().slice(0, 24)}`);
      }
      const loops = [];
      for (const el of document.querySelectorAll("*")) {
        const cs = getComputedStyle(el);
        if (cs.animationName !== "none" && cs.animationIterationCount === "infinite" && vis(el))
          loops.push(`${el.tagName.toLowerCase()} ${cs.animationName} ${cs.animationDuration}`);
      }
      return {
        faces,
        headFont: Object.fromEntries(Object.entries(headFont).map(([k, v]) => [k, v.length > 6 ? [...v.slice(0, 6), `... ${v.length} in all`] : v])),
        small: Object.fromEntries(Object.entries(small).map(([k, v]) => [k, [...v].slice(0, 14)])),
        loops,
      };
    });
    console.log(`=== ${w}px`);
    console.log("blocked:", blocked, "console:", consoleMsgs, "pageErrors:", pageErrors);
    console.log("font faces:", r.faces.join("; "));
    console.log("heading font families:", JSON.stringify(r.headFont, null, 1));
    console.log("text under 13px:", JSON.stringify(r.small, null, 1));
    console.log("looping animations:", r.loops);
    await context.close();
  }
  const { context, page } = await newPage(browser, { reducedMotion: "reduce" });
  await page.goto(kitUrl);
  await page.waitForSelector("h1");
  const running = await page.evaluate(() =>
    [...document.querySelectorAll("*")].filter((e) => {
      const cs = getComputedStyle(e);
      return cs.animationName !== "none" && cs.animationPlayState === "running";
    }).length,
  );
  console.log("=== reduced motion: elements with a running animation:", running);
  await context.close();
} finally {
  await browser.close();
}
