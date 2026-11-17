// Shared helper for the J4 probes. Starts proof.serve (synthetic, canned responses, no paid call)
// on port 8764 in its own process group, drives Chromium with every host but loopback blocked,
// and completes the synthetic Northbridge run the way web/scripts/connected-proof.mjs does.
// Run a probe from the repository root:  timeout 600 node <probe path>
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "../../../../../../..");
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(path.join(repo, "web/node_modules/playwright"));

export const PORT = 8764;
export const repoRoot = repo;
const CHROME =
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

export function freshRoot(label) {
  mkdirSync("/tmp/jr/j4", { recursive: true });
  return mkdtempSync(`/tmp/jr/j4/${label}-`) + "/svc"; // proof.serve wants an absent or empty root
}

function killOwn() {
  // Only processes started with this port (never another worker's).
  spawnSync("pkill", ["-9", "-f", `--port ${PORT}`]);
}

export async function startService(root) {
  killOwn();
  const child = spawn(
    "/root/.local/bin/uv",
    ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", String(PORT)],
    {
      cwd: repo,
      env: { ...process.env, PYTHONPATH: path.join(repo, "src") },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  let out = "";
  child.stdout.on("data", (d) => (out = (out + d).slice(-8000)));
  child.stderr.on("data", (d) => (out = (out + d).slice(-8000)));
  const endpoint = `http://127.0.0.1:${PORT}/`;
  const deadline = Date.now() + 90000;
  for (let i = 0; i < 1000 && Date.now() < deadline; i += 1) {
    try {
      const r = await fetch(endpoint, { signal: AbortSignal.timeout(2000) });
      if (r.status > 0) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
    if (child.exitCode !== null) throw new Error(`service exited early: ${out}`);
  }
  const stop = async () => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      /* already gone */
    }
    killOwn();
  };
  return { endpoint, stop, output: () => out, root };
}

// A page whose every request to a host other than loopback is aborted and logged (rule R8).
export async function openBrowser(options = {}) {
  const browser = await chromium.launch({ executablePath: CHROME });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: options.viewport ?? { width: 1280, height: 900 },
  });
  const log = { blocked: [], failed: [], console: [], pageErrors: [], requests: [], badStatus: [] };
  await context.route("**/*", (route) => {
    const request = route.request();
    let url;
    try {
      url = new URL(request.url());
    } catch {
      return route.abort();
    }
    const local =
      ["file:", "data:", "blob:"].includes(url.protocol) ||
      (["http:", "https:"].includes(url.protocol) &&
        ["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname));
    if (!local) {
      log.blocked.push(`${request.method()} ${request.url()}`);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("request", (r) => log.requests.push(`${r.method()} ${r.url()}`));
  page.on("requestfailed", (r) =>
    log.failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText ?? ""}`),
  );
  page.on("response", (r) => {
    if (r.status() >= 400) log.badStatus.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) log.console.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => log.pageErrors.push(e.message));
  return { browser, context, page, log, close: () => browser.close() };
}

const files = [
  ["northbridge-filing.txt", "text/plain"],
  [
    "northbridge-portfolio.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ["northbridge-credit-agreement.txt", "text/plain"],
];

// Completes the synthetic run through the screen and returns its folder id.
export async function completeRun(page, endpoint) {
  await page.goto(endpoint);
  await page.getByRole("link", { name: "Start a run", exact: true }).click();
  await page.locator("[data-dropzone]").waitFor();
  await page.getByLabel("Issuer name", { exact: true }).fill("Northbridge Synthetic Group");
  await page.getByLabel("As-of date", { exact: true }).fill("2025-03-31");
  await page.getByLabel("Your name", { exact: true }).fill("Ana L");
  await page.getByLabel("Documents", { exact: true }).setInputFiles(
    files.map(([name, mimeType]) => ({
      name,
      mimeType,
      buffer: readFileSync(path.join(repo, "proof", name)),
    })),
  );
  await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page
    .getByLabel(/Anything the analysis should know/u)
    .fill("Check the 2028 maturities.\nInclude refinancing risk.");
  await page
    .getByRole("combobox", { name: "Portfolio workbook", exact: true })
    .selectOption({ label: "northbridge-portfolio.xlsx" });
  await page
    .getByRole("combobox", { name: "Legal documents", exact: true })
    .selectOption("executed");
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
  await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
  await page.waitForURL(/\/run\/\d{8}-\d{6}-\d{2}$/u, { timeout: 60000 });
  const run = new URL(page.url()).pathname.split("/").at(-1);
  await page.getByRole("link", { name: "Open report", exact: true }).waitFor({ timeout: 240000 });
  return run;
}

export function save(file, text) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

export async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

// Runs one probe: fresh root, service on 8764, finished synthetic run, then `body`.
// `body({ page, run, endpoint, log })` returns { reproduced: boolean, notes: string[] }.
// Exit code 0 when the defect is reproduced, 1 when it is not (for example after a repair),
// 2 when the probe itself failed. The service and the browser are always closed.
export async function runProbe(label, body) {
  let svc;
  let br;
  let code = 2;
  try {
    svc = await startService(freshRoot(label));
    br = await openBrowser();
    const run = await completeRun(br.page, svc.endpoint);
    const result = await body({ page: br.page, run, endpoint: svc.endpoint, log: br.log });
    for (const note of result.notes) console.log(`  ${note}`);
    console.log(result.reproduced ? `REPRODUCED ${label}` : `NOT REPRODUCED ${label}`);
    code = result.reproduced ? 0 : 1;
  } catch (error) {
    console.error(`PROBE ERROR ${label}: ${error.message}`);
  } finally {
    if (br) {
      const { blocked, failed, pageErrors, badStatus } = br.log;
      console.log(
        `  browser: blocked=${blocked.length} failed=${failed.length} pageErrors=${pageErrors.length} status>=400=${badStatus.length}`,
      );
      await br.close();
    }
    if (svc) await svc.stop();
  }
  process.exit(code);
}

// Opens a module page and turns every chart to its table view, then returns the page text.
export async function moduleText(page, endpoint, run, module, tables = true) {
  await page.goto(`${endpoint}report/${run}#modules/${module}`);
  await page.waitForTimeout(900);
  if (tables) {
    const radios = page.getByRole("radio", { name: "Table", exact: true });
    for (let i = 0; i < Math.min(await radios.count(), 30); i += 1)
      await radios.nth(i).click().catch(() => {});
    await page.waitForTimeout(400);
  }
  return bodyText(page);
}
