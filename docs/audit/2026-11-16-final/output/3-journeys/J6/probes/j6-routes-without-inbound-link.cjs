// J6-009 (fixture build): follows every visible in-app link outward from the Library home (Signal
// skipped, out of scope; capped at 400 pages) and lists which routes nothing links to. A link is
// followed by loading its address, which reads the same href a click would use.
const { open, fixtureUrl } = require('./_j6lib.cjs');
const WANT = [
  ['Model forecast page', /^#\/model\/[^/]+\/[^/]+\/forecast$/],
  ['Run start pages (any draft)', /^#\/run\/start\//],
  ['Run activity pages other than the one running example', /^#\/run\/activity\/(?!running$)/],
  ['Brevane Marine (in the library data, not on the home page)', /brevane-marine/],
  ['Corvane Fasteners (in the library data, not on the home page)', /corvane-fasteners/],
  ['Halden run as of 30 Jun 2026', /halden-aerostructures\/2026-06-30/],
  ['Run Modules index (without a module)', /^#\/library\/[^/]+\/[^/]+\/modules$/],
];
(async () => {
  const url = await fixtureUrl();
  const h = await open();
  const { page } = h;
  const seen = new Set();
  const todo = [''];
  const hrefs = new Set();
  let reproduced = false;
  try {
    while (todo.length && seen.size < 400) {
      const hash = todo.shift();
      if (seen.has(hash)) continue;
      seen.add(hash);
      await page.goto('about:blank');
      await page.goto(url + (hash ? hash : ''));
      await page.waitForTimeout(250);
      const links = await page.$$eval('a[href^="#/"]', (els) => els.map((e) => e.getAttribute('href')));
      for (const l of links) {
        if (l.startsWith('#/signal')) continue;
        hrefs.add(l);
        if (!seen.has(l)) todo.push(l);
      }
    }
    console.log(JSON.stringify({ pagesFollowed: seen.size, distinctLinkTargets: hrefs.size }));
    for (const [name, re] of WANT) {
      const linked = [...hrefs].filter((x) => re.test(x));
      console.log(JSON.stringify({ route: name, linkedFromAnyPage: linked.length > 0, targets: linked.slice(0, 3) }));
      if (linked.length === 0) reproduced = true;
    }
    await page.goto('about:blank');
    await page.goto(`${url}#/run`);
    await page.waitForTimeout(500);
    console.log('links in main on #/run:', JSON.stringify(await page.$$eval('main a', (els) => els.map((e) => `${e.innerText.trim()} -> ${e.getAttribute('href')}`))));
    console.log('blocked requests:', JSON.stringify(h.blocked));
  } finally {
    await h.browser.close();
  }
  console.log(reproduced ? 'DEFECT REPRODUCED: routes with no link from any page' : 'not reproduced');
  process.exit(reproduced ? 1 : 0);
})().catch((e) => { console.error('ERR', e); process.exit(2); });
