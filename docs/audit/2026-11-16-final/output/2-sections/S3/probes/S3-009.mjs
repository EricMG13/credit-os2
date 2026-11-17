// S3-009: one malformed record blanks every library page and prints the reader's data path in the page body.
import { fixtureApp, modulePath, newPage, run } from "./_lib.mjs";

const app = await fixtureApp((slice) => {
  const run0 = slice.issuers.find((i) => i.id === "halden-aerostructures").runs.find((r) => r.id === "2026-09-30");
  run0.modules.find((m) => m.id === "business-profile").body.records[0].kind = "carousel";
});
await run(async ({ browser, say, defect }) => {
  for (const hash of [modulePath("capital-structure"), modulePath("business-profile"), "/library/home", `/library/halden-aerostructures/2026-09-30/overview`]) {
    const page = await newPage(browser, app.base, hash);
    const text = await page.locator("#main").innerText();
    say(`${hash}: ${text.replace(/\n+/g, " | ").slice(0, 200)}`);
    if (/issuers\[\d+\]\./.test(text)) defect(`${hash} prints an internal data path`);
    await page.context().close();
  }
});
app.cleanup();
