// Shared helpers for the C2 probes. Run every probe from the repository root, with no other setup:
//   node docs/audit/2026-11-16-final/output/2-sections/C2/probes/<name>.cjs
// Each probe starts its own `python -m proof.serve` (synthetic, canned responses, USD 0.00) from `.venv/bin/python` with
// PYTHONPATH=src, on a fresh empty run root under /tmp/cs-C2/ and on port C2_PORT (default 8732), waits until it answers, and
// stops it when the browser is closed (the probes close the browser in a finally block), on SIGINT/SIGTERM and on process exit.
// If anything already listens on that port the probe refuses to run; it never reuses another service.
// Every host but loopback is aborted in the browser and recorded in the log.
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { createRequire } = require("node:module");

const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const { chromium } = createRequire(path.join(REPO, "web", "package.json"))("playwright");
const PORT = Number(process.env.C2_PORT || 8732);
const BASE = `http://127.0.0.1:${PORT}`;
const SCRATCH = process.env.C2_SCRATCH || "/tmp/cs-C2/scratch";
fs.mkdirSync(SCRATCH, { recursive: true });
// Fixture files used by several probes (unusual names and types); created when missing, never read from the repository.
const FIX = "/tmp/cs-C2/files";
(function fixtures() {
  fs.mkdirSync(path.join(FIX, "sub", "inner"), { recursive: true });
  const put = (name, data) => { const f = path.join(FIX, name); if (!fs.existsSync(f)) fs.writeFileSync(f, data); };
  put("long-" + "a".repeat(200) + ".txt", "Long name file\nRevenue 100\n");
  put(".hidden.txt", "hidden");
  put("empty.txt", "");
  put("image.png", Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100, 0x30)]));
  put("notes.docx", Buffer.concat([Buffer.from("PK\x03\x04", "latin1"), Buffer.alloc(100, 0x30)]));
  put("big52.txt", Buffer.alloc(52 * 1024 * 1024, 0x78));
  put("dup.txt", "dup top");
  put(path.join("sub", "inner", "dup.txt"), "dup");
  put("Åccent-Résumé.txt", "accent file");
})();
const FILES = {
  filing: path.join(REPO, "proof", "northbridge-filing.txt"),
  workbook: path.join(REPO, "proof", "northbridge-portfolio.xlsx"),
  agreement: path.join(REPO, "proof", "northbridge-credit-agreement.txt"),
};
const EXE = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let svc = null;

const portFree = (port) => new Promise((resolve) => {
  const probe = net.createServer();
  probe.once("error", () => resolve(false));
  probe.once("listening", () => probe.close(() => resolve(true)));
  probe.listen(port, "127.0.0.1");
});

function killGroup(signal) {
  if (!svc) return;
  try { process.kill(-svc.child.pid, signal); } catch { /* already gone */ }
}

/** Starts proof.serve on a fresh root; refuses a busy port; idempotent within one process. */
async function startService() {
  if (svc) return svc;
  if (!(await portFree(PORT))) {
    throw new Error(`port ${PORT} is already in use: this probe starts its own proof.serve and will not reuse another service (set C2_PORT to a free port)`);
  }
  const python = path.join(REPO, ".venv", "bin", "python");
  if (!fs.existsSync(python)) throw new Error(`${python} not found (uv sync has not been run)`);
  fs.mkdirSync("/tmp/cs-C2", { recursive: true });
  const root = fs.mkdtempSync("/tmp/cs-C2/r-"); // empty and short: the scheduler refuses a root over 80 characters
  if (root.length >= 80) throw new Error(`run root too long: ${root}`);
  // `timeout` is a backstop: the service ends by itself after 20 minutes even if this process is killed outright.
  const child = spawn("timeout", ["1200", python, "-m", "proof.serve", "--root", root, "--port", String(PORT)], {
    cwd: REPO, env: { ...process.env, PYTHONPATH: "src" }, detached: true, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let exited = false;
  child.stdout.on("data", (d) => { output += d; });
  child.stderr.on("data", (d) => { output += d; });
  child.on("exit", () => { exited = true; });
  svc = { child, root, output: () => output, exited: () => exited };
  try {
    for (let i = 0; i < 120; i += 1) {
      if (exited) throw new Error(`proof.serve exited before it answered:\n${output.slice(-600)}`);
      try { const r = await fetch(`${BASE}/start`); if (r.ok) { process.stderr.write(`[probe] proof.serve up on ${BASE} (root ${root})\n`); return svc; } } catch { /* not up yet */ }
      await sleep(500);
    }
    throw new Error(`proof.serve did not answer on ${BASE} within 60 s:\n${output.slice(-600)}`);
  } catch (error) {
    await stopService();
    throw error;
  }
}

/** Stops the service this process started and removes its run root. Safe to call twice. */
async function stopService() {
  if (!svc) return;
  const current = svc;
  killGroup("SIGTERM");
  for (let i = 0; i < 60 && !current.exited(); i += 1) await sleep(100);
  if (!current.exited()) killGroup("SIGKILL");
  svc = null;
  fs.rmSync(current.root, { recursive: true, force: true });
  process.stderr.write(`[probe] proof.serve on ${BASE} stopped\n`);
}

process.on("exit", () => {
  if (svc) { killGroup("SIGKILL"); fs.rmSync(svc.root, { recursive: true, force: true }); }
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => { stopService().finally(() => process.exit(130)); });
}

/** The run root of the service this process started (valid between launch() and browser.close()). */
const root = () => (svc ? svc.root : null);

/** Starts the service, then the browser; browser.close() also stops the service. */
async function launch() {
  await startService();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: EXE });
  } catch (error) {
    await stopService();
    throw error;
  }
  const close = browser.close.bind(browser);
  browser.close = async (...args) => {
    try { await close(...args); } finally { await stopService(); }
  };
  return browser;
}

const isLoopback = (url) => /^(https?|wss?):\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?(\/|$)/.test(url) || /^(data|blob|about):/.test(url);

/** A context that aborts every non-loopback request; log.blocked collects them. */
async function context(browser, { width = 1440, height = 900, log }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await ctx.route("**/*", (route) => {
    const url = route.request().url();
    if (isLoopback(url)) return route.continue();
    log.blocked.push(url);
    return route.abort();
  });
  ctx.setDefaultTimeout(15000);
  ctx.setDefaultNavigationTimeout(30000);
  return ctx;
}

function newLog() {
  return { blocked: [], console: [], pageerrors: [], failed: [], bad: [], requests: [], notes: [] };
}

function watch(page, log) {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") log.console.push(`${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => log.pageerrors.push(String(e).slice(0, 300)));
  page.on("requestfailed", (r) => log.failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 400) log.bad.push(`${r.status()} ${r.request().method()} ${r.url().replace(BASE, "")}`);
  });
  page.on("request", (r) => {
    const u = r.url().replace(BASE, "");
    if (r.method() !== "GET" || u.startsWith("/api") || u.startsWith("/connected/")) log.requests.push(`${r.method()} ${u.slice(0, 160)}`);
  });
}

const shot = async (page, name) => {
  const file = path.join(SCRATCH, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
};

async function fillIdentity(page, { issuer = "Northbridge Synthetic Group", asOf = "2025-03-31", name = "Audit Z" } = {}) {
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).fill(issuer);
  await page.getByRole("textbox", { name: "As-of date", exact: true }).fill(asOf);
  if (name !== null) await page.getByRole("textbox", { name: "Your name", exact: true }).fill(name);
}

async function addFiles(page, which = ["filing", "workbook"]) {
  await page.locator("input[type=file]").first().setInputFiles(which.map((k) => FILES[k]));
  await page.getByRole("list", { name: "Documents added" }).waitFor();
}

async function toPurpose(page) {
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
}
async function toContext(page) {
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page.getByRole("heading", { name: "More context", exact: true }).waitFor();
}
async function toReview(page) {
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
  await page.waitForTimeout(500);
}
async function decideAndApprove(page) {
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const box of (await limits.getByRole("checkbox").all()).slice(0, 100)) if (!(await box.isChecked())) await box.check();
  await page.getByRole("checkbox", { name: /^Approve:/ }).check();
}
async function waitForEnd(page, seconds = 150) {
  for (let i = 0; i < seconds; i += 1) {
    const status = await page.getByRole("status").first().innerText().catch(() => "");
    if (/Finished|Failed|Stopped|Interrupted|Cancelled/.test(status)) return status;
    await page.waitForTimeout(1000);
  }
  return "timeout";
}

/** Documents -> Review with the three Northbridge files; returns when the review sheet is drawn. */
async function reachReview(page, { agreement = true, name = "Audit Z" } = {}) {
  await page.goto(`${BASE}/start`);
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
  await fillIdentity(page, { name });
  await addFiles(page, agreement ? ["filing", "workbook", "agreement"] : ["filing", "workbook"]);
  await toPurpose(page);
  await toContext(page);
  await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
  if (agreement) {
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
  }
  await toReview(page);
}

let finished = null;
/**
 * A finished synthetic run of "Northbridge Synthetic Group", made through the page: the three Northbridge files are uploaded,
 * northbridge-credit-agreement.txt is chosen as the executed agreement, the summary is approved and the synthetic Submit is
 * confirmed (refused unless the dialog says it is a synthetic test that spends USD 0.00). Returns the run id; cached.
 */
async function finishedRun(ctx) {
  if (finished) return finished;
  const page = await ctx.newPage();
  try {
    await reachReview(page, { agreement: true });
    await decideAndApprove(page);
    await page.getByRole("button", { name: /^Submit/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    const text = await dialog.innerText();
    if (!/synthetic test/i.test(text) || !/USD 0\.00/.test(text)) throw new Error(`refusing to confirm: the dialog is not the synthetic one: ${text.slice(0, 200)}`);
    await dialog.getByRole("button", { name: "Start synthetic run" }).click();
    await page.waitForURL(/\/run\//, { timeout: 30000 });
    const id = decodeURIComponent(new URL(page.url()).pathname.split("/").pop());
    const end = await waitForEnd(page);
    if (!/Finished/.test(end)) throw new Error(`the synthetic run did not finish: ${end}`);
    finished = id;
    return id;
  } finally {
    await page.close();
  }
}

module.exports = {
  root, startService, stopService, finishedRun,
  reachReview,
  REPO, PORT, BASE, SCRATCH, FILES, launch, context, newLog, watch, shot, isLoopback,
  fillIdentity, addFiles, toPurpose, toContext, toReview, decideAndApprove, waitForEnd,
};
