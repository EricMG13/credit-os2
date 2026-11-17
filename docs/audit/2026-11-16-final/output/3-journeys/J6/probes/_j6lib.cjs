// Shared helper for the J6 probes (static library reader). Run a probe from the repository root:
//   timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J6/probes/<probe>.cjs
// Each probe prints what it measured and exits 1 when the defect reproduces, 0 when it does not.
// It changes nothing under the repository: the fixture variant is a copy of web/dist in a scratch
// folder (J6_SCRATCH, default <tmpdir>/j6-probe) whose data.js is written by web/scripts/fixture-data.mjs
// from web/fixtures/*.json. Every host but file:, data:, blob: and loopback is blocked (ruling R8).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const repo = path.resolve(__dirname, '../../../../../../..');
const { chromium } = require(path.join(repo, 'web', 'node_modules', 'playwright'));
const EXE = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const scratch = process.env.J6_SCRATCH || path.join(os.tmpdir(), 'j6-probe');
const shippedUrl = pathToFileURL(path.join(repo, 'web', 'dist', 'index.html')).href;

async function fixtureUrl() {
  const dir = path.join(scratch, 'dist-fixture');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(scratch, { recursive: true });
  fs.cpSync(path.join(repo, 'web', 'dist'), dir, { recursive: true });
  const { writeDataFile } = await import(pathToFileURL(path.join(repo, 'web', 'scripts', 'fixture-data.mjs')).href);
  writeDataFile(dir, path.join(repo, 'web', 'fixtures'));
  return pathToFileURL(path.join(dir, 'index.html')).href;
}

async function open(viewport = { width: 1440, height: 900 }) {
  const browser = await chromium.launch({ executablePath: EXE });
  const context = await browser.newContext({ viewport });
  const blocked = [];
  const failed = [];
  await context.route('**/*', (route) => {
    const u = route.request().url();
    if (/^(file|data|blob):/.test(u) || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(u)) return route.continue();
    blocked.push(u);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure() && r.failure().errorText}`));
  return { browser, page, blocked, failed };
}

/** Where a probe may save a screenshot: J6_OUT when set, otherwise nowhere. */
function shot(page, name, opts = {}) {
  if (!process.env.J6_OUT) return Promise.resolve();
  fs.mkdirSync(process.env.J6_OUT, { recursive: true });
  return page.screenshot({ path: path.join(process.env.J6_OUT, name), ...opts });
}

module.exports = { repo, open, fixtureUrl, shippedUrl, shot, fs, path };
