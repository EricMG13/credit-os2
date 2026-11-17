// S2 probe: places where the fixture the S2 screens are drawn from contradicts itself about basis, period and pathway.
// Expected values are read from web/fixtures/library.json only. Run from the repository root:
//   node docs/audit/2026-11-16-final/output/2-sections/S2/probes/fixture-contradictions.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
const lib = JSON.parse(readFileSync(path.join(process.cwd(), "web", "fixtures", "library.json"), "utf8")).slice;
const h = lib.issuers.find((i) => i.id === "halden-aerostructures");
const run = h.runs.find((r) => r.id === "2026-09-30");
const card = lib.home.cards.find((c) => c.issuer === "halden-aerostructures");
const point = run.overview.sides.columns[0].items[0];
const trace = run.traces[point.trace];
console.log("1. Net leverage 4.6x basis");
console.log("   Overview point qualifier:", JSON.stringify(point.qualifier), "| text:", JSON.stringify(point.text));
console.log("   Library card (list) netLeverage:", JSON.stringify(card.measures.netLeverage));
const flat = (n) => [n, ...n.children.flatMap(flat)];
console.log("   Trace derivation:", JSON.stringify(flat(trace.derivation).map((c) => `${c.label}: ${c.value} ${c.note ?? ""}`.trim())));
console.log("2. Period of the 4.9x comparison");
const change = run.changes.changes[0];
console.log("   Changes card:", change.measure, change.from.text, "->", change.current.text, "| page heading:", JSON.stringify(run.changes.heading), "| earlierLabel:", run.changes.earlierLabel);
console.log("   Overview point says:", JSON.stringify(point.text), "| finding 01:", JSON.stringify(run.overview.findings[0].body.slice(0, 40)));
console.log("3. Pathway of the run Changes compares with");
const prior = h.history.entries.find((e) => e.asOf === "30 Jun 2026");
console.log("   2026-09-30 run pathway:", run.head.pathway, "| history entry 30 Jun 2026 pathway:", prior.pathway, "| run 2026-06-30 head pathway:", h.runs.find((r) => r.id === "2026-06-30").head.pathway);
console.log("4. Headline tiles with a period or basis in label/note");
for (const m of run.overview.metrics) console.log("   ", m.label.padEnd(24), "|", m.note);
