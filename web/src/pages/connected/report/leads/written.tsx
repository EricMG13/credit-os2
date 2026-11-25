import type { ReactNode } from "react";
import { displayColumns, type OutputEntry, type Table } from "../../publishedReport";
import type { SourceTable } from "../../visuals/visualData";
import { Tile } from "../overview/Tile";
import { CompactGap, Disclosure, LeadGap, TableRegion, Trace, type LeadTable } from "./parts";
import { chartsStartingWith, IN_EVIDENCE, readerCell, rowName, WITHHELD, type Chart } from "./read";

type Span = Parameters<typeof LeadGap>[0]["span"];
type Href = (line?: number) => string;

/** Columns that name where a row comes from: they go to the row's trace, never to a cell. */
const SOURCE_COLUMN = /^(?:sources?|evidence|evidence id|source trace)$/i;

/** A module's table in the shape the published charts carry, for `writtenTable`. */
export const sourceOf = (table: Table): SourceTable => ({
  line: table.line,
  headers: table.headers,
  rows: table.rows.map(({ cells }) => cells),
  rowLines: table.rows.map(({ line }) => line),
});

/**
 * A handoff table as a table view shows it: the reader columns the module wrote, in its order
 * (source, register-id and inter-module columns go to the row's trace only), each cell as written
 * for a reader (its per-row unit and basis included), a cell that reads as nothing as missing.
 * Undefined for a table with no rows or no reader column.
 */
export function writtenTable(
  table: SourceTable,
  href: (line: number) => string,
): LeadTable | undefined {
  const rows = table.rows.map((cells) => ({ line: table.line, cells }));
  const [first, ...rest] = displayColumns(table.headers, false, rows).filter(
    (at) => !SOURCE_COLUMN.test((table.headers[at] ?? "").trim()),
  );
  if (first === undefined || !table.rows.length) return undefined;
  const cell = (row: string[], at: number) => readerCell(row[at] ?? "") || null;
  return {
    head: [first, ...rest].map((at) => readerCell(table.headers[at] ?? "")),
    rows: table.rows.map((row, index) => {
      const label = rowName(cell(row, first) ?? "", index);
      return {
        label,
        cells: rest.map((at) => cell(row, at)),
        end: <Trace href={href(table.rowLines?.[index] ?? table.line)} name={label} />,
      };
    }),
    endHeading: "Source",
  };
}

/**
 * A figure the page does not draw, in its place: the module's stated reason; the table the
 * handoff has but the page could not draw or read (`unread`), with the table as written behind a
 * disclosure; or, with no such table, `absent`.
 */
export function ChartGap({
  chart,
  span,
  label,
  title,
  href,
  unread,
  absent,
  children,
}: {
  chart: Chart;
  span: Span;
  label: string;
  title: ReactNode;
  href: Href;
  /** Why a table the handoff has, published or not, is not drawn. */
  unread?: string;
  absent: string;
  children?: ReactNode;
}) {
  if (chart.state === "gap" || chart.state === "absent")
    return (
      <LeadGap
        span={span}
        label={label}
        title={title}
        reason={chart.state === "gap" ? chart.reason : absent}
      >
        {children}
      </LeadGap>
    );
  const written = writtenTable(chart.table, href);
  return (
    <LeadGap
      span={span}
      label={label}
      title={title}
      reason={chart.state === "withheld" ? WITHHELD : (unread ?? WITHHELD)}
      trace={<Trace href={href(chart.table.line)} name={label} />}
    >
      {written && <Disclosure label={label} summary="The table as written" table={written} />}
      {children}
    </LeadGap>
  );
}

/**
 * Whether the module's other charts are all short tiles (a stated gap or a withheld table): such
 * tiles may stack in the column beside a lead's first figure; a drawn table takes its own row.
 */
export function onlyGaps(entry: OutputEntry, drawn: readonly string[]) {
  return chartsStartingWith(entry, "")
    .filter(({ title }) => !drawn.includes(title))
    .every(({ chart }) => chart.state !== "ready");
}

/**
 * The module's charts a lead does not draw by name, in the handoff's order: a stated gap with its
 * reason, a table the store withheld with the page's reason and its trace, a published one as its
 * table. A lead that draws its module's figures draws these too, since the frame then draws none.
 */
export function OtherCharts({
  entry,
  module,
  href,
  drawn,
}: {
  entry: OutputEntry;
  /** The lead's own module: another module's handoff draws none of its charts here. */
  module: string;
  href: (line?: number) => string;
  drawn: readonly string[];
}) {
  if (entry.output.module !== module) return null;
  const charts = chartsStartingWith(entry, "").filter(({ title }) => !drawn.includes(title));
  return charts.map(({ title, chart }) => {
    const name = readerCell(title) || "Chart";
    if (chart.state === "gap")
      return (
        <ChartGap
          key={title}
          chart={chart}
          span={6}
          label={name}
          title={name}
          href={href}
          absent={WITHHELD}
        />
      );
    if (chart.state === "withheld")
      return (
        <LeadGap
          key={title}
          span={6}
          label={name}
          title={name}
          reason={WITHHELD}
          trace={<Trace href={href(chart.line)} name={name} />}
        />
      );
    if (chart.state !== "ready") return null;
    const table = writtenTable(chart.table, href);
    return (
      <Tile
        key={title}
        span={12}
        label={name}
        title={name}
        trace={<Trace href={href(chart.table.line)} name={name} />}
        className="w-full self-start"
      >
        {table ? <TableRegion label={name} table={table} /> : <CompactGap>{WITHHELD}</CompactGap>}
      </Tile>
    );
  });
}

const ROW_NOTES = [/^Reporting unit$/i, /^Basis and limitation$/i];

/**
 * A chart table's own per-row "Reporting unit" and "Basis and limitation" columns, for a lead's table
 * view: their headings, each row's cells as a working page shows them, and `shared`, the one basis
 * every row states (a note under the figure that no row is detached from), else none.
 */
export function rowBasis(table: SourceTable) {
  const columns = ROW_NOTES.map((name) => table.headers.findIndex((header) => name.test(header)));
  const kept = columns.filter((at) => at >= 0);
  const cells = (row: number) => kept.map((at) => readerCell(table.rows[row]?.[at] ?? "") || null);
  const basis = columns[1] ?? -1;
  const notes =
    basis < 0 ? [] : [...new Set(table.rows.map((row) => readerCell(row[basis] ?? "")))];
  const [only] = notes;
  return {
    head: kept.map((at) => table.headers[at] ?? ""),
    cells,
    shared: notes.length === 1 && only && only !== IN_EVIDENCE ? [only] : [],
  };
}
