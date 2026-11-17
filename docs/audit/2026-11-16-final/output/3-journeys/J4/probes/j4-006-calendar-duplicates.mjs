// J4-006: the issuer calendar counts one dated event once per module that repeats it. The
// header chips say Historical 9, Scheduled 18, Scenario 9 for four distinct events, and the
// Overview's "Dates to watch" lists the same 2025-03-31 event five times.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-006-calendar-duplicates.mjs
// Exit 0 = defect reproduced. The distinct events are counted from the downloaded handoffs.
import { bodyText, runProbe } from "./_lib.mjs";

const MODULES = ["CP-0", "CP-1", "CP-1A", "CP-DR", "CP-4", "CP-2", "CP-2A", "CP-2E", "CP-2D", "CP-2G", "CP-3C", "CP-3", "CP-5", "CP-6"];

await runProbe("p006", async ({ page, run, endpoint }) => {
  const notes = [];
  await page.goto(`${endpoint}report/${run}#overview`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.waitForTimeout(900);
  const overview = await bodyText(page);
  const dates = overview.slice(overview.indexOf("Dates to watch"));
  const overviewRows = (dates.match(/Synthetic note/g) ?? []).length;
  notes.push(`Overview "Dates to watch": "Synthetic note" 2025-03-31 listed ${overviewRows} times`);

  await page.goto(`${endpoint}report/${run}#calendar`);
  await page.waitForTimeout(1000);
  const cal = await bodyText(page);
  const chips = cal.match(/Historical (\d+)\s+Scheduled (\d+)\s+Scenario (\d+)/);
  notes.push(`calendar chips: Historical ${chips?.[1]}, Scheduled ${chips?.[2]}, Scenario ${chips?.[3]} (total ${chips ? +chips[1] + +chips[2] + +chips[3] : "?"})`);

  // Distinct events in the downloaded handoffs: any "Events:" table row, keyed by its own cells.
  const seen = new Map();
  let rowsTotal = 0;
  for (const m of MODULES) {
    const md = await (await page.request.get(`${endpoint}library/downloads/${run}/${m}.md`)).text();
    const block = md.match(/### Events: [^\n]*\n\n\|[^\n]*\n\|[^\n]*\n((?:\|[^\n]*\n?)+)/);
    if (!block) continue;
    for (const row of block[1].trim().split("\n")) {
      const cells = row.split("|").slice(1, -1).map((c) => c.trim());
      rowsTotal += 1;
      seen.set([cells[0], cells[3], cells[4]].join(" | "), (seen.get([cells[0], cells[3], cells[4]].join(" | ")) ?? 0) + 1);
    }
  }
  notes.push(`handoffs carry ${rowsTotal} event rows, ${seen.size} distinct: ${JSON.stringify([...seen])}`);
  const total = chips ? +chips[1] + +chips[2] + +chips[3] : 0;
  return { reproduced: overviewRows >= 5 && total === rowsTotal && seen.size < total / 2, notes };
});
