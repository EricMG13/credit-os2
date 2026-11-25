import type { OutputEntry } from "../../publishedReport";
import { IN_EVIDENCE, namesSource, safeText } from "./kit/reader";
import { allTables, columnOf, tableWith } from "./kit/tables";

/** The mark a row's state is drawn with; `other` is any word the page does not know, drawn neutral. */
export type ReadinessMark = "ready" | "limited" | "conditional" | "blocked" | "other";

export const MARKS: readonly ReadinessMark[] = [
  "ready",
  "limited",
  "conditional",
  "blocked",
  "other",
];

type Word = { word: string; mark: ReadinessMark };

/**
 * The states the handoff contract writes, and the library's words for them. "Not ready" stays "Not
 * ready" and "Blocked" stays "Blocked": both are drawn with the same slash mark, neither is renamed.
 */
const KNOWN: Record<string, Word> = {
  READY: { word: "Ready", mark: "ready" },
  READY_WITH_LIMITATIONS: { word: "Ready with limitations", mark: "limited" },
  READY_WITH_LIMITATION: { word: "Ready with limitations", mark: "limited" },
  CONDITIONAL: { word: "Conditional", mark: "conditional" },
  BLOCKED: { word: "Blocked", mark: "blocked" },
  NOT_READY: { word: "Not ready", mark: "blocked" },
};

/** A readiness cell as the handoff wrote it; a word the page does not know is drawn as written. */
export function readinessWord(cell: string | undefined): Word {
  const text = (cell ?? "").replaceAll("*", "").trim();
  const key = text.toUpperCase().replace(/[\s-]+/g, "_");
  const known = Object.hasOwn(KNOWN, key) ? KNOWN[key] : undefined;
  if (known) return known;
  return { word: safeText(text) || "Not read", mark: "other" };
}

const REASON_IN_EVIDENCE = "Reason is in Evidence.";
const NO_LIMITATION = "This page could not read a limitation for this area.";

export type ReadinessRow = {
  area: string;
  /** The state as written. */
  word: string;
  mark: ReadinessMark;
  /** The free-text limitation in words; the Evidence pointer where it names a source. */
  reason: string;
  /** The command's own hold words (without its syntax), or null when the table holds nothing back. */
  hold: string | null;
  line: number;
};

export type SourceReadiness =
  | { kind: "absent" }
  | {
      kind: "ready";
      line: number;
      /** The handoff's own name for the free-text column. */
      reasonHeader: string;
      rows: ReadinessRow[];
      /** Whether a table of the entry could carry the key evidence located or the conflicts. */
      hasEvidenceTable: boolean;
    };

const readable = (text: string, fallback: string) => safeText(text) || fallback;

/** A header that could hold the key evidence located or the conflicts and duplicates. */
const evidenceHeader = (header: string) => /evidence|conflict|duplicate/i.test(header);

/**
 * The handoff's two shapes of readiness table. `Area | Readiness | Key limitation` is the contract's;
 * `Consumer | Readiness | … | Bounded limitations carried | Command` is what a real run wrote
 * (TransDigm, retained reviews). The earlier real run named its consumer column `Canonical consumer`
 * and its free-text column `Evidence demand and available support`.
 */
const SHAPES = [
  { area: "Area", reason: "Key limitation" },
  { area: "Consumer", reason: "Bounded limitations carried" },
  { area: "Canonical consumer", reason: "Evidence demand and available support" },
] as const;

function readinessTable(entry: OutputEntry) {
  for (const shape of SHAPES) {
    const table = tableWith(entry, [shape.area, "Readiness", shape.reason]);
    if (table) return { table, ...shape };
  }
  return null;
}

const HOLD = /\bDO NOT RUN\b/i;
const CONNECTIVE = /^(?:until|pending|unless|while|awaiting|after|when)\b/i;

/**
 * What the command column holds back, in its own words: the cell with the command token taken out
 * ("DO NOT RUN until a prior deliverable is supplied" gives "On hold until a prior deliverable is
 * supplied"); "On hold" alone when nothing else is said. A cell that does not say DO NOT RUN holds nothing.
 */
function holdOf(command: string | undefined) {
  if (!command || !HOLD.test(command)) return null;
  const said = safeText(command.replace(HOLD, "").replace(/^[\s:;,.\u2013\u2014-]+/, ""));
  if (!said || said === IN_EVIDENCE) return "On hold";
  return CONNECTIVE.test(said) ? `On hold ${said}` : `On hold: ${said}`;
}

/** The readiness table as rows, or why there is nothing to draw. */
export function sourceReadiness(entry: OutputEntry): SourceReadiness {
  const found = readinessTable(entry);
  if (!found || found.table.rows.length === 0) return { kind: "absent" };
  const { table } = found;
  const [area, readiness, limitation, command] = [
    found.area,
    "Readiness",
    found.reason,
    "Command",
  ].map((name) => columnOf(table, name));
  const rows = table.rows.map((row): ReadinessRow => {
    const text = row.cells[limitation ?? -1] ?? "";
    return {
      area: readable(row.cells[area ?? -1] ?? "", IN_EVIDENCE),
      ...readinessWord(row.cells[readiness ?? -1]),
      reason: namesSource(text) ? REASON_IN_EVIDENCE : readable(text, NO_LIMITATION),
      hold: holdOf(row.cells[command ?? -1]),
      line: row.line,
    };
  });
  const hasEvidenceTable = allTables(entry).some(
    ({ table: other }) => other !== table && other.headers.some(evidenceHeader),
  );
  return { kind: "ready", line: table.line, reasonHeader: found.reason, rows, hasEvidenceTable };
}
