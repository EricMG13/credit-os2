// S2 probe: what a screen reader gets for a run that is still loading (run 2026-06-30 of Halden), against the loading issuer card on the home.
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/loading-skeleton-a11y.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open();
try {
  await page.goto(hash(v.url, "/library/halden-aerostructures/2026-06-30/overview"));
  await page.waitForTimeout(400);
  console.log("run skeleton:", JSON.stringify(await page.$$eval("[aria-busy=true]", (e) => e.map((x) => ({ role: x.getAttribute("role"), label: x.getAttribute("aria-label"), text: x.innerText.trim() })))));
  console.log("live regions on the page:", await page.locator("[role=status],[aria-live]").count());
  await page.goto(hash(v.url, "/library/home"));
  await page.waitForTimeout(400);
  console.log("home loading card:", JSON.stringify(await page.$$eval("[aria-busy=true]", (e) => e.map((x) => ({ role: x.getAttribute("role"), label: x.getAttribute("aria-label") })))));
} finally { await browser.close(); v.cleanup(); }
