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

function seedClaude() {
  const run = "claude-hook-fixture";
  const attempt = "claude-review";
  ledger("start", run, "fixture-spec", "fixture-plan", "0", "2");
  ledger("launch", run, attempt, "1", "0", "fixture-spec", "fixture-plan");
  execFileSync(
    python,
    [
      "-c",
      "import json, sys; from pathlib import Path; from tools.dev_ledger import connect; " +
        "db = connect(Path(sys.argv[1])); " +
        "db.execute('INSERT INTO dispatch_policies VALUES(?,?)', " +
        "(sys.argv[2], json.dumps({'client': 'claude'})))",
      database,
      run,
    ],
    { cwd: root },
  );
  const adapter = (...args) => command("tools/dev_claude_activity.py", ...args);
  execFileSync(python, adapter("bind", run, attempt, "fixture-session", "reviewer"), { cwd: root });
  for (const hook_event_name of ["SubagentStart", "SubagentStop"]) {
    execFileSync(python, adapter("hook"), {
      cwd: root,
      input: JSON.stringify({
        hook_event_name,
        session_id: "fixture-session",
        agent_type: "reviewer",
        agent_id: "fixture-agent",
        last_assistant_message: "Fixture transcript must stay out of the dashboard",
      }),
    });
  }
  ledger("settle", run, attempt, "0");
}

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
  execFileSync(
    python,
    [
      "-c",
      "import sys; from pathlib import Path; from tools.dev_ledger import connect, event; " +
        "db = connect(Path(sys.argv[1])); " +
        "event(db, 'coverage-delivery', 'observed:worker-1', 'worker-result', " +
        "{'observed_model': 'gpt-6.2-astra', 'observed_effort': 'medium', 'returncode': 0})",
      database,
    ],
    { cwd: root },
  );
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

async function proveRecovery(page, url, channel) {
  const run = `recovery-${channel}`;
  ledger("start", run, "fixture-spec", "fixture-plan", "0", "1");
  assert.throws(() => ledger("launch", run, "writer-1", "1", "0", "wrong", "wrong"));
  await page.goto(`${url}?run=${run}`);
  await page.getByRole("link", { name: "Run progress · launch rejected" }).waitFor();
  if (out) await page.screenshot({ path: join(out, `${channel}-rejected.png`), fullPage: true });
  await page.getByText("writer-1 · Launch rejected before worker start", { exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "writer-1", exact: true }).count(), 0);
  ledger("launch", run, "writer-1", "1", "0", "fixture-spec", "fixture-plan");
  await page.clock.fastForward(10500);
  await page.getByRole("heading", { name: "writer-1", exact: true }).waitFor();
  assert.equal(await page.locator(".launch-notice").count(), 0);
  await page.getByRole("link", { name: "Run progress", exact: true }).waitFor();
  await page
    .locator(".timeline")
    .getByText("writer-1 · Launch recovered · worker assigned")
    .waitFor();
  ledger("settle", run, "writer-1", "0");
}

async function prove(channel, url, viewport) {
  const browser = await chromium.launch({ channel });
  try {
    const page = await browser.newPage({ viewport });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(url).origin,
    });
    page.setDefaultTimeout(10000);
    await page.clock.install();
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
    assert.equal(await page.getByRole("heading", { name: "worker-1", exact: true }).count(), 1);
    assert(await page.getByText(/Time to result/).isVisible());
    assert(await page.getByText("gpt-6.2-astra · medium", { exact: true }).isVisible());
    await page.getByRole("link", { name: /D-04/ }).click();
    await page.getByRole("button", { name: "Draft change request" }).click();
    const reply = page.getByRole("textbox", { name: "Prompt" });
    assert.match(await reply.inputValue(), /coverage-delivery, decision D-04.*change/);
    await reply.fill("For Credit OS2 run coverage-delivery, decision D-04, match fiscal periods.");
    await page.getByRole("button", { name: "Copy prompt" }).click();
    await page.getByRole("status").filter({ hasText: "Prompt copied" }).waitFor();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      await reply.inputValue(),
    );
    await page.getByRole("button", { name: "Draft explanation request" }).click();
    assert.match(await reply.inputValue(), /coverage-delivery, decision D-04.*explain/);
    await reply.fill("Keep this draft while worker status refreshes.");
    const checkpoint = `Verification checkpoint from ${channel}`;
    ledger(
      "note",
      "coverage-delivery",
      `P-${channel}`,
      "1",
      JSON.stringify({ kind: "progress", attempt: "worker-1", summary: checkpoint }),
    );
    await page.clock.fastForward(10500);
    await page.locator(".timeline").getByText(new RegExp(checkpoint)).waitFor();
    assert.equal(await reply.inputValue(), "Keep this draft while worker status refreshes.");

    assert(await page.getByText("Match fiscal periods.", { exact: true }).isVisible());
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    assert(fits, "dashboard overflows the viewport");
    assert.deepEqual(errors, []);
    if (out) await page.screenshot({ path: join(out, `${channel}.png`), fullPage: true });
    const status = await page.request.get(new URL("/", url).href);
    assert.equal(status.status(), 404);
    const rejected = await page.request.post(url, { data: { decision: "D-04" } });
    assert(!rejected.ok());
    await proveRecovery(page, url, channel);
    await page.goto(`${url}?run=claude-hook-fixture`);
    await page.getByText("Claude Code · Model unverified", { exact: true }).waitFor();
    assert(await page.getByText(/Agent time/).isVisible());
    await page.locator(".timeline").getByText("claude-review · Claude agent returned").waitFor();
    assert.equal(
      await page.getByText("Fixture transcript must stay out of the dashboard").count(),
      0,
    );
    return { channel, version: browser.version(), viewport, decision: "D-04" };
  } finally {
    await browser.close();
  }
}

let server;
try {
  seed();
  seedClaude();
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
