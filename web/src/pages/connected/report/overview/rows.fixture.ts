import type { OutputEntry, PublishedRun, Snapshot, Table } from "../../publishedReport";
import type { ReportView } from "../../reportView";

export function table(line: number, headers: string[], rows: string[][]): Table {
  return {
    type: "table",
    line,
    headers,
    rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
  };
}

export function entry(
  module: string,
  charts: Record<string, unknown>[],
  sections: OutputEntry["sections"],
): OutputEntry {
  return {
    output: {
      module,
      id: `run/${module}`,
      label: module,
      sha256: `hash-${module}`,
      href: `${module}.md`,
      charts: charts as OutputEntry["output"]["charts"],
    },
    sections,
    selected: true,
  };
}

export const section = (heading: string, line: number, block: Table) => ({
  heading,
  level: 3,
  line,
  blocks: [block],
});

export function rowProps(entries: OutputEntry[], models: unknown[] = []) {
  return {
    snapshot: {} as Snapshot,
    run: { folder: "run" } as PublishedRun,
    view: { entries, models } as unknown as ReportView,
  };
}
