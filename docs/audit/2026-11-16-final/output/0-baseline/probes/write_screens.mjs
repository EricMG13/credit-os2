// Stage 0 helper: print the screen-and-screenshot table for screens.md from the probes' JSON.
// Run from the repository root:
//   node docs/audit/2026-11-16-final/output/0-baseline/probes/write_screens.mjs <screens-connected.json> <screens-static.json>
import { readFileSync } from "node:fs";

const [connectedFile, staticFile] = process.argv.slice(2);
const rows = [
  ...JSON.parse(readFileSync(connectedFile, "utf8")).screens,
  ...JSON.parse(readFileSync(staticFile, "utf8")).screens,
];
const cell = (text) => String(text).replace(/\|/g, "\\|");
const lines = [
  "| # | Surface | Section | Screen | State | Address | Elements | Revealed | Screenshots (1440, 390) |",
  "| ---: | :--- | :--- | :--- | :--- | :--- | ---: | ---: | :--- |",
];
let shots = 0;
let truncated = 0;
rows.forEach((s, i) => {
  shots += s.shots.length;
  truncated += s.shots.filter((f) => f.truncated).length;
  const files = s.shots.map((f) => `\`${f.file}\`${f.truncated ? " (cut at 14,000 px)" : ""}`).join(", ");
  lines.push(
    `| ${i + 1} | ${s.surface} | ${s.section} | ${cell(s.screen)} | ${cell(s.state)} | \`${cell(s.address)}\` | ${s.elements} | ${s.revealed} | ${files} |`,
  );
});
console.log(lines.join("\n"));
console.error(`${rows.length} screen states, ${shots} screenshots, ${truncated} cut at the height cap`);
