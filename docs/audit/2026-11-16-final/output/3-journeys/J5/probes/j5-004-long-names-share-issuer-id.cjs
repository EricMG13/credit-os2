// J5-004: the Issuer ID built from the name is cut at 40 characters, so two different issuers whose
// names share their first 40 characters get one ID; the Library then shows one card (the later run's
// name) and cannot find the other issuer by name. Run from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-004-long-names-share-issuer-id.cjs
"use strict";
const lib = require("./_j5lib.cjs");
const OUT = process.env.J5_PROBE_OUT || "/tmp/jr/j5-scratch/probe-out";
require("node:fs").mkdirSync(OUT, { recursive: true });
const text = async (page) => (await page.locator("main").innerText()).replace(/\n+/g, " | ");

lib.segment("p004", async ({ page, origin }) => {
  const names = ["Northbridge Synthetic Group International Holdings Limited", "Northbridge Synthetic Group International Finance plc"];
  const ids = [];
  const idOnSheet = [];
  for (const [i, issuer] of names.entries()) {
    const id = await lib.submitRun(page, origin, {
      issuer, asOf: i === 0 ? "2025-03-31" : "2025-06-30",
      onReview: async (p) => { await p.waitForTimeout(700); idOnSheet.push(/Issuer ID\s*\|?\s*([a-z0-9-]+)/.exec(await text(p))?.[1]); },
    });
    await lib.waitEnded(origin, id);
    await lib.waitPublished(origin, id);
    ids.push(id);
  }
  await page.goto(origin + "/");
  await page.waitForTimeout(1200);
  const cards = await page.locator("main h3").allInnerTexts();
  const runsLink = (await page.locator("main").innerText()).match(/\d+ runs?/g);
  await page.screenshot({ path: `${OUT}/j5-004-one-card.png` });
  await page.getByLabel("Search issuers", { exact: true }).fill("Holdings");
  await page.waitForTimeout(500);
  const searchResult = (await text(page)).split("List | ")[1];
  const headers = [];
  for (const id of ids) {
    await page.goto(`${origin}/report/${id}#history`);
    await page.waitForTimeout(900);
    headers.push({ h1: await page.locator("h1").first().innerText(), rows: (await text(page)).split("Report history")[1].trim() });
  }
  return {
    reproduced: idOnSheet[0] === idOnSheet[1] && cards.length === 1 && /Finance/.test(cards[0]) && /No issuers match/.test(searchResult),
    summary: `Issuer IDs on the review sheets: ${JSON.stringify(idOnSheet)} (${idOnSheet[0]?.length} characters); Library cards: ${JSON.stringify(cards)} ${JSON.stringify(runsLink)}; search "Holdings": ${JSON.stringify(searchResult)}; each report's own header: ${JSON.stringify(headers.map((h) => h.h1))}; history rows (no issuer name on them): ${JSON.stringify(headers[0].rows)}`,
  };
});
