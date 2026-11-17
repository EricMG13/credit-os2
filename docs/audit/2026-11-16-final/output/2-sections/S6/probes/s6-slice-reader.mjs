// S6-019, S6-020, S6-021: the slice reader (web/src/pages/run/slice-read.ts) as the page meets it.
//  A. module codes the guard /\bCP-\d/ lets through are drawn on Run activity;
//  B. one bad string turns every run page into a bare message holding the validator's path text;
//  C. an empty string is accepted as a value and drawn as a blank cell (null draws "n.a.").
import { verdict, withApp } from "./_s6lib.mjs";
let fails = 0;
await withApp(async ({ open, page }) => {
  await open("#/run/activity/running");
  const t = await page.locator("main").innerText();
  const drawn = ["CP-L10", "CP-MODEL", "cp-1a", "CP-DR"].filter((c) => t.includes(c));
  console.log("A. codes drawn on Run activity although the reader refuses CP-<digit>:", JSON.stringify(drawn));
  await open("#/run/start/purpose");
  console.log("   and on Run start (readiness item 'Peer set from CP-DR is ready'):", (await page.locator("main").innerText()).includes("CP-DR"));
  if (drawn.length) fails++;
}, { mutate: (s) => { s.drafts[2].readiness.met.items[0] = "Peer set from CP-DR is ready"; s.runs[0].feed[0].who = "CP-MODEL"; s.runs[0].labels = ["CP-L10 Credit snapshot"]; s.runs[0].modules.steps[0].name = "cp-1a Financial analysis"; } });
await withApp(async ({ open, page }) => {
  for (const h of ["#/run/start/start", "#/run/activity/running", "#/run"]) {
    await open(h);
    console.log("B.", h.padEnd(24), JSON.stringify((await page.locator("main").innerText()).replace(/\n+/g, " | ")));
  }
  fails++;
}, { mutate: (s) => { s.drafts[0].issuer = "Acme CP-2 Holdings"; } });
await withApp(async ({ open, page }) => {
  await open("#/run/activity/running");
  const metrics = await page.locator("main .text-metric").allInnerTexts();
  console.log("C. figure cells on Run activity (Spend, Modules finished, Elapsed):", JSON.stringify(metrics), "-> '' draws an empty cell; null draws n.a.");
  await open("#/run/start/confirm");
  const dd = await page.locator("main dl dd").first().innerText();
  console.log("   first Confirm row (Name) value cell with '':", JSON.stringify(dd));
  if (metrics.includes("") || dd === "") fails++;
}, { mutate: (s) => { s.runs[0].spend.value = ""; s.runs[0].elapsed.value = ""; s.drafts.find((d) => d.step === "confirm").groups[0].rows[0].value = ""; } });
verdict(fails);
