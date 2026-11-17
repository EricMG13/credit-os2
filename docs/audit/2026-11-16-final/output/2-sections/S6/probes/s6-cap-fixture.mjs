// S6-004: every cap the static run pages draw for a "Full credit review" is USD 20.00. Expected values are written
// here from docs/rulings/2026-11-15-pathway-tiers-and-caps.md (Lite 15, Full 25, Deep 40, the five purpose pathways 20),
// independent of the app and of web/fixtures/run.json.
import { verdict, withApp } from "./_s6lib.mjs";
const CAP = { full: "USD 25.00", lite: "USD 15.00", deep: "USD 40.00" };
await withApp(async ({ open, page }) => {
  let wrong = 0;
  for (const h of ["#/run/start/purpose", "#/run/start/confirm", "#/run/start/start", "#/run/start/started", "#/run/activity/running", "#/run/activity/capped"]) {
    await open(h);
    const t = await page.locator("main").innerText();
    // a cap is the amount after "of", "up to", "stops at" or "reached its", or in front of "cap"
    const caps = [...new Set([...t.matchAll(/(?:\bof|up to|stops at|reached its) (USD \d+\.\d\d)|(USD \d+\.\d\d) cap/g)].map((m) => m[1] ?? m[2]))];
    const isFull = /Full credit review/i.test(t);
    const bad = isFull && caps.some((c) => c !== CAP.full);
    if (bad) wrong++;
    console.log(h.padEnd(28), "pathway Full credit review:", isFull, "| caps drawn:", caps.join(", "), "| expected", CAP.full, bad ? "<< WRONG" : "");
  }
  verdict(wrong > 0 ? 1 : 0);
});
