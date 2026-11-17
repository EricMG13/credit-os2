// S6 probe: figure fidelity. Every figure the static run pages draw (USD amounts, "n of m", percentages, clock
// times, durations, step positions, counts) is compared with web/fixtures/run.json, both ways:
//   (1) each fixture string a page is meant to draw appears on that page (forward);
//   (2) each figure token on the page appears in the fixture (reverse).
// Run from the repository root:  node docs/audit/2026-11-16-final/output/2-sections/S6/probes/s6-figures.mjs
// It copies web/dist to a temporary folder, writes the fixture data file there and opens it from disk with every
// host but loopback blocked. It changes nothing under web/ and closes the browser.
import { cpSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
const { chromium } = require("playwright");
const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);
const exe = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const tmp = mkdtempSync(path.join(tmpdir(), "s6-figures-"));
const dist = path.join(tmp, "dist");
cpSync(path.join(web, "dist"), dist, { recursive: true });
writeDataFile(dist, path.join(web, "fixtures"));
const fx = JSON.parse(readFileSync(path.join(web, "fixtures", "run.json"), "utf8")).slice;
const fixtureText = JSON.stringify(fx);

const TOKEN = /USD [\d,]+\.\d\d|\d+ of \d+|\d+%|\b\d{1,2}:\d\d\b|\d+ min \d\d s|Step \d of \d|\b\d+ modules?\b|\b\d+(?:\.\d+)? (?:MB|KB)\b|\b\d+ (?:documents?|decisions?)\b|FY\d{4}|Q\d FY\d{4}|\d+ [A-Z][a-z]+ \d{4}/g;
const strings = (o, out = []) => { if (typeof o === "string") out.push(o); else if (o && typeof o === "object") for (const v of Object.values(o)) strings(v, out); return out; };

const browser = await chromium.launch({ executablePath: exe, timeout: 30000 });
let bad = 0, checked = 0;
const notDrawn = [];
// the Documents step states the upload limit itself (service limit MAX_FILE, 50 MiB); the fixture holds no such figure
const KNOWN = new Set(["50 MB"]);
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  ctx.setDefaultTimeout(15000); ctx.setDefaultNavigationTimeout(20000);
  await ctx.route("**/*", (r) => { const u = new URL(r.request().url()); return ["file:", "data:", "blob:"].includes(u.protocol) || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname) ? r.continue() : r.abort("blockedbyclient"); });
  const page = await ctx.newPage();
  const items = [...fx.drafts.map((d) => [`#/run/start/${d.id}`, d]), ...fx.runs.map((r) => [`#/run/activity/${r.id}`, r])];
  for (const [hash, rec] of items) {
    await page.goto(pathToFileURL(path.join(dist, "index.html")).href + hash);
    await page.waitForTimeout(250);
    const read = () => page.evaluate(() => document.body.innerText + "\n" + [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label")).join("\n") + "\n" + [...document.querySelectorAll("[role=progressbar]")].map((e) => e.getAttribute("aria-valuenow") + "/" + e.getAttribute("aria-valuemax")).join("\n"));
    const closed = await read(); // before anything is opened: a group's own title and "Show all" label are drawn only here
    // open what a figure can sit behind: the Submit dialog and every "Show all" group
    if (hash === "#/run/start/start") { await page.getByRole("button", { name: /^Submit, spend up to/ }).click(); await page.waitForTimeout(250); }
    for (const label of rec.modules?.steps?.filter((s) => s.kind === "group").map((s) => s.showAll) ?? []) await page.getByRole("button", { name: label }).click();
    const text = closed + "\n" + (await read());
    // forward: figure-bearing fixture strings (those with a digit) that this record draws
    const drawn = strings(rec).filter((s) => /\d/.test(s) && !/^[a-z0-9-]+$/.test(s) && !s.startsWith("#/"));
    for (const s of drawn) {
      checked++;
      if (text.includes(s)) continue;
      // a started draft draws no actions row, so its "Step 5 of 5" is read by the slice and never drawn
      if (rec.step === "started" && s === rec.position) { notDrawn.push(`${hash}: position ${JSON.stringify(s)}`); continue; }
      bad++; console.log(`MISSING ${hash}: fixture string not on page: ${JSON.stringify(s.slice(0, 90))}`);
    }
    // reverse: figure tokens on the page that the fixture does not hold (the page chrome has none)
    const main = await page.evaluate(() => document.querySelector("main").innerText);
    for (const t of new Set(main.match(TOKEN) ?? [])) { checked++; if (!fixtureText.includes(t) && !KNOWN.has(t)) { bad++; console.log(`INVENTED ${hash}: page figure not in fixture: ${JSON.stringify(t)}`); } }
  }
} finally { await browser.close(); rmSync(tmp, { recursive: true, force: true }); }
for (const n of notDrawn) console.log(`NOT DRAWN ${n}`);
console.log(`figure checks ${checked}, mismatches ${bad}, slice fields read and never drawn ${notDrawn.length}`);
process.exit(bad === 0 ? 0 : 1);
