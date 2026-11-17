// S2 probe: do the Library home's search, filters and Cards/List choice survive opening an issuer and pressing Back?
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/home-state-after-back.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant();
const { browser, page } = await open();
try {
  await page.goto(hash(v.url, "/library/home"));
  await page.waitForTimeout(400);
  await page.getByRole("radio", { name: "List" }).click();
  await page.getByRole("textbox", { name: "Search issuers" }).fill("o");
  await page.getByRole("button", { name: /^Sector/ }).click();
  await page.getByRole("option", { name: "Rigid packaging" }).click();
  await page.waitForTimeout(200);
  const before = { layout: await page.getByRole("radio", { name: "List" }).getAttribute("aria-checked"), search: await page.getByRole("textbox", { name: "Search issuers" }).inputValue(), applied: await page.locator("text=/filters? applied|No filter applied/").first().textContent(), rows: (await page.getByRole("row").count()) - 1 };
  console.log("before opening an issuer:", JSON.stringify(before));
  await page.getByRole("link", { name: "Corvane Packaging" }).click();
  await page.waitForTimeout(300);
  await page.goBack();
  await page.waitForTimeout(400);
  const after = { layout: await page.getByRole("radio", { name: "List" }).getAttribute("aria-checked"), search: await page.getByRole("textbox", { name: "Search issuers" }).inputValue(), applied: await page.locator("text=/filters? applied|No filter applied/").first().textContent(), cards: await page.locator("main a[href^='#/library/'] h2").count() };
  console.log("after Back:", JSON.stringify(after));
} finally { await browser.close(); v.cleanup(); }
