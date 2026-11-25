import { blocked, type OutputEntry } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import {
  cellAmount,
  items,
  publishedTables,
  record,
  word,
  type SourceTable,
} from "../../visuals/visualData";
import { readerReason } from "./reason";

type Descriptor = Record<string, unknown>;

/** A figure's published chart table, or the reason the run does not carry it. */
export type FigureSource =
  | { state: "ready"; entry: OutputEntry; descriptor: Descriptor; table: SourceTable }
  | { state: "gap"; reason: string; entry?: OutputEntry };

export type Cell = {
  /** The published cell, word for word. */
  text: string;
  value: number | null;
  /** The handoff's own reason when the cell states a gap. */
  reason: string | null;
};

const selectedEntry = (view: ReportView, module: string) =>
  view.entries.find((entry) => entry.selected && entry.output.module === module);

/** Why a blocked module has no figures, in its own words where they can be drawn here. */
function blockedReason(entry: OutputEntry) {
  const first = entry.sections
    .find((section) => section.heading === "Bottom line")
    ?.blocks.find((block) => block.type === "text");
  const text = first?.type === "text" ? first.text : "";
  return readerReason(text) ?? "Not assessable; the reason is recorded in Evidence.";
}

/** The module entry a tile reads, or the gap that takes its place. */
export function moduleSource(
  view: ReportView,
  module: string,
  name: string,
): { entry?: OutputEntry; reason?: string } {
  const entry = selectedEntry(view, module);
  if (!entry) return { reason: `${name} did not run in this run.` };
  if (entry.output.parseError)
    return { entry, reason: `${name}'s output could not be read; it is in Evidence.` };
  if (blocked(entry)) return { entry, reason: blockedReason(entry) };
  return { entry };
}

export function figureSource(
  view: ReportView,
  module: string,
  title: string,
  name: string,
): FigureSource {
  const { entry, reason } = moduleSource(view, module, name);
  if (!entry || reason) return { state: "gap", reason: reason ?? "", entry };
  const descriptor = items(entry.output.charts)
    .map(record)
    .find((chart) => chart.title === title);
  const table =
    descriptor && typeof descriptor.table === "number"
      ? publishedTables(entry.sections).get(descriptor.table)
      : undefined;
  return descriptor && table
    ? { state: "ready", entry, descriptor, table }
    : { state: "gap", entry, reason: `${name}'s output has no ${title.toLowerCase()} table.` };
}

/** A column index a descriptor names, when it is a column of the table. */
export function columnAt(table: SourceTable, value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value < table.headers.length
      ? value
      : null
    : null;
}

const NOT_STATED = /^Not (?:supplied|calculated):\s*(\S.*)$/;

/** One cell read with the cells that share its measure and unit. A gap keeps its reason. */
export function readCell(text: string, scope: readonly string[], unit: string): Cell {
  const value = cellAmount(text, scope, unit || undefined);
  const stated = NOT_STATED.exec(text)?.[1] ?? null;
  return {
    text,
    value,
    reason: value === null ? (stated ?? (text.trim() ? null : "No value stated")) : null,
  };
}

/** The table's own notes on its basis, each once, in the reader's words; one that cites a source stays in Evidence. */
export function basisNotes(table: SourceTable) {
  return [...new Set(basisNotesRaw(table).flatMap((note) => readerReason(note) ?? []))];
}

/**
 * The table's own notes on its basis, each once, as the module wrote them (trimmed), a note that
 * cites a source included: for a drawer that draws each through `Reason` (`FigureNotes`).
 */
export function basisNotesRaw(table: SourceTable) {
  const column = table.headers.findIndex((header) => /^Basis and limitation$/i.test(header));
  if (column < 0) return [];
  const notes = table.rows.map((row) => (row[column] ?? "").trim()).filter(Boolean);
  return [...new Set(notes)];
}

export const unitOf = (descriptor: Descriptor) => word(descriptor.unit);
