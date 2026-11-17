// Shared helper for the J5 probes (stage 3 journey J5, reader edge cases).
// Run a probe from the repository root: `timeout 600 node <probe>`.
//
// It starts `python -m proof.serve` (synthetic: canned handoffs, no provider call, no spend) on
// port 8765 in its own process group with a fresh empty root under /tmp/jr/j5, waits until the
// service answers, opens Chromium (headless shell build 1243) with every host but loopback
// blocked (ruling R8), and always closes the browser and kills the service's process group in a
// `finally` block.
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) {
  throw new Error("run from the repository root");
}
const { chromium } = require(path.join(REPO, "web", "node_modules", "playwright"));

const PORT = 8765;
const HEADLESS_SHELL =
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const UV = fs.existsSync("/root/.local/bin/uv") ? "/root/.local/bin/uv" : "uv";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startService(root) {
  // A leftover service of ours (same port) would refill the root; stop it first.
  spawnSync("pkill", ["-f", `proof.serve --root .* --port ${PORT}`], { timeout: 10000 });
  await sleep(1000);
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  const child = spawn(
    UV,
    ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", String(PORT)],
    {
      cwd: REPO,
      env: { ...process.env, PYTHONPATH: "src", PYTHONUNBUFFERED: "1" },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  for (let i = 0; i < 240; i += 1) {
    if (output.includes(`http://127.0.0.1:${PORT}/`)) {
      return { child, origin: `http://127.0.0.1:${PORT}`, root, output: () => output };
    }
    if (child.exitCode !== null) break;
    await sleep(500);
  }
  stopService({ child });
  throw new Error(`proof.serve did not start:\n${output}`);
}

function stopService(service) {
  try {
    process.kill(-service.child.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
  spawnSync("pkill", ["-f", `proof.serve --root .* --port ${PORT}`], { timeout: 10000 });
}

const newLog = () => ({ blocked: [], console: [], pageErrors: [], failed: [], http: [] });

async function openBrowser(log, viewport = { width: 1440, height: 900 }) {
  const browser = await chromium.launch({ executablePath: HEADLESS_SHELL });
  const context = await browser.newContext({ viewport });
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();
    let host = "";
    let protocol = "";
    try {
      const parsed = new URL(url);
      protocol = parsed.protocol;
      host = parsed.hostname;
    } catch {
      /* unparsable */
    }
    if (["file:", "data:", "blob:"].includes(protocol) || LOOPBACK.has(host)) {
      return route.continue();
    }
    log.blocked.push({ url, type: request.resourceType() });
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") {
      log.console.push({ type: m.type(), text: m.text(), page: page.url() });
    }
  });
  page.on("pageerror", (e) => log.pageErrors.push({ text: String(e), page: page.url() }));
  page.on("requestfailed", (r) => {
    log.failed.push({ url: r.url(), reason: r.failure()?.errorText ?? "", page: page.url() });
  });
  page.on("response", (r) => {
    if (r.status() >= 400) log.http.push({ url: r.url(), status: r.status(), page: page.url() });
  });
  return { browser, context, page };
}

const FILES = {
  filing: ["northbridge-filing.txt", "text/plain"],
  workbook: [
    "northbridge-portfolio.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  agreement: ["northbridge-credit-agreement.txt", "text/plain"],
};

// The analyst's steps to a submitted synthetic run (web/scripts/connected-proof.mjs sequence).
// opts: issuer, asOf, files (keys of FILES), agreement (choose it as executed), workbook (choose
// it), acceptLimits, onReview(page) called on the review sheet before limits are ticked.
// Returns the run folder id, for example 20261117-081500-01.
async function submitRun(page, origin, opts = {}) {
  const o = {
    issuer: "Northbridge Synthetic Group",
    asOf: "2025-03-31",
    files: ["filing", "workbook", "agreement"],
    agreement: true,
    workbook: true,
    acceptLimits: true,
    ...opts,
  };
  await page.goto(origin + "/");
  await page.getByRole("link", { name: "Start a run", exact: true }).first().click();
  await page.getByLabel("Issuer name", { exact: true }).fill(o.issuer);
  await page.getByLabel("As-of date", { exact: true }).fill(o.asOf);
  await page.getByLabel("Your name", { exact: true }).fill("Ana L");
  await page.getByLabel("Documents", { exact: true }).setInputFiles(
    o.files.map((k) => ({
      name: FILES[k][0],
      mimeType: FILES[k][1],
      buffer: fs.readFileSync(path.join(REPO, "proof", FILES[k][0])),
    })),
  );
  await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).waitFor();
  if (o.onDocuments) await o.onDocuments(page);
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await page.getByRole("radio", { name: "Full credit assessment", exact: true }).waitFor();
  if (o.onPurpose) await o.onPurpose(page);
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  if (o.workbook) {
    await page
      .getByRole("combobox", { name: "Portfolio workbook", exact: true })
      .selectOption({ label: "northbridge-portfolio.xlsx" });
  }
  if (o.agreement) {
    await page
      .getByRole("combobox", { name: "Legal documents", exact: true })
      .selectOption("executed");
    await page
      .getByRole("combobox", { name: "The agreement", exact: true })
      .selectOption({ label: "northbridge-credit-agreement.txt" });
  }
  if (o.onContext) await o.onContext(page);
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  const submit = page.getByRole("button", { name: "Submit run", exact: true });
  await submit.waitFor();
  if (o.onReview) await o.onReview(page);
  if (o.acceptLimits) {
    const limits = page.getByRole("region", { name: "Limits to decide" });
    for (const box of await limits.getByRole("checkbox").all()) await box.check();
  }
  await page
    .getByRole("checkbox", {
      name: "Approve: I have read this summary and want this run started",
      exact: true,
    })
    .check();
  await submit.click();
  const dialog = page.getByRole("dialog", { name: "Start a synthetic test?" });
  await dialog.waitFor();
  const done = page.waitForURL(/\/run\/\d{8}-\d{6}-\d{2}$/u);
  await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
  await done;
  return new URL(page.url()).pathname.split("/").at(-1);
}

// Waits (at most `ms`) until the run's page stops changing state; returns the run record.
async function waitEnded(origin, id, ms = 120000) {
  const end = Date.now() + ms;
  let last = null;
  for (let i = 0; i < 1000 && Date.now() < end; i += 1) {
    const res = await fetch(`${origin}/api/runs/${id}`).catch(() => null);
    if (res && res.ok) {
      last = await res.json();
      if (["finished", "failed", "capped", "rejected", "interrupted"].includes(last.status)) {
        return last;
      }
    }
    await sleep(1000);
  }
  throw new Error(`run ${id} did not end within ${ms} ms (last: ${JSON.stringify(last)})`);
}

async function waitPublished(origin, id, ms = 120000) {
  const end = Date.now() + ms;
  for (let i = 0; i < 1000 && Date.now() < end; i += 1) {
    const res = await fetch(`${origin}/connected/snapshot?run=${id}`).catch(() => null);
    if (res && res.status === 200) return;
    await sleep(1000);
  }
  throw new Error(`run ${id} was not published within ${ms} ms`);
}

// One segment: fresh empty root, service on 8765, browser with the R8 guard, then `body`.
// Prints a RESULT line; always closes the browser and kills the service.
async function segment(name, body, opts = {}) {
  const root = `/tmp/jr/j5/${name}`;
  const log = newLog();
  let service = null;
  let b = null;
  try {
    service = await startService(root);
    b = await openBrowser(log, opts.viewport);
    const verdict = await body({ page: b.page, context: b.context, origin: service.origin, log, service });
    if (verdict) console.log(`RESULT ${verdict.reproduced ? "REPRODUCED" : "NOT REPRODUCED"}: ${verdict.summary}`);
  } catch (error) {
    console.error("SEGMENT ERROR", error);
    process.exitCode = 2;
  } finally {
    if (b) await b.browser.close().catch(() => {});
    if (service) stopService(service);
    console.log(`R8 blocked requests: ${log.blocked.length}`, log.blocked.length ? JSON.stringify(log.blocked) : "");
    console.log(`console problems: ${log.console.length}; page errors: ${log.pageErrors.length}; failed: ${log.failed.length}; http>=400: ${log.http.length}`);
    if (log.console.length || log.pageErrors.length || log.failed.length || log.http.length) {
      console.log(JSON.stringify({ console: log.console.slice(0, 10), pageErrors: log.pageErrors.slice(0, 10), failed: log.failed.slice(0, 10), http: log.http.slice(0, 10) }));
    }
  }
}

module.exports = {
  REPO, PORT, FILES, sleep, startService, stopService, openBrowser, newLog,
  submitRun, waitEnded, waitPublished, segment,
};

// Layout check for the page as drawn: horizontal overflow of the page, elements that stick out of
// the window, and elements whose text is clipped (scrollWidth over clientWidth with overflow set).
async function layoutCheck(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = { vw, scrollWidth: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth, wide: [], clipped: [], small: [] };
    const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label").slice(0, 40)}]` : ""}.${String(el.className || "").toString().split(" ").slice(0, 3).join(".")}`;
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
      if (String(el.className || "").includes("sr-only") || el.closest(".sr-only")) continue;
      if (r.right > vw + 1 && out.wide.length < 25) out.wide.push({ el: desc(el), right: Math.round(r.right), text: (el.textContent || "").trim().slice(0, 50) });
      const clips = ["hidden", "clip"].includes(cs.overflowX);
      if (clips && el.scrollWidth > el.clientWidth + 1 && out.clipped.length < 25) out.clipped.push({ el: desc(el), sw: el.scrollWidth, cw: el.clientWidth, text: (el.textContent || "").trim().slice(0, 60) });
      if (["BUTTON", "A", "INPUT", "SELECT"].includes(el.tagName) && !(el.tagName === "A" && el.closest("p, li")) && (r.width < 24 || r.height < 24) && out.small.length < 25) out.small.push({ el: desc(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30) });
    }
    return out;
  });
}
module.exports.layoutCheck = layoutCheck;
