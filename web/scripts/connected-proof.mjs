import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { arch, release } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { createOfflineProxy, installOfflineGuard } from "./offline-network.mjs";

const desktopOnly = process.argv.includes("--desktop-only");
const project = path.resolve(import.meta.dirname, "../..");
const runAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const sourceCommit = await readFile(path.join(project, "SOURCE-COMMIT.txt"), "utf8").then(
  (text) => text.trim(),
  (error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  },
);
const zipSha256 = process.env.CREDIT_OS_PROOF_ZIP_SHA256?.toLowerCase() ?? null;
if (sourceCommit !== null && !/^[0-9a-f]{40}$/u.test(sourceCommit)) {
  throw new Error("Invalid source commit in SOURCE-COMMIT.txt");
}
if (zipSha256 !== null && (!sourceCommit || !/^[0-9a-f]{64}$/u.test(zipSha256))) {
  throw new Error("ZIP proof requires the extracted source commit and a valid archive SHA-256");
}
const provenance = {
  source_commit: sourceCommit,
  zip_sha256: zipSha256,
  platform: process.platform,
  os_release: release(),
  architecture: arch(),
};
const proofRoot = path.join(project, "proof-artifacts");
if (runAsScript) await mkdir(proofRoot, { recursive: true });
const artifacts = runAsScript ? await mkdtemp(path.join(proofRoot, "run-")) : null;
if (runAsScript) console.log(`Browser proof artifacts: ${artifacts}`);
const python = path.join(
  project,
  ".venv",
  ...(process.platform === "win32" ? ["Scripts", "python.exe"] : ["bin", "python"]),
);
const browserProofs = [];

if (runAsScript)
  after(async () => {
    if (browserProofs.length === 2) {
      await writeFile(
        path.join(artifacts, "proof.json"),
        JSON.stringify({ ...provenance, browser_proofs: browserProofs }, null, 2) + "\n",
      );
    }
  });

async function startService(workspace) {
  const child = spawn(python, ["-m", "proof.serve", "--root", workspace, "--port", "0"], {
    cwd: project,
    env: { ...process.env, PYTHONPATH: path.join(project, "src") },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const lines = createInterface({ input: child.stdout });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (text) => {
    stderr = (stderr + text).slice(-24000);
  });
  const closed = new Promise((resolve) => child.once("close", resolve));
  const origin = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Synthetic service did not start")), 15000);
    child.once("error", reject);
    child.once("close", (code) => reject(new Error(`Synthetic service exited (${code})`)));
    lines.on("line", (line) => {
      const endpoint = line.match(/http:\/\/127\.0\.0\.1:\d+\//u)?.[0];
      if (endpoint !== undefined) resolve(endpoint);
    });
    closed.then(() => clearTimeout(timer));
    lines.once("close", () => clearTimeout(timer));
  });

  async function stop() {
    lines.close();
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await closed;
  }

  try {
    const endpoint = await origin;
    return { endpoint, stderr: () => stderr, stop };
  } catch (error) {
    await stop();
    throw new Error(`${String(error)}\n${stderr}`, { cause: error });
  }
}

function response(page, pathPattern, method) {
  return page.waitForResponse(
    (result) =>
      pathPattern.test(new URL(result.url()).pathname) && result.request().method() === method,
  );
}

const digest = (value) => createHash("sha256").update(value).digest("hex");

async function checkRunDocuments(page, channel, paidPreview) {
  // C1-002/T05 adds an empty-library action beside the existing header action.
  await page.locator("main footer").getByRole("link", { name: "Start a run", exact: true }).click();
  const stepper = page.getByRole("list", { name: "Steps in this run" });
  await checkDesktopIntake(page, stepper);
  await stepper.getByText(paidPreview ? "Paid run" : "No-cost test", { exact: true }).waitFor();
  await page
    .getByRole("complementary", { name: "Readiness", exact: true })
    .getByText("USD 25.00", { exact: true })
    .waitFor();
  if (!paidPreview)
    await page.screenshot({ path: path.join(artifacts, `${channel}-run-documents.png`) });
  if (!desktopOnly) await checkMobileDocuments(page, channel, paidPreview);
}

async function checkDesktopIntake(page, stepper) {
  const current = stepper.locator('[aria-current="step"]');
  const readiness = page.getByRole("complementary", { name: "Readiness", exact: true });
  const dropZone = page.locator("[data-dropzone]");
  await dropZone.waitFor();
  await checkRunBundle(page);
  const [drop, side] = await Promise.all([dropZone.boundingBox(), readiness.boundingBox()]);
  assert.ok(drop, "Document drop zone has a box");
  assert.ok(side, "Readiness has a box");
  assert.ok(side.x >= drop.x + drop.width, "Readiness sits beside the form");
  assert.equal(await stepper.getByRole("listitem").count(), 4);
  assert.match(await current.innerText(), /Documents/u);
}

async function checkRunBundle(page) {
  const scripts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => new URL(entry.name))
      .filter((url) => url.origin === location.origin && url.pathname.endsWith(".js"))
      .map((url) => url.pathname),
  );
  assert.ok(scripts.some((name) => name.includes("/StartRun-")));
  assert.ok(scripts.every((name) => name.startsWith("/connected-assets/")));
  assert.ok(!scripts.some((name) => /\/(ReportLibrary|LibraryIndex|RunProgress)-/u.test(name)));
}

async function checkMobileDocuments(page, channel, paidPreview) {
  const desktop = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const drop = document.querySelector("[data-dropzone]");
    const form = drop?.closest("form");
    if (!drop || !form) return false;
    return (
      document.documentElement.scrollWidth === 390 &&
      drop.getBoundingClientRect().right <= form.getBoundingClientRect().right
    );
  });
  if (!paidPreview)
    await page.screenshot({
      path: path.join(artifacts, `${channel}-run-mobile.png`),
      fullPage: true,
    });
  await page.setViewportSize(desktop);
}

async function uploadRunDocuments(page) {
  await page.getByLabel("Issuer name", { exact: true }).fill("Northbridge Synthetic Group");
  await page.getByLabel("As-of date", { exact: true }).fill("2025-03-31");
  await page.getByLabel("Your name", { exact: true }).fill("Ana L");
  const files = [
    ["northbridge-filing.txt", "text/plain"],
    [
      "northbridge-portfolio.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    ["northbridge-credit-agreement.txt", "text/plain"],
  ];
  const uploaded = files.map(([name]) =>
    page.waitForResponse(
      async (result) =>
        /\/api\/submissions\/[^/]+\/files$/u.test(new URL(result.url()).pathname) &&
        result.request().method() === "POST" &&
        (await result.json()).name === name,
    ),
  );
  await page.getByLabel("Documents", { exact: true }).setInputFiles(
    await Promise.all(
      files.map(async ([name, mimeType]) => ({
        name,
        mimeType,
        buffer: await readFile(path.join(project, "proof", name)),
      })),
    ),
  );
  const [, ...uploads] = await Promise.all([
    page.getByRole("button", { name: "Inspect documents", exact: true }).click(),
    ...uploaded,
  ]);
  for (const upload of uploads) assert.equal(upload.status(), 200);
  await page.waitForFunction(
    () => document.activeElement?.textContent?.trim() === "Inspect documents",
  );
}

// A stepper "Go back to" button, pressed with the keyboard, lands focus on that step's heading.
async function goBackWithKeyboard(page) {
  await page.getByRole("button", { name: "Go back to Documents", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      document.activeElement?.matches("h2") &&
      document.activeElement.textContent.trim() === "Documents",
  );
}

async function checkCompanyBand(report, channel) {
  const band = report.getByRole("region", { name: "Company", exact: true });
  await band.getByText("Moody's", { exact: true }).waitFor();
  await band.getByText("B1", { exact: true }).waitFor();
  await band.getByText("Entered at run start", { exact: true }).waitFor({ state: "visible" });
  const outlook = band.getByText("Negative", { exact: true });
  await outlook.waitFor();
  assert.match(await outlook.getAttribute("class"), /\btext-error-text\b/u);
  await band.screenshot({ path: path.join(artifacts, `${channel}-company-band.png`) });
}

async function checkOverviewMobile(report, page, channel) {
  const desktop = page.viewportSize();
  await page.setViewportSize({ width: 375, height: 844 });
  await report.getByRole("link", { name: "Overview", exact: true }).click();
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  const fits = await page.evaluate(() => {
    const main = document.querySelector("main");
    const over = (el) => el.scrollWidth > el.clientWidth;
    return {
      cards: document.querySelectorAll("main dl > div").length,
      wide: [...document.querySelectorAll("main dl > div")].filter(over).length,
      main: main ? over(main) : true,
    };
  });
  assert.ok(fits.cards > 0, "no headline card was found on the Overview");
  assert.equal(fits.wide, 0, "a headline card overflows at 375px");
  assert.equal(fits.main, false, "the main region overflows at 375px");
  console.log(`overview mobile: ${String(fits.cards)} headline cards fit at 375px`);
  await page.screenshot({ path: path.join(artifacts, `${channel}-overview-mobile.png`) });
  await page.setViewportSize(desktop);
}

async function approveRunInputs(page, paidPreview) {
  const current = page
    .getByRole("list", { name: "Steps in this run" })
    .locator('[aria-current="step"]');
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  assert.match(await current.innerText(), /Purpose/u);
  await goBackWithKeyboard(page);
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await page.getByRole("radio", { name: "Lite credit assessment", exact: true }).waitFor();
  await page.getByRole("radio", { name: "Full credit assessment", exact: true }).waitFor();
  await page.getByRole("radio", { name: "Deep credit assessment", exact: true }).waitFor();
  await page.getByText("20 base modules", { exact: true }).waitFor();
  await page.getByRole("radio", { name: "Full credit assessment", exact: true }).waitFor();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  assert.match(await current.innerText(), /More context/u);
  // More context is an accordion of closed sections, one open at a time: open each before its fields.
  const openSection = (name) => page.getByRole("heading", { level: 3, name, exact: true }).click();
  await openSection("For the research");
  await page
    .getByLabel(/Anything the analysis should know/u)
    .fill("Check the 2028 maturities.\nInclude refinancing risk.");
  await openSection("Files with a role");
  await page
    .getByRole("combobox", { name: "Portfolio workbook", exact: true })
    .selectOption({ label: "northbridge-portfolio.xlsx" });
  await openSection("Legal documents");
  await page
    .getByRole("combobox", { name: "Legal documents", exact: true })
    .selectOption("executed");
  await page
    .getByRole("combobox", { name: "The agreement", exact: true })
    .selectOption({ label: "northbridge-credit-agreement.txt" });
  await openSection("Ratings, quotes and facilities");
  const ratings = page.getByRole("region", { name: "Ratings", exact: true });
  await ratings.getByRole("button", { name: "Add rating", exact: true }).click();
  await ratings.getByLabel("Agency", { exact: true }).selectOption("Moody's");
  await ratings.getByLabel("Scope", { exact: true }).selectOption("issuer");
  await ratings.getByLabel("Rating", { exact: true }).fill("B1");
  await ratings.getByLabel("Outlook", { exact: true }).selectOption("Negative");
  await ratings.getByLabel("As-of", { exact: true }).fill("2025-02-28");
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  const submitButton = page.getByRole("button", {
    name: paidPreview ? "Submit, spend up to USD 25.00" : "Submit run",
    exact: true,
  });
  await submitButton.waitFor();
  assert.match(await current.innerText(), /Review and start/u);
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const checkbox of await limits.getByRole("checkbox").all()) await checkbox.check();
  return submitButton;
}

async function checkRunConfirmation(page, channel, paidPreview, consent, submitButton) {
  await consent.check();
  await submitButton.click();
  const dialog = page.getByRole("dialog", {
    name: paidPreview ? "Start a paid run?" : "Start a synthetic test?",
  });
  await dialog.waitFor();
  if (paidPreview) {
    await dialog.getByText(/spend up to USD 25\.00/u).waitFor();
    await dialog.getByRole("button", { name: "Start run, up to USD 25.00" }).waitFor();
    await page.screenshot({
      path: path.join(artifacts, `${channel}-paid-confirmation.png`),
      animations: "disabled",
    });
  } else {
    await page.screenshot({
      path: path.join(artifacts, `${channel}-run-confirmation.png`),
      animations: "disabled",
    });
  }
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.waitForFunction(
    () =>
      document.activeElement?.matches("button") &&
      document.activeElement.textContent.trim().startsWith("Submit"),
  );
  return dialog;
}

async function submit(page, channel, paidPreview = false) {
  const shownCaps = [];
  page.on("request", (request) => {
    if (/\/api\/submissions\/[^/]+\/(?:summary|submit)$/u.test(new URL(request.url()).pathname))
      shownCaps.push(request.headers()["x-shown-cap"]);
  });
  await checkRunDocuments(page, channel, paidPreview);
  await uploadRunDocuments(page);
  const submitButton = await approveRunInputs(page, paidPreview);
  const consent = page.getByRole("checkbox", {
    name: "Approve: I have read this summary and want this run started",
    exact: true,
  });
  assert.equal(await submitButton.isEnabled(), false);
  let submitRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && /\/submit$/u.test(new URL(request.url()).pathname))
      submitRequests += 1;
  });
  const dialog = await checkRunConfirmation(page, channel, paidPreview, consent, submitButton);
  assert.equal(submitRequests, 0);
  if (paidPreview) {
    assert.deepEqual(shownCaps, ["25"]);
    return;
  }

  const submitted = response(page, /\/api\/submissions\/[^/]+\/submit$/u, "POST");
  const activity = page.waitForURL(/\/run\/\d{8}-\d{6}-\d{2}$/u);
  await submitButton.click();
  await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
  assert.equal((await submitted).status(), 200);
  await activity;
  assert.equal(submitRequests, 1);
  assert.deepEqual(shownCaps, ["25", "25"]);
  return new URL(page.url()).pathname.split("/").at(-1);
}

async function checkPaidConfirmation(context, endpoint, channel) {
  const page = await context.newPage();
  try {
    // Exercise the production paid dialog with the offline service and no eligible submit URL.
    await page.route(/\/api\/submissions\/[^/]+\/submit$/u, (route) => route.abort());
    await page.route(
      (url) =>
        url.origin === new URL(endpoint).origin &&
        (url.pathname === "/" || url.pathname === "/start"),
      async (route) => {
        const result = await route.fetch({ maxRedirects: 0 });
        const body = (await result.text()).replace(
          'name="credit-os-mode" content="synthetic"',
          'name="credit-os-mode" content="live"',
        );
        await route.fulfill({ response: result, body });
      },
    );
    await page.goto(endpoint);
    await submit(page, channel, true);
  } finally {
    await page.close();
  }
}

async function checkActivity(page, channel) {
  const activity = page.getByRole("region", { name: "Run activity", exact: true });
  await activity.getByText("USD 0.00", { exact: true }).waitFor();
  await activity
    .getByRole("progressbar", {
      name: "USD 0.00 of USD 25.00 cap usage; USD 0.00 settled, USD 0.00 reserved or unknown",
    })
    .waitFor();
  await activity.getByRole("progressbar", { name: "14 of 14 modules" }).waitFor();
  await activity.getByText(/^(?:\d+ min )?\d+ s$/u).waitFor();
  // S6-037: the card includes the separately delivered report.
  const modules = activity.getByRole("group", { name: "Modules and report delivery", exact: true });
  const feed = activity.getByRole("group", { name: "Activity", exact: true });
  await feed.getByText("Report delivered.", { exact: true }).waitFor();
  const [left, right] = await Promise.all([modules.boundingBox(), feed.boundingBox()]);
  assert.ok(left && right && right.x >= left.x + left.width, "Activity sits beside Modules");
  await page.screenshot({ path: path.join(artifacts, `${channel}-run-activity.png`) });
}

async function checkTraceFocus(page, source, detail) {
  const trigger = await source.elementHandle();
  try {
    await source.press("Enter");
    const drawer = page.getByRole("dialog");
    await drawer.getByText(detail).first().waitFor();
    const href = await drawer.getByRole("link", { name: "Open in Evidence" }).getAttribute("href");
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    await page.waitForFunction((element) => document.activeElement === element, trigger);
    return href;
  } finally {
    await trigger.dispose();
  }
}

async function openExactTrace(page, source) {
  await source.press("Enter");
  const open = page.getByRole("dialog").getByRole("link", { name: "Open in Evidence" });
  const href = await open.getAttribute("href");
  assert.match(href, /#evidence\/.+~[0-9a-f]{64}-\d+$/u);
  await open.click();
  await page.waitForURL(new URL(href, page.url()).href);
  return href;
}

async function checkOverviewTrace(report, page) {
  const source = report
    .getByRole("button", { name: "Show sources for this passage" })
    .filter({
      visible: true,
    })
    .first();
  await checkTraceFocus(page, source, /annual\.txt, page 2/u);
  await openExactTrace(page, source);
  await report
    .getByText("The synthetic issuer's cover is thin at 3.1x.", { exact: false })
    .first()
    .waitFor();
  await report.getByRole("link", { name: "Overview", exact: true }).click();
}

async function checkRecord(report, page, channel) {
  const nav = report.getByRole("navigation", { name: "Evidence sections" });
  // C5-028/R4: wait for the actual run record, never accept the pending service-mode fallback.
  const loaded = response(page, /\/connected\/activity\/[^/]+$/u, "GET");
  await nav.getByRole("link", { name: "Record", exact: true }).click();
  const recordResponse = await loaded;
  assert.equal(recordResponse.status(), 200);
  assert.equal((await recordResponse.json()).execution, "synthetic");
  await report.getByRole("heading", { name: "Run record" }).waitFor();
  await report
    .getByRole("definition")
    .filter({ hasText: /^Synthetic test$/u })
    .waitFor();
  await report.getByText(/^(?:\d+ min )?\d+ s$/u).waitFor();
  await report
    .getByRole("progressbar", {
      name: "USD 0.00 of USD 25.00 cap usage; USD 0.00 settled, USD 0.00 reserved or unknown",
    })
    .waitFor();
  await report.getByRole("combobox", { name: "Module", exact: true }).selectOption("CP-1");
  await report.getByRole("columnheader", { name: "Accepted (UTC)", exact: true }).waitFor();
  await report.getByRole("columnheader", { name: "Adapter status", exact: true }).waitFor();
  await report.getByRole("cell", { name: "200", exact: true }).waitFor();
  await report.getByRole("link", { name: "Download instructions", exact: true }).waitFor();
  await report.getByText("Recorded file hashes", { exact: true }).click();
  await report
    .locator("code")
    .filter({ hasText: /^[0-9a-f]{64}$/u })
    .first()
    .waitFor();
  await page.screenshot({
    path: path.join(artifacts, `${channel}-evidence-record.png`),
    fullPage: true,
  });
  const summary = nav.getByRole("link", { name: "Summary", exact: true });
  await summary.click();
  await summary.and(nav.locator('[aria-current="page"]')).waitFor();
  await report.getByRole("heading", { name: "Handoffs", exact: true }).waitFor();
  await report.getByRole("combobox", { name: "Module", exact: true }).selectOption("");
  await page.waitForURL((url) => url.hash === "#evidence/summary");
}

async function checkChangesTrace(context, endpoint, id) {
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  try {
    // A separate fixture exercises paired-run links. The upload proof above uses the real publication.
    const response = await page.request.get(new URL("/connected/snapshot", endpoint).href, {
      maxRedirects: 0,
    });
    const snapshot = await response.json();
    const [key, current] = Object.entries(snapshot.workspace.runs).find(
      ([, run]) => run.folder === id,
    );
    const prior = {
      ...current,
      asOf: "2024-12-31",
      folder: "comparison-fixture",
      modules: { "CP-1": { outputs: ["earlier-schedule"], default: "earlier-schedule" } },
      changes: null,
    };
    snapshot.workspace.runs["comparison-fixture"] = prior;
    snapshot.workspace.outputs["earlier-schedule"] = {
      id: "earlier-schedule",
      module: "CP-1",
      run: "comparison-fixture",
      sha256: digest("earlier-schedule"),
      href: "",
      label: "Financial foundation",
    };
    snapshot.workspace.handoffs[digest("earlier-schedule")] = [
      {
        heading: "Chart data: debt maturities",
        line: 20,
        level: 3,
        blocks: [
          {
            type: "table",
            line: 22,
            headers: ["Period", "Debt maturing", "Reporting unit", "Basis and limitation"],
            rows: [{ line: 24, cells: ["FY2026", "0.00", "US$m", "Earlier schedule evidence."] }],
          },
        ],
      },
    ];
    prior.modules["CP-1"].outputs.unshift("reordered-output");
    snapshot.workspace.outputs["reordered-output"] = {
      id: "reordered-output",
      module: "CP-1",
      run: "comparison-fixture",
      sha256: digest("reordered-output"),
      href: "",
      label: "Earlier retained output",
    };
    snapshot.workspace.handoffs[digest("reordered-output")] =
      snapshot.workspace.handoffs[digest("earlier-schedule")];
    const output = "comparison-output";
    current.modules["CP-8"] = { outputs: [output], default: output };
    snapshot.workspace.outputs[output] = {
      id: output,
      module: "CP-8",
      run: key,
      sha256: digest(output),
      href: "",
      label: "Comparison",
    };
    snapshot.workspace.handoffs[digest(output)] = [
      {
        heading: "What changed: the issuer",
        line: 10,
        level: 3,
        blocks: [
          {
            type: "table",
            line: 12,
            headers: [
              "Measure or fact",
              "Earlier",
              "Current",
              "Cause",
              "Effect on the credit view",
            ],
            rows: [
              {
                line: 14,
                cells: ["**Net debt**", "600 US$m", "550 US$m", "New period", "Debt fell."],
              },
              {
                line: 15,
                cells: ["Interest cover", "3.1x", "3.2x", "New period", "Coverage improved."],
              },
            ],
          },
        ],
      },
    ];
    current.changes = {
      pack: {
        prior: { run: prior.folder, as_of: prior.asOf, pathway: current.pathway },
        current: { as_of: current.asOf, pathway: current.pathway },
        maturity_profile: {
          unit: "US$m",
          rows: [
            { period: "FY2026", prior: "0", current: "500" },
            { period: "FY2027", prior: null, current: null },
          ],
        },
        measures: [
          {
            key: "debt",
            label: "Net debt",
            prior: { value: "600", unit: "US$m" },
            current: { value: "550", unit: "US$m" },
            difference: "-50",
            unit: "US$m",
          },
        ],
      },
      verdicts: { measures: { debt: { kind: "comparable", label: "Same definition" } } },
    };
    await page.route(
      (url) =>
        url.origin === new URL(endpoint).origin &&
        url.pathname === "/connected/snapshot" &&
        url.searchParams.has("run"),
      (route) => route.fulfill({ json: snapshot }),
    );
    await page.goto(new URL(`/report/${id}#changes`, endpoint).href);
    const report = page.locator("main");
    const card = report.getByRole("listitem").filter({ hasText: "Net debt" });
    await openExactTrace(
      page,
      card.getByRole("button", { name: "Show sources for Net debt", exact: true }),
    );
    await report.getByRole("cell", { name: "Debt fell.", exact: true }).waitFor();
    assert.equal(
      await report.getByRole("cell", { name: "Coverage improved.", exact: true }).count(),
      0,
    );
    await page.reload();
    await report.getByRole("cell", { name: "550 US$m", exact: true }).waitFor();
    await page.goto(new URL(`/report/${id}#changes`, endpoint).href);
    const chart = report.getByRole("figure", { name: "Debt maturity schedules", exact: true });
    await chart.getByRole("radio", { name: "Table", exact: true }).check();
    const year = chart.getByRole("row").filter({ hasText: "FY2026" });
    const priorSource = year.getByRole("link", {
      name: "Earlier run source for FY2026",
      exact: true,
    });
    assert.equal(
      await priorSource.getAttribute("href"),
      `/report/comparison-fixture#evidence/earlier-schedule~${digest("earlier-schedule")}-24`,
    );
    await openExactTrace(
      page,
      year.getByRole("button", { name: "Show sources for FY2026, current run", exact: true }),
    );
    await report.getByRole("cell", { name: "500", exact: true }).waitFor();
    assert.equal(await report.getByRole("cell", { name: "1,250", exact: true }).count(), 0);
    await page.goto(
      new URL(
        `/report/comparison-fixture#evidence/earlier-schedule~${digest("earlier-schedule")}-24`,
        endpoint,
      ).href,
    );
    await report.getByRole("cell", { name: "0.00", exact: true }).waitFor();
    await page.goto(new URL("/report/comparison-fixture#evidence/1-24", endpoint).href);
    await report
      .getByRole("alert")
      .getByText("Evidence link unavailable", { exact: true })
      .waitFor();
  } finally {
    await page.close();
  }
}

async function checkCalendar(report, artifacts, channel, page) {
  await report.getByRole("link", { name: "Issuer calendar", exact: true }).click();
  await page.waitForURL((url) => url.hash === "#calendar");
  await page.reload();
  const events = report.getByRole("figure", { name: "Published events", exact: true });
  const marker = events
    .getByRole("group", { name: "Events by year", exact: true })
    .getByRole("button", { name: /Synthetic review, 2025-Q3, quarter/u })
    .first();
  await marker.waitFor();
  assert.equal(await marker.getAttribute("data-event-category"), "Scenario");
  await events
    .getByRole("group", { name: "Show categories", exact: true })
    .getByRole("button", { name: /^Scenario, /u, pressed: true })
    .waitFor();
  await events.getByRole("radio", { name: "Table", exact: true }).check();
  const table = events.getByRole("table", { name: "Published events", exact: true });
  assert.equal(await table.getByRole("row").count(), 37);
  assert.equal(
    await table.getByRole("rowheader", { name: "Synthetic note", exact: true }).count(),
    9,
  );
  await events.screenshot({ path: path.join(artifacts, `${channel}-calendar.png`) });
  const source = table.getByRole("button", { name: /^Show sources for Synthetic note ·/u }).first();
  const href = await checkTraceFocus(page, source, /Filing p\.1/u);
  assert.match(href, /#evidence\/.+~[0-9a-f]{64}-\d+$/u);
  await table.waitFor();
  await source.press("Enter");
  await page.getByRole("dialog").getByRole("link", { name: "Open in Evidence" }).click();
  await page.waitForURL(new URL(href, page.url()).href);
  await report.getByRole("cell", { name: "Filing p.1", exact: true }).waitFor();
}

async function checkModuleRecords(report, page, modules) {
  await modules.getByRole("link", { name: /^Source readiness, Delivered/u }).click();
  const readiness = report.getByRole("region", { name: "Readiness by area", exact: true });
  await readiness.getByRole("group", { name: "Ready with limitations", exact: true }).waitFor();
  await readiness.getByRole("group", { name: "Conditional", exact: true }).waitFor();
  await checkTraceFocus(
    page,
    readiness.getByRole("button", { name: "Show sources for Financial statements", exact: true }),
    /Filing p\.1/u,
  );
  await modules.getByRole("link", { name: /^Fundamental credit, Delivered/u }).click();
  const watch = report.getByRole("region", { name: "Monitoring triggers", exact: true });
  await watch.getByText("Below 3.1x", { exact: true }).waitFor();
  await watch.getByText("Not supplied: no agreed floor", { exact: true }).waitFor();
  assert.equal(await watch.getByRole("img").count(), 0);
  await checkTraceFocus(
    page,
    watch.getByRole("button", { name: "Show sources for Interest cover", exact: true }),
    /Filing p\.1; synthetic threshold/u,
  );
}

async function checkDownside(report, modules, artifacts, channel, page) {
  await modules.getByRole("link", { name: /^Downside, Delivered/u }).click();
  const scenarios = report.getByRole("region", { name: "Downside scenarios", exact: true });
  const chart = scenarios.getByRole("figure", { name: "Stressed flows and credit metrics" });
  await chart.locator('[data-case="Cost shock"][data-zero]').waitFor();
  // J3-016 identifies the selected stress case rather than the fixed control.
  const select = scenarios.getByRole("combobox", {
    name: "Stress case to compare with the unstressed control",
    exact: true,
  });
  await select.selectOption({ label: "Cost and rate shock" });
  await chart.getByText("-5.1250 (−USD 5.13 million)", { exact: true }).waitFor();
  const negative = chart.locator('[data-case="Cost and rate shock"][data-left="0"]').first();
  assert.ok(Number(await negative.getAttribute("data-width")) > 0);
  await chart.screenshot({ path: path.join(artifacts, `${channel}-downside.png`) });
  await chart.getByRole("radio", { name: "Table", exact: true }).check();
  await chart.getByRole("cell", { name: "-5.1250 (−USD 5.13 million)", exact: true }).waitFor();
  const trace = chart.getByRole("button", { name: "Show sources for Stressed FCF (US$m)" });
  await checkTraceFocus(page, trace, /Filing p\.2/u);
  await scenarios.getByText("Full scenario results", { exact: true }).click();
  await scenarios
    .getByRole("cell", { name: "Not calculated: net debt is missing", exact: true })
    .waitFor();
  await checkDownsideThresholds(report, page);
}

async function checkDownsideThresholds(report, page) {
  const panel = report.getByRole("region", { name: "EBITDA break points", exact: true });
  const chart = panel.getByRole("figure", { name: "EBITDA break points", exact: true });
  // J3-016 uses percentages; C4-036 preserves this unranked T2DS.6 table's written order.
  await chart.getByText("10%", { exact: true }).waitFor();
  assert.equal(await chart.getByRole("list").evaluate((list) => list.tagName), "UL");
  const writtenOrder = [
    "FCF reaches zero",
    "Cover reaches watch level",
    "Net leverage watch level",
  ];
  assert.deepEqual(
    (await chart.getByRole("listitem").allInnerTexts()).map((text) => text.split("\n")[0]),
    writtenOrder,
  );
  for (const [index, value] of ["10%", "15%", "32%"].entries())
    await chart.getByRole("listitem").nth(index).getByText(value, { exact: true }).waitFor();
  await panel.getByRole("combobox", { name: "Cash-interest basis" }).selectOption("1");
  await chart.getByText("12%", { exact: true }).waitFor();
  assert.deepEqual(
    (await chart.getByRole("listitem").allInnerTexts()).map((text) => text.split("\n")[0]),
    writtenOrder,
  );
  await chart.getByRole("listitem").nth(0).getByText("20%", { exact: true }).waitFor();
  await chart.getByRole("listitem").nth(1).getByText("12%", { exact: true }).waitFor();
  await chart
    .getByRole("listitem")
    .nth(2)
    .getByText("Not calculated: net debt is missing", { exact: true })
    .waitFor();
  assert.equal(await chart.locator("[data-decline]").count(), 2);
  await chart.getByRole("radio", { name: "Table", exact: true }).check();
  await chart.getByRole("cell", { name: "Analyst watch level, not a covenant" }).waitFor();
  await checkTraceFocus(
    page,
    chart.getByRole("button", { name: "Show sources for Cover reaches watch level" }),
    /Filing p\.1/u,
  );
  const watches = report.getByRole("region", { name: "Monitoring sensitivities", exact: true });
  await watches.getByRole("img", { name: "Leading", exact: true }).waitFor();
  await watches.getByRole("img", { name: "Lagging", exact: true }).waitFor();
  if (desktopOnly) return;
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth === 390);
  await page.setViewportSize(viewport);
}

async function checkMacro(report, modules, artifacts, channel, page) {
  await modules.getByRole("link", { name: /^Rates, FX & hedging, Delivered/u }).click();
  const rates = report.getByRole("region", { name: "Interest rate shocks", exact: true });
  const chart = rates.getByRole("figure", { name: "Added annual interest", exact: true });
  await chart.getByText("8.00", { exact: true }).waitFor();
  await chart.getByText("5.00", { exact: true }).waitFor();
  await chart.locator("[data-missing]").waitFor();
  await chart.screenshot({ path: path.join(artifacts, `${channel}-rate-shocks.png`) });
  await chart.getByRole("radio", { name: "Table", exact: true }).check();
  await chart.getByRole("cell", { name: "5.00", exact: true }).waitFor();
  await checkTraceFocus(
    page,
    chart.getByRole("button", { name: "Show sources for Added annual interest" }),
    /Filing p\.1/u,
  );
  await rates.getByText("All rate-shock results and limitations", { exact: true }).click();
  await rates
    .getByRole("cell", { name: "Not supplied: no hedge sensitivity retained", exact: true })
    .waitFor();
  const currency = report.getByRole("figure", {
    name: "Foreign-currency strengthening",
    exact: true,
  });
  await currency.locator("[data-bar][data-zero]").first().waitFor();
  await currency.getByRole("radio", { name: "Table", exact: true }).check();
  const change = currency.getByRole("row", { name: /Change in EBITDA/u });
  await change.getByRole("cell", { name: "2.00", exact: true }).waitFor();
  await change.getByRole("cell", { name: "4.00", exact: true }).waitFor();
}

async function checkRateMethod(workspace, run) {
  const requests = path.join(workspace, "_engine", "runs", run, "requests", "CP-2E");
  const [request, ...others] = await readdir(requests);
  assert.ok(request && others.length === 0);
  const { checks } = JSON.parse(
    await readFile(path.join(requests, request, "1.method-checks.json"), "utf8"),
  );
  const rated = checks.filter((check) => check.script.endsWith("/rate_fx_sensitivity.py"));
  assert.deepEqual(
    Object.fromEntries(
      rated.map(({ figure, status, recomputed }) => [figure, [status, recomputed]]),
    ),
    {
      "Unhedged floating-rate debt": ["agreed", 500],
      "Unhedged debt percentage": ["agreed", 62.5],
      "+100 bps cash-interest impact": ["agreed", 5],
    },
  );
  for (const register of ["T2F.1", "T2F.3", "T2F.4", "T2F.5"]) {
    assert.ok(
      checks.some(
        (check) =>
          check.script.endsWith("/completeness_check.py") &&
          check.figure === "columns" &&
          check.register === register &&
          check.status === "agreed",
      ),
      `Expected the native completeness check to accept ${register}`,
    );
  }
}

async function checkSecurities(report, modules, artifacts, channel, page) {
  await modules.getByRole("link", { name: /^Security selection, Delivered/u }).click();
  const section = report.getByRole("region", { name: "Instrument decisions", exact: true });
  const loan = section.getByRole("article").filter({ hasText: "Synthetic term loan" });
  await loan.getByText("Not supplied: no loan observation", { exact: true }).waitFor();
  await loan.getByText("Requires More Work", { exact: true }).waitFor();
  await checkTraceFocus(
    page,
    loan.getByRole("button", { name: "Show sources for Synthetic term loan" }),
    /Filing p\.3/u,
  );
  const figure = section.getByRole("figure", { name: "Last-trade prices and yields", exact: true });
  await figure.getByText("7.0100%", { exact: true }).waitFor();
  await figure.getByText("$88.12", { exact: true }).waitFor();
  assert.equal(await figure.locator("[data-bar]").count(), 4);
  await figure.screenshot({ path: path.join(artifacts, `${channel}-instrument-quotes.png`) });
  await figure.getByRole("radio", { name: "Table", exact: true }).check();
  await figure.getByRole("cell", { name: "8.9000%", exact: true }).waitFor();
  await section.getByText("Credit and recovery rationale", { exact: true }).click();
  await section.getByRole("cell", { name: "Recovery basis unavailable", exact: true }).waitFor();
}

async function checkCharts(report, artifacts, channel, page, run) {
  const section = (name) =>
    report
      .getByRole("navigation", { name: "Report sections" })
      .getByRole("link", { name: name === "Modules" ? /^Modules(?: \d+)?$/u : name, exact: true });
  await section("Overview").click();
  await report.getByRole("link", { name: "Chart index", exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.id === "forecast-run-charts");
  await section("Changes").click();
  await report.getByText("No earlier run to compare.", { exact: true }).waitFor();
  await section("Modules").click();
  if (!desktopOnly) await checkCompactModules(report, page, channel);
  const modules = report.getByRole("navigation", { name: "Modules and sections" });
  await modules.getByRole("link", { name: /^Liquidity, Delivered/u }).waitFor();
  await modules.getByRole("link", { name: /^Refinancing & LME, Delivered/u }).waitFor();
  await checkModuleRecords(report, page, modules);
  await checkDownside(report, modules, artifacts, channel, page);
  await checkMacro(report, modules, artifacts, channel, page);
  await checkSecurities(report, modules, artifacts, channel, page);
  const sourceHref = await checkDebtEvidence(report, modules, artifacts, channel, page);
  await section("Modules").click();
  await checkPortfolioEvidence(report, modules, artifacts, channel, page);
  await section("Forecast").click();
  await checkForecastEvidence(report, artifacts, channel, page);
  await checkReadingLayout(report, page, channel);
  await checkForecastRunCharts(report, page, sourceHref);
  await checkReportEvidence(report, page, channel, run);
}

async function checkCompactModules(report, page, channel) {
  const desktop = page.viewportSize();
  const select = report.getByRole("combobox", { name: "Module", exact: true });
  const navigation = report.getByRole("navigation", { name: "Modules and sections" });
  await page.setViewportSize({ width: 390, height: 844 });
  await select.selectOption("CP-1");
  assert.equal(await navigation.isVisible(), false);
  await report
    .locator("summary")
    .filter({ hasText: /^On this page$/u })
    .click();
  const jump = report.getByRole("combobox", { name: "Jump to section" });
  const first = await jump.locator("option").nth(1).getAttribute("value");
  assert.ok(first);
  await jump.selectOption(first);
  await page.waitForFunction((id) => document.activeElement?.id === id, first);
  await page.waitForFunction(() => document.documentElement.scrollWidth === 390);
  await page.screenshot({ path: path.join(artifacts, `${channel}-modules-mobile.png`) });
  await page.setViewportSize({ width: 1000, height: 844 });
  assert.equal(await select.isVisible(), true);
  assert.equal(await navigation.isVisible(), false);
  await page.setViewportSize({ width: 1001, height: 844 });
  assert.equal(await select.isVisible(), false);
  assert.equal(await navigation.isVisible(), true);
  await page.setViewportSize(desktop);
}

async function checkForecastPresentation(report, page, channel) {
  const scope = report.getByRole("region", { name: "Model scope and basis" });
  const cases = report.locator("#forecast-cases");
  const qualification = cases
    .locator("xpath=preceding-sibling::*[1]")
    .getByText(/conditional illustration/u);
  await qualification.waitFor();
  assert.equal(await scope.locator("details").getAttribute("open"), null);
  await scope.locator("summary").click();
  await scope.getByText("Synthetic; not analytical review.", { exact: true }).waitFor();
  await scope.getByRole("link", { name: "Full model notes and limitations" }).waitFor();
  await scope.locator("summary").click();
  await report.getByRole("heading", { name: "Forecast cases", exact: true }).waitFor();
  const chart = report.getByRole("figure", { name: "Cash proxy by scenario" });
  await chart.getByRole("radio", { name: "Table", exact: true }).check();
  const comparison = report.getByRole("table", { name: "Scenario comparison" });
  await comparison.getByRole("rowheader", { name: "Base case", exact: true }).waitFor();
  await comparison.getByRole("rowheader", { name: "Downside shock", exact: true }).waitFor();
  assert.equal(await comparison.getByRole("rowheader").count(), 2);
  await chart.getByRole("radio", { name: "Chart", exact: true }).check();
  await report.getByRole("table", { name: "Cash flow model", exact: true }).waitFor();
  await qualification.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: path.join(artifacts, `${channel}-forecast.png`) });
}

async function checkReadingLayout(report, page, channel) {
  const desktop = page.viewportSize();
  const navigation = report.getByRole("navigation", { name: "Forecast sections", exact: true });
  await navigation.getByRole("button", { name: "Cash flow model", exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.id === "forecast-model");
  if (desktopOnly) return;
  await page.setViewportSize({ width: 390, height: 844 });
  await report
    .locator("summary")
    .filter({ hasText: /^On this page$/u })
    .click();
  await report
    .getByRole("combobox", { name: "Jump to section", exact: true })
    .selectOption("forecast-model");
  await page.waitForFunction(() => document.activeElement?.id === "forecast-model");
  const chart = report.getByRole("figure", { name: "Cash proxy by scenario", exact: true });
  await chart.getByRole("radio", { name: "Chart", exact: true }).check();
  const source = chart.getByRole("button", {
    name: "Show sources for Cash proxy by scenario",
    exact: true,
  });
  // 8d2089bc: the hit area is exactly 44px (26px padding box plus 9px each side), pixels -22 to +21
  // from the centre. Prove all four corners of that square reach the button.
  await source.scrollIntoViewIfNeeded();
  const reachesButton = await source.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return [-22, 21].every((dx) =>
      [-22, 21].every((dy) => {
        const hit = document.elementFromPoint(cx + dx, cy + dy);
        return hit !== null && el.contains(hit);
      }),
    );
  });
  assert.equal(reachesButton, true);
  const main = await page.locator("main").boundingBox();
  assert.ok(main);
  assert.ok(main.x === 0);
  assert.ok(main.width === 390);
  await chart.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.documentElement.scrollWidth === 390);
  const labels = await chart.locator("svg text").evaluateAll((nodes) =>
    nodes
      .filter((node) => /^FY\d{4}E$/u.test(node.textContent ?? ""))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      })
      .sort((a, b) => a.left - b.left),
  );
  assert.ok(labels.length >= 2);
  for (let i = 1; i < labels.length; i += 1) assert.ok(labels[i].left >= labels[i - 1].right);
  await page.screenshot({ path: path.join(artifacts, `${channel}-forecast-mobile.png`) });
  await page.setViewportSize(desktop);
}

async function checkDebtEvidence(report, modules, artifacts, channel, page) {
  await modules.getByRole("link", { name: /^Financial foundation, Delivered/u }).click();
  const debt = report.getByRole("figure", { name: "Debt maturities", exact: true });
  await debt.getByRole("radio", { name: "Chart", exact: true }).waitFor();
  await debt.locator("svg.recharts-surface").first().waitFor();
  await debt.screenshot({ path: path.join(artifacts, `${channel}-debt-maturities.png`) });
  await debt.getByRole("radio", { name: "Table", exact: true }).check();
  for (const value of ["500", "1,250", "Not supplied: the schedule stops here"]) {
    await debt.getByText(value, { exact: true }).first().waitFor();
  }
  const debtRow = debt
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: "1,250", exact: true }) });
  const debtRowSource = debtRow.getByRole("button", { name: /^Show sources for /u });
  const debtRowHref = await checkTraceFocus(page, debtRowSource, "Basis");
  const source = debt.getByRole("button", {
    name: "Show sources for Debt maturities",
    exact: true,
  });
  const sourceHref = await checkTraceFocus(page, source, "Basis");
  assert.match(sourceHref, /#evidence\/.+~[0-9a-f]{64}-\d+$/u);
  assert.notEqual(sourceHref, debtRowHref);
  assert.ok(await debt.getByRole("radio", { name: "Table", exact: true }).isChecked());
  await source.press("Enter");
  await page.getByRole("dialog").getByRole("link", { name: "Open in Evidence" }).click();
  await page.waitForURL(new URL(sourceHref, page.url()).href);
  await report
    .getByRole("cell", { name: "Not supplied: the schedule stops here", exact: true })
    .waitFor();
  await page.reload();
  await report.getByRole("cell", { name: "1,250", exact: true }).waitFor();

  return sourceHref;
}

async function checkPortfolioEvidence(report, modules, artifacts, channel, page) {
  await modules.getByRole("link", { name: /^Committee decision, Delivered/u }).click();
  const limits = report.getByRole("figure", { name: "Portfolio limits", exact: true });
  await limits.getByText("2.37%", { exact: true }).waitFor();
  assert.equal(await limits.locator("[data-bar]").count(), 2);
  assert.equal(await limits.locator("[data-tick]").count(), 2);
  await limits.screenshot({ path: path.join(artifacts, `${channel}-portfolio-limits.png`) });
  await checkTraceFocus(
    page,
    limits.getByRole("button", { name: "Show sources for Portfolio limits", exact: true }),
    /Compliance_Monitor snapshot/u,
  );
  await limits.getByRole("radio", { name: "Table", exact: true }).check();
  for (const value of ["2.37%", "2.50%", "3.73%", "5.00%"]) {
    await limits.getByRole("cell", { name: value, exact: true }).waitFor();
  }
  assert.equal(await limits.getByText("2.40%", { exact: true }).count(), 0);
  await report
    .locator("summary")
    .filter({ hasText: /^Published exposures and proposals$/u })
    .click();
  const publishedLimits = report.getByRole("table", {
    name: "Published exposures and proposals",
    exact: true,
  });
  await publishedLimits.getByRole("cell", { name: "2.40", exact: true }).waitFor();
  await publishedLimits
    .getByRole("cell", { name: "Not supplied: no proposal", exact: true })
    .waitFor();
}

async function checkForecastEvidence(report, artifacts, channel, page) {
  await checkForecastPresentation(report, page, channel);
  await report.getByText("Cash flow trends by line item", { exact: true }).click();
  const revenue = report.getByRole("figure", { name: "Revenue", exact: true });
  await revenue.locator("svg.recharts-surface").first().waitFor();
  const sourceSwitch = report.getByRole("switch");
  // J3-019 names the existing highlight behavior accurately.
  if (await sourceSwitch.isChecked())
    await report.getByText("Highlight source icons", { exact: true }).click();
  await revenue.hover();
  const revenueSource = revenue.getByRole("button", {
    name: "Show sources for Revenue",
    exact: true,
  });
  await page.waitForFunction(
    (control) => control !== null && getComputedStyle(control).opacity === "1",
    await revenueSource.elementHandle(),
  );
  await revenue.screenshot({ path: path.join(artifacts, `${channel}-revenue.png`) });
  await revenue.getByRole("radio", { name: "Table", exact: true }).check();
  await revenue.getByText("1,050", { exact: true }).first().waitFor();
  await openExactTrace(
    page,
    revenue.getByRole("button", { name: "Show sources for Revenue", exact: true }),
  );
  await report.locator("pre").filter({ hasText: "cpos-forecast-inputs/1" }).waitFor();
  await page.reload();
  await report.locator("pre").filter({ hasText: "cpos-forecast-inputs/1" }).waitFor();
  await report
    .getByRole("navigation", { name: "Report sections" })
    .getByRole("link", { name: "Forecast", exact: true })
    .click();
  const model = report.getByRole("table", { name: "Cash flow model", exact: true });
  // T18 C4-003/C5-004 adds a separately named source button to each row header.
  const revenueRow = model.getByRole("row").filter({
    has: page.getByRole("rowheader").filter({ hasText: /^Revenue$/u }),
  });
  await revenueRow.getByRole("button", { name: "Show sources for Revenue", exact: true }).waitFor();
  await revenueRow.getByRole("cell", { name: "1,050", exact: true }).first().waitFor();
  // Independent fixture arithmetic: 1,000 × 1.05 × 0.30 = 315; a 20% shock gives 252.
  const ebitdaRow = model.getByRole("row").filter({
    has: page.getByRole("rowheader").filter({
      hasText: /^Adj EBITDA \(as named in Financial foundation\)$/u,
    }),
  });
  await ebitdaRow.getByRole("cell", { name: "315", exact: true }).waitFor();
  const downsideCase = report.getByRole("radio", { name: /^Downside shock/u });
  await downsideCase.focus();
  await downsideCase.press("Space");
  assert.ok(await downsideCase.isChecked());
  const cashProxy = report.getByRole("figure", { name: "Cash proxy by scenario", exact: true });
  await cashProxy.getByRole("radio", { name: "Table", exact: true }).check();
  const comparison = cashProxy.getByRole("table", { name: "Scenario comparison" });
  assert.equal(await comparison.getByRole("rowheader").count(), 2);
  assert.equal(
    await comparison.getByRole("row", { name: /Downside shock/u }).getAttribute("aria-current"),
    "true",
  );
  await ebitdaRow.getByRole("cell", { name: "252", exact: true }).waitFor();
  assert.equal(await ebitdaRow.getByRole("cell", { name: "315", exact: true }).count(), 0);
  const baseCase = report.getByRole("radio", { name: /^Base case/u });
  await baseCase.focus();
  await baseCase.press("Space");
  await ebitdaRow.getByRole("cell", { name: "315", exact: true }).waitFor();
  await comparison.getByRole("row", { name: /Base case/u }).waitFor();
  await report.getByLabel("Statement columns").selectOption("compare");
  await report.getByLabel("Comparison period").selectOption({ index: 0 });
  await ebitdaRow.getByRole("cell", { name: "315", exact: true }).waitFor();
  await ebitdaRow.getByRole("cell", { name: "252", exact: true }).waitFor();
}

async function checkForecastRunCharts(report, page, sourceHref) {
  const runCharts = report.getByRole("region", { name: "Run charts", exact: true });
  const forecastLimits = runCharts.getByRole("figure", { name: "Portfolio limits", exact: true });
  await forecastLimits.getByText("3.73%", { exact: true }).waitFor();
  await forecastLimits.getByRole("radio", { name: "Table", exact: true }).check();
  await forecastLimits.getByRole("cell", { name: "2.37%", exact: true }).waitFor();
  const forecastDebt = runCharts.getByRole("figure", { name: "Debt maturities", exact: true });
  await forecastDebt.getByRole("radio", { name: "Table", exact: true }).check();
  await forecastDebt.getByRole("cell", { name: "1,250", exact: true }).waitFor();
  assert.equal(
    await checkTraceFocus(
      page,
      forecastDebt.getByRole("button", { name: "Show sources for Debt maturities", exact: true }),
      "Basis",
    ),
    sourceHref,
  );
  const bridge = runCharts.getByRole("figure", { name: "Liquidity bridge", exact: true });
  await bridge.locator('[data-step="Debt repayment"][data-kind="down"]').waitFor();
  await bridge.getByRole("radio", { name: "Table", exact: true }).check();
  for (const value of ["-450", "570"]) {
    await bridge.getByRole("cell", { name: value, exact: true }).waitFor();
  }
  const refinancing = runCharts.getByRole("figure", { name: "Refinancing need", exact: true });
  // C4-020 uses period lines: two maturity points, one committed-resource point,
  // and no invented zero for the second period's missing commitment.
  const plotted = refinancing.locator(".recharts-wrapper");
  await plotted.locator('[data-marker][data-series="Committed resources"]').waitFor();
  assert.equal(await plotted.locator('[data-marker][data-series="Debt maturing"]').count(), 2);
  assert.equal(
    await plotted.locator('[data-marker][data-series="Committed resources"]').count(),
    1,
  );
  await refinancing.getByRole("radio", { name: "Table", exact: true }).check();
  await refinancing
    .getByRole("row", { name: /FY2026/u })
    .getByRole("cell", { name: "300", exact: true })
    .waitFor();
  await refinancing
    .getByRole("cell", { name: "Not supplied: no commitment is stated", exact: true })
    .waitFor();
  await runCharts.getByRole("link", { name: "Financial foundation", exact: true }).click();
  await report.getByRole("heading", { name: "Financial foundation", exact: true }).waitFor();
}

// C5-011/OQ-04: source files are listed only, with their original identities.
async function checkListedSourceFiles(report, page) {
  for (const name of [
    "northbridge-filing.txt",
    "northbridge-portfolio.xlsx",
    "northbridge-credit-agreement.txt",
  ]) {
    const row = report.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) });
    await row.waitFor();
    const expectedHash = digest(await readFile(path.join(project, "proof", name)));
    await row.locator("code").getByText(expectedHash, { exact: true }).waitFor();
    assert.equal(await row.getByRole("link").count(), 0, `${name} must be listed without a link`);
  }
  assert.equal(await report.getByRole("link", { name: /^Open source file:/u }).count(), 0);
  assert.equal(await report.locator('a[href*="/connected/sources/"]').count(), 0);
}

async function checkReportEvidence(report, page, channel, run) {
  // J3-017 renames the existing report-history destination.
  await report
    .getByRole("navigation", { name: "Report sections" })
    .getByRole("link", { name: "History", exact: true })
    .click();
  await report.getByRole("heading", { name: "Report history", exact: true }).waitFor();
  await report
    .getByRole("navigation", { name: "Report sections" })
    .getByRole("link", { name: "Evidence", exact: true })
    .click();
  const evidence = report.getByRole("navigation", { name: "Evidence sections" });
  await evidence.getByRole("link", { name: "Sources", exact: true }).click();
  await report.getByRole("heading", { name: "Sources", exact: true }).waitFor();
  await checkListedSourceFiles(report, page);
  await evidence.getByRole("link", { name: "Summary", exact: true }).click();
  await page.reload();
  await report.getByRole("heading", { name: "Handoffs", exact: true }).waitFor();
  await checkRecord(report, page, channel);
  await checkPublishedScriptChecks(report, page, channel, run);
  await report.getByRole("combobox", { name: "Module", exact: true }).selectOption("");
  await evidence.getByRole("link", { name: "Summary", exact: true }).click();
  await report.getByRole("heading", { name: "Handoffs", exact: true }).waitFor();
}

async function checkPublishedScriptChecks(report, page, channel, run) {
  const snapshot = await page.request.get(
    new URL(`/connected/snapshot?run=${encodeURIComponent(run)}`, page.url()).href,
    { maxRedirects: 0 },
  );
  assert.equal(snapshot.status(), 200);
  const { workspace } = await snapshot.json();
  const published = Object.values(workspace.runs).find((item) => item.folder === run);
  assert.ok(published);
  const record = published.evidence.scriptChecks?.find((item) => item.module === "CP-2E");
  assert.ok(record && record.outcomes.length > 0, "The published run must retain CP-2E checks");
  const rateCheck = record.outcomes.find(
    (outcome) => outcome.figure === "Unhedged floating-rate debt",
  );
  assert.ok(rateCheck, "The published run must retain the floating-rate debt check");
  const nav = report.getByRole("navigation", { name: "Evidence sections" });
  await nav.getByRole("link", { name: /Script checks/u }).click();
  await page.waitForURL((url) => url.hash === "#evidence/checks");
  await report.getByRole("heading", { name: "Script checks", exact: true }).waitFor();
  const module = report.getByRole("combobox", { name: "Module", exact: true });
  await module.selectOption("CP-2E");
  await page.waitForURL((url) => url.hash === "#evidence/checks/CP-2E");
  // C5-014/batch a: the check is headed by its retained register and figure.
  const rate = report
    .getByRole("heading", {
      name: [rateCheck.register, rateCheck.figure].filter(Boolean).join(" · "),
      exact: true,
    })
    .locator("..")
    .locator("..");
  await rate.getByText(rateCheck.status, { exact: true }).waitFor();
  await rate.waitFor();
  await rate.getByText(rateCheck.reason, { exact: true }).waitFor();
  await checkOutcomeValues(rate, rateCheck);
  await checkCheckMetadata(report, record);
  await page.screenshot({
    path: path.join(artifacts, `${channel}-evidence-script-checks.png`),
    fullPage: true,
  });
}

async function checkOutcomeValues(rate, rateCheck) {
  const recomputed = [rateCheck.recomputed, rateCheck.recomputedLabel]
    .filter((value) => value !== null)
    .join(" ");
  if (recomputed) {
    await rate
      .getByText(`${recomputed}${rateCheck.unit ? ` ${rateCheck.unit}` : ""}`, {
        exact: true,
      })
      .waitFor();
  }
}

async function checkCheckMetadata(report, record) {
  for (const { status, n } of record.counts) {
    await report.getByText(`${String(n)} ${status}`, { exact: true }).waitFor();
  }
  const storedScript = record.scripts.find((script) => script.sha256);
  if (storedScript?.sha256) {
    await report.locator("code").getByText(storedScript.sha256, { exact: true }).waitFor();
  }
}

async function checkCompactLibrary(page, endpoint, run) {
  const response = await page.request.get(new URL("/connected/library", endpoint).href, {
    maxRedirects: 0,
  });
  assert.equal(response.status(), 200);
  const index = await response.json();
  assert.equal(index.chips, undefined);
  assert.deepEqual(Object.keys(index.workspace), ["runs"]);
  const found = Object.values(index.workspace.runs).find((item) => item.folder === run);
  assert.ok(found);
  // C1-025/C3-001 adds only the designated card paragraph and its exact provenance.
  assert.deepEqual(Object.keys(found).sort(), ["folder", "issuerKey", "lead", "pathway"]);
  const snapshot = await page.request.get(
    new URL(`/connected/snapshot?run=${encodeURIComponent(run)}`, endpoint).href,
    { maxRedirects: 0 },
  );
  assert.equal(snapshot.status(), 200);
  const { workspace } = await snapshot.json();
  const matched = Object.entries(workspace.runs).find(([, item]) => item.folder === run);
  assert.ok(matched);
  const [key, published] = matched;
  assert.equal(found.issuerKey, published.issuerKey);
  assert.equal(found.pathway, published.pathway);
  const output = workspace.outputs[published.modules["CP-6"].default];
  assert.ok(output);
  assert.equal(output.id, published.modules["CP-6"].default);
  assert.equal(output.run, key);
  assert.equal(output.module, "CP-6");
  assert.match(output.sha256, /^[0-9a-f]{64}$/u);
  const paragraph = workspace.handoffs[output.sha256]
    .find((section) => section.heading === "Bottom line" && section.level === 3)
    ?.blocks.find((block) => block.type === "text");
  assert.ok(paragraph);
  assert.deepEqual(found.lead, {
    module: "CP-6",
    output: output.id,
    sha256: output.sha256,
    line: paragraph.line,
    text: paragraph.text,
  });
  assert.equal(found.lead.text, "The synthetic issuer shows one observed item.");
  assert.ok(Number.isInteger(found.lead.line) && found.lead.line > 0);
  assert.ok(
    JSON.stringify(found.lead).length < 2000,
    "The card contains one paragraph, not a handoff",
  );
  assert.ok(index.catalogue.real.some((item) => item.id === run));
}

async function checkLibrarySearch(context, endpoint) {
  const library = await context.newPage();
  library.setDefaultTimeout(15000);
  try {
    await library.goto(endpoint);
    const search = library.getByRole("searchbox", { name: "Search issuers" });
    await search.fill("zz no match");
    await library.getByText(/No issuers match these filters/).waitFor();
    await search.fill("Northbridge");
    await library.getByRole("link", { name: "Open report", exact: true }).waitFor();
    await search.fill("zz again");
    await library.getByText(/No issuers match these filters/).waitFor();
    await search.fill("");
    await library.getByRole("link", { name: "Open report", exact: true }).waitFor();
  } finally {
    await library.close();
  }
}

function recordBrowserRequests(page) {
  const errors = [];
  const publicationRequests = [];
  const scriptRequests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith(".js")) scriptRequests.push(url.pathname);
    if (url.pathname.startsWith("/connected/")) publicationRequests.push(url.pathname + url.search);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return { errors, publicationRequests, scriptRequests };
}

async function checkStartRoute(page, endpoint, scriptRequests, brand) {
  await page.goto(new URL("/start", endpoint).href);
  await page.getByLabel("Issuer name", { exact: true }).waitFor();
  assert.ok(scriptRequests.some((path) => /connected-assets\/StartRun-[^/]+\.js$/u.test(path)));
  assert.ok(
    !scriptRequests.some((path) => /connected-assets\/ReportLibrary-[^/]+\.js$/u.test(path)),
  );
  assert.ok(!scriptRequests.some((path) => /\/assets\/index-[^/]+\.js$/u.test(path)));
  scriptRequests.length = 0;
  await page.goto(endpoint);
  const brands = await page.evaluate(() =>
    navigator.userAgentData?.brands.map(({ brand }) => brand),
  );
  assert.ok(
    (brands ?? []).includes(brand),
    `Expected branded ${brand}, received ${String(brands)}`,
  );
}

async function waitForFinishedRun(page, endpoint, workspace, channel, run) {
  const open = page.getByRole("link", { name: "Open report", exact: true });
  const stopped = page
    .getByRole("status")
    .filter({ hasText: /^(Failed|Capped|Rejected|Interrupted)$/u });
  await open.or(stopped).waitFor({ timeout: 60000 });
  const state = await page.request.get(new URL(`/api/runs/${run}`, endpoint).href, {
    maxRedirects: 0,
  });
  assert.equal(state.status(), 200);
  const completed = await state.json();
  assert.equal(completed.status, "finished", completed.reason ?? "The run did not finish.");
  await checkActivity(page, channel);
  await checkRateMethod(workspace, run);
  return open;
}

async function checkFinishedReport(page, open, scriptRequests, channel, run) {
  await open.click();
  await page.waitForURL((url) => url.pathname === `/report/${run}`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  assert.ok(
    scriptRequests.some((path) => /connected-assets\/ReportLibrary-[^/]+\.js$/u.test(path)),
  );
  const report = page.locator("main");
  await report.getByText("Full credit assessment", { exact: true }).waitFor();
  await report.getByText("As of 31 March 2025", { exact: true }).waitFor();
  await report
    .getByText("The synthetic issuer shows one observed item.", { exact: false })
    .first()
    .waitFor();
  await page.reload();
  await report
    .getByText("The synthetic issuer shows one observed item.", { exact: false })
    .first()
    .waitFor();
  await page.screenshot({
    path: path.join(artifacts, `${channel}-finished-report.png`),
    fullPage: true,
  });
  await checkCompanyBand(report, channel);
  if (!desktopOnly) await checkOverviewMobile(report, page, channel);
  await checkOverviewTrace(report, page);
  await report.getByRole("link", { name: "Chart index", exact: true }).click();
  await page.waitForURL((url) => url.hash === "#forecast/run-charts");
  await page.waitForFunction(() => document.activeElement?.id === "forecast-run-charts");
  await report.getByRole("link", { name: "Overview", exact: true }).click();
  await checkCalendar(report, artifacts, channel, page);
  await checkCharts(report, artifacts, channel, page, run);
  return report;
}

async function checkPublishedRun({ context, page, report, endpoint, run, publicationRequests }) {
  const download = report.getByRole("link", {
    name: "Download Fundamental credit",
    exact: true,
  });
  await download.waitFor();
  const [file] = await Promise.all([page.waitForEvent("download"), download.click()]);
  assert.equal(file.suggestedFilename(), "CP-2.md");
  const retired = await page.request.get(new URL("/library/index.html", endpoint).href, {
    maxRedirects: 0,
  });
  assert.equal(retired.status(), 308);
  assert.equal(retired.headers().location, "/");
  const oldScript = await page.request.get(new URL("/library/views.js", endpoint).href);
  assert.equal(oldScript.status(), 404);
  const bytes = await readFile(await file.path());
  assert.match(bytes.toString("utf8"), /The synthetic issuer shows one observed item\./u);
  const publication = await page.request.get(new URL("/connected/snapshot", endpoint).href, {
    maxRedirects: 0,
  });
  await checkChangesTrace(context, endpoint, run);
  await checkCompactLibrary(page, endpoint, run);
  await checkLibrarySearch(context, endpoint);
  assert.ok(publicationRequests.includes("/connected/library"));
  assert.ok(publicationRequests.includes(`/connected/snapshot?run=${encodeURIComponent(run)}`));
  assert.ok(!publicationRequests.includes("/connected/snapshot"));
  assert.equal(publication.status(), 200);
  const { workspace: publishedWorkspace } = await publication.json();
  const published = Object.values(publishedWorkspace.runs).find((item) => item.folder === run);
  assert.ok(published);
  assert.equal(Object.values(published.modules).filter((module) => module.default).length, 14);
  assert.ok(published.modules["CP-2D"].default);
  assert.ok(published.modules["CP-3C"].default);
  const designated = publishedWorkspace.outputs[published.modules["CP-2"].default];
  assert.equal(createHash("sha256").update(bytes).digest("hex"), designated.sha256);
  assert.equal(new URL(page.url()).pathname, `/report/${run}`);
}

function browserProofRecord({ channel, brand, browserVersion, run }) {
  const layout = desktopOnly
    ? {
        viewport: "desktop",
        downside: "downside break-point ranking and watch timing",
        forecast: "Desktop Forecast section jump",
        modules: [],
      }
    : {
        viewport: "desktop and mobile",
        downside: "downside break-point ranking, watch timing, and narrow layout",
        forecast:
          "Forecast section jumps, full mobile reading width, 44px traces and separated chart period labels",
        modules: [
          "compact module and first-section navigation at 390px with complementary 1000/1001px breakpoints",
        ],
      };
  return {
    ...provenance,
    browser: brand,
    version: browserVersion,
    run,
    viewport_scope: layout.viewport,
    screenshots: [
      "run-documents",
      "run-mobile",
      "paid-confirmation",
      "run-confirmation",
      "run-activity",
      "finished-report",
      "calendar",
      "debt-maturities",
      "downside",
      "rate-shocks",
      "instrument-quotes",
      "portfolio-limits",
      "revenue",
      "forecast",
      "forecast-mobile",
      "overview-mobile",
      "modules-mobile",
      "evidence",
      "evidence-record",
      "evidence-script-checks",
    ]
      .filter((view) => !desktopOnly || !view.endsWith("-mobile"))
      .map((view) => `${channel}-${view}.png`),
    checks: [
      "upload",
      "four-step intake, document drop zone and responsive readiness panel",
      "approved submission",
      "paid cap confirmation and cancel without submission",
      "synthetic confirmation and exactly one submission",
      "run activity spend, module count, elapsed time and delivery feed",
      "finished publication and retired library pages unavailable",
      "compact library index, repeated issuer searches and report-scoped browser requests",
      "Run loads only connected route bundles without the report reader or offline app",
      "route-based JavaScript loads only after navigation (run, library, and report chunks)",
      "overview",
      "issuer calendar date precision and originating row",
      "figure and row trace keyboard focus restoration",
      "changes",
      "financial chart, table and source trace reload",
      "readiness and monitoring records with source traces",
      "downside case comparison with signed cash flow and explicit gap",
      layout.downside,
      "rate and currency shocks with zero and unreported hedge outcomes",
      "native completeness and rate sensitivity checks agreed",
      "dated instrument quotes, decision and recovery qualification",
      "selected workbook attestation, portfolio limits and proposal qualification",
      "forecast chart and model",
      layout.forecast,
      "conditional base-case qualification immediately precedes cases, scope expands and the all-case comparison remains visible",
      ...layout.modules,
      "chart source control visible on hover with Highlight source icons off",
      "shared Base and Downside case selection updates cash proxy and exact model values",
      "evidence bookmark retains identity after reorder and rejects old ordinal addresses",
      "forecast run figures and original module",
      "signed liquidity bridge and unfunded refinancing row",
      "report history",
      "evidence reload and handoff",
      "all three supplied source names and original hashes listed without open/download links",
      "exact Overview passage, module chart row and Forecast inputs",
      "Evidence Record metadata, module timings, synthetic responses and hashes",
      "CP-2E script checks match retained status, recomputed values and native counts",
      "paired Changes fixture links only to its matched handoff row",
    ],
  };
}

async function checkBrowserRun(context, service, workspace, channel, brand) {
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const { errors, publicationRequests, scriptRequests } = recordBrowserRequests(page);
  await checkStartRoute(page, service.endpoint, scriptRequests, brand);
  await checkPaidConfirmation(context, service.endpoint, channel);
  const run = await submit(page, channel);
  const open = await waitForFinishedRun(page, service.endpoint, workspace, channel, run);
  const report = await checkFinishedReport(page, open, scriptRequests, channel, run);
  await checkPublishedRun({
    context,
    page,
    report,
    endpoint: service.endpoint,
    run,
    publicationRequests,
  });
  assert.deepEqual(errors, []);
  await page.screenshot({
    path: path.join(artifacts, `${channel}-evidence.png`),
    fullPage: true,
  });
  return browserProofRecord({ channel, brand, browserVersion: context.browser().version(), run });
}

function launchBrowser(channel, envName, proxy) {
  const executablePath = process.env[envName];
  return chromium.launch({
    ...(executablePath === undefined ? { channel } : { executablePath }),
    proxy,
  });
}

const browserCases = runAsScript
  ? [
      ["chrome", "Google Chrome", "CHROME_PATH"],
      ["msedge", "Microsoft Edge", "EDGE_PATH"],
    ]
  : [];
for (const [channel, brand, envName] of browserCases) {
  test(
    `${brand} uploads, submits and opens a finished connected report`,
    { timeout: 120000 },
    async () => {
      const workspace = await mkdtemp(
        path.join(process.platform === "win32" ? artifacts : "/tmp", "coc-"),
      );
      let service;
      let browser;
      let record;
      let context;
      let guard;
      let proxy;
      let proofError;
      try {
        service = await startService(workspace);
        proxy = await createOfflineProxy();
        browser = await launchBrowser(channel, envName, proxy.settings);
        context = await browser.newContext({ serviceWorkers: "block" });
        guard = await installOfflineGuard(context);
        const blank = await context.newPage();
        await blank.goto("about:blank");
        await writeFile(
          path.join(artifacts, `${channel}-blank-offline.json`),
          JSON.stringify(
            {
              url: blank.url(),
              non_loopback_requests: guard.attempts.length,
              proxy_blocks: [...proxy.attempts],
            },
            null,
            2,
          ) + "\n",
        );
        await blank.close();
        record = await checkBrowserRun(context, service, workspace, channel, brand);
      } catch (error) {
        if (service !== undefined) console.error(service.stderr());
        await cp(path.join(workspace, "_engine", "logs"), path.join(artifacts, `${channel}-logs`), {
          recursive: true,
        }).catch((copyError) => {
          if (copyError.code !== "ENOENT") console.error(copyError);
        });
        proofError = error;
      } finally {
        await context?.close();
        await browser?.close();
        await proxy?.close();
        if (guard) {
          await writeFile(
            path.join(artifacts, `${channel}-offline.json`),
            JSON.stringify(
              {
                non_loopback_requests: guard.attempts.length,
                attempts: guard.attempts,
                proxy_blocks: proxy.attempts,
              },
              null,
              2,
            ) + "\n",
          );
        }
        await service?.stop();
        await rm(workspace, { recursive: true, force: true });
      }
      try {
        guard?.assertOffline();
      } catch (error) {
        if (proofError)
          throw new AggregateError([proofError, error], "Proof and offline guard failed");
        throw error;
      }
      if (proofError) throw proofError;
      record.offline = {
        non_loopback_requests: guard.attempts.length,
        browser_proxy_blocks: proxy.attempts.length,
      };
      await writeFile(
        path.join(artifacts, `${channel}.json`),
        JSON.stringify(record, null, 2) + "\n",
      );
      browserProofs.push(record);
      console.log(`${brand} ${record.version} completed run ${record.run}`);
    },
  );
}
