// Stage 0 probe helpers: launch Chromium offline-only, list interactive elements, take screenshots.
// Imported by connected.mjs and static.mjs; not run on its own. Reads the page; changes nothing on disk
// except the screenshot and JSON Lines files it is asked to write.
import { appendFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const ROOT = process.cwd();
const require = createRequire(path.join(ROOT, "web", "package.json"));
const { chromium } = require("playwright");

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
export const CAP = 1000; // every loop in these probes stops at 1,000

/** True for file:, data:, blob: and loopback http(s)/ws(s) addresses. */
export function isLocal(url) {
  try {
    const u = new URL(url);
    if (["file:", "data:", "blob:", "about:", "chrome-extension:"].includes(u.protocol)) return true;
    return LOOPBACK.has(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Chromium with every non-loopback request aborted and logged. The log records each request the
 * page attempted (network layer) and each Content-Security-Policy violation (requests the page's
 * own policy stopped before the network layer).
 */
export async function launch(log) {
  const executablePath = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await context.route(
    (url) => !isLocal(url.href),
    async (route) => {
      log.blocked.push({ url: route.request().url(), type: route.request().resourceType(), page: log.current });
      await route.abort("blockedbyclient");
    },
  );
  await context.routeWebSocket(/.*/, (ws) => {
    if (!isLocal(ws.url())) {
      log.blocked.push({ url: ws.url(), type: "websocket", page: log.current });
      ws.close();
    } else ws.connectToServer();
  });
  context.on("request", (request) => {
    log.requests.push({ url: request.url(), type: request.resourceType(), page: log.current });
  });
  context.on("console", (message) => {
    const text = message.text();
    if (/Content Security Policy|Refused to (load|connect|apply|execute)/.test(text))
      log.csp.push({ text, page: log.current });
    if (message.type() === "error") log.errors.push({ text: text.slice(0, 400), page: log.current });
  });
  context.on("weberror", (error) => log.errors.push({ text: String(error.error()).slice(0, 400), page: log.current }));
  await context.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      console.error(`Content Security Policy violation: ${event.violatedDirective} blocked ${event.blockedURI}`);
    });
  });
  return { browser, context };
}

export function newLog() {
  return { current: "", requests: [], blocked: [], csp: [], errors: [] };
}

/** Wait until the page has painted and no "Loading" status is shown (bounded). */
export async function settle(page, ms = 400) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  for (let i = 0; i < 40; i += 1) {
    const loading = await page
      .locator('[role="status"]')
      .filter({ hasText: /^Loading/ })
      .count()
      .catch(() => 0);
    if (loading === 0) break;
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(ms);
}

const CANDIDATES = [
  "a[href]", "button", "input", "select", "textarea", "summary", "details", "dialog",
  "[role=button]", "[role=link]", "[role=tab]", "[role=tablist]", "[role=checkbox]", "[role=radio]",
  "[role=radiogroup]", "[role=switch]", "[role=combobox]", "[role=listbox]", "[role=option]",
  "[role=menu]", "[role=menuitem]", "[role=menuitemcheckbox]", "[role=menuitemradio]", "[role=slider]",
  "[role=spinbutton]", "[role=textbox]", "[role=searchbox]", "[role=treeitem]", "[role=dialog]",
  "[role=alertdialog]", "[tabindex]", "[data-dropzone]", "[contenteditable]", "th[aria-sort]",
  "[aria-expanded]", "[aria-haspopup]", "[aria-pressed]", "[draggable=true]", "[onclick]",
].join(",");

/**
 * Every interactive element (and every dialog, disclosure, tab list and radio group) in the page,
 * with Chromium's own computed role and accessible name (CDP Accessibility tree).
 */
export async function collect(page) {
  const count = await page.evaluate((selector) => {
    let n = 0;
    for (const el of document.querySelectorAll(selector)) {
      if (n >= 5000) break;
      el.setAttribute("data-s0-id", String(n));
      n += 1;
    }
    return n;
  }, CANDIDATES);
  const client = await page.context().newCDPSession(page);
  const ax = new Map();
  try {
    await client.send("DOM.enable");
    await client.send("Accessibility.enable");
    const { root } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
    const ids = new Map();
    const stack = [root];
    for (let guard = 0; stack.length > 0 && guard < 200000; guard += 1) {
      const node = stack.pop();
      const attrs = node.attributes ?? [];
      const at = attrs.indexOf("data-s0-id");
      if (at >= 0) ids.set(node.backendNodeId, Number(attrs[at + 1]));
      for (const child of node.children ?? []) stack.push(child);
      for (const child of node.shadowRoots ?? []) stack.push(child);
      if (node.contentDocument) stack.push(node.contentDocument);
    }
    const { nodes } = await client.send("Accessibility.getFullAXTree");
    for (const node of nodes) {
      const id = ids.get(node.backendDOMNodeId);
      if (id === undefined) continue;
      ax.set(id, { role: node.role?.value ?? "", name: node.name?.value ?? "", ignored: Boolean(node.ignored) });
    }
  } finally {
    await client.detach().catch(() => {});
  }
  const rows = await page.evaluate(() => {
    const label = (el) => {
      if (!el) return "";
      const by = el.getAttribute("aria-labelledby");
      if (by) return by.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim() ?? "").join(" ").trim();
      const own = el.getAttribute("aria-label");
      if (own) return own.trim();
      const cap = el.querySelector(":scope > figcaption, :scope > h2, :scope > h3, :scope > header h2, :scope > header h3");
      return cap?.textContent?.trim().slice(0, 80) ?? "";
    };
    const out = [];
    for (const el of document.querySelectorAll("[data-s0-id]")) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      const ctxEl = el.parentElement?.closest(
        "[role=dialog],dialog,figure,[role=figure],nav,[role=region],section[aria-label],section[aria-labelledby],form,aside,[role=complementary],header,footer,main,[role=group][aria-label],fieldset,table,details",
      );
      const ctxTag = ctxEl ? (ctxEl.getAttribute("role") ?? ctxEl.tagName.toLowerCase()) : "";
      const href = el.getAttribute("href");
      out.push({
        id: Number(el.getAttribute("data-s0-id")),
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute("type") ?? undefined,
        roleAttr: el.getAttribute("role") ?? undefined,
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
        ariaLabel: el.getAttribute("aria-label") ?? undefined,
        title: el.getAttribute("title") ?? undefined,
        href: href ?? undefined,
        target: el.getAttribute("target") ?? undefined,
        download: el.hasAttribute("download") ? el.getAttribute("download") || true : undefined,
        disabled: el.matches(":disabled") || el.getAttribute("aria-disabled") === "true" || undefined,
        expanded: el.getAttribute("aria-expanded") ?? undefined,
        pressed: el.getAttribute("aria-pressed") ?? undefined,
        checked: el.matches("input[type=checkbox],input[type=radio]") ? el.checked : (el.getAttribute("aria-checked") ?? undefined),
        selected: el.getAttribute("aria-selected") ?? undefined,
        current: el.getAttribute("aria-current") ?? undefined,
        open: el.tagName === "DETAILS" || el.tagName === "DIALOG" ? el.open : undefined,
        haspopup: el.getAttribute("aria-haspopup") ?? undefined,
        controls: el.getAttribute("aria-controls") ?? undefined,
        tabindex: el.getAttribute("tabindex") ?? undefined,
        dataHooks: [...el.attributes].filter((a) => a.name.startsWith("data-") && a.name !== "data-s0-id" && !a.name.startsWith("data-rac") && a.name.length < 40).map((a) => a.name).join(" ") || undefined,
        htmlId: el.id || undefined,
        visible,
        context: ctxEl ? `${ctxTag}${label(ctxEl) ? ` "${label(ctxEl)}"` : ""}` : "",
        inRail: Boolean(el.closest('nav[aria-label="Areas"]')) || el.getAttribute("href") === "#main",
        inDialog: Boolean(el.closest("[role=dialog],dialog,[role=alertdialog]")),
      });
    }
    for (const el of document.querySelectorAll("[data-s0-id]")) el.removeAttribute("data-s0-id");
    return out;
  });
  void count;
  const IMPLICIT = { a: "link", button: "button", select: "combobox", textarea: "textbox", summary: "button", details: "group", dialog: "dialog" };
  return rows.map((row) => {
    const a = ax.get(row.id);
    const implicit = row.tag === "input" ? ({ checkbox: "checkbox", radio: "radio", file: "button", range: "slider", number: "spinbutton", search: "searchbox", submit: "button", button: "button", hidden: "none" }[row.type ?? "text"] ?? "textbox") : IMPLICIT[row.tag];
    // An element hidden from assistive technology (for example behind an open modal) has no
    // computed name; its aria-label or text stands in, and hiddenFromAT records the fact.
    const ignored = a === undefined || a.ignored;
    return {
      ...row,
      role: ignored ? (row.roleAttr ?? implicit ?? "generic") : (a.role || row.roleAttr || implicit || "generic"),
      name: ignored ? (row.ariaLabel ?? row.title ?? row.text ?? "") : a.name,
      hiddenFromAT: ignored || undefined,
    };
  });
}

const PW_ROLES = new Set([
  "alert", "alertdialog", "button", "checkbox", "combobox", "dialog", "figure", "group", "link", "listbox",
  "menu", "menuitem", "menuitemcheckbox", "menuitemradio", "navigation", "option", "radio", "radiogroup",
  "region", "searchbox", "slider", "spinbutton", "switch", "tab", "tablist", "textbox", "treeitem", "columnheader", "rowheader", "cell", "row",
]);

function quote(text) {
  return JSON.stringify(text);
}

/** Playwright locator text: role and exact name, with .nth() when the pair repeats on the screen. */
export function locators(rows) {
  const seen = new Map();
  const totals = new Map();
  for (const r of rows) {
    const key = `${r.role}|${r.name}`;
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  return rows.map((r) => {
    const key = `${r.role}|${r.name}`;
    const index = seen.get(key) ?? 0;
    seen.set(key, index + 1);
    const role = r.role === "DisclosureTriangle" ? null : r.role;
    let locator;
    if (role && PW_ROLES.has(role) && r.name) {
      locator = `getByRole(${quote(role)}, { name: ${quote(r.name)}, exact: true })`;
      if (totals.get(key) > 1) locator += `.nth(${index})`;
    } else if (r.htmlId) locator = `locator(${quote(`#${CSS_escape(r.htmlId)}`)})`;
    else if (r.tag === "summary" && r.text) locator = `locator("summary").filter({ hasText: ${quote(r.text.slice(0, 60))} })${totals.get(key) > 1 ? `.nth(${index})` : ""}`;
    else if (r.dataHooks) locator = `locator(${quote(`[${r.dataHooks.split(" ")[0]}]`)})${totals.get(key) > 1 ? `.nth(${index})` : ""}`;
    else locator = `locator(${quote(r.tag + (r.roleAttr ? `[role=${r.roleAttr}]` : r.type ? `[type=${r.type}]` : ""))}).filter({ hasText: ${quote(r.text.slice(0, 60))} })${totals.get(key) > 1 ? `.nth(${index})` : ""}`;
    return locator;
  });
}

function CSS_escape(id) {
  return id.replace(/([^\w-])/g, "\\$1");
}

/** Write one JSON line per element for a screen state; returns the rows written. */
export function record(file, meta, rows, sectionOf) {
  const locs = locators(rows);
  const lines = rows.map((r, i) => {
    const entry = {
      section: sectionOf(r),
      surface: meta.surface,
      screen: meta.screen,
      address: meta.address,
      state: meta.state,
      role: r.role,
      name: r.name,
      locator: locs[i],
      kind: kindOf(r),
      visible: r.visible,
      hiddenFromAT: r.hiddenFromAT,
      context: r.context || undefined,
      tag: r.tag,
      type: r.type,
      href: r.href,
      target: r.target,
      download: r.download,
      disabled: r.disabled,
      expanded: r.expanded,
      pressed: r.pressed,
      checked: r.checked,
      selected: r.selected,
      current: r.current,
      open: r.open,
      haspopup: r.haspopup,
      dataHooks: r.dataHooks,
      text: r.text && r.text !== r.name ? r.text : undefined,
    };
    return JSON.stringify(entry);
  });
  if (lines.length > 0) appendFileSync(file, lines.join("\n") + "\n");
  return rows.length;
}

export function kindOf(r) {
  if (r.dataHooks?.includes("data-dropzone")) return "drop zone";
  if (r.role === "dialog" || r.role === "alertdialog" || r.tag === "dialog") return "dialog";
  if (r.tag === "details" || r.role === "DisclosureTriangle" || r.tag === "summary") return "disclosure";
  if (r.expanded !== undefined) return "disclosure trigger";
  if (r.role === "tab" || r.role === "tablist") return r.role;
  if (r.role === "radiogroup" || r.role === "group") return "group";
  if (/^Show sources/.test(r.name)) return "trace control";
  if (r.role === "columnheader" || r.tag === "th") return "table sort";
  if (r.role === "link") return r.download ? "download link" : "link";
  if (r.role === "button") return r.pressed !== undefined ? "toggle" : "button";
  if (["checkbox", "radio", "switch"].includes(r.role)) return r.role;
  if (["combobox", "listbox", "option"].includes(r.role)) return "select";
  if (["textbox", "searchbox", "spinbutton", "slider"].includes(r.role) || r.tag === "input" || r.tag === "textarea") return "input";
  return r.role || r.tag;
}

/** Screenshot the whole scrollable main region by growing the viewport to its height (bounded). */
export async function shoot(page, dir, name, width) {
  mkdirSync(dir, { recursive: true });
  const height = 900;
  await page.setViewportSize({ width, height: width < 768 ? 844 : height });
  await page.waitForTimeout(250);
  const full = await page.evaluate(() => {
    const main = document.querySelector("main");
    const extra = main ? main.scrollHeight - main.clientHeight : 0;
    return Math.max(document.documentElement.scrollHeight, window.innerHeight + Math.max(0, extra));
  });
  const capped = Math.min(full, 14000);
  await page.setViewportSize({ width, height: Math.max(capped, width < 768 ? 844 : height) });
  await page.waitForTimeout(250);
  const file = path.join(dir, `${name}-${width}.png`);
  await page.screenshot({ path: file, animations: "disabled", timeout: 30000 }).catch(async () => {
    await page.screenshot({ path: file, timeout: 30000 });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(150);
  return { file: path.basename(file), width, height: capped, truncated: full > capped };
}

export function slug(text) {
  return text.replace(/^https?:\/\/[^/]+/, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 90) || "root";
}

/**
 * Open every closed disclosure, dialog trigger and pressed-state toggle one at a time and list
 * what each reveals (elements not present before). Restores by Escape / clicking again / reload.
 * Returns [{ opener, rows }]. `limitPerKind` bounds repeated per-row trace controls.
 */
export async function explore(page, base, reload, { limitPerKind = 40 } = {}) {
  const domKey = (r) => `${r.tag}|${r.roleAttr ?? ""}|${r.ariaLabel ?? ""}|${r.text}|${r.href ?? ""}|${r.htmlId ?? ""}|${r.context}`;
  const baseKeys = new Set(base.map(domKey));
  const baseDialog = base.some((r) => (r.role === "dialog" || r.tag === "dialog") && r.visible);
  const openers = base.filter(
    (r) =>
      r.visible &&
      !r.disabled &&
      !r.inRail &&
      !r.inDialog &&
      (r.expanded === "false" ||
        (r.tag === "summary") ||
        r.haspopup === "dialog" ||
        /^Show sources|^Open trace|^Show (more|all|details|full)|^View /.test(r.name) ||
        (r.role === "tab" && r.selected === "false") ||
        (r.role === "radio" && r.checked === false && r.context.startsWith("figure"))),
  );
  const perKind = new Map();
  const results = [];
  const skipped = new Map();
  const locs = locators(base);
  for (let i = 0; i < openers.length && i < CAP; i += 1) {
    const opener = openers[i];
    const kind = /^Show sources/.test(opener.name) ? "trace" : opener.tag === "summary" ? "summary" : opener.role === "radio" ? "chart view" : opener.role;
    const used = perKind.get(kind) ?? 0;
    if (used >= limitPerKind) {
      skipped.set(kind, (skipped.get(kind) ?? 0) + 1);
      continue;
    }
    perKind.set(kind, used + 1);
    const locator = locs[base.indexOf(opener)];
    try {
      // eslint-disable-next-line no-new-func
      const target = new Function("page", `return page.${locator};`)(page);
      await target.scrollIntoViewIfNeeded({ timeout: 3000 });
      await target.click({ timeout: 3000 });
      await page.waitForTimeout(350);
      const after = await collect(page);
      const dialog = !baseDialog && after.some((r) => (r.role === "dialog" || r.tag === "dialog") && r.visible);
      // With a dialog open, what it reveals is what is inside it; otherwise, what was not there before.
      const revealed = dialog ? after.filter((r) => r.inDialog || r.role === "dialog") : after.filter((r) => !baseKeys.has(domKey(r)));
      results.push({ opener, locator, rows: revealed });
      if (dialog) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(250);
      } else if (opener.expanded === "false" || opener.tag === "summary") {
        await target.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(150);
      } else {
        await reload();
      }
    } catch (error) {
      results.push({ opener, locator, rows: [], error: String(error).split("\n")[0].slice(0, 200) });
      await reload();
    }
  }
  return { results, skipped: Object.fromEntries(skipped) };
}
