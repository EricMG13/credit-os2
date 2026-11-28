import { Fragment, useState, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { containsReference, readerText } from "../publishedReport";
import { drawnReason, EVIDENCE_REASON } from "./drawnQualifications";
import type { Grid } from "./LegacyForecast";
import { word } from "./visualData";
import type { ForecastSource } from "../report/ForecastRecord";

type Source = ((label: string) => ReactNode) | undefined;

function Qualification({ text, label, source }: { text: string; label: string; source: Source }) {
  return (
    <div className="mt-2 max-w-sm whitespace-normal text-left text-small font-normal text-text-secondary">
      <p className="font-semibold">{label}</p>
      <p>
        {containsReference(text)
          ? "Recorded qualification: review the model evidence."
          : readerText(text)}
      </p>
      {source?.(label)}
    </div>
  );
}

function periodColumn(grid: Grid, passage: string) {
  const periods: readonly string[] = passage.match(/\b(?:H[12] |Q[1-4] |FY)\d{4}\b/g) ?? [];
  const matches = grid.columns.flatMap((column, index) => {
    const token = /^(?:YTD|PYTD) \((.+)\)$/.exec(column.label)?.[1];
    return token && periods.includes(token) ? [index] : [];
  });
  return matches.length === 1 ? matches[0] : undefined;
}

function columnGroups(grid: Grid) {
  const groups: { label: string; span: number }[] = [];
  for (const column of grid.columns) {
    const last = groups.at(-1);
    if (last?.label === column.group) last.span += 1;
    else groups.push({ label: column.group, span: 1 });
  }
  return groups;
}

function unpopulatedCell(cell: Record<string, unknown>) {
  return (cell.status === "na" || cell.status === "nm") && cell.exact == null;
}

function unpopulated(row: Grid["rows"][number]) {
  return row.cells.length > 0 && row.cells.every(unpopulatedCell);
}

const NOT_AVAILABLE = "n.a.";

const PERIOD_WORDS: Record<string, string> = {
  "PF LTM": "Pro forma last twelve months",
  "Prior LTM": "Prior last twelve months",
  LTM: "Last twelve months",
  PYTD: "Prior-year to date",
  YTD: "Year to date",
};

/** A column label with its period shorthand spelled out, for a sentence; the table header keeps the label. */
function spelledOut(label: string) {
  return label.replace(
    /\b(?:PF LTM|Prior LTM|LTM|PYTD|YTD)\b/g,
    (token) => PERIOD_WORDS[token] ?? token,
  );
}

function emptyColumns(grid: Grid) {
  return grid.columns.flatMap((_, index) =>
    grid.rows.length > 0 &&
    grid.rows.every((row) => {
      const cell = row.cells[index];
      return cell !== undefined && word(cell.display) === NOT_AVAILABLE && cell.exact == null;
    })
      ? [index]
      : [],
  );
}

function withColumns(grid: Grid, keep: number[]): Grid {
  const pick = <T,>(values: T[]) => keep.flatMap((index) => (values[index] ? [values[index]] : []));
  return {
    columns: pick(grid.columns),
    rows: grid.rows.map((row) => ({ ...row, cells: pick(row.cells) })),
  };
}

/** A note with the button that shows or hides what the table leaves out. */
function Disclosure({
  note,
  label,
  expanded,
  onToggle,
}: {
  note: string | null;
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {note && <p className="text-small text-text-secondary">{note}</p>}
      <Button color="secondary" size="sm" aria-expanded={expanded} onClick={onToggle}>
        {label}
      </Button>
    </div>
  );
}

function ForecastCell({
  cell,
  showReason,
  evidenceOnlyQualifications,
}: {
  cell: Record<string, unknown>;
  showReason: boolean;
  evidenceOnlyQualifications?: boolean;
}) {
  const display = word(cell.display);
  const recorded = drawnReason(word(cell.reason));
  const reason = recorded && evidenceOnlyQualifications ? EVIDENCE_REASON : recorded;
  const exact = word(cell.exact);
  return (
    <td
      className="px-3 py-2 text-right whitespace-nowrap tabular-nums"
      title={reason || exact || undefined}
      aria-label={reason ? `${display} ${reason}` : undefined}
    >
      {display}
      {showReason && reason && (
        <span className="mt-1 block min-w-40 max-w-56 wrap-anywhere whitespace-normal text-left text-small text-text-tertiary">
          {reason}
        </span>
      )}
    </td>
  );
}

function ForecastRows({
  grid,
  rows,
  interestBasis,
  expanded,
  source,
  evidenceOnlyQualifications,
}: {
  grid: Grid;
  rows: Grid["rows"];
  interestBasis: string[];
  expanded: boolean;
  source?: ForecastSource;
  evidenceOnlyQualifications?: boolean;
}) {
  return (
    <tbody>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {row.band && rows[index - 1]?.band !== row.band && (
            <tr className="bg-surface-subtle">
              <th colSpan={grid.columns.length + 1} className="px-3 py-2 text-left">
                {row.band}
              </th>
            </tr>
          )}
          <tr className={`border-b border-border-hairline ${row.total ? "font-semibold" : ""}`}>
            <th
              scope="row"
              className="sticky left-0 w-48 min-w-36 max-w-48 bg-surface-card px-3 py-2 text-left wrap-anywhere whitespace-normal sm:w-64 sm:max-w-64"
            >
              {row.label}
              {source?.(row.label, { row: row.label })}
            </th>
            {row.cells.map((cell, position) => (
              <ForecastCell
                key={position}
                cell={cell}
                showReason={expanded && unpopulated(row)}
                evidenceOnlyQualifications={evidenceOnlyQualifications}
              />
            ))}
          </tr>
          {/^(?:Interest|Interest coverage(?: \(.*\))?)$/i.test(row.label) &&
            interestBasis.map((text) => (
              <tr key={text} className="bg-surface-subtle">
                <th
                  scope="row"
                  className="sticky left-0 bg-surface-subtle px-3 py-2 text-left text-small font-medium"
                >
                  {row.label} basis
                </th>
                <td colSpan={grid.columns.length} className="px-3 py-2">
                  <div
                    className={`${TRACE_HOST} flex max-w-prose items-start gap-2 text-small text-text-secondary`}
                  >
                    <p>
                      {containsReference(text)
                        ? "See Evidence for the recorded interest basis."
                        : readerText(text)}
                    </p>
                    {source?.(`${row.label} basis`, { recordedQualification: text })}
                  </div>
                </td>
              </tr>
            ))}
        </Fragment>
      ))}
    </tbody>
  );
}

function ForecastColumns({ grid }: { grid: Grid }) {
  return (
    <thead className="border-b-2 border-border-hairline">
      <tr>
        <th scope="col" rowSpan={2} className="px-3 py-2 text-left">
          Line item
        </th>
        {columnGroups(grid).map((group, index) => (
          <th
            key={index}
            scope="colgroup"
            colSpan={group.span}
            className="px-3 py-2 text-center whitespace-nowrap"
          >
            {readerText(group.label)}
          </th>
        ))}
      </tr>
      <tr>
        {grid.columns.map((column, index) => (
          <th
            key={index}
            scope="col"
            className="px-3 py-2 text-right whitespace-nowrap"
            title={column.start && column.end ? `${column.start} to ${column.end}` : undefined}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function visibleForecastGrid(inputGrid: Grid, keepColumns: boolean, showColumns: boolean) {
  const empty = emptyColumns(inputGrid);
  // Columns are only set aside when another column holds a value; a table with none is drawn whole.
  const canHideColumns =
    !keepColumns &&
    empty.length > 0 &&
    inputGrid.rows.some((row) =>
      row.cells.some((cell, index) => !empty.includes(index) && !unpopulatedCell(cell)),
    );
  const grid =
    canHideColumns && !showColumns
      ? withColumns(
          inputGrid,
          inputGrid.columns.flatMap((_, index) => (empty.includes(index) ? [] : [index])),
        )
      : inputGrid;
  return { grid, empty, canHideColumns };
}

function gridQualifications(
  inputGrid: Grid,
  limits: string[],
  evidenceOnlyQualifications?: boolean,
) {
  const period = (evidenceOnlyQualifications ? [] : limits).filter((text) =>
    text.startsWith("Base period is "),
  );
  const interest = [...new Set(limits.filter((text) => /^Base interest\b/i.test(text)))];
  const footerInterest = evidenceOnlyQualifications ? [] : interest;
  const bound = inputGrid.columns.flatMap((column, index) =>
    period
      .filter((text) => periodColumn(inputGrid, text) === index)
      .map((text) => ({ label: column.label, text })),
  );
  const unbound = period.filter((text) => periodColumn(inputGrid, text) === undefined);
  return { interest, footerInterest, bound, unbound };
}

function EmptyColumns({
  grid: inputGrid,
  empty,
  shown: showColumns,
  onToggle,
}: {
  grid: Grid;
  empty: number[];
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <Disclosure
      note={
        showColumns
          ? null
          : `These columns have no recorded values: ${empty.map((index) => spelledOut(inputGrid.columns[index]?.label ?? "")).join(", ")}.`
      }
      label={
        showColumns
          ? "Hide columns with no values"
          : `Show ${String(empty.length)} columns with no values`
      }
      expanded={showColumns}
      onToggle={onToggle}
    />
  );
}

function TableQualifications({
  bound,
  footerInterest,
  source,
}: {
  bound: { label: string; text: string }[];
  footerInterest: string[];
  source?: ForecastSource;
}) {
  if (!bound.length && !footerInterest.length) return null;
  return (
    <ul aria-label="Qualifications" className="grid gap-2">
      {bound.map(({ label, text }, at) => (
        <li key={`period-${String(at)}`}>
          <Qualification text={text} label={`${label} period qualification`} source={source} />
        </li>
      ))}
      {footerInterest.map((text, at) => (
        <li key={`interest-${String(at)}`}>
          <Qualification text={text} label="Interest basis qualification" source={source} />
        </li>
      ))}
    </ul>
  );
}

function visibleForecastRows(grid: Grid, expanded: boolean) {
  const missing = grid.rows.filter(unpopulated).length;
  const populated = grid.rows.filter((row) => !unpopulated(row));
  const canCollapse = missing > 0 && populated.length > 0;
  const rows = expanded || !canCollapse ? grid.rows : populated;
  const interestShown = rows.some((row) => row.label === "Interest");
  return { missing, canCollapse, rows, interestShown };
}

function ForecastGridRegion({
  title,
  grid,
  rows,
  statement,
  expanded,
  interest,
  source,
  evidenceOnlyQualifications,
}: {
  title: string;
  grid: Grid;
  rows: Grid["rows"];
  statement: boolean;
  expanded: boolean;
  interest: string[];
  source?: ForecastSource;
  evidenceOnlyQualifications?: boolean;
}) {
  return (
    <div
      className={
        statement
          ? "max-h-[28rem] overflow-auto rounded-ds-md border border-border-hairline [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-surface-subtle [&_thead_th:first-child[rowspan]]:sticky [&_thead_th:first-child[rowspan]]:left-0 [&_thead_th:first-child[rowspan]]:bg-surface-subtle"
          : "overflow-x-auto"
      }
      role="region"
      aria-label={title}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      <table className="w-full border-collapse text-small">
        <caption className="sr-only">{title}</caption>
        <ForecastColumns grid={grid} />
        <ForecastRows
          grid={grid}
          rows={rows}
          interestBasis={interest}
          expanded={expanded}
          source={source}
          evidenceOnlyQualifications={evidenceOnlyQualifications}
        />
      </table>
    </div>
  );
}

function UnavailableRows({
  missing,
  expanded,
  onToggle,
}: {
  missing: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Disclosure
      note={`${String(missing)} rows have no recorded values in this view. Their missing-data reasons remain available.`}
      label={
        expanded ? "Hide unavailable rows" : `Show ${String(missing)} unavailable rows and reasons`
      }
      expanded={expanded}
      onToggle={onToggle}
    />
  );
}

export function ForecastTable({
  grid: inputGrid,
  title,
  limits,
  source,
  evidenceOnlyQualifications,
  statement = false,
  keepColumns = false,
}: {
  grid: Grid;
  title: string;
  limits: string[];
  source?: ForecastSource;
  evidenceOnlyQualifications?: boolean;
  statement?: boolean;
  keepColumns?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const { grid, empty, canHideColumns } = visibleForecastGrid(inputGrid, keepColumns, showColumns);
  const { missing, canCollapse, rows, interestShown } = visibleForecastRows(grid, expanded);
  const { interest, footerInterest, bound, unbound } = gridQualifications(
    inputGrid,
    limits,
    evidenceOnlyQualifications,
  );
  return (
    <div className="grid min-w-0 gap-3">
      {unbound.map((text, at) => (
        <Qualification key={at} text={text} label="Base-period qualification" source={source} />
      ))}
      {!interestShown &&
        footerInterest.map((text, at) => (
          <Qualification
            key={at}
            text={text}
            label="Interest basis qualification"
            source={source}
          />
        ))}
      <ForecastGridRegion
        title={title}
        grid={grid}
        rows={rows}
        statement={statement}
        expanded={expanded || !canCollapse}
        interest={evidenceOnlyQualifications ? interest : []}
        source={evidenceOnlyQualifications ? source : undefined}
        evidenceOnlyQualifications={evidenceOnlyQualifications}
      />
      {canCollapse && (
        <UnavailableRows
          missing={missing}
          expanded={expanded}
          onToggle={() => {
            setExpanded(!expanded);
          }}
        />
      )}
      {canHideColumns && (
        <EmptyColumns
          grid={inputGrid}
          empty={empty}
          shown={showColumns}
          onToggle={() => {
            setShowColumns(!showColumns);
          }}
        />
      )}
      <TableQualifications
        bound={bound}
        footerInterest={interestShown ? footerInterest : []}
        source={source}
      />
    </div>
  );
}
