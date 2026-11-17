// Shared helper for the C5 probes. Run from the repository root.
// A probe uses C5_BASE (e.g. http://127.0.0.1:8735) when set and a run id in C5_RUN; otherwise it
// starts proof.serve on C5_PORT (default 8735) with a new short run root, completes one synthetic
// run (no paid call; proof.serve substitutes canned responses) and stops the service at the end.
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { createRequire } = require("node:module");

const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const { chromium } = createRequire(path.join(REPO, "web", "package.json"))("playwright");
const SHELL = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

async function startService(port) {
  const root = fs.mkdtempSync(path.join("/tmp", "c5p-"));
  const child = spawn("uv", ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", String(port)], {
    cwd: REPO, env: { ...process.env, PYTHONPATH: "src", PYTHONUNBUFFERED: "1" }, detached: true,
  });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  for (let i = 0; i < 120; i += 1) {
    if (output.includes(`http://127.0.0.1:${port}/`)) return { child, root };
    if (child.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`proof.serve did not start:\n${output}`);
}
function stopService(child) { try { process.kill(-child.pid, "SIGTERM"); } catch { /* stopped */ } }

async function launch() {
  return chromium.launch({ executablePath: SHELL });
}

function newLog() { return { blocked: [], console: [], pageErrors: [], failed: [], requests: [] }; }

async function guardedContext(browser, log, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, acceptDownloads: true });
  await context.route("**/*", (route) => {
    const request = route.request();
    let host = "";
    try {
      const u = new URL(request.url());
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      host = u.hostname;
    } catch { /* unparsable */ }
    if (LOOPBACK.has(host)) return route.continue();
    log.blocked.push({ url: request.url(), type: request.resourceType() });
    return route.abort("blockedbyclient");
  });
  context.on("page", (page) => watch(page, log));
  return context;
}
function watch(page, log) {
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") log.console.push({ page: page.url(), type: m.type(), text: m.text() }); });
  page.on("pageerror", (e) => log.pageErrors.push({ page: page.url(), text: String(e) }));
  page.on("requestfailed", (r) => log.failed.push({ url: r.url(), why: r.failure()?.errorText }));
  page.on("response", (r) => { if (r.status() >= 400) log.failed.push({ url: r.url(), status: r.status() }); });
  page.on("request", (r) => log.requests.push(r.method() + " " + r.url()));
}

async function startForm(page, base) {
  await page.goto(`${base}/start`);
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).fill("Northbridge Synthetic Group");
  await page.getByRole("textbox", { name: "As-of date", exact: true }).fill("2025-03-31");
  await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
  const files = [path.join(REPO, "proof", "northbridge-filing.txt"), path.join(REPO, "proof", "northbridge-portfolio.xlsx"), path.join(REPO, "proof", "northbridge-credit-agreement.txt")];
  await page.locator("input[type=file]").first().setInputFiles(files);
  await page.getByRole("list", { name: "Documents added" }).waitFor();
  await page.waitForTimeout(800);
}
async function toReview(page) {
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
}
async function decideAndApprove(page) {
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const box of await limits.getByRole("checkbox").all()) if (!(await box.isChecked())) await box.check();
  await page.getByRole("checkbox", { name: /^Approve:/ }).check();
}
async function waitForEnd(page) {
  for (let i = 0; i < 150; i += 1) {
    const status = await page.getByRole("status").first().innerText().catch(() => "");
    if (/Finished|Failed|Stopped|Interrupted|Cancelled/.test(status)) return status;
    await page.waitForTimeout(1000);
  }
  return "timeout";
}
async function completeRun(page, base) {
  await startForm(page, base);
  await toReview(page);
  await decideAndApprove(page);
  await page.getByRole("button", { name: "Submit run", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  const start = dialog.getByRole("button", { name: "Start synthetic run", exact: true });
  if ((await start.count()) !== 1) throw new Error("not the synthetic Submit dialog; refusing");
  await start.click();
  await page.waitForURL(/\/run\//, { timeout: 20000 });
  const run = page.url().split("/run/")[1];
  const status = await waitForEnd(page);
  return { run, status };
}

// Runs main(ctx) with a browser and either the given base/run or a fresh service and run.
async function withRun(main) {
  let service = null;
  let browser = null;
  const log = newLog();
  try {
    let base = process.env.C5_BASE;
    let run = process.env.C5_RUN;
    browser = await launch();
    const context = await guardedContext(browser, log);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
    watch(page, log);
    if (!base) {
      const port = Number(process.env.C5_PORT || 8735);
      service = await startService(port);
      base = `http://127.0.0.1:${port}`;
    }
    if (!run) {
      const done = await completeRun(page, base);
      if (!/Finished/.test(done.status)) throw new Error(`run did not finish: ${done.status}`);
      run = done.run;
    }
    return await main({ browser, context, page, base, run, log });
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (service) stopService(service.child);
  }
}

module.exports = { REPO, chromium, SHELL, launch, newLog, guardedContext, watch, completeRun, withRun, startService, stopService };
