// C5 probe: ArrowDown on the closed Module select of Evidence navigates at once and adds a history entry per key press.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run }) => {
  await page.goto(`${base}/report/${run}#evidence/sources`); await page.reload();
  await page.locator("select").waitFor(); await page.waitForTimeout(400);
  const h0 = await page.evaluate(() => history.length);
  await page.locator("select").focus();
  const urls = [];
  for (let i = 0; i < 5; i += 1) { await page.keyboard.press("ArrowDown"); await page.waitForTimeout(200); urls.push(page.url().split("#")[1]); }
  const h1 = await page.evaluate(() => history.length);
  console.log("urls after each ArrowDown:", urls);
  console.log(`history entries added by 5 key presses: ${h1 - h0}`);
  for (let i = 0; i < 5; i += 1) { await page.goBack(); await page.waitForTimeout(150); }
  console.log("after 5 Back presses:", page.url().split("#")[1]);
}).catch((e) => { console.error(e); process.exit(1); });
