// Shared helpers for the C1 probes. Run every probe from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/C1/probes/<probe>.cjs
// A probe uses the service at C1_BASE when set (default http://127.0.0.1:8731, started with
//   PYTHONPATH=src uv run --locked python -m proof.serve --root /tmp/cs-C1/root --port 8731).
// Every host but loopback is aborted in the browser context and recorded in `blocked`.
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const { chromium } = createRequire(path.join(REPO, "web", "package.json"))("playwright");
const BASE = process.env.C1_BASE || "http://127.0.0.1:8731";
const SHOTS = process.env.C1_SHOTS || "/tmp/cs-C1/scratch";
fs.mkdirSync(SHOTS, { recursive: true });
const EXE = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

async function launch() {
  const opts = fs.existsSync(EXE) ? { executablePath: EXE } : {};
  return chromium.launch(opts);
}

function isLocal(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "data:" || u.protocol === "blob:") return true;
    return ["127.0.0.1", "localhost", "[::1]", "::1"].includes(u.hostname);
  } catch {
    return false;
  }
}

async function newContext(browser, { width = 1440, height = 900, extra = {} } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, ...extra });
  const log = { blocked: [], requests: [], console: [], pageErrors: [], failed: [], responses: [] };
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (!isLocal(url)) {
      log.blocked.push(url);
      return route.abort();
    }
    return route.continue();
  });
  context.on("request", (r) => log.requests.push(`${r.method()} ${r.url()}`));
  context.on("response", (r) => log.responses.push(`${r.status()} ${r.request().method()} ${r.url()}`));
  context.on("requestfailed", (r) => log.failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  context.on("page", (page) => watch(page, log));
  return { context, log };
}

function watch(page, log) {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") log.console.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => log.pageErrors.push(String(e)));
}

async function open(context, log, url) {
  const page = await context.newPage();
  watch(page, log);
  if (url) await page.goto(url.startsWith("http") ? url : BASE + url);
  return page;
}

async function settle(page, ms = 500) {
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

// ---- synthetic run driving (pattern of 0-baseline/probes/connected/connected-inventory.cjs)
async function startForm(page, { agreement = true, name = "Audit C", issuer = "Northbridge Synthetic Group" } = {}) {
  await page.goto(`${BASE}/start`);
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).fill(issuer);
  await page.getByRole("textbox", { name: "As-of date", exact: true }).fill("2025-03-31");
  if (name) await page.getByRole("textbox", { name: "Your name", exact: true }).fill(name);
  const files = [path.join(REPO, "proof", "northbridge-filing.txt"), path.join(REPO, "proof", "northbridge-portfolio.xlsx")];
  if (agreement) files.push(path.join(REPO, "proof", "northbridge-credit-agreement.txt"));
  await page.locator("input[type=file]").first().setInputFiles(files);
  await page.getByRole("list", { name: "Documents added" }).waitFor();
  await page.waitForTimeout(800);
}
async function toReview(page, { agreement = true } = {}) {
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page.getByRole("heading", { name: "More context", exact: true }).waitFor();
  await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
  if (agreement) {
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
  }
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
  await page.waitForTimeout(800);
}
async function decideAndApprove(page) {
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const box of await limits.getByRole("checkbox").all()) if (!(await box.isChecked())) await box.check();
  await page.getByRole("checkbox", { name: /^Approve:/ }).check();
}
// Submits the synthetic run and returns its id (the page navigates to /run/<id>).
async function submitSynthetic(page, opts = {}) {
  await startForm(page, opts);
  await toReview(page, opts);
  await decideAndApprove(page);
  await page.getByRole("button", { name: "Submit run", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  const text = await dialog.innerText();
  if (!/synthetic/i.test(text) || (await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).count()) !== 1)
    throw new Error("Submit dialog is not the synthetic one; refusing to confirm");
  await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
  await page.waitForURL(/\/run\//, { timeout: 20000 });
  return page.url().split("/run/")[1];
}
async function waitForEnd(page, cap = 150) {
  for (let i = 0; i < cap; i += 1) {
    const status = await page.getByRole("status").first().innerText().catch(() => "");
    if (/Finished|Failed|Stopped|Interrupted|Cancelled/.test(status)) return status;
    await page.waitForTimeout(1000);
  }
  return "timeout";
}

// ---- service lifecycle: use the service at BASE when it answers, else start proof.serve on 8731
// with a new empty root (under 80 characters) and stop it when the probe ends.
const { spawn } = require("node:child_process");
const os = require("node:os");
async function reachable() {
  try {
    const r = await fetch(BASE + "/connected/activity", { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}
async function withService(fn) {
  let child = null;
  if (!(await reachable())) {
    const root = fs.mkdtempSync(path.join("/tmp", "c1p-"));
    const port = new URL(BASE).port || "8731";
    child = spawn("uv", ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", port], {
      cwd: REPO,
      env: { ...process.env, PATH: `${os.homedir()}/.local/bin:${process.env.PATH}`, PYTHONPATH: "src" },
      stdio: "ignore",
      detached: true,
    });
    for (let i = 0; i < 90 && !(await reachable()); i += 1) await new Promise((r) => setTimeout(r, 1000));
    if (!(await reachable())) throw new Error("service did not start");
  }
  try {
    return await fn();
  } finally {
    if (child) {
      try { process.kill(-child.pid, "SIGTERM"); } catch { /* already gone */ }
    }
  }
}
// A completed synthetic run for the probes that need a report; reuses one when the library has it.
async function ensureRun(context, log) {
  const index = await (await fetch(BASE + "/connected/library")).json();
  const real = index?.catalogue?.real ?? [];
  if (real.length) return real[0].id;
  const page = await open(context, log);
  const id = await submitSynthetic(page);
  const end = await waitForEnd(page);
  await page.waitForTimeout(2500);
  await page.close();
  if (!/Finished/.test(end)) throw new Error("synthetic run ended " + end);
  return id;
}
// Probe verdict: every probe prints one VERDICT line and exits 1 when the defect reproduces.
function verdict(defect, detail) {
  console.log(`VERDICT ${defect ? "DEFECT REPRODUCED" : "not reproduced"}: ${detail}`);
  process.exitCode = defect ? 1 : 0;
}

module.exports = { withService, ensureRun, verdict, REPO, BASE, SHOTS, launch, newContext, open, settle, shot, watch, startForm, toReview, decideAndApprove, submitSynthetic, waitForEnd, isLocal };
