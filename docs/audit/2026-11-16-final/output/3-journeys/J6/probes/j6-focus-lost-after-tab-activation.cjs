// J6-003: keyboard only. Activating a run page's tab link (Overview, Changes, Modules, Evidence)
// replaces the page body, the focused link is removed, focus falls to <body> and the next Tab
// starts again at the left rail instead of the next tab.
const { open, fixtureUrl } = require('./_j6lib.cjs');
const label = (page) => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName}:${(a.getAttribute('aria-label') || a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30)}` : 'null'; });
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    await page.goto(`${url}#/library/halden-aerostructures/2026-09-30/overview`);
    await page.waitForTimeout(800);
    const order = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const l = await label(page);
      order.push(l);
      if (l.startsWith('A:Changes')) break;
    }
    console.log('Tab order from page load up to the Changes tab:', JSON.stringify(order));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const afterEnter = await label(page);
    console.log(JSON.stringify({ hash: await page.evaluate(() => location.hash), focusAfterEnter: afterEnter, expected: 'a:Changes tab, or the page heading' }));
    if (/^BODY/.test(afterEnter)) reproduced = true;
    const toNext = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      const l = await label(page);
      toNext.push(l);
      if (l.startsWith('A:Modules')) break;
    }
    console.log(JSON.stringify({ tabPressesToReachModulesTab: toNext.length, expected: 1, path: toNext }));
    if (toNext.length > 3) reproduced = true;
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: focus is lost to <body> after activating a tab' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
