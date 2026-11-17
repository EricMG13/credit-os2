// C4-007: one malformed event date in a module's event table removes every event of that table, and the page then
// says "No dated events were published for this run" above a card that says the dates could not be plotted.
// The table is rewritten in the browser by c4-states.cjs; the service and the application are not changed.
// One plain command from the repository root; it starts and stops its own proof.serve and completes its own
// synthetic run (c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-007-calendar-bad-date.cjs
"use strict";
const lib = require("./c4-lib.cjs");
const states = require("./c4-states.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const out = await states.run(browser, log, { state: "cal-bad-date", tab: "calendar", chars: 2000 });
    const i = out.indexOf("Issuer calendar");
    console.log(out.slice(i, i + 260));
    const defect = /No dated events were published for this run/.test(out) && /could not be plotted/.test(out) && !/Fine/.test(out);
    console.log(defect ? "DEFECT PRESENT (valid second event 'Fine' not shown; headline contradicts the gap card)" : "no defect seen");
    process.exitCode = defect ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
