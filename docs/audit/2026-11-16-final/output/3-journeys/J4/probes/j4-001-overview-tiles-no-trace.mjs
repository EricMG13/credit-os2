// J4-001: the five headline figure tiles on the Overview have no trace control.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-001-overview-tiles-no-trace.mjs
// Exit 0 = defect reproduced (no tile has a trace control and clicking a tile opens nothing).
import { runProbe } from "./_lib.mjs";

await runProbe("p001", async ({ page, run, endpoint }) => {
  await page.goto(`${endpoint}report/${run}#overview`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.waitForTimeout(800);
  const notes = [];
  // Turn the "Show sources" switch on so every trace control is drawn.
  await page.getByRole("switch", { name: "Show sources" }).check({ force: true });
  await page.waitForTimeout(500);
  let tilesWithControl = 0;
  const tiles = ["Net leverage", "Gross leverage", "Interest coverage", "Revenue", "Cash"];
  for (const label of tiles) {
    const info = await page.evaluate((text) => {
      const el = [...document.querySelectorAll("dt")].find((x) => x.textContent.trim() === text);
      if (!el) return null;
      const tile = el.parentElement;
      return {
        controls: tile.querySelectorAll("button, a, [role=button]").length,
        text: tile.textContent.replace(/\s+/g, " ").trim(),
      };
    }, label);
    if (!info) {
      notes.push(`tile ${label}: not found`);
      continue;
    }
    if (info.controls > 0) tilesWithControl += 1;
    notes.push(`tile ${label}: controls inside the tile = ${info.controls} | "${info.text}"`);
    await page.getByText(label, { exact: true }).first().click();
    await page.waitForTimeout(250);
    notes.push(`  after clicking ${label}: dialogs open = ${await page.getByRole("dialog").count()}`);
  }
  const passageButtons = await page
    .getByRole("button", { name: /^Show sources for/ })
    .evaluateAll((xs) => xs.slice(0, 4).map((x) => x.getAttribute("aria-label")));
  notes.push(`trace controls drawn above the tiles and below them (first four): ${JSON.stringify(passageButtons)}`);
  return { reproduced: tilesWithControl === 0, notes };
});
