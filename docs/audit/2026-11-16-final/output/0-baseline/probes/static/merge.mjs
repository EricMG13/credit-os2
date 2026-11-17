// Stage 0 (static): merges the crawl passes into one inventory and one screenshot folder.
// Usage (from the repo root): node .../merge.mjs <stage0Dir> <passDir>...
// State labels the crawl's text heuristic got wrong are corrected here, by address:
//   halden 2026-06-30 (run.loading is true in the fixture) -> loading; run/activity/unreadable -> error.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const [stage0, ...passes] = process.argv.slice(2).map((p) => path.resolve(p));
const shots = path.join(stage0, "screens", "static");
mkdirSync(shots, { recursive: true });
const fix = (variant, screen, state) => {
  if (variant !== "fixture") return state;
  if (/^#\/library\/halden-aerostructures\/2026-06-30\//.test(screen) && !/no-such|T-9999|G-99/.test(screen)) return "loading";
  if (screen === "#/run/activity/unreadable") return "error";
  return state;
};
const rows = new Map(), screens = new Map(), visited = new Map(), blocked = [];
for (const dir of passes) {
  for (const line of readFileSync(path.join(dir, "clickables-static.jsonl"), "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line);
    const variant = r.data.startsWith("shipped") ? "shipped" : "fixture";
    r.state = fix(variant, r.screen, r.state);
    rows.set(JSON.stringify([r.data, r.screen, r.role, r.name, r.locator, r.revealed_by]), r);
  }
  for (const s of JSON.parse(readFileSync(path.join(dir, "static-screens.json"), "utf8"))) {
    const state = fix(s.variant, s.screen, s.state);
    const file = s.file.replace(`__${s.state}__`, `__${state}__`);
    copyFileSync(path.join(dir, "screens", "static", s.file), path.join(shots, file));
    screens.set(file, { ...s, file, state });
  }
  for (const v of JSON.parse(readFileSync(path.join(dir, "static-visited.json"), "utf8"))) {
    visited.set(`${v.variant}${v.address}`, { ...v, state: fix(v.variant, v.address, v.state) });
  }
  blocked.push(...JSON.parse(readFileSync(path.join(dir, "static-blocked.json"), "utf8")).blocked);
  const extra = path.join(dir, "show-sources.log");
  if (existsSync(extra)) {
    for (const line of readFileSync(extra, "utf8").split("\n").filter((l) => l.includes('"file"'))) {
      const s = JSON.parse(line);
      copyFileSync(path.join(dir, "screens", "static", s.file), path.join(shots, s.file));
      screens.set(s.file, { file: s.file, variant: "fixture", screen: s.screen, state: "full", width: s.width,
        revealed_by: 'getByRole("switch", { name: "Show sources", exact: true })' });
    }
  }
}
writeFileSync(path.join(stage0, "clickables-static.jsonl"), [...rows.values()].map((r) => JSON.stringify(r)).join("\n") + "\n");
writeFileSync(path.join(stage0, "static-screens.json"), JSON.stringify([...screens.values()], null, 1));
writeFileSync(path.join(stage0, "static-visited.json"), JSON.stringify([...visited.values()], null, 1));
writeFileSync(path.join(stage0, "static-blocked.json"), JSON.stringify(blocked, null, 1));
const count = (xs, f) => xs.reduce((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
const R = [...rows.values()];
console.log(JSON.stringify({ clickables: R.length, bySection: count(R, (r) => r.section), byData: count(R, (r) => r.data),
  revealed: R.filter((r) => r.revealed_by).length, unverifiedLocators: R.filter((r) => r.locator_verified === false).length,
  screens: screens.size, visited: visited.size, visitedByState: count([...visited.values()], (v) => `${v.variant}:${v.state}`), blocked: blocked.length }, null, 1));
