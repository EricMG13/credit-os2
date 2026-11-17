// S2 probe: where does keyboard focus go after "Clear filters" on the Library home (D-34, D-38)?
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/clear-filters-focus.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open();
const where = () => page.evaluate(() => { const e = document.activeElement; return e === document.body ? "BODY (nothing focused)" : e.tagName + " " + (e.getAttribute("aria-label") || e.textContent.trim().slice(0, 30)); });
try {
  await page.goto(hash(v.url, "/library/home"));
  await page.waitForTimeout(400);
  await page.getByRole("textbox", { name: "Search issuers" }).fill("zzz");
  await page.waitForTimeout(200);
  const clear = page.getByRole("button", { name: "Clear filters" });
  await clear.focus();
  console.log("focus before:", await where());
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  console.log("focus after Enter on Clear filters:", await where());
  await page.keyboard.press("Tab");
  console.log("next Tab goes to:", await where());
} finally { await browser.close(); v.cleanup(); }
