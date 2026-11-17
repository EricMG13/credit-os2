import type { ReactNode } from "react";
import type { Metric } from "@/pages/library/slice";
import { CONFIDENCE_INPUTS, type OutputEntry, type Snapshot } from "../publishedReport";
import { MetricGrid } from "./MetricGrid";

/** The line of the handoff's Confidence inputs table, so the tile's trace opens those inputs. */
function inputsLine(entry: OutputEntry) {
  for (const section of entry.sections) {
    if (section.heading !== CONFIDENCE_INPUTS) continue;
    const table = section.blocks.find((block) => block.type === "table");
    if (table) return table.line;
  }
  return undefined;
}

/** The published confidence score as one metric tile; nothing for a run that predates the score. */
export function ModuleConfidence({
  snapshot,
  run,
  entry,
  entryIndex,
}: {
  snapshot: Snapshot;
  run: { folder: string };
  entry: OutputEntry;
  entryIndex: number;
}): ReactNode {
  const { confidence } = entry.output;
  if (!confidence) return null;
  const metric: Metric =
    "missing" in confidence
      ? {
          label: "Confidence score",
          value: { kind: "gap", reason: confidence.missing },
          note: "",
          trace: null,
        }
      : {
          label: "Confidence score",
          value: { kind: "value", text: String(confidence.value), at: null },
          note: `${confidence.band} · out of 100`,
          trace: null,
        };
  return (
    <MetricGrid
      records={[{ metric, line: inputsLine(entry) }]}
      entry={entry}
      entryIndex={entryIndex}
      snapshot={snapshot}
      folder={run.folder}
    />
  );
}
