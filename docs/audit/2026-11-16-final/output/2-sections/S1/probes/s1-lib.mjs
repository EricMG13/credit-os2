// Shared helpers for the S1 probes. Run every probe from the repository root:
//   timeout 300 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/<probe>.mjs
// A probe copies web/dist to its own temporary folder (web/dist itself is never written), blocks every
// host but loopback (ruling R8) and closes the browser in a finally block. No paid call, no service.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const repo = process.cwd();
const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
export const { chromium } = require("playwright");
const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);

const SHELL = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
export const executablePath = process.env.PW_EXE ?? SHELL;
export const ROOTS = [];

/** A copy of web/dist in a new temporary folder; `data` is "fixture" (web/fixtures) or the exact text of data.js. */
export function makeDist(data = "fixture") {
  const dir = mkdtempSync(path.join(os.tmpdir(), "s1-probe-"));
  ROOTS.push(dir);
  cpSync(path.join(web, "dist"), dir, { recursive: true });
  if (data === "fixture") writeDataFile(dir, path.join(web, "fixtures"));
  else if (data !== "shipped") writeFileSync(path.join(dir, "data.js"), data);
  return dir;
}

export function cleanup() {
  for (const dir of ROOTS) rmSync(dir, { recursive: true, force: true });
}

export function pageUrl(dir, hash = "") {
  return pathToFileURL(path.join(dir, "index.html")).href + hash;
}

export const shippedUrl = (hash = "") => pathToFileURL(path.join(web, "dist", "index.html")).href + hash;

/** Opens a Chromium context that allows only file:, data:, blob: and loopback; records everything else. */
export async function open({ width = 1440, height = 900, reducedMotion } = {}) {
  const browser = await chromium.launch({ executablePath, timeout: 30000 });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    ...(reducedMotion ? { reducedMotion } : {}),
  });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(20000);
  const blocked = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    let ok = false;
    try {
      const u = new URL(url);
      ok = u.protocol === "file:" || u.protocol === "data:" || u.protocol === "blob:" ||
        ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
    } catch {
      ok = false;
    }
    if (ok) return route.continue();
    blocked.push(url);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  const log = { console: [], pageerror: [], failed: [], blocked };
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) log.console.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => log.pageerror.push(String(e)));
  page.on("requestfailed", (r) => log.failed.push(`${r.url()} ${r.failure()?.errorText ?? ""}`));
  return { browser, context, page, log };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The element that has focus, described. */
export const FOCUS = `(() => { const e = document.activeElement; if (!e) return null;
  return { tag: e.tagName.toLowerCase(), id: e.id || null, label: e.getAttribute('aria-label'),
    text: (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60), href: e.getAttribute('href') }; })()`;
