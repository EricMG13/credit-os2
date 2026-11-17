import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";

const repo = process.cwd();
const require = createRequire(path.join(repo, "web/package.json"));
const { chromium } = require("playwright");
const requests = [];
const html = readFileSync(path.join(repo, "web/dist/connected.html"), "utf8")
  .replace("connect-src 'none'", "connect-src 'self'")
  .replaceAll("./connected-assets/", "/connected-assets/")
  .replace(
    "<title>",
    '<meta name="credit-os-mode" content="synthetic"><title>',
  );
const server = createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  requests.push(url.pathname);
  if (url.pathname.startsWith("/connected/")) return;
  if (url.pathname.startsWith("/connected-assets/")) {
    const file = path.join(repo, "web/dist", url.pathname);
    response.setHeader(
      "content-type",
      file.endsWith(".js") ? "application/javascript" : "text/css",
    );
    response.end(readFileSync(file));
    return;
  }
  response.setHeader("content-type", "text/html");
  response.end(html);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const results = [];
try {
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
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: "no-preference",
      });
      const external = [];
      const pageErrors = [];
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        external.push(url.href);
        return route.abort();
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.goto(origin + "/report/loading");
      const message = page.getByText("Loading report…", { exact: true });
      await message.waitFor();
      const status = message.locator("..");
      const observe = () =>
        status.evaluate((element) => ({
          message: element.textContent,
          skeletonBlocks: element.querySelectorAll(".bg-surface-subtle").length,
          animations: element.getAnimations({ subtree: true }).length,
          animationNames: Array.from(
            element.querySelectorAll("*"),
            (node) => getComputedStyle(node).animationName,
          ),
          height: element.getBoundingClientRect().height,
          noPreference: matchMedia("(prefers-reduced-motion: no-preference)")
            .matches,
        }));
      const initial = await observe();
      await page.waitForTimeout(400);
      const settled = await observe();
      results.push({
        name,
        version: browser.version(),
        initial,
        settled,
        external,
        pageErrors,
      });
      assert.equal(initial.noPreference, true);
      assert.equal(initial.skeletonBlocks, 5);
      assert.equal(initial.animations, 0);
      assert.ok(initial.animationNames.every((value) => value === "none"));
      assert.deepEqual(settled, initial);
      assert.deepEqual(external, []);
      assert.deepEqual(pageErrors, []);
    } finally {
      await browser.close();
    }
  }
  assert.ok(requests.includes("/connected/snapshot"));
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  const output =
    process.env.LOADING_RESULT ??
    "/workspace/scratch/small-review-loading.json";
  writeFileSync(output, JSON.stringify(results, null, 2) + "\n");
  console.log(JSON.stringify(results, null, 2));
}
