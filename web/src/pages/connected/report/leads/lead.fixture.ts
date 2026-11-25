import type { OutputEntry, PublishedRun, Snapshot, Table } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import type { LeadProps } from "./types";

/** For tests only: a lead's props for one module output, with the run's other outputs and models. */
export function leadProps(
  entry: OutputEntry,
  others: OutputEntry[] = [],
  models: unknown[] = [],
): LeadProps {
  return {
    snapshot: {} as Snapshot,
    run: { folder: "run" } as PublishedRun,
    view: { entries: [entry, ...others], models } as unknown as ReportView,
    entry,
    entryIndex: 0,
  };
}

/** For tests only: a section holding one table. */
export const tableSection = (heading: string, at: Table, level = 3) => ({
  heading,
  level,
  line: at.line - 1,
  blocks: [at],
});

/** For tests only: the `## Findings` and `### Bottom line` a module writes first. */
export function bottomLine(text: string, line = 2) {
  return [
    { heading: "Findings", level: 2, line: line - 1, blocks: [] },
    {
      heading: "Bottom line",
      level: 3,
      line,
      blocks: [{ type: "text" as const, line: line + 1, end: line + 1, text }],
    },
  ];
}

export const EVENT_HEADERS = [
  "Event date",
  "Date precision",
  "Published",
  "Event",
  "Status",
  "Source",
  "Credit relevance",
];
