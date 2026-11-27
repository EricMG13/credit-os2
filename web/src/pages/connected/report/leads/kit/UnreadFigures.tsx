import { displayColumns, unitLabel, type OutputEntry, type Table } from "../../../publishedReport";
import { statedInProse } from "../read";
import type { LeadProps } from "../types";
import { FigureTile, GapTile } from "./LeadFrame";
import { GapChip } from "./marks/GapSlot";
import { readCell } from "./numbers";
import { IN_EVIDENCE, namesSource, reasonText, safeText } from "./reader";

const PREFIX = "Chart data: ";
/** Columns a stated-figures list does not draw: the unit is the kicker, the basis names sources. */
const NOT_DRAWN = new Set(["reporting unit", "unit", "basis and limitation"]);

/** A chart heading's title as the store publishes it: the heading after "Chart data: ", first letter raised. */
const titleOf = (heading: string) => {
  const name = heading.slice(PREFIX.length).trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/** The title of every `Chart data: X` section of the entry, once each, in the handoff's order. */
export function chartTitles(entry: OutputEntry): string[] {
  const headings = entry.sections.flatMap(({ heading }) =>
    heading.startsWith(PREFIX) ? [titleOf(heading)] : [],
  );
  return [...new Set(headings)];
}

type Cell = { header: string; text: string; gap: string | null };
type Listed = { label: string; cells: Cell[]; line: number };

// A contaminated unit is recoverable only when the whole remaining label names a known unit.
const CURRENCY_NAMES = new Intl.DisplayNames("en", { type: "currency", fallback: "none" });
const KNOWN_UNIT =
  /^(?:(?:([A-Z]{3})|US\$|[$€£¥])(?:\s?(?:thousands?|millions?|billions?|trillions?|bps|bn|mm|mn|[kmb])|\s+(?:0{3}s|cents?|per share)|\/share)?|%|x|bps?|basis points?|percentage points?|percent(?:age)?|per cent|times)$/;
// Bare 10K can mean ten thousand. Require a filing spelling or a separate locator.
const SOURCE_LABEL =
  /\b(?:SEC filing|Source \d+|Form\s+10-?[KQ]|10-[KQ]|annual report|prospectus)\b|(?:^|[;(]\s*)Sources?\s*:/i;
const SOURCE_CLAUSE_LABEL = /^Sources?\s*:/i;
const SOURCE_NAME =
  /^(?:the )?(?:SEC filing|Source \d+|(?:Form )?10-?[KQ]|(?:annual|quarterly|interim)(?: report)?|prospectus|\S+\.[a-z]{2,5})\.?$/i;
const SOURCE_PAGE = /(?:^|[\s,]+)\(?p(?:p|g|ages?)?\.?\s*\d+(?:[-–]\d+)?\.?\)?$/i;
const ATTRIBUTION = /^(.*)\s+(?:per|from|according to)\s+(.+)$/i;
const SOURCE_CLAUSE = /^(.*?)[;,]\s+(.+)$/;
const SOURCE_NOTE = /^(.*?)\s+\(((?:[^()]|\([^()]*\))*)\)$/;

function unitSource(text: string) {
  return SOURCE_LABEL.test(text) || namesSource(text);
}

function wholeUnitSource(text: string) {
  const visible = safeText(text);
  if (visible === "" || SOURCE_CLAUSE_LABEL.test(text)) return true;
  const name = text.replace(SOURCE_PAGE, "").trim();
  return unitSource(text) && (name === "" || SOURCE_NAME.test(name));
}

function visibleUnit(cell: string) {
  const written = cell.trim();
  const [, head, source] =
    ATTRIBUTION.exec(written) ?? SOURCE_NOTE.exec(written) ?? SOURCE_CLAUSE.exec(written) ?? [];
  if (head !== undefined && source && wholeUnitSource(source)) {
    const kept = safeText(head);
    const known = KNOWN_UNIT.exec(kept);
    if (!known) return "";
    const currency = known[1];
    return currency && !CURRENCY_NAMES.of(currency) && currency !== "RMB" ? "" : unitLabel(kept);
  }
  const text = safeText(written);
  return text !== IN_EVIDENCE && !unitSource(text) ? unitLabel(text) : "";
}

/** The table's rows as stated, with the first reader column as the row's label. */
function listed(table: Table) {
  const headers = table.headers.map((header) => header.trim().toLowerCase());
  const [labelAt, ...valuesAt] = displayColumns(table.headers, false, table.rows).filter(
    (at) => !NOT_DRAWN.has(headers[at] ?? ""),
  );
  if (labelAt === undefined || !table.rows.length) return null;
  const columns = valuesAt.map((at) => ({ header: (table.headers[at] ?? "").trim(), at }));
  const reportingUnitAt = headers.indexOf("reporting unit");
  const unitAt = reportingUnitAt >= 0 ? reportingUnitAt : headers.indexOf("unit");
  const units = unitAt >= 0 ? table.rows.map((row) => visibleUnit(row.cells[unitAt] ?? "")) : [];
  const distinct = new Set(units);
  const [unit] = units;
  const rows = table.rows.map((row): Listed => ({
    label: safeText(row.cells[labelAt] ?? ""),
    line: row.line,
    cells: columns.map(({ header, at }) => {
      const reading = readCell(row.cells[at] ?? "");
      return reading.kind === "gap"
        ? {
            header: safeText(header),
            text: safeText(reading.text),
            gap: reasonText(reading.reason),
          }
        : { header: safeText(header), text: safeText(row.cells[at] ?? ""), gap: null };
    }),
  }));
  return {
    labelHeader: safeText(table.headers[labelAt] ?? ""),
    columns: columns.map(({ header }) => safeText(header)),
    rows,
    unit: distinct.size === 1 && unit ? unit : null,
    units,
  };
}

function Unread({ lead, title, table }: { lead: LeadProps; title: string; table: Table | null }) {
  const read = table ? listed(table) : null;
  if (!table || !read)
    return (
      <GapTile span={6} label={title} kicker={title}>
        {`This page could not read ${title.charAt(0).toLowerCase()}${title.slice(1)}.`}
      </GapTile>
    );
  const perRow = read.unit === null && read.units.length > 0;
  return (
    <FigureTile
      props={lead}
      span={6}
      label={title}
      kicker={read.unit ? `${read.unit}, each figure as stated` : "Each figure as stated"}
      title={title}
      line={table.line}
      source={title.toLowerCase()}
      table={{
        caption: title,
        headers: [read.labelHeader, ...read.columns, ...(perRow ? ["Unit"] : [])],
        rows: read.rows.map((row, at) => [
          row.label,
          ...row.cells.map((cell) => cell.text),
          ...(perRow ? [read.units[at] ?? ""] : []),
        ]),
      }}
    >
      <ul className="flex min-w-0 flex-col divide-y divide-border-hairline text-small">
        {read.rows.map((row, at) => (
          <li
            key={`${String(at)}-${row.label}`}
            data-row={row.label}
            className="flex min-w-0 flex-col gap-1 py-2 first:pt-0 last:pb-0"
          >
            <p className="font-medium text-text-primary wrap-anywhere">
              {row.label}
              {perRow && read.units[at] ? (
                <span className="font-normal text-text-tertiary">{` · ${read.units[at] ?? ""}`}</span>
              ) : null}
            </p>
            <dl className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              {row.cells.map((cell) => (
                <div key={cell.header} className="flex min-w-0 items-center gap-1.5">
                  <dt className="text-caption font-normal text-text-tertiary">{cell.header}</dt>
                  <dd data-cell={cell.header}>
                    {cell.gap === null ? (
                      <span className="font-mono text-text-primary tabular-nums">{cell.text}</span>
                    ) : (
                      <GapChip reason={cell.gap} />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </FigureTile>
  );
}

/**
 * The charts a lead does not draw itself: one tile per `Chart data:` section of the entry whose
 * title (case aside) is not in `drawn`, listing the stated rows as written (each cell under its
 * column's name, a stated gap as the hatched chip with its reason, the unit as the kicker). No
 * chart is drawn and nothing is summed; the basis column, which names sources, is left to
 * Evidence. A section written as prose is left to the frame, which draws the module's words.
 * Null when the lead draws every chart.
 */
export function UnreadFigures({ lead, drawn }: { lead: LeadProps; drawn: readonly string[] }) {
  const done = new Set(drawn.map((title) => title.trim().toLowerCase()));
  // A section the module wrote as prose is drawn by the frame with the module's own words.
  const unread = lead.entry.sections.filter(
    ({ heading }) =>
      heading.startsWith(PREFIX) &&
      !done.has(titleOf(heading).toLowerCase()) &&
      !statedInProse(lead.entry, heading),
  );
  if (!unread.length) return null;
  return (
    <>
      {unread.map((section) => {
        const tables = section.blocks.filter((block): block is Table => block.type === "table");
        const title = titleOf(section.heading);
        return (
          <Unread
            key={`${String(section.line)}-${title}`}
            lead={lead}
            title={title}
            table={tables.length === 1 ? (tables[0] ?? null) : null}
          />
        );
      })}
    </>
  );
}
