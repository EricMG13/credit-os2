// S2 probe: the Cards/List (home) and Cards/Table (Changes) groups are role=radiogroup; do the arrow keys select?
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/radio-arrow-keys.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open();
try {
  for (const [addr, first, second] of [["/library/home", "Cards", "List"], ["/library/halden-aerostructures/2026-09-30/changes", "Cards", "Table"]]) {
    await page.goto(hash(v.url, addr));
    await page.waitForTimeout(400);
    const a = page.getByRole("radio", { name: first }), b = page.getByRole("radio", { name: second });
    await a.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);
    const focused = await page.evaluate(() => document.activeElement.textContent.trim());
    console.log(addr, `| after ArrowRight: focus on "${focused}", "${second}" checked =`, await b.getAttribute("aria-checked"), `| "${first}" checked =`, await a.getAttribute("aria-checked"));
    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
    console.log("   after Space:", `"${second}" checked =`, await b.getAttribute("aria-checked"));
  }
} finally { await browser.close(); v.cleanup(); }
