// C5-001 probe: /connected/snapshot returns the server's absolute workspace path in catalogue.workspace
// (src/deploy_workflow/credit_os_catalogue.py:517); /connected/library strips it.
// Self-contained. Run from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/C5/probes/snapshot-path-leak.cjs
// It refuses if port 8735 is in use, starts `.venv/bin/python -m proof.serve` (synthetic, no paid call) on 8735 with a fresh
// empty root under /tmp/cs-C5/, checks the unscoped /connected/snapshot first (no browser needed if it already shows the path),
// otherwise completes one synthetic run through c5lib.cjs and checks the scoped snapshot, and stops the service on every exit.
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const PORT = 8735;
const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const TMP = "/tmp/cs-C5";
fs.mkdirSync(TMP, { recursive: true });
let child = null;
const stop = () => { if (child) { try { process.kill(-child.pid, "SIGTERM"); } catch { /* already stopped */ } child = null; } };
for (const sig of ["SIGINT", "SIGTERM"]) process.once(sig, () => { stop(); process.exit(130); });
process.on("exit", stop);

const portInUse = () => new Promise((resolve) => {
  const s = net.connect({ host: "127.0.0.1", port: PORT });
  s.once("connect", () => { s.destroy(); resolve(true); });
  s.once("error", () => resolve(false));
});
const getJson = async (url) => { const r = await fetch(url); return { status: r.status, json: await r.json().catch(() => null) }; };
const abs = (x) => typeof x === "string" && /^(\/[A-Za-z0-9_.-]+){2,}/.test(x);

(async () => {
  if (await portInUse()) { console.error(`REFUSED: port ${PORT} is already in use`); process.exit(2); }
  const root = fs.mkdtempSync(path.join(TMP, "leak-")); // /tmp/cs-C5/leak-XXXXXX, well under 80 characters
  const venvPython = path.join(REPO, ".venv", "bin", "python");
  child = spawn(venvPython, ["-m", "proof.serve", "--root", root, "--port", String(PORT)], { cwd: REPO, env: { ...process.env, PYTHONPATH: "src", PYTHONUNBUFFERED: "1" }, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d) => (out += d)); child.stderr.on("data", (d) => (out += d));
  const base = `http://127.0.0.1:${PORT}`;
  let up = false;
  for (let i = 0; i < 120 && !up; i += 1) {
    if (child.exitCode !== null) break;
    up = await fetch(`${base}/`).then((r) => r.ok, () => false);
    if (!up) await new Promise((r) => setTimeout(r, 500));
  }
  if (!up) { console.error(`proof.serve did not answer:\n${out}`); process.exit(1); }
  console.log(`service up on ${base}, root ${root}`);

  let snap = await getJson(`${base}/connected/snapshot`);
  let how = "unscoped /connected/snapshot on an empty root";
  let workspace = snap.json?.catalogue?.workspace;
  if (!workspace) {
    // No library yet: complete one synthetic run through the shared helper, then read the scoped snapshot.
    const lib = require("./c5lib.cjs");
    const log = lib.newLog();
    const browser = await lib.launch();
    let run;
    try {
      const context = await lib.guardedContext(browser, log);
      const page = await context.newPage();
      page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(30000);
      const done = await lib.completeRun(page, base);
      if (!/Finished/.test(done.status)) throw new Error(`run did not finish: ${done.status}`);
      run = done.run;
    } finally { await browser.close().catch(() => {}); }
    snap = await getJson(`${base}/connected/snapshot?run=${run}`);
    workspace = snap.json?.catalogue?.workspace;
    how = `/connected/snapshot?run=${run} after one synthetic run`;
  }
  const hits = [];
  const walk = (x, p = "") => {
    if (Array.isArray(x)) x.forEach((v, i) => walk(v, `${p}[${i}]`));
    else if (x && typeof x === "object") Object.entries(x).forEach(([k, v]) => walk(v, `${p}/${k}`));
    else if (abs(x) && !/^\/(connected|library|report|start|run|runs)(\/|$)/.test(x)) hits.push([p, x]);
  };
  walk(snap.json);
  const lib2 = await getJson(`${base}/connected/library`);
  console.log(`checked: ${how}`);
  console.log("absolute paths in the snapshot:", JSON.stringify(hits));
  console.log("/connected/library catalogue.workspace:", JSON.stringify(lib2.json?.catalogue?.workspace ?? null));
  const leaked = hits.some(([p, v]) => p === "/catalogue/workspace" && v.startsWith(root));
  console.log(leaked ? `RESULT: LEAK REPRODUCED: catalogue.workspace = ${workspace}` : "RESULT: no absolute workspace path in the snapshot");
  stop();
  process.exit(leaked ? 0 : 1);
})().catch((e) => { console.error(e); stop(); process.exit(1); });
