import { ChevronDown } from "@untitledui/icons";
import { useState, type ReactNode } from "react";
import { Segmented } from "@/components/kit/Segmented";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { cx } from "@/utils/cx";
import { containsReference, readerText } from "../publishedReport";
import { Key } from "../report/overview/figureParts";
import { word } from "./visualData";
import { Sparkline } from "./signal/Sparkline";

type Cell = Record<string, unknown>;

export interface GridColumn {
  label: string;
  /** The column band this column sits under: "Actual", "Forecast · Base case". */
  band: string;
  /** The recorded date span, for the header's title. */
  title?: string;
}

export interface GridRow {
  label: string;
  band: string;
  /** What the row's figures are: accounts, ratios, growth rates. */
  family: string;
  total: boolean;
  cells: Cell[];
  trend?: { values: (string | null)[]; label: string };
}

interface Gap {
  display: string;
  reason: string;
}

interface CellRun {
  start: number;
  span: number;
  cell: Cell;
  gap?: Gap;
}

const EVIDENCE_REASON = "Reason recorded in model evidence.";
const NO_FIGURE = "the model wrote no figure here; none is interpolated or shown as zero.";
const WITH_REASON = `${NO_FIGURE} Hover the cell or open the row's trace for the recorded reason.`;

/** A cell that holds no figure: n.a., n.m., not published, or any recorded reason. */
function gapOf(cell: Cell): Gap | undefined {
  const display = word(cell.display);
  const valued =
    typeof cell.status === "string"
      ? cell.status === "value"
      : !/^n\.[am]\.$/u.test(display) && !word(cell.reason);
  if (valued) return undefined;
  const reason = readerText(word(cell.reason));
  return { display, reason: containsReference(reason) ? EVIDENCE_REASON : reason };
}

const sameGap = (left?: Gap, right?: Gap) =>
  Boolean(left && right && left.display === right.display && left.reason === right.reason);

/** A row's cells, with consecutive like gaps under one band drawn as one spanning cell. */
function cellRuns(cells: Cell[], columns: GridColumn[]) {
  const runs: CellRun[] = [];
  cells.forEach((cell, index) => {
    const gap = gapOf(cell);
    const last = runs.at(-1);
    if (last && sameGap(last.gap, gap) && columns[last.start]?.band === columns[index]?.band)
      last.span += 1;
    else runs.push({ start: index, span: 1, cell, gap });
  });
  return runs;
}

/** Each gap word once, in the order the table first shows it, and whether any of its cells
 * records a reason. The reasons themselves stay on the cells and in the traces: a cell's reason
 * can be the model's qualification ledger, which the page draws only on Evidence. */
function gapWords(rows: { runs: CellRun[] }[]) {
  const words = new Map<string, boolean>();
  for (const { runs } of rows)
    for (const { gap } of runs)
      if (gap) words.set(gap.display, (words.get(gap.display) ?? false) || gap.reason !== "");
  return [...words];
}

function spans<T>(items: T[], keyOf: (item: T) => string) {
  const groups: { key: string; items: T[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last?.key === keyOf(item)) last.items.push(item);
    else groups.push({ key: keyOf(item), items: [item] });
  }
  return groups;
}

/** "Accounts", "Accounts and growth rates", "Accounts, ratios and growth rates". */
function familyText(rows: GridRow[]) {
  const names = [...new Set(rows.map(({ family }) => family))].map((name, index) =>
    index ? name.toLowerCase() : name,
  );
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`
    : (names[0] ?? "");
}

function GapCell({ run, trend }: { run: CellRun & { gap: Gap }; trend?: GridRow["trend"] }) {
  const { display, reason } = run.gap;
  return (
    <td
      colSpan={run.span > 1 ? run.span : undefined}
      className="px-2 py-1.5"
      title={reason || undefined}
      aria-label={reason ? `${display} ${reason}` : undefined}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="gap-hatch flex min-h-8 flex-1 items-center justify-center rounded-ds-sm border border-dashed border-border-gap px-2">
          <span className="rounded-ds-xs bg-surface-card px-1.5 text-caption text-gap-text whitespace-nowrap">
            {display}
          </span>
        </span>
        {trend && <Sparkline values={trend.values} label={trend.label} />}
      </div>
    </td>
  );
}

function ValueCell({ cell, trend }: { cell: Cell; trend?: GridRow["trend"] }) {
  return (
    <td
      className="px-3 py-1.5 text-right font-mono text-mono whitespace-nowrap tabular-nums"
      title={word(cell.exact) || undefined}
    >
      {trend ? (
        <span className="inline-flex items-center gap-2">
          {word(cell.display)}
          <Sparkline values={trend.values} label={trend.label} />
        </span>
      ) : (
        word(cell.display)
      )}
    </td>
  );
}

/** A full-width header cell whose words stay at the scroll region's left edge on an opaque
 * ground, so a band or a control never scrolls away from the rows under it. */
function PinnedCell({ width, children }: { width: number; children: ReactNode }) {
  return (
    <th scope="rowgroup" colSpan={width} className="p-0 text-left text-small font-semibold">
      <div className="sticky left-0 w-fit max-w-[calc(100vw-2rem)] bg-surface-subtle px-3 py-1.5">
        {children}
      </div>
    </th>
  );
}

const HEAD = "bg-surface-subtle px-3 py-2 text-caption text-text-secondary";
// The header rows stick over the body; the border-collapsed table's own rules would scroll away.
const HEAD_RULE = "shadow-[inset_0_-1px_0_var(--color-border-hairline)]";

/** A band of one column that carries the band's own name ("Quarter" under "Quarter"). */
const namedOnce = (items: GridColumn[], band: string) =>
  items.length === 1 && items[0]?.label === band;

function GridHead({ columns, traced }: { columns: GridColumn[]; traced: boolean }) {
  const bands = spans(columns, ({ band }) => band);
  const once = new Set(bands.flatMap(({ key, items }) => (namedOnce(items, key) ? items : [])));
  return (
    <thead className="sticky top-0 z-20 bg-surface-subtle">
      <tr>
        <th
          scope="col"
          rowSpan={2}
          className={cx(HEAD, HEAD_RULE, "sticky left-0 z-10 text-left whitespace-nowrap")}
        >
          Measure
        </th>
        {bands.map(({ key, items }, index) =>
          namedOnce(items, key) ? (
            <th
              key={index}
              scope="col"
              rowSpan={2}
              title={items[0]?.title}
              className={cx(HEAD, HEAD_RULE, "border-l border-border-hairline text-right")}
            >
              <span className="ml-auto block max-w-[9rem] text-balance text-text-primary">
                {key}
              </span>
            </th>
          ) : (
            <th
              key={index}
              scope="colgroup"
              colSpan={items.length}
              className={cx(
                HEAD,
                HEAD_RULE,
                "border-l border-border-hairline text-left text-text-primary whitespace-normal",
              )}
            >
              <span className="block max-w-[9rem] text-balance">{key}</span>
            </th>
          ),
        )}
        {traced && (
          <th
            scope="col"
            rowSpan={2}
            className={cx(HEAD, HEAD_RULE, "text-right whitespace-nowrap")}
          >
            Trace
          </th>
        )}
      </tr>
      <tr>
        {columns.map((column, index) =>
          once.has(column) ? null : (
            <th
              key={index}
              scope="col"
              title={column.title}
              className={cx(
                HEAD,
                HEAD_RULE,
                "text-right font-mono whitespace-nowrap text-text-primary",
              )}
            >
              {column.label}
            </th>
          ),
        )}
      </tr>
    </thead>
  );
}

type DrawnRow = GridRow & { runs: CellRun[] };

function MeasureRow({ row, source }: { row: DrawnRow; source?: (row: string) => ReactNode }) {
  return (
    <tr className={cx(TRACE_HOST, "border-b border-border-hairline", row.total && "font-semibold")}>
      <th
        scope="row"
        className="sticky left-0 z-10 min-w-40 max-w-64 bg-surface-card px-3 py-1.5 text-left text-small font-medium wrap-anywhere"
      >
        {row.label}
      </th>
      {row.runs.map((run, index) => {
        const trend = index === row.runs.length - 1 ? row.trend : undefined;
        return run.gap ? (
          <GapCell key={run.start} run={{ ...run, gap: run.gap }} trend={trend} />
        ) : (
          <ValueCell key={run.start} cell={run.cell} trend={trend} />
        );
      })}
      {source && (
        <td className="px-2 py-1">
          <div className="flex min-h-8 items-center justify-end max-[480px]:min-h-11">
            {source(row.label)}
          </div>
        </td>
      )}
    </tr>
  );
}

function GridBody({
  rows,
  width,
  source,
}: {
  rows: DrawnRow[];
  width: number;
  source?: (row: string) => ReactNode;
}) {
  return spans(rows, ({ band }) => band).map(({ key, items }, group) => (
    <tbody key={group}>
      <tr className="border-b border-border-hairline bg-surface-subtle">
        <PinnedCell width={width}>
          {key && `${key} `}
          <span className="font-normal text-text-secondary">{familyText(items)}</span>
        </PinnedCell>
      </tr>
      {items.map((row, index) => (
        <MeasureRow key={index} row={row} source={source} />
      ))}
    </tbody>
  ));
}

/** The measures with no figure in any shown column, drawn as one row that discloses them, each
 * then drawn as before: its gap cells with their recorded reasons, and its trace. */
function BlankRows({
  rows,
  width,
  source,
}: {
  rows: DrawnRow[];
  width: number;
  source?: (row: string) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  return (
    <tbody>
      <tr className="border-b border-border-hairline bg-surface-subtle">
        <PinnedCell width={width}>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
            }}
            className="-mx-2 flex min-h-8 cursor-pointer items-center gap-2 rounded-ds-sm px-2 text-left text-small font-semibold outline-focus-ring hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11"
          >
            <ChevronDown
              aria-hidden="true"
              className={cx("size-4 flex-none text-text-secondary", open && "rotate-180")}
            />
            {`${String(rows.length)} measures with no figure in any column shown`}
          </button>
        </PinnedCell>
      </tr>
      {open && rows.map((row, index) => <MeasureRow key={index} row={row} source={source} />)}
    </tbody>
  );
}

function GapKey({
  words,
  notes,
}: {
  words: [string, boolean][];
  notes?: Readonly<Record<string, string>>;
}) {
  if (!words.length) return null;
  return (
    <ul aria-label="Gap key" className="grid gap-1">
      {words.map(([display, reasoned]) => (
        <li key={display}>
          <Key tone="gap">
            <span>
              <span className="font-medium text-gap-text">{display}</span>:{" "}
              {notes?.[display] ?? (reasoned ? WITH_REASON : NO_FIGURE)}
            </span>
          </Key>
        </li>
      ))}
    </ul>
  );
}

/** The rows a statement opens on, and what they are, in words. */
export interface KeyRows {
  matches: (row: GridRow) => boolean;
  /** "Totals and the leverage, cover and liquidity rows read above". */
  description: string;
}

/** A statement of at least this many rows opens on its key rows. */
const KEY_VIEW_FROM = 13;
/** At least this many rows with no figure in any shown column collapse into one row. */
const BLANK_FROM = 2;

const blank = ({ runs }: DrawnRow) => runs.length > 0 && runs.every(({ gap }) => gap);

/** The rows the table draws in place, the blank rows it collapses (none where every row is blank),
 * and the key rows a long statement opens on (none where it is short or every row is key). */
function rowSets(rows: DrawnRow[], keyRows: KeyRows | undefined) {
  const blanks = rows.filter(blank);
  // Where no row has a figure (a case the run did not compute), the gaps are the statement.
  const collapsed = blanks.length >= BLANK_FROM && blanks.length < rows.length ? blanks : [];
  const drawn = rows.filter((row) => !collapsed.includes(row));
  const key = keyRows ? drawn.filter(keyRows.matches) : [];
  const keyed = drawn.length >= KEY_VIEW_FROM && key.length > 0 && key.length < drawn.length;
  return { collapsed, drawn, key: keyed ? key : undefined };
}

function RowSwitch({
  all,
  setAll,
  shown,
  total,
  description,
}: {
  all: boolean;
  setAll: (all: boolean) => void;
  shown: number;
  total: number;
  description: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Segmented
        label="Grid rows"
        segments={[
          { key: "key", label: "Key rows" },
          { key: "all", label: "All rows" },
        ]}
        current={all ? "all" : "key"}
        onSelect={(key) => {
          setAll(key === "all");
        }}
      />
      <p className="text-caption text-text-secondary">
        {all
          ? `All ${String(total)} rows.`
          : `${description}: ${String(shown)} of ${String(total)} rows.`}
      </p>
    </div>
  );
}

/** The forecast grid: measures by column, given cells in mono, every other cell the gap cell in
 * place with its reason as its title and accessible name, one trace per row at the row's end, and
 * one gap key under the table. It scrolls both ways in its own region, its header rows and measure
 * column pinned; measures with no figure in any shown column collapse into one disclosed row, and
 * a long statement opens on its key rows, every row one press away. */
export function ForecastGrid({
  name,
  columns,
  rows: inputRows,
  gapNotes,
  keyRows,
  source,
}: {
  name: string;
  columns: GridColumn[];
  rows: GridRow[];
  /** What a gap word means where the grid itself made it ("Not published"). */
  gapNotes?: Readonly<Record<string, string>>;
  /** The rows a long statement opens on. */
  keyRows?: KeyRows;
  source?: (row: string) => ReactNode;
}) {
  const [all, setAll] = useState(false);
  const rows = inputRows.map((row) => ({ ...row, runs: cellRuns(row.cells, columns) }));
  const { collapsed, drawn, key } = rowSets(rows, keyRows);
  const shown = key && !all ? key : drawn;
  const width = columns.length + (source ? 2 : 1);
  return (
    <div className="grid min-w-0 gap-3">
      {key && keyRows && (
        <RowSwitch
          all={all}
          setAll={setAll}
          shown={key.length}
          total={drawn.length + collapsed.length}
          description={keyRows.description}
        />
      )}
      <div
        role="region"
        aria-label={`${name} table`}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the keyboard scrolls it both ways
        tabIndex={0}
        className="relative max-h-[50vh] min-w-0 overflow-auto rounded-ds-md border border-border-hairline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <table className="w-full border-collapse text-small">
          <caption className="sr-only">{name}</caption>
          <GridHead columns={columns} traced={Boolean(source)} />
          <GridBody rows={shown} width={width} source={source} />
          <BlankRows rows={collapsed} width={width} source={source} />
        </table>
      </div>
      <GapKey words={gapWords([...shown, ...collapsed])} notes={gapNotes} />
    </div>
  );
}

/** A qualification the model records for the grid, drawn once under it with its trace. */
export function GridQualifications({
  items,
}: {
  items: { label: string; text: string; trace: ReactNode }[];
}) {
  if (!items.length) return null;
  return (
    <ul aria-label="Qualifications" className="grid gap-2">
      {items.map(({ label, text, trace }, index) => (
        <li
          key={index}
          className={cx(
            TRACE_HOST,
            "flex max-w-prose items-start gap-2 text-small text-text-secondary",
          )}
        >
          <div>
            <p className="font-semibold">{label}</p>
            <p>
              {containsReference(text)
                ? "Recorded qualification: review the model evidence."
                : readerText(text)}
            </p>
          </div>
          {trace}
        </li>
      ))}
    </ul>
  );
}
