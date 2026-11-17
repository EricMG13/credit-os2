// C3-027: Overview's lead band is labelled 'Bottom line'; the ruling and CM-037 name the kicker 'Credit view' ('Earnings view' for an Earnings Update).
const { main } = require("./lib.cjs");
main("p17-lead-kicker", async ({ page, report }) => {
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page.waitForTimeout(500);
  const labels = await page.evaluate(() => [...document.querySelectorAll("main section[aria-label]")].slice(0, 3).map((s) => s.getAttribute("aria-label")));
  const text = await page.locator("main").innerText();
  return { defect: !/Credit view/.test(text), expected: "lead section kicker 'Credit view' (CM-037; ruling H5, amendment 2026-11-16: 'Earnings view' in place of 'Credit view')", leadBandLabels: labels, creditViewShown: /Credit view/.test(text) };
});
