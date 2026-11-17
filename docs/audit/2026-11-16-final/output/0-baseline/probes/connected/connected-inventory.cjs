// Stage 0, connected surface: clickable inventory (step 6), screenshots (step 7) and the
// browser half of the offline check (step 8).
//
// Run from the repository root (needs `npm --prefix web run build` done earlier):
//   STAGE0_OUT=/some/scratch/dir node docs/audit/2026-11-16-final/output/0-baseline/probes/connected/connected-inventory.cjs
//
// It starts `python -m proof.serve` (synthetic, canned handoffs, outbound network patched off in
// the engine child) on its own port with a new empty run root, drives two synthetic runs through
// the UI, and stops the service at the end. No paid call: proof.serve sets a dummy key and the
// launcher (proof/launcher.py) patches LiveAdapter.complete and socket.connect.
//
// Outputs under STAGE0_OUT (default: <os tmpdir>/stage0-connected):
//   clickables-connected.jsonl, screens/connected/*.png, offline-browser-connected.json,
//   probe-log-connected.json
"use strict";

const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { createRequire } = require("node:module");

const REPO = process.cwd();
if (!fs.existsSync(path.join(REPO, "proof", "serve.py"))) {
  throw new Error("run from the repository root");
}
const { chromium } = createRequire(path.join(REPO, "web", "package.json"))("playwright");

const OUT = process.env.STAGE0_OUT || path.join(os.tmpdir(), "stage0-connected");
const PORT = Number(process.env.STAGE0_PORT || 8752);
const SHOTS = path.join(OUT, "screens", "connected");
fs.mkdirSync(SHOTS, { recursive: true });
const JSONL = path.join(OUT, "clickables-connected.jsonl");
fs.writeFileSync(JSONL, "");

// Every loop below has its own bound (at most 150 iterations); this is a runaway guard.
const LOOP_CAP = 20000;
let loops = 0;
const tick = () => {
  loops += 1;
  if (loops > LOOP_CAP) throw new Error("loop cap reached");
};

const log = { screens: [], shots: [], blocked: [], websockets: [], consoleErrors: [], notes: [] };
const seen = new Set();
let clickableCount = 0;

// ---------------------------------------------------------------- service
async function startService() {
  // The run root must be short (src/deploy_workflow/inbox/layout.py caps it at 80 characters).
  const root = fs.mkdtempSync(path.join("/tmp", "cos2-s0c-"));
  const child = spawn(
    "uv",
    ["run", "--locked", "python", "-m", "proof.serve", "--root", root, "--port", String(PORT)],
    { cwd: REPO, env: { ...process.env, PYTHONPATH: "src", PYTHONUNBUFFERED: "1" }, detached: true },
  );
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  for (let i = 0; i < 120; i += 1) {
    tick();
    if (output.includes(`http://127.0.0.1:${PORT}/`)) return { child, root };
    if (child.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`proof.serve did not start:\n${output}`);
}

function stopService(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    /* already stopped */
  }
}

// ---------------------------------------------------------------- offline routing
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
async function guard(context) {
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = request.url();
    let host = "";
    try {
      const u = new URL(url);
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      host = u.hostname;
    } catch {
      /* unparsable */
    }
    if (LOOPBACK.has(host)) return route.continue();
    const frame = request.frame();
    log.blocked.push({ url, page: frame ? frame.url() : null, type: request.resourceType() });
    return route.abort("blockedbyclient");
  });
  context.on("page", watchPage);
}
function watchPage(page) {
  page.on("websocket", (ws) => log.websockets.push({ url: ws.url(), page: page.url() }));
  page.on("console", (m) => {
    if (m.type() === "error") log.consoleErrors.push({ page: page.url(), text: m.text() });
  });
}

// ---------------------------------------------------------------- inventory
function sectionFor(screen, inDialog, region) {
  if (region === "shell") return "X1";
  if (screen.startsWith("/start")) return "C2";
  if (!screen.startsWith("/report/")) return "C1";
  if (region === "header") return "C1";
  const hash = screen.split("#")[1] || "overview";
  if (inDialog) return "C5";
  if (/^(forecast|calendar)/.test(hash)) return "C4";
  if (/^evidence/.test(hash)) return "C5";
  return "C3";
}

// Collects interactive elements in the page; runs in the browser.
function collect() {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const text = (el) => norm(el.innerText || el.textContent || "");
  const byIds = (ids) =>
    ids
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((e) => norm(e.textContent))
      .join(" ");
  const nameOf = (el) => {
    if (el.getAttribute("aria-labelledby")) return byIds(el.getAttribute("aria-labelledby"));
    if (el.getAttribute("aria-label")) return norm(el.getAttribute("aria-label"));
    const tag = el.tagName.toLowerCase();
    if (["input", "select", "textarea"].includes(tag)) {
      if (el.id) {
        const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (l) return text(l);
      }
      const wrap = el.closest("label");
      if (wrap) return text(wrap);
      if (el.type === "button" || el.type === "submit") return norm(el.value);
      return norm(el.getAttribute("title") || el.getAttribute("placeholder") || "");
    }
    if (tag === "img") return norm(el.getAttribute("alt"));
    if (["dialog", "section", "nav", "figure", "details", "div", "form"].includes(tag)) {
      return norm(el.getAttribute("title") || "");
    }
    return text(el) || norm(el.getAttribute("title") || "");
  };
  const roleOf = (el) => {
    const explicit = (el.getAttribute("role") || "").split(/\s+/)[0];
    if (explicit && explicit !== "presentation" && explicit !== "none") return explicit;
    const tag = el.tagName.toLowerCase();
    if (tag === "a") return el.hasAttribute("href") ? "link" : null;
    if (tag === "button") return "button";
    if (tag === "summary") return "summary";
    if (tag === "details") return "details";
    if (tag === "dialog") return "dialog";
    if (tag === "select") return el.multiple || el.size > 1 ? "listbox" : "combobox";
    if (tag === "textarea") return "textbox";
    if (tag === "input") {
      const t = (el.type || "text").toLowerCase();
      if (t === "hidden") return null;
      if (t === "file") return "file-input";
      if (t === "checkbox") return "checkbox";
      if (t === "radio") return "radio";
      if (t === "range") return "slider";
      if (t === "number") return "spinbutton";
      if (["button", "submit", "reset", "image"].includes(t)) return "button";
      if (t === "search") return "searchbox";
      return "textbox";
    }
    if (el.tabIndex >= 0 && el.hasAttribute("tabindex")) return "focusable";
    return null;
  };
  const keep = new Set([
    "link", "button", "checkbox", "radio", "switch", "tab", "combobox", "listbox", "textbox",
    "searchbox", "spinbutton", "slider", "menuitem", "menuitemcheckbox", "menuitemradio",
    "summary", "details", "dialog", "alertdialog", "file-input", "focusable", "option", "tablist",
    "radiogroup", "menu", "treeitem", "gridcell", "row",
  ]);
  const candidates = document.querySelectorAll(
    "a, button, input, select, textarea, summary, details, dialog, [role], [tabindex], [contenteditable='true']",
  );
  const items = [];
  for (const el of candidates) {
    const role = roleOf(el);
    if (!role || !keep.has(role)) continue;
    if (role === "option" && el.tagName.toLowerCase() === "option") continue;
    if (["row", "gridcell"].includes(role) && !(el.tabIndex >= 0 || el.onclick)) continue;
    const visible = el.checkVisibility ? el.checkVisibility() : el.offsetParent !== null;
    if (!visible && role !== "file-input") continue;
    if (el.closest("[aria-hidden='true']") && role !== "file-input") continue;
    const inDialog = Boolean(el.closest("[role='dialog'], dialog, [role='alertdialog']"));
    let region = "body";
    if (el.closest("aside") && el.closest("aside").querySelector("nav[aria-label='Areas']")) region = "shell";
    if (el.matches("a[href='#main']")) region = "shell";
    const reportNav = document.querySelector("nav[aria-label='Report']");
    if (!inDialog && reportNav && region === "body") {
      // header = anything up to and including the report tabs and the calendar link
      const pos = reportNav.compareDocumentPosition(el);
      if (reportNav.contains(el) || pos & Node.DOCUMENT_POSITION_PRECEDING) region = "header";
    }
    const extra = {};
    for (const a of ["aria-expanded", "aria-haspopup", "aria-controls", "aria-pressed", "aria-checked", "disabled", "href", "type"]) {
      if (el.hasAttribute(a)) extra[a] = el.getAttribute(a);
    }
    if (el.tagName.toLowerCase() === "details") extra.open = el.open;
    items.push({ role, name: nameOf(el).slice(0, 160), inDialog, region, extra, tag: el.tagName.toLowerCase() });
  }
  // Drop zones: React handlers are not visible in the DOM; find them by their label text.
  for (const el of document.querySelectorAll("*")) {
    if (el.children.length === 0 && /^Drop files here$/.test(norm(el.textContent))) {
      items.push({ role: "drop-zone", name: "Drop files here", inDialog: false, region: "body", extra: {}, tag: el.tagName.toLowerCase() });
    }
  }
  return items;
}

const quote = (s) => JSON.stringify(s);
const ROLE_QUERYABLE = new Set([
  "link", "button", "checkbox", "radio", "switch", "tab", "combobox", "listbox", "textbox",
  "searchbox", "spinbutton", "slider", "menuitem", "menuitemcheckbox", "menuitemradio",
  "dialog", "alertdialog", "option", "tablist", "radiogroup", "menu", "treeitem", "row", "gridcell",
]);

function baseLocator(item) {
  if (item.role === "file-input") return `locator('input[type=file]')`;
  if (item.role === "drop-zone") return `getByText('Drop files here', { exact: true })`;
  if (item.role === "summary") return `locator('summary').filter({ hasText: ${quote(item.name)} })`;
  if (item.role === "details") return `locator('details')`;
  if (item.role === "focusable") return `locator('[tabindex="0"]')`;
  if (ROLE_QUERYABLE.has(item.role)) {
    return item.name
      ? `getByRole('${item.role}', { name: ${quote(item.name)}, exact: true })`
      : `getByRole('${item.role}')`;
  }
  return `locator('[role="${item.role}"]')`;
}

async function inventory(page, { screen, state, revealedBy = null, known = null }) {
  const items = await page.evaluate(collect);
  const counts = new Map();
  const out = [];
  for (const item of items) {
    const base = baseLocator(item);
    const n = counts.get(base) || 0;
    counts.set(base, n + 1);
    item.base = base;
    item.index = n;
  }
  const keys = new Set();
  for (const item of items) {
    const total = counts.get(item.base);
    const locator = `page.${item.base}${total > 1 ? `.nth(${item.index})` : ""}`;
    const key = `${item.role}|${item.name}|${locator}`;
    keys.add(key);
    if (known && known.has(key)) continue;
    const row = {
      section: sectionFor(screen, item.inDialog, item.region),
      surface: "connected",
      screen,
      state,
      role: item.role,
      name: item.name,
      locator,
      revealed_by: revealedBy,
    };
    if (Object.keys(item.extra).length) row.attributes = item.extra;
    if (item.inDialog) row.in_dialog = true;
    const dedupe = JSON.stringify([screen, state, row.locator, row.name, revealedBy]);
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(row);
  }
  if (out.length) fs.appendFileSync(JSONL, out.map((r) => JSON.stringify(r)).join("\n") + "\n");
  clickableCount += out.length;
  return keys;
}

// ---------------------------------------------------------------- screenshots
async function shoot(page, name, { widths = [1440, 390], element = null } = {}) {
  for (const width of widths) {
    tick();
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.waitForTimeout(250);
    const file = path.join(SHOTS, `${name}--${width}.png`);
    try {
      if (element) await element.screenshot({ path: file });
      else await page.screenshot({ path: file, fullPage: true });
      log.shots.push({ file: path.basename(file), screen: page.url().replace(/^https?:\/\/[^/]+/, ""), name, width });
    } catch (e) {
      log.notes.push(`screenshot ${name} at ${width} failed: ${e.message.split("\n")[0]}`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

// ---------------------------------------------------------------- disclosure exploration
async function settle(page, ms = 400) {
  await page.waitForTimeout(ms);
}

async function closeDialogs(page) {
  for (let i = 0; i < 3; i += 1) {
    tick();
    if ((await page.getByRole("dialog").count()) === 0) return;
    await page.keyboard.press("Escape");
    await settle(page, 300);
  }
}

// Opens every closed <details>, every aria-expanded=false button and every "Show sources" trace
// control, records what each reveals, then closes it again. Never clicks navigation, submit or
// removal controls.
async function explore(page, { screen, state, shotPrefix, maxOpeners = 120 }) {
  const known = await inventory(page, { screen, state });
  // details / summary
  const summaries = page.locator("details:not([open]) > summary");
  const sCount = Math.min(await summaries.count(), maxOpeners);
  const summaryNames = [];
  for (let i = 0; i < sCount; i += 1) summaryNames.push((await summaries.nth(i).innerText()).replace(/\s+/g, " ").trim());
  for (const [i, name] of summaryNames.entries()) {
    tick();
    const opener = page.locator("summary").filter({ hasText: name }).first();
    const loc = `page.locator('summary').filter({ hasText: ${quote(name)} })`;
    try {
      await opener.click();
      await settle(page, 250);
      await inventory(page, { screen, state, revealedBy: loc, known });
      if (i === 0 && shotPrefix) await shoot(page, `${shotPrefix}--details-open`);
      await opener.click();
      await settle(page, 150);
    } catch (e) {
      log.notes.push(`${screen}: summary ${name}: ${e.message.split("\n")[0]}`);
    }
  }
  // aria-expanded buttons and trace controls
  const openers = await page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    const out = [];
    for (const el of document.querySelectorAll("button, [role='button'], [role='tab'], [role='switch']")) {
      if (!(el.checkVisibility ? el.checkVisibility() : el.offsetParent)) continue;
      if (el.closest("[role='dialog']")) continue;
      const name = norm(el.getAttribute("aria-label") || el.innerText || el.textContent);
      if (/^(Submit run|Remove|Leave out|Carry over|Inspect documents|Choose|Delete|Cancel)/.test(name)) continue;
      const expandable = el.getAttribute("aria-expanded") === "false";
      const trace = /^Show sources for /.test(name);
      const popup = el.getAttribute("aria-haspopup");
      const tab = el.getAttribute("role") === "tab" && el.getAttribute("aria-selected") !== "true";
      if (expandable || trace || (popup && popup !== "false") || tab) out.push({ name, role: el.getAttribute("role") || "button", kind: trace ? "trace" : tab ? "tab" : "expand" });
    }
    return out;
  });
  const counts = new Map();
  let shotTrace = false;
  for (const op of openers.slice(0, maxOpeners)) {
    tick();
    const n = counts.get(op.name) || 0;
    counts.set(op.name, n + 1);
    const total = openers.filter((o) => o.name === op.name).length;
    const role = op.role === "tab" ? "tab" : "button";
    const base = page.getByRole(role, { name: op.name, exact: true });
    const target = total > 1 ? base.nth(n) : base;
    const loc = `page.getByRole('${role}', { name: ${quote(op.name)}, exact: true })${total > 1 ? `.nth(${n})` : ""}`;
    try {
      await target.scrollIntoViewIfNeeded({ timeout: 3000 });
      await target.click({ timeout: 3000 });
      await settle(page, 350);
      await inventory(page, { screen, state, revealedBy: loc, known });
      const dialogOpen = (await page.getByRole("dialog").count()) > 0;
      if (dialogOpen && !shotTrace && shotPrefix) {
        await shoot(page, `${shotPrefix}--trace-drawer`);
        shotTrace = true;
      }
      if (dialogOpen) await closeDialogs(page);
      else if (op.kind === "expand") {
        await target.click({ timeout: 3000 }).catch(() => {});
        await settle(page, 200);
      }
    } catch (e) {
      log.notes.push(`${screen}: opener ${op.name}: ${e.message.split("\n")[0]}`);
      await closeDialogs(page);
    }
  }
  if (openers.length > maxOpeners) log.notes.push(`${screen}: ${openers.length} openers, explored the first ${maxOpeners}`);
}

// Radio toggles inside figures (chart/table views): select each unselected option, record what
// appears, then put the original back.
async function exploreFigureToggles(page, { screen, state, shotPrefix }) {
  const known = await inventory(page, { screen, state });
  const figures = page.locator("figure");
  const fCount = Math.min(await figures.count(), 60);
  for (let f = 0; f < fCount; f += 1) {
    tick();
    const fig = figures.nth(f);
    const figName = ((await fig.getAttribute("aria-label")) || (await fig.locator("figcaption").first().innerText().catch(() => "")) || `figure ${f}`).replace(/\s+/g, " ").trim().slice(0, 80);
    if (shotPrefix) {
      const slug = figName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || `figure-${f}`;
      await fig.scrollIntoViewIfNeeded().catch(() => {});
      await shoot(page, `${shotPrefix}--visual-${String(f).padStart(2, "0")}-${slug}`, { element: fig });
    }
    const radios = fig.getByRole("radio");
    const rCount = Math.min(await radios.count(), 10);
    let original = null;
    for (let r = 0; r < rCount; r += 1) if (await radios.nth(r).isChecked()) original = r;
    for (let r = 0; r < rCount; r += 1) {
      tick();
      if (r === original) continue;
      const rname = ((await radios.nth(r).getAttribute("aria-label")) || (await radios.nth(r).evaluate((e) => (e.labels && e.labels[0] ? e.labels[0].innerText : e.value)))).trim();
      const loc = `page.getByRole('figure').nth(${f}).getByRole('radio', { name: ${quote(rname)}, exact: true })`;
      try {
        await radios.nth(r).check({ force: true, timeout: 3000 });
        await settle(page, 300);
        await inventory(page, { screen, state, revealedBy: loc, known });
        if (shotPrefix) await shoot(page, `${shotPrefix}--visual-${String(f).padStart(2, "0")}-${rname.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-view`, { element: fig });
      } catch (e) {
        log.notes.push(`${screen}: figure ${figName} radio ${rname}: ${e.message.split("\n")[0]}`);
      }
    }
    if (original !== null && rCount > 0) await radios.nth(original).check({ force: true }).catch(() => {});
  }
}

// ---------------------------------------------------------------- screens
const T0 = Date.now();
const progress = (msg) => process.stderr.write(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${msg}\n`);

async function visit(page, base, address, { state, shot, waitFor = null, explore: doExplore = true, figures = false }) {
  tick();
  progress(`visit ${address} (${state})`);
  await page.goto(base + address);
  if (address.includes("#")) await page.waitForTimeout(200);
  await page.waitForLoadState("networkidle").catch(() => {});
  if (waitFor) await page.getByText(waitFor).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  log.screens.push({ address, state, title: await page.title() });
  await shoot(page, shot);
  if (doExplore) await explore(page, { screen: address, state, shotPrefix: shot });
  else await inventory(page, { screen: address, state });
  if (figures) await exploreFigureToggles(page, { screen: address, state, shotPrefix: shot });
}

async function startForm(page, base, { agreement, name = "Audit Z" }) {
  await page.goto(`${base}/start`);
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Issuer name", exact: true }).fill("Northbridge Synthetic Group");
  await page.getByRole("textbox", { name: "As-of date", exact: true }).fill("2025-03-31");
  if (name) await page.getByRole("textbox", { name: "Your name", exact: true }).fill(name);
  const files = [path.join(REPO, "proof", "northbridge-filing.txt"), path.join(REPO, "proof", "northbridge-portfolio.xlsx")];
  if (agreement) files.push(path.join(REPO, "proof", "northbridge-credit-agreement.txt"));
  await page.locator("input[type=file]").first().setInputFiles(files);
  await page.getByRole("list", { name: "Documents added" }).waitFor();
  await page.waitForTimeout(800);
}

async function toReview(page, { agreement }) {
  await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
  await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
  await page.getByRole("button", { name: "Continue to context", exact: true }).click();
  await page.getByRole("heading", { name: "More context", exact: true }).waitFor();
  await page.getByRole("combobox", { name: "Portfolio workbook", exact: true }).selectOption({ label: "northbridge-portfolio.xlsx" });
  if (agreement) {
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.getByRole("combobox", { name: "The agreement", exact: true }).selectOption({ label: "northbridge-credit-agreement.txt" });
  }
  await page.getByRole("button", { name: "Review run", exact: true }).click();
  await page.getByRole("heading", { name: "Review and start", exact: true }).waitFor();
  await page.waitForTimeout(800);
}

async function decideAndApprove(page) {
  const limits = page.getByRole("region", { name: "Limits to decide" });
  for (const box of await limits.getByRole("checkbox").all()) {
    tick();
    if (!(await box.isChecked())) await box.check();
  }
  const approve = page.getByRole("checkbox", { name: /^Approve:/ });
  await approve.check();
}

// Waits until the run page shows an ended status.
async function waitForEnd(page) {
  for (let i = 0; i < 150; i += 1) {
    tick();
    const status = await page.getByRole("status").first().innerText().catch(() => "");
    if (/Finished|Failed|Stopped|Interrupted|Cancelled/.test(status)) return status;
    await page.waitForTimeout(1000);
  }
  return "timeout";
}

// ---------------------------------------------------------------- main
async function main() {
  const { child } = await startService();
  process.stderr.write("service started\n");
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.once(sig, () => {
      stopService(child);
      process.exit(130);
    });
  }
  const base = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await guard(context);
  const page = await context.newPage();
  watchPage(page);
  try {
    // ---- empty state, before any run
    await visit(page, base, "/", { state: "empty", shot: "c1-library--empty" });
    await page.getByRole("radio", { name: "List", exact: true }).check();
    await page.waitForTimeout(300);
    await inventory(page, { screen: "/", state: "empty", revealedBy: "page.getByRole('radio', { name: \"List\", exact: true })" });
    await shoot(page, "c1-library-list-layout--empty");
    await visit(page, base, "/runs", { state: "empty", shot: "c1-run-activity--empty" });
    await visit(page, base, "/run/20000101-000000-01", { state: "error", shot: "c1-run-progress-unknown-id--error" });
    await visit(page, base, "/report/no-such-run", { state: "error", shot: "c3-report-unknown-folder--error" });
    await visit(page, base, "/report/a%2Fb", { state: "error", shot: "c1-page-not-found--error", explore: false });

    // ---- start run: every step (run 1 = documented manual flow, no agreement)
    await visit(page, base, "/start", { state: "empty", shot: "c2-start-1-documents--empty" });
    // a validation error: files but no name
    await startForm(page, base, { agreement: false, name: "" });
    await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
    await page.waitForTimeout(800);
    await inventory(page, { screen: "/start", state: "error" });
    await shoot(page, "c2-start-1-documents-name-missing--error");
    await page.getByRole("textbox", { name: "Your name", exact: true }).fill("Audit Z");
    await page.waitForTimeout(300);
    await inventory(page, { screen: "/start", state: "partial" });
    await shoot(page, "c2-start-1-documents-inspected--partial");
    await page.getByRole("button", { name: "Continue to purpose", exact: true }).click();
    await page.getByRole("heading", { name: "Purpose", exact: true }).waitFor();
    await page.waitForTimeout(500);
    await explore(page, { screen: "/start", state: "partial", shotPrefix: "c2-start-2-purpose--partial" });
    await shoot(page, "c2-start-2-purpose--partial");
    for (const level of ["Standard", "Advanced"]) {
      await page.getByRole("combobox", { name: "Run form level", exact: true }).selectOption({ label: level });
      await page.waitForTimeout(400);
      await inventory(page, { screen: "/start", state: "partial", revealedBy: `page.getByRole('combobox', { name: "Run form level", exact: true }) = ${level}` });
      await shoot(page, `c2-start-2-purpose-${level.toLowerCase()}--partial`);
    }
    await page.getByRole("button", { name: "Continue to context", exact: true }).click();
    await page.getByRole("heading", { name: "More context", exact: true }).waitFor();
    await page.waitForTimeout(500);
    const contextKnown = await inventory(page, { screen: "/start", state: "partial" });
    await shoot(page, "c2-start-3-context-advanced--partial");
    await explore(page, { screen: "/start", state: "partial", shotPrefix: "c2-start-3-context-advanced--partial" });
    for (const add of ["Add facility", "Add quote", "Add rating", "Add research question"]) {
      tick();
      const button = page.getByRole("button", { name: add, exact: true });
      if ((await button.count()) === 0) continue;
      await button.first().click();
      await page.waitForTimeout(300);
      await inventory(page, { screen: "/start", state: "partial", revealedBy: `page.getByRole('button', { name: ${quote(add)}, exact: true })`, known: contextKnown });
    }
    await page.getByRole("combobox", { name: "Legal documents", exact: true }).selectOption("executed");
    await page.waitForTimeout(300);
    await inventory(page, { screen: "/start", state: "partial", revealedBy: "page.getByRole('combobox', { name: \"Legal documents\", exact: true }) = executed", known: contextKnown });
    await shoot(page, "c2-start-3-context-rows-added--partial");
    // Abandon this advanced draft; the real run uses the Basic level as the documentation says.

    await startForm(page, base, { agreement: false });
    await toReview(page, { agreement: false });
    await visitCurrent(page, "/start", "partial", "c2-start-4-review-undecided--partial");
    await decideAndApprove(page);
    await page.waitForTimeout(300);
    await inventory(page, { screen: "/start", state: "full" });
    await shoot(page, "c2-start-4-review-approved--full");
    await page.getByRole("button", { name: "Submit run", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    // Confirm the dialog is the synthetic one before confirming anything.
    const dialogText = await dialog.innerText();
    if (!/synthetic/i.test(dialogText) || (await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).count()) !== 1) {
      throw new Error(`Submit dialog is not the synthetic one; refusing to confirm:\n${dialogText}`);
    }
    await inventory(page, { screen: "/start", state: "full", revealedBy: "page.getByRole('button', { name: \"Submit run\", exact: true })" });
    await shoot(page, "c2-start-5-submit-dialog--full");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Submit run", exact: true }).click();
    await dialog.waitFor();

    // A second page on Run activity, to catch the running state.
    const watcher = await context.newPage();
    await watcher.goto(`${base}/runs`);
    await watcher.waitForTimeout(500);
    await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
    await page.waitForURL(/\/run\//, { timeout: 20000 });
    const run1 = page.url().split("/run/")[1];
    await page.waitForTimeout(300);
    await inventory(page, { screen: `/run/${run1}`, state: "loading" });
    await shoot(page, "c1-run-progress--running", { widths: [1440] });
    await watcher.waitForTimeout(200);
    await inventory(watcher, { screen: "/runs", state: "partial" });
    await shoot(watcher, "c1-run-activity--running", { widths: [1440] });
    await shoot(page, "c1-run-progress--running", { widths: [390] });
    const status1 = await waitForEnd(page);
    log.notes.push(`run 1 (documented manual flow, no agreement): ${run1} ended "${status1}"`);
    await visit(page, base, `/run/${run1}`, { state: "error", shot: "c1-run-progress-failed--error" });
    await visit(page, base, `/report/${run1}`, { state: "empty", shot: "c3-report-unpublished-run--empty" });

    // ---- run 2: with the executed credit agreement, so the report has every module
    await startForm(page, base, { agreement: true });
    await toReview(page, { agreement: true });
    await shoot(page, "c2-start-4-review-with-agreement--partial");
    await decideAndApprove(page);
    await page.getByRole("button", { name: "Submit run", exact: true }).click();
    await dialog.waitFor();
    if ((await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).count()) !== 1) throw new Error("not synthetic");
    await watcher.goto(`${base}/runs`);
    await dialog.getByRole("button", { name: "Start synthetic run", exact: true }).click();
    await page.waitForURL(/\/run\//, { timeout: 20000 });
    const run2 = page.url().split("/run/")[1];
    await shoot(page, "c1-run-progress-run2--running", { widths: [1440, 390] });
    await shoot(watcher, "c1-run-activity-run2--running", { widths: [1440, 390] });
    await watcher.close();
    const status2 = await waitForEnd(page);
    log.notes.push(`run 2 (with executed agreement): ${run2} ended "${status2}"`);

    // ---- full state
    await visit(page, base, "/", { state: "full", shot: "c1-library--full" });
    await page.getByRole("radio", { name: "List", exact: true }).check();
    await page.waitForTimeout(300);
    await inventory(page, { screen: "/", state: "full", revealedBy: "page.getByRole('radio', { name: \"List\", exact: true })" });
    await shoot(page, "c1-library-list-layout--full");
    await visit(page, base, "/runs", { state: "full", shot: "c1-run-activity--full" });
    await visit(page, base, `/run/${run2}`, { state: "full", shot: "c1-run-progress-finished--full" });
    await visit(page, base, `/start?from=${run2}`, { state: "full", shot: "c2-start-from-run--full" });

    const report = `/report/${run2}`;
    await visit(page, base, `${report}#overview`, { state: "full", shot: "c3-report-overview--full", figures: true });
    // Sources switch on
    const sw = page.getByRole("switch", { name: "Show sources", exact: true });
    if (await sw.count()) {
      await sw.click();
      await page.waitForTimeout(300);
      await inventory(page, { screen: `${report}#overview`, state: "full", revealedBy: "page.getByRole('switch', { name: \"Show sources\", exact: true })" });
      await shoot(page, "c3-report-overview-sources-on--full");
      await sw.click();
    }
    await visit(page, base, `${report}#changes`, { state: "full", shot: "c3-report-changes--full", figures: true });
    await visit(page, base, `${report}#modules`, { state: "full", shot: "c3-report-modules--full", figures: true });
    const moduleIds = await page.evaluate(() => [
      ...new Set([...document.querySelectorAll("a[href^='#modules/']")].map((a) => a.getAttribute("href").split("/")[1])),
    ]);
    for (const id of moduleIds.slice(0, 40)) {
      await visit(page, base, `${report}#modules/${id}`, { state: "full", shot: `c3-report-module-${decodeURIComponent(id)}--full`, figures: true });
    }
    await visit(page, base, `${report}#forecast`, { state: "full", shot: "c4-report-forecast--full", figures: true });
    await visit(page, base, `${report}#calendar`, { state: "full", shot: "c4-report-calendar--full", figures: true });
    for (const tab of ["summary", "trace", "sources", "gaps", "checks", "record"]) {
      await visit(page, base, `${report}#evidence/${tab}`, { state: "full", shot: `c5-report-evidence-${tab}--full`, figures: tab === "summary" });
    }
    // Evidence filtered by one module, record view for one module
    await visit(page, base, `${report}#evidence/record/CP-1`, { state: "full", shot: "c5-report-evidence-record-cp-1--full" });
    // A trace address: the first "Open in Evidence" link from an overview drawer.
    await page.goto(`${base}${report}#overview`);
    await page.waitForTimeout(800);
    const traceButton = page.getByRole("button", { name: /^Show sources for / }).first();
    if (await traceButton.count()) {
      await traceButton.click();
      const href = await page.getByRole("dialog").getByRole("link", { name: "Open in Evidence" }).first().getAttribute("href").catch(() => null);
      await closeDialogs(page);
      if (href) {
        const address = href.startsWith("/") ? href : `${report}${href}`;
        await visit(page, base, address, { state: "full", shot: "c5-report-evidence-trace-line--full" });
      }
    }
    // Downloads: list the download links on the evidence summary (not followed).
    await page.goto(`${base}${report}#evidence/summary`);
    await page.waitForTimeout(800);
    log.downloads = await page.evaluate(() =>
      [...document.querySelectorAll("a[download], a[href*='/connected/artifacts/'], a[href*='/connected/sources/'], a[href*='/connected/report/']")].map((a) => ({ name: a.innerText.trim(), href: a.getAttribute("href") })),
    );
    log.runs = { run1, status1, run2, status2 };
  } finally {
    await browser.close();
    stopService(child);
  }
  log.clickables = clickableCount;
  log.loops = loops;
  fs.writeFileSync(path.join(OUT, "offline-browser-connected.json"), JSON.stringify({ blocked: log.blocked, websockets: log.websockets }, null, 2));
  fs.writeFileSync(path.join(OUT, "probe-log-connected.json"), JSON.stringify(log, null, 2));
  console.log(JSON.stringify({ clickables: clickableCount, shots: log.shots.length, blocked: log.blocked.length, websockets: log.websockets.length, notes: log.notes.length, runs: log.runs }));
}

async function visitCurrent(page, screen, state, shot) {
  log.screens.push({ address: screen, state, step: shot });
  await shoot(page, shot);
  await explore(page, { screen, state, shotPrefix: shot });
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
