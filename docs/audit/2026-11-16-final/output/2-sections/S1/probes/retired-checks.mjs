// Harmony: retired items on the bare addresses (module codes, report.html, workbook export, memo, adjusted-EBITDA filters) and the rail entries.
// Run from the repository root: timeout 150 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/retired-checks.mjs
import { makeDist, pageUrl, shippedUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page, log } = await open({ width: 1440, height: 900 });
  try {
    const pages = [["shipped", ""], ["fixture", "#/"], ["fixture", "#/library"], ["fixture", "#/model"], ["fixture", "#/run"], ["fixture", "#/kit"], ["fixture", "#/no-such-page"]];
    for (const [v, h] of pages) {
      await page.goto("about:blank"); await page.goto(v === "shipped" ? shippedUrl(h) : pageUrl(dir, h)); await page.waitForSelector("h1"); await sleep(250);
      const hits = await page.evaluate(() => { const t = document.body.innerText; const re = { "CP- code": /\bCP-[A-Z0-9]+/g, "report.html": /report\.html/gi, "workbook/Excel export": /export to excel|download.*workbook|\.xlsx export/gi, memo: /\bmemo\b/gi, "short snapshot": /short (credit )?snapshot/gi, "Reports rail entry": /^Reports$/gm, "Event calendar": /event calendar/gi, "US$m": /US\$m/g, "decision ledger": /decision ledger/gi }; const o = {}; for (const [k, r] of Object.entries(re)) { const m = t.match(r); if (m) o[k] = m.slice(0, 3); } return { hits: o, rail: [...document.querySelectorAll("nav[aria-label=Areas] a")].map((a) => a.getAttribute("aria-label")) }; });
      console.log(`${v} ${h || "(empty)"}: ` + JSON.stringify(hits));
    }
    // adjusted-EBITDA figures in the screening filters (R-21): choose each Net leverage range in the List view
    await page.goto("about:blank"); await page.goto(pageUrl(dir, "#/")); await page.waitForSelector("h1"); await sleep(250);
    await page.getByRole("radio", { name: "List" }).click(); await sleep(250);
    const rows = async () => (await page.getByRole("grid", { name: "Issuers" }).getByRole("row").allInnerTexts()).slice(1).map((r) => r.split("\n")[0].trim());
    for (const metric of ["Leverage", "Net leverage", "Interest coverage"]) {
      const btn = page.getByRole("button", { name: new RegExp(`^${metric}:`) });
      await btn.click(); await sleep(200);
      const opts = await page.getByRole("option").allInnerTexts();
      for (const o of opts.filter((x) => x !== "All")) {
        await btn.click().catch(() => {}); await sleep(150);
        await page.getByRole("option", { name: o, exact: true }).click(); await sleep(250);
        console.log(`${metric} = ${o}: ` + JSON.stringify(await rows()));
        await btn.click(); await sleep(150); await page.getByRole("option", { name: "All", exact: true }).click(); await sleep(200);
      }
    }
    console.log("log " + JSON.stringify(log));
  } finally { await browser.close(); }
} finally { cleanup(); }
