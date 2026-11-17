// Stage 0, static surface: clickable inventory (step 6), screenshots (step 7) and the in-browser
// offline check (step 8) of web/dist/index.html opened from disk.
// Usage (from the repo root): node docs/audit/2026-11-16-final/output/0-baseline/probes/static/crawl.mjs <outDir>
// Env: ONLY=<substring> limits addresses; NO_SHOTS=1 skips screenshots; VARIANTS=shipped,fixture.
// Two data variants:
//   shipped: web/dist as built (its data.js is web/public/data.js, which holds no issuers);
//   fixture: a copy of web/dist in <outDir>/dist-fixture whose data.js is written by
//            web/scripts/fixture-data.mjs from web/fixtures/*.json (web/dist is not touched).
// Signal routes are never visited. Loops are capped at 1,000.
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
const { chromium } = require("playwright");
const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);

const outDir = path.resolve(process.argv[2] ?? "audit-static-out");
const shotsDir = path.join(outDir, "screens", "static");
mkdirSync(shotsDir, { recursive: true });
const CAP = 1000;
const OPENER_CAP = 1000;
const ONLY = process.env.ONLY;
const VARIANTS = (process.env.VARIANTS ?? "shipped,fixture").split(",");

// ---- variants -------------------------------------------------------------------------------
const fixtureDist = path.join(outDir, "dist-fixture");
if (VARIANTS.includes("fixture")) {
  rmSync(fixtureDist, { recursive: true, force: true });
  cpSync(path.join(web, "dist"), fixtureDist, { recursive: true });
  writeDataFile(fixtureDist, path.join(web, "fixtures"));
}
const variantRoot = {
  shipped: pathToFileURL(path.join(web, "dist", "index.html")).href,
  fixture: pathToFileURL(path.join(fixtureDist, "index.html")).href,
};

// ---- addresses ------------------------------------------------------------------------------
const fx = (g) => JSON.parse(readFileSync(path.join(web, "fixtures", `${g}.json`), "utf8"));
const lib = fx("library");
const model = fx("model");
const run = fx("run");
const enc = encodeURIComponent;

function libraryAddresses() {
  const out = ["/library/home"];
  const issuers = lib.slice.issuers;
  for (const i of issuers) out.push(`/library/${enc(i.id)}/history`);
  for (const i of issuers) {
    for (const r of i.runs ?? []) {
      const base = `/library/${enc(i.id)}/${enc(r.id)}`;
      for (const p of ["overview", "changes", "modules", "evidence", "evidence/summary",
        "evidence/sources", "evidence/trace", "evidence/record", "evidence/gaps"]) out.push(`${base}/${p}`);
    }
  }
  // every module of one issuer-run (halden 2026-09-30) plus the other runs' modules
  for (const i of issuers) {
    for (const r of i.runs ?? []) {
      for (const m of r.modules ?? []) {
        const id = m.id ?? m.module;
        if (id) out.push(`/library/${enc(i.id)}/${enc(r.id)}/modules/${enc(id)}`);
      }
    }
  }
  // trace and gap items present in the fixture for the latest halden run
  const halden = issuers.find((i) => i.id === "halden-aerostructures");
  const latest = halden.runs[0];
  for (const t of Object.keys(latest.traces ?? {})) out.push(`/library/halden-aerostructures/${latest.id}/evidence/trace/${enc(t)}`);
  for (const g of latest.evidence?.gaps?.items ?? latest.evidence?.gaps?.rows ?? []) {
    if (g.id) out.push(`/library/halden-aerostructures/${latest.id}/evidence/gaps/${enc(g.id)}`);
  }
  return out;
}

function fromParams(fixture) {
  const out = [];
  for (const [pattern, sets] of Object.entries(fixture.params ?? {})) {
    for (const set of sets) {
      out.push(pattern.split("/").map((s) => (s.startsWith(":") ? enc(set[s.slice(1)] ?? "") : s)).join("/"));
    }
  }
  return out;
}

const seeds = [
  "", "/", "/library", "/model", "/run", "/kit",
  "/no-such-page", "/library/no-such-issuer/history", "/library/no-such-issuer/no-run/overview",
  "/model/no-such-issuer/no-run/front", "/run/activity/no-such-run", "/run/start/no-such-draft",
  ...libraryAddresses(), ...fromParams(lib),
  "/model/runs", ...fromParams(model),
  "/run/activity", ...fromParams(run),
];
for (const r of model.slice.runs) {
  for (const p of ["front", "analysis", "statements", "portfolio-fit", "limitations", "forecast"]) {
    seeds.push(`/model/${enc(r.issuer)}/${enc(r.run)}/${p}`);
  }
}

// ---- classification -------------------------------------------------------------------------
function sectionOf(address) {
  if (address.startsWith("/model")) return "S5";
  if (address.startsWith("/run")) return "S6";
  if (/^\/library\/[^/]+\/[^/]+\/modules/.test(address)) return "S3";
  if (/^\/library\/[^/]+\/[^/]+\/evidence/.test(address)) return "S4";
  if (address.startsWith("/library/")) return "S2";
  return "S1";
}

// ---- browser helpers ------------------------------------------------------------------------
const blocked = [];
const otherSchemes = new Map();
function guard(context, variant) {
  return context.route("**/*", (route) => {
    const url = route.request().url();
    let ok = false;
    try {
      const u = new URL(url);
      ok = u.protocol === "file:" || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)
        || u.protocol === "data:" || u.protocol === "blob:";
      if (u.protocol === "data:" || u.protocol === "blob:") otherSchemes.set(u.protocol, (otherSchemes.get(u.protocol) ?? 0) + 1);
    } catch { ok = false; }
    if (ok) return route.continue();
    blocked.push({ variant, url, resourceType: route.request().resourceType(), page: current });
    return route.abort("blockedbyclient");
  });
}
let current = "";

const ENUM = `(() => {
  const sel = 'a[href], button, input, select, textarea, summary, details, [role=button],[role=link],[role=tab],[role=switch],[role=checkbox],[role=radio],[role=combobox],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=slider],[role=searchbox],[role=textbox],[role=spinbutton],[role=treeitem],[role=gridcell][tabindex],[role=row][tabindex],[role=listbox],[role=dialog],[role=alertdialog],[aria-sort],[tabindex]:not([tabindex="-1"]),[aria-haspopup]:not([aria-haspopup=false]),[aria-expanded],[contenteditable=true],[draggable=true],[data-drop-target],.react-aria-DropZone,[class*=recharts-legend-item]';
  document.querySelectorAll('[data-audit-i]').forEach((e) => e.removeAttribute('data-audit-i'));
  const els = [...document.querySelectorAll(sel)].filter((e) => {
    if (e.closest('[inert]')) return false;
    if (e.tagName === 'INPUT' && e.type === 'hidden') return false;
    if (e.tagName === 'DETAILS') return false;
    return e.checkVisibility ? e.checkVisibility({ visibilityProperty: true }) : true;
  });
  return els.map((e, i) => {
    e.setAttribute('data-audit-i', String(i));
    const inShell = !!e.closest('aside') || (e.tagName === 'A' && e.getAttribute('href') === '#main');
    const inDialog = !!e.closest('[role=dialog],[role=alertdialog]');
    const r = e.getBoundingClientRect();
    return { i, tag: e.tagName.toLowerCase(), type: e.getAttribute('type'), href: e.getAttribute('href'),
      expanded: e.getAttribute('aria-expanded'), haspopup: e.getAttribute('aria-haspopup'),
      selected: e.getAttribute('aria-selected'), roleAttr: e.getAttribute('role'), id: e.id || null,
      testid: e.getAttribute('data-testid'), disabled: e.disabled === true || e.getAttribute('aria-disabled') === 'true',
      inShell, inDialog, w: Math.round(r.width), h: Math.round(r.height),
      text: (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 80) };
  });
})()`;

async function axNames(page, cdp) {
  // Chrome's own computed role and name for each marked element.
  const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: "[data-audit-i]" });
  const ax = await cdp.send("Accessibility.getFullAXTree");
  const byBackend = new Map(ax.nodes.filter((n) => n.backendDOMNodeId).map((n) => [n.backendDOMNodeId, n]));
  const out = new Map();
  for (const nodeId of nodeIds.slice(0, CAP)) {
    let node;
    try {
      ({ node } = await cdp.send("DOM.describeNode", { nodeId }));
    } catch {
      continue; // the node left the document while it was being read
    }
    const attrs = node.attributes ?? [];
    const idx = Number(attrs[attrs.indexOf("data-audit-i") + 1]);
    const a = byBackend.get(node.backendNodeId);
    out.set(idx, { role: a?.role?.value ?? null, name: a?.name?.value ?? "" });
  }
  return out;
}

const PW_ROLE = new Set(["link", "button", "tab", "switch", "checkbox", "radio", "combobox", "menuitem",
  "menuitemcheckbox", "menuitemradio", "option", "slider", "searchbox", "textbox", "spinbutton", "treeitem",
  "gridcell", "row", "grid", "treegrid", "listbox", "dialog", "alertdialog", "columnheader", "rowheader", "application", "region",
  "group", "img", "figure", "table", "cell", "listitem", "article", "navigation", "main", "tabpanel"]);

async function inventory(page, cdp) {
  const raw = await page.evaluate(ENUM);
  const names = await axNames(page, cdp);
  const items = raw.map((e) => {
    const ax = names.get(e.i) ?? { role: null, name: "" };
    let role = ax.role;
    if (role === "DisclosureTriangle") role = "button"; // <summary>
    if (role === "LabelText" || role === "generic" || role === "none" || role === null) role = e.roleAttr ?? role ?? "generic";
    return { ...e, role, name: ax.name };
  });
  // stable locators: getByRole + exact name, nth when shared, CSS for roles Playwright cannot query
  const groups = new Map();
  for (const it of items) {
    const key = `${it.role}\u0000${it.name}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
    it.nth = groups.get(key) - 1;
  }
  for (const it of items) {
    const n = groups.get(`${it.role}\u0000${it.name}`);
    if (PW_ROLE.has(it.role)) {
      const base = it.name
        ? `getByRole(${JSON.stringify(it.role)}, { name: ${JSON.stringify(it.name)}, exact: true })`
        : `getByRole(${JSON.stringify(it.role)})`;
      it.locator = n > 1 || !it.name ? `${base}.nth(${it.nth})` : base;
      it.pw = { role: it.role, name: it.name, nth: n > 1 || !it.name ? it.nth : null };
    } else {
      it.locator = it.id && !/react-aria|_r_|^:r|^\d/.test(it.id) ? `locator(${JSON.stringify("#" + it.id)})` : null;
      it.pw = null;
    }
  }
  // verify each role locator resolves to exactly one element (Playwright and Chrome may disagree)
  for (const it of items) {
    if (!it.pw) continue;
    let loc = it.pw.name ? page.getByRole(it.pw.role, { name: it.pw.name, exact: true }) : page.getByRole(it.pw.role);
    try {
      const count = await loc.count();
      if (it.pw.nth !== null) loc = loc.nth(it.pw.nth);
      const same = count > 0 && (await loc.evaluate((el, i) => el.getAttribute("data-audit-i") === String(i), it.i, { timeout: 500 }).catch(() => false));
      if (!same) it.locator = await cssPath(page, it.i);
      it.verified = same;
    } catch { it.locator = await cssPath(page, it.i); it.verified = false; }
  }
  for (const it of items) if (!it.locator) it.locator = await cssPath(page, it.i);
  return items;
}

async function cssPath(page, i) {
  const css = await page.evaluate((i) => {
    const el = document.querySelector(`[data-audit-i="${i}"]`);
    if (!el) return null;
    const parts = [];
    let e = el;
    while (e && e.nodeType === 1 && e !== document.body) {
      if (e.id && !/react-aria|_r_|^:r|^\d/.test(e.id)) { parts.unshift(`#${CSS.escape(e.id)}`); break; }
      const tag = e.tagName.toLowerCase();
      const sibs = [...(e.parentElement?.children ?? [])].filter((s) => s.tagName === e.tagName);
      parts.unshift(sibs.length > 1 ? `${tag}:nth-of-type(${sibs.indexOf(e) + 1})` : tag);
      e = e.parentElement;
    }
    return parts.join(" > ");
  }, i);
  return css ? `locator(${JSON.stringify(css)})` : null;
}

async function settle(page) {
  await page.waitForFunction(() => (document.getElementById("root")?.childElementCount ?? 0) > 0, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(150);
}

async function open(page, url) {
  await page.goto("about:blank");
  await page.goto(url, { waitUntil: "load" });
  await settle(page);
}

function stateOf(variant, address, page) {
  return page.evaluate(([variant, address]) => {
    const text = document.querySelector("main")?.innerText ?? "";
    if (/Page not found|No page has this address/.test(text)) return "error";
    if (/could not be read|unreadable|failed|Failed to/i.test(text) && /\/(failed|unreadable)$/.test(address)) return "error";
    if (/could not be read/i.test(text)) return "error";
    if (variant === "shipped") return "empty"; // the shipped data.js holds no issuers and no slices
    if (/Loading|loading/.test(text) && /2026-06-30/.test(address)) return "loading";
    if (/no-such|T-9999|G-99/.test(address) || /not found|No such|does not exist|isn't|is not in/i.test(text.slice(0, 600))) return "error";
    if (/\/(none|no-documents)$/.test(address) || /No runs yet|nothing to read|No report for this issuer/i.test(text)) return "empty";
    if (/\/(capped|rejected|interrupted|failed)$/.test(address)) return "partial";
    return "full";
  }, [variant, address]);
}

const safe = (s) => (s || "root").replace(/^\//, "").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 140) || "root";

// ---- main -----------------------------------------------------------------------------------
// chromium.launch() with no options looks for the browser build its own version expects; when
// that build is absent, fall back to CHROMIUM_PATH or the headless shell under PLAYWRIGHT_BROWSERS_PATH.
async function launch() {
  try {
    return await chromium.launch();
  } catch (error) {
    const { readdirSync, existsSync } = await import("node:fs");
    const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
    const candidates = [process.env.CHROMIUM_PATH,
      ...(existsSync(root) ? readdirSync(root).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse()
        .map((d) => path.join(root, d, "chrome-headless-shell-linux64", "chrome-headless-shell")) : [])]
      .filter((c) => c && existsSync(c));
    if (candidates.length === 0) throw error;
    console.error(`chromium.launch() failed (${String(error.message).split("\n")[0]}); using ${candidates[0]}`);
    return chromium.launch({ executablePath: candidates[0] });
  }
}
const browser = await launch();
const clickables = [];
const screens = [];
const visited = [];
const notes = [];
let openerClicks = 0;
const exploredSignatures = new Set();

for (const variant of VARIANTS) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await guard(context, variant);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push({ variant, page: current, text: m.text().slice(0, 300) }); });
  page.on("pageerror", (e) => consoleErrors.push({ variant, page: current, text: `pageerror: ${e.message.slice(0, 300)}` }));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (!u.startsWith("file:") && !u.startsWith("data:")) return;
    if (u.startsWith("file:")) notes.push(`requestfailed (${variant}, ${current}): ${u} ${r.failure()?.errorText}`);
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("Accessibility.enable");

  const queue = [...new Set(seeds)].filter((a) => !a.startsWith("/signal") && (!ONLY || a.includes(ONLY)));
  const seen = new Set(queue);
  for (let qi = 0; qi < queue.length && qi < CAP; qi++) {
    const address = queue[qi];
    current = `#${address}`;
    const url = `${variantRoot[variant]}#${address}`;
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, url);
    const state = await stateOf(variant, address, page);
    const section = sectionOf(address);
    const title = await page.evaluate(() => document.querySelector("h1")?.innerText?.trim() ?? null);
    visited.push({ variant, address: `#${address}`, section, state, h1: title });

    // discover in-app hash links
    const hrefs = await page.evaluate(() => [...document.querySelectorAll("a[href^='#/']")].map((a) => a.getAttribute("href")));
    for (const h of hrefs) {
      const a = h.slice(1);
      if (a.startsWith("/signal")) continue;
      if (!seen.has(a) && seen.size < CAP && !ONLY) { seen.add(a); queue.push(a); }
    }

    const base = await inventory(page, cdp);
    const sig = base.map((b) => `${b.role}|${b.name}`).join("\n");
    const pattern = address.replace(/^\/(library|model)\/[^/]+\/[^/]+/, "/$1/:i/:r").replace(/^\/library\/[^/]+\/history/, "/library/:i/history");
    for (const it of base) {
      clickables.push(row(section, variant, address, state, it, null));
    }
    if (!process.env.NO_SHOTS) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
        await page.waitForTimeout(120);
        const file = `${variant}__${safe(address)}__${state}__${width}.png`;
        await page.screenshot({ path: path.join(shotsDir, file), fullPage: true });
        screens.push({ file, variant, screen: `#${address}`, state, width, revealed_by: null });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    }

    flush();
    // open every control that might reveal something (not links, not text entry), one at a time
    const sigKey = `${variant}|${pattern}|${sig}`;
    if (exploredSignatures.has(sigKey)) { notes.push(`openers skipped (same controls as an explored ${pattern}): ${variant} #${address}`); continue; }
    exploredSignatures.add(sigKey);
    const openers = base.filter((b) => !b.disabled && !b.inShell && b.role !== "link" && b.tag !== "a"
      && !(b.tag === "input" && !["checkbox", "radio", "button", "submit", "file"].includes(b.type ?? "text") && b.role !== "combobox")
      && b.tag !== "textarea" && !["textbox", "searchbox", "spinbutton", "slider", "region", "main", "tabpanel", "img", "table", "figure", "gridcell", "grid", "treegrid", "none"].includes(b.role));
    const baseKeys = new Set(base.map((b) => `${b.role}|${b.name}|${b.locator}`));
    let needReload = false;
    for (const op of openers) {
      if (openerClicks >= OPENER_CAP) { notes.push(`opener cap reached at ${variant} #${address}`); break; }
      if (needReload) { await open(page, url); needReload = false; }
      openerClicks++;
      const target = page.locator(`[data-audit-i="${op.i}"]`);
      // re-mark: the reload drops the marks
      if ((await target.count()) === 0) { await inventory(page, cdp); }
      const hashBefore = await page.evaluate(() => location.hash);
      let clicked = true;
      try {
        if (op.tag === "select") {
          await page.locator(`[data-audit-i="${op.i}"]`).click({ timeout: 1500 });
        } else {
          await page.locator(`[data-audit-i="${op.i}"]`).click({ timeout: 1500 });
        }
      } catch (e) { clicked = false; notes.push(`could not click ${op.locator} on ${variant} #${address}: ${String(e.message).split("\n")[0]}`); }
      await page.waitForTimeout(200);
      const hashAfter = await page.evaluate(() => location.hash);
      if (clicked) {
        const after = await inventory(page, cdp);
        const fresh = after.filter((a) => !baseKeys.has(`${a.role}|${a.name}|${a.locator}`));
        const dialog = await page.evaluate(() => !!document.querySelector("[role=dialog],[role=alertdialog]"));
        for (const it of fresh) clickables.push(row(section, variant, address, state, it, op.locator));
        if (hashAfter !== hashBefore) notes.push(`click ${op.locator} on ${variant} #${address} changed the hash to ${hashAfter}`);
        if ((fresh.length > 0 || dialog) && !process.env.NO_SHOTS && hashAfter === hashBefore) {
          const file = `${variant}__${safe(address)}__${state}__open-${safe(op.name || op.role).slice(0, 40)}-${op.i}__1440.png`;
          await page.screenshot({ path: path.join(shotsDir, file), fullPage: true });
          screens.push({ file, variant, screen: `#${address}`, state, width: 1440, revealed_by: op.locator });
        }
      }
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(80);
      const now = await inventory(page, cdp);
      const nowSig = now.map((b) => `${b.role}|${b.name}`).join("\n");
      if (nowSig !== sig || (await page.evaluate(() => location.hash)) !== hashBefore) needReload = true;
    }
  }
  writeFileSync(path.join(outDir, `static-console-${variant}.json`), JSON.stringify(consoleErrors, null, 1));
  await context.close();
}
await browser.close();

function row(section, variant, address, state, it, revealedBy) {
  return {
    section: it.inShell ? "S1" : section,
    surface: "static",
    screen: `#${address}`,
    state,
    role: it.role,
    name: it.name,
    locator: it.locator,
    revealed_by: revealedBy,
    data: variant === "shipped" ? "shipped data.js (no issuers)" : "fixture data.js (web/fixtures)",
    tag: it.tag,
    in_dialog: it.inDialog || undefined,
    locator_verified: it.verified,
  };
}

flush();
console.log(JSON.stringify({ visited: visited.length, screens: screens.length, blocked: blocked.length, openerClicks, otherSchemes: Object.fromEntries(otherSchemes) }));

// Written after every screen, so a run that is stopped keeps what it reached.
function flush() {
// dedupe rows (same screen, data, role, name, locator, revealed_by)
const uniq = new Map();
for (const c of clickables) uniq.set(JSON.stringify([c.data, c.screen, c.role, c.name, c.locator, c.revealed_by]), c);
writeFileSync(path.join(outDir, "clickables-static.jsonl"), [...uniq.values()].map((c) => JSON.stringify(c)).join("\n") + "\n");
writeFileSync(path.join(outDir, "static-visited.json"), JSON.stringify(visited, null, 1));
writeFileSync(path.join(outDir, "static-screens.json"), JSON.stringify(screens, null, 1));
writeFileSync(path.join(outDir, "static-blocked.json"), JSON.stringify({ blocked, otherSchemes: Object.fromEntries(otherSchemes) }, null, 1));
writeFileSync(path.join(outDir, "static-crawl-notes.txt"), notes.join("\n") + "\n");
}
