// Stage 0 probe: the connected app (Credit OS 2) against a running synthetic service.
// Run from the repository root, with `python -m proof.serve` already listening on ORIGIN:
//   node docs/audit/2026-11-16-final/output/0-baseline/probes/connected.mjs <origin> <out-dir> <shots-dir>
// Phases: (A) every screen before any run; (B) one synthetic run through Start a run, inventorying
// each step, the paid dialog (live mode simulated in the browser, submit aborted, cancelled) and the
// synthetic dialog; (C) every screen and report view after the run finishes.
// Writes <out>/clickables-connected.jsonl, <out>/screens-connected.json, <out>/net-connected.json.
// Never clicks a paid Start button; the only submission is the synthetic one through proof.serve.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, collect, explore, launch, newLog, record, settle, shoot, slug } from "./lib.mjs";

const [origin = "http://127.0.0.1:8791", out = ".", shots = "."] = process.argv.slice(2);
const jsonl = path.join(out, "clickables-connected.jsonl");
rmSync(jsonl, { force: true });
const log = newLog();
const screens = [];
const explorations = [];

function sectionFor(address) {
  const url = new URL(address, origin);
  if (url.pathname.startsWith("/start")) return "C2";
  if (url.pathname.startsWith("/report/")) {
    const hash = url.hash.slice(1).split("/")[0];
    if (hash === "calendar" || hash === "forecast") return "C4";
    if (hash === "evidence") return "C5";
    return "C3";
  }
  return "C1";
}

async function inventory(page, { screen, state, address, reload, shotName, widths = [1440, 390], limitPerKind }) {
  log.current = `${address} [${state}]`;
  const section = sectionFor(address);
  const sectionOf = (r) => (r.inRail ? "C1" : r.inDialog && section.startsWith("C3") && /Open in Evidence/.test(r.name) ? "C5" : section);
  const meta = { surface: "connected", screen, state, address };
  const rows = await collect(page);
  const n = record(jsonl, meta, rows, sectionOf);
  let revealed = 0;
  let skipped = {};
  if (reload) {
    const found = await explore(page, rows, reload, { limitPerKind });
    skipped = found.skipped;
    for (const item of found.results) {
      const dialogSection = item.rows.some((r) => /Open in Evidence/.test(r.name)) ? "C5" : section;
      revealed += record(jsonl, { ...meta, state: `${state}; after ${item.opener.role} "${item.opener.name || item.opener.text}"` }, item.rows, (r) => (r.inDialog ? dialogSection : sectionOf(r)));
      explorations.push({ address, state, opener: item.locator, revealed: item.rows.length, error: item.error });
    }
  }
  const files = [];
  for (const width of widths) files.push(await shoot(page, shots, `connected-${shotName ?? slug(address)}-${slug(state)}`, width));
  screens.push({ surface: "connected", section, screen, state, address, elements: n, revealed, skipped, shots: files });
  console.log(`${address} [${state}] ${n} elements, ${revealed} revealed${Object.keys(skipped).length ? `, not opened ${JSON.stringify(skipped)}` : ""}`);
  return rows;
}

async function visit(page, address, screen, state, options = {}) {
  const go = async () => {
    await page.goto(new URL(address, origin).href, { waitUntil: "domcontentloaded" });
    await settle(page, options.wait ?? 600);
  };
  await go();
  return inventory(page, { screen, state, address, reload: options.explore === false ? undefined : go, ...options });
}

async function waitFinished(id) {
  for (let i = 0; i < 240; i += 1) {
    const res = await fetch(new URL(`/connected/activity/${encodeURIComponent(id)}`, origin));
    if (res.ok) {
      const run = await res.json();
      if (run.ended_at || /finished|failed|stopped|capped|rejected/i.test(String(run.status))) return run;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("the synthetic run did not finish within 240 s");
}

/**
 * Walk Start a run to the confirmation dialog and return the open dialog. With `record`, every
 * step is inventoried and photographed. Mode "live" expects the paid labels (USD 25.00 cap).
 */
async function walkStart(page, mode, recordSteps) {
  const step = async (screen, state, shotName) => {
    if (recordSteps || mode === "live") await inventory(page, { screen, state: mode === "live" ? `${state} (live mode simulated)` : state, address: "/start", reload: screen.includes("Submit dialog") ? undefined : async () => { await page.keyboard.press("Escape"); }, shotName: mode === "live" ? `${shotName}-live` : shotName, widths: recordSteps ? [1440, 390] : [1440] });
  };
  await page.goto(new URL("/start", origin).href);
  await settle(page, 1000);
  await page.getByLabel("Issuer name", { exact: true }).fill("Northbridge Synthetic Group");
  await page.getByLabel("As-of date", { exact: true }).fill("2025-03-31");
  const files = [
    ["northbridge-filing.txt", "text/plain"],
    ["northbridge-portfolio.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ];
  await page.getByLabel("Documents", { exact: true }).setInputFiles(
    files.map(([name, mimeType]) => ({ name, mimeType, buffer: readFileSync(path.join(ROOT, "proof", name)) })),
  );
  await settle(page, 400);
  if (recordSteps) await step("Start a run: Documents", "issuer, date and two files chosen, not inspected", "start-documents-chosen");
  const reading = page.waitForResponse((r) => /\/reading$/.test(new URL(r.url()).pathname), { timeout: 30000 }).catch(() => null);
  await page.getByRole("button", { name: "Inspect documents", exact: true }).click();
  await reading;
  await settle(page, 1500);
  if (recordSteps) await step("Start a run: Documents", "documents inspected", "start-documents-inspected");
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await settle(page, 400);
  if (recordSteps) await step("Start a run: Purpose", "purpose step", "start-purpose");
  await page.getByRole("radio", { name: "Full credit assessment", exact: true }).check();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await settle(page, 600);
  if (recordSteps) await step("Start a run: More context", "context step, defaults", "start-context");
  await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
  const ratings = page.getByRole("region", { name: "Ratings", exact: true });
  await ratings.getByRole("button", { name: "Add rating", exact: true }).click();
  await settle(page, 300);
  if (recordSteps) await step("Start a run: More context", "workbook selected, one rating row added", "start-context-rating");
  await ratings.getByLabel("Agency", { exact: true }).selectOption("Moody's");
  await ratings.getByLabel("Scope", { exact: true }).selectOption("issuer");
  await ratings.getByLabel("Rating", { exact: true }).fill("B1");
  await ratings.getByLabel("Outlook", { exact: true }).selectOption("Negative");
  await ratings.getByLabel("As-of", { exact: true }).fill("2025-02-28");
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  const submitButton = page.getByRole("button", { name: mode === "live" ? "Submit, spend up to USD 25.00" : "Submit run", exact: true });
  await submitButton.waitFor({ timeout: 30000 });
  await settle(page, 800);
  if (recordSteps) await step("Start a run: Review and start", "review sheet, nothing approved", "start-review");
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const box of (await limits.getByRole("checkbox").all()).slice(0, 50)) await box.check();
  await page.getByRole("checkbox", { name: "Approve: I have read this summary and want this run started", exact: true }).check();
  await settle(page, 300);
  if (recordSteps) await step("Start a run: Review and start", "limits acknowledged and summary approved", "start-review-approved");
  await submitButton.click();
  const dialog = page.getByRole("dialog", { name: mode === "live" ? "Start a paid run?" : "Start a synthetic test?" });
  await dialog.waitFor();
  await settle(page, 300);
  await step("Start a run: Submit dialog", mode === "live" ? "paid confirmation dialog open" : "synthetic confirmation dialog open", mode === "live" ? "start-paid-dialog" : "start-synthetic-dialog");
  return dialog;
}

const { browser, context } = await launch(log);
const page = await context.newPage();
page.setDefaultTimeout(15000);
let runId = null;
try {
  // Phase A: before any run.
  await visit(page, "/", "Library index", "empty: no runs published");
  await visit(page, "/runs", "Run activity", "empty: no runs");
  await visit(page, "/run/00000000-000000-00", "Run progress", "unknown run id");
  await visit(page, "/report/no-such-report", "Report", "unknown report folder");
  await visit(page, "/no-such-page", "Not found", "unknown address");
  await visit(page, "/start", "Start a run: Documents", "initial (empty form)", { wait: 1000 });

  // Phase B: one synthetic run, following docs/react-workflow.md "Open the interface".
  const dialog = await walkStart(page, "synthetic", true);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const submitButton = page.getByRole("button", { name: "Submit run", exact: true });
  const submitted = page.waitForResponse((r) => /\/api\/submissions\/[^/]+\/submit$/.test(new URL(r.url()).pathname) && r.request().method() === "POST");
  await submitButton.click();
  await page.getByRole("dialog", { name: "Start a synthetic test?" }).getByRole("button", { name: "Start synthetic run", exact: true }).click();
  const submitResponse = await submitted;
  console.log(`synthetic submit status ${submitResponse.status()}`);
  await page.waitForURL(/\/run\/[^/]+$/, { timeout: 30000 });
  runId = new URL(page.url()).pathname.split("/").at(-1);
  await settle(page, 300);
  await inventory(page, { screen: "Run progress", state: "synthetic run in progress", address: `/run/${runId}`, shotName: "run-progress-running" });
  const runsPage = await context.newPage();
  await runsPage.goto(new URL("/runs", origin).href);
  await settle(runsPage, 300);
  log.current = "/runs [run in progress]";
  const runningRows = await collect(runsPage);
  record(jsonl, { surface: "connected", screen: "Run activity", state: "one run in progress", address: "/runs" }, runningRows, (r) => "C1");
  screens.push({ surface: "connected", section: "C1", screen: "Run activity", state: "one run in progress", address: "/runs", elements: runningRows.length, revealed: 0, shots: [await shoot(runsPage, shots, "connected-runs-one-run-in-progress", 1440), await shoot(runsPage, shots, "connected-runs-one-run-in-progress", 390)] });
  await runsPage.close();
  const finished = await waitFinished(runId);
  console.log(`run ${runId} ended: ${finished.status}`);
  writeFileSync(path.join(out, "run-connected.json"), JSON.stringify({ runId, status: finished.status, submitStatus: submitResponse.status() }, null, 1));

  // Phase C: after the run.
  await visit(page, `/run/${runId}`, "Run progress", `finished (${finished.status})`);
  await visit(page, "/runs", "Run activity", "one run ended");
  await visit(page, "/", "Library index", "one report published");
  await visit(page, `/start?from=${encodeURIComponent(runId)}`, "Start a run: Documents", "started from the earlier run (?from=)", { wait: 1500 });
  const report = `/report/${encodeURIComponent(runId)}`;
  for (const tab of ["history", "overview", "calendar", "changes", "modules", "forecast", "evidence"])
    await visit(page, `${report}#${tab}`, `Report: ${tab}`, "finished synthetic run", { wait: 1200 });
  await page.goto(new URL(`${report}#modules`, origin).href);
  await settle(page, 1200);
  const moduleLinks = [...new Set(await page.locator('main a[href^="#modules/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href"))))].slice(0, 60);
  for (const href of moduleLinks)
    await visit(page, `${report}${href}`, `Report: module ${decodeURIComponent(href.split("/")[1] ?? "")}`, "finished synthetic run", { wait: 1200 });
  await page.goto(new URL(`${report}#evidence`, origin).href);
  await settle(page, 1200);
  const evidenceLinks = [...new Set(await page.locator('main nav a[href^="#evidence"]').evaluateAll((els) => els.map((e) => e.getAttribute("href"))))].filter((h) => h !== "#evidence").slice(0, 30);
  for (const href of evidenceLinks)
    await visit(page, `${report}${href}`, `Report: evidence ${href.slice("#evidence/".length) || "summary"}`, "finished synthetic run", { wait: 1200 });

  // The paid confirmation dialog: live mode is simulated in this browser only (the HTML's mode meta
  // is rewritten), every submit request is aborted, and the dialog is cancelled. No Start is clicked.
  const paid = await context.newPage();
  paid.setDefaultTimeout(15000);
  let paidSubmits = 0;
  await paid.route(/\/api\/submissions\/[^/]+\/submit$/, (route) => {
    paidSubmits += 1;
    return route.abort();
  });
  await paid.route((url) => url.pathname === "/start" || url.pathname === "/", async (route) => {
    const result = await route.fetch();
    const body = (await result.text()).replace('name="credit-os-mode" content="synthetic"', 'name="credit-os-mode" content="live"');
    await route.fulfill({ response: result, body });
  });
  const paidDialog = await walkStart(paid, "live", false);
  await paidDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await paidDialog.waitFor({ state: "hidden" });
  writeFileSync(path.join(out, "paid-connected.json"), JSON.stringify({ paidSubmitRequestsAborted: paidSubmits }, null, 1));
  await paid.close();
} catch (error) {
  console.error(`connected probe stopped: ${error.stack ?? error}`);
  writeFileSync(path.join(out, "connected-error.txt"), String(error.stack ?? error));
  await page.screenshot({ path: path.join(shots, "connected-ERROR.png") }).catch(() => {});
  process.exitCode = 1;
} finally {
  writeFileSync(path.join(out, "screens-connected.json"), JSON.stringify({ runId, screens, explorations }, null, 1));
  writeFileSync(path.join(out, "net-connected.json"), JSON.stringify(log, null, 1));
  await browser.close();
}
