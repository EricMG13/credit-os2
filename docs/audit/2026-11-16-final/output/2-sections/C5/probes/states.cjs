// C5 probe: Evidence states reached by intercepting the loopback service's replies in the browser.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>   (writes JSON to C5_OUT and screenshots to C5_SHOTS)
// Cases: empty/long/unrecorded sources, gap ledger variants, zip missing, downloads empty, script checks none and variants,
// record variants, activity 500/slow/empty, artifacts 500/empty/model/slow/malformed. No application code is touched.
"use strict";
const fs = require("fs");
const lib = require("./c5lib.cjs");
const OUT = process.env.C5_OUT || "/tmp/cs-C5/scratch/states.json";
const SHOTS = process.env.C5_SHOTS || "/tmp/cs-C5/scratch";
const LONG = "very-long-source-file-name-without-any-spaces-" + "x".repeat(260) + ".pdf";

lib.withRun(async ({ page, base, run, log, browser }) => {
  const res = {};
  const evUrl = (h) => `${base}/report/${run}#evidence/${h}`;
  let snapEdit = null, activity = null, artifacts = null;
  await page.route(/\/connected\/snapshot/, async (route) => {
    if (!snapEdit) return route.continue();
    const response = await route.fetch();
    const json = await response.json();
    snapEdit(json);
    return route.fulfill({ response, json });
  });
  await page.route(/\/connected\/activity\//, async (route) => (activity ? activity(route) : route.continue()));
  await page.route(/\/connected\/artifacts\/[^/]+$/, async (route) => (artifacts ? artifacts(route) : route.continue()));
  const text = async () => (await page.locator("main").innerText()).split("Record\n").slice(-1)[0];
  const load = async (hash, width = 1440, wait = 900) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(evUrl(hash));
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(wait);
  };
  const overflow = () => page.evaluate(() => ({ docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, mainOverflow: (() => { const m = document.querySelector("main"); return m.scrollWidth > m.clientWidth; })() }));
  const shot = async (name, width = 1440) => {
    const h = await page.evaluate(() => Math.min(document.querySelector("main").scrollHeight + 200, 5000));
    await page.setViewportSize({ width, height: h });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOTS}/state-${name}-${width}.png` });
    await page.setViewportSize({ width, height: 900 });
  };
  const run1 = (json) => Object.values(json.workspace.runs)[0];
  const cp = (json, module) => Object.values(json.workspace.outputs).find((o) => o.module === module);

  // S1 empty sources
  snapEdit = (j) => { const r = run1(j); r.evidence.sources = []; r.evidence.unused = []; r.evidence.unrecorded = []; };
  await load("sources"); res.sourcesEmpty = await text();
  await load("summary"); res.summaryNoSources = (await text()).split("\n").filter((l) => /source files/.test(l));
  await load("sources/CP-2D"); res.sourcesEmptyModule = await text();
  await shot("sources-empty");
  // S2 long / unrecorded / no hash
  snapEdit = (j) => {
    const r = run1(j);
    r.evidence.unused = [{ name: LONG, type: "pdf", documentDate: null, readBy: [], sha256: null, sourceWarning: "This file was not parsed." }];
    r.evidence.unrecorded = [{ name: "second file.xlsx", type: null, documentDate: "2025-12-31", readBy: ["CP-1", "CP-BOGUS"], sha256: "abc", href: "/connected/sources/x/abc/second file.xlsx" }];
  };
  for (const w of [1440, 390]) { await load("sources", w); res[`sourcesLong${w}`] = { overflow: await overflow(), text: (await text()).slice(-700) }; await shot("sources-long", w); }
  // S3 gaps
  snapEdit = (j) => {
    const o = cp(j, "CP-2D"); const sections = j.workspace.handoffs[o.sha256];
    const gaps = sections.find((s) => s.heading === "Gaps");
    const base0 = 900;
    gaps.blocks = [
      { type: "table", line: base0, headers: ["Gap", "Severity", "Affected conclusion", "Zero check"], rows: [
        { line: base0 + 2, cells: ["Covenant schedule missing", "High", "Headroom not computed", "0"] },
        { line: base0 + 3, cells: ["Rating agency report stale", "Medium", "", "0.00"] },
        { line: base0 + 4, cells: ["Peer set thin", "Low", "none", ""] },
        { line: base0 + 5, cells: ["Hedge book not seen", "CRITICAL", "Cost of debt", "n.a."] },
        { line: base0 + 6, cells: ["Unranked gap", "", "x".repeat(300), "0"] },
        { line: base0 + 7, cells: ["None", "", "", ""] },
      ] },
      { type: "text", line: base0 + 10, end: base0 + 10, text: "A free-text gap with **bold** and `code` and a long run " + "word ".repeat(80) },
    ];
  };
  for (const w of [1440, 390]) { await load("gaps", w); res[`gaps${w}`] = { overflow: await overflow(), text: (await text()).slice(0, 2500) }; await shot("gaps-variants", w); }
  await load("gaps/CP-2D"); res.gapsModule = (await text()).slice(0, 300);
  // follow "Open source" for the first gap
  await load("gaps");
  const open = page.getByRole("link", { name: "Open source" }).first();
  res.gapOpenSourceHref = await open.getAttribute("href");
  await open.click(); await page.waitForTimeout(600);
  res.gapOpenSourceResult = { url: page.url().replace(base, ""), alert: await page.getByRole("alert").count(), h2: await page.locator("main article h2").first().innerText().catch(() => null), body: (await page.locator("main article").first().innerText().catch(() => "")).slice(0, 600) };
  // S4 zip missing, downloads empty
  snapEdit = (j) => { const r = run1(j); r.evidence.zip = null; r.evidence.handoffs = []; r.evidence.downloads = []; };
  await load("summary"); res.noZipNoDownloads = (await text()).slice(0, 700);
  await load("trace"); res.noZipTrace = (await text()).slice(0, 400);
  await shot("zip-missing");
  // S5 script checks none / variants
  snapEdit = (j) => { run1(j).evidence.scriptChecks = []; };
  await load("checks"); res.checksNoneAddr = { current: await page.locator('nav[aria-label="Evidence sections"] [aria-current="page"]').first().innerText(), body: (await text()).slice(0, 200) };
  snapEdit = (j) => {
    run1(j).evidence.scriptChecks = [{ module: "CP-2D", attempt: 2, response: null, counts: [{ status: "agreed", n: 1 }, { status: "disagreed", n: 1 }, { status: "contradicted", n: 1 }, { status: "missing", n: 1 }, { status: "weird status", n: 1 }], scripts: [{ name: LONG, sha256: null }],
      outcomes: [
        { figure: "Net debt", register: "T2D.1", row: "FY2024", status: "agreed", reason: null, script: "a.py", stated: "1125", recomputed: 1125, recomputedLabel: null, tolerance: 0, unit: "US$m" },
        { figure: "Cover", register: "T2D.2", row: "all", status: "disagreed", reason: "stated 4.0x, recomputed 3.1x", script: "a.py", stated: "4.0", recomputed: 0, recomputedLabel: "x", tolerance: 0.05, unit: null },
        { figure: null, register: null, row: null, status: "contradicted", reason: "", script: null, stated: null, recomputed: null, recomputedLabel: null, tolerance: null, unit: null },
        { figure: "x".repeat(300), register: "R", row: "", status: "missing", reason: "y".repeat(300), script: LONG, stated: "", recomputed: null, recomputedLabel: "label only", tolerance: null, unit: "x" },
        { figure: "Odd", register: "R2", row: "r", status: "weird status", reason: "r", script: "a.py", stated: "n.a.", recomputed: -0, recomputedLabel: null, tolerance: null, unit: "%" },
      ] }];
  };
  for (const w of [1440, 390]) { await load("checks/CP-2D", w); res[`checksVariants${w}`] = { overflow: await overflow(), text: (await text()).slice(0, 2600) }; await shot("checks-variants", w); }
  // S6 record variants
  snapEdit = (j) => { const r = run1(j); r.evidence.record = { hashes: [], instructions: [{ module: "CP-1", href: null, sha256: null }, { module: "CP-1", href: "downloads/other-run/CP-1.md", sha256: null }, { module: "CP-1", href: "../../etc/passwd", sha256: null }], calls: [{ module: null, attempt: null, started: null, http_status: 0, error_class: "timeout", settled_usd: "0" }, { module: "CP-1", attempt: 0, started: "x", http_status: 429, error_class: null, settled_usd: null }], cap: null }; r.record = null; };
  await load("record"); res.recordVariants = await text(); await shot("record-variants");
  // S7 activity states
  snapEdit = null;
  activity = (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"boom"}' });
  await load("record"); res.activity500 = (await text()).slice(0, 500);
  activity = (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  await load("record"); res.activityEmpty = (await text()).slice(0, 500);
  activity = async (route) => { await new Promise((r) => setTimeout(r, 4000)); return route.continue(); };
  await load("record", 1440, 500); res.activitySlow = (await text()).slice(0, 400);
  activity = null;
  // S8 artifacts
  artifacts = (route) => route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"x"}' });
  await load("summary"); res.artifacts500 = (await text()).slice(-250);
  artifacts = (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"files":[]}' });
  await load("summary"); res.artifactsEmpty = (await text()).slice(-250);
  artifacts = (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"files":[{"label":"HTML Model","href":"/connected/artifacts/x/y/model.html"},{"label":"Calculation JSON","href":"/connected/artifacts/x/y/calculation.json"}]}' });
  await load("summary"); res.artifactsModel = (await text()).slice(-250);
  artifacts = async (route) => { await new Promise((r) => setTimeout(r, 4000)); return route.continue(); };
  await load("summary", 1440, 500); res.artifactsSlow = (await text()).slice(-250);
  artifacts = (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  await load("summary"); res.artifactsMalformed = (await text()).slice(-250);
  artifacts = (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"files":[{"label":"Evil","href":"https://example.com/x"},{"label":"JS","href":"javascript:alert(1)"}]}' });
  await load("summary"); res.artifactsForeignHref = { tail: (await text()).slice(-300), hrefs: await page.locator("main a[href^='http'], main a[href^='javascript']").evaluateAll((as) => as.map((a) => a.getAttribute("href"))) };
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ keys: Object.keys(res), blocked: log.blocked, pageErrors: log.pageErrors, console: log.console.slice(0, 10) }, null, 1));
}).catch((e) => { console.error(e); process.exit(1); });
