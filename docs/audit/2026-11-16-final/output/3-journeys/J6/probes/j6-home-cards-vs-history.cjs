// J6-006 (fixture build): four Library home cards state a verdict, a state and "n of n modules",
// but the issuer's own page says "No report yet"; Corvane Packaging's page header also says
// "two runs since June 2026" directly above "No report for this issuer is held in this library yet".
const { open, fixtureUrl, shot } = require('./_j6lib.cjs');
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  let reproduced = false;
  try {
    await page.goto(url);
    await page.waitForTimeout(900);
    const cards = await page.$$eval('main a[href*="/library/"]', (els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => ({ href: e.getAttribute('href'), text: e.innerText.replace(/\s+/g, ' ').slice(0, 600) })));
    for (const c of cards) {
      await page.goto('about:blank');
      await page.goto(`${url}${c.href}`);
      await page.waitForTimeout(600);
      const body = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
      const noReport = /No report yet/.test(body);
      const stateOnCard = (c.text.match(/Finished|Running|Failed|Capped/) || [''])[0];
      const modules = (c.text.match(/\d+ of \d+ modules/) || [''])[0];
      console.log(JSON.stringify({ card: c.text.slice(0, 40), cardState: stateOnCard, cardModules: modules, opens: c.href, pageSays: body.slice(0, 150), noReportYet: noReport }));
      if (noReport) reproduced = true;
      if (/corvane-packaging/.test(c.href)) await shot(page, 'j6-006-corvane-history.png');
    }
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: cards promise a report the issuer page says does not exist' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
