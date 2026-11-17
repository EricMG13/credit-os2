// C3-017, C3-018, C3-022: states reached by rewriting the snapshot in the browser (no application code edited):
//  (a) the lead Bottom line holds a source reference; (b) Changes with a note, no pack; (c) Adjusted EBITDA not supplied.
const { main, inject, sectionsOf } = require("./lib.cjs");
main("p14-injection-states", async ({ browser, context, page, run, base, report }) => {
  const out = {};
  // (c) on the unmodified run
  await page.goto(report("overview"));
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  out.headlineTiles = await page.evaluate(() => [...document.querySelectorAll("main dl dt")].map((d) => d.textContent));
  out.adjustedEbitdaHandled = /Adjusted EBITDA/.test(await page.locator("main").innerText());
  // (a)
  const a = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await inject(a, (snap) => { sectionsOf(snap, "CP-6").find((s) => s.heading === "Bottom line").blocks[0].text = "Leverage is 2.8x per annual.txt page 4 [E3]."; });
  const pa = await a.newPage();
  await pa.goto(report("overview"));
  await pa.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await pa.waitForTimeout(500);
  out.referenceBottomLine = await pa.evaluate(() => {
    const h = [...document.querySelectorAll("main h2")].find((x) => x.textContent.trim() === "Bottom line");
    const card = h && h.closest("section");
    const tiles = card ? card.querySelectorAll("dl > div").length : 0;
    const link = card ? [...card.querySelectorAll("a")].map((l) => l.textContent.trim()) : [];
    const band = Boolean(document.querySelector("main section[aria-label='Bottom line'].bg-surface-inverse"));
    return { cardHeading: Boolean(h), tilesInsideBottomLineCard: tiles, links: link, navyBand: band };
  });
  await a.close();
  // (b)
  const b = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await inject(b, (snap) => { snap.workspace.runs[run].changes = { first_run: false, pack: null, problem: null, verdicts: null, note: "Changes: not produced (cap_exceeded)" }; });
  const pb = await b.newPage();
  await pb.goto(report("changes"));
  await pb.getByRole("heading", { name: "Changes since the last run" }).waitFor();
  out.noComparison = await pb.evaluate(() => ({ text: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(-120), actions: [...document.querySelectorAll("main a, main button")].map((x) => x.textContent.trim()).filter((t) => t && !/^(Report|Overview|Changes|Modules|Forecast|Evidence|Library)/.test(t) && !/Show sources|Run activity/.test(t)) }));
  await b.close();
  const defect = (out.referenceBottomLine.tilesInsideBottomLineCard > 0 && !out.referenceBottomLine.navyBand) || out.noComparison.actions.length === 0 || !out.adjustedEbitdaHandled;
  return { defect, detail: out };
});
