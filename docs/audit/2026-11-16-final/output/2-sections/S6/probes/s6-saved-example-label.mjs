// S6-003: which populated static run pages say they are a saved example (the page wording is NOT_CONNECTED in
// web/src/pages/run/reasons.ts), and what the Start step, its dialog and the "Run started" panel claim.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  const pages = ["no-documents", "documents", "purpose", "confirm", "context", "start", "started"].map((d) => `#/run/start/${d}`)
    .concat(["running", "queued", "starting", "finished", "failed", "capped", "rejected", "interrupted", "many-modules", "unreadable"].map((r) => `#/run/activity/${r}`));
  let unlabelled = 0;
  for (const h of pages) {
    await open(h);
    const t = await page.locator("main").innerText();
    const labelled = /saved example/i.test(t);
    if (!labelled) unlabelled++;
    console.log(h.padEnd(30), labelled ? "labelled as a saved example" : "NOT labelled");
  }
  await open("#/run/start/start");
  await page.getByRole("button", { name: /^Submit, spend up to/ }).click();
  console.log("dialog text:", (await page.getByRole("dialog").innerText()).replace(/\n+/g, " | "));
  await page.getByRole("button", { name: /^Start run, up to/ }).click();
  await page.waitForTimeout(300);
  console.log("after confirm:", (await page.locator("main [role=status]").innerText()).replace(/\n+/g, " | "));
  verdict(unlabelled > 0 ? 1 : 0);
});
