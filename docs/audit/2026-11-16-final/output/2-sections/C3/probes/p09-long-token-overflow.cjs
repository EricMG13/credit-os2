// C3-009 (hostile input): one unbroken 336-character token in the lead Bottom line runs past the band and makes the page scroll sideways (D-32).
const { main, inject, sectionsOf } = require("./lib.cjs");
main("p09-long-token-overflow", async ({ page, context, report }) => {
  await inject(context, (snap) => {
    const bl = sectionsOf(snap, "CP-6").find((s) => s.heading === "Bottom line");
    bl.blocks[0].text = "Antidisestablishmentarianism".repeat(12) + " is the committee view.";
  });
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const m = document.querySelector("main"); return { mainScrollWidth: m.scrollWidth, mainClientWidth: m.clientWidth }; });
  return { defect: r.mainScrollWidth > r.mainClientWidth + 4, expected: "long text wraps in full (D-32)", detail: r };
});
