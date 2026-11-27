import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { builtBundleHashes, sourceProvenance } from "./source-provenance.mjs";

const vite = path.join(import.meta.dirname, "..", "node_modules", "vite", "bin", "vite.js");
const outDir = process.env["CREDIT_OS_OUT_DIR"];
const output = outDir ? ["--outDir", outDir] : [];

for (const args of [
  ["build", ...output, ...(outDir ? ["--emptyOutDir"] : [])],
  ["build", "--config", "vite.connected.config.ts", ...output],
]) {
  const result = spawnSync(process.execPath, [vite, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const outputDirectory = path.resolve(process.cwd(), outDir ?? "dist");
const connectedAssets = path.join(outputDirectory, "connected-assets");
const builtBundles = await builtBundleHashes(connectedAssets);
await writeFile(
  path.join(connectedAssets, "source-provenance.json"),
  `${JSON.stringify(
    {
      ...(await sourceProvenance(path.resolve(import.meta.dirname, "../.."))),
      built_bundles: builtBundles,
    },
    null,
    2,
  )}\n`,
);
