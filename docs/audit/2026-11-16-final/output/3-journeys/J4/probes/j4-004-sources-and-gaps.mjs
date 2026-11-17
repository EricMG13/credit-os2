// J4-004: the Evidence Sources and Gaps tabs do not surface citations that match no source file.
// The trace drawer says "annual.txt p.2 · not in inventory", but Gaps says "This run lists no
// gaps" and Sources lists only the three uploaded files, each against all 14 modules as "Named in a
// handoff", although the handoff bodies cite none of the agreement or the workbook.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-004-sources-and-gaps.mjs
// Exit 0 = defect reproduced. Expected values are counted from the handoffs the person downloads.
import { bodyText, runProbe } from "./_lib.mjs";

const MODULES = ["CP-0", "CP-1", "CP-1A", "CP-DR", "CP-4", "CP-2", "CP-2A", "CP-2E", "CP-2D", "CP-2G", "CP-3C", "CP-3", "CP-5", "CP-6"];

await runProbe("p004", async ({ page, run, endpoint }) => {
  const notes = [];
  await page.goto(`${endpoint}report/${run}#evidence/sources`);
  await page.waitForTimeout(1000);
  const sources = await bodyText(page);
  const listed = [...sources.matchAll(/^(northbridge[\w.-]+)$/gm)].map((m) => m[1]);
  const named = [...sources.matchAll(/^(?:txt|xlsx) · (.+)$/gm)].map((m) => m[1].split(" · ").length);
  notes.push(`Sources tab (heading "Named in a handoff"): files ${JSON.stringify(listed)}; modules listed per file ${JSON.stringify(named)}`);
  notes.push(`Sources tab mentions annual.txt: ${/annual\.txt/.test(sources)}`);
  await page.goto(`${endpoint}report/${run}#evidence/gaps`);
  await page.waitForTimeout(800);
  const gaps = (await bodyText(page)).match(/Gaps\s+\d+[\s\S]*?no gaps\./)?.[0].replace(/\s+/g, " ");
  notes.push(`Gaps tab: ${JSON.stringify(gaps)}`);

  // Count what the downloaded handoff bodies cite (everything after "## Findings").
  const cites = { "northbridge-filing.txt": 0, "northbridge-credit-agreement.txt": 0, "northbridge-portfolio.xlsx": 0, "annual.txt": 0 };
  const byModule = {};
  for (const m of MODULES) {
    const md = await (await page.request.get(`${endpoint}library/downloads/${run}/${m}.md`)).text();
    const body = md.slice(md.indexOf("## Findings"));
    for (const name of Object.keys(cites)) {
      const n = body.split(name).length - 1;
      cites[name] += n;
      if (n) (byModule[name] ??= []).push(`${m}:${n}`);
    }
  }
  notes.push(`citations in the 14 downloaded handoff bodies: ${JSON.stringify(cites)} ${JSON.stringify(byModule)}`);

  await page.goto(`${endpoint}report/${run}#overview`);
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.getByRole("button", { name: "Show sources for this passage" }).first().click();
  const drawer = (await page.getByRole("dialog").innerText()).replace(/\s+/g, " ");
  const notInInventory = /not in inventory/.test(drawer);
  notes.push(`Overview key-finding drawer says "not in inventory": ${notInInventory}`);

  const reproduced =
    /This run lists no gaps/.test(gaps ?? "") &&
    listed.length === 3 &&
    named.every((n) => n === 14) &&
    !/annual\.txt/.test(sources) &&
    cites["annual.txt"] > 10 &&
    cites["northbridge-credit-agreement.txt"] === 0 &&
    notInInventory;
  return { reproduced, notes };
});
