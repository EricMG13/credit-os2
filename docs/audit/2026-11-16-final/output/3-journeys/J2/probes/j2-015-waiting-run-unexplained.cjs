// J2-015 (Low): the fourth run submitted while three are going waits; Run activity lists it under Waiting
// and its own page says Queued, and neither says why it waits or what it waits for.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J2/probes/j2-015-waiting-run-unexplained.cjs
"use strict";
const L = require("./_j2lib.cjs");

L.run("j2-probe-015", async ({ page, context, origin, log }) => {
  const names = ["Alpha Synthetic Group", "Bravo Synthetic Group", "Charlie Synthetic Group", "Delta Synthetic Group"];
  const pages = [page];
  for (let i = 1; i < 4; i += 1) {
    const p = await context.newPage();
    L.setup(p, log);
    pages.push(p);
  }
  const dialogs = await Promise.all(pages.map((p, i) => L.toDialog(p, origin, { issuer: names[i] })));
  for (const d of dialogs) await L.confirm(d); // four Start clicks within about half a second
  await Promise.all(pages.map((p) => p.waitForURL(/\/run\//)));
  const monitor = await context.newPage();
  L.setup(monitor, log);
  await monitor.goto(origin + "/runs");
  let seen = false;
  for (let i = 0; i < 40 && !seen; i += 1) {
    const t = await L.text(monitor, "main");
    if (/Waiting\s*\n?\s*1\b/.test(t.replace(/\n+/g, "\n")) && /Delta Synthetic Group/.test(t)) {
      seen = true;
      const header = t.replace(/\n+/g, " | ").slice(0, 110);
      const waitingBlock = t.slice(t.lastIndexOf("Waiting")).replace(/\n+/g, " | ");
      console.log("Run activity:", header);
      console.log("Waiting section:", waitingBlock.slice(0, 220));
      const waitingPage = pages[3];
      const own = (await L.text(waitingPage, "main")).replace(/\n+/g, " | ");
      console.log("the waiting run's own page:", own.slice(0, 330));
      const why = /because|limit|three|3 runs|at once|until|position|waiting for/i.test(waitingBlock.slice(0, 400) + own.slice(0, 600));
      console.log("anything saying why it waits:", why);
      console.log(!why ? "REPRODUCED: Waiting and Queued with no reason, no limit and no position." : "NOT REPRODUCED");
    }
    await L.sleep(250);
  }
  if (!seen) console.log("NOT REPRODUCED: no Waiting row seen (the runs finished too fast)");
});
