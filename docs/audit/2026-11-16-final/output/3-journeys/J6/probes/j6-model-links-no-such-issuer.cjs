// J6-004 (fixture build): every link that leaves a Model page for the library opens
// "Evidence / No such issuer", because the model fixture's issuer ("transdigm") is not in the library
// fixture. Counts the library-bound links on one Model page, then follows a figure's trace control
// and the "Back to the report" button. (Extends the stage 0 carry, which names run activity only.)
const { open, fixtureUrl, shot } = require('./_j6lib.cjs');
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    const front = `${url}#/model/transdigm/2025-06-30/front`;
    await page.goto(front);
    await page.waitForTimeout(800);
    const hrefs = await page.$$eval('main a[href^="#/library/"]', (els) => els.map((e) => e.getAttribute('href')));
    console.log(JSON.stringify({ modelPage: '#/model/transdigm/2025-06-30/front', linksIntoLibrary: hrefs.length, distinctTargets: [...new Set(hrefs)] }));
    const trace = page.locator('main button[aria-label^="Show the sources for"], main a[aria-label^="Show the sources for"]').first();
    const traceName = await trace.getAttribute('aria-label');
    const traceTag = await trace.evaluate((e) => e.tagName);
    await trace.click();
    await page.waitForTimeout(600);
    let screen = (await page.locator('main').innerText()).replace(/\n+/g, ' | ').slice(0, 160);
    console.log(JSON.stringify({ step: `click trace control "${traceName}" (${traceTag})`, hash: await page.evaluate(() => location.hash), screen }));
    if (/No such issuer/.test(screen)) reproduced = true;
    await shot(page, 'j6-004-model-trace-no-such-issuer.png');
    await page.goto('about:blank');
    await page.goto(front);
    await page.waitForTimeout(800);
    await page.getByRole('link', { name: 'Back to the report' }).click();
    await page.waitForTimeout(600);
    screen = (await page.locator('main').innerText()).replace(/\n+/g, ' | ').slice(0, 160);
    console.log(JSON.stringify({ step: 'click "Back to the report"', hash: await page.evaluate(() => location.hash), screen }));
    if (/No such issuer/.test(screen)) reproduced = true;
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: Model page links end on "No such issuer"' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
