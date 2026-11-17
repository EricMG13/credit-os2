// J6 low-severity observations, measured in one pass (shipped build unless a line says fixture):
//  a. every route draws the page title "Credit OS" (shipped and fixture);
//  b. after visiting Kit, a stray off-screen element holding "FY21" stays in <body> on later pages (shipped);
//  c. the three empty-state sentences of the shipped build (Library, Model, Run) and what each offers next;
//  d. "Page not found" offers no control (shipped);
//  e. on the Overview the trace buttons share three accessible names (fixture);
//  f. Library search is cleared by Back (fixture);
//  g. Halden 30 Jun 2026: history row says "Monitoring update", its report says "Full review", the report
//     stays a loading skeleton and the row has no "Open report" link (fixture).
const { open, fixtureUrl, shippedUrl } = require('./_j6lib.cjs');
const out = (k, v) => console.log(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
(async () => {
  const fx = await fixtureUrl();
  const h = await open();
  const { page } = h;
  try {
    // a. titles
    const titles = {};
    for (const [n, u] of [['shipped #/', shippedUrl], ['shipped #/model', `${shippedUrl}#/model`], ['fixture overview', `${fx}#/library/halden-aerostructures/2026-09-30/overview`], ['fixture evidence', `${fx}#/library/halden-aerostructures/2026-09-30/evidence/trace`], ['fixture model', `${fx}#/model/transdigm/2025-06-30/front`], ['fixture run', `${fx}#/run/activity/finished`]]) {
      await page.goto('about:blank'); await page.goto(u); await page.waitForTimeout(500); titles[n] = await page.title();
    }
    out('a. document.title per screen', titles);
    // b. stray FY21
    await page.goto('about:blank'); await page.goto(shippedUrl); await page.waitForTimeout(500);
    const before = await page.evaluate(() => /FY21/.test(document.body.innerText));
    await page.getByRole('link', { name: 'Kit', exact: true }).click(); await page.waitForTimeout(800);
    await page.getByRole('link', { name: 'Library', exact: true }).click(); await page.waitForTimeout(500);
    const stray = await page.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/FY21/.test(n.textContent)) { const e = n.parentElement; const b = e.getBoundingClientRect(); return { tag: e.tagName, parent: e.parentElement.tagName, top: Math.round(b.top), outsideRoot: !document.getElementById('root').contains(e), ariaHidden: e.getAttribute('aria-hidden'), bodyTextTail: document.body.innerText.slice(-40) }; } return null; });
    out('b. "FY21" in body before Kit / after Kit then Library', { before, after: stray });
    // c. empty states
    const empties = {};
    for (const [n, a] of [['Library', '#/'], ['Model', '#/model'], ['Run', '#/run']]) {
      await page.goto('about:blank'); await page.goto(shippedUrl + a); await page.waitForTimeout(500);
      empties[n] = { text: (await page.locator('main').innerText()).replace(/\s+/g, ' '), controlsInMain: await page.locator('main a, main button').count() };
    }
    out('c. shipped empty states', empties);
    // d. not found
    await page.goto('about:blank'); await page.goto(`${shippedUrl}#/nowhere`); await page.waitForTimeout(500);
    out('d. "Page not found" main text and controls in main', { text: (await page.locator('main').innerText()).replace(/\s+/g, ' '), controls: await page.locator('main a, main button').count() });
    // e. identical names
    await page.goto('about:blank'); await page.goto(`${fx}#/library/halden-aerostructures/2026-09-30/overview`); await page.waitForTimeout(800);
    const names = await page.$$eval('main button[aria-label^="Show sources for"]', (els) => els.map((e) => e.getAttribute('aria-label')));
    const counts = {}; names.forEach((n) => { counts[n] = (counts[n] || 0) + 1; });
    out('e. Overview trace-button names (count each)', counts);
    // f. search cleared by Back
    await page.goto('about:blank'); await page.goto(fx); await page.waitForTimeout(800);
    await page.getByPlaceholder('Search issuers').fill('corvane'); await page.waitForTimeout(400);
    const cardsBefore = await page.$$eval('main a[href*="/library/"]', (els) => els.filter((e) => e.getBoundingClientRect().width > 0).length);
    await page.getByRole('link', { name: /Corvane Packaging/ }).first().click(); await page.waitForTimeout(500);
    await page.goBack(); await page.waitForTimeout(600);
    out('f. search "corvane": cards before, after Back, search box after Back', { cardsBefore, cardsAfter: await page.$$eval('main a[href*="/library/"]', (els) => els.filter((e) => e.getBoundingClientRect().width > 0).length), searchBox: await page.getByPlaceholder('Search issuers').inputValue() });
    // g. 30 Jun 2026
    await page.goto('about:blank'); await page.goto(`${fx}#/library/halden-aerostructures/history`); await page.waitForTimeout(800);
    const hist = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const row = (hist.match(/Run as of 30 Jun 2026.{0,200}?(?=Run as of 31 Mar 2026)/) || [''])[0];
    const openLinks = await page.$$eval('main a', (els) => els.map((e) => e.getAttribute('href')).filter((h2) => /2026-06-30/.test(h2)));
    await page.goto('about:blank'); await page.goto(`${fx}#/library/halden-aerostructures/2026-06-30/overview`); await page.waitForTimeout(2500);
    out('g. history row / links naming 2026-06-30 / report header / aria-busy elements after 2.5 s', { row, linksToThatRun: openLinks, header: (await page.locator('main').innerText()).replace(/\s+/g, ' ').slice(0, 130), busy: await page.locator('[aria-busy=true]').count() });
    out('blocked requests', h.blocked);
  } finally {
    await h.browser.close();
  }
})().catch((e) => { console.error('ERR', e); process.exit(2); });
