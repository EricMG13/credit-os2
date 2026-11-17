// A debt part with a zero balance (for example an undrawn revolver listed at 0) put into a copy of the
// model fixture: what do the static model pages show? Shows X1-024.
// Usage (repository root): node docs/audit/2026-11-16-final/output/2-sections/X1/probes/stack-zero-static.mjs
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fixtureDist, launch, newPage, removeFolder, tempFolder, web } from "./lib.mjs";

const tmp = tempFolder("stackzero");
mkdirSync(path.join(tmp, "fixtures"));
for (const f of ["library", "model", "run", "signal"]) cpSync(path.join(web, "fixtures", `${f}.json`), path.join(tmp, "fixtures", `${f}.json`));
const model = JSON.parse(readFileSync(path.join(tmp, "fixtures", "model.json"), "utf8"));
const parts = model.slice.runs[0].statements.debt.stack.parts;
const before = parts.map((p) => `${p.name}=${p.value}`).join(", ");
parts[parts.length - 1].value = 0;
parts[parts.length - 1].text = "0";
writeFileSync(path.join(tmp, "fixtures", "model.json"), JSON.stringify(model));
const base = await fixtureDist(path.join(tmp, "dist"), path.join(tmp, "fixtures"));
const browser = await launch();
try {
  const { context, page, consoleMsgs, pageErrors } = await newPage(browser);
  console.log("stack parts before the change:", before, "-> last part set to 0");
  for (const p of ["front", "analysis", "statements", "forecast", "portfolio-fit", "limitations"]) {
    await page.goto(base + `#/model/transdigm/2025-06-30/${p}`);
    await page.waitForTimeout(600);
    console.log(p, "->", (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 190));
  }
  console.log("console:", consoleMsgs, "pageErrors:", pageErrors);
  await context.close();
} finally {
  await browser.close();
  removeFolder(tmp);
}
