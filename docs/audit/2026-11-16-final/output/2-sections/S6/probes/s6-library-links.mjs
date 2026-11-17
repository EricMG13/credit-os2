// S6-008: "Open the library" and "Open what finished" go to #/ (Library home). The run's issuer is not in that library.
import { verdict, withApp } from "./_s6lib.mjs";
await withApp(async ({ open, page }) => {
  let missing = 0;
  for (const [addr, link] of [["finished", "Open the library"], ["failed", "Open what finished"], ["capped", "Open what finished"], ["interrupted", "Open what finished"]]) {
    await open(`#/run/activity/${addr}`);
    await page.getByRole("link", { name: link }).click();
    await page.waitForTimeout(250);
    const hash = await page.evaluate(() => location.hash);
    const issuers = await page.locator("main h2, main h3").allInnerTexts();
    const hasRun = issuers.some((t) => /TransDigm/i.test(t));
    if (!hasRun) missing++;
    console.log(`${addr}: "${link}" -> ${JSON.stringify(hash)}; library headings: ${JSON.stringify(issuers.slice(0, 8))}; shows TransDigm Group: ${hasRun}`);
  }
  const anyTransdigmHref = await (async () => { await open("#/run/activity/running"); return page.locator("main a[href*=transdigm]").count(); })();
  console.log("links to #/library/transdigm/... on the run pages (stage 0 note):", anyTransdigmHref, "(they are in web/fixtures/model.json, the Model section)");
  verdict(missing > 0 ? 1 : 0);
});
