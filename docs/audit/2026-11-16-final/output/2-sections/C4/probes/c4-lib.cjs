// Shared helper for the C4 probes. Every probe is one plain command from the repository root, for example
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-001-codes-in-text.cjs
// and needs nothing running beforehand. The first lib.launch() of a process:
//   1. refuses to go on if something already answers on the port (C4_PORT, default 8734): a probe never reuses a service;
//   2. starts `.venv/bin/python -m proof.serve` (PYTHONPATH=src, synthetic canned responses, no paid call) with a
//      fresh empty root under /tmp/cs-C4/ (path under 80 characters), and waits until it answers;
//   3. drives the Start form in a browser (Northbridge files, proof/northbridge-credit-agreement.txt chosen as the
//      executed agreement) until the synthetic run is Finished, and keeps its id for lib.runId().
// The service is stopped, and its root removed, when the last browser from lib.launch() is closed (every probe
// closes it in a finally block), on process exit, and on SIGINT or SIGTERM. Every host but loopback is aborted in
// every browser context and recorded in log.blocked. Playwright defaults: 15 s actions, 30 s navigation.
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { createRequire } = require("node:module");
const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const { chromium } = createRequire(path.join(REPO, "web", "package.json"))("playwright");
const PORT = Number(process.env.C4_PORT || 8734);
const BASE = `http://127.0.0.1:${PORT}`;
const EXE = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const SERVICE_START_MS = 90000;
const RUN_MS = 300000;

let service = null; // { child, root, run }
let starting = null;
let openBrowsers = 0;
let stopping = null;
const say = (m) => process.stderr.write(`[c4-lib] ${m}\n`);

function portAnswers(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    const done = (v) => { socket.destroy(); resolve(v); };
    socket.setTimeout(1500, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

function killGroup(signal) {
  if (!service || !service.child || service.child.pid === undefined) return;
  try { process.kill(-service.child.pid, signal); } catch { /* already gone */ }
}

function removeRoot() {
  if (service && service.root) {
    try { fs.rmSync(service.root, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// Last-resort synchronous stop, used by the exit and signal handlers.
function stopSync() {
  if (!service) return;
  killGroup("SIGKILL");
  removeRoot();
  service = null;
}
process.on("exit", stopSync);
for (const sig of ["SIGINT", "SIGTERM"]) process.once(sig, () => { stopSync(); process.exit(130); });

async function stopService() {
  if (stopping) return stopping;
  if (!service) return undefined;
  const current = service;
  stopping = (async () => {
    killGroup("SIGTERM");
    for (let i = 0; i < 50 && current.child.exitCode === null && current.child.signalCode === null; i += 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
    killGroup("SIGKILL");
    removeRoot();
    service = null;
    starting = null;
    stopping = null;
    say(`stopped proof.serve on port ${PORT}`);
  })();
  return stopping;
}

async function startService() {
  if (await portAnswers(PORT)) {
    throw new Error(`port ${PORT} already answers. A C4 probe starts its own proof.serve and never reuses a running one: stop that service or set C4_PORT to a free port.`);
  }
  fs.mkdirSync("/tmp/cs-C4", { recursive: true });
  const root = fs.mkdtempSync("/tmp/cs-C4/r-");
  if (root.length >= 80) throw new Error(`run root ${root} is too long`);
  const python = path.join(REPO, ".venv", "bin", "python");
  const child = spawn(python, ["-m", "proof.serve", "--root", root, "--port", String(PORT)], {
    cwd: REPO,
    env: { ...process.env, PYTHONPATH: "src", PYTHONUNBUFFERED: "1" },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (d) => { output += d; });
  child.stderr.on("data", (d) => { output += d; });
  service = { child, root, run: null };
  for (let i = 0; i < SERVICE_START_MS / 500; i += 1) {
    if (output.includes(`${BASE}/`) && (await portAnswers(PORT))) {
      say(`started proof.serve on port ${PORT}, root ${root}`);
      return;
    }
    if (child.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const tail = output.slice(-600);
  await stopService();
  throw new Error(`proof.serve did not start on port ${PORT}:\n${tail}`);
}

function browserOptions() {
  return fs.existsSync(EXE) ? { executablePath: EXE } : {};
}

// Completes one synthetic run with the executed agreement; the pattern of 0-baseline/probes/connected/connected-inventory.cjs.
async function completeRun() {
  const log = newLog();
  const browser = await chromium.launch(browserOptions());
  try {
    const context = await newContext(browser, log);
    const page = await context.newPage();
    await page.goto(`${BASE}/start`);
    await page.getByRole("textbox", { name: "Issuer name", exact: true }).fill("Northbridge Synthetic Group");
    await page.getByRole("textbox", { name: "As-of date", exact: true }).fill("2025-03-31");
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
    await page.locator("input[type=file]").first().setInputFiles([
      path.join(REPO, "proof", "northbridge-filing.txt"),
      path.join(REPO, "proof", "northbridge-portfolio.xlsx"),
      path.join(REPO, "proof", "northbridge-credit-agreement.txt"),
    ]);
    await page.getByRole("list", { name: "Documents added" }).waitFor();
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
    await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
    await page.getByRole("button", { name: "Continue to context", exact: true }).click();
    await page.getByRole("heading", { name: "More context", exact: true }).waitFor();
    await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
    await page.getByRole("button", { name: "Review run", exact: true }).click();
    await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
    await page.waitForTimeout(800);
    const limits = page.getByRole("region", { name: "Limits to decide" });
    for (const box of await limits.getByRole("checkbox").all()) if (!(await box.isChecked())) await box.check();
    await page.getByRole("checkbox", { name: /^Approve:/ }).check();
    await page.getByRole("button", { name: "Submit run", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    if ((await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).count()) !== 1) throw new Error("the Submit dialog is not the synthetic one; refusing to confirm");
    await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
    await page.waitForURL(/\/run\//, { timeout: 20000 });
    const run = page.url().split("/run/")[1];
    const t0 = Date.now();
    let status = "";
    while (Date.now() - t0 < RUN_MS) {
      status = await page.getByRole("status").first().innerText().catch(() => "");
      if (/Finished|Failed|Stopped|Interrupted|Cancelled/.test(status)) break;
      await page.waitForTimeout(1500);
    }
    if (!/Finished/.test(status)) throw new Error(`the synthetic run ${run} did not finish (status "${status}")`);
    if (log.blocked.length) throw new Error(`the Start flow tried to reach another host: ${JSON.stringify(log.blocked)}`);
    return run;
  } finally {
    await browser.close();
  }
}

async function ensureService() {
  if (!starting) {
    starting = (async () => {
      await startService();
      try {
        service.run = await completeRun();
        say(`synthetic run ${service.run} finished`);
      } catch (error) {
        await stopService();
        throw error;
      }
    })();
  }
  return starting;
}

function runId() {
  if (!service || !service.run) throw new Error("call lib.launch() first: it starts the service and completes the run");
  return service.run;
}

// Starts the service and run (first call), then a browser; closing the last browser stops the service.
async function launch() {
  await ensureService();
  const browser = await chromium.launch(browserOptions());
  openBrowsers += 1;
  const close = browser.close.bind(browser);
  let closed = false;
  browser.close = async () => {
    try {
      await close();
    } finally {
      if (!closed) {
        closed = true;
        openBrowsers -= 1;
        if (openBrowsers <= 0) await stopService();
      }
    }
  };
  return browser;
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

function newLog() {
  return { blocked: [], console: [], pageErrors: [], failed: [], bad: [], requests: [] };
}

module.exports = { REPO, PORT, BASE, launch, newContext, watch, newLog, runId, stopService, chromium, path, fs };
