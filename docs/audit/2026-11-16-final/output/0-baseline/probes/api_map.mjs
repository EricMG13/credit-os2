// Stage 0 probe: map the connected client's calls to the routes the Python service serves.
// Run from the repository root:
//   node docs/audit/2026-11-16-final/output/0-baseline/probes/api_map.mjs [net-connected.json]
// 1. Reads every exported function of web/src/pages/connected/api.ts, its path template and method.
// 2. Counts where each is used in web/src outside tests and Signal.
// 3. Lists the other fetch() calls in web/src/pages/connected (outside api.ts).
// 4. With the connected probe's network log, marks which paths a browser actually requested.
// Prints JSON. Reads files only.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const api = readFileSync(path.join(root, "web/src/pages/connected/api.ts"), "utf8");
const net = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], "utf8")) : null;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
const sources = walk(path.join(root, "web/src"))
  .filter((f) => /\.(tsx?|mjs)$/.test(f) && !/\.test\./.test(f) && !f.includes(`${path.sep}signal${path.sep}`))
  .map((f) => ({ file: path.relative(root, f).split(path.sep).join("/"), text: readFileSync(f, "utf8") }));

// Exported request helpers: name, method, path template.
const blocks = api.split(/\n(?=export )/);
const calls = [];
for (const whole of blocks) {
  // One statement: a const export ends at its first ";" line end, a function at its closing brace.
  const end = whole.indexOf(";\n");
  const block = /^export const/.test(whole) ? (end < 0 ? whole : whole.slice(0, end + 1)) : whole.split(/\n}\n/)[0];
  const name = /^export (?:const|async function|function) (\w+)/.exec(block)?.[1];
  if (!name) continue;
  const paths = [...block.matchAll(/(?:request<[\s\S]*?>|request)\(\s*(`[^`]*`|"[^"]*"|filePath\([^)]*\)|`\$\{submission\(id\)\}[^`]*`)/g)].map((m) => m[1]);
  if (paths.length === 0) continue;
  const method = /method: "(\w+)"/.exec(block)?.[1] ?? (/postJson|postShownCap/.test(block) ? "POST" : "GET");
  let template = paths[0]
    .replace(/^["`]|["`]$/g, "")
    .replace(/\$\{submission\(id\)\}/g, "/api/submissions/<id>")
    .replace(/\$\{encodeURIComponent\((\w+)\)\}/g, "<$1>");
  if (template.startsWith("filePath")) template = "/api/submissions/<id>/files?name=<name>";
  // A user imports the name from the connected api module.
  const users = sources
    .filter((s) =>
      [...s.text.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"([^"]*)"/g)].some(
        ([, names, from]) =>
          (from.endsWith("connected/api") || /^\.{1,2}\/(\.\.\/)*api$/.test(from)) &&
          new RegExp(`\\b${name}\\b`).test(names),
      ),
    )
    .map((s) => s.file);
  calls.push({ name, method, path: template, users });
}

const other = [];
for (const s of sources) {
  if (!s.file.startsWith("web/src/pages/connected/") || s.file.endsWith("/api.ts")) continue;
  for (const m of s.text.matchAll(/fetch\(\s*(`[^`]*`|"[^"]*")/g)) {
    const line = s.text.slice(0, m.index).split("\n").length;
    other.push({ file: `${s.file}:${line}`, path: m[1].replace(/^["`]|["`]$/g, "").replace(/\$\{encodeURIComponent\((\w+)\)\}/g, "<$1>") });
  }
  for (const m of s.text.matchAll(/(["`])(\/(?:connected|api|library)\/[^"`]*)\1/g)) {
    if (/fetch\(\s*$/.test(s.text.slice(Math.max(0, m.index - 12), m.index))) continue;
    const line = s.text.slice(0, m.index).split("\n").length;
    other.push({ file: `${s.file}:${line}`, path: m[2], note: "address built for a link or a later fetch" });
  }
}

let observed = null;
if (net) {
  const seen = new Map();
  for (const r of net.requests) {
    const u = new URL(r.url);
    if (!/^\/(connected|api|library|activity\.js)/.test(u.pathname)) continue;
    const key = `${u.pathname.replace(/\/\d{8}-\d{6}-\d{2}/g, "/<run>").replace(/\/[0-9a-f]{64}\//g, "/<sha256>/").replace(/\/api\/submissions\/[^/]+/, "/api/submissions/<id>")}${u.search ? "?" + [...u.searchParams.keys()].join("&") : ""}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  observed = Object.fromEntries([...seen.entries()].sort());
}
console.log(JSON.stringify({ calls, other, observed }, null, 1));
