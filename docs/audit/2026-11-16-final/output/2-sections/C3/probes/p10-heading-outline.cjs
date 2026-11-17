// C3-010: heading outline of the report pages: the Bottom line sentence is the heading; module sections are siblings of the module name.
const { main } = require("./lib.cjs");
main("p10-heading-outline", async ({ page, report }) => {
  const out = {};
  for (const hash of ["overview", "changes", "modules/CP-2A"]) {
    await page.goto("about:blank");
    await page.goto(report(hash));
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(600);
    out[hash] = await page.evaluate(() => [...document.querySelectorAll("main h1, main h2, main h3, main h4, header h1, h1, main h5")].filter((h, i, a) => a.indexOf(h) === i).map((h) => `${h.tagName} ${h.textContent.trim().slice(0, 50)}`));
  }
  const modules = out["modules/CP-2A"];
  const flat = modules.filter((h) => h.startsWith("H2 ")).length > 3;
  const noBottomLineHeading = !out["overview"].some((h) => h === "H2 Bottom line") && !modules.some((h) => h === "H2 Bottom line" || h === "H3 Bottom line");
  const changesNoH2Changes = !out["changes"].some((h) => /H2 Changes/.test(h));
  return { defect: flat || noBottomLineHeading || changesNoH2Changes, expected: "module name H2, its sections H3; a 'Bottom line' heading; Changes page has its own H2", flat, noBottomLineHeading, changesNoH2Changes, outline: out };
});
