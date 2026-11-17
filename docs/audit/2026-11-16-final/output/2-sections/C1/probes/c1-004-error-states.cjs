// C1-004: error states on the run page and the report page are plain text lines, not the alert component, offer no
// action, and misname the cause (an unknown or unpublished report reads "could not be loaded"; an unknown run reads
// "unknown run"). Uses the real service for unknown ids, and a failed run's folder.
"use strict";
const L = require("./lib.cjs");
(async () => {
  await L.withService(async () => {
    const browser = await L.launch();
    try {
      const { context, log } = await L.newContext(browser);
      const facts = {};
      for (const [label, url] of [["unknown run", "/run/20000101-000000-01"], ["unknown report", "/report/no-such-run"]]) {
        const page = await L.open(context, log, url);
        await L.settle(page, 800);
        facts[label] = await page.evaluate(() => {
          const alert = document.querySelector("main [role=alert]");
          return {
            text: alert?.innerText ?? null,
            hasIcon: Boolean(alert?.querySelector("svg")),
            actionsInAlert: alert ? alert.querySelectorAll("a,button").length : 0,
            h1: document.querySelector("h1")?.innerText,
            breadcrumb: document.querySelector("nav[aria-label=Breadcrumb]")?.innerText.replace(/\n/g, " "),
            links: [...document.querySelectorAll("main a")].map((a) => a.innerText.trim()),
          };
        });
        await L.shot(page, "c1-004-" + label.replace(/ /g, "-"));
        await page.close();
      }
      // a failed run: the report page for it (a run folder exists, no report was published)
      const act = await fetch(`${L.BASE}/connected/activity`).then((r) => r.json());
      console.log(JSON.stringify(facts, null, 1));
      console.log("note: ended runs listed by the service:", (act.ended ?? []).map((r) => r.id).join(", ") || "none");
      const run = facts["unknown run"], rep = facts["unknown report"];
      const defect = run.text === "unknown run" && /could not be loaded/.test(rep.text ?? "") && !run.hasIcon && !rep.hasIcon && run.actionsInAlert === 0 && rep.actionsInAlert === 0;
      L.verdict(defect, "error text 'unknown run' / 'The published report could not be loaded.' in a plain red line: no icon, no retry or back action inside the alert; the unknown-report 404 is worded as a load failure");
    } finally {
      await browser.close();
    }
  });
})().catch((e) => { console.error(e); process.exit(2); });
