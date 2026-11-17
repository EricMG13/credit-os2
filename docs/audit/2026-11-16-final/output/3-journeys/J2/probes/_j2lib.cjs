// Shared helper for the J2 probes (stage 3 journey J2, analyst, things go wrong).
// Run a probe from the repository root: `timeout 600 node <probe>`.
//
// It starts `python -m proof.serve` (synthetic: canned handoffs, no provider call, no spend)
// on port 8762 in its own process group with an empty run root under /tmp/jr/, opens Chromium
// (headless shell build 1243) with every host but loopback blocked (ruling R8), and always
// stops the browser and the service in a `finally` block.
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) throw new Error("run from the repository root");
const { chromium } = require(path.join(REPO, "web", "node_modules", "playwright"));

const PORT = 8762;
const SHELL = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const UV = fs.existsSync("/root/.local/bin/uv") ? "/root/.local/bin/uv" : "uv";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CASE_FILES = [
  ["northbridge-filing.txt", "text/plain"],
  ["northbridge-portfolio.xlsx", XLSX],
  ["northbridge-credit-agreement.txt", "text/plain"],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startService(root) {
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  const child = spawn(
    UV,
    ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", String(PORT)],
    { cwd: REPO, env: { ...process.env, PYTHONPATH: "src", PYTHONUNBUFFERED: "1" }, detached: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  for (let i = 0; i < 240; i += 1) {
    if (out.includes(`http://127.0.0.1:${PORT}/`)) {
      for (let j = 0; j < 40; j += 1) {
        try {
          const r = await fetch(`http://127.0.0.1:${PORT}/`);
          if (r.status < 500) return { child, origin: `http://127.0.0.1:${PORT}` };
        } catch {
          /* not yet */
        }
        await sleep(250);
      }
    }
    if (child.exitCode !== null) break;
    await sleep(500);
  }
  stopService({ child });
  throw new Error(`proof.serve did not start:\n${out}`);
}

function stopService(service) {
  try {
    process.kill(-service.child.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
  spawnSync("pkill", ["-f", `proof.serve --root .* --port ${PORT}`], { timeout: 10000 });
  try {
    process.kill(-service.child.pid, "SIGKILL");
  } catch {
    /* already gone */
  }
}

async function openBrowser(log, viewport = { width: 1440, height: 900 }) {
  const browser = await chromium.launch({ executablePath: SHELL });
  const context = await browser.newContext({ viewport });
  await context.route("**/*", (route) => {
    const url = route.request().url();
    let host = "";
    let proto = "";
    try {
      const parsed = new URL(url);
      proto = parsed.protocol;
      host = parsed.hostname;
    } catch {
      /* unparsable */
    }
    if (["file:", "data:", "blob:"].includes(proto) || LOOPBACK.has(host)) return route.continue();
    log.blocked.push(url);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  setup(page, log);
  return { browser, context, page };
}

function setup(page, log) {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("pageerror", (e) => log.pageErrors.push(String(e)));
}

// Runs `fn` against a fresh service (empty root /tmp/jr/<rootName>) and a guarded browser.
async function run(rootName, fn) {
  const log = { blocked: [], pageErrors: [] };
  let service;
  let opened;
  try {
    service = await startService(path.join("/tmp/jr", rootName));
    opened = await openBrowser(log);
    await fn({ ...opened, origin: service.origin, log });
  } finally {
    try {
      await opened?.browser.close();
    } catch {
      /* closed */
    }
    if (service) stopService(service);
    console.log(`blocked requests: ${log.blocked.length}; page errors: ${log.pageErrors.length}`);
  }
}

async function text(page, selector = "body") {
  try {
    return (await page.locator(selector).first().innerText({ timeout: 5000 })).replace(/\n{3,}/g, "\n\n");
  } catch {
    return "";
  }
}

// ---- the analyst's steps (web/scripts/connected-proof.mjs sequence) ----
function caseFile(name) {
  const entry = CASE_FILES.find(([n]) => n === name);
  return { name, mimeType: entry ? entry[1] : "text/plain", buffer: fs.readFileSync(path.join(REPO, "proof", name)) };
}

async function fillIssuer(page, { issuer = "Northbridge Synthetic Group", asof = "2025-03-31", name = "Ana L" } = {}) {
  await page.getByLabel("Issuer name", { exact: true }).fill(issuer);
  await page.getByLabel("As-of date", { exact: true }).fill(asof);
  await page.getByLabel("Your name", { exact: true }).fill(name);
}

async function documentsStep(page, options = {}, extraFiles = []) {
  await fillIssuer(page, options);
  const files = CASE_FILES.map(([n]) => caseFile(n)).concat(extraFiles);
  await page.getByLabel("Documents", { exact: true }).setInputFiles(files);
  await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
  await page.getByText(/documents inspected/).first().waitFor();
}

async function toPurpose(page) {
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
}

async function toContext(page, pathway = "Full credit assessment") {
  await page.getByText(pathway, { exact: true }).first().click();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page.getByLabel(/Anything the analysis should know/u).waitFor();
}

async function contextFill(page) {
  await page.getByLabel(/Anything the analysis should know/u).fill("Check the 2028 maturities.\nInclude refinancing risk.");
  // Lite credit assessment has no Portfolio workbook field; fill each field only where the step offers it.
  const choose = async (name, option) => {
    const box = page.getByRole("combobox", { name, exact: true });
    if ((await box.count()) > 0) await box.selectOption(option);
  };
  await choose("Portfolio workbook", { label: "northbridge-portfolio.xlsx" });
  await choose("Legal documents", "executed");
  await choose("The agreement", { label: "northbridge-credit-agreement.txt" });
  const ratings = page.getByRole("region", { name: "Ratings", exact: true });
  await ratings.getByRole("button", { name: "Add rating", exact: true }).click();
  await ratings.getByLabel("Agency", { exact: true }).selectOption("Moody's");
  await ratings.getByLabel("Scope", { exact: true }).selectOption("issuer");
  await ratings.getByLabel("Rating", { exact: true }).fill("B1");
  await ratings.getByLabel("Outlook", { exact: true }).selectOption("Negative");
  await ratings.getByLabel("As-of", { exact: true }).fill("2025-02-28");
}

const consentBox = (page) => page.getByRole("checkbox", { name: "Approve: I have read this summary and want this run started", exact: true });

// From /start to an approved review sheet. Returns the Submit button.
async function toApproved(page, origin, options = {}, extraFiles = []) {
  await page.goto(origin + "/start");
  await page.getByLabel("Issuer name", { exact: true }).waitFor();
  await documentsStep(page, options, extraFiles);
  await toPurpose(page);
  await toContext(page, options.pathway);
  await contextFill(page);
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  const submit = page.getByRole("button", { name: "Submit run", exact: true });
  await submit.waitFor();
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const checkbox of await limits.getByRole("checkbox").all()) await checkbox.check();
  await consentBox(page).check();
  return submit;
}

// Approved sheet, Submit, and the synthetic confirmation dialog left open. Returns the dialog.
async function toDialog(page, origin, options = {}, extraFiles = []) {
  const submit = await toApproved(page, origin, options, extraFiles);
  await submit.click();
  const dialog = page.getByRole("dialog", { name: "Start a synthetic test?" });
  await dialog.waitFor();
  return dialog;
}

const confirm = (dialog) => dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();

// Waits until the run page header shows a terminal status; returns it. A Finished run also shows
// the "Open report" link (the module list below the header carries its own "Finished" words).
async function waitEnded(page, ms = 60000) {
  const end = Date.now() + Math.min(ms, 300000);
  for (let i = 0; i < 1000 && Date.now() < end; i += 1) {
    const head = (await text(page, "main")).slice(0, 170);
    const m = head.match(/\b(Finished|Failed|Capped|Rejected|Interrupted)\b/u);
    if (m && (m[1] !== "Finished" || (await page.getByRole("link", { name: "Open report" }).count()) > 0)) return m[1];
    await sleep(300);
  }
  return "timeout";
}

module.exports = { REPO, PORT, XLSX, CASE_FILES, sleep, run, text, caseFile, fillIssuer, documentsStep, toPurpose, toContext, contextFill, consentBox, toApproved, toDialog, confirm, waitEnded, setup };
