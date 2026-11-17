// C3-031: Rates, FX and hedging draws a <select> ('Compare with the 5% move') with a single option; there is nothing to choose.
const { main } = require("./lib.cjs");
main("p21-single-option-select", async ({ page, report }) => {
  await page.goto(report("modules/CP-2E"));
  await page.getByRole("heading", { name: "Rates, FX & hedging", exact: true }).first().waitFor();
  await page.waitForTimeout(700);
  const selects = await page.evaluate(() => [...document.querySelectorAll("main select")].filter((s) => s.offsetParent !== null && s.getAttribute("aria-label") !== "Module" && s.getAttribute("aria-label") !== "Jump to section").map((s) => ({ label: (s.labels && s.labels[0] && s.labels[0].textContent.trim().slice(0, 40)) || s.getAttribute("aria-label"), options: [...s.options].map((o) => o.textContent) })));
  return { defect: selects.some((s) => s.options.length === 1), expected: "a selector offers at least two choices, or is drawn as a fixed label", selects };
});
