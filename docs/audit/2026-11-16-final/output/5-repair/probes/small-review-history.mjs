import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = process.cwd();
const require = createRequire(path.join(repo, "web/package.json"));
const { chromium } = require("playwright");
const { writeDataFile } = await import(
  pathToFileURL(path.join(repo, "web/scripts/fixture-data.mjs"))
);
const scratch = mkdtempSync("/tmp/audit-history-");
const results = [];
try {
  cpSync(path.join(repo, "web/dist"), scratch, { recursive: true });
  writeDataFile(scratch, path.join(repo, "web/fixtures"));
  for (const [name, executablePath] of [
    [
      "Chrome",
      process.env.CHROME_PATH ??
        "/workspace/audit-browsers/chrome/opt/google/chrome/chrome",
    ],
    [
      "Edge",
      process.env.EDGE_PATH ??
        "/workspace/audit-browsers/edge/opt/microsoft/msedge/msedge",
    ],
  ]) {
    const browser = await chromium.launch({ executablePath });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const external = [];
    const pageErrors = [];
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (["file:", "about:", "data:", "blob:"].includes(url.protocol))
        return route.continue();
      external.push(url.href);
      return route.abort();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));
    try {
      const base = pathToFileURL(path.join(scratch, "index.html")).href;
      const modelHash = "#/model/transdigm/2025-06-30/statements";
      await page.goto(base + modelHash);
      await page.locator("#main table").first().waitFor();
      await page.waitForTimeout(600);
      if (process.env.HISTORY_DISABLE_ANCHOR === "1") {
        await page.locator("#main").evaluate((main) => {
          main.style.overflowAnchor = "none";
        });
      }
      await page.locator("#main").evaluate((main) => {
        main.scrollTop = 700;
      });
      await page.waitForTimeout(100);
      const start = await page
        .locator("#main")
        .evaluate((main) => main.scrollTop);
      assert.equal(
        start,
        700,
        "the fixture must have room for the independent departure offset",
      );
      const offsets = [];
      for (let round = 0; round < 4; round += 1) {
        // Direct-address hash navigation changes no departure scroll position.
        await page.evaluate(() => {
          window.location.hash = "/kit";
        });
        await page.waitForURL(base + "#/kit");
        await page.waitForTimeout(400);
        const arrival = await page
          .locator("#main")
          .evaluate((main) => main.scrollTop);
        await page.goBack();
        await page.waitForURL(base + modelHash);
        await page.locator("#main table").first().waitFor();
        await page.waitForTimeout(500);
        const restored = await page
          .locator("#main")
          .evaluate((main) => main.scrollTop);
        offsets.push({
          round: round + 1,
          arrival,
          restored,
          drift: restored - start,
        });
      }
      // Manual positions remain owned by the reader in both history directions.
      await page.locator("#main").evaluate((main) => {
        main.scrollTop = 910;
      });
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        window.location.hash = "/kit";
      });
      await page.waitForURL(base + "#/kit");
      await page.waitForTimeout(400);
      await page.locator("#main").evaluate((main) => {
        main.scrollTop = 310;
      });
      await page.waitForTimeout(100);
      await page.goBack();
      await page.waitForURL(base + modelHash);
      await page.waitForTimeout(500);
      const manualBack = await page
        .locator("#main")
        .evaluate((main) => main.scrollTop);
      await page.goForward();
      await page.waitForURL(base + "#/kit");
      await page.waitForTimeout(500);
      const manualForward = await page
        .locator("#main")
        .evaluate((main) => main.scrollTop);
      results.push({
        name,
        version: browser.version(),
        start,
        offsets,
        manualBack,
        manualForward,
        external,
        pageErrors,
      });
      assert.equal(manualBack, 910);
      assert.equal(manualForward, 310);
      assert.deepEqual(
        offsets.map(({ arrival }) => arrival),
        [0, 0, 0, 0],
      );
      assert.deepEqual(
        offsets.map(({ restored }) => restored),
        [700, 700, 700, 700],
      );
      assert.deepEqual(external, []);
      assert.deepEqual(pageErrors, []);
    } finally {
      await browser.close();
    }
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
  const output =
    process.env.HISTORY_RESULT ??
    "/workspace/scratch/small-review-history.json";
  writeFileSync(output, JSON.stringify(results, null, 2) + "\n");
  console.log(JSON.stringify(results, null, 2));
}
