// C4-007: one malformed event date in a module's event table removes every event of that table, and the
// page then says "No dated events were published for this run" above a card that says the dates could not be plotted.
"use strict";
const { execFileSync } = require("node:child_process");
const out = execFileSync("node", [require("node:path").join(__dirname, "c4-states.cjs")], { env: { ...process.env, C4_STATE: "cal-bad-date", C4_TAB: "calendar", C4_CHARS: "2000" }, encoding: "utf8", timeout: 90000 });
const i = out.indexOf("Issuer calendar");
console.log(out.slice(i, i + 260));
const defect = /No dated events were published for this run/.test(out) && /could not be plotted/.test(out) && !/Fine/.test(out);
console.log(defect ? "DEFECT PRESENT (valid second event 'Fine' not shown; headline contradicts the gap card)" : "no defect seen");
process.exit(defect ? 1 : 0);
