// Test helpers: a retained handoff with one table replaced, a row added or a cell edited, for the
// adversarial cases. A mutated entry is not a real handoff; a test that uses one says so.
import type { Block, OutputEntry, Row, Table } from "../../../publishedReport";
import { cp1Entry } from "./load";

/** The entry with every table passed through `change` (null drops the table). */
export function edited(
  entry: OutputEntry,
  change: (table: Table, heading: string) => Table | null,
): OutputEntry {
  return {
    ...entry,
    sections: entry.sections.map((section) => ({
      ...section,
      blocks: section.blocks.flatMap((block): Block[] => {
        if (block.type !== "table") return [block];
        const next = change(block, section.heading);
        return next ? [next] : [];
      }),
    })),
  };
}

const under = (heading: string, change: (table: Table) => Table) => (table: Table, at: string) =>
  at === heading ? change(table) : table;

/** One cell of the `row`-th row (0-based) of the table under `heading`, rewritten. */
export const setCell = (
  entry: OutputEntry,
  heading: string,
  row: number,
  column: string,
  text: string,
) =>
  edited(
    entry,
    under(heading, (table) => {
      const index = table.headers.indexOf(column);
      return {
        ...table,
        rows: table.rows.map((item, n) =>
          n === row
            ? { ...item, cells: item.cells.map((cell, m) => (m === index ? text : cell)) }
            : item,
        ),
      };
    }),
  );

/** The cell of the row whose first cell is `label`, rewritten. */
export function setLabelled(
  entry: OutputEntry,
  heading: string,
  label: string,
  column: string,
  text: string,
) {
  const table = entry.sections
    .find((section) => section.heading === heading)
    ?.blocks.find((block) => block.type === "table");
  const row = table?.type === "table" ? table.rows.findIndex((r) => r.cells[0] === label) : -1;
  if (row < 0) throw new Error(`no row ${label} under ${heading}`);
  return setCell(entry, heading, row, column, text);
}

export const dropTable = (entry: OutputEntry, heading: string) =>
  edited(entry, (table, at) => (at === heading ? null : table));

/** The table under `heading` with its rows replaced. */
export const withRows = (entry: OutputEntry, heading: string, rows: string[][]) =>
  edited(
    entry,
    under(heading, (table) => ({
      ...table,
      rows: rows.map((cells, at): Row => ({ line: table.line + 2 + at, cells })),
    })),
  );

/** A row appended at the end of the table under `heading` (after the latest period: order is by year). */
export const addRow = (entry: OutputEntry, heading: string, cells: string[]) =>
  edited(
    entry,
    under(heading, (table) => ({
      ...table,
      rows: [...table.rows, { line: table.line + 2 + table.rows.length, cells }],
    })),
  );

/** A period column inserted before `before`, each row's cell given by `cell`. */
const addColumn = (
  entry: OutputEntry,
  heading: string,
  header: string,
  before: string,
  cell: (row: Row) => string,
) =>
  edited(
    entry,
    under(heading, (table) => {
      const at = table.headers.indexOf(before);
      return {
        ...table,
        headers: [...table.headers.slice(0, at), header, ...table.headers.slice(at)],
        rows: table.rows.map((row) => ({
          ...row,
          cells: [...row.cells.slice(0, at), cell(row), ...row.cells.slice(at)],
        })),
      };
    }),
  );

export const OUTSIDE = "Not supplied: outside the comparison scope";
const NOTE = "Test mutation: a third period.";

/**
 * The accepted TransDigm CP-1 with a third, earlier period FY2022, written after FY2024 in each
 * table (order is by year, never position): `Not supplied: outside the comparison scope` in most
 * cells, 2646 stated as FY2022 Adjusted EBITDA (revenue chart) and EBITDA (Reported) (T4.4).
 * A mutation for tests, not a real handoff.
 */
export function threePeriodCp1(): OutputEntry {
  let entry = cp1Entry();
  entry = addRow(entry, "Chart data: revenue and EBITDA", [
    "FY2022",
    OUTSIDE,
    "2646",
    "US$m",
    NOTE,
  ]);
  entry = addRow(entry, "Net debt data", [
    "FY2022 / 2022-09-30",
    OUTSIDE,
    OUTSIDE,
    OUTSIDE,
    "US$m",
    NOTE,
  ]);
  entry = addRow(entry, "Chart data: leverage", [
    "FY2022 / 2022-09-30",
    OUTSIDE,
    OUTSIDE,
    "x",
    NOTE,
  ]);
  entry = addRow(entry, "Chart data: liquidity", [
    "FY2022 / 2022-09-30",
    OUTSIDE,
    OUTSIDE,
    "US$m",
    NOTE,
  ]);
  entry = addColumn(entry, "T4.4 Income statement", "FY2022", "Unit", (row) =>
    row.cells[0] === "EBITDA (Reported)" ? "2646" : OUTSIDE,
  );
  entry = addColumn(entry, "T4.5 Cash flow statement", "FY2022", "Unit", () => OUTSIDE);
  return entry;
}

/** The accepted CP-1 with an `LTM Dec-2024` row beside FY2023 and FY2024 in the revenue chart. A mutation for tests. */
export const ltmCp1 = () =>
  addRow(cp1Entry(), "Chart data: revenue and EBITDA", [
    "LTM Dec-2024",
    "8000",
    "4300",
    "US$m",
    "Test mutation: a last-twelve-months row.",
  ]);

/**
 * The accepted CP-1 with five periods in its revenue, net debt, leverage and interest cover
 * tables, written in a scrambled order: two fiscal years, an LTM, a pro forma and a forecast year.
 * The FY2023 and FY2024 figures are the handoff's; the other rows are test figures. A mutation for
 * tests of the period order (ruling of 2026-11-25), not a real handoff.
 */
export function mixedPeriodsCp1(): OutputEntry {
  const tables: [string, string[][]][] = [
    [
      "Chart data: interest cover",
      [
        ["FY2025E", "3.90", "x", "Forecast row."],
        ["PF FY2024", "3.05", "x", "Pro forma row."],
        ["FY2024 / 2024-09-30", "3.29", "x", "Reported row."],
        ["LTM Jun-2025", "3.40", "x", "Twelve-month row."],
        ["FY2023 / 2023-09-30", "2.71", "x", "Earlier row."],
      ],
    ],
    [
      "Net debt data",
      [
        ["FY2025E", "25100", "2000", "23100", "US$m", "Forecast row."],
        ["PF FY2024", "24880", "1913", "22967", "US$m", "Pro forma row."],
        ["LTM Jun-2025", "24950", "2100", "22850", "US$m", "Twelve-month row."],
        ["FY2024 / 2024-09-30", "24880", "6261", "18619", "US$m", "Reported row."],
        ["FY2023 / 2023-09-30", "19750", "3472", "16278", "US$m", "Earlier row."],
      ],
    ],
    [
      "Chart data: revenue and EBITDA",
      [
        ["FY2025E", "8800", "4700", "US$m", "Forecast row."],
        ["LTM Jun-2025", "8500", "4500", "US$m", "Twelve-month row."],
        ["FY2024", "7940", "4173", "US$m", "Reported row."],
        ["PF FY2024", "8100", "4250", "US$m", "Pro forma row."],
        ["FY2023", "6585", "3395", "US$m", "Earlier row."],
      ],
    ],
    [
      "Chart data: leverage",
      [
        ["PF FY2024", "7.10", "6.02", "x", "Pro forma row."],
        ["FY2025E", "5.90", "4.60", "x", "Forecast row."],
        ["FY2024 / 2024-09-30", "6.53", "4.88", "x", "Reported row."],
        ["LTM Jun-2025", "6.40", "4.80", "x", "Twelve-month row."],
        ["FY2023 / 2023-09-30", "6.27", "5.17", "x", "Earlier row."],
      ],
    ],
  ];
  return tables.reduce((entry, [heading, rows]) => withRows(entry, heading, rows), cp1Entry());
}
