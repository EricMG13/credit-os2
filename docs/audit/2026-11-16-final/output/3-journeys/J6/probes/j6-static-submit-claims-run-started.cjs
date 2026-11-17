// J6-010 (fixture build, address typed because no link leads here): in the static app, which has no
// run service, the example Start step offers an enabled "Submit, spend up to USD 20.00"; confirming
// "Start a paid run?" draws "Run started ... The run carries on" although the page made no request
// of any kind (fetch, XMLHttpRequest, beacon, WebSocket all counted). The "saved example" notice that
// the Documents step carries is absent from the Start step and from the "started" screen.
const { open, fixtureUrl, shot } = require('./_j6lib.cjs');
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    await page.addInitScript(() => {
      window.__calls = [];
      const wrap = (obj, name) => { const orig = obj[name]; if (typeof orig !== 'function') return; obj[name] = function (...a) { window.__calls.push(name); return orig.apply(this, a); }; };
      wrap(window, 'fetch'); wrap(XMLHttpRequest.prototype, 'send'); wrap(navigator, 'sendBeacon');
      const WS = window.WebSocket; window.WebSocket = function (...a) { window.__calls.push('WebSocket'); return new WS(...a); };
      document.addEventListener('securitypolicyviolation', (e) => window.__calls.push('csp:' + e.violatedDirective));
    });
    const notes = {};
    for (const d of ['documents', 'purpose', 'confirm', 'context', 'start', 'started']) {
      await page.goto('about:blank');
      await page.goto(`${url}#/run/start/${d}`);
      await page.waitForTimeout(500);
      notes[d] = /saved example/.test(await page.locator('main').innerText());
    }
    console.log('"saved example" notice present per step:', JSON.stringify(notes));
    await page.goto('about:blank');
    await page.goto(`${url}#/run/start/start`);
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /^Submit, spend up to/ }).click();
    await page.waitForTimeout(500);
    const dialog = (await page.locator('[role=dialog],[role=alertdialog]').first().innerText()).replace(/\s+/g, ' ');
    console.log('dialog:', dialog);
    await shot(page, 'j6-010-paid-run-dialog.png');
    await page.getByRole('button', { name: /^Start run, up to/ }).click();
    await page.waitForTimeout(800);
    const after = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const claim = (after.match(/Run started.{0,230}/) || [''])[0];
    console.log('after confirming:', JSON.stringify({ hash: await page.evaluate(() => location.hash), claim }));
    await shot(page, 'j6-010-run-started-claim.png');
    const calls = await page.evaluate(() => window.__calls);
    console.log('network calls made by the page (fetch/XHR/beacon/WebSocket/CSP violations):', JSON.stringify(calls));
    console.log('requests blocked by the audit harness:', JSON.stringify(h.blocked));
    if (/Run started/.test(claim) && calls.length === 0 && !notes.start) reproduced = true;
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: "Run started" shown with no request made and no saved-example notice' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
