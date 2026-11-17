// A module state outside the Module state set, put into a copy of the fixture: does the static app
// blank, or does the reader refuse the data before StatusBadge throws? Shows X1-008 (Info).
// Usage (repository root): node docs/audit/2026-11-16-final/output/2-sections/X1/probes/static-reader-guard.mjs
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fixtureDist, launch, newPage, removeFolder, tempFolder, web } from "./lib.mjs";

const tmp = tempFolder("guard");
mkdirSync(path.join(tmp, "fixtures"));
for (const f of ["library", "model", "run", "signal"]) cpSync(path.join(web, "fixtures", `${f}.json`), path.join(tmp, "fixtures", `${f}.json`));
const lib = JSON.parse(readFileSync(path.join(tmp, "fixtures", "library.json"), "utf8"));
lib.slice.issuers[0].runs[0].modules[0].state = "Partially delivered";
writeFileSync(path.join(tmp, "fixtures", "library.json"), JSON.stringify(lib));
const base = await fixtureDist(path.join(tmp, "dist"), path.join(tmp, "fixtures"));
const browser = await launch();
try {
  const { context, page, consoleMsgs, pageErrors } = await newPage(browser);
  for (const addr of ["#/library/halden-aerostructures/2026-09-30/modules", "#/library/halden-aerostructures/2026-09-30/overview"]) {
    await page.goto(base + addr);
    await page.waitForTimeout(700);
    console.log(addr, "->", (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 170));
  }
  console.log("console:", consoleMsgs, "pageErrors:", pageErrors);
  await context.close();
} finally {
  await browser.close();
  removeFolder(tmp);
}
