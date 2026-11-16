// Stage 0 probe: the static app (web/dist/index.html opened from disk) with the fixture data.
// Run from the repository root after `npm --prefix web run build`:
//   node docs/audit/2026-11-16-final/output/0-baseline/probes/static.mjs <dist-dir> <out-dir> <shots-dir>
// Copies <dist-dir> into <out-dir>/static-{fixture,empty,missing,newer}, writes the fixture data.js
// with web/scripts/fixture-data.mjs, then visits every declared route (library, model, run) with each
// parameter set in web/fixtures, the bare group addresses, #/kit and an unknown address.
// Signal routes are not visited (out of scope). Writes <out>/clickables-static.jsonl,
// <out>/screens-static.json and <out>/net-static.json.
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, collect, explore, launch, newLog, record, settle, shoot, slug } from "./lib.mjs";

const [dist = "web/dist", out = ".", shots = "."] = process.argv.slice(2);
const jsonl = path.join(out, "clickables-static.jsonl");
rmSync(jsonl, { force: true });
const { writeDataFile } = await import(pathToFileURL(path.join(ROOT, "web", "scripts", "fixture-data.mjs")).href);
const { declaredPaths, fillParams } = await import(pathToFileURL(path.join(ROOT, "web", "scripts", "route-paths.mjs")).href);

const folders = {};
for (const variant of ["fixture", "empty", "missing", "newer"]) {
  const folder = path.join(out, `static-${variant}`);
  rmSync(folder, { recursive: true, force: true });
  cpSync(dist, folder, { recursive: true });
  folders[variant] = folder;
}
writeDataFile(folders.fixture);
rmSync(path.join(folders.missing, "data.js"));
const original = readFileSync(path.join(folders.newer, "data.js"), "utf8");
writeFileSync(path.join(folders.newer, "data.js"), original.replace("credit-os-data/1", "credit-os-data/2"));

function sectionFor(hash) {
  const route = hash.replace(/^#/, "");
  if (route.startsWith("/model")) return "S5";
  if (route.startsWith("/run")) return "S6";
  if (route === "/kit") return "S1";
  if (/^\/library\/[^/]+\/[^/]+\/modules/.test(route)) return "S3";
  if (/^\/library\/[^/]+\/[^/]+\/evidence/.test(route)) return "S4";
  if (route === "" || route === "/" || route.startsWith("/library")) return "S2";
  return "S1";
}

const visits = [];
for (const group of ["library", "model", "run"]) {
  const fixture = JSON.parse(readFileSync(path.join(ROOT, "web", "fixtures", `${group}.json`), "utf8"));
  const params = fixture.params ?? {};
  for (const pattern of declaredPaths(path.join(ROOT, "web", "src", "pages", group))) {
    if (pattern === "/…") continue;
    const sets = pattern.includes(":") ? (params[pattern] ?? []) : [{}];
    for (const set of sets.slice(0, 50)) {
      const { hash } = fillParams(pattern, set);
      visits.push({ variant: "fixture", hash: `#${hash}`, screen: pattern, state: Object.keys(set).length ? `fixture ${JSON.stringify(set)}` : "fixture" });
    }
  }
}
for (const bare of ["#/", "#/library", "#/model", "#/run"]) visits.push({ variant: "fixture", hash: bare, screen: `bare address ${bare.slice(1)}`, state: "fixture" });
visits.push({ variant: "fixture", hash: "#/kit", screen: "/kit", state: "fixture" });
visits.push({ variant: "fixture", hash: "#/no-such-page", screen: "unknown address", state: "fixture" });
visits.push({ variant: "fixture", hash: "#/library/no-such-issuer/no-such-run/overview", screen: "/library/:issuer/:run/overview", state: "unknown issuer and run" });
visits.push({ variant: "empty", hash: "", screen: "default address", state: "data.js as built (no issuers)" });
visits.push({ variant: "empty", hash: "#/model", screen: "bare address /model", state: "data.js as built (no issuers)" });
visits.push({ variant: "empty", hash: "#/run", screen: "bare address /run", state: "data.js as built (no issuers)" });
visits.push({ variant: "missing", hash: "", screen: "default address", state: "data.js deleted" });
visits.push({ variant: "newer", hash: "", screen: "default address", state: "data.js schema credit-os-data/2" });

const log = newLog();
const screens = [];
const explorations = [];
const { browser, context } = await launch(log);
const page = await context.newPage();
page.setDefaultTimeout(15000);
try {
  for (const [index, visit] of visits.entries()) {
    if (index >= 1000) break;
    const url = pathToFileURL(path.join(folders[visit.variant], "index.html")).href + visit.hash;
    const address = `${visit.variant === "fixture" ? "" : `[${visit.variant}] `}index.html${visit.hash}`;
    const go = async () => {
      await page.goto("about:blank");
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await settle(page, 500);
    };
    log.current = `${address} [${visit.state}]`;
    await go();
    const section = visit.variant === "missing" || visit.variant === "newer" ? "S1" : sectionFor(visit.hash);
    const sectionOf = (r) => (r.inRail ? "S1" : section);
    const meta = { surface: "static", screen: visit.screen, state: visit.state, address };
    const rows = await collect(page);
    const n = record(jsonl, meta, rows, sectionOf);
    const found = await explore(page, rows, go, { limitPerKind: 25 });
    let revealed = 0;
    for (const item of found.results) {
      revealed += record(jsonl, { ...meta, state: `${visit.state}; after ${item.opener.role} "${item.opener.name || item.opener.text}"` }, item.rows, sectionOf);
      explorations.push({ address, state: visit.state, opener: item.locator, revealed: item.rows.length, error: item.error });
    }
    await go();
    const files = [];
    const name = `static-${visit.variant}-${slug(visit.hash || "default")}`;
    for (const width of [1440, 390]) files.push(await shoot(page, shots, name, width));
    screens.push({ surface: "static", section, screen: visit.screen, state: visit.state, address, elements: n, revealed, skipped: found.skipped, shots: files });
    console.log(`${address} [${visit.state}] ${n} elements, ${revealed} revealed${Object.keys(found.skipped).length ? `, not opened ${JSON.stringify(found.skipped)}` : ""}`);
  }
} catch (error) {
  console.error(`static probe stopped: ${error.stack ?? error}`);
  writeFileSync(path.join(out, "static-error.txt"), String(error.stack ?? error));
  process.exitCode = 1;
} finally {
  writeFileSync(path.join(out, "screens-static.json"), JSON.stringify({ screens, explorations }, null, 1));
  writeFileSync(path.join(out, "net-static.json"), JSON.stringify(log, null, 1));
  await browser.close();
}
