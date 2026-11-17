// Debug helper, not a probe: starts its own proof.serve (port C4_PORT, fresh root under /tmp/cs-C4/), completes one
// synthetic run with the executed agreement, prints the run id and stops the service. Every probe does the same
// through c4-lib.cjs; nothing is written to a file and no run id is passed between commands.
//   node docs/audit/2026-11-16-final/output/2-sections/C4/probes/c4-setup-run.cjs
"use strict";
const lib = require("./c4-lib.cjs");
(async () => {
  const browser = await lib.launch();
  try {
    console.log(JSON.stringify({ run: lib.runId() }));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 2; });
