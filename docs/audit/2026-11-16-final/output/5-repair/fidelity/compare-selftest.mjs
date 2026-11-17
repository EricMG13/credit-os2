#!/usr/bin/env node
// Self-test for compare.mjs: copies before/ to a temporary folder, changes the copy in known ways (a digit, a
// sign, a unit, a period, a missing value drawn as zero and the reverse, a reworded sentence, a drawer's handoff
// line and basis, on both surfaces), runs compare.mjs on the copy and fails unless every change is reported.
// Usage: node compare-selftest.mjs        (about 5 seconds; writes only under the system temp folder)
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HERE = import.meta.dirname;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "compare-selftest-"));
const capture = path.join(temp, "mutated");
fs.cpSync(path.join(HERE, "before"), capture, { recursive: true });

const read = (file) => JSON.parse(fs.readFileSync(path.join(capture, file), "utf8"));
const write = (file, value) => fs.writeFileSync(path.join(capture, file), JSON.stringify(value));

const CONNECTED = "connected/";
const STATIC = "static/";
const checks = [];

/** Change the first figure (or chart-table-view figure) of `file` that `pick` accepts to `text`. */
function figure(file, pick, text, expect, { view } = {}) {
  const screen = read(file);
  const list = view === undefined ? screen.figures : screen.chartTableViews[screen.chartTableViews.findIndex((v) => v.figure === view)].figures;
  const hit = list.find(pick);
  if (!hit) throw new Error(`self-test setup: no figure in ${file} for "${text}"`);
  const was = hit.text;
  hit.text = text;
  write(file, screen);
  checks.push({ what: `${file}: "${was}" -> "${text}"`, text, expect });
}

function entry(file, key, pick, change, text, expect, { last = false } = {}) {
  const screen = read(file);
  const hit = last ? screen[key].findLast(pick) : screen[key].find(pick);
  if (!hit) throw new Error(`self-test setup: no ${key} entry in ${file} for "${text}"`);
  change(hit);
  write(file, screen);
  checks.push({ what: `${file}: ${key} -> "${text}"`, text, expect, drawer: key === "sourceDrawers" ? hit.control : undefined, screen: path.basename(file, ".json") });
}

const cell = (text, column) => (x) => x.kind === "cell" && x.text === text && (column === undefined || x.column === column);
const card = (text) => (x) => x.text === text;

// connected: digits, sign, precision, unit, period, missing versus zero
figure(`${CONNECTED}modules-cp-1.json`, cell("1500", "Gross debt"), "1050", ["digits"]);
figure(`${CONNECTED}modules-cp-1.json`, cell("3.75"), "3.57", ["digits"], { view: "Leverage" });
figure(`${CONNECTED}modules-cp-1.json`, cell("275", "Cash"), "-275", ["sign"]);
figure(`${CONNECTED}modules-cp-1.json`, cell("1125"), "1125.0", ["precision"]);
figure(`${CONNECTED}modules-cp-1.json`, cell("1400", "Carrying value"), "n.a.", ["value drawn as missing"]);
figure(`${CONNECTED}modules-cp-1.json`, (x) => x.text.startsWith("Not supplied: the schedule"), "0", ["missing drawn as zero"], { view: "Debt maturities" });
figure(`${CONNECTED}modules-cp-1.json`, (x) => x.kind === "chart-text" && x.text === "1,250" && x.attrs?.["data-label"] !== undefined, "1,520", ["digits"]);
figure(`${CONNECTED}overview.json`, card("2.25x"), "2.52x", ["digits"]);
figure(`${CONNECTED}overview.json`, card("-0.75x vs FY2023"), "0.75x vs FY2023", ["sign"]);
figure(`${CONNECTED}overview.json`, card("$2,250m"), "2,250", ["unit missing"]);
figure(`${CONNECTED}overview.json`, card("$275m"), "$275bn", ["unit"]);
figure(`${CONNECTED}overview.json`, card("4.00x"), "4.0x", ["precision"]);
figure(`${CONNECTED}overview.json`, (x) => x.text === "FY2024" && x.kind === "card", "FY2023", ["period"]);
figure(`${CONNECTED}modules-cp-3.json`, (x) => x.text.startsWith("$93.80;"), "$93.08; yield 7.0100%, 7.01% rounded", ["digits"]);
figure(`${CONNECTED}modules-cp-6.json`, (x) => x.kind === "card" && x.text === "2.37%", "2.73%", ["digits"]);
figure(`${CONNECTED}modules-cp-2.json`, (x) => x.text.startsWith("The synthetic issuer's cover is thin at 3.1x"), "The synthetic issuer's cover is thin at 3.7x.", ["digits"]);
figure(`${CONNECTED}modules-cp-3c.json`, (x) => /^Scheduled \d+$/.test(x.text), "Scheduled 9", ["digits"]);
figure(`${CONNECTED}modules-cp-1.json`, (x) => x.label === "Confidence score" && x.text === "89", "88", ["digits"]);
entry(`${CONNECTED}modules-cp-3c.json`, "limitations", (l) => l.text.startsWith("Synthetic data only in the cp three c"), (l) => (l.text = "Synthetic data only in the cp three d case, so no conclusion carries weight."), "Synthetic data only in the cp three d case, so no conclusion carries weight.", ["text"]);
entry(`${CONNECTED}modules-cp-1.json`, "sourceDrawers", (d) => d.drawer.outline.some((o) => o.kind === "paragraph" && /Handoff line \d+$/.test(o.text) && /^Chart data|^Period/.test(d.drawer.outline.find((p) => p.kind === "paragraph" && p !== o)?.text ?? "")), (d) => {
  const o = d.drawer.outline.find((p) => p.kind === "paragraph" && /Handoff line \d+$/.test(p.text));
  o.text = o.text.replace(/\d+$/, (n) => String(Number(n) + 3));
}, "Handoff line +3", ["source line"]);
entry(`${CONNECTED}modules-cp-1.json`, "sourceDrawers", (d) => d.drawer.outline.some((o) => o.text === "Basis Synthetic."), (d) => {
  d.drawer.outline.find((o) => o.text === "Basis Synthetic.").text = "Basis Synthetic p.9";
}, "Basis Synthetic p.9", ["basis"], { last: true });

// static: digits, sign, a sentence, a table cell
const overview = `${STATIC}library-halden-aerostructures-2026-09-30-overview.json`;
figure(overview, (x) => x.text === "4.6x" && x.label === "Net leverage", "4.9x", ["digits"]);
figure(overview, (x) => x.text === "23.1%", "21.3%", ["digits"]);
entry(overview, "limitations", (l) => l.text.includes("five-year trends start in 2023"), (l) => (l.text = l.text.replace("2023", "2024")), "EBITDA for 2022 is not available on the current basis, so five-year trends start in 2024.", ["text"]);
const capital = `${STATIC}library-halden-aerostructures-2026-09-30-modules-capital-structure.json`;
figure(capital, cell("USD 1,150m"), "USD 1,510m", ["digits"]);
figure(capital, cell("USD 600m"), "-USD 600m", ["sign"]);

const run = spawnSync(process.execPath, [path.join(HERE, "compare.mjs"), capture, "--out", temp, "--name", "mutated"], { encoding: "utf8" });
if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  process.exit(2);
}
const report = JSON.parse(fs.readFileSync(path.join(temp, "compare-mutated.json"), "utf8"));
const reported = report.items.filter((i) => i.class === "source has it, screen differs");
let failed = 0;
for (const check of checks) {
  const hit = check.drawer === undefined ? reported.find((i) => i.text === check.text) : reported.find((i) => i.kind === "drawer" && i.label === check.drawer);
  const ok = hit && check.expect.every((d) => hit.differs.includes(d));
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${check.what}${hit ? ` -> ${hit.differs.join(", ")}` : " -> not reported as a difference"}`);
}
const baseline = JSON.parse(fs.readFileSync(path.join(HERE, "compare-before.json"), "utf8"));
const wanted = baseline.differences.length + checks.length;
console.log(`${checks.length} changes, ${checks.length - failed} reported; differences ${baseline.differences.length} in the baseline, ${reported.length} in the changed copy (expected at most ${wanted + 2})`);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
