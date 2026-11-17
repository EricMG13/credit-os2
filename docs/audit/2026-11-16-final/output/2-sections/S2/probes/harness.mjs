// Shared helper for the S2 probes. Run a probe from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/S2/probes/<probe>.mjs
// It copies web/dist into a fresh temporary folder (web/dist is never touched), writes data.js from
// the fixtures (or from a modified copy a probe passes in), opens the copy from disk in headless
// Chromium with every host but file:/loopback blocked (ruling R8), and always closes the browser.
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
export const { chromium } = require("playwright");
const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);

export const EXE =
  process.env.CHROME_EXE ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

/** A scratch folder of your own: a copy of web/dist whose data.js comes from `mutate(fixtures)` or the fixtures. */
export function makeVariant(mutate) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "s2probe-"));
  const dist = path.join(tmp, "dist");
  cpSync(path.join(web, "dist"), dist, { recursive: true });
  const fx = path.join(tmp, "fixtures");
  mkdirSync(fx);
  for (const f of readdirSync(path.join(web, "fixtures"))) {
    cpSync(path.join(web, "fixtures", f), path.join(fx, f));
  }
  if (mutate) {
    const file = path.join(fx, "library.json");
    const lib = JSON.parse(readFileSync(file, "utf8"));
    mutate(lib);
    writeFileSync(file, JSON.stringify(lib));
  }
  writeDataFile(dist, fx);
  return { tmp, dist, url: pathToFileURL(path.join(dist, "index.html")).href, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
}

/** The shipped build as is (empty data.js). */
export const shippedUrl = pathToFileURL(path.join(web, "dist", "index.html")).href;

export async function open({ width = 1440, height = 900 } = {}) {
  const browser = await chromium.launch({ executablePath: EXE, timeout: 30000, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(20000);
  const blocked = [];
  const consoleLines = [];
  const requests = [];
  await context.route("**/*", (route) => {
    const url = route.request().url();
    let ok = false;
    try {
      const u = new URL(url);
      ok = u.protocol === "file:" || u.protocol === "data:" || u.protocol === "blob:" ||
        ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
    } catch { ok = false; }
    requests.push(url);
    if (ok) return route.continue();
    blocked.push(url);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleLines.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => consoleLines.push(`pageerror: ${e.message}`));
  return { browser, context, page, blocked, consoleLines, requests };
}

export const hash = (base, h) => `${base}#${h}`;
