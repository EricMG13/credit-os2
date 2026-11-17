// J4-005: the Confidence score (89, High) is correct but nothing on the screen says how it is
// computed: its trace drawer lists the inputs table as fourteen "no page" lines and no weights,
// gate or penalty. The person cannot reproduce 89 from the screen.
// Run from the repository root: timeout 600 node docs/audit/2026-11-16-final/output/3-journeys/J4/probes/j4-005-confidence-method.mjs
// Exit 0 = defect reproduced. The expected score is recomputed here from the handoff's inputs table
// (downloaded through the screen) with the weights written in src/deploy_workflow/confidence.py
// (LINEAGE_WEIGHTS, SOURCE_GATE, PENALTIES), copied by hand, not imported.
import { bodyText, moduleText, runProbe } from "./_lib.mjs";

const W = { "Directly Sourced": 1.0, Calculated: 0.9, "Assumption-Based": 0.5, "Analyst Inference": 0.4, "Weak Lineage": 0.3, Untraced: 0, Conflicting: 0, "Insufficient Information": 0 };

await runProbe("p005", async ({ page, run, endpoint }) => {
  const notes = [];
  const text = await moduleText(page, endpoint, run, "CP-1", false);
  const shown = text.match(/Confidence score\s+(\d+)\s+(\w+)/);
  notes.push(`tile shows: ${shown?.[1]} ${shown?.[2]}`);
  await page.getByRole("button", { name: "Show sources for this figure" }).click();
  await page.getByRole("dialog").waitFor();
  const drawer = (await page.getByRole("dialog").innerText()).replace(/\s+/g, " ");
  const noPageLines = (drawer.match(/the row cites no page or register/g) ?? []).length;
  notes.push(`drawer: "${drawer.slice(0, 200)}..." (${noPageLines} "the row cites no page or register" lines)`);
  const methodWords = /weight|penalt|formula|gate|coverage|computed|calculated as|0\.6|0\.4/i;
  const methodOnPage = methodWords.test(text);
  const methodInDrawer = methodWords.test(drawer);
  notes.push(`method words on the module page: ${methodOnPage}; in the drawer: ${methodInDrawer}`);

  // The inputs, from the downloaded handoff; the expected score by hand.
  const md = await (await page.request.get(`${endpoint}library/downloads/${run}/CP-1.md`)).text();
  const rows = Object.fromEntries([...md.matchAll(/^\| ([A-Za-z -]+) \| ([^|]+) \|$/gm)].map((m) => [m[1].trim(), m[2].trim()]));
  let total = 0;
  let weighted = 0;
  for (const [name, w] of Object.entries(W)) {
    total += Number(rows[name]);
    weighted += w * Number(rows[name]);
  }
  const evidence = (weighted / total) * 100;
  const coverage = (Number(rows["Fields present"]) / Number(rows["Fields total"])) * 100;
  const gate = rows["Source gate"] === "pass" ? 1 : 0;
  const raw = (0.6 * evidence + 0.4 * coverage) * gate - 3 * Number(rows.MINOR) - 15 * Number(rows.MATERIAL) - 40 * Number(rows.CRITICAL);
  notes.push(`hand calculation: evidence ${evidence}, coverage ${coverage}, gate ${gate}, minor ${rows.MINOR} -> ${raw} (rounds to ${Math.round(raw)})`);
  const reproduced = Math.round(raw) === 89 && shown?.[1] === "89" && !methodOnPage && !methodInDrawer && noPageLines >= 10;
  return { reproduced, notes };
});
