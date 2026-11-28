import {
  blocked,
  containsReference,
  eachClauseOnce,
  evidencePath,
  methodNote,
  readParagraph,
  readerText,
  withUnit,
  type OutputEntry,
  type Table,
} from "../../publishedReport";
import { eventRecords, type EventRecord } from "../../visuals/EventLane";
import { readerReason } from "../overview/reason";
import type { Cell } from "../overview/figureData";
import { items, publishedTables, record, word, type SourceTable } from "../../visuals/visualData";
import type { LeadProps } from "./types";

type Descriptor = Record<string, unknown>;

/** The trace address of one line of the lead's own handoff. */
export const leadHref =
  ({ run, entry }: Pick<LeadProps, "run" | "entry">) =>
  (line?: number) =>
    evidencePath(run.folder, entry, line);

/**
 * Whether a lead draws nothing: the module is blocked, or the store could not read its handoff.
 * The frame states either once.
 */
export const drawsNothing = (entry: OutputEntry) =>
  blocked(entry) || Boolean(entry.output.parseError);

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** What a cell that names a source shows; the cell itself is in the trace. */
export const IN_EVIDENCE = "In Evidence";

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The register heading pattern for an id: "T2F.4 — Floating exposure", "#### t2f.4 — hedge register". */
const registerHeading = (id: string) => new RegExp(`^[*\`]*${escaped(id)}(?![\\w.])`, "i");

/** Whether the module wrote a section headed by the register id, read or not. */
export const hasRegister = (entry: OutputEntry, id: string) =>
  entry.sections.some((section) => registerHeading(id).test(section.heading.trim()));

/**
 * A register the method names by id: the one table under a heading that starts with the id ("T2F.4 —
 * Floating exposure", "T2F.4 - Floating-rate exposure", "#### t2f.4 — hedge register") whose header
 * row holds every named header, in any letter case. Its cells are model-written text.
 */
export function registerTable(entry: OutputEntry, id: string, headers: readonly string[]) {
  const heading = registerHeading(id);
  const wanted = headers.map((name) => name.toLowerCase());
  const matches = entry.sections
    .filter((section) => heading.test(section.heading.trim()))
    .flatMap(({ blocks }) => blocks)
    .filter((block): block is Table => block.type === "table")
    .filter((table) => {
      const own = table.headers.map((name) => name.trim().toLowerCase());
      return wanted.every((name) => own.includes(name));
    });
  return matches.length === 1 ? matches[0] : undefined;
}

/** A column's index by its header, in any letter case; -1 when the table has none or two. */
export function columnOf(table: Pick<Table, "headers">, name: string) {
  const at = table.headers.flatMap((header, index) =>
    header.trim().toLowerCase() === name.toLowerCase() ? [index] : [],
  );
  return at.length === 1 ? (at[0] ?? -1) : -1;
}

/**
 * A word that only links a clause to what it cites ("per", "see", "in", "table") or locates a
 * place in a source ("p.", "page", "section"): never left at the end of the words kept.
 */
const LINK_WORD =
  /(?:^|\s+)(?:per|see|in|from|at|on|of|for|and|by|under|table|register|rows?|pp?\.|pages?|sections?|§|paras?\.?|-|–|—)$/i;
const DANGLING = /[\s,;:(\-–—]+$/;

/** A word that introduces what a clause cites: "per T2F.2", "see note 4", "rows of T2F.2". */
const INTRODUCES = /^(?:per|see|in|from|table|register)$/i;

/**
 * A clause's words before the first word it cites, kept only when a link word introduces that word
 * ("Individual coupons in T2F.2") and what remains does not end on a dangling word; otherwise
 * nothing ("Run 20261113-101500-01 retained" is no phrase without its id).
 */
function leadingWords(clause: string) {
  const words = clause.split(/\s+/);
  const cites = words.findIndex((word) => readerReason(word) === null);
  if (cites < 1) return "";
  const before = words[cites - 1] ?? "";
  const pair = /^of$/i.test(before) && /^rows?$/i.test(words[cites - 2] ?? "");
  if (!pair && !INTRODUCES.test(before)) return "";
  const lead = words.slice(0, cites - (pair ? 2 : 1)).join(" ");
  if (!lead || LINK_WORD.test(lead) || DANGLING.test(lead)) return "";
  return readerReason(lead) ?? "";
}

/** A bracketed group whose words cite a source or an id: "(credit_agreement.pdf page 3)", "(T2F.2)". */
const BRACKETED = /\s*(?:\([^()]*\)|\[[^\]]*\])/g;
const cited = (group: string) => readerReason(group.trim().slice(1, -1)) === null;
const plainCell = (text: string) => text.replaceAll("**", "").replaceAll("`", "").trim();

/**
 * A cell for a working page, by the reader rule (`readerReason`): as written, module codes as names;
 * where it cites a source, a register id or an unnamed code, only that clause goes to the trace and
 * the readable words and figures stay. "In Evidence" when nothing readable is left.
 */
export function readerCell(text: string) {
  const plain = plainCell(text);
  if (!plain) return "";
  // The reader rule reads a leading "- " as a list marker; a cell keeps it as written.
  const marker = /^[-*] /.exec(plain)?.[0] ?? "";
  const whole = readerReason(plain.slice(marker.length));
  if (whole !== null) return `${marker}${whole}`;
  const parts = plain
    .replace(BRACKETED, (group) => (cited(group) ? "" : group))
    .split(/\s*([;,])\s+/);
  const kept: string[] = [];
  for (let at = 0; at < parts.length; at += 2) {
    const clause = (parts[at] ?? "").trim();
    // A later clause that cites is dropped whole ("…, page 7"); the first keeps its leading words.
    const words = clause ? (readerReason(clause) ?? (at === 0 ? leadingWords(clause) : "")) : "";
    if (words) kept.push(kept.length ? `${parts[at - 1] ?? ""} ${words}` : words);
  }
  const joined = kept.join("").replace(DANGLING, "");
  return (joined && readerReason(joined)) || IN_EVIDENCE;
}

const BARE_NUMBER = /^[-−]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
const BRACKETED_NUMBER = /^\(((?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?)\)$/;

/**
 * A stated cell with its table's unit, once: a bare number takes the unit ("5.0" in x, "5.0x"), an
 * accounting negative takes it inside its brackets ("(12.3)" in x, "(12.3x)"); a cell that already
 * carries its unit ("12%", "5.0x") or any other words prints as written.
 */
export function withStatedUnit(text: string, unit: string) {
  const written = text.trim();
  if (!unit) return written;
  if (BARE_NUMBER.test(written)) return withUnit(written, unit);
  const inner = BRACKETED_NUMBER.exec(written)?.[1];
  return inner ? `(${withUnit(inner, unit)})` : written;
}

/** Text closed as a sentence: one full stop added unless it already ends with one ("n.m."). */
export const closed = (text: string) => (/[.!?]$/.test(text.trim()) ? text : `${text}.`);

export type Paragraph = { line: number; text: string | null };

/** The paragraphs the module wrote under a heading; `text` is null for one that names a source. */
export function sectionParagraphs(entry: OutputEntry, heading: string): Paragraph[] {
  return entry.sections
    .filter((section) => section.heading === heading)
    .flatMap(({ blocks }) => blocks)
    .flatMap((block) => (block.type === "text" && !methodNote(block.text) ? [block] : []))
    .map((block) => {
      const body = readParagraph(block.text).body.replaceAll("**", "").replaceAll("`", "");
      return { line: block.line, text: containsReference(body) ? null : readerText(body) };
    })
    .filter((paragraph) => paragraph.text !== "");
}

/** A register row's name for the reader: its own words, or its place when it has none. */
export const rowName = (text: string, index: number) => text || `Row ${String(index + 1)}`;

/** A read cell as a working page shows it; its value is read from the cell as written. */
export function readerCellOf(cell: Cell): Cell {
  const gap = /^(Not [a-z]+):\s*(\S.*)$/i.exec(cell.text.trim());
  return {
    ...cell,
    text: gap ? `${gap[1] ?? ""}: ${readerCell(gap[2] ?? "")}` : readerCell(cell.text),
    reason: cell.reason === null ? null : readerCell(cell.reason),
  };
}

/** The handoff's own table as a source table: cells as written, each row's line. */
function sourceOf(table: Table): SourceTable {
  return {
    line: table.line,
    headers: table.headers,
    rows: table.rows.map(({ cells }) => cells),
    rowLines: table.rows.map(({ line }) => line),
  };
}

/** The handoff's headings that start with `prefix`, each with the rest as the store names it. */
function headed(entry: OutputEntry, prefix: string, raise: boolean) {
  return entry.sections.flatMap((section) => {
    const heading = section.heading.trim();
    if (!heading.startsWith(prefix)) return [];
    const rest = heading.slice(prefix.length);
    const tables = section.blocks.filter((block): block is Table => block.type === "table");
    return [{ name: raise ? capital(rest) : rest, tables }];
  });
}

/**
 * The one table the handoff writes under `<prefix><name>`, read as written: what the page draws
 * when the store publishes no descriptor for it. A chart's title has its first letter raised.
 */
function handoffTable(entry: OutputEntry, prefix: string, name: string, raise = false) {
  const tables = headed(entry, prefix, raise)
    .filter((item) => item.name === name)
    .flatMap((item) => item.tables);
  const [only] = tables;
  return tables.length === 1 && only ? sourceOf(only) : undefined;
}

/**
 * Whether the module wrote the drawing section `title` ("Chart data: Liquidity bridge", "Events:
 * Financing", "Map: ownership and control") as prose with no table. The frame draws that section
 * with the module's own words, so a lead draws nothing for it. Headings compare without case.
 */
export function statedInProse(entry: OutputEntry, title: string) {
  const wanted = title.trim().toLowerCase();
  const blocks = entry.sections
    .filter((section) => section.heading.trim().toLowerCase() === wanted)
    .flatMap((section) => section.blocks);
  return (
    blocks.some((block) => block.type === "text") && !blocks.some((block) => block.type === "table")
  );
}

export type Chart =
  | { state: "ready"; descriptor: Descriptor; table: SourceTable }
  | { state: "gap"; reason: string }
  /** The handoff has the table under its `Chart data:` heading; the store published no figure for it. */
  | { state: "withheld"; table: SourceTable; line: number }
  | { state: "absent" };

const CHART = "Chart data: ";

/**
 * One of the module's chart tables: published with its descriptor, the reason the module gives for
 * not filling it, the table as the handoff writes it when the store withheld the figure, or none.
 */
export function chartOf(entry: OutputEntry, title: string): Chart {
  const descriptor = items(entry.output.charts)
    .map(record)
    .find((chart) => chart.title === title);
  const table =
    descriptor && typeof descriptor.table === "number"
      ? publishedTables(entry.sections).get(descriptor.table)
      : undefined;
  if (descriptor && table) return { state: "ready", descriptor, table };
  const gap = items(entry.output.chartGaps)
    .map(record)
    .find((chart) => chart.title === title);
  const reason = word(gap?.gap).trim();
  if (gap && reason) return { state: "gap", reason: readerCell(capital(eachClauseOnce(reason))) };
  const written = descriptor || gap ? undefined : handoffTable(entry, CHART, title, true);
  if (written) return { state: "withheld", table: written, line: written.line };
  return { state: "absent" };
}

/**
 * Every chart whose title starts with `prefix`, drawn, stated as a gap or withheld, in the handoff's
 * order; none the module wrote as prose only (`statedInProse`), which the frame draws.
 */
export function chartsStartingWith(entry: OutputEntry, prefix: string) {
  const titles = [
    ...headed(entry, CHART, true).map((item) => item.name),
    ...[...items(entry.output.charts), ...items(entry.output.chartGaps)].map((chart) =>
      word(record(chart).title),
    ),
  ].filter((title) => title.startsWith(prefix) && !statedInProse(entry, `${CHART}${title}`));
  return [...new Set(titles)].map((title) => ({ title, chart: chartOf(entry, title) }));
}

export type Edge = {
  /** Internal endpoint identities when the displayed names are screened. */
  key?: string;
  toKey?: string;
  from: string;
  relationship: string;
  type: string;
  to: string;
  line: number;
};
/** A map row the page does not draw as an edge, and why. */
export type MapGap = { line: number; reason: string };
export type MapRead =
  | { state: "ready"; edges: Edge[]; gaps: MapGap[]; line: number }
  | { state: "gap"; reason: string; line?: number }
  | { state: "absent" };

const MAP = ["From", "Relationship", "Edge type", "To", "Evidence"];
const NOT_SUPPLIED = /^Not supplied:\s*(\S.*)$/;
const stated = (text: string) => text.trim() !== "" && !NOT_SUPPLIED.test(text.trim());

/** Why the page could not read a table the handoff has; it names only what the page checked. */
const UNREAD = "This page could not read this table.";
/** Why the page draws no figure for a chart table the handoff has but the store did not publish. */
export const WITHHELD = "This page could not draw this table.";
const ROW_UNREAD = "this page could not read every cell of the row";

/** A row's stated gap reasons, once each, in the order written. */
const rowReasons = (cells: readonly string[]) => [
  ...new Set(cells.flatMap((cell) => NOT_SUPPLIED.exec(cell.trim())?.[1] ?? [])),
];

// Node identity keeps the pre-screened words and ignores Markdown formatting and spacing.
const mapNodeKey = (text: string) => plainCell(text).replace(/\s+/g, " ");

// Number screened nodes in handoff order when one shared label would obscure the connections.
function nameScreenedNodes(edges: Edge[]): Edge[] {
  const keys = new Set(edges.flatMap(({ key, toKey }) => [key, toKey]));
  keys.delete(undefined);
  if (keys.size < 2) return edges;
  const names = new Map(
    [...keys].map((key, index) => [key, `${IN_EVIDENCE} (${String(index + 1)})`]),
  );
  return edges.map((edge) => ({
    ...edge,
    from: names.get(edge.key) ?? edge.from,
    to: names.get(edge.toKey) ?? edge.to,
  }));
}

/**
 * A `Map: <name>` edge table: every fully stated row an edge, every other row a gap with its stated
 * reason. Read from the published descriptor, or from the handoff's own table when the store
 * withheld the map; the descriptor's stated gap when it gives one.
 */
export function mapOf(entry: OutputEntry, name: string): MapRead {
  const descriptor = items(entry.output.maps)
    .map(record)
    .find((map) => map.name === name);
  const at = typeof descriptor?.table === "number" ? descriptor.table : undefined;
  const reason = word(descriptor?.gap).trim();
  if (reason)
    return { state: "gap", reason: readerCell(capital(eachClauseOnce(reason))), line: at };
  const table = descriptor
    ? at === undefined
      ? undefined
      : publishedTables(entry.sections).get(at)
    : handoffTable(entry, "Map: ", name);
  if (!table) return { state: "absent" };
  if (table.headers.join("\0") !== MAP.join("\0") || !table.rows.length)
    return { state: "gap", reason: UNREAD, line: table.line };
  const edges: Edge[] = [];
  const gaps: MapGap[] = [];
  table.rows.forEach((row, index) => {
    const [from = "", relationship = "", type = "", to = ""] = row;
    const line = table.rowLines?.[index] ?? table.line;
    if ([from, relationship, type, to].every(stated)) {
      const fromName = readerCell(from);
      const toName = readerCell(to);
      edges.push({
        key: fromName === IN_EVIDENCE ? mapNodeKey(from) : undefined,
        toKey: toName === IN_EVIDENCE ? mapNodeKey(to) : undefined,
        from: fromName,
        relationship: readerCell(relationship),
        type: readerCell(type),
        to: toName,
        line,
      });
    } else
      gaps.push({
        line,
        reason: readerCell(capital(rowReasons(row.slice(0, 4)).join("; ") || ROW_UNREAD)),
      });
  });
  if (!edges.length) {
    const reasons = [...new Set(gaps.map((gap) => gap.reason))];
    return { state: "gap", reason: reasons.join("; "), line: table.line };
  }
  return { state: "ready", edges: nameScreenedNodes(edges), gaps, line: table.line };
}

/** One dated row of a lane as the page shows it; precision and publication as the module states them. */
export type LaneEvent = {
  date: string;
  precision: string;
  published: string;
  event: string;
  status: string;
  relevance: string;
  /** The row's status category and the days it covers, as the Calendar's event axis places them. */
  category: EventRecord["category"];
  from: number;
  to: number;
  line: number;
};
/** A lane row the page could not place by date: its date cell and event as written. */
export type UnplacedEvent = { date: string; event: string; line: number };
export type Lane =
  | { state: "gap"; reason: string; line?: number }
  /** `unplaced`: rows of the lane's table the page could not place by date, in the order written. */
  | { state: "ready"; events: LaneEvent[]; unplaced: UnplacedEvent[]; line: number };

/**
 * The module's dated events of one lane, earliest first (then by end, then as written): from the
 * published descriptor, or from the handoff's `Events: <lane>` table when the store withheld the
 * lane. The descriptor's stated gap when it gives one; null when the handoff has no such lane.
 */
export function eventsOf(entry: OutputEntry, lane: string): Lane | null {
  const descriptor = items(entry.output.events)
    .map(record)
    .find((events) => events.lane === lane);
  const at = typeof descriptor?.table === "number" ? descriptor.table : undefined;
  const reason = word(descriptor?.gap).trim();
  if (reason)
    return { state: "gap", reason: readerCell(capital(eachClauseOnce(reason))), line: at };
  const table = descriptor
    ? at === undefined
      ? undefined
      : publishedTables(entry.sections).get(at)
    : handoffTable(entry, "Events: ", lane);
  if (!table) return null;
  const records = eventRecords(table);
  const events = records
    .sort((a, b) => a.from - b.from || a.to - b.to || a.index - b.index)
    .map((event) => ({
      date: event.date,
      precision: event.precision,
      published: readerCell(event.published),
      event: readerCell(event.event) || "Not stated",
      status: readerCell(event.status),
      relevance: readerCell(event.relevance),
      category: event.category,
      from: event.from,
      to: event.to,
      line: table.rowLines?.[event.index] ?? table.line,
    }));
  const placed = new Set(records.map((event) => event.index));
  const [date, event] = ["Event date", "Event"].map((name) => columnOf(table, name));
  const unplaced = table.rows.flatMap((cells, index) =>
    placed.has(index)
      ? []
      : [
          {
            date: readerCell(cells[date ?? -1] ?? "") || "Date not stated",
            event: readerCell(cells[event ?? -1] ?? "") || "Not stated",
            line: table.rowLines?.[index] ?? table.line,
          },
        ],
  );
  return { state: "ready", events, unplaced, line: table.line };
}

/** The run's as-of date for the event axis: a calendar date as its time and its text, else null. */
export function axisAsOf(text: string | null | undefined) {
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const time = Date.parse(`${text}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === text
    ? { time, text }
    : null;
}

const MONEY_LEAD =
  /^([+−-]?)([A-Z]{3}) ?([+−-]?)(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?) ?(?:million|m)\b/;

/**
 * The amount a cell states first, in millions of `currency`, when it opens "[+]USD 57.89 million…",
 * "USD +57.89 million…" or "USD 300m…"; `written` is that amount as the cell writes it. Null for any
 * other form, a second sign, another currency or a cell that states two amounts before a word.
 */
export function leadingMillions(text: string, currency?: string) {
  const match = MONEY_LEAD.exec(text.trim());
  if (!match || (currency && match[2] !== currency)) return null;
  const [written, before = "", code = "", after = "", digits = ""] = match;
  if (before && after) return null;
  const value = Number(digits.replaceAll(",", ""));
  if (!Number.isFinite(value)) return null;
  const sign = before || after;
  return { currency: code, value: sign === "-" || sign === "−" ? -value : value, written };
}
