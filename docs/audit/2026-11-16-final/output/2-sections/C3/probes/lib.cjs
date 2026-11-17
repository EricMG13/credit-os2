// Shared helper for the C3 probes. Run any probe from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/C3/probes/<probe>.cjs
// With no environment it starts `python -m proof.serve` (synthetic, canned handoffs, no paid call) on
// port C3_PORT (default 8733) with a new short run root, completes one synthetic run through the UI,
// runs the check, and stops the service. To reuse a running service: C3_BASE=http://127.0.0.1:<port>
// C3_RUN=<run folder>. Every host but loopback is blocked in the browser.
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { createRequire } = require("node:module");

const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const { chromium } = createRequire(path.join(REPO, "web", "package.json"))("playwright");
const EXE = process.env.C3_CHROMIUM || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const PORT = Number(process.env.C3_PORT || 8733);

async function launch({ width = 1440, height = 900 } = {}) {
  const browser = await chromium.launch(fs.existsSync(EXE) ? { executablePath: EXE } : {});
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const blocked = [];
  await context.route("**/*", (route) => {
    const request = route.request();
    let host = "";
    try {
      const u = new URL(request.url());
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      host = u.hostname;
    } catch { /* unparsable */ }
    if (LOOPBACK.has(host)) return route.continue();
    blocked.push(request.url());
    return route.abort("blockedbyclient");
  });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(30000);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  return { browser, context, page, blocked };
}

async function startService() {
  const root = fs.mkdtempSync(path.join("/tmp", "c3p-"));
  const child = spawn("uv", ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", String(PORT)], {
    cwd: REPO, env: { ...process.env, PYTHONPATH: "src", PYTHONUNBUFFERED: "1" }, detached: true,
  });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  for (let i = 0; i < 120; i += 1) {
    if (output.includes(`http://127.0.0.1:${PORT}/`)) return { child, root };
    if (child.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`proof.serve did not start:\n${output}`);
}
function stopService(child) {
  try { process.kill(-child.pid, "SIGTERM"); } catch { /* already stopped */ }
}

async function completeRun(page, base) {
  await page.goto(`${base}/start`);
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
  for (const box of await page.getByRole("region", { name: "Limits to decide" }).getByRole("checkbox").all()) if (!(await box.isChecked())) await box.check();
  await page.getByRole("checkbox", { name: /^Approve:/ }).check();
  await page.getByRole("button", { name: "Submit run", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  if ((await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).count()) !== 1) throw new Error("not the synthetic dialog; refusing to confirm");
  await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
  await page.waitForURL(/\/run\//, { timeout: 20000 });
  const run = page.url().split("/run/")[1];
  for (let i = 0; i < 120; i += 1) {
    const status = await page.getByRole("status").first().innerText().catch(() => "");
    if (/Finished/.test(status)) return run;
    if (/Failed|Stopped|Interrupted|Cancelled/.test(status)) throw new Error(`run ended: ${status}`);
    await page.waitForTimeout(1000);
  }
  throw new Error("run did not finish in 120 s");
}

/** Runs `check(ctx)` against a service (own or given); `check` returns {defect: bool, detail: any}. */
async function main(name, check, opts = {}) {
  let service = null;
  let browser = null;
  let code = 0;
  try {
    let base = process.env.C3_BASE;
    let run = process.env.C3_RUN;
    const ctx = await launch(opts);
    browser = ctx.browser;
    if (!base) {
      service = await startService();
      base = `http://127.0.0.1:${PORT}`;
    }
    if (!run) run = await completeRun(ctx.page, base);
    const result = await check({ ...ctx, base, run, report: (hash) => `${base}/report/${run}#${hash}` });
    console.log(JSON.stringify({ probe: name, defectReproduced: Boolean(result.defect), blockedRequests: ctx.blocked, ...result }, null, 1));
    code = result.defect ? 1 : 0;
  } catch (error) {
    console.error(`${name}: probe error`, error);
    code = 2;
  } finally {
    if (browser) await browser.close();
    if (service) stopService(service.child);
  }
  process.exit(code);
}
/** Rewrites the snapshot the page fetches (a request intercepted in the browser; no application code is edited). */
async function inject(context, mutate) {
  await context.route("**/connected/snapshot*", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    mutate(body);
    await route.fulfill({ response, json: body });
  });
}
const outputOf = (snap, module) => Object.values(snap.workspace.outputs).find((o) => o.module === module);
const sectionsOf = (snap, module) => snap.workspace.handoffs[outputOf(snap, module).sha256];

module.exports = { main, launch, inject, outputOf, sectionsOf, REPO, path, fs };
