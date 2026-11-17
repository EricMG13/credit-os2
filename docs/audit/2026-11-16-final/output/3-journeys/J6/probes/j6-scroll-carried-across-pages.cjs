// J6-002: the app scrolls inside <main>, and that scroll offset is not reset or stored per page.
// (a) Following a link from a scrolled page opens the next page scrolled to the same offset, clamped
//     to its height, so its title, run chips and tabs are above the window.
// (b) Back does not return the reader to the offset they left the page at.
const { open, fixtureUrl, shot } = require('./_j6lib.cjs');
const top = (page) => page.evaluate(() => { const m = document.querySelector('main'); return Math.round(m.scrollTop); });
const headerVisible = (page) => page.evaluate(() => { const h = document.querySelector('main h1'); if (!h) return null; const r = h.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    await page.goto(`${url}#/library/halden-aerostructures/2026-09-30/overview`);
    await page.waitForTimeout(800);
    await page.evaluate(() => { document.querySelector('main').scrollTop = 700; });
    await page.waitForTimeout(200);
    const before = await top(page);
    await shot(page, 'j6-002-overview-scrolled.png');
    await page.getByRole('link', { name: /gaps in Evidence/ }).first().click();
    await page.waitForTimeout(700);
    const landed = await top(page);
    const titleVisible = await headerVisible(page);
    console.log(JSON.stringify({ step: 'follow link from Overview scrolled to 700', hash: await page.evaluate(() => location.hash), scrollOnArrival: landed, expected: 0, issuerTitleInWindow: titleVisible }));
    await shot(page, 'j6-002-evidence-after-link.png');
    if (landed !== 0) reproduced = true;
    await page.goBack();
    await page.waitForTimeout(700);
    const back = await top(page);
    console.log(JSON.stringify({ step: 'Back to Overview', hash: await page.evaluate(() => location.hash), scrollAfterBack: back, expected: before }));
    if (back !== before) reproduced = true;
    await page.goForward();
    await page.waitForTimeout(700);
    console.log(JSON.stringify({ step: 'Forward to Evidence', scrollAfterForward: await top(page) }));
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: scroll offset leaks between pages and is not restored by Back' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
