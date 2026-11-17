// J4-007: the Overview (and the library home card) draw five headline tiles and silently drop the
// sixth, Adjusted EBITDA, because its latest value is not supplied. Nothing on the Overview says
// the measure is missing; the Financial foundation chart shows `n.a.` and its table gives the reason.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-007-missing-tile-dropped.mjs
// Exit 0 = defect reproduced. The expected state comes from the downloaded Financial foundation handoff.
import { bodyText, moduleText, runProbe } from "./_lib.mjs";

await runProbe("p007", async ({ page, run, endpoint }) => {
  const notes = [];
  await page.goto(`${endpoint}report/${run}#overview`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.waitForTimeout(900);
  const overview = await bodyText(page);
  const tiles = ["Net leverage", "Gross leverage", "Interest coverage", "Revenue", "Adjusted EBITDA", "EBITDA", "Cash"].map(
    (n) => `${n}: ${new RegExp(`^${n}$`, "m").test(overview)}`,
  );
  notes.push(`Overview tiles present: ${tiles.join(", ")}`);
  notes.push(`Overview says anything about EBITDA being unavailable: ${/EBITDA/i.test(overview)}`);

  const handoff = await (await page.request.get(`${endpoint}library/downloads/${run}/CP-1.md`)).text();
  const row = handoff.match(/\| FY2024 \| 2,250 \| ([^|]+) \|/)?.[1].trim();
  notes.push(`handoff CP-1.md chart data "Revenue and EBITDA", FY2024 Adjusted EBITDA cell: ${JSON.stringify(row)}`);

  const module = await moduleText(page, endpoint, run, "CP-1", true);
  const shown = module.match(/Revenue and EBITDA[\s\S]{0,200}?FY2024\t[^\t]+\t([^\t\n]+)/)?.[1];
  notes.push(`Financial foundation page, same cell in table view: ${JSON.stringify(shown)}`);

  const reproduced = !/EBITDA/i.test(overview) && /Not supplied/.test(row ?? "") && /Not supplied|n\.a\./.test(shown ?? "");
  return { reproduced, notes };
});
