import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(process.argv[2]);
const require = createRequire(path.join(root, "web/package.json"));
const { createServer } = await import(require.resolve("vite"));
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const server = await createServer({
  root: path.join(root, "web"), configFile: false,
  esbuild: { jsx: "automatic" }, optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true, hmr: false },
  resolve: { alias: { "@": path.join(root, "web/src") } },
});
const cases = [
  [false, "The margin rose eleven pp. 3 quarters running."],
  [false, "The margin rose eleven pp. 3 fiscal quarters running."],
  [false, "The margin rose eleven pp. 3 consecutive fiscal quarters running."],
  [false, "The margin rose twenty-one pp. 3 consecutive fiscal quarters running."],
  [false, "The margin rose 11 pp. 3 consecutive fiscal quarters running."],
  [true, "See pp. 3 for the covenant."],
  [true, "See pp. 3 consecutive fiscal quarters after the summary for the covenant."],
  [true, "Threshold unknown (G12)."],
  [false, "A gap remains between the Group of Seven (G7) economies."],
];
const results = [];
try {
  const { containsReference } = await server.ssrLoadModule("/src/pages/connected/publishedReport.ts");
  const { chartTable } = await server.ssrLoadModule("/src/pages/connected/visuals/visualData.ts");
  const { FindingParagraph, PublishedTable } = await server.ssrLoadModule("/src/pages/connected/ReportContent.tsx");
  const { ForecastScope } = await server.ssrLoadModule("/src/pages/connected/visuals/LegacyForecast.tsx");
  const { RunContext } = await server.ssrLoadModule("/src/pages/library/parts/RunContext.ts");
  for (const [reference, text] of cases) {
    const actual = containsReference(text);
    const table = { line: 20, headers: ["Period", "Coverage", "Basis and limitation", "Source"], rows: [["FY2025", "3.20", text, "annual-report.pdf"]], evidenceInDrawer: true };
    const cell = chartTable(table).rows[0].cells[1];
    const expectedCell = reference ? "Qualification recorded in Evidence." : text;
    const paragraph = renderToStaticMarkup(React.createElement(RunContext.Provider, { value: { traces: { t: {} }, open() {} } }, React.createElement(FindingParagraph, { block: { type: "text", line: 3, end: 3, text }, trace: "t", href: "#evidence/test-3" })));
    const plainTable = renderToStaticMarkup(React.createElement(PublishedTable, { table: { type: "table", line: 10, headers: ["Item", "Note"], rows: [{ line: 12, cells: ["Coverage", text] }] }, href: "#evidence/test-12" }));
    const scopeText = `Base case is limited: ${text}`;
    const forecast = renderToStaticMarkup(React.createElement(ForecastScope, { model: { cashflow: { notes: [scopeText] } } }));
    const checks = {
      predicate: actual === reference,
      chartCell: cell === expectedCell,
      findingParagraph: reference ? !paragraph.includes(text) && paragraph.includes("Read this passage in Evidence") : paragraph.includes(text) && paragraph.includes("Show sources for this passage"),
      plainTable: reference ? !plainTable.includes(text) && plainTable.includes("In Evidence") : plainTable.includes(text),
      forecastScope: reference ? !forecast.includes(scopeText) : forecast.includes(scopeText),
    };
    results.push({ reference, text, actual, actualCell: cell, expectedCell, checks, paragraph, plainTable, forecast });
  }
} finally { await server.close(); }
const failed = results.filter(item => Object.values(item.checks).some(pass => !pass));
fs.writeFileSync(process.argv[3], JSON.stringify({ root, results, failed: failed.length }, null, 2) + "\n");
for (const {text,actual,checks} of results) console.log(JSON.stringify({text,actual,checks}));
console.log(JSON.stringify({cases: results.length, failed: failed.length}));
process.exitCode = failed.length ? 1 : 0;
