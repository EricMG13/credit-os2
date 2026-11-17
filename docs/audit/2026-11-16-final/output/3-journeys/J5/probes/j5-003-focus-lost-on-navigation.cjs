// J5-003: keyboard only. Every route change (Start a run, Start synthetic run, Open report, Open in
// Evidence, Back) leaves focus on <body>; the next Tab starts again at "Skip to content" and the reader
// pays 4 to 14 Tab stops to get back to the content. Run from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J5/probes/j5-003-focus-lost-on-navigation.cjs
"use strict";
const lib = require("./_j5lib.cjs");
const path = require("node:path");

const active = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    return !a || a === document.body ? "BODY" : `${a.tagName}[${(a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40)}]`;
  });
async function tabUntil(page, re, cap = 40) {
  for (let i = 1; i <= cap; i += 1) {
    await page.keyboard.press("Tab");
    if (re.test(await active(page))) return i;
  }
  return -1;
}

lib.segment("p003", async ({ page, origin }) => {
  const facts = {};
  // finished run, made with the mouse-free path would repeat journey.md; here only the routes matter
  const id = await lib.submitRun(page, origin);
  await lib.waitEnded(origin, id);
  await lib.waitPublished(origin, id);
  const fresh = async (url) => { await page.goto("about:blank"); await page.goto(url); await page.waitForTimeout(1200); };
  // 1 Library -> Start a run
  await fresh(origin + "/");
  facts.tabsToStartARun = await tabUntil(page, /Start a run/);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  facts.afterStartARun = { url: new URL(page.url()).pathname, focus: await active(page) };
  facts.nextTabAfterStartARun = await (async () => { await page.keyboard.press("Tab"); return active(page); })();
  // 2 Run page -> Open report
  await fresh(`${origin}/run/${id}`);
  facts.tabsToOpenReport = await tabUntil(page, /Open report/);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  facts.afterOpenReport = { url: new URL(page.url()).pathname, focus: await active(page) };
  // 3 Report: tabs to the first trace control, open the drawer, Open in Evidence, Back
  await fresh(`${origin}/report/${id}#overview`);
  facts.tabsToFirstTrace = await tabUntil(page, /Show sources for the bottom line/);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  await tabUntil(page, /Open in Evidence/, 12);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  facts.afterOpenInEvidence = { hash: new URL(page.url()).hash.slice(0, 20), focus: await active(page) };
  await page.goBack();
  await page.waitForTimeout(1000);
  facts.afterBack = { hash: new URL(page.url()).hash, focus: await active(page) };
  const lost = [facts.afterStartARun.focus, facts.afterOpenReport.focus, facts.afterOpenInEvidence.focus, facts.afterBack.focus].filter((f) => f === "BODY").length;
  return { reproduced: lost === 4, summary: `focus on <body> after ${lost} of 4 route changes; ${JSON.stringify(facts)}` };
});
