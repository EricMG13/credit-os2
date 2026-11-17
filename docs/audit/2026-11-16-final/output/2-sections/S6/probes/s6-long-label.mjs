// S6-010: the run label chips are whitespace-nowrap; the fixture's own long label is cut off at 390 px, and one
// unbroken label pushes the Stop run control off the page at 1440 px.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, ctxFor }) => {
  let fails = 0;
  const ctx = await ctxFor({ width: 390, height: 844 });
  const page = await ctx.newPage();
  await open("#/run/activity/many-modules", page);
  const chip = await page.evaluate(() => {
    const c = [...document.querySelectorAll("main span")].find((e) => e.textContent.trim().startsWith("Full credit review with every optional"));
    const r = c.getBoundingClientRect();
    return { right: Math.round(r.right), viewport: innerWidth, whiteSpace: getComputedStyle(c).whiteSpace, mainClips: getComputedStyle(document.querySelector("main")).overflowX };
  });
  console.log("390 px, fixture label chip:", JSON.stringify(chip), chip.right > chip.viewport ? "<< extends past the viewport, text cut off" : "");
  if (chip.right > chip.viewport) fails++;
}, {});
await withApp(async ({ open, page }) => {
  await open("#/run/activity/running");
  const stop = await page.getByRole("button", { name: "Stop run" }).boundingBox();
  console.log("1440 px, fixture: Stop run at x =", Math.round(stop.x));
}, {});
await withApp(async ({ open, page }) => {
  await open("#/run/activity/running");
  const stop = await page.getByRole("button", { name: "Stop run" }).boundingBox();
  console.log("1440 px, one unbroken 160-character label: Stop run at x =", Math.round(stop.x), stop.x > 1440 ? "<< off the page" : "");
  if (stop.x > 1440) verdict(1);
}, { mutate: (s) => { for (const r of s.runs) if (r.kind === "run") r.labels = [...r.labels, "A".repeat(160)]; } });
