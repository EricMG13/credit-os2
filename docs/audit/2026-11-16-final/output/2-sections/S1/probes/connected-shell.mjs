// S1-002, S1-003 and S1-009 on the connected surface: the same Shell.tsx on the synthetic service (no paid call, no --live).
// Starts proof.serve on port 8761 under a new empty folder and stops it when done.
// Run from the repository root: timeout 200 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/connected-shell.mjs
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { open, sleep, repo } from "./s1-lib.mjs";
const root = mkdtempSync(path.join(os.tmpdir(), "s1svc-"));
const svc = spawn("uv", ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", "8761"], { cwd: repo, env: { ...process.env, PYTHONPATH: "src" }, stdio: "ignore" });
const base = "http://127.0.0.1:8761";
try {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) { await sleep(500); up = await fetch(base + "/").then((r) => r.ok, () => false); }
  if (!up) throw new Error("service did not start");
  const { browser, page } = await open({ width: 390, height: 844 });
  try {
    for (const p of ["/", "/runs", "/start"]) {
      await page.goto("about:blank"); await page.goto(base + p); await page.waitForSelector("h1"); await sleep(400);
      console.log(`${p}: ` + JSON.stringify(await page.evaluate(() => ({ title: document.title, h1: document.querySelector("h1").textContent, documentScrollHeight: document.documentElement.scrollHeight, viewportHeight: document.documentElement.clientHeight }))));
    }
    await page.goto("about:blank"); await page.goto(base + "/"); await page.waitForSelector("h1"); await sleep(400);
    await page.locator('nav[aria-label="Areas"] li:nth-child(2) span').click(); await sleep(400);
    console.log("tap on the label 'Run': path is " + (await page.evaluate(() => location.pathname)) + " (the icon would go to /runs)");
  } finally { await browser.close(); }
} finally {
  svc.kill("SIGTERM");
  await sleep(500);
  rmSync(root, { recursive: true, force: true });
}
