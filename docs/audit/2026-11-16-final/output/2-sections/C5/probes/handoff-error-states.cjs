// C5 probe: a handoff that could not be parsed, one with issues, and an earlier-format (not selected) output, by editing the intercepted snapshot.
// Usage (repo root): [C5_BASE=... C5_RUN=...] node <this file>
"use strict";
const lib = require("./c5lib.cjs");
lib.withRun(async ({ page, base, run, log }) => {
  let mode = "parse";
  await page.route(/\/connected\/snapshot/, async (route) => {
    const response = await route.fetch(); const json = await response.json();
    const outs = json.workspace.outputs;
    const [id, o] = Object.entries(outs).find(([, x]) => x.module === "CP-2D");
    if (mode === "parse") { o.parseError = "The handoff has no Findings section."; json.workspace.handoffs[o.sha256] = []; }
    if (mode === "issue") { o.issue = "bottom line missing; basis page not found"; }
    if (mode === "earlier") {
      const r = Object.values(json.workspace.runs)[0];
      const id2 = id + "-earlier"; outs[id2] = { ...o, id: id2, label: "CP-2D earlier format", sha256: "f".repeat(64) };
      json.workspace.handoffs["f".repeat(64)] = json.workspace.handoffs[o.sha256];
      r.modules["CP-2D"].outputs.push(id2);
    }
    return route.fulfill({ response, json });
  });
  const res = {};
  const [idx] = [null];
  const snap = await (await page.request.get(`${base}/connected/snapshot?run=${run}`)).json();
  const [id, o] = Object.entries(snap.workspace.outputs).find(([, x]) => x.module === "CP-2D");
  const tok = `${encodeURIComponent(id)}~${o.sha256}`;
  for (const m of ["parse", "issue", "earlier"]) {
    mode = m;
    await page.goto(`${base}/report/${run}#evidence/${m === "earlier" ? "trace" : tok}`); await page.reload(); await page.waitForTimeout(700);
    res[m] = { evidence: (await page.locator("main").innerText()).split("Record")[1].trim().slice(0, 260).replace(/\n+/g, " | ") };
    await page.goto(`${base}/report/${run}#evidence/record/CP-2D`); await page.reload(); await page.waitForTimeout(700);
    res[m].record = (await page.locator("main details").first().innerText()).replace(/\n+/g, " | ").slice(0, 300);
    await page.goto(`${base}/report/${run}#modules/CP-2D`); await page.reload(); await page.waitForTimeout(700);
    res[m].modulePage = (await page.locator("main").innerText()).slice(0, 0) + String(await page.getByRole("alert").count()) + " alerts";
  }
  console.log(JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ pageErrors: log.pageErrors, console: log.console.slice(0, 5) }));
}).catch((e) => { console.error(e); process.exit(1); });
