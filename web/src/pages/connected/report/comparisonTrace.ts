import {
  evidencePath,
  outputEntries,
  type PublishedChanges,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import { namedRow, namedTable } from "../reportView";

const plain = (cell = "") =>
  cell.replaceAll("**", "").replaceAll("`", "").trim().replace(/\s+/g, " ");

function exactAmount(text: string) {
  const match = /^(-?)(\d[\d,]*)(?:\.(\d+))?$/.exec(text);
  if (!match) return;
  const whole = (match[2] ?? "").replaceAll(",", "").replace(/^0+(?=\d)/, "");
  const decimals = match[3]?.replace(/0+$/, "");
  const sign = whole === "0" && !decimals ? "" : match[1];
  return `${sign ?? ""}${whole}${decimals ? `.${decimals}` : ""}`;
}

export function comparisonTrace(folder: string, entries: OutputEntry[]) {
  const index = entries.findIndex(
    ({ selected, output }) => selected && output.module === "CP-8" && !output.parseError,
  );
  const entry = entries[index];
  const issuer =
    entry &&
    namedTable(entry, "What changed: the issuer", [
      "Measure or fact",
      "Earlier",
      "Current",
      "Cause",
      "Effect on the credit view",
    ]);
  const analysis =
    entry && namedTable(entry, "What changed: the analysis", ["Module", "Status", "Cause", "Why"]);
  return {
    measure: (label: string) => {
      const row = namedRow(issuer, ({ cells }) => plain(cells[0]) === label);
      return row && entry && evidencePath(folder, entry, row.line);
    },
    module: (code: string) => {
      const row = namedRow(analysis, ({ cells }) => plain(cells[0]).endsWith(`(${code})`));
      return row && entry && evidencePath(folder, entry, row.line);
    },
    handoff: entry && evidencePath(folder, entry),
  };
}

function scheduleTrace(folder: string, entries: OutputEntry[]) {
  const index = entries.findIndex(
    ({ selected, output }) => selected && output.module === "CP-1" && !output.parseError,
  );
  const entry = entries[index];
  const table =
    entry &&
    namedTable(entry, "Chart data: debt maturities", ["Period", "Debt maturing", "Reporting unit"]);
  const periodColumn = table?.headers.indexOf("Period") ?? -1;
  const debtColumn = table?.headers.indexOf("Debt maturing") ?? -1;
  const unitColumn = table?.headers.indexOf("Reporting unit") ?? -1;
  return {
    table: table && evidencePath(folder, entry, table.line),
    row: (period: string, value: string | null, unit: string) => {
      const expected = value === null ? undefined : exactAmount(value);
      if (expected === undefined) return;
      const row = namedRow(table, ({ cells }) => cells[periodColumn] === period);
      if (row?.cells[unitColumn] === unit && exactAmount(row.cells[debtColumn] ?? "") === expected)
        return entry && evidencePath(folder, entry, row.line);
    },
  };
}

export function maturityTraces(
  snapshot: Snapshot,
  run: PublishedRun,
  entries: OutputEntry[],
  change: PublishedChanges,
) {
  const priorFolder = change.pack?.prior?.run;
  const earlier = priorFolder
    ? Object.entries(snapshot.workspace.runs).find(
        ([, candidate]) => candidate.folder === priorFolder,
      )
    : undefined;
  return {
    // A summary-only earlier run carries no modules, so it has no handoff to trace.
    prior:
      earlier && Object.hasOwn(earlier[1], "modules")
        ? scheduleTrace(earlier[1].folder, outputEntries(snapshot, earlier[1], earlier[0]))
        : undefined,
    current: scheduleTrace(run.folder, entries),
  };
}
