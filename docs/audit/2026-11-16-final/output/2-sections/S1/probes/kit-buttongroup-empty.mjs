// S1-015: the Kit's own Chart/Table group can be left with nothing selected; the chart frames' groups cannot.
// Run from the repository root: timeout 120 node docs/audit/2026-11-16-final/output/2-sections/S1/probes/kit-buttongroup-empty.mjs
import { makeDist, pageUrl, open, cleanup, sleep } from "./s1-lib.mjs";
const dir = makeDist("fixture");
try {
  const { browser, page } = await open({ width: 1440, height: 900 });
  try {
    await page.goto(pageUrl(dir, "#/kit")); await page.waitForSelector("h1"); await sleep(250);
    for (const name of ["Chart or Table", "Debt by period: Chart or Table"]) {
      const group = page.getByRole("radiogroup", { name, exact: true });
      const checked = async () => JSON.stringify(await group.locator('[aria-checked="true"]').allTextContents());
      const seq = [`start ${await checked()}`];
      await group.getByRole("radio", { name: "Table" }).click(); seq.push(`click Table ${await checked()}`);
      await group.getByRole("radio", { name: "Table" }).click(); seq.push(`click Table again ${await checked()}`);
      console.log(`${name}: ` + seq.join(" | "));
    }
  } finally { await browser.close(); }
} finally { cleanup(); }
