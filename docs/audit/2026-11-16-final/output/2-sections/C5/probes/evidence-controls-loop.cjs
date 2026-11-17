// C5 probe: scripted loops over the repeated Evidence controls: handoff name links, <details> disclosures (mouse, Enter, Space),
// the drawer's "Evidence retained with this item" disclosure, the "Open Sources" link and every "Open source" gap link.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run, log }) => {
  const out = {};
  // 1. handoff name links on the Trace tab
  await page.goto(`${base}/report/${run}#evidence/trace`); await page.reload(); await page.waitForTimeout(600);
  const names = await page.locator('main ul li > a[href*="#evidence/"]').evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
  out.handoffLinks = { count: names.length, results: [] };
  for (const [text, href] of names) {
    await page.goto(`${base}/report/${run}#evidence/trace`); await page.waitForTimeout(150);
    await page.locator(`main ul li > a[href="${href}"]`).click(); await page.waitForTimeout(250);
    const h = await page.locator("main article h2").first().innerText().catch(() => null);
    const sel = await page.locator("select").inputValue();
    out.handoffLinks.results.push({ text, heading: h, ok: h === `${text} · Handoff evidence`, select: sel });
  }
  out.handoffLinks.bad = out.handoffLinks.results.filter((r) => !r.ok);
  // keyboard Enter on one
  await page.goto(`${base}/report/${run}#evidence/trace`); await page.reload(); await page.waitForTimeout(400);
  await page.locator('main ul li > a[href*="#evidence/"]').nth(5).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  out.handoffEnter = await page.locator("main article h2").first().innerText().catch(() => null);
  // 2/3. disclosures on checks and record
  for (const tab of ["checks", "record"]) {
    await page.goto(`${base}/report/${run}#evidence/${tab}`); await page.reload(); await page.waitForTimeout(600);
    const n = await page.locator("main details > summary").count();
    const res = { count: n, mouse: 0, enter: 0, space: 0 };
    for (let i = 0; i < Math.min(n, 1000); i += 1) {
      const d = page.locator("main details").nth(i); const s = d.locator("> summary");
      await s.scrollIntoViewIfNeeded();
      const open0 = await d.evaluate((e) => e.open);
      await s.click(); const open1 = await d.evaluate((e) => e.open);
      if (open1 !== open0) res.mouse += 1;
      await s.focus(); await page.keyboard.press("Enter"); const open2 = await d.evaluate((e) => e.open);
      if (open2 !== open1) res.enter += 1;
      await page.keyboard.press("Space"); const open3 = await d.evaluate((e) => e.open);
      if (open3 !== open2) res.space += 1;
    }
    out[`details_${tab}`] = res;
  }
  // 5. drawer disclosure on 3 representatives
  await page.goto(`${base}/report/${run}#modules/CP-1`); await page.reload(); await page.waitForTimeout(700);
  const drawer = { tried: 0, mouse: 0, enter: 0, space: 0 };
  for (const i of [0, 2, 5]) {
    await page.locator('button[aria-label^="Show sources for"]').nth(i).click();
    const d = page.getByRole("dialog"); await d.waitFor();
    const det = d.locator("details").first(); const s = det.locator("> summary");
    drawer.tried += 1;
    const a = await det.evaluate((e) => e.open); await s.click(); const b = await det.evaluate((e) => e.open); if (a !== b) drawer.mouse += 1;
    await s.focus(); await page.keyboard.press("Enter"); const c = await det.evaluate((e) => e.open); if (c !== b) drawer.enter += 1;
    await page.keyboard.press("Space"); const e2 = await det.evaluate((e) => e.open); if (e2 !== c) drawer.space += 1;
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  }
  out.drawerDisclosure = drawer;
  // 4/6. interception: a Basis that names an uploaded source file, and several gaps
  await page.route(/\/connected\/snapshot/, async (route) => {
    const response = await route.fetch(); const json = await response.json();
    const o6 = Object.values(json.workspace.outputs).find((x) => x.module === "CP-6");
    const secs = json.workspace.handoffs[o6.sha256];
    for (const s of secs) for (const b of s.blocks) if (b.type === "text" && /^Basis: annual\.txt/m.test(b.text)) b.text = b.text.replace("annual.txt, page 2", "northbridge-filing.txt, page 1");
    const o2 = Object.values(json.workspace.outputs).find((x) => x.module === "CP-2D");
    const gaps = json.workspace.handoffs[o2.sha256].find((s) => s.heading === "Gaps");
    gaps.blocks = [{ type: "table", line: 900, headers: ["Gap", "Severity"], rows: [1, 2, 3, 4, 5].map((i) => ({ line: 900 + i + 1, cells: [`gap ${i}`, ["High", "Medium", "Low", "High", "Low"][i - 1]] })) }];
    return route.fulfill({ response, json });
  });
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  const o6 = Object.values(snap.workspace.outputs).find((x) => x.module === "CP-6");
  const id6 = Object.keys(snap.workspace.outputs).find((k) => snap.workspace.outputs[k] === o6 || snap.workspace.outputs[k].sha256 === o6.sha256);
  await page.goto(`${base}/report/${run}#evidence/${encodeURIComponent(id6)}~${o6.sha256}-32`); await page.reload(); await page.waitForTimeout(800);
  const open = page.getByRole("link", { name: "Open Sources" });
  out.openSources = { present: await open.count(), sourceRecords: (await page.locator("main article h3", { hasText: "Source records" }).count()) };
  if (await open.count()) { const href = await open.getAttribute("href"); await open.click(); await page.waitForTimeout(400); out.openSources.href = href; out.openSources.landed = page.url().split("#")[1]; out.openSources.module = await page.locator("select").inputValue(); out.openSources.tabCurrent = await page.locator('nav[aria-label="Evidence sections"] [aria-current="page"]').first().innerText(); }
  await page.goto(`${base}/report/${run}#evidence/gaps`); await page.reload(); await page.waitForTimeout(700);
  const gl = await page.getByRole("link", { name: "Open source" }).evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  out.gapLinks = { count: gl.length, results: [] };
  for (const href of gl) { await page.goto(`${base}/report/${run}#evidence/gaps`); await page.waitForTimeout(150); await page.locator(`main a[href="${href}"]`).click(); await page.waitForTimeout(300); out.gapLinks.results.push({ h: await page.locator("main article h2").first().innerText().catch(() => null), alert: await page.getByRole("alert").count() }); }
  console.log(JSON.stringify(out, null, 1));
  console.log(JSON.stringify({ blocked: log.blocked, pageErrors: log.pageErrors, console: log.console.slice(0, 5) }));
}).catch((e) => { console.error(e); process.exit(1); });
