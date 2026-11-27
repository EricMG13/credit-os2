import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, truncate, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import {
  assertManifestMatches,
  builtBundleHashes,
  requireCleanGitSource,
  sourceProvenance,
  verifyServedBundle,
} from "./source-provenance.mjs";

const temporary = await mkdtemp(path.join(os.tmpdir(), "credit-os-source-proof-"));
after(() => rm(temporary, { recursive: true, force: true }));

test("source fingerprint works in an extracted package and ignores Python caches", async () => {
  const app = path.join(temporary, "app");
  const source = path.join(app, "web", "src");
  await mkdir(path.join(source, "__pycache__"), { recursive: true });
  await writeFile(path.join(source, "page.tsx"), "export const page = true;\n");
  const cache = path.join(source, "__pycache__", "page.pyc");
  await writeFile(cache, "cache before import");

  const first = await sourceProvenance(app);
  await writeFile(cache, "cache after import");
  const second = await sourceProvenance(app);
  await writeFile(path.join(source, "page.tsx"), "export const page = false;\n");
  const changed = await sourceProvenance(app);

  const expected = createHash("sha256")
    .update("web/src/page.tsx\0export const page = true;\n\0")
    .digest("hex");
  assert.equal(first.source_sha256, expected);
  assert.equal(first.git_commit, null);
  assert.equal(first.git_tree, null);
  assert.equal(first.git_available, false);
  assert.doesNotThrow(() => requireCleanGitSource(first, true));
  assert.equal(first.source_sha256, second.source_sha256);
  assert.notEqual(changed.source_sha256, second.source_sha256);
  assert.equal(first.source_file_count, 1);
});

test("served bundle must match the independently fingerprinted build artifact", async () => {
  const assets = path.join(temporary, "assets");
  await mkdir(assets, { recursive: true });
  const bundle = Buffer.from("compiled app bundle\n");
  await writeFile(path.join(assets, "Coverage-abc.js"), bundle);
  await writeFile(path.join(assets, "source-provenance.json"), "manifest is not a bundle");

  const builtBundles = await builtBundleHashes(assets);
  const digest = createHash("sha256").update(bundle).digest("hex");
  const retainedManifest = { source_sha256: "current-source", built_bundles: builtBundles };
  assert.equal(builtBundles["Coverage-abc.js"], digest);
  assert.doesNotThrow(() => assertManifestMatches(retainedManifest, { ...retainedManifest }));
  assert.equal(
    verifyServedBundle("/connected-assets/Coverage-abc.js", bundle, builtBundles),
    digest,
  );
  assert.throws(
    () =>
      verifyServedBundle("/connected-assets/Coverage-abc.js", Buffer.from("swapped"), builtBundles),
    /differs from the recorded build artifact/u,
  );
  assert.throws(
    () => verifyServedBundle("/other/Coverage-abc.js", bundle, builtBundles),
    /Unexpected connected asset path/u,
  );
  const replacedBundle = Buffer.from("replaced along with its forged manifest");
  const forgedManifest = {
    ...retainedManifest,
    source_sha256: "old-source",
    built_bundles: {
      ...builtBundles,
      "Coverage-abc.js": createHash("sha256").update(replacedBundle).digest("hex"),
    },
  };
  assert.throws(() => assertManifestMatches(forgedManifest, retainedManifest), /differs/u);
  assert.throws(
    () => verifyServedBundle("/connected-assets/Coverage-abc.js", replacedBundle, builtBundles),
    /differs from the recorded build artifact/u,
  );
});

test("hosted proof accepts a clean Git checkout and rejects source edits", async () => {
  const app = path.join(temporary, "git-app");
  const source = path.join(app, "web", "src");
  await mkdir(source, { recursive: true });
  const file = path.join(source, "page.tsx");
  await writeFile(file, "export const page = true;\n");
  execFileSync("git", ["init", "-q", app]);
  execFileSync("git", ["-C", app, "add", "web/src/page.tsx"]);
  execFileSync("git", [
    "-C",
    app,
    "-c",
    "user.name=Proof Test",
    "-c",
    "user.email=proof@example.test",
    "commit",
    "-q",
    "-m",
    "fixture",
  ]);

  const clean = await sourceProvenance(app);
  assert.equal(clean.git_available, true);
  assert.equal(clean.git_clean, true);
  assert.doesNotThrow(() => requireCleanGitSource(clean, true));

  await writeFile(file, "export const page = false;\n");
  const dirty = await sourceProvenance(app);
  assert.equal(dirty.git_clean, false);
  assert.throws(() => requireCleanGitSource(dirty, true), /clean Git worktree/u);
  assert.doesNotThrow(() => requireCleanGitSource(dirty, false));
});

test("source fingerprint rejects oversized files before reading them", async () => {
  const app = path.join(temporary, "oversized-app");
  const source = path.join(app, "web", "src");
  await mkdir(source, { recursive: true });
  const file = path.join(source, "large.bin");
  await writeFile(file, "");
  await truncate(file, 256 * 1024 * 1024 + 1);

  await assert.rejects(sourceProvenance(app), /size limit/u);
});
