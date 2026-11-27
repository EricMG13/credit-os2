import { ArrowRight, ChevronDown, ChevronUp } from "@untitledui/icons";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { BarCell } from "@/components/kit/BarCell";
import { Segmented } from "@/components/kit/Segmented";
import { TraceControl, TRACE_HOST } from "@/pages/library/parts/TraceControl";
import {
  containsReference,
  displayColumns,
  evidencePath,
  readerText,
  type OutputEntry,
  type PublishedRun,
  type Table,
} from "../publishedReport";
import { unitCells, unitLabel } from "../moneyUnits";
import { FindingParagraph, isOneLine, PublishedTable } from "../ReportContent";
import { plainText, richParts } from "../richText";
import { traceKey } from "../reportView";
import { Legend, type LegendEntry } from "./leads/kit/marks";
import { GapNote, Tile } from "./overview/Tile";
import {
  amountColumns,
  compactColumns,
  moduleRecords,
  numericColumns,
  RECORD_KINDS,
  scaleNote,
  statedGap,
  unitColumn,
  type AmountColumn,
  type HeldRecord,
  type RecordTable,
} from "./moduleRecordsModel";

type Run = Pick<PublishedRun, "folder">;

const TOGGLE =
  "flex min-h-8 flex-none cursor-pointer items-center gap-1.5 rounded-ds-sm border border-border-control px-3 text-small font-medium text-text-secondary outline-focus-ring transition duration-100 ease-linear hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11";

/** A link's own hit area: 32 px, 44 px on a phone. */
const TARGET = "min-h-8 max-[480px]:min-h-11";

const plural = (count: number, word: string) => `${String(count)} ${word}${count === 1 ? "" : "s"}`;

function countLine(tables: number, held: number) {
  const parts = tables ? [plural(tables, "table")] : [];
  if (held) parts.push(`${String(held)} held in Evidence`);
  return parts.join(" · ");
}

/** A figure over its bar on the column's one scale; a gap, a total or an aggregate row has no
 * share and keeps its words. */
function amountsOf(bars: Map<number, AmountColumn>) {
  return {
    columns: new Set(bars.keys()),
    draw: (column: number, cell: string, line: number) => {
      const bar = bars.get(column);
      const share = bar?.share(cell, line) ?? null;
      if (!bar) return undefined;
      // A figure kept off the scale (a total, an aggregate, a control row) is drawn in the
      // column's figure slot with no bar; a stated gap keeps its words.
      if (share === null)
        return /^[(+-]?\d[\d,]*(?:\.\d+)?\)?$/.test(cell.trim()) ? (
          <span className="block w-20 text-right font-mono text-small text-text-primary tabular-nums">
            {cell}
          </span>
        ) : undefined;
      return (
        <BarCell text={cell} share={share} tone={bar.negative(cell) ? "secondary" : "amount"} />
      );
    },
  };
}

/** Which tones the drawn bars use, decided by the cells' own test: a share above zero (a fill), then negative or not. */
function drawnTones(table: Table, bars: Map<number, AmountColumn>) {
  const tones = { amount: false, negative: false };
  for (const { cells, line } of table.rows)
    for (const [column, bar] of bars) {
      const cell = cells[column] ?? "";
      const share = bar.share(cell, line);
      // BarCell draws a fill only for a share above zero; zero is a grey tick, NaN none.
      if (share === null || !(share > 0)) continue;
      if (bar.negative(cell)) tones.negative = true;
      else tones.amount = true;
    }
  return tones;
}

/** The bars' colours in words, each only where a bar of that colour is drawn. */
function barLegend({ amount, negative }: { amount: boolean; negative: boolean }): LegendEntry[] {
  return [
    ...(amount
      ? [
          { kind: "bar" as const, tone: "amount-1" as const, text: "Smaller amount" },
          { kind: "bar" as const, tone: "amount-5" as const, text: "Larger amount" },
        ]
      : []),
    ...(negative
      ? [{ kind: "bar" as const, tone: "secondary" as const, text: "Negative amount" }]
      : []),
  ];
}

/** A stated gap of the compact view: its leading words, the full text for every reader. */
function gapChip(_column: number, cell: string) {
  const words = statedGap(cell);
  if (words === null) return undefined;
  const text = readerText(cell);
  return (
    <span
      title={text}
      className="inline-flex items-center rounded-ds-xs border border-dashed border-border-gap px-1.5 text-caption whitespace-nowrap text-gap-text"
    >
      <span aria-hidden="true">{words}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** The note under a barred table: one scale per column, and the rows it leaves out by name. */
/** Columns that hold a source reference in every row that is not blank: each row would draw
 * only "In Evidence", so the column is left out and stated once under the table. */
function referenceColumns(table: Table, columns: readonly number[]) {
  return columns.filter((column) => {
    const cells = table.rows.map(({ cells: row }) => row[column] ?? "").filter((c) => c.trim());
    return cells.length > 0 && cells.every(containsReference);
  });
}

/** How the chosen table is drawn: its columns (compact when wide), numerals, bars and one unit. */
function tableForm(record: RecordTable, all: boolean) {
  const { table } = record;
  const displayed = displayColumns(table.headers, false, table.rows);
  const found = unitColumn(table);
  const unit = found && displayed.length > 1 && displayed.includes(found.column) ? found : null;
  const kept = unit ? displayed.filter((column) => column !== unit.column) : displayed;
  const referenced = referenceColumns(table, kept.slice(1));
  const shown = kept.filter((column) => !referenced.includes(column));
  const compact = compactColumns(table, shown);
  const columns = all || !compact ? shown : compact;
  const bars = amountColumns(table, record.title);
  const drawnBars = new Map([...bars].filter(([column]) => columns.includes(column)));
  const numeric = new Set([...numericColumns(table)].filter((column) => !bars.has(column)));
  return { displayed, unit, referenced, compact, columns, drawnBars, numeric };
}

const NARROW = "(max-width: 639px)";

/** Whether the screen is below `sm`; the desktop view where the browser cannot say. */
function useNarrow(): boolean {
  const query = (): MediaQueryList | undefined =>
    typeof window.matchMedia === "function" ? window.matchMedia(NARROW) : undefined;
  const [narrow, setNarrow] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const list = query();
    if (!list) return;
    const sync = () => {
      setNarrow(list.matches);
    };
    list.addEventListener("change", sync);
    return () => {
      list.removeEventListener("change", sync);
    };
  }, []);
  return narrow;
}

/** A card's value: a reference as an Evidence link, a stated gap as its chip, else as written. */
function cardValue(cell: string, column: number, href: string): ReactNode {
  if (!cell.trim()) return <span aria-label="Left blank">—</span>;
  if (containsReference(cell))
    return (
      <Button href={href} color="link-gray" size="sm">
        In Evidence
      </Button>
    );
  const chip = gapChip(column, cell);
  if (chip) return chip;
  const figure = /^[(+\-−]?\d[\d,]*(?:\.\d+)?\)?(?:%|x|bps)?$/.test(cell.trim());
  return isOneLine(cell) ? (
    <span
      className={`whitespace-nowrap${figure ? " font-mono text-text-primary tabular-nums" : ""}`}
    >
      {cell}
    </span>
  ) : (
    richParts(cell, readerText)
  );
}

/** A wide register below `sm`: one card per row, its label, its compact columns and its trace. */
function RecordCards({
  run,
  entry,
  record,
  columns,
}: {
  run: Run;
  entry: OutputEntry;
  record: RecordTable;
  columns: readonly number[];
}) {
  const { table } = record;
  const [first = 0, ...rest] = columns;
  return (
    <ul aria-label={record.title} className="grid gap-2">
      {table.rows.map((row) => {
        const name = row.cells[first] ?? "";
        const href = evidencePath(run.folder, entry, row.line);
        return (
          <li
            key={row.line}
            className={`${TRACE_HOST} flex flex-col gap-2 rounded-ds-md border border-border-hairline p-3`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-small font-semibold text-text-primary">
                {cardValue(name, first, href)}
              </p>
              <TraceControl
                trace={traceKey(entry, row.line)}
                label={`Show sources for ${readerText(name || "this row")}`}
              />
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-small">
              {rest.map((column) => (
                <div key={column} className="contents">
                  <dt className="text-text-tertiary">
                    {plainText(readerText(table.headers[column] ?? ""))}
                  </dt>
                  <dd className="min-w-0 text-text-secondary">
                    {cardValue(row.cells[column] ?? "", column, href)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

function RecordGap({ run, entry, record }: { run: Run; entry: OutputEntry; record: RecordTable }) {
  return (
    <GapNote>
      {record.table.rows.length
        ? "This table has no columns drawn on this page."
        : "This table has no rows."}{" "}
      <Button href={evidencePath(run.folder, entry, record.table.line)} color="link-gray" size="sm">
        Open it in Evidence
      </Button>
    </GapNote>
  );
}

function RecordDrawing({
  run,
  entry,
  record,
}: {
  run: Run;
  entry: OutputEntry;
  record: RecordTable;
}) {
  const [all, setAll] = useState(false);
  const narrow = useNarrow();
  const form = tableForm(record, all);
  if (!record.table.rows.length || !form.displayed.length)
    return <RecordGap run={run} entry={entry} record={record} />;
  const { unit, compact, referenced } = form;
  const cards = narrow && compact !== null && !all;
  const drawUnits = unitCells(record.table);
  const drawnBars = cards ? new Map<number, AmountColumn>() : form.drawnBars;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {(unit ?? compact) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {unit && (
            <p className="text-caption text-text-tertiary">
              <span>{`${unit.header}: `}</span>
              <span>{unitLabel(unit.value)}</span>
            </p>
          )}
          {compact && (
            <button
              type="button"
              aria-pressed={all}
              className={TOGGLE}
              onClick={() => {
                setAll(!all);
              }}
            >
              All columns
            </button>
          )}
        </div>
      )}
      {cards ? (
        <RecordCards run={run} entry={entry} record={record} columns={form.columns} />
      ) : (
        <PublishedTable
          table={record.table}
          heading={record.title}
          traceAt={(line) => traceKey(entry, line)}
          rowHref={(line) => evidencePath(run.folder, entry, line)}
          amounts={drawnBars.size ? amountsOf(drawnBars) : undefined}
          columns={form.columns}
          numeric={form.numeric}
          region
          wideBars
          records
          emptyLabel="Left blank"
          drawCell={(column, cell) =>
            drawUnits(column, cell) ?? (compact && !all ? gapChip(column, cell) : undefined)
          }
        />
      )}
      {drawnBars.size > 0 && (
        <>
          <Legend items={barLegend(drawnTones(record.table, drawnBars))} />
          <p className="text-caption text-text-tertiary">{scaleNote(record.table, record.title)}</p>
        </>
      )}
      {referenced.map((column) => (
        <p key={column} className="text-caption text-text-tertiary">
          {`${plainText(readerText(record.table.headers[column] ?? ""))}: in Evidence, by row.`}
        </p>
      ))}
    </div>
  );
}

function ChosenRecord({
  run,
  entry,
  record,
}: {
  run: Run;
  entry: OutputEntry;
  record: RecordTable;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h4 className="text-body font-semibold text-text-primary">{record.title}</h4>
      {record.notes.map((note) => (
        <FindingParagraph
          key={note.line}
          block={note}
          trace={traceKey(entry, note.line)}
          href={evidencePath(run.folder, entry, note.line)}
        />
      ))}
      <RecordDrawing run={run} entry={entry} record={record} />
    </div>
  );
}

const tableKey = (record: RecordTable) => String(record.table.line);

function kindSegments(tables: RecordTable[]) {
  return RECORD_KINDS.flatMap(([kind, label]) => {
    const count = tables.filter((record) => record.kind === kind).length;
    if (!count) return [];
    return [
      {
        key: kind,
        label: (
          <>
            {label} <span className="font-mono tabular-nums">{String(count)}</span>
          </>
        ),
      },
    ];
  });
}

/** A row of tabs that never wraps: it scrolls sideways inside a named region the keyboard can
 * focus. */
function ScrollRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      // A region that scrolls sideways is focusable so the keyboard can scroll it.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="max-w-full min-w-0 overflow-x-auto rounded-ds-md outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
    </div>
  );
}

const ROW = "max-w-none flex-nowrap";

/** The tables of one kind as one row of tabs, however many there are. */
function TableChooser({
  own,
  current,
  onSelect,
}: {
  own: RecordTable[];
  current: string;
  onSelect: (key: string) => void;
}) {
  return (
    <ScrollRow label="Tables">
      <Segmented
        label="Table"
        className={ROW}
        segments={own.map((item) => ({ key: tableKey(item), label: item.title }))}
        current={current}
        onSelect={onSelect}
      />
    </ScrollRow>
  );
}

/** The kind tabs, the table tabs when the kind holds more than one, and the chosen table. */
function RecordTabs({
  run,
  entry,
  tables,
  initialTable,
}: {
  run: Run;
  entry: OutputEntry;
  tables: RecordTable[];
  /** A table title the address names; the records open on it when it is held here. */
  initialTable?: string;
}) {
  const kinds = kindSegments(tables);
  const named = initialTable
    ? tables.find(({ title }) => title.toLowerCase() === initialTable.toLowerCase())
    : undefined;
  const [choice, setChoice] = useState<{ kind: string; table: string | null }>({
    kind: named?.kind ?? kinds[0]?.key ?? "",
    table: named ? tableKey(named) : null,
  });
  const kind = kinds.find(({ key }) => key === choice.kind)?.key ?? kinds[0]?.key;
  const own = tables.filter((record) => record.kind === kind);
  const record = own.find((item) => tableKey(item) === choice.table) ?? own[0];
  if (!kind || !record) return null;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ScrollRow label="Record kinds">
        <Segmented
          label="Record kind"
          className={ROW}
          segments={kinds}
          current={kind}
          onSelect={(key) => {
            setChoice({ kind: key, table: null });
          }}
        />
      </ScrollRow>
      {own.length > 1 && (
        <TableChooser
          own={own}
          current={tableKey(record)}
          onSelect={(key) => {
            setChoice({ kind, table: key });
          }}
        />
      )}
      <ChosenRecord key={tableKey(record)} run={run} entry={entry} record={record} />
    </div>
  );
}

function HeldInEvidence({
  run,
  entry,
  held,
}: {
  run: Run;
  entry: OutputEntry;
  held: HeldRecord[];
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-border-hairline pt-4">
      <h4 id={id} className="text-small font-semibold text-text-primary">
        Held in Evidence
      </h4>
      <ul aria-labelledby={id} className="grid gap-1">
        {held.map((item) => (
          <li key={item.line} className="flex items-center">
            <Button
              href={evidencePath(run.folder, entry, item.line)}
              color="link-gray"
              size="sm"
              className={TARGET}
            >
              {item.title}
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center">
        <Button
          href={evidencePath(run.folder, entry)}
          color="link-gray"
          size="sm"
          iconTrailing={ArrowRight}
          className={TARGET}
        >
          Open this module in Evidence
        </Button>
      </div>
    </div>
  );
}

const TITLE = "Statements and records";

/**
 * The module's statements, registers, calculations and chart tables, in one tile closed by
 * default; the registers the page does not draw are listed by name with their place in Evidence.
 * `anchorId` names the title so the page navigator can scroll to it and focus it.
 */
export function ModuleRecords({
  run,
  entry,
  anchorId,
  initiallyOpen = false,
  initialTable,
}: {
  run: Run;
  entry: OutputEntry;
  anchorId?: string;
  /** Open on first draw, as an address that names the records asks. */
  initiallyOpen?: boolean;
  /** The table the address names, shown first. */
  initialTable?: string;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const body = useId();
  const { tables, evidence } = moduleRecords(entry);
  if (!tables.length && !evidence.length) return null;
  const Chevron = open ? ChevronUp : ChevronDown;
  const toggle = (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={open ? body : undefined}
      className={TOGGLE}
      onClick={() => {
        setOpen(!open);
      }}
    >
      {open ? "Hide records" : "Show records"}
      <Chevron aria-hidden="true" className="size-4" />
    </button>
  );
  const title = anchorId ? (
    <span
      id={anchorId}
      tabIndex={-1}
      className="scroll-mt-4 rounded-ds-xs outline-focus-ring focus-visible:outline-2"
    >
      {TITLE}
    </span>
  ) : (
    TITLE
  );
  return (
    <Tile span={12} label={TITLE} title={title} trace={toggle}>
      <p className="-mt-3 text-caption text-text-tertiary">
        {countLine(tables.length, evidence.length)}
      </p>
      {open && (
        <div id={body} className="flex min-w-0 flex-col gap-4">
          {tables.length > 0 && (
            <RecordTabs run={run} entry={entry} tables={tables} initialTable={initialTable} />
          )}
          {evidence.length > 0 && <HeldInEvidence run={run} entry={entry} held={evidence} />}
        </div>
      )}
    </Tile>
  );
}
