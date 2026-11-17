// Bundle harness/entry.tsx with esbuild (from web/node_modules) in development mode, so React logs
// DOM-nesting and duplicate-key warnings; the page uses the built stylesheet of web/dist.
// Usage: node build.mjs <output folder, new and empty>   (run from the repository root)
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.join(process.cwd(), "web");
const require = createRequire(path.join(web, "package.json"));
const esbuild = require("esbuild");
const out = process.argv[2];
mkdirSync(path.join(out, "assets"), { recursive: true });
await esbuild.build({
  entryPoints: [path.join(path.dirname(fileURLToPath(import.meta.url)), "entry.tsx")],
  bundle: true,
  format: "iife",
  outfile: path.join(out, "harness.js"),
  jsx: "automatic",
  alias: { "@": path.join(web, "src") },
  nodePaths: [path.join(web, "node_modules")],
  define: { "process.env.NODE_ENV": '"development"' },
  loader: { ".css": "empty" },
  logLevel: "error",
});
const css = readdirSync(path.join(web, "dist", "assets")).find((f) => f.endsWith(".css"));
copyFileSync(path.join(web, "dist", "assets", css), path.join(out, "assets", "style.css"));
mkdirSync(path.join(out, "fonts"), { recursive: true });
for (const f of readdirSync(path.join(web, "dist", "fonts"))) {
  if (f.endsWith(".woff2")) copyFileSync(path.join(web, "dist", "fonts", f), path.join(out, "fonts", f));
}
writeFileSync(
  path.join(out, "index.html"),
  `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="./assets/style.css"></head><body><div id="root"></div><script src="./harness.js"></script></body></html>`,
);
