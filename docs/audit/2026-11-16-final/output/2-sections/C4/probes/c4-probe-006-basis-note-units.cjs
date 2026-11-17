// C4-006: the "base case basis" sentence prints two figures without a unit and a third with "$...m".
// The state (a model unit of "USD millions", the zero-input limitation and a Calculations ledger) is
// written in the browser by c4-states.cjs; the service and the application are not changed.
"use strict";
const { execFileSync } = require("node:child_process");
const out = execFileSync("node", [require("node:path").join(__dirname, "c4-states.cjs")], { env: { ...process.env, C4_STATE: "basis-note", C4_CHARS: "20000" }, encoding: "utf8", timeout: 90000 });
const m = /The calculation gives [^|]*/.exec(out);
console.log(m ? m[0] : "sentence not found");
const sentence = m ? m[0] : "";
const bare = /gives 132\.00 cash proxy\. The handoff gives 194\.00 free cash flow/.test(sentence) && /\$62\.00m/.test(sentence);
console.log(bare ? "DEFECT PRESENT (132.00 and 194.00 carry no unit; 62.00 reads $62.00m; the sentence says 'handoff')" : "no defect seen");
process.exit(bare ? 1 : 0);
