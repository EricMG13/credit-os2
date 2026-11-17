// P23: where the decisions sit on the review sheet. For the default Basic Full-assessment review (no agreement chosen) at
// 1440 and 390 px: distance from the "Review and start" heading to "Limits to decide", total sheet height, number of "Not
// given" rows above the limits, and the visible-limit count against the checkbox wording ("I accept these N limits").
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p23-review-order.cjs
// The probe starts its own proof.serve on a fresh run root and stops it when done (see lib.cjs).
"use strict";
const L = require("./lib.cjs");
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      const ctx = await L.context(browser, { log, width, height });
      const page = await ctx.newPage();
      L.watch(page, log);
      await L.reachReview(page, { agreement: false });
      out[width] = await page.evaluate(() => {
        const head = [...document.querySelectorAll("h2")].find((h) => h.textContent === "Review and start");
        const lim = [...document.querySelectorAll("h3")].find((h) => h.textContent === "Limits to decide");
        const approve = [...document.querySelectorAll("label")].find((l) => /^Approve:/.test(l.textContent.trim()));
        const y = (e) => Math.round(e.getBoundingClientRect().top - head.getBoundingClientRect().top);
        const before = [];
        const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
        let n; let count = 0;
        while ((n = walker.nextNode())) { if (lim.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING && n.textContent.trim() === "Not given") count += 1; }
        const groups = [...document.querySelectorAll("section[aria-labelledby] ul > li")].map((li) => ({ text: li.innerText.split("\n").filter(Boolean).slice(0, 3).join(" / "), label: [...li.querySelectorAll("label")].map((l) => l.textContent.trim()).join(), also: (li.innerText.match(/Also affects: (.*)/) || [])[1] || "" }));
        return { limitsFromHeading: y(lim), approveFromHeading: y(approve), viewportHeight: innerHeight, notGivenAboveLimits: count, blocksAboveLimits: [...document.querySelectorAll("[role=group]")].filter((g) => lim.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_PRECEDING).length, groups };
      });
      await ctx.close();
    }
  } catch (e) { out.error = String(e).slice(0, 600); } finally { await browser.close(); }
  console.log(JSON.stringify(out, null, 1));
})();
