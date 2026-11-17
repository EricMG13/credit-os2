import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.argv[2]
  ? pathToFileURL(`${resolve(process.argv[2])}/`)
  : new URL("../../../../../../", import.meta.url);
const checks = [
  {
    path: "docs/design/component-map.md",
    row: "| Evidence | Record:",
    forbidden: ["model calls; registers as written"],
    required: [
      "Record: run internals",
      "Module-written tables and registers remain unchanged and exact",
      "in the inspector, Trace or Record",
    ],
  },
  {
    path: "docs/design/component-map.md",
    row: "| Q6 |",
    forbidden: ["Record with registers; nothing removed"],
    required: [
      "Record with run internals",
      "module-written tables and registers in the inspector, Trace or Record",
      "nothing removed",
    ],
  },
  {
    path: "docs/design/react-module-coverage.md",
    row: "| Evidence |",
    forbidden: ["Registers, calls, timings, instructions and handoff downloads live under Record"],
    required: [
      "Module-written tables and registers remain unchanged and exact",
      "in the inspector, Trace or Record",
      "Run internals (calls, timings and instructions) live under Record",
      "Handoff downloads remain available there",
    ],
  },
];

let failures = 0;
for (const check of checks) {
  const lines = readFileSync(new URL(check.path, root), "utf8").split("\n");
  const matches = lines.filter((line) => line.startsWith(check.row));
  if (matches.length !== 1) {
    console.error(`FAIL ${check.path}: expected one ${check.row} row`);
    failures += 1;
    continue;
  }
  const row = matches[0];
  for (const phrase of check.forbidden) {
    if (row.includes(phrase)) {
      console.error(`FAIL ${check.path}: forbidden exclusive placement: ${phrase}`);
      failures += 1;
    }
  }
  for (const phrase of check.required) {
    if (!row.includes(phrase)) {
      console.error(`FAIL ${check.path}: missing distinction: ${phrase}`);
      failures += 1;
    }
  }
}
console.log(`Contract documentation scope: ${checks.length} rows, ${failures} failures`);
process.exitCode = failures === 0 ? 0 : 1;
