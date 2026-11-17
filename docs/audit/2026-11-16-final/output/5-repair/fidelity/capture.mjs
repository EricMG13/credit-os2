// Fidelity capture for stage 5 step 9 of the final audit: what the reader sees, screen by screen.
//
// Usage (from the repository root):
//   timeout 600 node docs/audit/2026-11-16-final/output/5-repair/fidelity/capture.mjs <outDir> [--surface connected|static|both]
// Environment:
//   CHROMIUM_PATH     browser executable (default: the chromium headless shell under /opt/pw-browsers)
//   FID_PORT          port of the synthetic service (default 8851)
//   FID_CONCURRENCY   pages captured at once, each in its own browser context (default 3)
//   ONLY              capture only the screens whose id contains this text (a development aid)
//   FID_ATTACH, FID_RUN   development aid: use a service that is already running, with a finished run
//
// Two surfaces, captured separately and written to <outDir>/connected/ and <outDir>/static/:
//   connected: `proof.serve` on its own new root under /tmp/fid-<n>, one synthetic run completed the way
//              web/scripts/connected-proof.mjs does it, then the report's screens. The service is stopped
//              at the end.
//   static:    web/dist/index.html opened from disk, with the fixture data that stage 0's crawl used: a copy
//              of web/dist in a temporary folder whose data.js is written by web/scripts/fixture-data.mjs
//              from web/fixtures/*.json. web/dist itself is not touched.
// <outDir>/index.json is rebuilt from the screen files on disk, so a surface captured in an earlier run
// stays listed. Nothing here calls a provider; the synthetic service substitutes canned responses.
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

const repo = process.env.REPO_ROOT ? path.resolve(process.env.REPO_ROOT) : process.cwd();
const web = path.join(repo, "web");
if (!existsSync(path.join(web, "dist", "index.html"))) {
  throw new Error(`Run from the repository root with web/dist built (not found under ${repo})`);
}
const require = createRequire(path.join(web, "package.json"));
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const flag = (name) => {
  const at = args.indexOf(name);
  return at === -1 ? null : (args.splice(at, 2)[1] ?? null);
};
const surfaceArg = flag("--surface") ?? "both";
if (!["connected", "static", "both"].includes(surfaceArg)) throw new Error(`--surface ${surfaceArg}`);
if (args.length !== 1) throw new Error("Usage: capture.mjs <outDir> [--surface connected|static|both]");
const outDir = path.resolve(args[0]);
const PORT = Number(process.env.FID_PORT ?? 8851);
const CONCURRENCY = Number(process.env.FID_CONCURRENCY ?? 3);
const ONLY = process.env.ONLY ?? null;
const VIEWPORT = { width: 1440, height: 900 };
const LOOP_CAP = 1000;

// ---- in the page ---------------------------------------------------------------------------------
// One self-contained function (Playwright sends its source to the page). It reads what is drawn: the
// visible text in reading order under its headings, the tables, every figure with what sits beside
// it, the chart marks, the controls and the links.
function extractInPage(opts) {
  const clean = (s) => (s ?? "").replace(/[\s ]+/g, " ").trim();
  const vis = (el) => el.checkVisibility({ checkVisibilityCSS: true });
  const DIGIT = /\d/;
  const MISSING = /^(?:n\.a\.?|na|[—–-]|not (?:supplied|calculated|available|assessable|established)\b|withheld\b)/i;
  const PERIOD =
    /(?:\bFY\s?\d{2,4}[EAFP]?\b|\b[HQ][1-4]\s?(?:FY)?\d{2,4}\b|\b\d{4}-Q[1-4]\b|\b(?:PF )?LTM\b|\bP?YTD\b|\b(?:19|20)\d{2}[EAFP]?\b|\bYear to\b|\bAs of\b)/i;
  const PERIOD_ONLY =
    /^(?:(?:PF )?LTM|[HQ][1-4] ?(?:FY)?\d{2,4}|FY ?\d{2,4}[EAFP]?|(?:19|20)\d{2}[EAFP]?|\d{4}-Q[1-4]|Year to .+|Latest twelve months to .+|To \d.+|As of .+)$/i;
  const UNIT =
    /(?:US\$\s?(?:m|bn)\b|USD\s?(?:m|bn|million|billion)\b|[$£€]\s?(?:m|bn)\b|\b[A-Z]{3}\s?(?:m|bn|million|billion)\b|%|\bbps\b|\bpts\b|\bmonths?\b|\byears?\b|\bdays?\b|units not recorded|per cent|\bx\b)/i;
  const BASIS =
    /\b(?:basis|company-adjusted|adjusted|reported|defined|estimated?|management|disclosure|derived|calculated|pro forma|run-rate|as defined|synthetic)\b/i;
  const LIMIT_HEAD =
    /limitation|qualification|\bgaps?\b|not (?:assessable|established|supplied|available)|could not establish/i;
  const LIMIT_TEXT =
    /^(?:not (?:supplied|calculated|assessable|established|available|analytical review|recorded)|units not recorded|withheld)|\b(?:could not|cannot|was not|were not|is not|are not|not (?:recorded|stated|supplied|assessable|established)|no (?:earlier|recorded|retained|credit view)|unavailable|missing|withheld)\b/i;
  const SOURCE_TEXT =
    /^(?:basis\b|sources?\s*[:\u00b7])|\b[\w.-]+\.(?:txt|pdf|xlsx?|md|json|html?)\b|\bp\.\s?\d+\b|\bpage\s\d+\b|\bhandoff line\b/i;
  const NUMBER =
    /[+\-−–]?\s?(?:US\$|USD\s?|EUR\s?|GBP\s?|[$€£¥])?\(?\d[\d,]*(?:\.\d+)?\)?(?:\s?(?:%|x\b|×|bps\b|pts\b|bn\b|mm\b|m\b|k\b|million\b|billion\b|months?\b|years?\b|days?\b))?/g;
  const SKIP = new Set([
    "script", "style", "template", "noscript", "title", "desc", "defs", "clippath",
    "lineargradient", "mask", "pattern", "symbol", "option", "datalist",
  ]);
  const DATA_NOISE = new Set([
    "data-rac", "data-react-aria-pressable", "data-icon", "data-text", "data-shape", "data-sources",
    "data-current", "data-orientation", "data-selected", "data-testid", "data-a11y-ignore",
    "data-expanded", "data-focused", "data-focus-visible", "data-hovered", "data-pressed",
    "data-disabled", "data-state", "data-open", "data-placement", "data-trigger", "data-entering",
    "data-exiting", "data-loading", "data-slot", "data-audit-i",
  ]);

  const labelledBy = (el) => {
    const ids = el.getAttribute("aria-labelledby");
    if (!ids) return null;
    const text = ids
      .split(/\s+/)
      .map((id) => clean(document.getElementById(id)?.textContent))
      .filter(Boolean)
      .join(" ");
    return text || null;
  };
  const nameOf = (el) =>
    el.getAttribute("aria-label") ||
    labelledBy(el) ||
    clean(el.labels?.[0]?.innerText) ||
    clean(el.innerText).slice(0, 80) ||
    null;
  const figureLabel = (el) => {
    const f = el.closest("figure,[role=figure]");
    return f ? f.getAttribute("aria-label") || labelledBy(f) || clean(f.querySelector("h1,h2,h3,h4,h5,h6")?.textContent) || null : null;
  };
  const isSrOnly = (el) => {
    const cs = getComputedStyle(el);
    if (cs.position !== "absolute") return false;
    const r = el.getBoundingClientRect();
    return r.width <= 1.5 && r.height <= 1.5 && (cs.overflow !== "visible" || cs.clipPath !== "none" || cs.clip !== "auto");
  };
  const round = (v) => (/^-?\d+\.\d{4,}$/.test(v) ? String(Number(Number(v).toFixed(3))) : v);
  const unitOf = (text) => {
    for (const t of tokens(text)) {
      const u = t.replace(/[+\-−–()]/g, "").replace(/\d[\d,]*(?:\.\d+)?/g, "").trim();
      if (u) return u;
    }
    return null;
  };
  const tokens = (text) => [...text.matchAll(NUMBER)].map((m) => clean(m[0])).filter((t) => DIGIT.test(t));

  const extract = (root, slim) => {
    const runs = [];
    const headingEls = [];
    const srOnly = [];
    const optionDigits = { n: 0 };
    let buf = [];
    let bufBlock = null;
    let path = [];
    const section = () => path.map((h) => h.text.slice(0, 80)).join(" > ");
    const emit = (kind, text, el, extra) => {
      const t = clean(text);
      if (t) runs.push({ kind, text: t, section: section(), el, ...extra });
    };
    const flush = () => {
      if (buf.length) emit("text", buf.join(""), bufBlock);
      buf = [];
      bufBlock = null;
    };
    const svgRuns = (svg) => {
      for (const t of svg.querySelectorAll("text")) {
        if (!vis(t)) continue;
        const spans = [...t.querySelectorAll("tspan")];
        const text = spans.length > 1 ? spans.map((s) => s.textContent).join(" ") : t.textContent;
        const attrs = {};
        for (const a of t.attributes) if (a.name.startsWith("data-") && !DATA_NOISE.has(a.name)) attrs[a.name] = a.value;
        emit("chart-text", text, t, { attrs });
      }
    };
    const walk = (el, block) => {
      for (const node of el.childNodes) {
        if (node.nodeType === 3) {
          buf.push(node.data);
          bufBlock ??= block;
          continue;
        }
        if (node.nodeType !== 1) continue;
        const tag = node.localName;
        if (SKIP.has(tag)) continue;
        // checkVisibility() is false for an element with no box of its own, display: contents included.
        if (getComputedStyle(node).display === "contents") {
          walk(node, block);
          continue;
        }
        if (!vis(node)) continue;
        if (isSrOnly(node)) {
          const t = clean(node.textContent);
          if (t) srOnly.push(t);
          continue;
        }
        if (tag === "br") {
          flush();
          continue;
        }
        if (tag === "svg") {
          flush();
          svgRuns(node);
          continue;
        }
        if (tag === "select") {
          flush();
          const selected = node.selectedOptions[0];
          emit("select", selected ? selected.text : "", node);
          for (const o of node.options) optionDigits.n += (o.text.match(/\d[\d,.]*/g) ?? []).length;
          continue;
        }
        if (tag === "input" || tag === "textarea") {
          flush();
          if (!["radio", "checkbox", "hidden", "file", "button", "submit"].includes(node.type)) emit("input", node.value, node);
          continue;
        }
        const display = getComputedStyle(node).display;
        if (display === "inline") {
          walk(node, block);
          continue;
        }
        flush();
        if (/^h[1-6]$/.test(tag) || node.getAttribute("role") === "heading") {
          const level = /^h[1-6]$/.test(tag) ? Number(tag[1]) : Number(node.getAttribute("aria-level") ?? 2);
          const text = clean(node.innerText);
          if (text) {
            path = path.filter((h) => h.level < level);
            path.push({ level, text });
            headingEls.push({ el: node, text });
            emit("heading", text, node, { level });
          }
          continue;
        }
        walk(node, node);
        flush();
      }
    };
    walk(root, root);
    flush();

    for (const r of runs) {
      if (["heading", "chart-text", "select", "input"].includes(r.kind)) continue;
      const el = r.el;
      r.kind = el.closest("td,th")
        ? "cell"
        : el.closest("summary")
          ? "summary"
          : el.closest("button,[role=button],[role=radio],[role=tab],[role=switch],[role=menuitem],[role=option]")
            ? "control"
            : el.closest("a")
              ? "link"
              : el.closest("dt")
                ? "term"
                : el.closest("dd")
                  ? "definition"
                  : el.closest("li")
                    ? "item"
                    : el.closest("figcaption,caption")
                      ? "caption"
                      : el.localName === "p"
                        ? "paragraph"
                        : "text";
    }

    // Tables: the drawn rows under their drawn column headers.
    const cellRuns = new Map();
    for (const r of runs) {
      if (r.kind !== "cell") continue;
      const cell = r.el.closest("td,th");
      cellRuns.set(cell, [...(cellRuns.get(cell) ?? []), r.text]);
    }
    const cellText = (c) => (cellRuns.get(c) ?? []).join(" ");
    const headingBefore = (el) => {
      let found = null;
      for (const h of headingEls) {
        if (h.el.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) found = h.text;
      }
      return found;
    };
    const tables = [];
    const figures = [];
    const sources = [];
    const tableRuns = new Set();
    for (const t of root.querySelectorAll("table")) {
      if (!vis(t)) continue;
      const label =
        t.getAttribute("aria-label") || labelledBy(t) || clean(t.querySelector("caption")?.textContent) || figureLabel(t) || headingBefore(t);
      const trs = [...t.rows];
      const isHead = (tr) =>
        tr.parentElement.localName === "thead" ||
        (tr.cells.length > 0 && [...tr.cells].every((c) => c.localName === "th" && c.getAttribute("scope") !== "row"));
      const headRows = [];
      let at = 0;
      while (at < trs.length && isHead(trs[at])) headRows.push(trs[at++]);
      const headers = [];
      for (const tr of headRows) {
        let col = 0;
        for (const c of tr.cells) {
          const text = cellText(c);
          for (let k = 0; k < c.colSpan; k++) {
            if (text && headers[col + k] !== text) headers[col + k] = headers[col + k] ? `${headers[col + k]} / ${text}` : text;
          }
          col += c.colSpan;
        }
      }
      const rows = [];
      for (const tr of trs.slice(at)) {
        if (!vis(tr)) continue;
        const cells = [];
        const kinds = [];
        for (const c of tr.cells) {
          cells.push(cellText(c));
          kinds.push(c.localName === "th" ? "th" : "td");
          for (let k = 1; k < c.colSpan; k++) {
            cells.push("");
            kinds.push("span");
          }
        }
        if (!cells.some(Boolean)) continue;
        const rowHeader = tr.querySelector("th[scope=row]") ? cellText(tr.querySelector("th[scope=row]")) : null;
        const traces = [...tr.querySelectorAll("button[aria-label^='Show sources']")].map((b) => b.getAttribute("aria-label"));
        rows.push({ rowHeader, cells, traces });
        const named = (re) => cells.filter((c, i) => c && re.test(headers[i] ?? ""));
        const rowLabel = rowHeader ?? cells.find((c, i) => c && kinds[i] !== "span") ?? null;
        cells.forEach((text, i) => {
          if (!text || kinds[i] === "span") return;
          const header = headers[i] ?? null;
          if (header && /source/i.test(header)) sources.push({ via: "table source column", section: label, text });
          const isRowHeader = kinds[i] === "th" && tr.cells[0] && cells[i] === rowHeader;
          if (isRowHeader || !(DIGIT.test(text) || MISSING.test(text))) return;
          const period = (header && PERIOD.test(header) ? header : null) ?? named(/period|date|year/i)[0] ?? (rowLabel && PERIOD.test(rowLabel) ? rowLabel : null);
          const unitSource = [header, ...named(/unit/i), label].find((s) => s && UNIT.test(s));
          figures.push({
            kind: "cell",
            text,
            tokens: tokens(text),
            section: label,
            label: rowLabel === text ? null : rowLabel,
            column: header,
            period,
            unit: named(/unit/i)[0] ?? unitOf(text) ?? (unitSource ? (unitSource.match(UNIT) ?? [null])[0] : null),
            basis: named(/basis|limitation|note|definition|comment/i)[0] ?? null,
            source: named(/source/i)[0] ?? null,
          });
        });
      }
      for (const c of t.querySelectorAll("td,th")) for (const text of cellRuns.get(c) ?? []) tableRuns.add(text);
      tables.push({ label, headers, rows });
    }

    // Figures outside tables: chart text, cards and prose, with what is drawn beside each.
    // The card a figure is drawn in: from the smallest ancestor holding two runs, the largest ancestor
    // that still holds at most six runs and no heading.
    const inGroupOf = (r) => {
      let best = null;
      for (let p = r.el.parentElement; p && p !== root.parentElement; p = p.parentElement) {
        const inside = runs.filter((x) => p.contains(x.el));
        if (inside.some((x) => x.kind === "heading" && x !== r) || inside.length > 6) break;
        if (inside.length >= 2) best = inside;
      }
      return best;
    };
    for (const r of runs) {
      if (r.kind === "cell" || r.kind === "heading") continue;
      if (!(DIGIT.test(r.text) || MISSING.test(r.text))) continue;
      if (r.kind === "chart-text") {
        figures.push({ kind: "chart-text", text: r.text, tokens: tokens(r.text), section: r.section, figure: figureLabel(r.el), attrs: Object.keys(r.attrs).length ? r.attrs : undefined });
        continue;
      }
      const group = inGroupOf(r);
      const others = group ? group.filter((x) => x !== r).map((x) => x.text) : [];
      const before = group ? group.slice(0, group.indexOf(r)).map((x) => x.text).filter((t) => !DIGIT.test(t) && t.length <= 80) : [];
      const after = others.filter((t) => !DIGIT.test(t) && t.length <= 80);
      const term = group?.find((x) => x.kind === "term" || x.kind === "heading")?.text;
      figures.push({
        kind: group ? "card" : r.kind,
        text: r.text,
        tokens: tokens(r.text),
        section: r.section,
        label: term ?? before.at(-1) ?? after[0] ?? null,
        period: (PERIOD_ONLY.test(r.text) ? r.text : null) ?? others.find((t) => PERIOD_ONLY.test(t)) ?? others.find((t) => PERIOD.test(t) && !/\bvs\b/i.test(t) && t.length <= 60) ?? null,
        unit: unitOf(r.text) ?? (others.map((t) => t.match(UNIT)?.[0]).find(Boolean) ?? null),
        basis: others.find((t) => BASIS.test(t)) ?? null,
        beside: group ? group.map((x) => x.text).join(" | ") : undefined,
      });
    }

    // Source lines and limitation sentences, found by where they sit and how they read.
    const limitations = [];
    for (const r of runs) {
      if (r.kind === "heading") continue;
      const last = r.section.split(" > ").at(-1) ?? "";
      if (/^(?:sources?|source files?|basis)\b/i.test(last)) sources.push({ via: "section", section: r.section, text: r.text });
      else if (SOURCE_TEXT.test(r.text) && !tableRuns.has(r.text)) sources.push({ via: "text", section: r.section, text: r.text });
      if (LIMIT_HEAD.test(r.section)) limitations.push({ via: "section", section: r.section, text: r.text });
      else if (LIMIT_TEXT.test(r.text) && r.kind !== "control") limitations.push({ via: "text", section: r.section, text: r.text });
    }

    // Chart marks: what the drawing itself carries (series, group, missing versus zero, bar sizes).
    const marks = [];
    for (const el of root.querySelectorAll("*")) {
      const attrs = {};
      for (const a of el.attributes) {
        if (a.name.startsWith("data-") && !DATA_NOISE.has(a.name) && !a.name.startsWith("data-react-aria")) attrs[a.name] = round(a.value);
      }
      if (!Object.keys(attrs).length || !vis(el)) continue;
      marks.push({ in: figureLabel(el), tag: el.localName, attrs, text: clean(el.textContent).slice(0, 80) || undefined });
    }

    const result = {
      outline: runs.map((r) => ({ section: r.section, kind: r.kind, text: r.text })),
      tables,
      figures,
      sources,
      limitations,
      marks,
    };
    if (slim) return result;

    const controls = [];
    for (const el of root.querySelectorAll("[role=radio],[role=switch],[role=tab],[role=checkbox],input[type=radio],input[type=checkbox],select,[aria-pressed],details")) {
      if (el.localName === "details" ? !vis(el) : !vis(el) && !el.closest("label")) continue;
      const role = el.getAttribute("role") ?? (el.localName === "input" ? el.type : el.localName);
      const state =
        el.localName === "select"
          ? { value: el.selectedOptions[0]?.text ?? null, options: [...el.options].map((o) => o.text) }
          : el.localName === "details"
            ? { open: el.open }
            : { checked: el.checked ?? el.getAttribute("aria-checked"), selected: el.getAttribute("aria-selected"), pressed: el.getAttribute("aria-pressed") };
      controls.push({ role, name: el.localName === "details" ? clean(el.querySelector("summary")?.textContent) : nameOf(el), ...state });
    }
    const links = [...root.querySelectorAll("a[href]")]
      .filter(vis)
      .map((a) => ({ text: clean(a.innerText) || a.getAttribute("aria-label") || null, href: a.getAttribute("href") }));

    // Independent check that the walk dropped nothing: digit groups in innerText against the capture.
    const count = (s) => (s.match(/\d[\d,.]*/g) ?? []).length;
    const innerText = count(root.innerText);
    const captured = runs.reduce((n, r) => n + count(r.text), 0) - runs.filter((r) => r.kind === "select" || r.kind === "input").reduce((n, r) => n + count(r.text), 0);
    const selects = runs.filter((r) => r.kind === "select").reduce((n, r) => n + count(r.text), 0);
    const inputs = runs.filter((r) => r.kind === "input").reduce((n, r) => n + count(r.text), 0);
    const srOnlyDigits = srOnly.reduce((n, s) => n + count(s), 0);
    return {
      title: document.title,
      headings: headingEls.map((h) => h.text),
      ...result,
      controls,
      links,
      screenReaderOnly: srOnly,
      coverage: { innerText, captured, optionsNotDrawn: optionDigits.n, selected: selects, typed: inputs, screenReaderOnly: srOnlyDigits },
    };
  };

  if (opts.mode === "dialog") {
    const d = [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].find(vis);
    if (!d) return null;
    const out = extract(d, true);
    return { title: d.getAttribute("aria-label"), outline: out.outline, tables: out.tables, links: [...d.querySelectorAll("a[href]")].map((a) => ({ text: clean(a.innerText), href: a.getAttribute("href") })) };
  }
  if (opts.mode === "figures") {
    return [...document.querySelectorAll("main figure")]
      .filter((f) => vis(f) && f.querySelector('[role=radiogroup][aria-label$="Chart or Table"]'))
      .map((f) => ({ figure: figureLabel(f), ...extract(f, true) }));
  }
  return extract(document.querySelector("main"), false);
}

// ---- page driving --------------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const fromEnv = process.env.CHROMIUM_PATH;
  if (fromEnv) return chromium.launch({ executablePath: fromEnv });
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  const shells = existsSync(root)
    ? readdirSync(root)
        .filter((d) => d.startsWith("chromium_headless_shell-"))
        .sort()
        .reverse()
        .map((d) => path.join(root, d, "chrome-headless-shell-linux64", "chrome-headless-shell"))
        .filter((p) => existsSync(p))
    : [];
  return shells.length ? chromium.launch({ executablePath: shells[0] }) : chromium.launch();
}

async function newWorkers(browser, n) {
  return Promise.all(
    Array.from({ length: n }, async () => {
      const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: "reduce" });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      return { context, page };
    }),
  );
}

async function pool(items, workers, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    workers.map(async (worker) => {
      for (;;) {
        const i = next++;
        if (i >= items.length || i >= LOOP_CAP) return;
        results[i] = await fn(items[i], worker.page);
      }
    }),
  );
  return results;
}

// The page is settled when its drawn markup has stopped changing (charts animate in).
async function settle(page) {
  let last = "";
  let same = 0;
  for (let i = 0; i < 60 && same < 3; i++) {
    const sig = await page.evaluate(() => {
      const m = document.querySelector("main");
      if (!m) return "none";
      const s = m.innerHTML;
      let h = 2166136261;
      for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619);
      return `${s.length}:${h >>> 0}`;
    });
    same = sig === last ? same + 1 : 0;
    last = sig;
    await sleep(120);
  }
}

// Open what a reader can open: every <details>, and every disclosure button that is closed.
async function openDisclosures(page) {
  let clicked = 0;
  for (let pass = 0; pass < 4; pass++) {
    await page.evaluate(() => document.querySelectorAll("main details:not([open])").forEach((d) => (d.open = true)));
    const closed = page.locator('main button[aria-expanded="false"]:not([aria-haspopup]):not([role=combobox])');
    const n = await closed.count();
    if (n === 0) break;
    for (let i = 0; i < n && clicked < LOOP_CAP; i++) {
      await closed.nth(0).click({ timeout: 3000 }).catch(() => {});
      clicked++;
    }
    await sleep(150);
  }
  return clicked;
}

async function toTableViews(page) {
  const groups = page.locator('main [role=radiogroup][aria-label$="Chart or Table"]');
  const n = await groups.count();
  for (let i = 0; i < n; i++) {
    const table = groups.nth(i).getByRole("radio", { name: "Table", exact: true });
    if ((await table.getAttribute("aria-checked")) !== "true") await table.click({ timeout: 3000 });
  }
  return n;
}

// The drawer behind every "Show sources" control, opened with the keyboard and closed with Escape.
async function captureTraces(page) {
  const sel = 'main button[aria-label^="Show sources"]';
  const total = await page.locator(sel).count();
  const out = [];
  for (let i = 0; i < Math.min(total, LOOP_CAP); i++) {
    const button = page.locator(sel).nth(i);
    const label = await button.getAttribute("aria-label");
    let drawer = null;
    let error;
    try {
      await button.press("Enter", { timeout: 3000 });
      await page.locator("[role=dialog]").first().waitFor({ timeout: 3000 });
      drawer = await page.evaluate(extractInPage, { mode: "dialog" });
    } catch (e) {
      error = String(e.message).split("\n")[0];
    }
    await page.keyboard.press("Escape");
    await page.locator("[role=dialog]").first().waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
    out.push({ n: i + 1, control: label, drawer, error });
  }
  return { total, items: out };
}

// One screen: load, settle, open everything, read the page as drawn, then the Table view of every chart
// and the source drawer behind every control. `prepare` runs after load (a case choice, for example).
async function captureScreen(page, screen, { ready, prepare }) {
  await page.goto("about:blank");
  await page.goto(screen.url, { waitUntil: "load" });
  await ready(page);
  if (prepare) await prepare(page);
  await settle(page);
  const expanded = await openDisclosures(page);
  await settle(page);
  const view = await page.evaluate(extractInPage, { mode: "page" });
  const toggles = await toTableViews(page);
  await settle(page);
  const tableViews = toggles ? await page.evaluate(extractInPage, { mode: "figures" }) : [];
  const traces = await captureTraces(page);
  return { ...screen, view, tableViews, traces, expanded, toggles };
}

// ---- normalising ---------------------------------------------------------------------------------
// Times and run ids differ from one capture to the next; nothing else is changed.
function normaliser(extra = []) {
  const rules = [
    [/\b\d{8}-\d{6}-\d{2}\b/g, "<run-id>"],
    [/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g, "<time>"],
    [/\/tmp\/fid-[^\s"'/\\]+/g, "<root>"],
    ...extra.map((s) => [new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "<run-id>"]),
  ];
  const whole = [[/^(?:\d+ min )?\d+(?:\.\d+)? s$/, "<duration>"]];
  const str = (s) => {
    for (const [re, to] of whole) if (re.test(s)) return to;
    return rules.reduce((acc, [re, to]) => acc.replace(re, to), s);
  };
  const walk = (v) =>
    typeof v === "string" ? str(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, walk(x)])) : v;
  return walk;
}

const NORMALISED = [
  "run ids of the form YYYYMMDD-HHMMSS-NN, and the run id the service issued",
  "ISO timestamps",
  "paths under /tmp/fid-*",
  "elapsed durations drawn as 'N s' or 'N min N s' (a whole drawn value)",
];

// ---- output --------------------------------------------------------------------------------------
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9._]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// One key per line, one array item per line: a diff of two captures shows exactly the lines that moved.
function toJson(rec) {
  const body = Object.entries(rec).map(([k, v]) =>
    Array.isArray(v) && v.length
      ? `  ${JSON.stringify(k)}: [\n${v.map((x) => `    ${JSON.stringify(x)}`).join(",\n")}\n  ]`
      : `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`,
  );
  return `{\n${body.join(",\n")}\n}\n`;
}

function countsOf(rec) {
  const v = rec.view;
  const byKind = {};
  for (const f of v?.figures ?? []) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
  const tv = rec.tableViews ?? [];
  const tableFigures = tv.reduce((n, f) => n + f.figures.length, 0);
  const drawers = rec.traces.items.filter((t) => t.drawer);
  return {
    textRuns: v?.outline.length ?? 0,
    figures: (v?.figures.length ?? 0) + tableFigures,
    figuresByKind: byKind,
    tableViewFigures: tableFigures,
    chartTableViews: tv.length,
    tables: v?.tables.length ?? 0,
    tableRows: (v?.tables ?? []).reduce((n, t) => n + t.rows.length, 0),
    sourceLines: v?.sources.length ?? 0,
    drawerLines: drawers.reduce((n, t) => n + t.drawer.outline.filter((o) => !["heading", "control", "link"].includes(o.kind)).length, 0),
    limitationSentences: v?.limitations.length ?? 0,
    marks: v?.marks.length ?? 0,
    traceControls: rec.traces.total,
    traceDrawers: drawers.length,
    traceErrors: rec.traces.items.filter((t) => t.error).length,
    coverageGap: v ? v.coverage.innerText - (v.coverage.captured + v.coverage.selected + v.coverage.typed + v.coverage.optionsNotDrawn + v.coverage.screenReaderOnly) : null,
  };
}

function writeScreen(dir, rec, normalise) {
  const body = normalise({
    screen: { id: rec.id, surface: rec.surface, address: rec.address, extra: rec.extra ?? false, variant: rec.variant ?? null },
    page: rec.view ? { title: rec.view.title, headings: rec.view.headings } : null,
    counts: countsOf(rec),
    expandedDisclosures: rec.expanded,
    outline: rec.view?.outline ?? [],
    tables: rec.view?.tables ?? [],
    figures: rec.view?.figures ?? [],
    sources: rec.view?.sources ?? [],
    limitations: rec.view?.limitations ?? [],
    marks: rec.view?.marks ?? [],
    controls: rec.view?.controls ?? [],
    links: rec.view?.links ?? [],
    screenReaderOnly: rec.view?.screenReaderOnly ?? [],
    coverage: rec.view?.coverage ?? null,
    chartTableViews: rec.tableViews.map((f) => ({ figure: f.figure, outline: f.outline, tables: f.tables, figures: f.figures, marks: f.marks, sources: f.sources, limitations: f.limitations })),
    sourceDrawers: rec.traces.items,
  });
  const file = `${slug(rec.id)}.json`;
  writeFileSync(path.join(dir, file), toJson(body));
  return { file, counts: body.counts };
}

function treeInfo() {
  const git = (...a) => {
    try {
      return execFileSync("git", a, { cwd: repo, encoding: "utf8" }).trim();
    } catch {
      return null;
    }
  };
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(`${path.relative(path.join(web, "dist"), p)} ${sha256(readFileSync(p))}`);
    }
  };
  walk(path.join(web, "dist"));
  const fixtures = Object.fromEntries(
    readdirSync(path.join(web, "fixtures")).filter((f) => f.endsWith(".json")).sort().map((f) => [f, sha256(readFileSync(path.join(web, "fixtures", f)))]),
  );
  return {
    commit: git("rev-parse", "HEAD"),
    branch: git("rev-parse", "--abbrev-ref", "HEAD"),
    changedUnderWebSrcProof: git("status", "--porcelain", "--", "web", "src", "proof", "prompts")?.split("\n").filter(Boolean).length ?? null,
    webDistSha256: sha256(files.join("\n")),
    fixtures,
  };
}

function writeIndex() {
  const screens = [];
  const surfaces = {};
  for (const surface of ["connected", "static"]) {
    const dir = path.join(outDir, surface);
    if (!existsSync(dir)) continue;
    const meta = JSON.parse(readFileSync(path.join(dir, "_surface.json"), "utf8"));
    const rows = readdirSync(dir)
      .filter((f) => f.endsWith(".json") && f !== "_surface.json")
      .sort()
      .map((f) => {
        const text = readFileSync(path.join(dir, f), "utf8");
        const j = JSON.parse(text);
        return { file: `${surface}/${f}`, id: j.screen.id, address: j.screen.address, extra: j.screen.extra, variant: j.screen.variant, counts: j.counts, sha256: sha256(text) };
      });
    const sum = (k) => rows.reduce((n, r) => n + r.counts[k], 0);
    surfaces[surface] = {
      ...meta,
      screens: rows.length,
      screensNotExtra: rows.filter((r) => !r.extra).length,
      figures: sum("figures"),
      figuresInScreens: sum("figures") - sum("tableViewFigures"),
      tableViewFigures: sum("tableViewFigures"),
      tables: sum("tables"),
      sourceLines: sum("sourceLines"),
      drawerLines: sum("drawerLines"),
      limitationSentences: sum("limitationSentences"),
      traceControls: sum("traceControls"),
      traceErrors: sum("traceErrors"),
      screensWithCoverageGap: rows.filter((r) => r.counts.coverageGap !== 0).length,
    };
    screens.push(...rows);
  }
  writeFileSync(
    path.join(outDir, "index.json"),
    toJson({ tool: "capture.mjs", viewport: VIEWPORT, normalised: NORMALISED, surfaces, screens }),
  );
  return surfaces;
}

// ---- connected surface ---------------------------------------------------------------------------
function startService(root) {
  const venv = path.join(repo, ".venv", "bin", "python");
  const [cmd, ...pre] = existsSync(venv) ? [venv] : ["uv", "run", "--no-sync", "python"];
  const child = spawn(cmd, [...pre, "-m", "proof.serve", "--root", root, "--port", String(PORT)], {
    cwd: repo,
    env: { ...process.env, PYTHONPATH: path.join(repo, "src") },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const lines = createInterface({ input: child.stdout });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (t) => (stderr = (stderr + t).slice(-8000)));
  const closed = new Promise((resolve) => child.once("close", resolve));
  const endpoint = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("The synthetic service did not start")), 30000);
    child.once("error", reject);
    child.once("close", (code) => reject(new Error(`The synthetic service exited (${code})`)));
    lines.on("line", (line) => {
      const m = line.match(/http:\/\/127\.0\.0\.1:\d+\//u);
      if (m) {
        clearTimeout(timer);
        resolve(m[0]);
      }
    });
  });
  const stop = async () => {
    lines.close();
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await closed;
  };
  process.once("exit", () => child.kill());
  return { endpoint, stderr: () => stderr, stop };
}

// The synthetic run, the way web/scripts/connected-proof.mjs submits it: three documents uploaded, the
// credit agreement chosen as the executed agreement, one rating, every limit ticked, one approval.
async function submitSyntheticRun(page, endpoint) {
  await page.goto(new URL("/start", endpoint).href);
  await page.getByLabel("Issuer name", { exact: true }).fill("Northbridge Synthetic Group");
  await page.getByLabel("As-of date", { exact: true }).fill("2025-03-31");
  await page.getByLabel("Your name", { exact: true }).fill("Ana L");
  const files = [
    ["northbridge-filing.txt", "text/plain"],
    ["northbridge-portfolio.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["northbridge-credit-agreement.txt", "text/plain"],
  ];
  const uploaded = files.map(([name]) =>
    page.waitForResponse(
      async (r) =>
        /\/api\/submissions\/[^/]+\/files$/u.test(new URL(r.url()).pathname) &&
        r.request().method() === "POST" &&
        (await r.json()).name === name,
    ),
  );
  await page.getByLabel("Documents", { exact: true }).setInputFiles(
    files.map(([name, mimeType]) => ({ name, mimeType, buffer: readFileSync(path.join(repo, "proof", name)) })),
  );
  await Promise.all([page.getByRole("button", { name: "Inspect documents", exact: true }).click(), ...uploaded]);
  await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Inspect documents");
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await page.getByRole("radio", { name: "Full credit assessment", exact: true }).waitFor();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page.getByLabel(/Anything the analysis should know/u).fill("Check the 2028 maturities.\nInclude refinancing risk.");
  await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
  await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
  await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
  const ratings = page.getByRole("region", { name: "Ratings", exact: true });
  await ratings.getByRole("button", { name: "Add rating", exact: true }).click();
  await ratings.getByLabel("Agency", { exact: true }).selectOption("Moody's");
  await ratings.getByLabel("Scope", { exact: true }).selectOption("issuer");
  await ratings.getByLabel("Rating", { exact: true }).fill("B1");
  await ratings.getByLabel("Outlook", { exact: true }).selectOption("Negative");
  await ratings.getByLabel("As-of", { exact: true }).fill("2025-02-28");
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  const submit = page.getByRole("button", { name: "Submit run", exact: true });
  await submit.waitFor();
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const box of await limits.getByRole("checkbox").all()) await box.check();
  await page.getByRole("checkbox", { name: "Approve: I have read this summary and want this run started", exact: true }).check();
  await submit.click();
  const dialog = page.getByRole("dialog", { name: "Start a synthetic test?" });
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
  await page.waitForURL(/\/run\/\d{8}-\d{6}-\d{2}$/u);
  const run = new URL(page.url()).pathname.split("/").at(-1);
  const open = page.getByRole("link", { name: "Open report", exact: true });
  const stopped = page.getByRole("status").filter({ hasText: /^(Failed|Capped|Rejected|Interrupted)$/u });
  await open.or(stopped).waitFor({ timeout: 90000 });
  const state = await (await page.request.get(new URL(`/api/runs/${run}`, endpoint).href)).json();
  if (state.status !== "finished") throw new Error(`The synthetic run ended as ${state.status}: ${state.reason ?? ""}`);
  return run;
}

const connectedReady = async (page) => {
  await page
    .waitForFunction(() => {
      const m = document.querySelector("main");
      return !!m && !/Loading report/.test(m.innerText) && !!m.querySelector('nav[aria-label="Report sections"]');
    })
    .catch(() => {});
  await page.waitForFunction(() => !/\bLoading\b/.test(document.querySelector("main")?.innerText ?? ""), null, { timeout: 4000 }).catch(() => {});
};

async function navLinks(page, url, label, ready) {
  await page.goto("about:blank");
  await page.goto(url, { waitUntil: "load" });
  await ready(page);
  await settle(page);
  return page.evaluate((l) => [...document.querySelectorAll(`nav[aria-label="${l}"] a`)].map((a) => ({ href: a.getAttribute("href"), text: a.textContent.replace(/\s+/g, " ").trim() })), label);
}

async function selectCase(page, k) {
  const radios = page.locator('main [role=radiogroup][aria-label="Forecast case"] input[type=radio], main [role=radiogroup][aria-label="Case"] input[type=radio]');
  const radio = radios.nth(k);
  await radio.focus();
  await page.keyboard.press("Space");
  if (!(await radio.isChecked())) throw new Error(`case ${k} did not become checked`);
}

async function caseChoices(page, url, ready) {
  await page.goto("about:blank");
  await page.goto(url, { waitUntil: "load" });
  await ready(page);
  return page.evaluate(() =>
    [...document.querySelectorAll('main [role=radiogroup][aria-label="Forecast case"] input[type=radio], main [role=radiogroup][aria-label="Case"] input[type=radio]')].map((r) => ({
      label: (r.labels?.[0]?.innerText ?? "").split("\n")[0].trim().slice(0, 40),
      checked: r.checked,
    })),
  );
}

async function captureConnected(browser) {
  const dir = path.join(outDir, "connected");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  let service = null;
  let root = null;
  let endpoint = process.env.FID_ATTACH ?? null;
  let run = process.env.FID_RUN ?? null;
  const workers = await newWorkers(browser, CONCURRENCY);
  try {
    if (!endpoint) {
      root = mkdtempSync("/tmp/fid-");
      if (root.length > 80) throw new Error(`The service root is too long: ${root}`);
      service = startService(root);
      endpoint = await service.endpoint;
      console.log(`connected: service at ${endpoint}, root ${root}`);
    }
    if (!run) {
      const page = workers[0].page;
      page.setDefaultTimeout(30000);
      run = await submitSyntheticRun(page, endpoint);
      page.setDefaultTimeout(15000);
    }
    console.log(`connected: synthetic run ${run} finished`);
    const base = `${endpoint.replace(/\/$/, "")}/report/${run}`;
    const modules = await navLinks(workers[0].page, `${base}#modules`, "Modules and sections", connectedReady);
    const evidence = await navLinks(workers[0].page, `${base}#evidence`, "Evidence sections", connectedReady);
    const forecastCases = await caseChoices(workers[0].page, `${base}#forecast`, connectedReady);
    const screens = [
      { id: "overview", address: "#overview" },
      { id: "changes", address: "#changes" },
      { id: "modules--default", address: "#modules" },
      ...modules.map((m) => ({ id: `modules--${m.href.replace("#modules/", "")}`, address: m.href, title: m.text })),
      { id: "forecast", address: "#forecast" },
      ...forecastCases.flatMap((c, k) => (c.checked ? [] : [{ id: `forecast--case-${slug(c.label)}`, address: "#forecast", variant: `Forecast case: ${c.label}`, caseIndex: k }])),
      ...evidence.map((e) => ({ id: `evidence--${e.href.replace("#evidence/", "")}`, address: e.href, title: e.text })),
      { id: "history", address: "#history", extra: true },
      { id: "calendar", address: "#calendar", extra: true },
    ]
      .filter((s) => !ONLY || s.id.includes(ONLY))
      .map((s) => ({ ...s, surface: "connected", url: `${base}${s.address}` }));
    const done = await pool(screens, workers, async (screen, page) => {
      try {
        const rec = await captureScreen(page, screen, { ready: connectedReady, prepare: screen.caseIndex === undefined ? null : (p) => selectCase(p, screen.caseIndex) });
        return rec;
      } catch (e) {
        console.error(`connected ${screen.id}: ${e.message.split("\n")[0]}`);
        return { ...screen, failed: String(e.message).split("\n")[0] };
      }
    });
    const normalise = normaliser([run]);
    for (const rec of done) {
      if (rec.failed) continue;
      const { file, counts } = writeScreen(dir, rec, normalise);
      console.log(`connected ${rec.id}: ${counts.textRuns} runs, ${counts.figures} figures, ${counts.traceDrawers} drawers -> ${file}`);
    }
    const failed = done.filter((r) => r.failed);
    writeFileSync(
      path.join(dir, "_surface.json"),
      toJson({
        surface: "connected",
        data: "proof.serve synthetic run of Northbridge Synthetic Group, as of 2025-03-31, Full credit assessment; the three files under proof/ uploaded and northbridge-credit-agreement.txt chosen as the executed agreement",
        service: "proof.serve on its own root under /tmp/fid-*, port " + PORT,
        failed: failed.map((r) => ({ id: r.id, error: r.failed })),
      }),
    );
    return failed.length;
  } finally {
    for (const w of workers) await w.context.close().catch(() => {});
    if (service) await service.stop().catch(() => {});
    if (root) rmSync(root, { recursive: true, force: true });
  }
}

// ---- static surface ------------------------------------------------------------------------------
const staticReady = async (page) => {
  await page.waitForFunction(() => (document.querySelector("main")?.innerText.trim().length ?? 0) > 0, null, { timeout: 8000 }).catch(() => {});
};

async function captureStatic(browser) {
  const dir = path.join(outDir, "static");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);
  const tmp = mkdtempSync("/tmp/fid-s-");
  const workers = await newWorkers(browser, CONCURRENCY);
  try {
    cpSync(path.join(web, "dist"), tmp, { recursive: true });
    writeDataFile(tmp, path.join(web, "fixtures"));
    const index = pathToFileURL(path.join(tmp, "index.html")).href;
    const fx = (g) => JSON.parse(readFileSync(path.join(web, "fixtures", `${g}.json`), "utf8"));
    const enc = encodeURIComponent;
    const issuers = fx("library").slice.issuers;
    const models = fx("model").slice.runs;
    const screens = [];
    const add = (id, address, extra) => screens.push({ id, address, extra, surface: "static", url: `${index}#${address}` });
    add("library--home", "/library/home", true);
    for (const i of issuers) if (i.runs?.length) add(`library--${i.id}--history`, `/library/${enc(i.id)}/history`, true);
    for (const i of issuers) {
      for (const r of i.runs ?? []) {
        const base = `/library/${enc(i.id)}/${enc(r.id)}`;
        const prefix = `library--${i.id}--${r.id}`;
        add(`${prefix}--overview`, `${base}/overview`);
        add(`${prefix}--changes`, `${base}/changes`);
        add(`${prefix}--modules`, `${base}/modules`);
        const mods = await navLinks(workers[0].page, `${index}#${base}/modules`, "Modules and sections", staticReady);
        for (const m of mods) add(`${prefix}--modules--${m.href.split("/modules/")[1]}`, m.href.replace(/^#/, ""));
        const tabs = await navLinks(workers[0].page, `${index}#${base}/evidence`, "Evidence sections", staticReady);
        for (const t of tabs) add(`${prefix}--evidence--${t.href.split("/evidence/")[1]}`, t.href.replace(/^#/, ""));
      }
    }
    add("model--runs", "/model/runs", true);
    for (const r of models) {
      for (const p of ["front", "analysis", "statements", "portfolio-fit", "limitations", "forecast"]) {
        add(`model--${r.issuer}--${r.run}--${p}`, `/model/${enc(r.issuer)}/${enc(r.run)}/${p}`);
      }
    }
    const wanted = screens.filter((s) => !ONLY || s.id.includes(ONLY));
    // A second capture of every page that has a case choice, with the other case selected.
    const withCases = [];
    for (const s of wanted.filter((x) => x.id.endsWith("--statements"))) {
      const choices = await caseChoices(workers[0].page, s.url, staticReady);
      choices.forEach((c, k) => {
        if (!c.checked) withCases.push({ ...s, id: `${s.id}--case-${slug(c.label)}`, variant: `Case: ${c.label}`, caseIndex: k, extra: false });
      });
    }
    const all = [...wanted, ...withCases];
    const done = await pool(all, workers, async (screen, page) => {
      try {
        return await captureScreen(page, screen, { ready: staticReady, prepare: screen.caseIndex === undefined ? null : (p) => selectCase(p, screen.caseIndex) });
      } catch (e) {
        console.error(`static ${screen.id}: ${e.message.split("\n")[0]}`);
        return { ...screen, failed: String(e.message).split("\n")[0] };
      }
    });
    const normalise = normaliser();
    for (const rec of done) {
      if (rec.failed) continue;
      const { file, counts } = writeScreen(dir, rec, normalise);
      console.log(`static ${rec.id}: ${counts.textRuns} runs, ${counts.figures} figures, ${counts.traceDrawers} drawers -> ${file}`);
    }
    const failed = done.filter((r) => r.failed);
    writeFileSync(
      path.join(dir, "_surface.json"),
      toJson({
        surface: "static",
        data: "web/dist copied to a temporary folder, data.js written by web/scripts/fixture-data.mjs from web/fixtures/*.json (the stage 0 'fixture' variant)",
        failed: failed.map((r) => ({ id: r.id, error: r.failed })),
      }),
    );
    return failed.length;
  } finally {
    for (const w of workers) await w.context.close().catch(() => {});
    rmSync(tmp, { recursive: true, force: true });
  }
}

// ---- main ----------------------------------------------------------------------------------------
mkdirSync(outDir, { recursive: true });
const browser = await launch();
let failures = 0;
try {
  if (surfaceArg !== "static") failures += await captureConnected(browser);
  if (surfaceArg !== "connected") failures += await captureStatic(browser);
} finally {
  await browser.close();
}
const info = treeInfo();
const surfaces = writeIndex();
const indexPath = path.join(outDir, "index.json");
const written = JSON.parse(readFileSync(indexPath, "utf8"));
writeFileSync(indexPath, toJson({ ...written, tree: info }));
for (const [name, s] of Object.entries(surfaces)) {
  console.log(`${name}: ${s.screens} screens (${s.screensNotExtra} asked for), ${s.figures} figures, ${s.sourceLines} source lines on screen, ${s.drawerLines} in source drawers, ${s.limitationSentences} limitation sentences`);
}
if (failures) {
  console.error(`${failures} screen(s) failed; see index.json and the _surface.json files`);
  process.exitCode = 1;
}
