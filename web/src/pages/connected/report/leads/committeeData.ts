import { readParagraph, type OutputEntry } from "../../publishedReport";
import { cellAt, locate, said, saidText, type Said } from "./validationData";

// ---------------------------------------------------------------------------------------------
// Stance

export type Conditions = { kind: "list"; items: Said[] } | { kind: "gap"; reason: string } | null;

export type Stance =
  | {
      state: "stated";
      /** The action bias exactly as the handoff states it. */
      word: string;
      /** The confidence as stated, or null when the handoff gives none. */
      confidence: string | null;
      source: "table" | "sentence";
      conditions: Conditions;
      line: number;
    }
  | { state: "gap"; reason: string | null };

const SENTENCE =
  /^Action bias: ([A-Za-z][A-Za-z ]*[A-Za-z]) \(confidence ([A-Za-z][A-Za-z ]*[A-Za-z])\)\./;

/** The module's one-sentence stance ("Final Action Bias: Requires More Work. …"); it states no confidence. */
const FINAL_BIAS = /^Final Action Bias:\s*([^.]*[^.\s])\./i;

/** The Conditions cell as written: one item per cell, never split into parts. */
function conditionsOf(cell: string | undefined): Conditions {
  const value = said(cell);
  if (value.kind === "gap") return { kind: "gap", reason: value.reason };
  if (value.kind === "empty" || (value.kind === "text" && /^none stated$/i.test(value.text)))
    return null;
  return { kind: "list", items: [value] };
}

function sentenceStance(entry: OutputEntry): Stance | null {
  for (const { blocks } of entry.sections) {
    for (const block of blocks) {
      if (block.type !== "text") continue;
      const body = readParagraph(block.text).body.replaceAll("**", "");
      const match = SENTENCE.exec(body);
      const final = match ? null : FINAL_BIAS.exec(body);
      if (final?.[1])
        return {
          state: "stated",
          word: final[1],
          confidence: null,
          source: "sentence",
          conditions: null,
          line: block.line,
        };
      if (match?.[1] && match[2])
        return {
          state: "stated",
          word: match[1],
          confidence: match[2],
          source: "sentence",
          conditions: null,
          line: block.line,
        };
    }
  }
  return null;
}

/** The action bias and confidence as written: the Final-bias table, else the challenge sentence. */
export function stance(entry: OutputEntry): Stance {
  const found = locate(entry, ["Action bias", "Rationale", "Conditions", "Confidence"]);
  if (found.state === "found") {
    const { table } = found;
    const [row] = table.rows;
    if (table.rows.length === 1 && row) {
      const word = said(cellAt(table, row, "Action bias"));
      const confidence = said(cellAt(table, row, "Confidence"));
      if (word.kind === "text")
        return {
          state: "stated",
          word: word.text,
          confidence: confidence.kind === "text" ? confidence.text : null,
          source: "table",
          conditions: conditionsOf(cellAt(table, row, "Conditions")),
          line: row.line,
        };
      return { state: "gap", reason: word.kind === "gap" ? word.reason : null };
    }
  }
  return sentenceStance(entry) ?? { state: "gap", reason: null };
}

// ---------------------------------------------------------------------------------------------
// Bull against bear ledger

export type LedgerRow = {
  line: number;
  /** The challenged point: the CP-2 row the module cross-examined, as it wrote it. */
  point: Said;
  evidenceFor: Said;
  counterCase: Said;
  evidenceAgainst: Said;
  wouldChange: Said;
};

export type Ledger =
  | { state: "rows"; rows: LedgerRow[]; line: number }
  | { state: "none"; reason: string | null }
  | { state: "absent" | "duplicate" };

const LEDGER_HEADERS = [
  "CP-2 row",
  "Counter-case",
  "Evidence for",
  "Evidence against",
  "What would change the view",
];

/** The handoff's own empty row: every cell a stated gap, empty, or `None`. */
const isNoneRow = (cells: string[]) =>
  cells.every(
    (cell) => ["gap", "empty"].includes(said(cell).kind) || cell.trim().toLowerCase() === "none",
  );

export function ledger(entry: OutputEntry): Ledger {
  const found = locate(entry, LEDGER_HEADERS);
  if (found.state !== "found") return found;
  const { table } = found;
  const real = table.rows.filter((row) => !isNoneRow(row.cells));
  if (real.length === 0) {
    const [none] = table.rows;
    const gap = none?.cells.map(said).find((cell) => cell.kind === "gap");
    return { state: "none", reason: gap?.kind === "gap" ? gap.reason : null };
  }
  return {
    state: "rows",
    line: table.line,
    rows: real.map((row) => ({
      line: row.line,
      point: said(cellAt(table, row, "CP-2 row")),
      evidenceFor: said(cellAt(table, row, "Evidence for")),
      counterCase: said(cellAt(table, row, "Counter-case")),
      evidenceAgainst: said(cellAt(table, row, "Evidence against")),
      wouldChange: said(cellAt(table, row, "What would change the view")),
    })),
  };
}

export const ledgerCells = (row: LedgerRow) => [
  saidText(row.point),
  saidText(row.evidenceFor),
  saidText(row.counterCase),
  saidText(row.evidenceAgainst),
  saidText(row.wouldChange),
];
