// J6-001: on the fixture build, "Download handoffs" (Evidence > Summary) and "Download all"
// (Evidence > Record) point at downloads/<run>-*.zip beside index.html. No such folder ships, so the
// click replaces the whole tab with the browser's file-not-found page and the reader loses the app.
const { open, fixtureUrl, shot } = require('./_j6lib.cjs');
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    for (const [route, name] of [['evidence/summary', 'Download handoffs'], ['evidence/record', 'Download all']]) {
      const urls = [];
      page.on('framenavigated', (f) => urls.push(f.url()));
      await page.goto('about:blank');
      await page.goto(`${url}#/library/halden-aerostructures/2026-09-30/${route}`);
      await page.waitForTimeout(700);
      const link = page.getByRole('link', { name }).first();
      const href = await link.getAttribute('href');
      await link.click({ noWaitAfter: true });
      await page.waitForTimeout(1500);
      const after = page.url();
      const lost = after.startsWith('chrome-error://');
      console.log(JSON.stringify({ route, link: name, href, urlAfterClick: after, appStillOnScreen: !lost }));
      if (lost) reproduced = true;
      await shot(page, `j6-001-after-${name.toLowerCase().replace(/ /g, '-')}.png`);
    }
    console.log('failed requests:', JSON.stringify(h.failed));
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: the click left the app for a browser error page' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
