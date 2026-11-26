import {
  classifySections,
  containsReference,
  missingPassages,
  passages,
  readParagraph,
  readerText,
  type Block,
  type OutputEntry,
  type Section,
  type Table,
} from "../publishedReport";
import { drawingLines, findingBlocks } from "../ReportContent";
import { unitLabel } from "../moneyUnits";
import { namedTable } from "../reportView";
import { typedModuleTable } from "./ModuleTable";
import { heldInEvidence, readableTitle } from "./moduleRecordsModel";
import type { LeadKind } from "./leads/types";

export type TextBlock = Extract<Block, { type: "text" }>;

export const KEY_FINDINGS = "Key findings";
export const CONTRARY = "Contrary evidence and what would change the view";
const LIMITATIONS = "Limitations";
const PASSAGE_NAMES = ["Bottom line", KEY_FINDINGS, CONTRARY, LIMITATIONS] as const;

/** What a module's visuals are, so a lead can say which of them it draws itself. */
export type FigureKind = LeadKind;

/** The bottom line as the module wrote it: the passage's first paragraph, else its summary. */
export type BottomLineSource =
  | { kind: "passage"; block: TextBlock; rest: TextBlock[] }
  | { kind: "summary"; text: string; rest: string; line: number }
  | null;

/** A reader section drawn on the page: its prose, and the typed tables drawn with it. */
export interface ProseSection {
  section: Section;
  title: string;
  paragraphs: TextBlock[];
  typed: Table[];
  words: number;
}

/** A visual the module states it could not draw, written as prose under its drawing heading. */
export interface DrawingGap {
  title: string;
  kind: FigureKind;
  blocks: TextBlock[];
  line: number;
}

const textBlocks = (section: Section | undefined) =>
  (section?.blocks ?? []).filter((block): block is TextBlock => block.type === "text");

/** A paragraph the reader can read: not only a Basis line, which belongs in the trace. */
export const readable = (block: TextBlock) => readParagraph(block.text).body !== "";

function bottomLineOf(entry: OutputEntry, passage: Section | undefined): BottomLineSource {
  const [first, ...rest] = textBlocks(passage).filter(readable);
  if (first) return { kind: "passage", block: first, rest };
  const summary = entry.output.summary;
  if (!summary || containsReference(summary.bottomLine)) return null;
  const limitation = containsReference(summary.limitation) ? "" : summary.limitation;
  return { kind: "summary", text: summary.bottomLine, rest: limitation, line: summary.line };
}

const wordCount = (paragraphs: TextBlock[]) =>
  paragraphs.reduce(
    (total, block) => total + readParagraph(block.text).body.split(/\s+/).length,
    0,
  );

const typedAt = (entry: OutputEntry, section: Section, table: Table) =>
  typedModuleTable(entry.output.module, section.heading, table, () => "") !== null;

/**
 * A finding section the page draws as prose: one whose tables are all typed and drawn with it.
 * A section holding a plain table goes, prose and all, to the records region, where its prose
 * sits with its table. Registers draw only their typed tables; entity keys and the like none.
 */
function proseSection(
  entry: OutputEntry,
  section: Section,
  role: string,
  typedTables: boolean,
): ProseSection | null {
  if (heldInEvidence(section.heading, role)) return null;
  // The handoff's own section: the finding blocks leave out a coded section's plain tables.
  const written = entry.sections.find(({ line }) => line === section.line) ?? section;
  const tables = written.blocks.filter((block): block is Table => block.type === "table");
  const typed = typedTables ? tables.filter((table) => typedAt(entry, section, table)) : [];
  if (typed.length !== tables.length) return null;
  const paragraphs = role === "registers" ? [] : textBlocks(section).filter(readable);
  if (!paragraphs.length && !typed.length) return null;
  const title = readableTitle(section.heading, "Untitled section");
  return { section, title, paragraphs, typed, words: wordCount(paragraphs) };
}

const KIND_OF_DRAWING: [RegExp, FigureKind][] = [
  [/^Map: /, "maps"],
  [/^Events: /, "events"],
];

/** Drawing sections with prose and no table: the module's words for a visual it did not draw. */
function drawingGaps(entry: OutputEntry): DrawingGap[] {
  return classifySections(entry.sections).flatMap(({ section, role }) => {
    if (role !== "drawing" || section.blocks.some((block) => block.type === "table")) return [];
    const blocks = textBlocks(section).filter(readable);
    if (!blocks.length) return [];
    const kind = KIND_OF_DRAWING.find(([prefix]) => prefix.test(section.heading))?.[1] ?? "figures";
    return [
      {
        title: readableTitle(section.heading, "Untitled figure"),
        kind,
        blocks,
        line: section.line,
      },
    ];
  });
}

/** One part of the basis line: the cell as written, or a gap the module stated in its words. */
type BasisPart = { name: string; text: string; gap: boolean };

/** The basis of the module's figures as its handoff states it; nothing is inferred. */
export type Basis =
  | {
      kind: "entity";
      entity: string;
      parts: BasisPart[];
      /** How many reporting entities the key lists; the first is shown. */
      entities: number;
      line: number;
    }
  | { kind: "periods"; periods: string[] }
  | null;

const BASIS_COLUMNS = [
  ["Fiscal Year End", "Fiscal year end"],
  ["Reporting Currency", "Currency"],
  ["Reporting Unit", "Unit"],
  ["Accounting Basis", "Accounting basis"],
  ["Available Periods", "Periods"],
] as const;

/** A cell for the basis line: as written, a stated gap as a gap, nothing for a cited source. */
function basisPart(name: string, text: string | undefined): BasisPart | null {
  const cell = text?.trim() ?? "";
  if (!cell || containsReference(cell)) return null;
  // A cell holding only a dash states nothing: a gap like "Not stated" ("Entity: —").
  return { name, text: readerText(cell), gap: /^(?:not |withheld)|^[\u2014\u2013-]$/i.test(cell) };
}

/** Currency and unit read as one part, drawn as the currency's symbol ("$m"), where both are stated. */
function joinMoney(parts: BasisPart[]) {
  const currency = parts.find(({ name, gap }) => name === "Currency" && !gap);
  const unit = parts.find(({ name, gap }) => name === "Unit" && !gap);
  if (!currency || !unit) return parts;
  return parts.flatMap((part) =>
    part === currency
      ? [{ ...part, text: unitLabel(`${currency.text} ${unit.text}`) }]
      : part === unit
        ? []
        : [part],
  );
}

function entityBasis(entry: OutputEntry): Basis {
  const key = entry.sections.find((section) => /entity period key/i.test(section.heading));
  const table = key?.blocks.find((block): block is Table => block.type === "table");
  const row = table?.rows[0];
  if (!table || !row) return null;
  const at = (header: string) =>
    row.cells[table.headers.findIndex((name) => name.trim() === header)];
  const parts = joinMoney(
    BASIS_COLUMNS.flatMap(([header, name]) => basisPart(name, at(header)) ?? []),
  );
  if (!parts.length) return null;
  const entity = basisPart("Entity", at("Entity Name") ?? row.cells[0]);
  return {
    kind: "entity",
    entity: entity && !entity.gap ? entity.text : "",
    // An entity the key does not state is a gap cell like the others: "Entity: Not stated".
    parts: entity?.gap ? [entity, ...parts] : parts,
    entities: table.rows.length,
    line: key?.line ?? table.line,
  };
}

/**
 * The basis of the module's figures as its handoff states it: the first reporting entity of the
 * entity period key, named, with each of its cells as written or as the gap it states; else the
 * periods of its Period table.
 */
function basisOf(entry: OutputEntry): Basis {
  const stated = entityBasis(entry);
  if (stated) return stated;
  const periods = namedTable(entry, "Period table", ["Period", "Start", "End"]);
  const names =
    periods?.rows.flatMap(({ cells }) => {
      const part = basisPart("Period", cells[0]);
      return part && !part.gap ? [part.text] : [];
    }) ?? [];
  return names.length ? { kind: "periods", periods: names } : null;
}

/**
 * The parts of a module page, from its handoff: the bottom line, the three prose passages, the
 * other reader sections drawn as prose, the visuals it stated it could not draw, the passages it
 * owes but did not write, and the basis of its figures. `typedTables` is false when the module's
 * lead draws its figures, so its typed tables are left to the records region.
 */
export function moduleFrame(
  entry: OutputEntry,
  {
    figureTableLines = [],
    typedTables = true,
  }: { figureTableLines?: readonly number[]; typedTables?: boolean } = {},
) {
  const slots = passages(entry.sections);
  const slotLines = new Set(slots.map(({ line }) => line));
  const roles = new Map(
    classifySections(entry.sections).map(({ section, role }) => [section.line, role]),
  );
  const found = findingBlocks(entry.sections, entry, figureTableLines).filter(
    (section) => roles.get(section.line) !== "drawing",
  );
  const slot = (name: string) =>
    found.find((section) => section.heading === name && slotLines.has(section.line));
  // A passage the module wrote but with no paragraph to read (only its Basis, only a table) is
  // hollow: drawn as what it holds, never as a passage the handoff lacks.
  const hasText = (section: Section) =>
    section.blocks.some((block) => block.type === "text" && readable(block));
  const passage = (name: string) => {
    const section = slot(name);
    return section && hasText(section) ? section : undefined;
  };
  const hollow = (name: string) => {
    const section = slot(name);
    return section && !hasText(section) ? section : undefined;
  };
  const named = PASSAGE_NAMES.flatMap((name) => slot(name) ?? []);
  // Every passage slot is drawn as its passage or its gap; none is drawn a second time.
  const prose = found
    .filter((section) => !slotLines.has(section.line))
    .flatMap(
      (section) => proseSection(entry, section, roles.get(section.line) ?? "", typedTables) ?? [],
    );
  const charts = drawingLines(entry, figureTableLines);
  const charted = slots
    .filter((section) => section.blocks.some((block) => charts.has(block.line)))
    .map((section) => section.heading);
  const bottomLine = bottomLineOf(entry, passage("Bottom line"));
  const drawn = [...named.map(({ heading }) => heading), ...charted];
  return {
    bottomLine,
    keyFindings: passage(KEY_FINDINGS),
    contrary: passage(CONTRARY),
    limitations: passage(LIMITATIONS),
    hollow: Object.fromEntries(
      PASSAGE_NAMES.flatMap((name) => {
        const section = hollow(name);
        return section ? [[name, section] as const] : [];
      }),
    ) as Partial<Record<(typeof PASSAGE_NAMES)[number], Section>>,
    prose,
    drawingGaps: drawingGaps(entry),
    basis: basisOf(entry),
    missing: missingPassages(entry, bottomLine ? [...drawn, "Bottom line"] : drawn),
    parseError: entry.output.parseError,
  };
}
