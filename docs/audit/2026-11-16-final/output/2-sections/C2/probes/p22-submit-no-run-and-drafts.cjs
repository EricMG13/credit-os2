// P22: (a) a Submit answered 200 without a run id (the probe answers it; nothing is started) navigates to /run/undefined;
// (b) the page leaves its server-side draft behind when the analyst reloads or goes Back, and the service refuses new drafts
// at 50 ("too many unfinished submissions; try again later", swept only after 24 hours).
// Needs C2_ROOT (the service's run root, default /tmp/cs-C2/root) to count and remove the probe's own drafts.
//   C2_PORT=8732 C2_ROOT=/tmp/cs-C2/root node docs/audit/2026-11-16-final/output/2-sections/C2/probes/p22-submit-no-run-and-drafts.cjs
"use strict";
const L = require("./lib.cjs");
const fs = require("node:fs");
const path = require("node:path");
const ROOT = process.env.C2_ROOT || "/tmp/cs-C2/root";
const uploads = path.join(ROOT, "_engine", "uploads");
const drafts = () => (fs.existsSync(uploads) ? fs.readdirSync(uploads).filter((n) => /^[0-9a-f]{32}$/.test(n) && !fs.existsSync(path.join(uploads, n, "sealed"))) : []);
(async () => {
  const log = L.newLog();
  const out = {};
  const browser = await L.launch();
  try {
    const ctx = await L.context(browser, { log });
    // (a)
    const page = await ctx.newPage();
    L.watch(page, log);
    await ctx.route("**/api/submissions/*/submit", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "queued" }) }));
    await L.reachReview(page, { agreement: false });
    await L.decideAndApprove(page);
    await page.getByRole("button", { name: "Submit run", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Start synthetic run" }).click();
    await page.waitForTimeout(1500);
    out.afterSubmitWithoutRunId = { url: page.url().replace(L.BASE, ""), main: (await page.locator("main").innerText().catch(() => "")).slice(0, 200) };
    await ctx.unroute("**/api/submissions/*/submit");
    // (b) drafts left behind by leaving the page
    const before = drafts().length;
    for (let i = 0; i < 3; i += 1) {
      const p = await ctx.newPage();
      await p.goto(`${L.BASE}/start`);
      await p.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
      await L.fillIdentity(p); await L.addFiles(p, ["filing"]);
      await p.getByRole("button", { name: "Continue to purpose" }).click();
      await p.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
      await p.close(); // the analyst leaves the form
    }
    out.draftsBefore = before; out.draftsAfterThreeAbandonedForms = drafts().length;
    // fill to the limit through the service's own API, then try the form
    const origin = { Origin: L.BASE };
    let made = 0;
    while (drafts().length < 50 && made < 60) { const r = await fetch(`${L.BASE}/api/submissions`, { method: "POST", headers: origin }); if (!r.ok) break; made += 1; }
    out.draftsNow = drafts().length;
    const p2 = await ctx.newPage();
    L.watch(p2, log);
    await p2.goto(`${L.BASE}/start`);
    await p2.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
    await L.fillIdentity(p2); await L.addFiles(p2, ["filing"]);
    await p2.getByRole("button", { name: "Continue to purpose" }).click();
    await p2.waitForTimeout(1200);
    out.atLimit = { alerts: await p2.locator("[role=alert]").allInnerTexts(), h2: await p2.$$eval("h2", (h) => h[0].textContent), buttons: await p2.getByRole("button").allInnerTexts().then((t) => t.filter((x) => /discard|clear|delete/i.test(x))) };
  } catch (e) { out.error = String(e).slice(0, 600); } finally {
    await browser.close();
    for (const n of drafts()) fs.rmSync(path.join(uploads, n), { recursive: true, force: true }); // remove the probe's own drafts
  }
  out.draftsAfterCleanup = drafts().length;
  out.log = { bad: log.bad };
  console.log(JSON.stringify(out, null, 1));
})();
