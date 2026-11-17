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

let MODULE_NAMES = {};
/** "CP-1" -> "Financial foundation" in text, as the connected pages draw it (api.ts serviceText). */
const plainNames = (text) =>
  String(text ?? "").replace(/\bCP-[A-Z0-9]+\b/g, (code) => MODULE_NAMES[code] ?? code);

const MISSING =
  /^(not supplied\b|not calculated\b|not assessable\b|n\.?a\.?$|not available$|withheld\b|[—–-]$)/i;
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
  return { ...fields, tokens, periods: extra, unit: fields.unit ?? tokens[0]?.unit ?? "" };
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
    } else if (/^### /.test(line)) {
      h3 = line.slice(4).trim();
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
    const key = fold(plainNames(fact.text));
    const list = byText.get(key) ?? [];
    list.push(fact);
    byText.set(key, list);
    for (const p of fact.periods) periods.add(p);
  }
  return { name, facts, byValue, byText, periods, cells: facts.filter((f) => f.kind === "cell") };
}

// ---------------------------------------------------------------------------------------------
// Source: fixtures (static)
// ---------------------------------------------------------------------------------------------

const FIXTURE_IGNORED_KEYS = new Set(["trace", "id", "kind", "moduleKind", "href", "evidenceItem", "moduleId", "key", "tone", "state"]);

/** Every string and number leaf under `value`, with its JSON path and the strings beside it. */
function leaves(value, base, file, out = [], skip = FIXTURE_IGNORED_KEYS) {
  const walk = (node, p, parentKey, siblings) => {
    if (typeof node === "string" || typeof node === "number") {
      const text = String(node);
      if (!text.trim()) return;
      out.push({ path: p, key: parentKey, text, siblings });
    } else if (Array.isArray(node)) {
      node.forEach((item, k) => walk(item, `${p}/${k}`, parentKey, siblings));
    } else if (node && typeof node === "object") {
      const own = Object.entries(node)
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v]);
      for (const [k, v] of Object.entries(node)) {
        if (skip.has(k)) continue;
        walk(v, `${p}/${k}`, k, own);
      }
    }
  };
  walk(value, base, "", []);
  return out.map((leaf) => ({ ...leaf, file }));
}

function fixtureFacts(object, base, file, ignored) {
  const rows = leaves(object, base, file, [], ignored);
  return rows.map((leaf) => {
    const periodsFromSiblings = new Set();
    let unit;
    for (const [k, v] of leaf.siblings) {
      if (/^(period|asOf|at)$/i.test(k)) for (const p of takePeriods(v).periods) periodsFromSiblings.add(p);
      if (/^unit$/i.test(k)) unit = v;
    }
    const rowKey = leaf.siblings.find(([k]) => /^(label|measure|title|heading|name|indicator|risk|line|item|term)$/i.test(k))?.[1] ?? "";
    return makeFact({
      kind: "leaf",
      file,
      line: 0,
      path: leaf.path,
      rowKey,
      header: leaf.key,
      text: leaf.text,
      periods: periodsFromSiblings,
      unit,
      loc: `${file}#${leaf.path}`,
    });
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
    if (!drawn || drawn.value !== expected) problems.push(drawn && drawn.value.replace("-", "") === expected.replace("-", "") ? "sign" : "digits");
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
  { screen: /^evidence--checks$/, name: "script checks", where: "the service's checks over the module handoffs (src/deploy_workflow/owners/cpos_*check*); not a handoff value and not recomputed here" },
  { screen: /^evidence--record$/, name: "run record", where: "the service's record of requests, files and spend for the run; not a handoff value" },
  { screen: /^evidence--(summary|gaps|sources|trace)$/, name: "run counts and file identities", where: "web/src/pages/connected/report/Evidence.tsx over the run's own record (counts of modules, script checks, source files)" },
  { screen: /^calendar$/, name: "calendar counts", where: "web/src/pages/connected/report/Calendar.tsx counts of events by status" },
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

function conflictFree(f, fig, fact, figPeriods) {
  const figUnit = f.kind === "cell" ? (f.unit ?? "") : (fig.tokens[0]?.unit ?? "");
  return periodsAgree(figPeriods, fact.periods) && unitsAgree(figUnit, fact.unit);
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
    const ok = pool.find((fact) => conflictFree(f, fig, fact, figPeriods));
    if (!ok) return { found: false, conflicting: pool[0] ?? null, token };
    used.push(ok);
  }
  const same = used.find((fact) => fig.tokens.every((t) => fact.tokens.some((x) => x.value === t.value)));
  return { found: true, fact: same ?? used[0], oneItem: Boolean(same), precision };
}

/** Sentence-level match: the drawn text equals, sits inside or contains a source line. */
function textSearch(text, scope) {
  const key = fold(plainNames(text));
  const direct = scope.byText.get(key) ?? scope.byText.get(fold(text));
  if (direct?.length) return { fact: direct[0], via: "exact text" };
  if (key.length < 12) return null;
  for (const fact of scope.facts) {
    const other = fold(plainNames(fact.text));
    if (other.length >= 12 && (other.includes(key) || key.includes(other))) return { fact, via: "text inside or around a source item" };
  }
  return null;
}

const words = (s) => new Set(labelKey(plainNames(s)).split(" ").filter(Boolean));
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

function classifyFigure(f, ctx) {
  const text = norm(f.text);
  const scope = ctx.scope;
  if (ctx.surface === "connected") {
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
    if (/^(14|15) designated handoffs/.test(text) || /^\d+ designated handoffs/.test(text)) {
      const run = ctx.runScope;
      const fig = figureTokens(f);
      return fig.tokens.every((t) => run.byValue.has(t.value)) ? matched(run.facts[5], "run request (counts)") : differing(run.facts[5], "run request (counts)", ["digits"]);
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
    return [...fig.periods].every((p) => all.has(p) || ctx.allPeriods?.has(p))
      ? matched(null, "period appears in the source")
      : notFound("period is in no source item of this scope");
  }
  // 3. a missing marker
  if (isMissing(text)) {
    const hits = scope.facts.filter((fact) => isMissing(fact.text));
    return hits.length ? matched(hits[0], "missing marker (source has a missing cell in this scope; cell not identified)") : notFound("the source has no missing value in this scope");
  }
  // 4. text, then values
  const long = words(text).size >= 5;
  const found = textSearch(text, scope);
  if (found) return matched(found.fact, found.via);
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
  const outlineKind = kindOf.get(fold(text));
  if (PAGE_WORDS.test(text) || (outlineKind && UI_KINDS.has(outlineKind) && words(text).size < 8)) {
    return derived("page wording", "label drawn by the page (heading, control, state word); not a source sentence");
  }
  const scope = ctx.scope;
  const found = textSearch(text, scope);
  if (found) return matched(found.fact, found.via);
  const files = ctx.fileNames;
  const opened = /^Open source file:\s*(.+)$/i.exec(text);
  const named = opened ? opened[1].trim() : text;
  if (files?.has(named)) return matched(null, opened ? "Open source file link wording over an uploaded file name" : "uploaded file name");
  const near = nearest(text, scope);
  if (near) return differing(near.fact, "nearest sentence", ["text"]);
  if (kind === "source") {
    const hasDigits = figureTokens({ text }).tokens.length > 0;
    if (hasDigits) {
      const search = valueSearch({ text, kind: "text" }, scope);
      if (search?.found) return matched(search.fact, "values in the source");
    }
  }
  return notFound("no source sentence or file name like it");
}

// ---------------------------------------------------------------------------------------------
// Source drawers
// ---------------------------------------------------------------------------------------------

const collapse = (s) => norm(plainNames(s)).replace(/\s+/g, " ");
const isBasisHeader = (h) => /basis|^sources?$|^evidence$/i.test(norm(h));

/** What the drawer for a handoff line should state, and the basis it should carry. */
function drawerExpectation(h, line) {
  const block = h.blocks.find((b) => b.type !== "table" && b.type !== "basis" && b.line === line);
  if (block) return { statement: collapse(block.text), pairs: null, basis: block.basis ? [collapse(block.basis)] : [], at: line };
  for (const table of h.tables) {
    if (table.line === line) {
      const basis = [];
      for (const row of table.rows) table.headers.forEach((hd, k) => isBasisHeader(hd) && row.cells[k] && basis.push(collapse(row.cells[k])));
      return { statement: collapse(table.title), pairs: null, basis: [...new Set(basis)], at: line };
    }
    const row = table.rows.find((r) => r.line === line);
    if (row) {
      const pairs = table.headers.map((hd, k) => (row.cells[k] ? collapse(`${hd} — ${row.cells[k]}`) : "")).filter(Boolean);
      const basis = table.headers.flatMap((hd, k) => (isBasisHeader(hd) && row.cells[k] ? [collapse(row.cells[k])] : []));
      return { statement: pairs.join(" "), pairs, basis: [...new Set(basis)], at: line };
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

function basisAgrees(drawnItem, expected) {
  const drawn = collapse(drawnItem ?? "");
  const none = /^Basis was not recorded for this item/i.test(drawn) || drawn === "";
  if (!expected.length) return none || null;
  if (none) return false;
  let rest = drawn.replace(/^Basis\s*/i, "");
  for (const value of expected) rest = rest.replace(value, " ");
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
    if (!p.h || p.parts.line === null) {
      out.push({ ...entry, ...notFound("the drawer names no module handoff line") });
      continue;
    }
    if (!p.candidates.length) {
      out.push({ ...entry, ...notFound(`statement is on no line of ${p.h.file}`, { drawerLine: p.parts.line }) });
      continue;
    }
    const mode = modes.get(p.id);
    const hit = p.candidates.find((c) => c.offset === mode);
    if (!hit) {
      const at = p.candidates[0];
      out.push({ ...entry, ...differing({ loc: `${p.h.file}:${at.line}`, text: at.expectation.statement }, "drawer handoff line", ["source line"], { drawerLine: p.parts.line, note: `the drawer says line ${p.parts.line}; the statement is at ${p.h.file}:${at.line}, and the module's lines are numbered ${mode} higher` }) });
      continue;
    }
    const basisOk = basisAgrees(p.parts.basis, hit.expectation.basis);
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
      const found = textSearch(line.text, ctx.scope);
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
  const moduleMatch = /^modules--(CP-[A-Z0-9]+)$/.exec(id);
  const ctx = surface === "connected" ? world.connectedContext(id, moduleMatch?.[1] ?? null) : world.staticContext(id);
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
          const missingCells = cells.filter((c) => !c.basis && !onPage(c));
          const basisLost = cells.filter((c) => c.basis && !onPage(c) && !inDrawer(c));
          if (!missingCells.length && !basisLost.length) continue;
          const verdict = !sets ? "screen not captured" : missingCells.length === cells.filter((c) => !c.basis).length ? "row not drawn" : missingCells.length ? "some cells not drawn" : "basis not shown";
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
          if (typeof leaf.text !== "string" || text.length < 3 || /^[a-z0-9-]+$/.test(text) || /^\d+$/.test(text)) continue;
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

function staticScopeFor(id, library, model, cache) {
  const get = (key, make) => cache.get(key) ?? (cache.set(key, makeScope(key, make())), cache.get(key));
  const parts = id.split("--");
  if (parts[0] === "library") {
    if (parts[1] === "home") return get("library-home", () => fixtureFacts(library.slice.home, "/slice/home", "web/fixtures/library.json", FIXTURE_IGNORED_KEYS));
    const issuerIndex = library.slice.issuers.findIndex((i) => i.id === parts[1]);
    const issuer = library.slice.issuers[issuerIndex];
    if (parts[2] === "history") return get(`history-${parts[1]}`, () => fixtureFacts(issuer.history, `/slice/issuers/${issuerIndex}/history`, "web/fixtures/library.json", FIXTURE_IGNORED_KEYS));
    const runIndex = issuer?.runs.findIndex((r) => r.id === parts[2]);
    const run = issuer?.runs[runIndex];
    if (run) return get(`${parts[1]}-${parts[2]}`, () => [...fixtureFacts(run, `/slice/issuers/${issuerIndex}/runs/${runIndex}`, "web/fixtures/library.json", FIXTURE_IGNORED_KEYS), ...compositeFacts(run, `/slice/issuers/${issuerIndex}/runs/${runIndex}`)]);
  }
  if (parts[0] === "model") {
    if (parts[1] === "runs") return get("model-runs", () => fixtureFacts(model.slice, "/slice", "web/fixtures/model.json", FIXTURE_IGNORED_KEYS));
    const runIndex = model.slice.runs.findIndex((r) => r.issuer === parts[1] && r.run === parts[2]);
    if (runIndex >= 0) return get(`model-${parts[1]}-${parts[2]}`, () => fixtureFacts(model.slice.runs[runIndex], `/slice/runs/${runIndex}`, "web/fixtures/model.json", FIXTURE_IGNORED_KEYS));
  }
  return makeScope("empty", []);
}

/** A derivation node {label, value, note} is drawn as "label value note": make that a source string too. */
function compositeFacts(object, base) {
  const out = [];
  const walk = (node, p) => {
    if (Array.isArray(node)) node.forEach((x, k) => walk(x, `${p}/${k}`));
    else if (node && typeof node === "object") {
      if (typeof node.label === "string" && typeof node.value === "string") {
        for (const text of [`${node.label} ${node.value}`, `${node.label} ${node.value} ${node.note ?? ""}`.trim()]) out.push(makeFact({ kind: "leaf", file: "web/fixtures/library.json", line: 0, path: p, rowKey: node.label, header: "derivation", text, loc: `web/fixtures/library.json#${p}` }));
      }
      for (const [k, v] of Object.entries(node)) walk(v, `${p}/${k}`);
    }
  };
  walk(object, base);
  return out;
}
