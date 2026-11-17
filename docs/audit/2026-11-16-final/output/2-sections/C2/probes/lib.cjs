// Shared helpers for the C2 probes. Run every probe from the repository root:
//   C2_PORT=8732 node docs/audit/2026-11-16-final/output/2-sections/C2/probes/<name>.cjs
// The service must already be running on that port (see README in each probe header):
//   PYTHONPATH=src uv run --locked python -m proof.serve --root /tmp/cs-C2/root --port 8732
// Every host but loopback is aborted in the browser and recorded in the log.
"use strict";
const path = require("node:path");
const fs = require("node:fs");
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

async function launch() {
  return chromium.launch({ executablePath: EXE });
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

module.exports = {
  reachReview,
  REPO, PORT, BASE, SCRATCH, FILES, launch, context, newLog, watch, shot, isLoopback,
  fillIdentity, addFiles, toPurpose, toContext, toReview, decideAndApprove, waitForEnd,
};
