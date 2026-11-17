// C5 probe: click every download and source-file link on the Evidence page in the browser (mouse, then Enter on a sample)
// and compare the saved bytes with the delivered files. Usage (repo root):
//   C5_BASE=http://127.0.0.1:8735 C5_RUN=<run> C5_ROOT=/tmp/cs-C5/root node <this file>
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const lib = require("./c5lib.cjs");
const ROOT = process.env.C5_ROOT || "/tmp/cs-C5/root";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
lib.withRun(async ({ page, context, base, run, log }) => {
  const dir = fs.readdirSync(path.join(ROOT, "_engine/runs", run, "deliveries"))[0];
  const delivered = (n) => fs.readFileSync(path.join(ROOT, "_engine/runs", run, "deliveries", dir, n));
  const res = { downloads: [], sources: [], record: [], keyboard: [] };
  await page.goto(`${base}/report/${run}#evidence/summary`); await page.reload();
  await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(700);
  const links = await page.locator("main a[download], main a[href*='/library/downloads/'], main a[href*='/connected/artifacts/']").evaluateAll((as) => as.map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href"), download: a.hasAttribute("download") })));
  res.links = links;
  for (const l of links) {
    const loc = page.locator(`main a[href="${l.href}"]`).first();
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }).catch((e) => null), loc.click()]);
    if (!dl) { res.downloads.push({ ...l, error: "no download event" }); continue; }
    const p = await dl.path(); const bytes = fs.readFileSync(p);
    const name = dl.suggestedFilename();
    const m = /\/([^/]+)$/.exec(l.href)[1];
    const expect = /handoffs\.zip$/.test(l.href) ? null : delivered(m);
    res.downloads.push({ text: l.text, filename: name, size: bytes.length, equalsDelivered: expect ? sha(bytes) === sha(expect) : "zip", failure: await dl.failure() });
  }
  // keyboard: Enter on first handoff download link
  await page.locator("main a", { hasText: "Download Source readiness" }).focus();
  const [kdl] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }).catch(() => null), page.keyboard.press("Enter")]);
  res.keyboard.push({ enterDownloads: !!kdl, name: kdl && kdl.suggestedFilename() });
  // sources tab: open each source link (new tab)
  await page.goto(`${base}/report/${run}#evidence/sources`); await page.reload(); await page.waitForTimeout(700);
  const srcLinks = await page.locator("main a[target=_blank]").evaluateAll((as) => as.map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href"), rel: a.getAttribute("rel") })));
  for (const l of srcLinks) {
    const loc = page.locator(`main a[href="${l.href}"]`).first();
    const popupP = context.waitForEvent("page", { timeout: 8000 }).catch(() => null);
    const dlP = page.waitForEvent("download", { timeout: 4000 }).catch(() => null);
    await loc.click();
    const popup = await popupP; const dl = await dlP;
    const rec = { ...l, popup: !!popup, download: !!dl };
    if (popup) { await popup.waitForLoadState().catch(() => {}); rec.url = popup.url().replace(base, ""); rec.body = (await popup.locator("body").innerText().catch(() => "")).slice(0, 80); await popup.close(); }
    res.sources.push(rec);
  }
  // record: instructions download buttons
  await page.goto(`${base}/report/${run}#evidence/record`); await page.reload(); await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelectorAll("main details").forEach((d) => { d.open = true; }));
  const ins = await page.locator("main a", { hasText: "Download instructions" }).evaluateAll((as) => as.map((a) => ({ href: a.getAttribute("href"), download: a.hasAttribute("download") })));
  res.record = { instructionLinks: ins.length, sample: ins.slice(0, 3) };
  if (ins.length) {
    const [d2] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }).catch(() => null), page.locator("main a", { hasText: "Download instructions" }).first().click()]);
    res.record.firstDownload = d2 && { name: d2.suggestedFilename(), size: fs.readFileSync(await d2.path()).length };
    const hashes = await page.locator("main details", { hasText: "Recorded file hashes" }).innerText();
    res.record.hashesTail = hashes.slice(0, 400);
    // instruction bytes vs recorded hash
    const rec = JSON.parse(await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).text());
    const r1 = Object.values(rec.workspace.runs)[0];
    res.record.instructionsRecorded = r1.evidence.record.instructions.slice(0, 2);
    const inst = r1.evidence.record.instructions[0];
    if (inst && inst.href) {
      const p2 = inst.href.replace(/^downloads\/([^/]+)\//, "");
      const bytes = Buffer.from(await (await page.request.get(`${base}/library/${inst.href}`)).body());
      res.record.instructionHashMatches = { recorded: inst.sha256, actual: sha(bytes) };
    }
  }
  fs.writeFileSync(process.env.C5_OUT || "/tmp/cs-C5/scratch/downloads-browser.json", JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1).slice(0, 6000));
  console.log(JSON.stringify({ blocked: log.blocked, pageErrors: log.pageErrors, failed: log.failed.slice(0, 10) }));
}).catch((e) => { console.error(e); process.exit(1); });
