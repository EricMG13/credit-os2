// Stage 0 probe: check the README's section table against web/src and assign every page file
// outside Signal to exactly one section.
// Run from the repository root:  node docs/audit/2026-11-16-final/output/0-baseline/probes/sections.mjs
// Prints JSON: { missing: [...], files: [{ file, section, rule, reachedBy: [...] }] }.
// Reads files only. Tests (*.test.*), test setup and JSON case files are not page files.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "web", "src");
const C = "web/src/pages/connected/";

// The README's table, as written (paths relative to the repo root; "glob/" = a whole folder).
const README = {
  C1: ["ConnectedApp.tsx", "layout.tsx", "LibraryIndex.tsx", "ReportLibrary.tsx", "RunActivity.tsx", "RunProgress.tsx"].map((f) => C + f),
  C2: [C + "StartRun.tsx", C + "start/"],
  C3: ["ReportContent.tsx", "HeadlineFigures.tsx", "report/Changes.tsx", "report/Modules.tsx", "report/ModuleTable.tsx", "report/Confidence.tsx", "report/MetricGrid.tsx"].map((f) => C + f),
  C4: ["report/Forecast.tsx", "report/Downside.tsx", "report/BreakPoints.tsx", "report/MacroSensitivity.tsx", "report/Securities.tsx", "report/Calendar.tsx", "report/PortfolioBasis.tsx", "report/RunCharts.tsx", "visuals/"].map((f) => C + f),
  C5: ["report/Evidence.tsx", "report/PublishedTrace.tsx", "report/Record.tsx", "report/ScriptChecks.tsx", "report/ArtifactDownloads.tsx", "report/comparisonTrace.ts"].map((f) => C + f),
  S1: ["web/src/shell/", "web/src/App.tsx", "web/src/route.ts", "web/src/pages/route-table.ts"],
};
// Routes named in the README for S2-S6 (checked against routes.tsx separately).
const README_ROUTES = {
  S1: ["/kit"],
  S2: ["/library/home", "/library/:issuer/history", "/library/:issuer/:run/overview", "/library/:issuer/:run/changes"],
  S3: ["/library/:issuer/:run/modules", "/library/:issuer/:run/modules/:module"],
  S4: ["/library/:issuer/:run/evidence/*"],
  S5: ["/model/*"],
  S6: ["/run/start/:draft", "/run/activity", "/run/activity/:run"],
};

// Seeds: the files each section owns outright (README files plus route page components).
const L = "web/src/pages/library/";
const SEEDS = {
  C1: [...README.C1.filter((f) => !f.endsWith("ReportLibrary.tsx")), "web/src/connected-main.tsx", "web/src/ConnectedLoadBoundary.tsx", "web/connected.html"],
  C2: README.C2,
  C3: [...README.C3, C + "ReportLibrary.tsx"],
  C4: README.C4,
  C5: README.C5,
  S1: [...README.S1, "web/src/main.tsx", "web/index.html", "web/src/pages/Kit.tsx"],
  S2: ["Home.tsx", "History.tsx", "Overview.tsx", "Changes.tsx"].map((f) => L + f),
  S3: [L + "Module.tsx"],
  S4: ["Evidence.tsx", "EvidenceGaps.tsx", "EvidenceRecord.tsx", "EvidenceSources.tsx", "EvidenceSummary.tsx", "EvidenceTrace.tsx"].map((f) => L + f),
  S5: ["web/src/pages/model/"],
  S6: ["web/src/pages/run/"],
  X1: ["web/src/components/"],
};
const ORDER = ["C1", "C2", "C3", "C4", "C5", "S1", "S2", "S3", "S4", "S5", "S6", "X1"];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return out;
}

const isSignal = (f) => f.startsWith("web/src/pages/signal/");
const isTest = (f) => /\.test\.|\/setup\.ts$|test-helpers|test-fixture|\.cases\.json$|\.fixtures?\.ts$/.test(f);
const all = walk(src).filter((f) => !isSignal(f));
const pageFiles = all.filter((f) => !isTest(f)).concat(["web/index.html", "web/connected.html"]);

const missing = [];
for (const [section, files] of Object.entries(README))
  for (const f of files) if (!existsSync(path.join(root, f))) missing.push({ section, file: f });

const routesText = ["library", "model", "run"].map((g) => readFileSync(path.join(src, "pages", g, "routes.tsx"), "utf8")).join("\n");
const declared = [...routesText.matchAll(/\bpath:\s*"(\/[^"]*)"/g)].map((m) => m[1]);
const missingRoutes = [];
for (const [section, routes] of Object.entries(README_ROUTES))
  for (const r of routes) {
    if (r === "/kit") {
      if (!readFileSync(path.join(src, "App.tsx"), "utf8").includes('route === "/kit"')) missingRoutes.push({ section, route: r });
      continue;
    }
    const ok = r.endsWith("/*") ? declared.some((d) => d.startsWith(r.slice(0, -1))) : declared.includes(r);
    if (!ok) missingRoutes.push({ section, route: r });
  }
const unlistedRoutes = declared.filter((d) => !Object.values(README_ROUTES).flat().some((r) => (r.endsWith("/*") ? d.startsWith(r.slice(0, -1)) : r === d)));

// Import graph (static and dynamic imports, relative and "@/" aliased).
const EXT = ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx"];
function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(path.join(root, from)), spec);
  else return null;
  for (const ext of EXT) {
    const cand = base + ext;
    if (existsSync(cand) && statSync(cand).isFile()) return path.relative(root, cand).split(path.sep).join("/");
  }
  return null;
}
const edges = new Map();
for (const f of pageFiles) {
  if (!/\.(tsx?|mjs|js|html)$/.test(f)) { edges.set(f, []); continue; }
  const text = readFileSync(path.join(root, f), "utf8");
  const specs = [...text.matchAll(/(?:import|export)[^"'`]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']|src="([^"]+)"/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? (m[4]?.startsWith("/src/") ? "@" + m[4].slice(4) : null)).filter(Boolean);
  edges.set(f, specs.map((s) => resolve(f, s)).filter(Boolean));
}

const seedOf = (f) => {
  const hits = Object.entries(SEEDS).filter(([, list]) => list.some((s) => (s.endsWith("/") ? f.startsWith(s) : f === s)));
  return hits.map(([k]) => k);
};
// Assignment by direct importers: a file no section names takes the section of the files that
// import it directly, most frequent first, ties to table order; repeated until stable (<= 1,000 passes).
const importers = new Map(pageFiles.map((f) => [f, pageFiles.filter((g) => (edges.get(g) ?? []).includes(f))]));
const assigned = new Map();
for (const f of pageFiles) {
  const seeds = seedOf(f);
  if (seeds.length > 0) assigned.set(f, { section: seeds[0], rule: seeds.length > 1 ? `named in ${seeds.join(" and ")}` : "named" });
}
// Shared styling and helpers that both entry files load belong to X1; the static data context to S1;
// the library route table to S2, as model/ and run/ route tables sit with S5 and S6.
const OVERRIDES = { "web/src/index.css": "X1", "web/src/styles/theme.css": "X1", "web/src/utils/cx.ts": "X1", "web/src/utils/is-react-component.ts": "X1", "web/src/pages/source.ts": "S1", "web/src/data.ts": "S1", "web/src/pages/library/routes.tsx": "S2" };
for (const [f, section] of Object.entries(OVERRIDES)) if (!assigned.has(f)) assigned.set(f, { section, rule: "override: shared by both entries or the static app's data context" });
function choose(f) {
  const counts = new Map();
  for (const g of importers.get(f)) {
    const owner = assigned.get(g)?.section;
    if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  // A file stays with its own folder's surface when one of its importers is there.
  const own = f.startsWith("web/src/pages/library/") ? ["S1", "S2", "S3", "S4"] : f.startsWith("web/src/pages/connected/") ? ["C1", "C2", "C3", "C4", "C5"] : ORDER;
  const pool = ORDER.filter((s) => counts.has(s) && own.includes(s));
  const choices = pool.length > 0 ? pool : ORDER.filter((s) => counts.has(s));
  const best = choices.sort((a, b) => counts.get(b) - counts.get(a) || ORDER.indexOf(a) - ORDER.indexOf(b))[0];
  return { section: best, rule: counts.size === 1 ? "only importer's section" : "shared: most direct importers in its own folder's surface" };
}
const fixed = new Set(assigned.keys());
// Repeat until no assignment changes (at most 1,000 passes): later passes see importers assigned later.
for (let pass = 0; pass < 1000; pass += 1) {
  let changed = false;
  for (const f of pageFiles) {
    if (fixed.has(f)) continue;
    const next = choose(f);
    if (next === null) continue;
    const prev = assigned.get(f);
    if (!prev || prev.section !== next.section || prev.rule !== next.rule) {
      assigned.set(f, next);
      changed = true;
    }
  }
  if (!changed) break;
}
const surfaceOf = (section) => (section?.startsWith("C") ? "connected" : section?.startsWith("S") ? "static" : section === "X1" ? "both" : null);
const files = pageFiles.sort().map((f) => {
  const a = assigned.get(f) ?? { section: null, rule: "no importer outside Signal and tests" };
  const importedBy = [...new Set(importers.get(f).map((g) => assigned.get(g)?.section).filter(Boolean))].sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y));
  const surfaces = [...new Set(importedBy.map(surfaceOf))].sort();
  const signal = all.filter(isSignal).some((g) => { try { return readFileSync(path.join(root, g), "utf8").includes(path.basename(f).replace(/\.(tsx?|css)$/, "")); } catch { return false; } });
  return { file: f, ...a, importedBy, importerSurfaces: surfaces, mentionedBySignal: signal };
});

console.log(JSON.stringify({ missing, missingRoutes, unlistedRoutes, declared, files }, null, 1));
