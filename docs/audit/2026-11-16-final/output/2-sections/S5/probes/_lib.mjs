// Shared helper for the S5 probes. Run each probe from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/S5/probes/<probe>.mjs
// Needs the built web/dist (not rebuilt here) and Playwright from web/node_modules. Every request to a
// host other than loopback or file: is aborted (ruling R8). Makes a temp folder of its own and removes it.
import { cpSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const repo = process.cwd();
export const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
export const { chromium } = require("playwright");
const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);
export const EXE =
  process.env.CHROME_PATH ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
export const tmp = mkdtempSync(path.join(tmpdir(), "s5-probe-"));
export const cleanup = () => rmSync(tmp, { recursive: true, force: true });
export const RUN = "/model/transdigm/2025-06-30/";

/** A copy of web/dist whose data.js is written from web/fixtures, with model.json changed by `edit`. */
export function dist(name, edit) {
  const fx = path.join(tmp, "fx-" + name);
  cpSync(path.join(web, "fixtures"), fx, { recursive: true });
  if (edit) {
    const file = path.join(fx, "model.json");
    const model = JSON.parse(readFileSync(file, "utf8"));
    edit(model.slice.runs);
    writeFileSync(file, JSON.stringify(model));
  }
  const d = path.join(tmp, "dist-" + name);
  cpSync(path.join(web, "dist"), d, { recursive: true });
  writeDataFile(d, fx);
  return d;
}
export const url = (d, hash = "") => pathToFileURL(path.join(d, "index.html")).href + (hash ? "#" + hash : "");

export const blocked = [];
export async function context(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...opts });
  ctx.setDefaultTimeout(15000);
  ctx.setDefaultNavigationTimeout(20000);
  await ctx.route("**/*", (route) => {
    let ok = false;
    try {
      const u = new URL(route.request().url());
      ok = u.protocol === "file:" || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) || ["data:", "blob:"].includes(u.protocol);
    } catch { ok = false; }
    if (ok) return route.continue();
    blocked.push(route.request().url());
    return route.abort("blockedbyclient");
  });
  return ctx;
}
export const launch = () => chromium.launch({ executablePath: EXE, timeout: 30000, args: ["--no-sandbox"] });
export const text = async (page, sel = "main") => (await page.locator(sel).innerText()).replace(/\s+/g, " ").trim();
