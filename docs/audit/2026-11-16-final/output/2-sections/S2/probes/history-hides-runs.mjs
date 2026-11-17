// S2 probe: an issuer whose history has entries but no readable report shows no entries at all.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/history-hides-runs.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { makeVariant, open, hash } from "./harness.mjs";
const lib = JSON.parse(readFileSync(path.join(process.cwd(), "web", "fixtures", "library.json"), "utf8")).slice;
const v = makeVariant();
const { browser, page } = await open();
try {
  for (const id of ["corvane-packaging", "tessaly-foods", "ardenne-cable", "lumora-health"]) {
    const i = lib.issuers.find((x) => x.id === id);
    const card = lib.home.cards.find((c) => c.kind === "issuer" && c.issuer === id);
    await page.goto(hash(v.url, `/library/${id}/history`));
    await page.waitForTimeout(300);
    const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    const listed = i.history.entries.filter((e) => text.includes(`Run as of ${e.asOf}`)).length;
    console.log(`${id}: subtitle "${i.history.subtitle}" | entries in data: ${i.history.entries.length}, rows drawn: ${listed} | home card says "${card.state}", "${card.lead.slice(0, 50)}..." | history page says: "${i.history.empty.slice(0, 60)}"`);
  }
} finally { await browser.close(); v.cleanup(); }
