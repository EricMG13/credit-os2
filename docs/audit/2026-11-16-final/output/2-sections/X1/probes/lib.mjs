// Shared helpers for the X1 probes. Run every probe from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/X1/probes/<probe>.mjs
// Playwright comes from web/node_modules; the browser is the headless shell build installed here.
// Every browser context aborts any request whose host is not loopback or file: (ruling R8).
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const repo = process.cwd();
export const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
export const { chromium } = require("playwright");
export const HEADLESS =
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
export const kitUrl = pathToFileURL(path.join(web, "dist", "index.html")).href + "#/kit";

export async function launch() {
  return chromium.launch({ executablePath: HEADLESS, timeout: 30000, headless: true });
}

/** A new empty folder under the system temp directory, removed by the caller with `rmSync`. */
export function tempFolder(tag) {
  return mkdtempSync(path.join(os.tmpdir(), `x1-${tag}-`));
}

export function removeFolder(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/** A copy of web/dist whose data.js is written from the fixtures in `fixturesDir` (default web/fixtures). */
export async function fixtureDist(dest, fixturesDir = path.join(web, "fixtures")) {
  const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);
  cpSync(path.join(web, "dist"), dest, { recursive: true });
  writeDataFile(dest, fixturesDir);
  return pathToFileURL(path.join(dest, "index.html")).href;
}

export async function newPage(browser, { width = 1440, height = 900, reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(20000);
  const blocked = [];
  const consoleMsgs = [];
  const pageErrors = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    let ok = false;
    try {
      const u = new URL(url);
      ok =
        u.protocol === "file:" ||
        u.protocol === "data:" ||
        u.protocol === "blob:" ||
        ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
    } catch {
      ok = false;
    }
    if (ok) return route.continue();
    blocked.push(url);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") consoleMsgs.push(`${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 300)));
  return { context, page, blocked, consoleMsgs, pageErrors };
}
