import { ChevronDown } from "@untitledui/icons";
import { memo, useState } from "react";
import { Missing } from "@/components/gap/Missing";
import {
  blocked,
  containsReference,
  evidencePath,
  type OutputEntry,
  readerText,
} from "../publishedReport";
import type { buildReportView } from "../reportView";
import { chartTable, publishedTables, word } from "../visuals/visualData";
import { ChartQualifications } from "../visuals/ChartQualifications";
import { PublishedSource } from "./PublishedTrace";

const CHART_PREFIX = "Chart data: ";

// A page citation: "p.12", "p 12", "(p12)", "pp. 12-14", "pg. 12", "page 12", "pages 12 to 14",
// also after a year ("2025 page 83"). Not a page: a "pp" after a number is percentage points
// ("fell 2 pp. 3", "two pp. 3"); a "p" inside a word or after "&", "." or "-" ("app. 3", "S&P. 3",
// "p.p. 3", "one-page"); a four-digit number is a year ("front page 2025").
const PAGE_CITATION =
  /(?<![\w&.-])(?:p|pg|(?<!(?:\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten))\s*)pp|pages?)\.?\s*\d{1,3}(?!\d)/i;

const citesSource = (text: string) => PAGE_CITATION.test(text) || containsReference(text);

/**
 * A gap as the page draws it. A reason that cites a page or holds another source reference is held
 * back as "See Evidence." (L16): the gap panel still states the figure is missing, and the figure's
 * trace control reaches the reason unchanged. Any other reason is drawn whole, with a module code
 * named as the module.
 */
function drawnGap<T extends Record<string, unknown>>(figure: T): T {
  const { gap } = figure;
  if (typeof gap !== "string") return figure;
  return { ...figure, gap: citesSource(gap) ? "See Evidence." : readerText(gap) };
}

type Figure = Record<string, unknown> & { table: number };

function returnedCharts(entry: OutputEntry, coveredLines: Set<number>): Figure[] {
  const problems = new Set(entry.output.issue?.split("; "));
  return entry.sections.flatMap(({ heading, blocks }) => {
    if (!heading.startsWith(CHART_PREFIX) || !problems.has(`${heading} is not in its fixed table`))
      return [];
    const block = blocks.find(({ type }) => type === "table");
    if (!block || coveredLines.has(block.line)) return [];
    const name = heading.slice(CHART_PREFIX.length);
    return [
      {
        title: name.charAt(0).toUpperCase() + name.slice(1),
        table: block.line,
        gap: "The chart data did not fit the required table form, so no chart is drawn.",
      },
    ];
  });
}

function chartOutput(entry: OutputEntry): {
  id: string;
  sha256: string;
  charts: Figure[];
  chartGaps: Figure[];
} {
  const { chartGaps = [], parseError, state, summary } = entry.output;
  const charts = [
    ...(entry.output.charts ?? []).map((figure) => ({ ...figure, category: "chart" })),
    ...(entry.output.events ?? []).map((figure) => ({
      ...figure,
      title: figure.title ?? figure.lane,
      category: "event",
    })),
    ...(entry.output.maps ?? []).map((figure) => ({
      ...figure,
      title: figure.title ?? figure.name,
      category: "map",
    })),
  ];
  const withheld = parseError || state?.established === false || blocked(entry);
  const coveredLines = new Set([...charts, ...chartGaps].map(({ table }) => table));
  return {
    id: entry.output.id,
    sha256: entry.output.sha256,
    charts: withheld ? [] : charts,
    chartGaps: [
      ...chartGaps,
      ...returnedCharts(entry, coveredLines),
      ...(withheld
        ? charts.map((chart) =>
            // A held-back limitation is reached through the figure's trace control, so that control
            // opens the limitation's own line rather than the chart's data table.
            summary?.limitation
              ? {
                  ...chart,
                  gap: summary.limitation,
                  ...(citesSource(summary.limitation) && { table: summary.line }),
                }
              : { ...chart, gap: "Module not assessable." },
          )
        : []),
    ].map(drawnGap),
  };
}

const FOCUS =
  "outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11";
const NUMBER = /^[-+\u2212(]?[\d.,]+\)?(?:\s?[%x])?$/;
const GAP_CELL = /^Not supplied\b/i;

type Cell = string | null | { withheld: true } | { gap: true };

function TableCell({ cell, row }: { cell: Cell; row?: boolean }) {
  if (cell === null) return <Missing />;
  if (typeof cell !== "string") return <>{"gap" in cell ? "Not supplied" : "Withheld"}</>;
  if (GAP_CELL.test(cell))
    return (
      <span className="gap-hatch inline-block rounded-ds-sm border border-dashed border-border-gap px-2 py-0.5 text-small text-gap-text">
        {cell}
      </span>
    );
  return row || !NUMBER.test(cell.trim()) ? (
    <>{cell}</>
  ) : (
    <span className="font-mono tabular-nums">{cell}</span>
  );
}

/** Room above and below a trace control, so it is the only target in reach. */
const TARGET_ROOM = "flex min-h-8 items-center max-[480px]:min-h-11";

function ChartTableView({ title, table }: { title: string; table: ReturnType<typeof chartTable> }) {
  const traced = table.rows.some(({ end }) => end !== undefined);
  return (
    <div
      role="region"
      aria-label={`${title} table`}
      // A scrollable region must be reachable by keyboard.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className={`relative min-w-0 overflow-x-auto rounded-ds-sm ${FOCUS}`}
    >
      <table className="w-full border-collapse text-small">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            {table.head.map((text, at) => (
              <th
                key={`${text}-${String(at)}`}
                scope="col"
                className="border-b border-border-hairline px-3 py-2 text-left font-medium text-text-secondary"
              >
                {text}
              </th>
            ))}
            {traced && (
              <th
                scope="col"
                className="border-b border-border-hairline px-3 py-2 text-left font-medium text-text-secondary"
              >
                {table.endHeading}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, at) => (
            <tr key={`${row.label}-${String(at)}`} className="border-b border-border-hairline">
              <th scope="row" className="px-3 py-2 text-left font-medium text-text-primary">
                <TableCell cell={row.label} row />
              </th>
              {row.cells.map((cell, column) => (
                <td key={column} className="px-3 py-2 align-top text-text-primary">
                  <TableCell cell={cell} />
                </td>
              ))}
              {traced && (
                <td className="px-3 py-1 align-top">
                  <div className={TARGET_ROOM}>{row.end}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartRow({
  descriptor,
  entry,
  folder,
  tables,
}: {
  descriptor: Figure;
  entry: OutputEntry;
  folder: string;
  tables: ReturnType<typeof publishedTables>;
}) {
  const title = word(descriptor.title);
  const gap = word(descriptor.gap);
  const unit = descriptor.unit === "x" ? "x (times)" : word(descriptor.unit);
  const source = tables.get(descriptor.table);
  const [open, setOpen] = useState(false);
  if (!title || (!gap && !source)) return null;
  return (
    <li className="grid min-w-0 gap-2 border-t border-border-hairline py-1">
      <div className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-3 gap-y-0 max-[480px]:min-h-11">
        <span className="min-w-0 text-small font-medium text-text-primary first-letter:uppercase">
          {title}
        </span>
        {unit && <span className="text-small text-text-secondary">{unit}</span>}
        <span className={TARGET_ROOM}>
          <PublishedSource href={evidencePath(folder, entry, descriptor.table)} name={title}>
            Source table
          </PublishedSource>
        </span>
        {!gap && source && (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`Table for ${title}`}
            onClick={() => {
              setOpen(!open);
            }}
            className={`ml-auto flex min-h-8 cursor-pointer items-center gap-1 rounded-ds-sm text-small text-text-link max-[480px]:min-w-11 ${FOCUS}`}
          >
            {/* The control says which way it goes: a closed row offers the table, an open one hides it. */}
            {open ? "Hide table" : "Table"}
            <ChevronDown
              aria-hidden="true"
              className={`size-4 transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
      {gap ? (
        <div className="gap-hatch flex min-w-0 flex-wrap gap-x-2 gap-y-0 rounded-ds-sm border border-dashed border-border-gap px-3 py-2 text-small text-gap-text">
          <p className="font-semibold">Not established for this run</p>
          <p role="note" className="min-w-0 first-letter:uppercase">
            {gap}
          </p>
        </div>
      ) : (
        // Drawn when asked for: the page does not carry every module's table unopened.
        source &&
        open && (
          <div className="grid min-w-0 gap-2 pb-2">
            <ChartTableView
              title={title}
              table={chartTable({
                ...source,
                evidenceInDrawer: true,
                rowSource: (at, label) => (
                  <PublishedSource
                    href={evidencePath(folder, entry, at)}
                    name={label}
                    linkLabel={`Show sources for ${label}`}
                  >
                    Source row
                  </PublishedSource>
                ),
              })}
            />
            <ChartQualifications
              category={descriptor.category === "chart" ? "chart" : "other"}
              sections={entry.sections}
              line={descriptor.table}
              evidenceHref={(at) => evidencePath(folder, entry, at)}
            />
          </div>
        )
      )}
    </li>
  );
}

export const RunCharts = memo(function RunCharts({
  view,
  folder,
}: {
  view: ReturnType<typeof buildReportView>;
  folder: string;
}) {
  const groups = view.modules.flatMap(({ id, name, outputs }) => {
    const entry =
      outputs.find(({ selected }) => selected) ?? (outputs.length === 1 ? outputs[0] : undefined);
    if (!entry) return [];
    const output = chartOutput(entry);
    if (!output.charts.length && !output.chartGaps.length) return [];
    return [{ id, name, entry, output, tables: publishedTables(entry.sections) }];
  });
  return (
    <section aria-label="Chart tables from this run" className="grid min-w-0 gap-4">
      <h3 className="text-h4 font-medium text-balance text-text-primary">
        Chart tables from this run
      </h3>
      {groups.length ? (
        // Two columns, each module's group kept whole: an opened table has half the tile, not a
        // third of it.
        <div className="min-w-0 gap-x-10 lg:columns-2">
          {groups.map(({ id, name, entry, output, tables }) => {
            const rows = [...output.charts, ...output.chartGaps].sort((a, b) => a.table - b.table);
            return (
              <div key={id} className="mb-4 grid min-w-0 break-inside-avoid gap-1">
                <h4 className="text-small font-semibold text-text-secondary">
                  <a
                    href={`#modules/${encodeURIComponent(id)}`}
                    className={`inline-flex min-h-8 items-center text-text-link underline-offset-2 hover:underline ${FOCUS}`}
                  >
                    {name}
                  </a>
                </h4>
                <ul className="grid min-w-0">
                  {rows.map((descriptor) => (
                    <ChartRow
                      key={`${word(descriptor.title)}-${String(descriptor.table)}`}
                      descriptor={descriptor}
                      entry={entry}
                      folder={folder}
                      tables={tables}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-small text-text-secondary">No charts were published for this run.</p>
      )}
    </section>
  );
});
