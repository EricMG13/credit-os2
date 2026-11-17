// J6-005 (fixture build): "Start a run" (Library home) and "New run" (an issuer's report) are the
// blue primary buttons, but the static app has no run service. Both go to #/run, which draws the
// saved example run of another issuer (TransDigm Group, "Running", "Started today at 14:38").
const { open, fixtureUrl, shot } = require('./_j6lib.cjs');
const snap = (page) => page.evaluate(() => ({ hash: location.hash, h1: [...document.querySelectorAll('h1')].map((e) => e.innerText).join('|'), text: document.querySelector('main').innerText.replace(/\s+/g, ' ').slice(0, 240) }));
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    await page.goto(url);
    await page.waitForTimeout(800);
    await page.getByRole('link', { name: 'Start a run' }).click();
    await page.waitForTimeout(600);
    let s = await snap(page);
    console.log(JSON.stringify({ step: 'Library home > Start a run', ...s }));
    if (/TransDigm/.test(s.h1) && /Running/.test(s.text)) reproduced = true;
    await shot(page, 'j6-005-start-a-run-from-home.png');
    await page.goto('about:blank');
    await page.goto(`${url}#/library/halden-aerostructures/2026-09-30/overview`);
    await page.waitForTimeout(800);
    await page.getByRole('link', { name: 'New run' }).click();
    await page.waitForTimeout(600);
    s = await snap(page);
    console.log(JSON.stringify({ step: 'Halden Aerostructures report > New run', ...s }));
    if (/TransDigm/.test(s.h1)) reproduced = true;
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: the start buttons open another issuer\'s saved running run' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
