// J6-007 (fixture build): Halden Aerostructures' Overview heads its Forecast tab "No forecast for this
// run" while the same page's module list shows a module named Forecast as "Delivered" with a base
// case ("Base case reaches 4.1x by September 2027; downside stays at 4.8x").
const { open, fixtureUrl, shot } = require('./_j6lib.cjs');
(async () => {
  const url = await fixtureUrl();
  const h = await open({ width: 1440, height: 3300 });
  const { page } = h;
  let reproduced = false;
  try {
    await page.goto(`${url}#/library/halden-aerostructures/2026-09-30/overview`);
    await page.waitForTimeout(900);
    const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const tab = (text.match(/Forecast No forecast for this run/) || [''])[0];
    const mod = (text.match(/Forecast Base case reaches[^.]*\.[^.]*\.?/) || [''])[0];
    const delivered = /Forecast Base case reaches.{0,120}Delivered/.test(text);
    console.log(JSON.stringify({ tabText: tab, moduleRow: mod, moduleRowMarkedDelivered: delivered }));
    if (tab && mod) reproduced = true;
    await shot(page, 'j6-007-overview-tab-strip.png', { clip: { x: 0, y: 0, width: 1440, height: 240 } });
    await shot(page, 'j6-007-overview-module-rows.png', { clip: { x: 640, y: 2150, width: 800, height: 520 } });
    await page.goto('about:blank');
    await page.goto(`${url}#/library/halden-aerostructures/2026-09-30/modules/forecast`);
    await page.waitForTimeout(700);
    console.log('Forecast module page opens:', (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(430, 700));
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: "No forecast for this run" beside a delivered Forecast module' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
