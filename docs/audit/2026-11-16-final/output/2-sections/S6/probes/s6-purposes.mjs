// S6-005: the static Purpose step offers four mock purposes; the matrix row CM-084 expects the eight pathways, Lite first.
import { verdict, withApp } from "./_s6lib.mjs";
const EIGHT = ["Lite credit assessment", "Full credit assessment", "Deep credit assessment", "Earnings Update", "Relative Value", "Covenant & Refinancing", "Distressed & Restructuring", "Portfolio Decision"];
await withApp(async ({ open, page }) => {
  await open("#/run/start/purpose");
  const names = await page.getByRole("radio").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  const checked = await page.getByRole("radio", { checked: true }).evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  const desc = (await page.locator("main").innerText()).match(/A synthetic purpose[^\n]*/)?.[0];
  console.log("offered:", JSON.stringify(names), "| selected on open:", JSON.stringify(checked));
  console.log("missing from the eight:", JSON.stringify(EIGHT.filter((n) => !names.some((x) => x.toLowerCase() === n.toLowerCase()))));
  console.log("test copy drawn as a purpose:", JSON.stringify(desc));
  verdict(EIGHT.some((n) => !names.some((x) => x.toLowerCase() === n.toLowerCase())) ? 1 : 0);
});
