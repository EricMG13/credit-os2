// J3-002: the review sheet of a second run on the same issuer offers a comparison ("Compared with
// ...") but Submit leads to a failed run whose only reason is an exit code and a log path the
// browser cannot open. Run from the repository root: timeout 600 node <this file>
"use strict";
const lib = require("./_j3lib.cjs");

lib.runProbe("002", async ({ page, origin, id }) => {
  let reviewLine = null;
  const second = await lib.completeSyntheticRun(page, origin, {
    onReview: async (p) => {
      await p.waitForTimeout(800);
      const text = await p.locator("main").innerText();
      reviewLine = text.match(/Compared with[^\n]*/u)?.[0] ?? null;
    },
  });
  await page.waitForTimeout(6000);
  const body = await page.locator("main").innerText();
  const failed = /\nFailed\n/u.test(body);
  const reason = body.match(/launcher exited \d+; see [^\n]+/u)?.[0] ?? null;
  const log = await fetch(`${origin}/logs/${second}.log`);
  const api = await (await fetch(`${origin}/api/runs/${second}`)).json();
  const logPath = reason?.match(/see (\S+)/u)?.[1] ?? "";
  const viaConnected = await fetch(`${origin}/connected/${logPath}`);
  const published = await fetch(`${origin}/connected/snapshot?run=${second}`);
  return {
    reproduced: failed && reason !== null && log.status === 404 && published.status === 404,
    summary:
      `Review sheet line: ${JSON.stringify(reviewLine)}; second run ${second} page says Failed ` +
      `with ${JSON.stringify(reason)}; the log path answers ${log.status} (/logs/) and ` +
      `${viaConnected.status} (/connected/${logPath}); the run has no report (snapshot ` +
      `${published.status}); API reason: ${JSON.stringify(api.reason)}. The synthetic launcher's own ` +
      `reason is in the log: "synthetic proof requires a first Credit Snapshot run" ` +
      `(proof/launcher.py:101).`,
  };
});
