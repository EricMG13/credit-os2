// Shared helper for the S3 probes. Run every probe from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/S3/probes/<probe>.mjs
// The static app needs no service: each probe copies web/dist to a temporary folder (web/ is never
// changed), writes a data.js from web/fixtures (optionally mutated), opens it from disk in Chromium with
// every host but loopback blocked (ruling R8), and removes the folder and closes the browser at the end.
// A probe prints "DEFECT:" lines for what it reproduces and exits 1 when the defect is present.
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const require = createRequire(path.join(repo, "web", "package.json"));
const { chromium } = require("playwright");
const EXE =
  process.env.CHROME_PATH ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

export const blocked = [];
export const ISSUER = "halden-aerostructures";
export const RUN = "2026-09-30";

/** A temporary copy of web/dist whose data.js is written from the fixtures, optionally mutated (a function of the library slice). */
export async function fixtureApp(mutate) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "ss-S3-probe-"));
  const dist = path.join(dir, "dist");
  cpSync(path.join(repo, "web", "dist"), dist, { recursive: true });
  const fx = path.join(dir, "fx");
  mkdirSync(fx);
  for (const f of ["library", "model", "run", "signal"]) {
    cpSync(path.join(repo, "web", "fixtures", `${f}.json`), path.join(fx, `${f}.json`));
  }
  if (mutate) {
    const file = path.join(fx, "library.json");
    const lib = JSON.parse(readFileSync(file, "utf8"));
    mutate(lib.slice);
    writeFileSync(file, JSON.stringify(lib));
  }
  const { writeDataFile } = await import(pathToFileURL(path.join(repo, "web", "scripts", "fixture-data.mjs")).href);
  writeDataFile(dist, fx);
  return { base: pathToFileURL(path.join(dist, "index.html")).href, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** The shipped build as it stands (its data.js holds no issuers). */
export const shippedBase = () => pathToFileURL(path.join(repo, "web", "dist", "index.html")).href;

export async function run(body) {
  const browser = await chromium.launch({ executablePath: EXE, timeout: 30000, args: ["--no-sandbox"] });
  let defects = 0;
  const say = (line) => console.log(line);
  const defect = (line) => { defects += 1; console.log(`DEFECT: ${line}`); };
  try {
    await body({ browser, say, defect });
  } finally {
    await browser.close();
  }
  if (blocked.length > 0) console.log(`blocked requests: ${blocked.join(", ")}`);
  process.exitCode = defects > 0 ? 1 : 0;
}

export async function newPage(browser, base, hash, { w = 1440, h = 900 } = {}) {
  const context = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: h } });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(20000);
  await context.route("**/*", (route) => {
    let ok = false;
    try {
      const u = new URL(route.request().url());
      ok = ["file:", "data:", "blob:"].includes(u.protocol) || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
    } catch { ok = false; }
    if (ok) return route.continue();
    blocked.push(route.request().url());
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  await page.goto(`${base}#${hash}`, { waitUntil: "load" });
  await page.waitForSelector("#main", { timeout: 15000 });
  await page.waitForTimeout(350);
  return page;
}

export const modulePath = (module, issuer = ISSUER, run = RUN) => `/library/${issuer}/${run}/modules/${module}`;
export const activeLabel = (page) =>
  page.evaluate(() => {
    const a = document.activeElement;
    return a ? `${a.tagName.toLowerCase()} "${(a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50)}"` : "none";
  });
