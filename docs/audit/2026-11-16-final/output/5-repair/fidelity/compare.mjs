#!/usr/bin/env node
// Handoff side of stage 5 step 9: compares what capture.mjs recorded on screen with the text each
// screen came from. The rules are in README.md ("Comparison"); this file implements exactly those.
//
//   node compare.mjs <capture-folder> [--out <dir>] [--name <name>] [--repo <root>]
//       reads <capture-folder>/index.json and the screen files, writes <out>/compare-<name>.json
//       and <out>/compare-<name>.md (name = the folder's name, out = this folder)
//   node compare.mjs --diff <compare-before.json> <compare-after.json> [--out <file.md>]
//       what changed between two comparisons (new differences, resolved ones, counts)
//
// Sources: connected screens -> proof/handoffs/*.md (the synthetic run's canned handoffs) plus the
// run request the capture submitted; static screens -> web/fixtures/library.json and model.json.
// No dependencies, no network, deterministic: the same inputs give byte-identical output.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const RULES_VERSION = 1;

// ---------------------------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------------------------

const norm = (s) =>
  String(s ?? "")
    .normalize("NFKC")
    .replace(/−/g, "-")
    .replace(/\*\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
const fold = (s) => norm(s).toLowerCase();
const labelKey = (s) =>
  fold(s)
    .replace(/[^\p{L}\p{N}%$]+/gu, " ")
    .trim();
const lastSegment = (section) => String(section ?? "").split(" > ").at(-1) ?? "";
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

/** A sentence compared: case, spacing and punctuation ignored, except the point and comma inside a number. */
const sentenceKey = (s) =>
  fold(s)
    .replace(/[^\p{L}\p{N}%$.,\s-]/gu, " ")
    .replace(/(?<!\d)[.,]|[.,](?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

let MODULE_NAMES = {};
/** "CP-1" -> "Financial foundation" in text, as the connected pages draw it (api.ts serviceText). */
const plainNames = (text) =>
  String(text ?? "").replace(/\bCP-[A-Z0-9]+\b/g, (code) => MODULE_NAMES[code] ?? code);

const MISSING =
  /^(not supplied\b|not calculated\b|not assessable\b|not established\b|not ranked\b|n\.?a\.?$|not available$|withheld\b|[—–-]$)/i;
const isMissing = (text) => MISSING.test(norm(text));

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};
const pad = (n, width = 2) => String(n).padStart(width, "0");
const MONTH_WORD = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const monthOf = (word) => MONTHS[word.slice(0, 3).toLowerCase()];

/** Period substrings, canonical: YYYY-MM-DD, YYYY-MM, YYYY-Qn, FYYYYY(E|A), YYYY-Hn. */
function takePeriods(text) {
  const periods = new Set();
  let rest = norm(text);
  const rules = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m, y, mo, d) => `${y}-${mo}-${d}`],
    [new RegExp(`\\b(\\d{1,2})\\s+${MONTH_WORD}\\.?\\s+(\\d{4})\\b`, "gi"), (m, d, mo, y) => `${y}-${pad(monthOf(mo))}-${pad(d)}`],
    [new RegExp(`\\b${MONTH_WORD}\\.?\\s+(\\d{4})\\b`, "gi"), (m, mo, y) => `${y}-${pad(monthOf(mo))}`],
    [/\b(\d{4})-Q([1-4])\b/g, (m, y, q) => `${y}-Q${q}`],
    [/\bQ([1-4])\s?(\d{4})\b/g, (m, q, y) => `${y}-Q${q}`],
    [/\bH([12])\s?(\d{4})\b/g, (m, h, y) => `${y}-H${h}`],
    [/\bFY\s?(\d{4})([EA]?)\b/g, (m, y, e) => `FY${y}${e}`],
    [/\b(\d{4})-(\d{2})\b/g, (m, y, mo) => `${y}-${mo}`],
  ];
  for (const [re, canon] of rules) {
    rest = rest.replace(re, (...args) => {
      periods.add(canon(...args));
      return " ";
    });
  }
  return { periods, rest };
}

const CURRENCY = { "us$": "$", usd: "$", $: "$", "£": "£", "€": "€" };
const NUMBER =
  /(?<![\w.])(?<open>\()?(?<sign>[-+])?\s?(?<cur>US\$|USD|\$|£|€)?\s?(?<int>\d{1,3}(?:,\d{3})+|\d+)(?<frac>\.\d+)?(?<close>\))?(?<suf>\s?(?:%|x(?![a-z])|bps?(?![a-z])|pp(?![a-z])|bn(?![a-z])|m(?![a-z])|k(?![a-z])|millions?|billions?|months?|years?|days?))?/gi;

/** Number tokens of a text, after the periods are taken out. sign '-' for a minus or (accounting). */
function takeNumbers(text) {
  const { periods, rest } = takePeriods(text);
  const tokens = [];
  for (const m of rest.matchAll(NUMBER)) {
    const g = m.groups;
    const negative = g.sign === "-" || (g.open && g.close);
    const frac = g.frac ?? "";
    const digits = g.int.replace(/,/g, "");
    let suffix = (g.suf ?? "").trim().toLowerCase();
    suffix = { million: "m", millions: "m", billion: "bn", billions: "bn", bps: "bp" }[suffix] ?? suffix.replace(/s$/, "");
    const currency = g.cur ? (CURRENCY[g.cur.toLowerCase()] ?? g.cur) : "";
    tokens.push({
      raw: m[0].trim(),
      exact: `${negative ? "-" : ""}${digits}${frac}`,
      value: `${negative ? "-" : ""}${digits}${frac.replace(/0+$/, "").replace(/\.$/, "")}`,
      unit: `${currency}${suffix}`,
    });
  }
  return { tokens, periods, rest };
}

/** Canonical unit text: US$m, USD millions, $m -> "$m"; x, %, % NAV kept. */
function canonUnit(unit) {
  const u = fold(unit).replace(/[\s.]/g, "");
  if (!u) return "";
  if (/^(us\$|usd|\$)(m|mn|mm|million|millions)$|^(usd|us\$)millions?$/.test(u)) return "$m";
  if (/^(us\$|usd|\$)$/.test(u)) return "$";
  if (/^(us\$|usd|\$)(bn|billion|billions)$/.test(u)) return "$bn";
  if (/^%/.test(u)) return "%";
  return u.replace(/s$/, "");
}
const unitsAgree = (a, b) => !canonUnit(a) || !canonUnit(b) || canonUnit(a) === canonUnit(b);
const periodsAgree = (a, b) => !a.size || !b.size || [...a].some((p) => b.has(p));

const isZero = (text) => {
  const { tokens } = takeNumbers(text);
  return tokens.length > 0 && tokens.every((t) => /^-?0+(\.0*)?$/.test(t.exact));
};

// ---------------------------------------------------------------------------------------------
// Source: handoffs (connected)
// ---------------------------------------------------------------------------------------------

const tableCells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
const tableKey = (heading) =>
  labelKey(heading.replace(/^Chart data:\s*/i, "").replace(/\s+-\s+Register$/i, ""));

function makeFact(fields) {
  const { tokens, periods } = takeNumbers(fields.text);
  const extra = new Set(fields.periods ?? []);
  for (const p of periods) extra.add(p);
  return { ...fields, tokens, periods: extra, unit: fields.unit ?? "" };
}

function parseHandoff(file, moduleId, repo) {
  const rel = path.relative(repo, file).split(path.sep).join("/");
  const lines = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
  const facts = [];
  const tables = [];
  const blocks = []; // prose blocks and tables in order, for the "should show" check
  let h2 = "";
  let h3 = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const at = i + 1;
    if (/^## /.test(line)) {
      h2 = line.slice(3).trim();
      h3 = "";
    } else if (/^#{3,6} /.test(line)) {
      h3 = line.replace(/^#{3,6} /, "").trim();
    } else if (/^\|/.test(line)) {
      const start = i;
      while (i + 1 < lines.length && /^\|/.test(lines[i + 1])) i++;
      const headers = tableCells(lines[start]);
      const rows = [];
      for (let j = start + 2; j <= i; j++) {
        const cells = tableCells(lines[j]);
        rows.push({ line: j + 1, cells, obj: Object.fromEntries(headers.map((h, k) => [h, cells[k] ?? ""])) });
      }
      const title = h3 || h2;
      const table = { title, key: tableKey(title), h2, h3, line: start + 1, headers, rows, file: rel };
      tables.push(table);
      blocks.push({ type: "table", table, module: moduleId });
      for (const row of rows) {
        const unit = row.obj["Reporting unit"] ?? row.obj.Unit ?? "";
        const basis = row.obj["Basis and limitation"] ?? row.obj.Basis ?? "";
        const rowTokens = new Set(row.cells.flatMap((c) => takeNumbers(c).tokens.map((t) => t.value)));
        headers.forEach((header, k) => {
          const text = row.cells[k] ?? "";
          const periodFromHeader = takePeriods(header).periods;
          const periods = new Set(periodFromHeader);
          if (row.obj.Period) for (const p of takePeriods(row.obj.Period).periods) periods.add(p);
          facts.push(
            makeFact({
              kind: "cell",
              module: moduleId,
              file: rel,
              line: row.line,
              h3,
              tableKey: table.key,
              tableTitle: title,
              rowKey: row.cells[0] ?? "",
              header,
              col: k,
              text,
              periods,
              unit: unit || undefined,
              basis,
              rowTokens,
              rowText: norm(row.cells.join(" | ")),
              loc: `${rel}:${row.line}`,
            }),
          );
        });
      }
    } else if (line.trim()) {
      const bullet = /^\s*[-*]\s+/.test(line);
      const text = line.replace(/^\s*[-*]\s+/, "");
      const isBasis = /^Basis:/i.test(text);
      const prev = blocks.at(-1);
      const block = { type: isBasis ? "basis" : bullet ? "bullet" : "text", text, line: at, h2, h3, module: moduleId, file: rel };
      blocks.push(block);
      if (isBasis && prev) prev.basis = text.replace(/^Basis:\s*/i, "");
      facts.push(makeFact({ kind: isBasis ? "basis" : "line", module: moduleId, file: rel, line: at, h2, h3, rowKey: "", header: "", text, loc: `${rel}:${at}` }));
    }
  }
  return { id: moduleId, file: rel, sha256: sha256(fs.readFileSync(file)), facts, tables, blocks };
}

/** Index of facts for matching: by value, by text and the periods the source carries. */
function makeScope(name, facts) {
  const byValue = new Map();
  const byText = new Map();
  const periods = new Set();
  for (const fact of facts) {
    for (const token of fact.tokens) {
      const list = byValue.get(token.value) ?? [];
      list.push(fact);
      byValue.set(token.value, list);
    }
    const keys = [sentenceKey(plainNames(fact.text))];
    // a cell is also drawn with its column's name before it ("Limitation Illustrative rate shock")
    if (fact.kind === "cell" && fact.header) keys.push(sentenceKey(plainNames(`${fact.header} ${fact.text}`)));
    for (const key of keys) {
      const list = byText.get(key) ?? [];
      list.push(fact);
      byText.set(key, list);
    }
    for (const p of fact.periods) periods.add(p);
  }
  return { name, facts, byValue, byText, periods, cells: facts.filter((f) => f.kind === "cell") };
}

// ---------------------------------------------------------------------------------------------
// Source: fixtures (static)
// ---------------------------------------------------------------------------------------------

const FIXTURE_IGNORED_KEYS = new Set(["trace", "id", "kind", "moduleKind", "href", "evidenceItem", "moduleId", "key", "tone", "state"]);
// keys whose strings are not drawn as text (ids, addresses, tones): left out of the "should show" check only
const LABEL_KEYS = /^(label|measure|title|heading|name|indicator|risk|line|item|term|metric|id|gap|period|operand|facility|instrument)$/i;

/** Every string, number and null leaf under `value`, with its JSON path, the strings beside it, the labels above it and, in a table, its column. */
function leaves(value, base, file, out = [], skip = new Set()) {
  const walk = (node, p, parentKey, siblings, gap, labels, cols, col) => {
    if (typeof node === "string" || typeof node === "number") {
      const text = String(node);
      if (!text.trim()) return;
      out.push({ path: p, key: parentKey, text, siblings, labels, col, missing: gap, isString: typeof node === "string" });
    } else if (node === null) {
      out.push({ path: p, key: parentKey, text: "null", siblings, labels, col, missing: true, isString: false });
    } else if (Array.isArray(node)) {
      node.forEach((item, k) => walk(item, `${p}/${k}`, parentKey, siblings, gap, labels, cols, parentKey === "cells" && cols ? cols[k] : col));
    } else if (typeof node === "object") {
      const own = Object.entries(node).filter(([, v]) => typeof v === "string");
      const mine = own.filter(([k]) => LABEL_KEYS.test(k)).map(([, v]) => ({ t: v, d: 0 }));
      if (Array.isArray(node.cells) && typeof node.cells[0] === "string") mine.push({ t: node.cells[0], d: 0 });
      const here = [...mine, ...labels.map((l) => ({ t: l.t, d: l.d + 1 }))].slice(0, 4);
      const isGap = gap || (typeof node.kind === "string" && /^(gap|withheld|missing|not-assessable)$/.test(node.kind));
      const colsHere = Array.isArray(node.columns) ? node.columns.map((c) => (typeof c === "string" ? c : (c?.label ?? c?.name ?? ""))) : Array.isArray(node.periods) ? node.periods.map(String) : cols;
      for (const [k, v] of Object.entries(node)) {
        if (skip.has(k)) continue;
        walk(v, `${p}/${k}`, k, own, isGap, here, colsHere, k === "cells" ? undefined : col);
      }
    }
  };
  walk(value, base, "", [], false, [], undefined, undefined);
  return out.map((leaf) => ({ ...leaf, file }));
}

function fixtureFacts(object, base, file, skip = new Set()) {
  return leaves(object, base, file, [], skip).map((leaf) => {
    const periods = new Set();
    let unit;
    for (const [k, v] of leaf.siblings) {
      if (/^(period|asOf|at)$/i.test(k)) for (const p of takePeriods(v).periods) periods.add(p);
      if (/^unit$/i.test(k)) unit = v;
    }
    return makeFact({ kind: "leaf", file, line: 0, path: leaf.path, rowKey: leaf.labels[0]?.t ?? "", labels: leaf.labels.map((l) => l.t), labelsD: leaf.labels, header: leaf.key, colLabel: leaf.col ?? "", text: leaf.text, periods, unit, missing: leaf.missing, loc: `${file}#${leaf.path}` });
  });
}

// ---------------------------------------------------------------------------------------------
// The run the connected capture submitted (web/scripts/connected-proof.mjs); not in any handoff
// ---------------------------------------------------------------------------------------------

function runRequestFacts(handoffCount) {
  const file = "web/scripts/connected-proof.mjs";
  const make = (text, line, header, extra = {}) =>
    makeFact({ kind: "run", module: null, file, line, rowKey: header, header, text, loc: `${file}: run request (${header})`, ...extra });
  return [
    make("2025-03-31", 0, "As of", { periods: new Set(["2025-03-31"]) }),
    make("Full credit assessment", 0, "Pathway"),
    make("Northbridge Synthetic Group", 0, "Issuer"),
    make("B1", 0, "Moody's rating"),
    make("Negative", 0, "Outlook"),
    make(String(handoffCount), 0, "Modules"),
    make("3", 0, "Source files"),
  ];
}

// ---------------------------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------------------------

/** One captured figure's value tokens (from its drawn text). */
function figureTokens(figure) {
  return takeNumbers(figure.text);
}

/** Compare a drawn text with a source text. Returns { ok, differs: [] } (kinds below). */
function compareValue(drawn, source) {
  const differs = [];
  const dMissing = isMissing(drawn);
  const sMissing = isMissing(source);
  if (dMissing && sMissing) return { ok: true, differs };
  if (dMissing !== sMissing) {
    if (dMissing && isZero(source)) differs.push("zero drawn as missing");
    else if (dMissing) differs.push("value drawn as missing");
    else if (isZero(drawn)) differs.push("missing drawn as zero");
    else differs.push("missing drawn as a value");
    return { ok: false, differs };
  }
  const d = takeNumbers(drawn);
  const s = takeNumbers(source);
  if (!d.tokens.length && !s.tokens.length) {
    const same = fold(drawn) === fold(plainNames(source)) || fold(drawn) === fold(source);
    if (!same && !periodsAgree(d.periods, s.periods)) differs.push("period");
    else if (!same) differs.push("text");
    return { ok: differs.length === 0, differs };
  }
  const n = Math.max(d.tokens.length, s.tokens.length);
  for (let i = 0; i < n; i++) {
    const a = d.tokens[i];
    const b = s.tokens[i];
    if (!a || !b) {
      differs.push(!a ? "digits missing on screen" : "digits not in source");
      break;
    }
    if (a.value !== b.value) {
      differs.push(a.value.replace("-", "") === b.value.replace("-", "") ? "sign" : "digits");
    } else if (a.exact !== b.exact) differs.push("precision");
    if (a.unit && b.unit && canonUnit(a.unit) !== canonUnit(b.unit)) differs.push("unit");
  }
  if (!periodsAgree(d.periods, s.periods)) differs.push("period");
  return { ok: differs.length === 0, differs: [...new Set(differs)] };
}

// ---------------------------------------------------------------------------------------------
// Capture loading
// ---------------------------------------------------------------------------------------------

function loadCapture(folder) {
  const index = JSON.parse(fs.readFileSync(path.join(folder, "index.json"), "utf8"));
  const screens = [];
  for (const entry of index.screens) {
    const file = path.join(folder, entry.file);
    if (!fs.existsSync(file)) continue;
    const screen = JSON.parse(fs.readFileSync(file, "utf8"));
    screens.push({ entry, screen, surface: entry.file.split("/")[0] });
  }
  return { index, screens };
}

// ---------------------------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------------------------

const MATCH = "matches source";
const DERIVED = "derived";
const NOT_FOUND = "not found in source";
const DIFFERS = "source has it, screen differs";
const CLASSES = [MATCH, DERIVED, NOT_FOUND, DIFFERS];

const done = (cls, fields = {}) => ({ class: cls, differs: [], ...fields });
const matched = (fact, via, fields = {}) =>
  done(MATCH, { via, source: fact ? { loc: fact.loc, text: norm(fact.text).slice(0, 160) } : null, ...fields });
const derived = (name, where, fields = {}) => done(DERIVED, { derived: { name, where }, ...fields });
const differing = (fact, via, differs, fields = {}) =>
  done(DIFFERS, { via, differs, source: fact ? { loc: fact.loc, text: norm(fact.text).slice(0, 160) } : null, ...fields });
const notFound = (note, fields = {}) => done(NOT_FOUND, { note, ...fields });

// ---------------------------------------------------------------------------------------------
// Exact decimal arithmetic for the year-on-year changes (independent of the page and the service)
// ---------------------------------------------------------------------------------------------

function decimalParts(text) {
  const m = /^(-?)(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?$/.exec(norm(text));
  if (!m) return null;
  return { negative: m[1] === "-", digits: m[2].replace(/,/g, "") + (m[3] ?? ""), scale: (m[3] ?? "").length };
}
function exactDifference(current, prior) {
  const a = decimalParts(current);
  const b = decimalParts(prior);
  if (!a || !b) return null;
  const scale = Math.max(a.scale, b.scale);
  const scaled = (p) => (p.negative ? -1n : 1n) * BigInt(p.digits + "0".repeat(scale - p.scale));
  const diff = scaled(a) - scaled(b);
  const magnitude = (diff < 0n ? -diff : diff).toString().padStart(scale + 1, "0");
  const whole = magnitude.slice(0, magnitude.length - scale);
  const text = scale ? `${whole}.${magnitude.slice(magnitude.length - scale)}` : whole;
  return diff < 0n ? `-${text}` : text;
}
const fiscalOrder = (period) => Number(/(\d{4})/.exec(period)?.[1] ?? 0);

// ---------------------------------------------------------------------------------------------
// The connected surface
// ---------------------------------------------------------------------------------------------

const HEADLINE = {
  "net leverage": { table: "leverage", column: "Net debt / EBITDA" },
  "gross leverage": { table: "leverage", column: "Total debt / EBITDA" },
  "interest coverage": { table: "interest cover", column: "EBITDA / cash interest" },
  revenue: { table: "revenue and ebitda", column: "Revenue" },
  "adjusted ebitda": { table: "revenue and ebitda", column: "Adjusted EBITDA" },
  cash: { table: "liquidity", column: "Cash" },
};
const HEADLINE_WHERE =
  "src/deploy_workflow/credit_os_catalogue.py handoff_metrics, prior_metric, _exact_change (latest row of the CP-1 chart table, change against the row a year earlier); web/src/pages/connected/report/YearChange.tsx, HeadlineFigures.tsx";

/** Rows of a handoff chart table, newest period last. */
function chartRows(handoffs, moduleId, key) {
  const table = handoffs.get(moduleId)?.tables.find((t) => t.key === key && /^Chart data:/i.test(t.title));
  if (!table) return null;
  return { table, rows: [...table.rows].sort((a, b) => fiscalOrder(a.obj.Period) - fiscalOrder(b.obj.Period)) };
}

/** The Overview headline card the figure belongs to, checked against the CP-1 chart table. */
function headlineCheck(f, ctx) {
  const spec = HEADLINE[labelKey(f.label ?? "")];
  if (!spec || ctx.page !== "overview" || !["card", "definition"].includes(f.kind)) return null;
  const found = chartRows(ctx.handoffs, "CP-1", spec.table);
  if (!found || !found.rows.length) return null;
  const latest = found.rows.at(-1);
  const prior = found.rows.at(-2);
  const header = found.table.headers.find((h) => labelKey(h) === labelKey(spec.column));
  if (!header) return null;
  const fact = ctx.handoffs.get("CP-1").facts.find((x) => x.kind === "cell" && x.line === latest.line && x.header === header);
  const value = latest.obj[header];
  const unit = latest.obj["Reporting unit"];
  const text = norm(f.text);
  const { tokens, periods } = takeNumbers(text);
  if (/\bvs\b/i.test(text)) {
    const priorFact = prior && ctx.handoffs.get("CP-1").facts.find((x) => x.kind === "cell" && x.line === prior.line && x.header === header);
    const expected = prior && exactDifference(value, prior.obj[header]);
    if (expected === null || !priorFact) return null;
    const drawn = tokens[0];
    const wanted = takePeriods(prior.obj.Period).periods;
    const problems = [];
    const expectedValue = expected.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    if (!drawn || drawn.value !== expectedValue) problems.push(drawn && drawn.value.replace("-", "") === expectedValue.replace("-", "") ? "sign" : "digits");
    else if (drawn.exact !== expected) problems.push("precision");
    if (drawn && drawn.unit && !unitsAgree(drawn.unit, unit)) problems.push("unit");
    if (!periodsAgree(periods, wanted)) problems.push("period");
    const source = { loc: `${priorFact.loc} and ${fact.loc}`, text: `${value} - ${prior.obj[header]} = ${expected}` };
    if (problems.length) return done(DIFFERS, { via: "headline change", differs: problems, source });
    return done(DERIVED, { via: "headline change", source, derived: { name: "year-on-year change = latest period - period a year earlier, exact decimal, recomputed here from the CP-1 chart table", where: HEADLINE_WHERE, verified: true } });
  }
  if (tokens.length) {
    const cmp = compareValue(text, value);
    const problems = [...cmp.differs];
    if (tokens[0].unit && !unitsAgree(tokens[0].unit, unit)) problems.push("unit");
    if (unit && !tokens[0].unit) problems.push("unit missing");
    return problems.length ? differing(fact, "headline value", [...new Set(problems)]) : matched(fact, "headline value (latest period of the CP-1 chart table)");
  }
  if (periods.size) {
    const wanted = takePeriods(latest.obj.Period).periods;
    return periodsAgree(periods, wanted) ? matched(fact, "headline period") : differing(fact, "headline period", ["period"]);
  }
  return null;
}

/** The module's own confidence score, recomputed from its Confidence inputs table. */
function confidenceCheck(f, ctx) {
  if (labelKey(f.label ?? "") !== "confidence score" || !/^\d+$/.test(norm(f.text)) || !ctx.moduleId) return null;
  const table = ctx.handoffs.get(ctx.moduleId)?.tables.find((t) => t.key === "confidence inputs");
  if (!table) return null;
  const input = Object.fromEntries(table.rows.map((r) => [fold(r.cells[0]), r.cells[1]]));
  const weights = { "directly sourced": 1, calculated: 0.9, "assumption-based": 0.5, "analyst inference": 0.4, "weak lineage": 0.3, untraced: 0, conflicting: 0, "insufficient information": 0 };
  const gates = { pass: 1, partial: 0.7, fail: 0 };
  let total = 0;
  let weighted = 0;
  for (const [name, w] of Object.entries(weights)) {
    const count = Number(input[name] ?? 0);
    total += count;
    weighted += w * count;
  }
  const evidence = total ? (weighted / total) * 100 : 0;
  const coverage = (Number(input["fields present"]) / Number(input["fields total"])) * 100;
  const penalty = 40 * Number(input.critical ?? 0) + 15 * Number(input.material ?? 0) + 3 * Number(input.minor ?? 0);
  let capped = Math.max(0, Math.min(100, (0.6 * evidence + 0.4 * coverage) * (gates[fold(input["source gate"])] ?? 0) - penalty));
  if (Number(input.critical)) capped = Math.min(capped, 39);
  else if (Number(input.material)) capped = Math.min(capped, 59);
  const floor = Math.floor(capped);
  const diff = capped - floor;
  const rounded = diff > 0.5 ? floor + 1 : diff < 0.5 ? floor : floor % 2 === 0 ? floor : floor + 1; // half to even, as Python's round
  const where = "src/deploy_workflow/confidence.py score (weights, gate and penalties as documented there), recomputed here from the handoff's Confidence inputs table";
  const source = { loc: `${table.file}:${table.line}`, text: `inputs give ${rounded}` };
  return Number(norm(f.text)) === rounded
    ? derived("confidence score", where, { via: "confidence", source, verified: true })
    : differing(null, "confidence", ["digits"], { source });
}

const FAMILIES = [
  { screen: /^forecast/, name: "forecast model output", where: "src/deploy_workflow/owners/cpos_forecast.py and the model files the service publishes (forecast_exact.json, calculation.json); not in a handoff and not recomputed here" },
  { screen: /^evidence--checks$/, pure: true, name: "script checks", where: "the service's checks over the module handoffs (src/deploy_workflow/owners/cpos_*check*); not a handoff value and not recomputed here" },
  { screen: /^evidence--record$/, pure: true, name: "run record", where: "the service's record of requests, files and spend for the run; not a handoff value" },
  { screen: /^evidence--(summary|gaps|sources|trace)$/, pure: true, name: "run counts and file identities", where: "web/src/pages/connected/report/Evidence.tsx over the run's own record (counts of modules, script checks, source files)" },
  { screen: /^calendar$/, pure: false, name: "calendar counts", where: "web/src/pages/connected/report/Calendar.tsx counts of events by status" },
];

/** Page-computed figures a screen shows that no handoff states, by screen. */
function familyFor(screenId) {
  return FAMILIES.find((fam) => fam.screen.test(screenId));
}

function isAxisTick(f) {
  return f.kind === "chart-text" && !f.attrs && /^-?[\d,]+(\.\d+)?$/.test(norm(f.text));
}

/** Compare a figure with a cell of the handoff table the screen draws it from (same title, row, column). */
function keyedCell(f, scope) {
  if (f.kind !== "cell" || f.label == null || f.column == null) return null;
  const tk = tableKey(lastSegment(f.section));
  const rk = labelKey(f.label);
  const ck = labelKey(f.column);
  const found = scope.cells.filter((c) => c.tableKey === tk && labelKey(c.rowKey) === rk && labelKey(c.header) === ck);
  return found.length ? found : null;
}

/** Chart value labels and marks: find the column (series) of the chart's table and the values it holds. */
function keyedChart(f, scope) {
  if (f.kind !== "chart-text" || !f.attrs || !f.figure) return null;
  const series = f.attrs["data-series"] ?? f.attrs["data-step"];
  if (!series) return null;
  const tk = tableKey(f.figure);
  const group = f.attrs["data-group"];
  const inTable = scope.cells.filter((c) => c.tableKey === tk);
  const column = inTable.filter((c) => labelKey(c.header) === labelKey(series));
  const rowStep = inTable.filter((c) => labelKey(c.rowKey) === labelKey(series) && c.col > 0);
  const cells = column.length ? column : rowStep;
  if (!cells.length) return null;
  return group ? cells.filter((c) => labelKey(c.rowKey) === labelKey(group)) : cells;
}

function sameDigits(drawn, fact) {
  return compareValue(drawn, fact.text);
}

function labelSupport(f, fact) {
  const wanted = labelKey(f.label ?? f.figure ?? "");
  if (!wanted) return false;
  const have = labelKey([fact.rowKey, ...(fact.labels ?? []), fact.header, fact.tableTitle, fact.text].join(" "));
  const row = labelKey(fact.rowKey ?? "");
  return have.includes(wanted) || (row.length > 2 && wanted.includes(row));
}

/** No period or unit conflict between a drawn token and the source item it is found in. */
function conflictFree(f, fig, fact, figPeriods, token) {
  const drawnUnit = token.unit || (f.kind === "cell" ? (f.unit ?? "") : "");
  const sourceUnit = fact.unit || fact.tokens.find((t) => t.value === token.value)?.unit || "";
  return periodsAgree(figPeriods, fact.periods) && unitsAgree(drawnUnit, sourceUnit);
}

/** Value search: every number token of the figure appears, with the same sign, in an item of the scope. */
function valueSearch(f, scope) {
  const fig = figureTokens(f);
  if (!fig.tokens.length) return null;
  const figPeriods = new Set(fig.periods);
  if (f.period && f.kind === "cell") for (const p of takePeriods(f.period).periods) figPeriods.add(p);
  const used = [];
  let precision = false;
  for (const token of fig.tokens) {
    const facts = scope.byValue.get(token.value) ?? [];
    const exact = facts.filter((fact) => fact.tokens.some((t) => t.exact === token.exact));
    const pool = exact.length ? exact : facts;
    if (!exact.length && facts.length) precision = true;
    // a bare small number ("0", "12") is in too many places: it needs the label beside it in the source
    const weak = !token.unit && /^-?\d{1,2}$/.test(token.exact);
    const ok = pool.find((fact) => conflictFree(f, fig, fact, figPeriods, token) && (!weak || labelSupport(f, fact)));
    if (!ok) return { found: false, conflicting: pool[0] ?? null, token, weak };
    used.push(ok);
  }
  const same = used.find((fact) => fig.tokens.every((t) => fact.tokens.some((x) => x.value === t.value)));
  return { found: true, fact: same ?? used[0], oneItem: Boolean(same), precision };
}

/** Sentence-level match: the drawn text equals, sits inside or contains a source line. */
function textSearch(text, scope) {
  const key = sentenceKey(plainNames(text));
  const direct = scope.byText.get(key) ?? scope.byText.get(sentenceKey(text));
  if (direct?.length) return { fact: direct[0], via: "exact text" };
  if (key.length < 12) return null;
  for (const fact of scope.facts) {
    const other = sentenceKey(plainNames(fact.text));
    if (other.length < 12) continue;
    // the drawn text is part of a longer source item, or the source item is nearly all of the drawn text
    if (other.includes(key) || (key.includes(other) && other.length >= 0.8 * key.length)) return { fact, via: "text inside or around a source item" };
  }
  return null;
}

/** A drawn text composed of cells of one handoff row ("Passes at or below 5.0 x"): the words of one cell, and every number from that row. */
function rowComposite(text, scope) {
  const key = sentenceKey(plainNames(text));
  const drawn = takeNumbers(text).tokens;
  if (!drawn.length) return null;
  const found = [];
  for (const fact of scope.cells) {
    const other = sentenceKey(plainNames(fact.text));
    if (other.length >= 8 && !takeNumbers(fact.text).tokens.length && key.includes(other)) found.push({ fact, len: other.length });
  }
  if (!found.length) return null;
  const longest = Math.max(...found.map((x) => x.len));
  const candidates = found.filter((x) => x.len === longest).map((x) => x.fact);
  const whole = candidates.find((fact) => drawn.every((t) => fact.rowTokens.has(t.value)));
  if (whole) return { fact: whole, via: "words of one cell and numbers of the same row" };
  return { fact: candidates[0], differs: ["digits"] };
}

const words = (s) => new Set(sentenceKey(plainNames(s)).split(" ").filter(Boolean));
/** The source item most like a sentence (word overlap >= 0.7), for "source has it, screen differs". */
function nearest(text, scope) {
  const w = words(text);
  if (w.size < 5) return null;
  let best = null;
  for (const fact of scope.facts) {
    const o = words(fact.text);
    if (o.size < 5) continue;
    let common = 0;
    for (const x of w) if (o.has(x)) common++;
    const score = common / (w.size + o.size - common);
    if (score >= 0.7 && (!best || score > best.score)) best = { fact, score };
  }
  return best;
}

const PAGE_WORDS_WITH_DIGITS = [/^SHA-?256$/i, /^Compare with the .+ move$/i, /^n\.a\. means the figure is missing/i];

/** Events of the scope: rows of the handoff tables headed "Events: ..." with their status and the year of the event date. */
function eventRows(ctx) {
  const modules = ctx.moduleId ? [ctx.handoffs.get(ctx.moduleId)] : [...ctx.handoffs.values()];
  return modules.flatMap((h) => h?.tables.filter((t) => /^Events:/i.test(t.title)).flatMap((t) => t.rows.map((r) => ({ status: r.obj.Status ?? "", date: r.obj["Event date"] ?? "", loc: `${t.file}:${r.line}` }))) ?? []);
}

/** "Historical 9", "Scheduled 18": counts of event rows by status; "2025": a year an event falls in. */
function eventCheck(f, ctx) {
  const text = norm(f.text);
  const count = /^(Historical|Scheduled|Scenario) (\d+)$/.exec(text);
  const year = /^(19|20)\d{2}$/.test(text);
  const status = /^(Historical|Scheduled|Scenario)$/.exec(text);
  if (!count && !year && !status) return null;
  const rows = eventRows(ctx);
  if (!rows.length) return null;
  const where = "web/src/pages/connected/visuals/EventLane.tsx and report/Calendar.tsx (events grouped by status and by year of the event date)";
  if (count) {
    const n = rows.filter((r) => fold(r.status).startsWith(fold(count[1]))).length;
    const source = { loc: rows[0].loc.replace(/:\d+$/, ""), text: `${n} event row(s) with status ${count[1]}` };
    return Number(count[2]) === n ? derived("event counts by status, recounted here from the Events tables", where, { source, verified: true }) : differing(null, "event count", ["digits"], { source });
  }
  if (status) {
    const row = rows.find((r) => fold(r.status).startsWith(fold(status[1])));
    return row ? derived("event status word, checked here against the Events tables' Status column", where, { source: { loc: row.loc, text: row.status }, verified: true }) : notFound("no event row has that status");
  }
  const hit = rows.find((r) => r.date.startsWith(text));
  return hit ? derived("event year group, checked here against the Events tables' dates", where, { source: { loc: hit.loc, text: hit.date }, verified: true }) : notFound("no event date falls in that year");
}

const wordCount = (s) => norm(s).split(" ").filter(Boolean).length;

/** First hit in the page's own fixture data, then in the rest of the run (weaker: the item is named). */
function inPageThenRun(ctx, search) {
  const here = search(ctx.scope);
  if (here) return { ...here, wide: false };
  const there = ctx.wide && ctx.wide !== ctx.scope ? search(ctx.wide) : null;
  return there ? { ...there, wide: true } : null;
}

/** A static screen's figure against the fixture: the page's own data first, then the rest of the run. */
function classifyStaticFigure(f, ctx) {
  const text = norm(f.text);
  const fig = figureTokens(f);
  const named = (hit, via) => matched(hit.fact, hit.wide ? `${via} (elsewhere in this run, not in the page's own data)` : via);
  if (isMissing(text)) {
    const exact = inPageThenRun(ctx, (sc) => textSearch(text, sc));
    if (exact) return named(exact, exact.via);
    const any = inPageThenRun(ctx, (sc) => {
      const hits = sc.facts.filter((fact) => fact.missing || isMissing(fact.text));
      const best = hits.find((fact) => labelSupport(f, fact)) ?? hits[0];
      return best ? { fact: best } : null;
    });
    return any ? named(any, "the fixture has a missing value, gap or null here (cell not identified)") : notFound("the fixture states no missing value in this run");
  }
  if (!fig.tokens.length && fig.periods.size) {
    const hit = inPageThenRun(ctx, (sc) => ([...fig.periods].every((p) => sc.periods.has(p)) ? { fact: null } : null));
    return hit ? named(hit, "period appears in the fixture") : notFound("period is in no fixture string of this run");
  }
  const words5 = wordCount(text) >= 5;
  const exact = inPageThenRun(ctx, (sc) => textSearch(text, sc));
  if (exact && !(exact.wide && !words5 && fig.tokens.length && labelledCandidates(f, ctx.scope).length)) return named(exact, exact.via);
  if (words5) {
    const near = inPageThenRun(ctx, (sc) => nearest(text, sc));
    if (near) {
      const cmp = compareValue(text, near.fact.text);
      const numeric = cmp.differs.filter((d) => d !== "text");
      return numeric.length ? differing(near.fact, "nearest sentence", numeric) : named(near, "reworded sentence (digits, signs, units and periods agree)");
    }
    return notFound("no fixture sentence like it");
  }
  // a short value: the fixture items carrying the same label on this page
  const keyed = labelledCandidates(f, ctx.scope);
  if (keyed.length) {
    const results = keyed.map((fact) => ({ fact, cmp: compareValue(text, fact.text) }));
    const hit = results.find((r) => r.cmp.ok);
    if (hit) return matched(hit.fact, "same label in the page's data");
    const first = results.find((r) => r.fact.header === "text" || r.fact.header === "value") ?? results[0];
    return differing(first.fact, "same label in the page's data", first.cmp.differs.length ? first.cmp.differs : ["text"], { sourceAlternatives: keyed.slice(0, 4).map((x) => x.loc) });
  }
  const search = inPageThenRun(ctx, (sc) => {
    const r = valueSearch(f, sc);
    return r?.found ? r : null;
  });
  if (search) return named(search, search.oneItem ? "value in one fixture item" : "values in the fixture (not one item)");
  return notFound(fig.tokens.length ? "value is in no fixture item of this run, and no fixture item on this page carries its label" : "text is in no fixture string of this run");
}

/** The handoff rows whose first cell is the figure's label or its card's heading (a card drawn from a row). */
function labelRows(f, scope) {
  for (const name of [f.label, lastSegment(f.section)]) {
    const lab = labelKey(name ?? "");
    if (!lab || lab.length < 4) continue;
    const rows = scope.cells.filter((c) => c.col === 0 && labelKey(c.rowKey) === lab);
    if (rows.length) return rows;
  }
  return [];
}

/** Numeric, short items of the page's fixture data that sit under the figure's label. */
function labelledCandidates(f, scope) {
  const lab = labelKey(f.label ?? "");
  if (!lab || lab.length < 3) return [];
  // the label sits in the same object as the value, or one object up when the value is a { text } object
  const base = scope.facts.filter((fact) => fact.tokens.length && wordCount(fact.text) <= 4 && (fact.labelsD ?? []).some((l) => labelKey(l.t) === lab && (l.d === 0 || (l.d === 1 && fact.header === "text"))));
  const col = labelKey(f.column ?? "");
  const inColumn = col ? base.filter((fact) => fact.colLabel && labelKey(fact.colLabel) === col) : [];
  return inColumn.length ? inColumn : base;
}

function classifyFigure(f, ctx) {
  const text = norm(f.text);
  const scope = ctx.scope;
  if (PAGE_WORDS_WITH_DIGITS.some((re) => re.test(text))) return derived("page wording with a digit", "a label or legend drawn by the page (algorithm name, comparison label); not a source value");
  if (ctx.surface === "static") return classifyStaticFigure(f, ctx);
  if (ctx.surface === "connected") {
    const events = eventCheck(f, ctx);
    if (events) return events;
    if (/^\d+ designated handoffs/.test(text)) {
      const run = ctx.runScope;
      const counted = figureTokens(f).tokens.every((t) => run.byValue.has(t.value));
      return counted ? matched(run.facts[5], "run request (module and source-file counts)") : differing(run.facts[5], "run request (module and source-file counts)", ["digits"]);
    }
    const fam0 = familyFor(ctx.screenId);
    if (/^[0-9a-f]{64}$/.test(text)) return ctx.hashes?.has(text) ? matched(null, "sha-256 of a file under proof/ (recomputed here)") : derived("digest of a delivered handoff or record", "the service's record; the delivered handoff text (with its request and sources preamble) is not kept in this repository, so the digest is not recomputed");
    if (fam0?.pure) {
      const exact = textSearch(text, scope);
      return exact && exact.via === "exact text" ? matched(exact.fact, exact.via) : derived(fam0.name, fam0.where);
    }
    if (isAxisTick(f)) return derived("chart axis scale", "web/src/pages/connected/visuals/visualData.ts ticks (value-axis ticks at round numbers)");
    const head = headlineCheck(f, ctx) ?? confidenceCheck(f, ctx);
    if (head) return head;
    if (!String(f.section).includes(" > ")) {
      const run = ctx.runScope;
      const direct = run.byText.get(fold(text));
      if (direct) return matched(direct[0], "run request");
      const fig = figureTokens(f);
      if (fig.periods.size && [...fig.periods].every((p) => run.periods.has(p))) return matched(run.facts[0], "run request (as-of date)");
      if (fig.tokens.length && fig.tokens.every((t) => run.byValue.has(t.value)) && /^(modules|source files)$/i.test(f.label ?? "")) return matched(run.byValue.get(fig.tokens[0].value)[0], "run request (count)");
    }
  }
  // 1. the cell of the table the screen draws it from
  const keyed = ctx.surface === "connected" ? (keyedCell(f, scope) ?? keyedChart(f, scope)) : null;
  if (keyed) {
    const results = keyed.map((fact) => ({ fact, cmp: sameDigits(text, fact) }));
    const hit = results.find((r) => r.cmp.ok);
    if (hit) return matched(hit.fact, "same table cell");
    const closest = results[0];
    if (f.kind === "chart-text" && !f.attrs?.["data-group"]) {
      // a value label has no group in its record: it must equal a value of the column
      const any = keyed.find((fact) => compareValue(text, fact.text).ok);
      if (any) return matched(any, "chart value label equals a value of its series");
    }
    return differing(closest.fact, "same table cell", closest.cmp.differs.length ? closest.cmp.differs : ["text"], { sourceAlternatives: keyed.length > 1 ? keyed.map((x) => x.loc).slice(0, 4) : undefined });
  }
  // 2. period-only text (category ticks, "As of", "FY2024")
  const fig = figureTokens(f);
  if (!fig.tokens.length && fig.periods.size && !isMissing(text)) {
    const all = scope.periods;
    if ([...fig.periods].every((p) => all.has(p) || ctx.allPeriods?.has(p))) return matched(null, "period appears in the source");
    const fam = ctx.surface === "connected" ? familyFor(ctx.screenId) : null;
    return fam ? derived(fam.name, fam.where) : notFound("period is in no source item of this scope");
  }
  // 3. a missing marker: the source must state a missing value (a "Not supplied" cell, or in a fixture a null or gap)
  if (isMissing(text)) {
    const exact = textSearch(text, scope);
    if (exact) return matched(exact.fact, exact.via);
    const fam = ctx.surface === "connected" ? familyFor(ctx.screenId) : null;
    if (fam) return derived(fam.name, fam.where);
    const hits = scope.facts.filter((fact) => fact.missing || isMissing(fact.text));
    const near = hits.find((fact) => labelSupport(f, fact)) ?? hits[0];
    return near ? matched(near, "the source has a missing value in this run (cell not identified)") : notFound("the source states no missing value in this scope");
  }
  // 4. text, then values
  const long = words(text).size >= 5;
  const found = textSearch(text, scope);
  if (found) return matched(found.fact, found.via);
  const composed = rowComposite(text, scope);
  if (composed?.differs) return differing({ ...composed.fact, text: composed.fact.rowText }, "words of one cell, numbers not in the same row", composed.differs);
  if (composed) return matched(composed.fact, composed.via);
  if (long) {
    const near = nearest(text, scope);
    if (near) {
      const cmp = compareValue(text, near.fact.text);
      const numeric = cmp.differs.filter((d) => d !== "text");
      return numeric.length ? differing(near.fact, "nearest sentence", numeric) : matched(near.fact, "reworded sentence (digits, signs, units and periods agree)");
    }
  }
  const search = long ? null : valueSearch(f, scope);
  if (search?.found) return matched(search.fact, search.oneItem ? "value in one source item" : "values in the scope (not one item)", search.precision ? { note: "digits found with other decimal places" } : {});
  // 5. page-computed families
  const fam = ctx.surface === "connected" ? familyFor(ctx.screenId) : null;
  if (fam) return derived(fam.name, fam.where);
  const rows = labelRows(f, scope);
  if (rows.length && fig.tokens.length && !rows.some((r) => fig.tokens.every((t) => r.rowTokens.has(t.value)))) {
    const bad = fig.tokens.filter((t) => !rows[0].rowTokens.has(t.value));
    return differing({ ...rows[0], text: rows[0].rowText }, "the row the label names", ["digits"], { note: `${bad.map((t) => t.raw).join(", ")} is not among the numbers of that row` });
  }
  if (search && !search.found && search.weak) return notFound("a bare small number: not matched by value alone, and no source item carries its label");
  if (search && !search.found && search.conflicting) return notFound(`value in the source only with a different period or unit (${search.conflicting.loc})`);
  return notFound(long ? "no source sentence like it" : "value not in the source for this scope");
}

// ---------------------------------------------------------------------------------------------
// Limitations and source lines
// ---------------------------------------------------------------------------------------------

const UI_KINDS = new Set(["heading", "control", "link", "summary", "caption", "term", "select"]);
const PAGE_WORDS = /^(delivered|delivered with gaps|not assessable|show less|show more|on this page|modules in this run|figures and records|bottom line|key findings|statements and records|limitations|hide all details)$/i;

function classifyText(kind, entry, ctx, kindOf) {
  const text = norm(entry.text);
  const scope = ctx.scope;
  const connected = ctx.surface === "connected";
  const search = (fn) => (connected ? fn(scope) : inPageThenRun(ctx, fn));
  if (PAGE_WORDS_WITH_DIGITS.some((re) => re.test(text))) return derived("page wording with a digit", "a label or legend drawn by the page; not a source value");
  if (connected) {
    const events = eventCheck({ text }, ctx);
    if (events) return events;
    const fam0 = familyFor(ctx.screenId);
    if (fam0?.pure) {
      const exact = textSearch(text, scope);
      return exact && exact.via === "exact text" ? matched(exact.fact, exact.via) : derived(fam0.name, fam0.where);
    }
  }
  const found = search((sc) => textSearch(text, sc));
  if (found) return matched(found.fact, found.wide ? `${found.via} (elsewhere in this run)` : found.via);
  const pn = takeNumbers(text);
  if (pn.periods.size && !pn.tokens.length && [...pn.periods].every((p) => scope.periods.has(p) || ctx.allPeriods?.has(p))) return matched(null, "period appears in the source");
  const opened = /^Open source file:\s*(.+)$/i.exec(text);
  const named = opened ? opened[1].trim() : text;
  if (ctx.fileNames?.has(named)) return matched(null, opened ? "Open source file link wording over an uploaded file name" : "uploaded file name");
  if (isMissing(text)) {
    const hit = search((sc) => {
      const fact = sc.facts.find((x) => x.missing || isMissing(x.text));
      return fact ? { fact } : null;
    });
    if (hit) return matched(hit.fact, "the source has a missing value in this run (cell not identified)");
  }
  const outlineKind = kindOf.get(fold(text));
  if (PAGE_WORDS.test(text) || Object.values(MODULE_NAMES).includes(text) || (outlineKind && UI_KINDS.has(outlineKind) && words(text).size < 8)) {
    return derived("page wording", "label drawn by the page (heading, control, state word, module name); not a source sentence");
  }
  const near = search((sc) => nearest(text, sc));
  if (near) return differing(near.fact, "nearest sentence", ["text"]);
  if (kind === "source" && pn.tokens.length) {
    const hit = valueSearch({ text, kind: "text" }, scope);
    if (hit?.found) return matched(hit.fact, "values in the source");
  }
  const fam = connected ? familyFor(ctx.screenId) : null;
  if (fam) return derived(fam.name, fam.where);
  return notFound("no source sentence or file name like it");
}

// ---------------------------------------------------------------------------------------------
// Source drawers
// ---------------------------------------------------------------------------------------------

const collapse = (s) => norm(plainNames(s)).replace(/\s+/g, " ");
const isBasisHeader = (h) => /\b(basis|sources?|evidence)\b/i.test(norm(h)) && !/gate/i.test(h);

/** What the drawer for a handoff line should state, and the basis it should carry. */
function drawerExpectation(h, line) {
  const block = h.blocks.find((b) => b.type !== "table" && b.type !== "basis" && b.line === line);
  if (block) return { statement: collapse(block.text), pairs: null, basis: block.basis ? [collapse(block.basis)] : [], rowCells: [], at: line };
  for (const table of h.tables) {
    if (table.line === line) {
      const basis = [];
      for (const row of table.rows) table.headers.forEach((hd, k) => isBasisHeader(hd) && row.cells[k] && basis.push(collapse(row.cells[k])));
      return { statement: collapse(table.title), pairs: null, basis: [...new Set(basis)], rowCells: table.rows.flatMap((r) => r.cells.filter(Boolean).map(collapse)), at: line };
    }
    const row = table.rows.find((r) => r.line === line);
    if (row) {
      const pairs = table.headers.map((hd, k) => (row.cells[k] ? collapse(`${hd} — ${row.cells[k]}`) : "")).filter(Boolean);
      const basis = table.headers.flatMap((hd, k) => (isBasisHeader(hd) && row.cells[k] ? [collapse(row.cells[k])] : []));
      return { statement: pairs.join(" "), pairs, basis: [...new Set(basis)], rowCells: row.cells.filter(Boolean).map(collapse), at: line };
    }
  }
  return null;
}

/** The statement the drawer drew must be the expected one, or the expected row pairs minus columns the page leaves out. */
function statementAgrees(drawn, expected) {
  const text = collapse(drawn);
  if (text === expected.statement) return true;
  if (!expected.pairs) return false;
  let pos = 0;
  for (const pair of expected.pairs) if (text.startsWith(pair, pos)) pos += pair.length + 1;
  return pos >= text.length;
}

/** Basis: every basis cell of the row is in the drawer, and whatever else the drawer lists is another cell of the row. */
function basisAgrees(drawnItem, expected, rowCells, drawerText) {
  const drawn = collapse(drawnItem ?? "");
  const none = /^Basis was not recorded for this item/i.test(drawn) || drawn === "";
  // no Basis line in the drawer: the row's basis cells may still be stated in the drawer's own statement
  if (drawn === "" && expected.length && expected.every((v) => collapse(drawerText).includes(v))) return true;
  if (!expected.length) {
    if (none) return true;
    let rest = drawn.replace(/^Basis\s*/i, "");
    for (const value of [...rowCells].sort((a, b) => b.length - a.length)) rest = rest.replace(value, " ");
    return rest.trim() === "" ? true : null;
  }
  if (none) return false;
  let rest = drawn.replace(/^Basis\s*/i, "");
  for (const value of [...expected, ...rowCells].sort((a, b) => b.length - a.length)) rest = rest.replace(value, " ");
  return rest.trim() === "" && expected.every((v) => drawn.includes(v));
}

function drawerParts(drawer) {
  const outline = drawer.outline;
  const paragraphs = outline.filter((o) => o.kind === "paragraph");
  const subtitle = /^(.+?) · Handoff line (\d+)$/.exec(norm(paragraphs[0]?.text ?? ""));
  const at = outline.findIndex((o) => norm(o.text) === "The statement");
  const statement = at >= 0 ? outline.slice(at + 1).find((o) => o.kind === "paragraph")?.text : undefined;
  const basis = outline.find((o) => o.kind === "item" && /^Basis\b/.test(norm(o.text)))?.text;
  return { module: subtitle?.[1], line: subtitle ? Number(subtitle[2]) : null, statement, basis };
}

function connectedDrawerItems(screen, ctx, base) {
  const out = [];
  const nameToId = new Map(Object.entries(MODULE_NAMES).map(([id, name]) => [name, id]));
  const drawers = screen.sourceDrawers ?? [];
  const parsed = drawers.map((d) => {
    const parts = drawerParts(d.drawer);
    const id = nameToId.get(parts.module) ?? ctx.moduleId ?? null;
    const h = id ? ctx.handoffs.get(id) : null;
    return { d, parts, id, h };
  });
  // candidates: handoff lines whose expected statement the drawer states
  for (const p of parsed) {
    p.candidates = [];
    if (!p.h || p.parts.statement === undefined) continue;
    const lines = new Set([...p.h.blocks.filter((b) => b.type !== "table" && b.type !== "basis").map((b) => b.line), ...p.h.tables.flatMap((t) => [t.line, ...t.rows.map((r) => r.line)])]);
    for (const line of [...lines].sort((a, b) => a - b)) {
      const expectation = drawerExpectation(p.h, line);
      if (expectation && statementAgrees(p.parts.statement, expectation)) p.candidates.push({ line, expectation, offset: p.parts.line - line });
    }
  }
  // the one offset between a handoff line as the page numbers it and the line in the canned file
  const modes = new Map();
  for (const id of new Set(parsed.map((p) => p.id))) {
    const counts = new Map();
    for (const p of parsed.filter((q) => q.id === id)) for (const c of new Set(p.candidates.map((x) => x.offset))) counts.set(c, (counts.get(c) ?? 0) + 1);
    modes.set(id, [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0]);
  }
  for (const p of parsed) {
    const entry = { ...base, kind: "drawer", view: "drawer", section: norm(p.d.drawer.title), label: norm(p.d.control), text: norm(p.parts.statement ?? "").slice(0, 160) };
    const fam = familyFor(ctx.screenId);
    if (!p.h || p.parts.line === null) {
      const paired = /^changes--paired-run-fixture/.test(ctx.screenId) ? takeNumbers(p.parts.statement ?? "").tokens : [];
      if (paired.length && paired.every((t) => ctx.scope.byValue.has(t.value))) out.push({ ...entry, ...matched(ctx.scope.byValue.get(paired[0].value)[0], "paired-run fixture values (connected-proof.mjs injects them)") });
      else out.push({ ...entry, ...notFound("the drawer names no module handoff line") });
      continue;
    }
    if (!p.candidates.length) {
      const hasNumber = takeNumbers(p.parts.statement ?? "").tokens.length > 0;
      out.push({ ...entry, ...(fam && !hasNumber ? derived(fam.name, fam.where) : notFound(`statement is on no line of ${p.h.file}`, { drawerLine: p.parts.line })) });
      continue;
    }
    const mode = modes.get(p.id);
    const hit = p.candidates.find((c) => c.offset === mode);
    if (!hit) {
      const at = p.candidates[0];
      out.push({ ...entry, ...differing({ loc: `${p.h.file}:${at.line}`, text: at.expectation.statement }, "drawer handoff line", ["source line"], { drawerLine: p.parts.line, note: `the drawer says line ${p.parts.line}; the statement is at ${p.h.file}:${at.line}, and the module's lines are numbered ${mode} higher` }) });
      continue;
    }
    const basisOk = basisAgrees(p.parts.basis, hit.expectation.basis, hit.expectation.rowCells, p.d.drawer.outline.map((o) => o.text).join(" "));
    const fact = { loc: `${p.h.file}:${hit.line}`, text: hit.expectation.statement };
    const extra = { drawerLine: p.parts.line, lineOffset: mode };
    if (basisOk === false) out.push({ ...entry, ...differing(fact, "drawer basis", ["basis"], { ...extra, note: `source basis: ${hit.expectation.basis.join(" | ") || "none"}; drawer: ${collapse(p.parts.basis ?? "none")}` }) });
    else if (basisOk === null) out.push({ ...entry, ...differing(fact, "drawer basis", ["basis not in source"], { ...extra, note: `drawer: ${collapse(p.parts.basis)}; source line has no basis` }) });
    else out.push({ ...entry, ...matched(fact, "drawer statement, line and basis", extra) });
  }
  return out;
}

function staticDrawerItems(screen, ctx, base) {
  const out = [];
  for (const d of screen.sourceDrawers ?? []) {
    const parts = drawerParts(d.drawer);
    const outline = d.drawer.outline;
    const at = outline.findIndex((o) => norm(o.text) === "The statement");
    const statementEntry = at >= 0 ? outline.slice(at + 1).find((o) => o.kind === "paragraph") : null;
    const lines = outline.filter((o) => o.kind === "item" || o === statementEntry);
    for (const line of lines) {
      const entry = { ...base, kind: "drawer", view: "drawer", section: norm(d.drawer.title), label: norm(d.control), text: norm(line.text).slice(0, 160) };
      const found = textSearch(line.text, ctx.wide);
      out.push({ ...entry, ...(found ? matched(found.fact, found.via) : notFound("no fixture string equals or contains it")) });
    }
    void parts;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------------------------

const outlineTexts = (screen) => [...(screen.outline ?? []), ...(screen.chartTableViews ?? []).flatMap((c) => c.outline ?? [])];

function figureEntry(f, base, view) {
  return { ...base, kind: "figure", view, figureKind: f.kind, section: f.section, label: f.label ?? f.figure ?? null, column: f.column ?? null, period: f.period ?? null, unit: f.unit ?? null, basis: f.basis ?? null, text: norm(f.text).slice(0, 200) };
}

function analyseScreen(sc, world) {
  const { entry, screen, surface } = sc;
  const id = entry.id;
  const base = { surface, screen: id };
  let moduleId = /^modules--(CP-[A-Z0-9]+)$/.exec(id)?.[1] ?? null;
  if (id === "modules--default") {
    // the Modules tab opens on one module: the page heading after the issuer name says which
    const names = new Map(Object.entries(MODULE_NAMES).map(([code, name]) => [name, code]));
    moduleId = (screen.page?.headings ?? []).map((h) => names.get(h)).find(Boolean) ?? null;
  }
  const ctx = surface === "connected" ? world.connectedContext(id, moduleId) : world.staticContext(id);
  const kindOf = new Map();
  for (const o of outlineTexts(screen)) {
    const key = fold(o.text);
    if (UI_KINDS.has(o.kind) || !kindOf.has(key)) kindOf.set(key, o.kind);
  }
  const items = [];
  const figures = [...(screen.figures ?? []).map((f) => [f, "page"]), ...(screen.chartTableViews ?? []).flatMap((c) => (c.figures ?? []).map((f) => [f, "chart table view"]))];
  for (const [f, view] of figures) items.push({ ...figureEntry(f, base, view), ...classifyFigure(f, ctx) });
  for (const s of screen.sources ?? []) items.push({ ...base, kind: "source", view: "page", section: s.section, text: norm(s.text).slice(0, 200), ...classifyText("source", s, ctx, kindOf) });
  for (const s of screen.limitations ?? []) items.push({ ...base, kind: "limitation", view: "page", section: s.section, text: norm(s.text).slice(0, 200), ...classifyText("limitation", s, ctx, kindOf) });
  items.push(...(surface === "connected" ? connectedDrawerItems(screen, ctx, base) : staticDrawerItems(screen, ctx, base)));
  return items;
}

// ---------------------------------------------------------------------------------------------
// "Source has it, screen does not": handoff items and fixture strings a screen should show
// ---------------------------------------------------------------------------------------------

const numKey = (s) => fold(plainNames(s)).replace(/(?<=\d),(?=\d{3}\b)/g, "");

function drawnSets(screen) {
  const page = new Set();
  for (const o of outlineTexts(screen)) page.add(numKey(o.text));
  const drawers = new Set();
  for (const d of screen.sourceDrawers ?? []) for (const o of d.drawer.outline ?? []) drawers.add(numKey(o.text));
  return { page, drawers };
}

const PROSE = ["Bottom line", "Key findings", "Contrary evidence and what would change the view", "Limitations"];
const tableKind = (t) => (/^Chart data:/i.test(t.title) ? "chart data" : /Register$/i.test(t.title) ? "register" : /^Events:/i.test(t.title) ? "events" : /^Confidence inputs$/i.test(t.title) ? "confidence inputs" : /^Map:/i.test(t.title) ? "map" : "table");

function connectedOmissions(world) {
  const out = [];
  const screens = world.screens.filter((s) => s.surface === "connected");
  const drawn = new Map(screens.map((s) => [s.entry.id, drawnSets(s.screen)]));
  const shownOn = (text, except) => {
    const key = numKey(text);
    if (key.length < 12) return [];
    return screens.filter((s) => s.entry.id !== except && drawn.get(s.entry.id).page.has(key)).map((s) => s.entry.id).slice(0, 4);
  };
  for (const [moduleId, h] of world.handoffs) {
    const pageId = `modules--${moduleId}`;
    const sets = drawn.get(pageId);
    const rec = (fields) => out.push({ surface: "connected", module: moduleId, screen: pageId, onCapturedScreen: Boolean(sets), ...fields });
    for (const block of h.blocks) {
      if (block.type === "basis") continue;
      if (block.type === "table") {
        const t = block.table;
        const kind = tableKind(t);
        for (const row of t.rows) {
          const cells = row.cells.map((text, k) => ({ text, header: t.headers[k], basis: isBasisHeader(t.headers[k]) })).filter((c) => norm(c.text));
          const onPage = (c) => sets?.page.has(numKey(c.text));
          const inDrawer = (c) => sets?.drawers.has(numKey(c.text));
          const keyCell = cells.find((c) => !c.basis);
          const keyDrawn = keyCell ? onPage(keyCell) : true;
          // a row whose first cell is not drawn is not drawn, whatever small numbers its other cells share with the page
          const missingCells = keyDrawn ? cells.filter((c) => !c.basis && !onPage(c)) : cells.filter((c) => !c.basis);
          const basisLost = cells.filter((c) => c.basis && !onPage(c) && !inDrawer(c));
          if (!missingCells.length && !basisLost.length) continue;
          const rowInDrawer = sets?.drawers.has(numKey(row.cells.filter(Boolean).join(" "))) || sets?.drawers.has(numKey(row.cells.filter(Boolean).join(" \u2014 ")));
          const verdict = !sets ? "screen not captured" : rowInDrawer && !keyDrawn ? "in the source drawer only" : !keyDrawn ? "row not drawn" : missingCells.length ? "some cells not drawn" : "basis not shown";
          rec({ itemKind: `table row (${kind})`, section: t.title, text: norm(row.cells.join(" | ")).slice(0, 200), source: { loc: `${h.file}:${row.line}` }, verdict, cellsNotDrawn: missingCells.map((c) => `${c.header}: ${norm(c.text)}`).slice(0, 8), basisNotShown: basisLost.map((c) => norm(c.text)).slice(0, 4), inDrawerOnly: missingCells.filter(inDrawer).length || undefined, shownOn: shownOn(row.cells[0] ?? "", pageId) });
        }
        continue;
      }
      if (!PROSE.includes(block.h3) && !block.h3) continue;
      const text = block.text;
      if (!norm(text) || /^none\.?$/i.test(norm(text))) continue;
      const key = numKey(text);
      const onPage = sets?.page.has(key);
      const inDrawer = sets?.drawers.has(key);
      const where = shownOn(text, pageId);
      if (onPage) continue;
      rec({ itemKind: PROSE.includes(block.h3) ? `${block.h3} line` : `${block.h3} line (other section)`, section: block.h3, text: norm(text).slice(0, 200), source: { loc: `${h.file}:${block.line}` }, verdict: !sets ? "screen not captured" : inDrawer ? "in the source drawer only" : "not drawn", shownOn: where });
      if (block.basis && !sets?.page.has(numKey(block.basis)) && !sets?.drawers.has(numKey(block.basis))) rec({ itemKind: "Basis line", section: block.h3, text: norm(block.basis).slice(0, 200), source: { loc: `${h.file}:${block.line + 1}` }, verdict: "basis not shown" });
    }
  }
  return out;
}

const STATIC_HIDDEN = new Set([...FIXTURE_IGNORED_KEYS, "number", "reason"]);

function staticOmissions(world) {
  const out = [];
  const screens = new Map(world.screens.filter((s) => s.surface === "static").map((s) => [s.entry.id, s]));
  const blobOf = (id) => {
    const s = screens.get(id);
    if (!s) return null;
    const parts = [...outlineTexts(s.screen).map((o) => numKey(o.text)), ...(s.screen.sourceDrawers ?? []).flatMap((d) => d.drawer.outline.map((o) => numKey(o.text)))];
    return { page: new Set(outlineTexts(s.screen).map((o) => numKey(o.text))), joined: parts.join("\n") };
  };
  for (const issuer of world.library.slice.issuers) {
    for (const run of issuer.runs) {
      const prefix = `library--${issuer.id}--${run.id}`;
      const check = (screenId, object, base, itemKind) => {
        const blob = blobOf(screenId);
        for (const leaf of leaves(object, base, "web/fixtures/library.json", [], STATIC_HIDDEN)) {
          const text = norm(leaf.text);
          if (!leaf.isString || leaf.missing || text.length < 3 || /^[a-z0-9-]+$/.test(text) || /^\d+$/.test(text)) continue;
          const key = numKey(text);
          if (blob?.joined.includes(key)) continue;
          out.push({ surface: "static", screen: screenId, onCapturedScreen: Boolean(blob), itemKind, section: leaf.key, text: text.slice(0, 200), source: { loc: `web/fixtures/library.json#${leaf.path}` }, verdict: blob ? "not drawn" : "screen not captured" });
        }
      };
      if (run.loading) continue;
      check(`${prefix}--overview`, run.overview, `/slice/issuers/${issuer.id}/runs/${run.id}/overview`, "overview");
      run.modules.forEach((m, k) => check(`${prefix}--modules--${m.id}`, m.body, `/slice/issuers/${issuer.id}/runs/${run.id}/modules/${k}/body`, "module body"));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Static scopes
// ---------------------------------------------------------------------------------------------

/** The fixture subtrees a static screen is drawn from (narrow) and the whole run (wide). */
function staticScopeFor(id, library, model, cache) {
  const memo = (key, make) => cache.get(key) ?? (cache.set(key, makeScope(key, make())), cache.get(key));
  const lib = "web/fixtures/library.json";
  const parts = id.split("--");
  const facts = (obj, base, file) => [...fixtureFacts(obj, base, file), ...compositeFacts(obj, base)];
  if (parts[0] === "library") {
    if (parts[1] === "home") {
      const all = memo("library-home", () => facts(library.slice.home, "/slice/home", lib));
      return { narrow: all, wide: all };
    }
    const issuerIndex = library.slice.issuers.findIndex((i) => i.id === parts[1]);
    const issuer = library.slice.issuers[issuerIndex];
    if (parts[2] === "history") {
      const all = memo(`history-${parts[1]}`, () => facts(issuer.history, `/slice/issuers/${issuerIndex}/history`, lib));
      return { narrow: all, wide: all };
    }
    const runIndex = issuer?.runs.findIndex((r) => r.id === parts[2]);
    const run = issuer?.runs[runIndex];
    if (run) {
      const base = `/slice/issuers/${issuerIndex}/runs/${runIndex}`;
      const wide = memo(`${parts[1]}-${parts[2]}`, () => facts(run, base, lib));
      const page = parts[3];
      const sub = (key, obj, path) => memo(`${parts[1]}-${parts[2]}-${key}`, () => [...facts(run.head, `${base}/head`, lib), ...facts(obj, `${base}/${path}`, lib)]);
      if (page === "overview") return { narrow: sub("overview", run.overview, "overview"), wide };
      if (page === "changes") return { narrow: sub("changes", run.changes, "changes"), wide };
      if (page === "modules" && parts[4]) {
        const k = run.modules.findIndex((m) => m.id === parts[4]);
        if (k >= 0) return { narrow: sub(`module-${parts[4]}`, run.modules[k], `modules/${k}`), wide };
      }
      if (page === "modules") return { narrow: sub("modules", run.modules, "modules"), wide };
      if (page === "evidence" && run.evidence?.[parts[4]]) return { narrow: memo(`${parts[1]}-${parts[2]}-evidence-${parts[4]}`, () => [...facts(run.head, `${base}/head`, lib), ...facts(run.evidence[parts[4]], `${base}/evidence/${parts[4]}`, lib), ...facts(run.traces, `${base}/traces`, lib)]), wide };
      return { narrow: wide, wide };
    }
  }
  if (parts[0] === "model") {
    const mod = "web/fixtures/model.json";
    if (parts[1] === "runs") {
      const all = memo("model-runs", () => facts(model.slice, "/slice", mod));
      return { narrow: all, wide: all };
    }
    const runIndex = model.slice.runs.findIndex((r) => r.issuer === parts[1] && r.run === parts[2]);
    if (runIndex >= 0) {
      const run = model.slice.runs[runIndex];
      const base = `/slice/runs/${runIndex}`;
      const wide = memo(`model-${parts[1]}-${parts[2]}`, () => facts(run, base, mod));
      const page = parts[3];
      if (run[page]) return { narrow: memo(`model-${parts[1]}-${parts[2]}-${page}`, () => [...facts(run.header ?? {}, `${base}/header`, mod), ...facts(run[page], `${base}/${page}`, mod)]), wide };
      return { narrow: wide, wide };
    }
  }
  const empty = memo("empty", () => []);
  return { narrow: empty, wide: empty };
}

/** An object drawn as "a b" (label and value, severity and count): every pair of its short string props is a source string too. */
function compositeFacts(object, base) {
  const out = [];
  const walk = (node, p) => {
    if (Array.isArray(node)) node.forEach((x, k) => walk(x, `${p}/${k}`));
    else if (node && typeof node === "object") {
      const own = Object.entries(node).filter(([, v]) => (typeof v === "string" || typeof v === "number") && String(v).length <= 80);
      if (own.length >= 2 && own.length <= 8) {
        for (let i = 0; i < own.length; i++) {
          for (let j = 0; j < own.length; j++) {
            if (i === j) continue;
            const text = `${own[i][1]} ${own[j][1]}`;
            out.push(makeFact({ kind: "leaf", file: "web/fixtures/library.json", line: 0, path: p, rowKey: String(own[0][1]), header: `${own[i][0]} ${own[j][0]}`, text, loc: `web/fixtures/library.json#${p}` }));
          }
        }
        const note = typeof node.note === "string" && typeof node.label === "string" && typeof node.value === "string" ? `${node.label} ${node.value} ${node.note}` : null;
        if (note) out.push(makeFact({ kind: "leaf", file: "web/fixtures/library.json", line: 0, path: p, rowKey: node.label, header: "derivation", text: note, loc: `web/fixtures/library.json#${p}` }));
      }
      if (Array.isArray(node.children)) {
        const flat = (n) => [n?.label, n?.value, n?.note, ...(Array.isArray(n?.children) ? n.children.flatMap(flat) : [])].filter((x) => typeof x === "string" && x);
        out.push(makeFact({ kind: "leaf", file: "web/fixtures/library.json", line: 0, path: p, rowKey: String(node.label ?? ""), header: "derivation tree", text: flat(node).join(" "), loc: `web/fixtures/library.json#${p}` }));
      }
      for (const [k, v] of Object.entries(node)) walk(v, `${p}/${k}`);
    }
  };
  walk(object, base);
  return out;
}

// ---------------------------------------------------------------------------------------------
// The world: sources, scopes, contexts
// ---------------------------------------------------------------------------------------------

function parseModuleNames(repo) {
  const text = fs.readFileSync(path.join(repo, "web/src/pages/connected/api.ts"), "utf8");
  const block = /const MODULE_NAMES[^=]*=\s*\{([\s\S]*?)\};/.exec(text)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/"(CP-[A-Z0-9]+)":\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
}

/** What connected-proof.mjs injects for the two paired-run screens (checkChangesTrace); not a run. */
function pairedFixtureFacts() {
  const file = "web/scripts/connected-proof.mjs";
  const make = (text, header, rowKey, unit, periods) => makeFact({ kind: "run", file, line: 0, rowKey, header, tableTitle: "Debt maturity schedules", text, unit, periods: new Set(periods ?? []), loc: `${file}: checkChangesTrace fixture (${rowKey} ${header})` });
  return [
    make("600", "Earlier", "Net debt", "US$m"),
    make("550", "Current", "Net debt", "US$m"),
    make("-50", "Difference", "Net debt", "US$m"),
    make("0", "prior", "FY2026", "US$m", ["FY2026"]),
    make("500", "current", "FY2026", "US$m", ["FY2026"]),
    make("0.00", "Debt maturing", "FY2026", "US$m", ["FY2026"]),
    make("FY2026", "Period", "FY2026", "", ["FY2026"]),
    make("FY2027", "Period", "FY2027", "", ["FY2027"]),
  ];
}

function buildWorld(repo, screens) {
  MODULE_NAMES = parseModuleNames(repo);
  const dir = path.join(repo, "proof/handoffs");
  const handoffs = new Map();
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const id = name.replace(/\.md$/, "");
    handoffs.set(id, parseHandoff(path.join(dir, name), id, repo));
  }
  const moduleScopes = new Map([...handoffs].map(([id, h]) => [id, makeScope(id, h.facts)]));
  const allFacts = [...handoffs.values()].flatMap((h) => h.facts);
  const allScope = makeScope("all handoffs", allFacts);
  const pairedScope = makeScope("all handoffs and the paired-run fixture", [...allFacts, ...pairedFixtureFacts()]);
  const runScope = makeScope("run request", runRequestFacts(handoffs.size));
  const pairedRunScope = makeScope("run request (paired fixture)", runRequestFacts(handoffs.size + 1));
  const uploads = fs.readdirSync(path.join(repo, "proof")).filter((n) => /^northbridge-/.test(n));
  const fileNames = new Set([...uploads, ...[...allFacts.map((f) => f.text.match(/[\w.-]+\.(?:txt|xlsx|md|pdf)\b/g) ?? [])].flat()]);
  const hashes = new Set(uploads.map((n) => sha256(fs.readFileSync(path.join(repo, "proof", n)))));
  const fixtures = {};
  for (const name of ["library", "model"]) fixtures[name] = JSON.parse(fs.readFileSync(path.join(repo, "web/fixtures", `${name}.json`), "utf8"));
  const cache = new Map();
  return {
    repo,
    screens,
    handoffs,
    fixtures,
    library: fixtures.library,
    model: fixtures.model,
    uploadHashes: hashes,
    connectedContext(screenId, moduleId) {
      const paired = /^changes--paired-run-fixture/.test(screenId);
      return {
        surface: "connected",
        screenId,
        page: screenId.split("--")[0],
        moduleId,
        scope: moduleId ? moduleScopes.get(moduleId) : paired ? pairedScope : allScope,
        runScope: paired ? pairedRunScope : runScope,
        handoffs,
        allPeriods: allScope.periods,
        fileNames,
        hashes,
      };
    },
    staticContext(screenId) {
      const { narrow, wide } = staticScopeFor(screenId, fixtures.library, fixtures.model, cache);
      return { surface: "static", screenId, page: screenId.split("--").at(-1), scope: narrow, wide, fileNames: new Set() };
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Counts, JSON and Markdown
// ---------------------------------------------------------------------------------------------

const countBy = (items, keyOf) => {
  const out = {};
  for (const item of items) {
    const key = keyOf(item);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
};
const zeroed = () => Object.fromEntries(CLASSES.map((c) => [c, 0]));

function summarise(items, omissions, screens) {
  const surfaces = {};
  for (const surface of [...new Set(items.map((i) => i.surface))].sort()) {
    const mine = items.filter((i) => i.surface === surface);
    const byKind = {};
    for (const kind of [...new Set(mine.map((i) => i.kind))].sort()) byKind[kind] = { ...zeroed(), ...countBy(mine.filter((i) => i.kind === kind), (i) => i.class), total: mine.filter((i) => i.kind === kind).length };
    surfaces[surface] = { screens: screens.filter((s) => s.surface === surface).length, items: mine.length, byClass: { ...zeroed(), ...countBy(mine, (i) => i.class) }, byKind, omissions: omissions.filter((o) => o.surface === surface).length };
  }
  const perScreen = screens.map((s) => {
    const mine = items.filter((i) => i.screen === s.entry.id && i.surface === s.surface);
    const c = { ...zeroed(), ...countBy(mine, (i) => i.class) };
    return { surface: s.surface, screen: s.entry.id, items: mine.length, [MATCH]: c[MATCH], [DERIVED]: c[DERIVED], [NOT_FOUND]: c[NOT_FOUND], [DIFFERS]: c[DIFFERS], omitted: omissions.filter((o) => o.screen === s.entry.id && o.surface === s.surface).length };
  });
  return { surfaces, perScreen };
}

function jsonLines(report) {
  const lines = ["{"];
  const keys = Object.keys(report);
  keys.forEach((key, k) => {
    const value = report[key];
    const comma = k < keys.length - 1 ? "," : "";
    if (Array.isArray(value)) {
      lines.push(`  ${JSON.stringify(key)}: [`);
      value.forEach((item, j) => lines.push(`    ${JSON.stringify(item)}${j < value.length - 1 ? "," : ""}`));
      lines.push(`  ]${comma}`);
    } else lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)}${comma}`);
  });
  lines.push("}");
  return lines.join("\n") + "\n";
}

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const row = (...cells) => `| ${cells.map(cell).join(" | ")} |`;

function markdown(report) {
  const out = [];
  const { counts } = report;
  out.push(`# Handoff comparison: ${report.capture.folder}`, "");
  out.push(`Capture tree ${report.capture.tree?.commit?.slice(0, 8) ?? "?"} (${report.capture.tree?.branch ?? "?"}), web/dist ${report.capture.tree?.webDistSha256?.slice(0, 12) ?? "?"}; rules version ${report.rulesVersion}; made by \`compare.mjs\`. Sources: connected screens against \`proof/handoffs/*.md\` and the run request; static screens against \`web/fixtures/library.json\` and \`model.json\`. Rules: README.md, "Comparison".`, "");
  out.push("## Counts per surface and class", "");
  out.push(row("Surface", "Screens", "Items", ...CLASSES, "Source items not on screen"), row("---", "---:", "---:", ...CLASSES.map(() => "---:"), "---:"));
  for (const [surface, c] of Object.entries(counts.surfaces)) out.push(row(surface, c.screens, c.items, ...CLASSES.map((k) => c.byClass[k]), c.omissions));
  const total = counts.total;
  out.push(row("**Total**", total.screens, total.items, ...CLASSES.map((k) => total.byClass[k]), total.omissions), "");
  out.push("## Counts per surface, kind and class", "");
  out.push(row("Surface", "Kind", "Items", ...CLASSES), row("---", "---", "---:", ...CLASSES.map(() => "---:")));
  for (const [surface, c] of Object.entries(counts.surfaces)) for (const [kind, k] of Object.entries(c.byKind)) out.push(row(surface, kind, k.total, ...CLASSES.map((x) => k[x])));
  out.push("", "Kinds: figure = a drawn value (page view or a chart's Table view); source = a source line on screen; limitation = a limitation sentence; drawer = what a source drawer states (statement, handoff line, basis).", "");
  out.push(`## ${DIFFERS} (${report.differences.length})`, "");
  if (!report.differences.length) out.push("None.", "");
  else {
    out.push(row("#", "Screen", "Kind", "Figure (as drawn)", "Where on the screen", "What differs", "Source location", "Source says"), row("---", "---", "---", "---", "---", "---", "---", "---"));
    report.differences.forEach((d, k) => out.push(row(k + 1, d.screen, d.kind, d.text, [d.section ? lastSegment(d.section) : "", d.label, d.column, d.period].filter(Boolean).join(" / "), (d.differs ?? []).join(", "), d.source?.loc ?? "", `${d.source?.text ?? ""}${d.note ? ` (${d.note})` : ""}`)));
    out.push("");
  }
  out.push("## Per screen (screens with a difference, a not-found item or an omitted source item)", "");
  out.push(row("Surface", "Screen", "Items", ...CLASSES, "Omitted"), row("---", "---", "---:", ...CLASSES.map(() => "---:"), "---:"));
  const noisy = report.perScreen.filter((s) => s[DIFFERS] || s[NOT_FOUND] || s.omitted);
  for (const s of noisy) out.push(row(s.surface, s.screen, s.items, ...CLASSES.map((c) => s[c]), s.omitted));
  out.push("", `${report.perScreen.length - noisy.length} further screens have only "${MATCH}" and "${DERIVED}" items and no omitted source item.`, "");
  out.push("## Derived items, by computation", "");
  out.push(row("Surface", "Computation", "Items", "Recomputed here", "Where it is computed"), row("---", "---", "---:", "---", "---"));
  for (const d of report.derivedSummary) out.push(row(d.surface, d.name, d.count, d.verified ? "yes" : "no (named only)", d.where));
  out.push("", "## Source items a screen should show and does not", "");
  const kinds = [...new Set(report.omissionSummary.map((o) => o.itemKind))].sort();
  const places = [...new Set(report.omissionSummary.map((o) => `${o.surface}|${o.where}`))];
  const priority = (kind) => /^(Bottom line|Key findings|Contrary|Limitations)/.test(kind) || /chart data/.test(kind) || kind === "Basis lines";
  const shown = report.omissionSummary.filter((o) => priority(o.itemKind));
  out.push(shown.length ? `Bottom line, Key findings, Contrary evidence, Limitations and chart-data lines or rows missing from their screen: ${shown.reduce((n, o) => n + o.count, 0)} (listed below).` : "Every Bottom line, Key findings, Contrary evidence and Limitations line, and every chart-data row, of every handoff is drawn on its module's screen (none missing).", "");
  out.push(row("Surface", "Module or screen", ...kinds.map((k) => k)), row("---", "---", ...kinds.map(() => "---:")));
  for (const place of places) {
    const [surface, where] = place.split("|");
    out.push(row(surface, where, ...kinds.map((k) => report.omissionSummary.filter((o) => o.surface === surface && o.where === where && o.itemKind === k).reduce((n, o) => n + o.count, 0) || "")));
  }
  out.push("");
  const byVerdict = {};
  for (const o of report.omissionSummary) byVerdict[o.verdict] = (byVerdict[o.verdict] ?? 0) + o.count;
  out.push(`By verdict: ${Object.entries(byVerdict).map(([k, v]) => `${k} ${v}`).join("; ")}. A "table row" is a handoff table row; "row not drawn" means its first cell is on no part of the module's screen, "basis not shown" means the row is drawn but its Basis or Source cell is neither drawn nor in a source drawer.`, "");
  if (shown.length) {
    for (const o of report.omissions.filter((x) => priority(omitCategory(x)))) out.push(`- ${o.surface === "connected" ? o.module : o.screen}, ${o.itemKind}, ${o.source?.loc}: ${o.text} (${o.verdict})`);
    out.push("");
  }
  out.push("The full list, with source location, the cells not drawn and where else the text is drawn, is `omissions` in the JSON file.", "");
  out.push(`Not verified: see README.md, "Comparison", end of section.`, "");
  return out.join("\n");
}

/** Moves each derived item's long "where" text into one table, so the item records stay short. */
function compactDerived(items) {
  const where = new Map();
  for (const item of items) {
    if (item.class !== DERIVED) continue;
    where.set(item.derived.name, item.derived.where);
    const verified = Boolean(item.derived.verified ?? item.verified);
    delete item.verified;
    item.derived = verified ? { name: item.derived.name, verified: true } : { name: item.derived.name };
  }
  return where;
}

function derivedSummary(items, where) {
  const map = new Map();
  for (const i of items.filter((x) => x.class === DERIVED)) {
    const key = `${i.surface}|${i.derived.name}`;
    const cur = map.get(key) ?? { surface: i.surface, name: i.derived.name, count: 0, verified: true, where: where.get(i.derived.name) };
    cur.count++;
    cur.verified = cur.verified && Boolean(i.derived.verified);
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.surface.localeCompare(b.surface) || b.count - a.count || a.name.localeCompare(b.name));
}

/** The short category an omitted item is counted under. */
function omitCategory(o) {
  const k = o.itemKind;
  const prose = /^(Bottom line|Key findings|Contrary evidence and what would change the view|Limitations) line$/.exec(k);
  if (prose) return `${prose[1].split(" ").slice(0, 2).join(" ").replace(/ and$/, "")} lines`;
  if (/^Basis line/.test(k)) return "Basis lines";
  if (/line \(other section\)$/.test(k)) return "other prose lines";
  const table = /^table row \((.+)\)$/.exec(k);
  if (table) return `${table[1]} rows`;
  return k;
}

function omissionSummary(omissions) {
  const map = new Map();
  for (const o of omissions) {
    const where = o.surface === "connected" ? o.module : o.screen;
    const category = omitCategory(o);
    const key = `${o.surface}|${where}|${category}|${o.verdict}`;
    map.set(key, { surface: o.surface, where, itemKind: category, verdict: o.verdict, count: (map.get(key)?.count ?? 0) + 1 });
  }
  return [...map.values()];
}

// ---------------------------------------------------------------------------------------------
// Diff mode
// ---------------------------------------------------------------------------------------------

function keyed(list, keyOf) {
  const seen = new Map();
  const out = new Map();
  for (const item of list) {
    const base = keyOf(item);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.set(`${base}#${n}`, item);
  }
  return out;
}
const itemKey = (i) => [i.screen, i.kind, i.view, i.section, i.label ?? "", i.column ?? "", i.text].join("|");
const omissionKey = (o) => [o.screen, o.source?.loc ?? "", o.itemKind].join("|");

function diffReports(before, after) {
  const out = [];
  const b = keyed(before.items, itemKey);
  const a = keyed(after.items, itemKey);
  const classOf = (m, k) => m.get(k)?.class;
  const newDiff = [...a].filter(([k, v]) => v.class === DIFFERS && classOf(b, k) !== DIFFERS);
  const goneDiff = [...b].filter(([k, v]) => v.class === DIFFERS && classOf(a, k) !== DIFFERS);
  const bo = keyed(before.omissions, omissionKey);
  const ao = keyed(after.omissions, omissionKey);
  const newNotFound = [...a].filter(([k, v]) => v.class === NOT_FOUND && classOf(b, k) !== NOT_FOUND);
  const newOmit = [...ao].filter(([k]) => !bo.has(k));
  const goneOmit = [...bo].filter(([k]) => !ao.has(k));
  const screensB = new Set(before.perScreen.map((s) => `${s.surface}/${s.screen}`));
  const screensA = new Set(after.perScreen.map((s) => `${s.surface}/${s.screen}`));
  out.push(`# Comparison diff: ${before.capture.folder} -> ${after.capture.folder}`, "");
  out.push(`Before: tree ${before.capture.tree?.commit?.slice(0, 8) ?? "?"}, web/dist ${before.capture.tree?.webDistSha256?.slice(0, 12) ?? "?"}. After: tree ${after.capture.tree?.commit?.slice(0, 8) ?? "?"}, web/dist ${after.capture.tree?.webDistSha256?.slice(0, 12) ?? "?"}.`, "");
  if (JSON.stringify(before.sources) !== JSON.stringify(after.sources)) out.push("The sources differ between the two comparisons (handoffs or fixtures changed); read every difference against that.", "");
  out.push("## Counts", "", row("Surface", "Class", "Before", "After", "Change"), row("---", "---", "---:", "---:", "---:"));
  for (const surface of [...new Set([...Object.keys(before.counts.surfaces), ...Object.keys(after.counts.surfaces)])].sort()) {
    for (const cls of CLASSES) {
      const x = before.counts.surfaces[surface]?.byClass[cls] ?? 0;
      const y = after.counts.surfaces[surface]?.byClass[cls] ?? 0;
      out.push(row(surface, cls, x, y, y - x > 0 ? `+${y - x}` : y - x));
    }
    const ox = before.counts.surfaces[surface]?.omissions ?? 0;
    const oy = after.counts.surfaces[surface]?.omissions ?? 0;
    out.push(row(surface, "source items not on screen", ox, oy, oy - ox > 0 ? `+${oy - ox}` : oy - ox));
  }
  const grew = newDiff.length > 0 || newOmit.length > 0;
  out.push("", `## Verdict`, "", grew ? `GREW: ${newDiff.length} new "${DIFFERS}" item(s) and ${newOmit.length} new omitted source item(s). Each is listed below and must be explained or repaired.` : `No new "${DIFFERS}" item and no new omitted source item.`, "");
  out.push(`Review: ${newNotFound.length} new "${NOT_FOUND}" item(s) (the screen shows something the source does not have; not counted as growth, but read each).`, "");
  const list = (title, entries, fields) => {
    out.push(`## ${title} (${entries.length})`, "");
    if (!entries.length) out.push("None.", "");
    else {
      out.push(row(...fields.map((f) => f[0])), row(...fields.map(() => "---")));
      for (const [, v] of entries) out.push(row(...fields.map((f) => f[1](v))));
      out.push("");
    }
  };
  const itemFields = [["Screen", (v) => v.screen], ["Kind", (v) => v.kind], ["As drawn", (v) => v.text], ["Where", (v) => [v.section ? lastSegment(v.section) : "", v.label, v.column].filter(Boolean).join(" / ")], ["What differs", (v) => (v.differs ?? []).join(", ")], ["Source", (v) => `${v.source?.loc ?? ""} ${v.source?.text ?? ""}`]];
  list(`New "${DIFFERS}" items (in the after, not in the before)`, newDiff, itemFields);
  list(`New "${NOT_FOUND}" items`, newNotFound, [...itemFields.slice(0, 4), ["Why", (v) => v.note ?? ""]]);
  list(`"${DIFFERS}" items that are gone (resolved, or the drawn text changed so the item has a new identity)`, goneDiff, itemFields);
  const omitFields = [["Screen", (v) => v.screen], ["Item", (v) => `${v.itemKind}: ${v.text}`], ["Source", (v) => v.source?.loc ?? ""], ["Verdict", (v) => v.verdict]];
  list("Source items newly not on screen", newOmit, omitFields);
  list("Source items no longer missing", goneOmit, omitFields);
  const moved = [];
  for (const [k, v] of a) {
    const was = classOf(b, k);
    if (was && was !== v.class && v.class !== DIFFERS && was !== DIFFERS) moved.push([k, { ...v, was }]);
  }
  list("Items whose class changed (other than into or out of the difference class)", moved, [["Screen", (v) => v.screen], ["As drawn", (v) => v.text], ["Was", (v) => v.was], ["Now", (v) => v.class]]);
  out.push("## Screens", "");
  out.push(`In the before only: ${[...screensB].filter((s) => !screensA.has(s)).join(", ") || "none"}.`, "");
  out.push(`In the after only: ${[...screensA].filter((s) => !screensB.has(s)).join(", ") || "none"}.`, "");
  const bs = new Map(before.perScreen.map((s) => [`${s.surface}/${s.screen}`, s]));
  const rows = [];
  for (const s of after.perScreen) {
    const was = bs.get(`${s.surface}/${s.screen}`);
    if (!was) continue;
    const delta = (c) => s[c] - was[c];
    if (delta(DIFFERS) || delta(NOT_FOUND) || s.omitted - was.omitted) rows.push(row(s.surface, s.screen, `${was[DIFFERS]} -> ${s[DIFFERS]}`, `${was[NOT_FOUND]} -> ${s[NOT_FOUND]}`, `${was.omitted} -> ${s.omitted}`));
  }
  out.push("", "Screens whose differences, not-found items or omitted source items changed:", "");
  if (rows.length) out.push(row("Surface", "Screen", DIFFERS, NOT_FOUND, "Omitted"), row("---", "---", "---", "---", "---"), ...rows);
  else out.push("None.");
  out.push("");
  return { text: out.join("\n"), grew };
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--diff") args.diff = true;
    else if (a === "--out" || a === "--name" || a === "--repo") args[a.slice(2)] = argv[++i];
    else args.positional.push(a);
  }
  return args;
}

function findRepo(explicit) {
  if (explicit) return path.resolve(explicit);
  let dir = HERE;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "proof/handoffs")) && fs.existsSync(path.join(dir, "web/fixtures"))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error("cannot find the repository root (proof/handoffs and web/fixtures); pass --repo");
}

function compareCapture(folder, repo) {
  const capture = loadCapture(folder);
  const world = buildWorld(repo, capture.screens.sort((x, y) => x.surface.localeCompare(y.surface) || x.entry.id.localeCompare(y.entry.id)));
  const items = world.screens.flatMap((sc) => analyseScreen(sc, world));
  for (const item of items) if (!CLASSES.includes(item.class)) throw new Error(`unclassified item on ${item.screen}: ${item.text}`);
  const derivedWhere = compactDerived(items);
  const surfaces = new Set(world.screens.map((s) => s.surface));
  const omissions = [...(surfaces.has("connected") ? connectedOmissions(world) : []), ...(surfaces.has("static") ? staticOmissions(world) : [])];
  const summary = summarise(items, omissions, world.screens);
  const total = { screens: world.screens.length, items: items.length, byClass: { ...zeroed(), ...countBy(items, (i) => i.class) }, omissions: omissions.length };
  const rel = (p) => path.relative(repo, p).split(path.sep).join("/");
  const sources = {
    handoffs: Object.fromEntries([...world.handoffs].map(([id, h]) => [id, { file: h.file, sha256: h.sha256 }])),
    fixtures: Object.fromEntries(["library", "model"].map((n) => [`${n}.json`, sha256(fs.readFileSync(path.join(repo, "web/fixtures", `${n}.json`)))])),
    apiModuleNames: sha256(fs.readFileSync(path.join(repo, "web/src/pages/connected/api.ts"))),
  };
  return {
    tool: "compare.mjs",
    rulesVersion: RULES_VERSION,
    capture: { folder: path.basename(path.resolve(folder)), tree: capture.index.tree ?? null, screens: world.screens.length, tool: capture.index.tool },
    sources,
    counts: { total, surfaces: summary.surfaces },
    perScreen: summary.perScreen,
    derivedSummary: derivedSummary(items, derivedWhere),
    omissionSummary: omissionSummary(omissions),
    differences: items.filter((i) => i.class === DIFFERS),
    omissions,
    items,
    _folder: rel(path.resolve(folder)),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.diff) {
    const [beforeFile, afterFile] = args.positional;
    if (!beforeFile || !afterFile) throw new Error("usage: node compare.mjs --diff <compare-before.json> <compare-after.json> [--out <file.md>]");
    const { text, grew } = diffReports(JSON.parse(fs.readFileSync(beforeFile, "utf8")), JSON.parse(fs.readFileSync(afterFile, "utf8")));
    if (args.out) fs.writeFileSync(args.out, text);
    else process.stdout.write(text);
    process.exitCode = grew ? 1 : 0;
    return;
  }
  const [folder] = args.positional;
  if (!folder) throw new Error("usage: node compare.mjs <capture-folder> [--out <dir>] [--name <name>] [--repo <root>]");
  const repo = findRepo(args.repo);
  const report = compareCapture(path.resolve(folder), repo);
  delete report._folder;
  const name = args.name ?? path.basename(path.resolve(folder));
  const outDir = path.resolve(args.out ?? HERE);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `compare-${name}.json`), jsonLines(report));
  fs.writeFileSync(path.join(outDir, `compare-${name}.md`), markdown(report));
  const t = report.counts.total;
  console.log(`${name}: ${t.screens} screens, ${t.items} items; ${CLASSES.map((c) => `${c}: ${t.byClass[c]}`).join("; ")}; source items not on screen: ${t.omissions}`);
}

try {
  main();
} catch (error) {
  console.error(`compare.mjs: ${error.message}`);
  process.exitCode = 2;
}
