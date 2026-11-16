// Stage 0 probe: load every screen of both surfaces with every host but loopback blocked, and log
// each request that was attempted to another host (network layer) and each request the page's own
// Content-Security-Policy refused (console). Also loads the native issuer library page.
// Run from the repository root with the synthetic service running:
//   node docs/audit/2026-11-16-final/output/0-baseline/probes/offline.mjs <origin> <probe-out-dir> <workspace-root> <out.json>
// <probe-out-dir> holds screens-connected.json and screens-static.json (from connected.mjs and
// static.mjs) and the static-* folders static.mjs prepared. Reads pages only; submits nothing.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { CAP, isLocal, launch, newLog, settle } from "./lib.mjs";

const [origin, probeOut, workspace, outFile] = process.argv.slice(2);
if (!outFile) {
  console.error("usage: offline.mjs <origin> <probe-out-dir> <workspace-root> <out.json>");
  process.exit(2);
}
const connected = JSON.parse(readFileSync(path.join(probeOut, "screens-connected.json"), "utf8")).screens;
const statics = JSON.parse(readFileSync(path.join(probeOut, "screens-static.json"), "utf8")).screens;

const targets = new Map();
for (const s of connected) {
  if (s.address === "/start?from=") continue; // a state of /start?from=<run>, already listed
  targets.set(new URL(s.address, origin).href, `connected ${s.address}`);
}
for (const s of statics) {
  const variant = /^\[(\w+)\] /.exec(s.address)?.[1] ?? "fixture";
  const hash = s.address.replace(/^\[\w+\] /, "").replace(/^index\.html/, "");
  targets.set(pathToFileURL(path.join(probeOut, `static-${variant}`, "index.html")).href + hash, `static ${s.address}`);
}
targets.set(new URL("/library/index.html", origin).href, "native library over loopback");
targets.set(pathToFileURL(path.join(workspace, "library.html")).href, "native library from disk (redirect)");
targets.set(pathToFileURL(path.join(workspace, "_engine", "library", "index.html")).href, "native library from disk");

const log = newLog();
const { browser, context } = await launch(log);
const page = await context.newPage();
const visited = [];
try {
  let count = 0;
  for (const [url, label] of targets) {
    if ((count += 1) > CAP) break;
    log.current = label;
    await page.goto("about:blank");
    const response = await page.goto(url, { waitUntil: "load", timeout: 30000 }).catch((error) => ({ error }));
    await settle(page, 800);
    // Scroll the main region to its end so lazily drawn content (charts) loads.
    await page.evaluate(() => {
      const main = document.querySelector("main") ?? document.scrollingElement;
      if (main) main.scrollTop = main.scrollHeight;
    });
    await page.waitForTimeout(300);
    visited.push({ label, url, status: response?.error ? String(response.error).split("\n")[0] : response?.status?.() ?? null });
  }
} finally {
  await browser.close();
}
const other = log.requests.filter((r) => !isLocal(r.url));
const result = {
  visited: visited.length,
  requests: log.requests.length,
  nonLoopbackAttempted: other,
  blocked: log.blocked,
  cspViolations: log.csp,
  pageErrors: log.errors,
  pages: visited,
};
writeFileSync(outFile, JSON.stringify(result, null, 1));
console.log(`visited ${visited.length}, requests ${log.requests.length}, non-loopback ${other.length}, blocked ${log.blocked.length}, CSP ${log.csp.length}, errors ${log.errors.length}`);
