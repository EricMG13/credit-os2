// Stage 0 (static): screenshots with the "Show sources" switch on, which reveals no new controls.
// Usage (from the repo root, after crawl.mjs wrote <outDir>/dist-fixture): node .../show-sources.mjs <outDir>
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(path.join(process.cwd(), "web", "package.json"));
const { chromium } = require("playwright");
const outDir = path.resolve(process.argv[2]);
const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
let browser;
try { browser = await chromium.launch(); } catch {
  const shell = readdirSync(root).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse()
    .map((d) => path.join(root, d, "chrome-headless-shell-linux64", "chrome-headless-shell")).find(existsSync);
  browser = await chromium.launch({ executablePath: shell });
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const blocked = [];
await ctx.route("**/*", (r) => { const u = new URL(r.request().url());
  if (["file:", "data:", "blob:"].includes(u.protocol) || ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)) return r.continue();
  blocked.push(u.href); return r.abort(); });
const page = await ctx.newPage();
const base = pathToFileURL(path.join(outDir, "dist-fixture", "index.html")).href;
const H = "/library/halden-aerostructures/2026-09-30";
for (const a of [`${H}/overview`, `${H}/modules/capital-structure`, `${H}/evidence/trace/net-leverage`]) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto("about:blank"); await page.goto(`${base}#${a}`); await page.waitForTimeout(300);
    await page.getByRole("switch", { name: "Show sources", exact: true }).locator("xpath=ancestor::label[1]").click();
    await page.waitForTimeout(300);
    const on = await page.getByRole("switch", { name: "Show sources", exact: true }).isChecked();
    const file = `fixture__${a.slice(1).replace(/[^a-zA-Z0-9._-]+/g, "_")}__full__sources-on__${width}.png`;
    await page.screenshot({ path: path.join(outDir, "screens", "static", file), fullPage: true });
    console.log(JSON.stringify({ file, screen: `#${a}`, width, switchChecked: on }));
  }
}
console.log(JSON.stringify({ blocked }));
await browser.close();
