// S2 probe (unusual input): a card or history entry that names a run the issuer does not hold is accepted by the reader and opens "No such run".
// Run from the repository root: node docs/audit/2026-11-16-final/output/2-sections/S2/probes/dangling-run-link.mjs
import { makeVariant, open, hash } from "./harness.mjs";
const v = makeVariant((l) => {
  l.slice.home.cards[0].href = "2099-12-31";
  const h = l.slice.issuers.find((i) => i.id === "halden-aerostructures").history;
  h.latest = "2026-09-30"; h.entries[0].report = "2099-12-31"; h.entries[0].changes = { label: "What changed since 30 Jun 2026", run: "2099-12-31" };
  h.entries[6].report = "2026-09-30"; // keeps "latest" valid for the reader
});
const { browser, page } = await open();
try {
  await page.goto(hash(v.url, "/library/home"));
  await page.waitForTimeout(400);
  const body = (await page.locator("main").innerText()).slice(0, 80).replace(/\s+/g, " ");
  console.log("reader accepted the slice:", !/could not be read|malformed/.test(body));
  await page.getByRole("link", { name: /Halden Aerostructures/ }).first().click();
  await page.waitForTimeout(400);
  console.log("card opens:", page.url().split("#")[1], "->", JSON.stringify((await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 90)));
} finally { await browser.close(); v.cleanup(); }
