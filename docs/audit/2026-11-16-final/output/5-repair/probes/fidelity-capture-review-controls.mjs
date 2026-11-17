import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

const repo = "/workspace/audit-fidelity-alignment";
const capture = path.join(repo, "docs/audit/2026-11-16-final/output/5-repair/fidelity/capture.mjs");
const source = await readFile(capture, "utf8");
const root = await mkdtemp("/tmp/fid-review-");
try {
  await mkdir(path.join(root, "web", "dist"), { recursive: true });
  await mkdir(path.join(root, "web", "scripts"), { recursive: true });
  await writeFile(path.join(root, "web", "dist", "index.html"), "<html></html>");
  await writeFile(path.join(root, "web", "package.json"), '{"type":"module"}');
  await symlink(path.join(repo, "web", "node_modules"), path.join(root, "web", "node_modules"));
  await writeFile(path.join(root, "web", "scripts", "connected-proof.mjs"),
    'console.error("REVIEW_OLD_PROOF_TOP_LEVEL_EXECUTED");\n');
  let output = "";
  try {
    await promisify(execFile)(process.execPath, [capture, path.join(root, "out"), "--surface", "static"], {
      env: { ...process.env, REPO_ROOT: root, CHROMIUM_PATH: "/definitely-no-browser-needed" },
      timeout: 5000,
    });
    assert.fail("Missing guard dependency must fail");
  } catch (error) {
    output = error.stderr ?? String(error);
  }
  assert.match(output, /REVIEW_OLD_PROOF_TOP_LEVEL_EXECUTED/);
  assert.match(output, /createOfflineProxy is not a function/);
  console.log("DEPENDENCY: old-module top-level code executed before missing exports failed (no browser launched)");
} finally {
  await rm(root, { recursive: true, force: true });
}

const readFunction = (name, end) => source.slice(source.indexOf(`async function ${name}(`), source.indexOf(end, source.indexOf(`async function ${name}(`)));
const pairedText = readFunction("pairedSnapshot", "\nconst connectedReady");
assert.ok(pairedText.startsWith("async function pairedSnapshot"));
const pairedSnapshot = new Function("fetch", "sha256", `${pairedText}\nreturn pairedSnapshot;`)(
  fetch,
  (value) => createHash("sha256").update(value).digest("hex"),
);
const servers = [];
const hits = [];
const listen = async (handler) => {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
};
try {
  const target = await listen((request, response) => {
    hits.push(request.url);
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ workspace: { runs: { one: { folder: "one", pathway: "full", modules: {} } }, outputs: {}, handoffs: {} } }));
  });
  const origin = await listen((request, response) => {
    response.writeHead(302, { Location: `${target}/redirect-receiver` });
    response.end();
  });
  await pairedSnapshot(origin, "one");
  assert.deepEqual(hits, ["/redirect-receiver"]);
  console.log("REDIRECT: actual pairedSnapshot followed a cross-origin 302 using Node fetch (both listeners loopback; no browser or DNS)");
} finally {
  for (const server of servers) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

