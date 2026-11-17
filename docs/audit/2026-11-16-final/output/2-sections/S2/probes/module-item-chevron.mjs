// S2 probe: which module items draw a chevron, and which of them go anywhere when pressed.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/module-item-chevron.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open();
try {
  for (const addr of ["/library/halden-aerostructures/2026-09-30/changes", "/library/halden-aerostructures/2026-03-31/overview"]) {
    await page.goto(hash(v.url, addr));
    await page.waitForTimeout(500);
    const items = await page.$$eval("section:has(> div > h2) ul li", (lis) => lis
      .filter((li) => li.querySelector("svg") && li.closest("section")?.querySelector("h2")?.textContent === "Modules")
      .map((li) => ({
        title: li.querySelector("span.font-medium")?.textContent,
        isLink: !!li.querySelector("a[href]"),
        chevron: li.querySelector(":scope > * > span:last-child > svg.text-text-tertiary") !== null,
      })));
    console.log("==", addr);
    for (const i of items) console.log(`  ${i.title}: link=${i.isLink} trailing-chevron=${i.chevron}`);
    const before = page.url();
    const plain = page.locator("section:has(> div > h2) li:not(:has(a[href])):has(svg.size-4)").filter({ hasText: /modules (unchanged|delivered)/ }).first();
    if (await plain.count()) {
      await plain.click();
      await page.waitForTimeout(300);
      console.log("  pressing the chevron item: address changed =", page.url() !== before, "| focusable =", await plain.evaluate((e) => e.querySelector("a,button,[tabindex]") !== null));
    }
  }
} finally { await browser.close(); v.cleanup(); }
