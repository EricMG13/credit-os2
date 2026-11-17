import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? process.cwd());
const { createServer } = await import(pathToFileURL(path.join(repo, "web/node_modules/vite/dist/node/index.js")));
const server = await createServer({
  root: path.join(repo, "web"),
  configFile: false,
  cacheDir: "/workspace/scratch/reference-predicate-vite-cache",
  optimizeDeps: { noDiscovery: true, entries: [] },
  server: { middlewareMode: true },
  resolve: { alias: { "@": path.join(repo, "web/src") } },
});
try {
  const { containsReference } = await server.ssrLoadModule("/src/pages/connected/publishedReport.ts");
  const { chartTable } = await server.ssrLoadModule("/src/pages/connected/visuals/visualData.ts");
  const examples = [
    [false, "A gap remains between the Group of Seven (G7) economies."],
    [false, "The margin rose eleven pp. 3 quarters running."],
    [false, "No series is available for the Group of Seven (G7) economies."],
    [true, "Lease detail not available (G12)."],
    [true, "Threshold unknown (G12)."],
    [true, "(G12)."],
    [true, "See p. 1000 for the covenant."],
    [true, "See pages 1024–1026 for the covenant."],
  ];
  let failures = 0;
  for (const [expected, text] of examples) {
    const actual = containsReference(text);
    const table = { line: 20, headers: ["Period", "Coverage", "Basis and limitation", "Source"], rows: [["FY2025", "3.20", text, "annual-report.pdf"]], evidenceInDrawer: true };
    const actualCell = chartTable(table).rows[0].cells[1];
    const expectedCell = expected ? "Qualification recorded in Evidence." : text;
    const pass = actual === expected && actualCell === expectedCell;
    if (!pass) failures++;
    console.log(JSON.stringify({ pass, expected, actual, text, actualCell, expectedCell }));
  }
  console.log(JSON.stringify({ failures }));
  process.exitCode = failures ? 1 : 0;
} finally {
  await server.close();
}
