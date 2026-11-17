// C5 probe: what the Evidence page draws while the Model and calculation listing and the run record are still loading,
// and when the listing answers malformed JSON. Requests are delayed or replaced in the browser only.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
const SHOTS = process.env.C5_SHOTS || "/tmp/cs-C5/scratch";
lib.withRun(async ({ page, base, run, log }) => {
  const out = {};
  let artifacts = null, activity = null;
  await page.route(/\/connected\/artifacts\/[^/]+$/, (route) => (artifacts ? artifacts(route) : route.continue()));
  await page.route(/\/connected\/activity\//, (route) => (activity ? activity(route) : route.continue()));
  const tail = async (n) => (await page.locator("main").innerText()).slice(-n);
  // 1. artifacts listing pending for 6 s
  artifacts = async (route) => { await new Promise((r) => setTimeout(r, 6000)); return route.continue(); };
  await page.goto(`${base}/report/${run}#evidence/summary`);
  await page.locator('nav[aria-label="Evidence sections"]').waitFor();
  await page.waitForTimeout(1500);
  out.artifactsWhilePending = { tail: await tail(160), status: await page.getByRole("status").count(), busy: await page.locator('[aria-busy="true"]').count() };
  await page.screenshot({ path: `${SHOTS}/loading-artifacts.png` });
  // 2. malformed JSON ({}), never resolves into text
  artifacts = (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  await page.reload(); await page.waitForTimeout(2500);
  out.artifactsMalformed = await tail(160);
  // 3. record pending
  artifacts = null;
  activity = async (route) => { await new Promise((r) => setTimeout(r, 6000)); return route.continue(); };
  await page.goto(`${base}/report/${run}#evidence/record`); await page.reload(); await page.waitForTimeout(1500);
  out.recordWhilePending = (await page.locator("main").innerText()).split("Run record")[1].slice(0, 160);
  await page.screenshot({ path: `${SHOTS}/loading-record.png` });
  console.log(JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ blocked: log.blocked, pageErrors: log.pageErrors }));
}).catch((e) => { console.error(e); process.exit(1); });
