// C4-006: the "base case basis" sentence prints two figures without a unit and a third with "$...m".
// The state (a model unit of "USD millions", the zero-input limitation and a Calculations ledger) is written in the
// browser by c4-states.cjs; the service and the application are not changed. One plain command from the repository
// root; it starts and stops its own proof.serve and completes its own synthetic run (c4-lib.cjs):
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-probe-006-basis-note-units.cjs
"use strict";
const lib = require("./c4-lib.cjs");
const states = require("./c4-states.cjs");
(async () => {
  const log = lib.newLog();
  const browser = await lib.launch();
  try {
    const out = await states.run(browser, log, { state: "basis-note", chars: 20000 });
    const m = /The calculation gives [^|]*/.exec(out);
    const sentence = m ? m[0] : "";
    console.log(sentence || "sentence not found");
    const bare = /gives 132\.00 cash proxy\. The handoff gives 194\.00 free cash flow/.test(sentence) && /\$62\.00m/.test(sentence);
    console.log(bare ? "DEFECT PRESENT (132.00 and 194.00 carry no unit; 62.00 reads $62.00m; the sentence says 'handoff')" : "no defect seen");
    process.exitCode = bare ? 1 : 0;
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 2; });
