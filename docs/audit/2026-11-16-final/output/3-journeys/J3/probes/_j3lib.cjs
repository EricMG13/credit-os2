// Shared helper for the J3 probes (stage 3 journey J3, portfolio manager reading).
// Run a probe from the repository root: `timeout 600 node <probe>`.
//
// It starts `python -m proof.serve` (synthetic: canned handoffs, no provider call, no spend)
// on port 8763 in its own process group, waits until the service answers, opens Chromium
// (headless shell build 1243) with every host but loopback blocked (ruling R8), and always
// stops the service and the browser in a `finally` block.
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) {
  throw new Error("run from the repository root");
}
const { chromium } = require(path.join(REPO, "web", "node_modules", "playwright"));

const PORT = 8763;
const HEADLESS_SHELL =
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const UV = fs.existsSync("/root/.local/bin/uv") ? "/root/.local/bin/uv" : "uv";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Starts the synthetic service on PORT with the run root `root` (at most 80 characters).
async function startService(root) {
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
      return { child, origin: `http://127.0.0.1:${PORT}`, output: () => output };
    }
    if (child.exitCode !== null) break;
    await sleep(500);
  }
  stopService({ child });
  throw new Error(`proof.serve did not start:\n${output}`);
}

// Kills the service's process group, then anything of ours still matching `--port 8763`.
function stopService(service) {
  try {
    process.kill(-service.child.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
  spawnSync("pkill", ["-f", `proof.serve --root .* --port ${PORT}`], { timeout: 10000 });
}

// Opens the browser with the R8 route guard; `log` collects blocked requests and page problems.
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

const newLog = () => ({ blocked: [], console: [], pageErrors: [], failed: [], http: [] });

// The analyst's steps to a finished synthetic run (web/scripts/connected-proof.mjs sequence).
// Returns the run folder id, for example 20261117-081500-01.
async function completeSyntheticRun(page, origin, hooks = {}) {
  await page.goto(origin + "/");
  await page.getByRole("link", { name: "Start a run", exact: true }).first().click();
  await page.getByLabel("Issuer name", { exact: true }).fill("Northbridge Synthetic Group");
  await page.getByLabel("As-of date", { exact: true }).fill("2025-03-31");
  await page.getByLabel("Your name", { exact: true }).fill("Ana L");
  const names = [
    ["northbridge-filing.txt", "text/plain"],
    [
      "northbridge-portfolio.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    ["northbridge-credit-agreement.txt", "text/plain"],
  ];
  await page.getByLabel("Documents", { exact: true }).setInputFiles(
    names.map(([name, mimeType]) => ({
      name,
      mimeType,
      buffer: fs.readFileSync(path.join(REPO, "proof", name)),
    })),
  );
  await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await page.getByRole("radio", { name: "Full credit assessment", exact: true }).waitFor();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page
    .getByLabel(/Anything the analysis should know/u)
    .fill("Check the 2028 maturities.\nInclude refinancing risk.");
  await page
    .getByRole("combobox", { name: "Portfolio workbook", exact: true })
    .selectOption({ label: "northbridge-portfolio.xlsx" });
  await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
  await page
    .getByRole("combobox", { name: "The agreement", exact: true })
    .selectOption({ label: "northbridge-credit-agreement.txt" });
  const ratings = page.getByRole("region", { name: "Ratings", exact: true });
  await ratings.getByRole("button", { name: "Add rating", exact: true }).click();
  await ratings.getByLabel("Agency", { exact: true }).selectOption("Moody's");
  await ratings.getByLabel("Scope", { exact: true }).selectOption("issuer");
  await ratings.getByLabel("Rating", { exact: true }).fill("B1");
  await ratings.getByLabel("Outlook", { exact: true }).selectOption("Negative");
  await ratings.getByLabel("As-of", { exact: true }).fill("2025-02-28");
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  const submit = page.getByRole("button", { name: "Submit run", exact: true });
  await submit.waitFor();
  if (hooks.onReview) await hooks.onReview(page);
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const box of await limits.getByRole("checkbox").all()) await box.check();
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

// Waits (at most `ms`) for the run's own record to say it finished; returns the state text.
async function waitFinished(origin, ms = 240000) {
  const end = Date.now() + ms;
  let last = "";
  for (let i = 0; i < 1000 && Date.now() < end; i += 1) {
    const res = await fetch(origin + "/connected/snapshot").catch(() => null);
    if (res && res.ok) {
      const snap = await res.json();
      const runs = Object.values(snap.workspace?.runs ?? {});
      last = JSON.stringify(runs.map((r) => r.folder));
      if (runs.length > 0) return runs;
    }
    await sleep(3000);
  }
  throw new Error(`no finished run within ${ms} ms (last: ${last})`);
}

// Waits (at most `ms`) until the run `id` is published to the library (snapshot answers 200).
async function waitPublished(origin, id, ms = 120000) {
  const end = Date.now() + ms;
  for (let i = 0; i < 1000 && Date.now() < end; i += 1) {
    const res = await fetch(`${origin}/connected/snapshot?run=${id}`).catch(() => null);
    if (res && res.status === 200) return;
    await sleep(1000);
  }
  throw new Error(`run ${id} was not published within ${ms} ms`);
}

// Runs one probe: fresh empty root under /tmp/jr, service on 8763, browser with the R8 guard,
// one finished synthetic run (unless `opts.finishedRun` is false), then `body`.
// `body({page, origin, id, log})` returns {reproduced: boolean, summary: string}.
// Prints `RESULT REPRODUCED|NOT REPRODUCED: <summary>`; exit code 2 only if the harness failed.
async function runProbe(name, body, opts = {}) {
  const root = `/tmp/jr/j3-${name}`;
  fs.rmSync(root, { recursive: true, force: true });
  const log = newLog();
  let service = null;
  let b = null;
  try {
    service = await startService(root);
    b = await openBrowser(log, opts.viewport);
    let id = null;
    if (opts.finishedRun !== false) {
      id = await completeSyntheticRun(b.page, service.origin);
      await waitPublished(service.origin, id);
    }
    const verdict = await body({ page: b.page, origin: service.origin, id, log });
    console.log(`RESULT ${verdict.reproduced ? "REPRODUCED" : "NOT REPRODUCED"}: ${verdict.summary}`);
  } catch (error) {
    console.error("PROBE ERROR", error);
    process.exitCode = 2;
  } finally {
    if (b) await b.browser.close().catch(() => {});
    if (service) stopService(service);
    fs.rmSync(root, { recursive: true, force: true });
    console.log(`R8 blocked requests: ${log.blocked.length}`, log.blocked.length ? JSON.stringify(log.blocked) : "");
  }
}

module.exports = {
  REPO,
  waitPublished,
  runProbe,
  PORT,
  sleep,
  startService,
  stopService,
  openBrowser,
  newLog,
  completeSyntheticRun,
  waitFinished,
};
