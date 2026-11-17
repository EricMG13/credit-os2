// Support module for the S6 probes (not a probe itself). Each probe runs from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/S6/probes/<name>.mjs
// It copies web/dist into a temporary folder, writes the fixture data file there (web/fixtures/*.json, with the run
// fixture optionally changed by `mutate`), opens the copy from disk in headless Chromium with every host but
// loopback blocked, and removes the folder. Nothing under web/ is changed. No service is started.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
export const web = path.join(repo, "web");
const require = createRequire(path.join(web, "package.json"));
const { chromium } = require("playwright");
const { writeDataFile } = await import(pathToFileURL(path.join(web, "scripts", "fixture-data.mjs")).href);
const EXE =
  process.env.CHROMIUM ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

export const runFixture = () => JSON.parse(readFileSync(path.join(web, "fixtures", "run.json"), "utf8"));

/** Runs `body({ open, page, dist, ctxFor })` against a fresh copy of the built app. `mutate(slice)` edits the run slice. */
export async function withApp(body, { mutate, viewport = { width: 1440, height: 900 }, data = "fixture" } = {}) {
  const tmp = mkdtempSync(path.join(tmpdir(), "s6-probe-"));
  const dist = path.join(tmp, "dist");
  cpSync(path.join(web, "dist"), dist, { recursive: true });
  if (data === "fixture") {
    const fx = path.join(tmp, "fixtures");
    mkdirSync(fx);
    for (const g of ["library", "model", "signal"]) cpSync(path.join(web, "fixtures", `${g}.json`), path.join(fx, `${g}.json`));
    const run = runFixture();
    if (mutate) mutate(run.slice);
    writeFileSync(path.join(fx, "run.json"), JSON.stringify(run));
    writeDataFile(dist, fx);
  }
  const browser = await chromium.launch({ executablePath: EXE, timeout: 30000 });
  const blocked = [];
  try {
    const ctxFor = async (size = viewport, extra = {}) => {
      const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1, ...extra });
      ctx.setDefaultTimeout(15000);
      ctx.setDefaultNavigationTimeout(20000);
      await ctx.route("**/*", (r) => {
        const u = new URL(r.request().url());
        if (["file:", "data:", "blob:"].includes(u.protocol) || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)) return r.continue();
        blocked.push(u.href);
        return r.abort("blockedbyclient");
      });
      return ctx;
    };
    const ctx = await ctxFor();
    const page = await ctx.newPage();
    const open = async (hash, p = page) => {
      await p.goto(pathToFileURL(path.join(dist, "index.html")).href + hash);
      await p.waitForTimeout(250);
    };
    await body({ open, page, dist, ctxFor, blocked });
    if (blocked.length) console.log("BLOCKED REQUESTS", JSON.stringify(blocked));
  } finally {
    await browser.close();
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** The element focus is on, as a short string. */
export const active = (page) =>
  page.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return "body";
    return `${e.tagName.toLowerCase()} "${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 40)}"`;
  });

export const verdict = (fails) => {
  console.log(fails === 0 ? "RESULT: expected behaviour (no defect reproduced)" : `RESULT: ${fails} defect check(s) reproduced`);
  process.exitCode = fails === 0 ? 0 : 1;
};
