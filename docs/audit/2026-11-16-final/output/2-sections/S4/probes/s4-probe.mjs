// Section S4 (static library Evidence and trace) probe. Run from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/S4/probes/s4-probe.mjs <check> [<check> ...]
//   node .../s4-probe.mjs all
// It copies web/dist to a temporary folder, writes the fixture data file into the copy (web/dist is not
// touched), opens it from disk in headless Chromium with every host but loopback blocked (ruling R8),
// prints what it saw and removes the temporary folder. It starts no service. Checks are capped by
// timeouts; no loop runs more than 1,000 times.
import { cpSync, mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
const { chromium } = require("playwright");
const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);
// Playwright 1.62.1 wants headless shell build 1234; the cloud image has 1243. Override with CHROME=<path>.
const EXE = process.env.CHROME ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

const tmp = mkdtempSync(path.join(tmpdir(), "s4-probe-"));
const dist = path.join(tmp, "dist-fixture");
cpSync(path.join(web, "dist"), dist, { recursive: true });
writeDataFile(dist, path.join(web, "fixtures"));
const FIXTURE = pathToFileURL(path.join(dist, "index.html")).href;
const SHIPPED = pathToFileURL(path.join(web, "dist", "index.html")).href;
const H = "halden-aerostructures";
const R = "2026-09-30";
const lib = JSON.parse(readFileSync(path.join(web, "fixtures", "library.json"), "utf8")).slice;
const run = lib.issuers[0].runs[0];
const ev = run.evidence;
const log = (k, v) => console.log(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);

async function ctx(browser, width = 1440, height = 900) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  context.setDefaultTimeout(15000);
  context.setDefaultNavigationTimeout(20000);
  const blocked = [];
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    const ok = ["file:", "data:", "blob:"].includes(u.protocol) || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
    if (ok) return route.continue();
    blocked.push(u.href);
    return route.abort("blockedbyclient");
  });
  const page = await context.newPage();
  return { context, page, blocked };
}
async function go(page, root, hash) {
  await page.goto("about:blank");
  await page.goto(`${root}${hash}`, { waitUntil: "load" });
  await page.waitForFunction(() => (document.getElementById("root")?.childElementCount ?? 0) > 0, null, { timeout: 8000 });
  await page.waitForTimeout(250);
}
const evh = (tab, item) => `#/library/${H}/${R}/evidence/${tab}${item ? `/${item}` : ""}`;
const active = (page) => page.evaluate(() => { const e = document.activeElement; return e ? `${e.tagName.toLowerCase()}|${(e.getAttribute("aria-label") || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}` : "none"; });
const sourcesIn = (n) => (n.label === "Source" ? 1 : 0) + n.children.reduce((s, c) => s + sourcesIn(c), 0);

const CHECKS = {
  async "calc-count"(page) {
    const rows = ev.trace.rows;
    log("fixture: summary tile", ev.summary.counts.find((c) => c.label === "Calculations"));
    log("fixture: trace rows / rows with a derivation", [rows.length, rows.filter((r) => r.calc !== null).length]);
    await go(page, FIXTURE, evh("trace"));
    log("screen: rows with a 'Show how ... was derived' control", await page.getByRole("button", { name: /^Show how/ }).count());
  },
  async "drawer-no-sources"(page) {
    const rows = new Map(ev.trace.rows.map((r) => [r.id, r]));
    const empty = Object.entries(run.traces).filter(([, t]) => sourcesIn(t.derivation) === 0 && t.excerpt === null && !(t.sourceLinks?.length));
    log("fixture: traces / traces whose drawer lists no source, file, page or excerpt", [Object.keys(run.traces).length, empty.length]);
    log("fixture: example (trace key, Evidence row, row's Sources count)", empty.slice(0, 4).map(([k, t]) => [k, t.evidenceItem, rows.get(t.evidenceItem).sources]));
    await go(page, FIXTURE, `#/library/${H}/${R}/overview`);
    const btn = page.getByRole("button", { name: "Show sources for this figure" }).first();
    await btn.click(); await page.waitForTimeout(400);
    log("screen: first figure's drawer", (await page.evaluate(() => document.querySelector("[role=dialog]").innerText)).replace(/\n+/g, " | "));
  },
  async "download-dead"(page) {
    await go(page, FIXTURE, evh("summary"));
    const href = await page.getByRole("link", { name: "Download handoffs" }).getAttribute("href");
    log("href / file exists beside index.html", [href, existsSync(path.join(dist, href))]);
    const failed = [];
    page.on("requestfailed", (r) => failed.push(`${r.url().split("/").slice(-2).join("/")} ${r.failure()?.errorText}`));
    await page.getByRole("link", { name: "Download handoffs" }).click(); await page.waitForTimeout(800);
    log("after click: address, failed requests", [page.url().slice(0, 40), failed]);
    await go(page, FIXTURE, evh("record"));
    log("record links: hrefs and whether the file exists", await page.evaluate(() => [...document.querySelectorAll("section a")].map((a) => a.getAttribute("href"))).then((hs) => hs.map((h) => [h, existsSync(path.join(dist, h))])));
  },
  async "focus-after-tab"(page) {
    await go(page, FIXTURE, evh("summary"));
    await page.getByRole("navigation", { name: "Evidence sections" }).getByRole("link", { name: "Trace 59" }).focus();
    await page.keyboard.press("Enter"); await page.waitForTimeout(300);
    log("after Enter on the Trace tab: address, focus", [await page.evaluate(() => location.hash), await active(page)]);
  },
  async "focus-after-clear"(page) {
    await go(page, FIXTURE, evh("trace"));
    await page.getByRole("button", { name: /^Module:/ }).click();
    await page.getByRole("option", { name: "Forecast" }).click(); await page.waitForTimeout(250);
    const clear = page.getByRole("button", { name: "Show all items" });
    await clear.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
    log("Trace: after Show all items (Enter): focus", await active(page));
    await go(page, FIXTURE, evh("sources"));
    await page.getByRole("button", { name: /^Module:/ }).click();
    await page.getByRole("option", { name: "Recovery" }).click(); await page.waitForTimeout(250);
    await page.getByRole("button", { name: "Show all files" }).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
    log("Sources: after Show all files (Enter): focus", await active(page));
  },
  async "filter-scope"(page) {
    const seen = {};
    for (const tab of ["summary", "trace", "sources", "gaps", "record"]) {
      await go(page, FIXTURE, evh(tab));
      seen[tab] = await page.getByRole("button", { name: /^Module:/ }).count();
    }
    log("module filter present per tab (CM-072 and CT-046 say one filter for all five)", seen);
    await go(page, FIXTURE, evh("trace"));
    await page.getByRole("button", { name: /^Module:/ }).click();
    await page.getByRole("option", { name: "Capital structure" }).click();
    await page.getByRole("navigation", { name: "Evidence sections" }).getByRole("link", { name: /^Gaps/ }).click(); await page.waitForTimeout(300);
    log("after choosing Capital structure on Trace and opening Gaps: filter shows", await page.getByRole("button", { name: /^Module:/ }).textContent());
  },
  async "narrow-table"(page, browser) {
    const c = await ctx(browser, 390, 844);
    for (const tab of ["gaps", "trace", "record"]) {
      await go(c.page, FIXTURE, evh(tab));
      const m = await c.page.evaluate(() => [...document.querySelectorAll("[role=region]")].map((r) => {
        const b = r.getBoundingClientRect();
        return { region: r.getAttribute("aria-label"), scrollWidth: r.scrollWidth, clientWidth: r.clientWidth, heads: [...r.querySelectorAll("thead th")].map((th) => `${th.textContent.trim().slice(0, 16)}@${Math.round(th.getBoundingClientRect().left - b.left)}`) };
      }));
      log(`390px ${tab}`, m);
    }
    await go(c.page, FIXTURE, evh("gaps"));
    log("390px gaps: Module cell text and its width", await c.page.evaluate(() => { const td = document.querySelectorAll("tbody td")[1]; const t = [...document.querySelectorAll("tbody td")].find((x) => x.textContent.trim() === "Recovery"); return [t?.getBoundingClientRect().width, t?.getBoundingClientRect().height]; }));
    await c.context.close();
  },
  async "module-codes"(page) {
    await go(page, FIXTURE, evh("record"));
    log("Model calls table: heads and the Code column", await page.evaluate(() => { const t = [...document.querySelectorAll("table")].find((x) => x.querySelector("caption")?.textContent === "Model calls"); return [[...t.querySelectorAll("thead th")].map((h) => h.textContent.trim()), [...t.querySelectorAll("tbody tr")].map((r) => `${r.cells[0].textContent.trim()} -> ${r.cells[1].textContent.trim()}`)]; }));
  },
  async "record-partial"() {
    const calls = ev.record.calls;
    const n = (i) => calls.rows.reduce((s, r) => s + Number(String(r.cells[i]).replace(/,/g, "")), 0);
    log("Model calls rows: calls, retries, cost", [n(1), n(2), calls.rows.reduce((s, r) => s + Number(r.cells[5]), 0).toFixed(2)]);
    log("Model calls total row", calls.total);
    log("rows listed / calls count", [calls.rows.length, calls.count]);
    log("Module timings note and rows", [ev.record.timings.note, ev.record.timings.rows.length]);
    log("Modules delivered", ev.summary.delivered.progress.text);
  },
  async "small-text"(page) {
    for (const tab of ["summary", "sources", "trace", "gaps", "record"]) {
      await go(page, FIXTURE, evh(tab));
      const r = await page.evaluate(() => {
        const out = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
        while ((n = w.nextNode())) {
          const t = n.textContent.trim(); const el = n.parentElement;
          if (!t || !el.checkVisibility() || el.closest("aside, [aria-label='Run pages'], [aria-label='Areas']")) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 13) out.add(`${fs}px ${el.tagName.toLowerCase()} "${t.slice(0, 24)}"`);
        }
        return [...out].slice(0, 12);
      });
      log(`text under 13px on ${tab}`, r);
    }
  },
  async "toast-390"(page, browser) {
    const c = await ctx(browser, 390, 844);
    await go(c.page, FIXTURE, evh("summary"));
    await c.page.getByRole("button", { name: "Copy run code" }).click(); await c.page.waitForTimeout(300);
    log("toast rect and bottom navigation rect", await c.page.evaluate(() => { const t = document.querySelector("[role=alert],[role=status]").getBoundingClientRect(); const n = document.querySelector("nav[aria-label=Areas]").getBoundingClientRect(); return { toast: [t.left, t.top, t.right, t.bottom].map(Math.round), nav: [n.left, n.top, n.right, n.bottom].map(Math.round) }; }));
    await c.context.close();
  },
  async "shipped-empty"(page) {
    await go(page, SHIPPED, evh("trace"));
    log("shipped build, Evidence address", await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 160)));
  },
  async "loading-state"(page) {
    await go(page, FIXTURE, `#/library/${H}/2026-06-30/evidence/trace`);
    log("loading run: aria-busy, text inside it, status regions, Evidence heading and tabs present", await page.evaluate(() => [document.querySelector("[aria-busy]")?.getAttribute("aria-busy"), document.querySelector("[aria-busy]")?.innerText.trim(), document.querySelectorAll("[role=status]").length, !!document.querySelector("nav[aria-label='Evidence sections']")]));
  },
  async "data-error"(page) {
    // A copy of the fixture with one field invalid: an unreadable file with no reason.
    const bad = path.join(tmp, "fx-bad"); const dist2 = path.join(tmp, "dist-bad");
    cpSync(path.join(web, "fixtures"), bad, { recursive: true }); cpSync(path.join(web, "dist"), dist2, { recursive: true });
    const f = path.join(bad, "library.json"); const d = JSON.parse(readFileSync(f, "utf8"));
    d.slice.issuers[0].runs[0].evidence.sources.files[4].why = null;
    (await import("node:fs")).writeFileSync(f, JSON.stringify(d));
    writeDataFile(dist2, bad);
    await go(page, pathToFileURL(path.join(dist2, "index.html")).href, evh("sources"));
    log("one invalid Evidence field: what the page says", await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 200)));
    await go(page, pathToFileURL(path.join(dist2, "index.html")).href, `#/library/${H}/${R}/overview`);
    log("the same data on the Overview", await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 120)));
  },
  async "jump-id-search"(page, browser) {
    await go(page, FIXTURE, evh("summary"));
    await page.getByRole("button", { name: /^Jump to an item/ }).click();
    await page.keyboard.type("T-0014"); await page.waitForTimeout(250);
    log("typing an id the row's own detail shows (T-0014)", await page.getByRole("option").allTextContents().then((x) => (x.length ? x : "No item matches")));
    await page.keyboard.press("Escape");
    const c = await ctx(browser, 390, 844);
    await go(c.page, FIXTURE, evh("trace"));
    await c.page.getByRole("button", { name: /^Jump to an item/ }).click(); await c.page.waitForTimeout(250);
    log("390px: shortcut hint drawn on a touch-width page, and the id wraps", await c.page.evaluate(() => [...document.querySelectorAll("[role=option]")].map((o) => o.getBoundingClientRect().height)));
    await c.context.close();
  },
  async "inert-switch"(page) {
    const n = {};
    for (const tab of ["summary", "trace", "sources", "gaps", "record"]) {
      await go(page, FIXTURE, evh(tab));
      n[tab] = await page.getByRole("button", { name: /Show sources for/ }).count();
    }
    log("trace controls on each Evidence tab (the Show sources switch is drawn above them)", n);
    log("switch drawn", await page.getByRole("switch", { name: "Show sources" }).count());
  },
  async "title"(page) {
    await go(page, FIXTURE, evh("gaps"));
    log("document.title on Evidence", await page.evaluate(() => document.title));
  },
  async "drawer-close-names"(page) {
    await go(page, FIXTURE, `#/library/${H}/${R}/overview`);
    await page.getByRole("button", { name: "Show sources for the bottom line" }).click(); await page.waitForTimeout(400);
    log("buttons in the drawer named Close", await page.getByRole("dialog").getByRole("button", { name: "Close" }).count());
  },
  async "sources-date"(page) {
    await go(page, FIXTURE, evh("sources"));
    log("first file row text (CM-073 asks for file name, type, document date, readers)", await page.evaluate(() => [...document.querySelectorAll("li")].find((l) => l.textContent.includes("SHA-256")).innerText.replace(/\s+/g, " ")));
    log("fixture file keys", Object.keys(ev.sources.files[0]));
  },
  async "inventory-trace-keys"(page) {
    const keys = Object.keys(run.traces).slice(0, 3);
    for (const k of keys) {
      await go(page, FIXTURE, evh("trace", encodeURIComponent(k)));
      log(`address trace/${k} (a drawer key; its Evidence row is ${run.traces[k].evidenceItem})`, await page.evaluate(() => [document.querySelector("[role=alert]")?.innerText.replace(/\s+/g, " ") ?? "no alert", document.querySelectorAll("tbody tr").length]));
    }
  },
  async "unaccounted-controls"(page) {
    const n = {};
    for (const tab of ["trace", "sources", "gaps", "record"]) {
      await go(page, FIXTURE, evh(tab));
      n[tab] = await page.evaluate(() => ({
        sortButtons: [...document.querySelectorAll("th[aria-sort] button")].map((b) => b.textContent.trim()),
        showOtherFiles: [...document.querySelectorAll("button")].filter((b) => /^Show the other/.test(b.textContent.trim())).length,
        shownLinks: [...document.querySelectorAll("tbody a")].filter((a) => /^Shown (on|under)/.test(a.textContent.trim())).length,
        kindBadges: [...new Set([...document.querySelectorAll("tbody td span")].map((s) => s.textContent.trim()).filter((t) => ["Passage", "Figure", "Row", "Chart"].includes(t)))],
      }));
    }
    log("controls and badges with no control-matrix or content-matrix row", n);
  },
  async "evidence-content"(page) {
    await go(page, FIXTURE, evh("record"));
    const t = await page.evaluate(() => document.body.innerText);
    for (const w of ["Confidence", "Calculation JSON", "calculation.json", "Published", "Delivered", "Regression", "Compared", "Earlier run", "Document date", "Model"]) log(`Record mentions "${w}"`, t.includes(w));
    log("Record headings", await page.evaluate(() => [...document.querySelectorAll("h3")].map((h) => h.textContent.trim())));
    log("register rows are file links, not tables of rows", ev.record.registers.rows.map((r) => [r.name, r.rows, r.href]));
  },
};

const wanted = process.argv.slice(2);
const names = wanted.length === 0 || wanted[0] === "all" ? Object.keys(CHECKS) : wanted;
const browser = await chromium.launch({ executablePath: EXE, timeout: 30000 });
try {
  for (const name of names) {
    const fn = CHECKS[name];
    if (!fn) { console.log(`unknown check ${name}; known: ${Object.keys(CHECKS).join(", ")}`); continue; }
    console.log(`== ${name}`);
    const c = await ctx(browser);
    try { await fn(c.page, browser); } catch (e) { console.log(`ERROR in ${name}: ${String(e).slice(0, 300)}`); }
    if (c.blocked.length) console.log("BLOCKED requests:", c.blocked);
    await c.context.close();
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
