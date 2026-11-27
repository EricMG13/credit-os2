import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstat, readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const sourceDirectories = [
  "src",
  "react_frontend",
  "apps/issuer-library",
  "proof",
  "web/src",
  "web/scripts",
  "web/public",
];
const sourceFiles = [
  "AGENTS.md",
  "SOURCE-COMMIT.txt",
  "pyproject.toml",
  "uv.lock",
  "web/index.html",
  "web/connected.html",
  "web/package.json",
  "web/package-lock.json",
  "web/tsconfig.json",
  "web/vite.config.ts",
  "web/vite.connected.config.ts",
];
const maxFiles = 30000;
const maxBytes = 256 * 1024 * 1024;

async function filesUnder(root, relative, total = { count: 0 }) {
  const absolute = path.join(root, relative);
  let entries;
  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name === "__pycache__" || entry.name === ".pytest_cache") continue;
    const child = path.join(relative, entry.name);
    if (entry.isFile()) {
      total.count += 1;
      if (total.count > maxFiles) throw new Error("Source fingerprint exceeds the file limit");
      files.push(child);
    } else if (entry.isDirectory()) files.push(...(await filesUnder(root, child, total)));
  }
  return files;
}

function gitOutput(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

async function gitMetadata(root) {
  const rootPath = await realpath(root);
  const topLevel = gitOutput(rootPath, ["rev-parse", "--show-toplevel"]);
  if (topLevel === rootPath) {
    const status = gitOutput(rootPath, ["status", "--porcelain=v1", "--untracked-files=all"]);
    return {
      available: true,
      commit: gitOutput(rootPath, ["rev-parse", "HEAD"]),
      tree: gitOutput(rootPath, ["rev-parse", "HEAD^{tree}"]),
      clean: status === null ? null : status === "",
    };
  }
  try {
    await lstat(path.join(rootPath, ".git"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return { available: false, commit: null, tree: null, clean: null };
  }
  return {
    available: true,
    commit: null,
    tree: null,
    clean: null,
  };
}

export async function sourceProvenance(root) {
  const files = new Set(sourceFiles);
  const total = { count: 0 };
  for (const directory of sourceDirectories)
    for (const file of await filesUnder(root, directory, total)) files.add(file);
  const ordered = [...files].sort();
  if (ordered.length > maxFiles) throw new Error("Source fingerprint exceeds the file limit");

  const hash = createHash("sha256");
  let totalBytes = 0;
  let includedFiles = 0;
  for (const file of ordered) {
    let contents;
    try {
      const metadata = await stat(path.join(root, file));
      if (totalBytes + metadata.size > maxBytes)
        throw new Error("Source fingerprint exceeds the size limit");
      contents = await readFile(path.join(root, file));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    totalBytes += contents.length;
    if (totalBytes > maxBytes) throw new Error("Source fingerprint exceeds the size limit");
    includedFiles += 1;
    hash.update(file);
    hash.update("\0");
    hash.update(contents);
    hash.update("\0");
  }

  const git = await gitMetadata(root);
  return {
    git_available: git.available,
    git_commit: git.commit,
    git_tree: git.tree,
    git_clean: git.clean,
    source_sha256: hash.digest("hex"),
    source_file_count: includedFiles,
    source_bytes: totalBytes,
  };
}

export function requireCleanGitSource(source, required) {
  if (!required || !source.git_available) return;
  if (source.git_commit === null || source.git_clean !== true)
    throw new Error("Hosted merge proof requires a committed, clean Git worktree");
}

export function assertManifestMatches(actual, expected) {
  if (!isDeepStrictEqual(actual, expected))
    throw new Error("Served build manifest differs from the retained local build manifest");
}

export async function builtBundleHashes(connectedAssets) {
  const bundles = {};
  for (const entry of await readdir(connectedAssets, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(?:js|css)$/u.test(entry.name)) continue;
    const bytes = await readFile(path.join(connectedAssets, entry.name));
    bundles[entry.name] = createHash("sha256").update(bytes).digest("hex");
  }
  return bundles;
}

export function verifyServedBundle(pathname, bytes, builtBundles) {
  const prefix = "/connected-assets/";
  if (!pathname.startsWith(prefix) || path.basename(pathname) !== pathname.slice(prefix.length))
    throw new Error(`Unexpected connected asset path ${pathname}`);
  const filename = pathname.slice(prefix.length);
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (builtBundles[filename] !== actual)
    throw new Error(`Served bundle ${pathname} differs from the recorded build artifact`);
  return actual;
}
