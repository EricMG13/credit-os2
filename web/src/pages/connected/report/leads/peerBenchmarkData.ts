import type { OutputEntry } from "../../publishedReport";
import { reasonText, safeText as safe } from "./kit/reader";
import { difference, readCell, signOf } from "./kit/numbers";
import { allTables } from "./kit/tables";

/** The two range tables the launcher asks CP-1C for (cpos_launch_tables.py `_peer_range`). Note the em dash. */
export const PEER_HEADINGS = {
  percent: "Chart data: peer range — percent metrics",
  multiples: "Chart data: peer range — multiples",
} as const;
type PeerKind = keyof typeof PEER_HEADINGS;

/** A heading with every dash alike and spaces collapsed: a hyphen for the em dash still names the table. */
const headingKey = (heading: string) =>
  heading
    .replace(/[\u2010-\u2015\u2212-]+/g, "-")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const REQUIRED = [
  "Metric",
  "Issuer",
  "Peer low",
  "Peer median",
  "Peer high",
  "Peer count",
  "Reporting unit",
] as const;

/**
 * One stated value: a plain number (an accounting negative `(2.0)` is a number; `written` is the
 * cell as the module wrote it), the module's own reason for not stating it, or the module's words
 * where a number belongs (`n.m.`), drawn as written.
 */
export type Value =
  | { kind: "number"; text: string; value: number; written?: string }
  | { kind: "gap"; text: string; reason: string }
  | { kind: "words"; text: string };

export function valueOf(cell: string): Value {
  const reading = readCell(cell);
  if (reading.kind === "number") return reading;
  if (reading.kind === "gap") return { ...reading, reason: reasonText(reading.reason) };
  return { kind: "words", text: safe(reading.text) };
}

/** A stated number as the module wrote it, a gap's reason, or the module's words: what the page draws for it. */
export const shown = (value: Value) =>
  value.kind === "number"
    ? (value.written ?? value.text)
    : value.kind === "gap"
      ? value.reason
      : value.text;

type Count =
  { kind: "number"; value: number; text: string } | { kind: "gap"; reason: string; text: string };

function countOf(cell: string): Count {
  const text = cell.trim();
  if (/^\d+$/.test(text)) return { kind: "number", value: Number(text), text };
  const reading = readCell(cell);
  return {
    kind: "gap",
    text,
    reason:
      reading.kind === "gap"
        ? safe(reading.reason)
        : `This page could not read “${safe(text)}” as a whole number of peers`,
  };
}

/** The text closed by one full stop: one the module already wrote ("n.m.", "no peers.") is not doubled. */
export const end = (text: string) => (text.endsWith(".") ? text : `${text}.`);

/** What can be drawn for one metric. */
type Drawing =
  /** The band is stated; the median and the issuer are drawn where stated. */
  | {
      kind: "strip";
      low: number;
      high: number;
      median: number | null;
      issuer: number | null;
    }
  /** The band is not stated: only the labelled gap row. */
  | { kind: "gap" }
  /** The stated values contradict each other: no strip. */
  | { kind: "conflict"; message: string };

export type PeerRow = {
  metric: string;
  unit: string;
  line: number;
  issuer: Value;
  low: Value;
  median: Value;
  high: Value;
  count: Count;
  basis: string | null;
  drawing: Drawing;
  /** The reasons a value is missing, in the handoff's words, for the notes beneath the figure. */
  notes: string[];
};

/** `a <= b`, exact over the stated texts. */
const atMost = (a: string, b: string) => (signOf(difference(b, a)) ?? -1) >= 0;

function drawingOf(row: Omit<PeerRow, "drawing" | "notes">): Drawing {
  const { low, median, high, issuer } = row;
  if (low.kind !== "number" || high.kind !== "number") return { kind: "gap" };
  if (!atMost(low.text, high.text))
    return {
      kind: "conflict",
      message: `Peer low ${low.text} is above peer high ${high.text}`,
    };
  if (
    median.kind === "number" &&
    !(atMost(low.text, median.text) && atMost(median.text, high.text))
  )
    return {
      kind: "conflict",
      message: `Peer median ${median.text} is outside the range ${low.text} to ${high.text}`,
    };
  return {
    kind: "strip",
    low: low.value,
    high: high.value,
    median: median.kind === "number" ? median.value : null,
    issuer: issuer.kind === "number" ? issuer.value : null,
  };
}

/**
 * What the figure leaves unsaid, once each: a missing median and a missing peer count, each with
 * the module's reason. A missing issuer or band is written in its own slot on the strip, and values
 * that contradict each other are said on the row.
 */
function notesOf(row: Omit<PeerRow, "drawing" | "notes">, drawing: Drawing) {
  const notes: string[] = [];
  if (drawing.kind === "strip" && row.median.kind !== "number")
    notes.push(end(`${row.metric}, peer median: ${shown(row.median)}`));
  if (row.count.kind === "gap") notes.push(end(`${row.metric}, peer count: ${row.count.reason}`));
  return notes;
}

/**
 * The words in a row's gap slot, each distinct reason once: "Peer range: only two peers reported it"
 * when low, median and high give one reason, else each reason with the values it covers.
 */
export function bandGapText(row: PeerRow) {
  const named = (
    [
      ["Peer low", row.low],
      ["Peer median", row.median],
      ["Peer high", row.high],
    ] as const
  ).filter(([, value]) => value.kind !== "number");
  const groups = new Map<string, string[]>();
  for (const [label, value] of named)
    groups.set(shown(value), [...(groups.get(shown(value)) ?? []), label]);
  const all = named.length === 3 && groups.size === 1;
  return [...groups.entries()]
    .map(([reason, labels]) => `${all ? "Peer range" : labels.join(", ")}: ${reason}`)
    .join("; ");
}

export type PeerGroup = { unit: string; rows: PeerRow[] };
export type PeerTable = {
  kind: PeerKind;
  /** The section heading the table is under, which the store publishes as the chart's title. */
  heading: string;
  line: number;
  groups: PeerGroup[];
  rows: PeerRow[];
};

export type PeerRead = {
  /** The range tables that could be read; empty in the usual state (blocked at the peer-data gate). */
  tables: PeerTable[];
  /** Why a range table is not drawn, in words, one per table. */
  gaps: string[];
  /** A table with an "Outlier" column exists: its drawing is left to Evidence. */
  outliers: boolean;
};

function readRows(headers: string[], rows: { cells: string[]; line: number }[]) {
  const at = (name: string) => headers.indexOf(name);
  const basisAt = headers.indexOf("Basis and limitation");
  return rows.map(({ cells, line }): PeerRow => {
    const cell = (name: string) => cells[at(name)] ?? "";
    const base = {
      metric: safe(cell("Metric")),
      unit: cell("Reporting unit").trim(),
      line,
      issuer: valueOf(cell("Issuer")),
      low: valueOf(cell("Peer low")),
      median: valueOf(cell("Peer median")),
      high: valueOf(cell("Peer high")),
      count: countOf(cell("Peer count")),
      basis: basisAt < 0 || !(cells[basisAt] ?? "").trim() ? null : safe(cells[basisAt] ?? ""),
    };
    const drawing = drawingOf(base);
    return { ...base, drawing, notes: notesOf(base, drawing) };
  });
}

/** Rows sharing a stated unit share one axis; a row with no stated unit has an axis of its own. */
function groupByUnit(rows: PeerRow[]): PeerGroup[] {
  const groups = new Map<string, PeerGroup>();
  rows.forEach((row, at) => {
    const key = row.unit || `unit-not-stated-${String(at)}`;
    const group = groups.get(key) ?? { unit: row.unit, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  });
  return [...groups.values()];
}

/** The peer range tables of a CP-1C handoff, or why one is not drawn. */
export function readPeerBenchmark(entry: OutputEntry): PeerRead {
  const tables = allTables(entry);
  const read: PeerRead = {
    tables: [],
    gaps: [],
    outliers: tables.some(({ table }) => table.headers.some((header) => /outlier/i.test(header))),
  };
  let absent = 0;
  const names = { percent: "percent metrics", multiples: "multiples" } as const;
  for (const kind of ["percent", "multiples"] as const) {
    const found = tables.filter(
      ({ heading }) => headingKey(heading) === headingKey(PEER_HEADINGS[kind]),
    );
    const [one] = found;
    if (found.length > 1) {
      read.gaps.push(
        `This page could not read the peer range for ${names[kind]} because it appears more than once.`,
      );
    } else if (!one) {
      absent += 1;
      read.gaps.push(`This page could not read the peer range for ${names[kind]}.`);
    } else {
      const missing = REQUIRED.filter((name) => !one.table.headers.includes(name));
      if (missing.length)
        read.gaps.push(
          `This page could not read the peer range for ${names[kind]} because the table is not in a shape this page reads.`,
        );
      else if (!one.table.rows.length)
        read.gaps.push(`This page could not read a row of the peer range for ${names[kind]}.`);
      else {
        const rows = readRows(one.table.headers, one.table.rows);
        read.tables.push({
          kind,
          heading: one.heading,
          line: one.table.line,
          groups: groupByUnit(rows),
          rows,
        });
      }
    }
  }
  // Neither range table, under either heading: one plain statement of that.
  if (!read.tables.length && absent === read.gaps.length)
    read.gaps = ["This page could not read a peer range table."];
  return read;
}

/** A figure with its unit as the module states it: `%` and `x` attach, any other unit follows. */
export function withUnit(text: string, unit: string) {
  const tidy = text.replace(/^-/, "−");
  if (!unit) return tidy;
  return /^[%x]$/i.test(unit) ? `${tidy}${unit}` : `${tidy} ${safe(unit)}`;
}

/** The chart title the store publishes for a `Chart data:` heading ("Peer range — multiples"), or null. */
export function chartTitleOf(heading: string) {
  if (!heading.startsWith("Chart data: ")) return null;
  const name = heading.slice("Chart data: ".length).trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
