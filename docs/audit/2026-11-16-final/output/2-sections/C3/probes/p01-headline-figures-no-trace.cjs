// C3-001: the Overview headline figure tiles carry no trace control (CM-009, D-06).
const { main } = require("./lib.cjs");
main("p01-headline-figures-no-trace", async ({ page, report }) => {
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  const r = await page.evaluate(() => {
    const dl = document.querySelector("main dl");
    const tiles = dl ? [...dl.children].map((t) => t.querySelector("dt")?.textContent) : [];
    const controlsInTiles = dl ? dl.querySelectorAll("button, a").length : 0;
    const traceButtons = [...document.querySelectorAll('main button[aria-label^="Show sources"]')].map((b) => b.getAttribute("aria-label"));
    return { tiles, controlsInTiles, traceButtons: traceButtons.filter((l) => /figure|leverage|coverage|revenue|cash/i.test(l)) };
  });
  return { defect: r.tiles.length > 0 && r.controlsInTiles === 0, expected: "one trace control per headline figure", detail: r };
});
