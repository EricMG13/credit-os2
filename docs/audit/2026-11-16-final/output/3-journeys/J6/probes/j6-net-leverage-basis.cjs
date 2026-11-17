// J6-008 (fixture build): the same Halden net leverage of 4.6x (year to 30 Sep 2026) is tagged
// "Reported" on Overview's "Supports the view" card, "adj." on a company-adjusted EBITDA basis in the
// Library list, and has no basis on the Overview headline card or on the Capital structure page,
// while the Overview's own limitation says Halden is company-adjusted.
const { open, fixtureUrl } = require('./_j6lib.cjs');
const around = (t, re, n = 80) => { const m = re.exec(t); return m ? t.slice(Math.max(0, m.index - n), m.index + m[0].length + n) : ''; };
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    await page.goto(url);
    await page.waitForTimeout(800);
    await page.getByRole('radio', { name: 'List' }).click();
    await page.waitForTimeout(400);
    const list = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const listText = around(list, /4\.6x adj\./);
    await page.goto('about:blank');
    await page.goto(`${url}#/library/halden-aerostructures/2026-09-30/overview`);
    await page.waitForTimeout(800);
    const ov = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const headline = around(ov, /Net leverage 4\.6x/, 10);
    const supports = around(ov, /4\.6x Net leverage fell/, 0) + ov.slice(ov.indexOf('4.6x Net leverage fell'), ov.indexOf('4.6x Net leverage fell') + 130);
    const limitation = around(ov, /Halden is company-adjusted/, 70);
    console.log(JSON.stringify({ libraryList: listText, overviewHeadline: headline, overviewSupportsCard: supports, overviewLimitation: limitation }, null, 1));
    if (/adj\./.test(listText) && /Reported/.test(supports) && /company-adjusted/.test(limitation)) reproduced = true;
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: one figure carries "Reported" and "adj." on two screens' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
