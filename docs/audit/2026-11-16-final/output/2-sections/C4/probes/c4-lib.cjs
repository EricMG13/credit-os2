// Shared helper for the C4 probes. Run any probe from the repository root:
//   C4_PORT=8734 node docs/audit/2026-11-16-final/output/2-sections/C4/probes/<probe>.cjs
// Requires proof.serve running on C4_PORT with a finished synthetic run (see c4-setup-run.cjs),
// and the run id in C4_RUN (or the file /tmp/cs-C4/run-id.txt).
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const { chromium } = createRequire(path.join(REPO, "web", "package.json"))("playwright");
const PORT = Number(process.env.C4_PORT || 8734);
const BASE = `http://127.0.0.1:${PORT}`;
const EXE = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

function runId() {
  if (process.env.C4_RUN) return process.env.C4_RUN;
  return fs.readFileSync("/tmp/cs-C4/run-id.txt", "utf8").trim();
}

async function launch() {
  let opts = { executablePath: EXE };
  if (!fs.existsSync(EXE)) opts = {};
  return chromium.launch(opts);
}

// Every host but loopback is aborted and recorded.
async function newContext(browser, log, viewport = { width: 1440, height: 900 }, extra = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ...extra });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(30000);
  await context.route("**/*", (route) => {
    const request = route.request();
    let host = "";
    try {
      const u = new URL(request.url());
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      host = u.hostname;
    } catch {
      /* unparsable */
    }
    if (LOOPBACK.has(host)) return route.continue();
    log.blocked.push({ url: request.url(), type: request.resourceType() });
    return route.abort("blockedbyclient");
  });
  context.on("page", (p) => watch(p, log));
  return context;
}

function watch(page, log) {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") log.console.push({ type: m.type(), page: page.url(), text: m.text().slice(0, 300) });
  });
  page.on("pageerror", (e) => log.pageErrors.push({ page: page.url(), text: String(e).slice(0, 300) }));
  page.on("requestfailed", (r) => {
    log.failed.push({ url: r.url(), page: page.url(), failure: r.failure() && r.failure().errorText });
  });
  page.on("response", (r) => {
    if (r.status() >= 400) log.bad.push({ url: r.url(), status: r.status(), page: page.url() });
  });
  page.on("request", (r) => {
    try {
      const u = new URL(r.url());
      if (u.protocol === "http:" || u.protocol === "https:") log.requests.push(`${r.method()} ${u.pathname}${u.search}`);
    } catch {
      /* ignore */
    }
  });
}

const newLog = () => ({ blocked: [], console: [], pageErrors: [], failed: [], bad: [], requests: [] });

module.exports = { REPO, PORT, BASE, launch, newContext, watch, newLog, runId, chromium, path, fs };
