// C5 probe: Evidence tab links and the module filter, with mouse and keyboard.
// Usage (repo root): [C5_BASE=http://127.0.0.1:8735 C5_RUN=<run>] node <this file>
// Checks: every tab link x every module option (address, current tab, heading), direct opening of each
// address in a new page, and that ArrowDown on the closed Module select navigates at once (no commit).
"use strict";
const fs = require("fs");
const lib = require("./c5lib.cjs");
const OUT = process.env.C5_OUT || "/tmp/cs-C5/scratch/evidence-tabs-filter.json";

lib.withRun(async ({ page, context, base, run, log }) => {
  const res = { tabs: [], combos: [], direct: [], arrow: null, dropdown: null };
  const evUrl = (hash) => `${base}/report/${run}#evidence${hash ? "/" + hash : ""}`;
  await page.goto(evUrl("summary"));
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator('nav[aria-label="Evidence sections"]').waitFor();
  const options = await page.locator("select option").evaluateAll((os) => os.map((o) => [o.value, o.textContent]));
  res.options = options;
  const tabLinks = await page.locator('nav[aria-label="Evidence sections"] a').evaluateAll((as) => as.map((a) => [a.textContent.trim(), a.getAttribute("href")]));
  res.tabLinks = tabLinks;
  // mouse: click each tab, then each module on each tab
  for (const [label, href] of tabLinks) {
    await page.goto(evUrl("summary"));
    await page.locator('nav[aria-label="Evidence sections"]').waitFor();
    await page.locator('nav[aria-label="Evidence sections"] a', { hasText: label }).first().click();
    await page.waitForTimeout(250);
    const rec = { label, href, url: page.url().replace(base, ""), current: await page.locator('nav[aria-label="Evidence sections"] [aria-current="page"]').first().innerText().catch(() => null) };
    res.tabs.push(rec);
    for (const [value, text] of options) {
      await page.selectOption("select", value);
      await page.waitForTimeout(150);
      const c = {
        tab: label, module: value, url: page.url().replace(base, ""),
        current: await page.locator('nav[aria-label="Evidence sections"] [aria-current="page"]').first().innerText().catch(() => null),
        selected: await page.locator("select").inputValue(),
        hasAlert: (await page.getByRole("alert").count()) > 0,
        mainText: (await page.locator("main").innerText()).slice(-900),
      };
      res.combos.push(c);
    }
  }
  // direct open of each address in a new page, and Back/Forward
  const addrs = ["", "summary", "trace", "sources", "gaps", "checks", "record", "summary/CP-2D", "gaps/CP-6", "checks/CP-4", "sources/CP-DR", "record/CP-1", "trace/CP-8", "summary/NOPE", "bogus", "bogus/CP-1", "checks/NOPE"];
  for (const a of addrs) {
    const p = await context.newPage();
    p.setDefaultTimeout(15000);
    await p.goto(evUrl(a));
    await p.waitForLoadState("networkidle").catch(() => {});
    await p.waitForTimeout(500);
    res.direct.push({
      addr: a,
      current: await p.locator('nav[aria-label="Evidence sections"] [aria-current="page"]').first().innerText().catch(() => null),
      select: await p.locator("select").first().inputValue().catch(() => null),
      alert: await p.getByRole("alert").first().innerText().catch(() => null),
      h2s: await p.locator("main h2, main h3").allInnerTexts().catch(() => []),
      title: await p.title(),
    });
    await p.close();
  }
  // keyboard: ArrowDown on the closed Module select
  await page.goto(evUrl("sources"));
  await page.locator("select").waitFor();
  await page.locator("select").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  res.arrow = { urlAfterOneArrow: page.url().replace(base, ""), value: await page.locator("select").inputValue(), focusOnSelect: await page.evaluate(() => document.activeElement?.tagName) };
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(400);
  res.arrow.urlAfterTwoArrows = page.url().replace(base, "");
  const histLen = await page.evaluate(() => history.length);
  res.arrow.historyLength = histLen;
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ tabs: res.tabs, arrow: res.arrow, blocked: log.blocked, console: log.console.slice(0, 10), pageErrors: log.pageErrors, failed: log.failed.slice(0, 10) }, null, 1));
}).catch((e) => { console.error(e); process.exit(1); });
