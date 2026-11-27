/** Live browser proof for the local development coordinator. */
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const fixture = mkdtempSync(join(tmpdir(), "credit-os2-dev-dashboard-"));
const database = join(fixture, "fixture.sqlite");
const out = process.env.CREDIT_OS2_DASHBOARD_PROOF;
const python = execFileSync(
  "uv",
  ["run", "--no-sync", "python", "-c", "import sys; print(sys.executable)"],
  { cwd: root, encoding: "utf8" },
).trim();
const command = (script, ...args) => [script, "--db", database, ...args];
const ledger = (...args) =>
  execFileSync(python, command("tools/dev_ledger.py", ...args), {
    cwd: root,
    encoding: "utf8",
  });

function seed() {
  ledger("start", "coverage-delivery", "fixture-spec", "fixture-plan", "0", "2");
  ledger("start", "report-copy", "fixture-spec", "fixture-plan", "0", "2");
  for (const [id, kind, summary] of [
    ["D-02", "verified", "Verified that a genuine zero stays visible."],
    ["D-03", "applied", "Display “No prior” when the comparison period is missing."],
    ["D-04", "owner", "Choose the comparison periods for the ranking."],
  ]) {
    ledger(
      "note",
      "coverage-delivery",
      id,
      "1",
      JSON.stringify({ kind, summary, recommendation: "Match fiscal periods." }),
    );
  }
  ledger("launch", "coverage-delivery", "worker-1", "1", "0", "fixture-spec", "fixture-plan");
}

async function ready(server) {
  const lines = createInterface({ input: server.stdout });
  const error = new Promise((_, reject) => {
    server.once("error", reject);
    server.once("exit", (code) => reject(Error(`Dashboard exited with ${code}`)));
  });
  const url = await Promise.race([lines[Symbol.asyncIterator]().next(), error]);
  lines.close();
  assert.match(url.value, /^http:\/\/127\.0\.0\.1:\d+\//);
  return url.value;
}

async function prove(channel, url, viewport) {
  const browser = await chromium.launch({ channel });
  try {
    const page = await browser.newPage({ viewport });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await page.getByLabel("Run", { exact: true }).selectOption("coverage-delivery");
    await page.getByRole("button", { name: "View run" }).click();
    const groups = page.locator(".group h3");
    assert.deepEqual(await groups.allTextContents(), [
      "Needs your decision 1",
      "Applied 1",
      "Verified 1",
    ]);
    assert.equal(await page.getByRole("rowheader", { name: "worker-1" }).count(), 1);
    await page.getByRole("link", { name: /D-04/ }).click();
    await page.getByRole("button", { name: "Draft change request" }).click();
    const reply = page.getByRole("textbox", { name: "Prompt" });
    assert.match(await reply.inputValue(), /coverage-delivery, decision D-04.*change/);
    await reply.fill("For Credit OS2 run coverage-delivery, decision D-04, match fiscal periods.");
    await page.getByRole("button", { name: "Copy prompt" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: /Prompt copied|copy shortcut/ })
      .waitFor();
    await page.getByRole("button", { name: "Draft explanation request" }).click();
    assert.match(await reply.inputValue(), /coverage-delivery, decision D-04.*explain/);
    assert(await page.getByText("Match fiscal periods.", { exact: true }).isVisible());
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    assert(fits, "dashboard overflows the viewport");
    assert.deepEqual(errors, []);
    if (out) await page.screenshot({ path: join(out, `${channel}.png`), fullPage: true });
    const status = await page.request.get(new URL("/", url).href);
    assert.equal(status.status(), 404);
    const rejected = await page.request.post(url, { data: { decision: "D-04" } });
    assert(!rejected.ok());
    return { channel, version: browser.version(), viewport, decision: "D-04" };
  } finally {
    await browser.close();
  }
}

let server;
try {
  seed();
  const before = ledger("status", "coverage-delivery");
  server = spawn(python, command("tools/dev_dashboard.py"), {
    cwd: root,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const url = await ready(server);
  const results = [];
  results.push(await prove("chrome", url, { width: 1440, height: 920 }));
  results.push(await prove("msedge", url, { width: 390, height: 844 }));
  assert.equal(ledger("status", "coverage-delivery"), before);
  const gitCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const gitDirty = Boolean(
    execFileSync("git", ["status", "--porcelain", "-uno"], { cwd: root, encoding: "utf8" }).trim(),
  );
  const proof = JSON.stringify({ gitCommit, gitDirty, results }, null, 2);
  if (out) writeFileSync(join(out, "dashboard-proof.json"), proof);
  console.log(proof);
} finally {
  if (server) {
    const closed = new Promise((resolve) => server.once("close", resolve));
    server.kill();
    await closed;
  }
  rmSync(fixture, { recursive: true, force: true });
}
