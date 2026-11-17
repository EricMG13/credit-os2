// C1-002: Library with no completed run draws a bare "No reports yet" card (rubric D-31) with filters over nothing.
// The empty service answers /connected/library with an object whose catalogue.real is empty (stage 0 e1 capture);
// the response is supplied in the browser so the probe works on a service that already holds runs.
"use strict";
const L = require("./lib.cjs");
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const page = await L.open(context, log);
      await page.route("**/connected/library", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ catalogue: { real: [] }, workspace: { runs: {} } }) }));
      await page.goto(`${L.BASE}/`);
      await L.settle(page, 800);
      const main = page.locator("main");
      const facts = await main.evaluate((el) => ({
        text: el.innerText.replace(/\n+/g, " | "),
        svgInMain: el.querySelectorAll("svg").length,
        links: [...el.querySelectorAll("a")].map((a) => a.innerText.trim()),
        buttons: el.querySelectorAll("button").length,
        selects: el.querySelectorAll("select").length,
        radios: el.querySelectorAll("[role=radio]").length,
      }));
      console.log(JSON.stringify(facts));
      await L.shot(page, "c1-002-library-empty");
      // Run activity's own empty state, for comparison: featured icon, title, sentence, action.
      const act = await L.open(context, log, "/runs");
      await act.route("**/connected/activity", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ updated: "2026-11-17T08:00:00Z", held: "", runs: [], ended: [], ended_total: 0, unreadable: 0 }) }));
      await act.goto(`${L.BASE}/runs`);
      await L.settle(act, 800);
      const compare = await act.locator("main").evaluate((el) => ({ svg: el.querySelectorAll("svg").length, h2: el.querySelectorAll("h2").length, text: el.innerText.replace(/\n+/g, " | ") }));
      console.log("run activity empty state:", JSON.stringify(compare));
      const bare = facts.text.includes("No reports yet") && facts.svgInMain === 0 && facts.selects === 2 && facts.radios === 2 && compare.svg > 0;
      L.verdict(bare, "empty library = bare card, no icon/title/explanation/action in the body, with Sector/Pathway/Cards/List controls shown over nothing");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
