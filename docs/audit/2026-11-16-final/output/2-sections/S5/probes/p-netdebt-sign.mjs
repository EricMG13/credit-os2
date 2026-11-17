// S5-009: the Net debt walk table labels the net-debt effect of free cash flow as "Free cash flow"; Statements shows the cash flow itself.
import { dist, url, launch, context, cleanup, RUN } from "./_lib.mjs";
const browser = await launch();
try {
  const d = dist("fixture");
  const ctx = await context(browser); const page = await ctx.newPage();
  await page.goto(url(d, RUN + "statements")); await page.waitForSelector("main h1");
  const toggle = page.locator('[role=radiogroup][aria-label^="Net debt walk"]');
  const chartLabels = await toggle.evaluate((g) => [...g.closest("[class*='group/trace']").querySelectorAll("svg text")].map((t) => t.textContent.trim()).filter((t) => /Cash flow|Free/.test(t)));
  await toggle.getByRole("radio", { name: "Table", exact: true }).click();
  const rows = await toggle.evaluate((g) => [...g.closest("[class*='group/trace']").querySelectorAll("tbody tr")].map((tr) => [...tr.children].slice(0, 3).map((c) => c.innerText.trim())));
  console.log("Net debt walk chart step labels:", JSON.stringify(chartLabels));
  console.log("Net debt walk table rows:", JSON.stringify(rows.slice(0, 3)));
  await page.getByRole("tab", { name: "Cash flow" }).click();
  console.log("Statements > Cash flow, Free cash flow row:", (await page.locator("tbody tr", { hasText: "Free cash flow" }).first().innerText()).replace(/\s+/g, " "));
} finally { await browser.close(); cleanup(); }
