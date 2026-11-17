// Shared helper for the J1 probes. Not a probe itself.
// Starts proof.serve on port 8761 with a fresh root under /tmp/jr/, drives Chromium (headless shell build 1243)
// with every host but loopback blocked (ruling R8), and stops the service's process group when done.
const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const REPO = path.resolve(__dirname, '../../../../../../..');
const { chromium } = require(path.join(REPO, 'web/node_modules/playwright'));
const PORT = 8761;
const BASE = `http://127.0.0.1:${PORT}`;
const SHELL = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

const ping = (url) =>
  new Promise((resolve) => {
    const req = http.get(url, (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', () => resolve(0));
    req.setTimeout(2000, () => { req.destroy(); resolve(0); });
  });

async function startService(tag) {
  fs.mkdirSync('/tmp/jr', { recursive: true });
  const root = fs.mkdtempSync(`/tmp/jr/j1-probe-${tag}-`); // fresh, empty, short (root path limit is 80 characters)
  const log = fs.openSync(path.join(root + '.service.log'), 'w');
  const child = spawn('/root/.local/bin/uv', ['run', '--locked', 'python', '-m', 'proof.serve', '--root', root, '--port', String(PORT)], {
    cwd: REPO, env: { ...process.env, PYTHONPATH: 'src' }, detached: true, stdio: ['ignore', log, log],
  });
  child.unref();
  for (let i = 0; i < 200; i++) {
    if ((await ping(BASE + '/')) > 0) return { child, root };
    if (child.exitCode !== null) throw new Error('service exited early; see ' + root + '.service.log');
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('service did not answer on ' + BASE);
}

function stopService(svc) {
  if (!svc || !svc.child || !svc.child.pid) return;
  try { process.kill(-svc.child.pid, 'SIGTERM'); } catch (e) { /* already gone */ }
  try { execSync('sleep 1'); process.kill(-svc.child.pid, 'SIGKILL'); } catch (e) { /* already gone */ }
}

async function launch(viewport) {
  const browser = await chromium.launch({ executablePath: SHELL });
  const context = await browser.newContext({ viewport: viewport || { width: 1440, height: 900 } });
  const blocked = [];
  await context.route('**/*', (route) => {
    let ok = false;
    try {
      const u = new URL(route.request().url());
      ok = ['file:', 'data:', 'blob:'].includes(u.protocol) || ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(u.hostname);
    } catch (e) { /* unparsable: block */ }
    if (ok) return route.continue();
    blocked.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  return { browser, page, blocked };
}

const FILES = {
  filing: path.join(REPO, 'proof/northbridge-filing.txt'),
  workbook: path.join(REPO, 'proof/northbridge-portfolio.xlsx'),
  agreement: path.join(REPO, 'proof/northbridge-credit-agreement.txt'),
};

// Step 1 and 2: documents, issuer, date, name; then choose a pathway card by its visible name.
async function documentsAndPurpose(page, { files, pathway, name }) {
  await page.goto(BASE + '/start');
  await page.getByLabel('Issuer name', { exact: true }).fill('Northbridge Synthetic Group');
  await page.getByLabel('As-of date', { exact: true }).fill('2025-03-31');
  if (name) await page.getByLabel('Your name', { exact: true }).fill(name);
  await page.getByLabel('Documents', { exact: true }).setInputFiles(files);
  await page.getByRole('button', { name: 'Continue to purpose', exact: true }).click();
  await page.getByRole('heading', { name: 'Purpose', exact: true }).waitFor();
  if (pathway) await page.getByText(pathway, { exact: true }).first().click();
  await page.getByRole('button', { name: 'Continue to context', exact: true }).click();
  await page.getByRole('heading', { name: 'More context', exact: true }).waitFor();
}

// Step 4: accept every limit, approve, and press Submit; resolves with the confirmation dialog open.
async function approveAndSubmit(page) {
  await page.getByRole('heading', { name: 'Review and start', exact: true }).waitFor();
  await page.waitForTimeout(2500);
  for (const box of await page.getByRole('region', { name: 'Limits to decide' }).getByRole('checkbox').all()) await box.check();
  await page.getByRole('checkbox', { name: /^Approve:/ }).check();
  await page.getByRole('button', { name: 'Submit run', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  return dialog;
}

// Waits for the run page to leave Queued/Running; returns the text above "Cap usage".
async function waitForEnd(page) {
  await page.waitForURL(/\/run\//);
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(1000);
    const head = ((await page.locator('main').innerText()).split('Cap usage')[0]) || '';
    if (/\b(Finished|Failed|Capped|Rejected|Interrupted)\b/.test(head) && !/\b(Running|Queued)\b/.test(head)) return head;
  }
  throw new Error('run did not end within 60 s');
}

async function main(tag, body) {
  let svc, b;
  let defect = false;
  try {
    svc = await startService(tag);
    b = await launch();
    defect = await body(b.page, { BASE, FILES, documentsAndPurpose, approveAndSubmit, waitForEnd, root: svc.root });
    if (b.blocked.length) { console.log('R8: blocked non-loopback requests: ' + JSON.stringify(b.blocked)); defect = true; }
  } finally {
    if (b) await b.browser.close().catch(() => {});
    stopService(svc);
    if (svc) { // remove this probe's own fresh root and log
      try { fs.rmSync(svc.root, { recursive: true, force: true }); fs.rmSync(svc.root + '.service.log', { force: true }); } catch (e) { /* leave it */ }
    }
  }
  process.exitCode = defect ? 1 : 0;
}

module.exports = { main, BASE, FILES, REPO };
