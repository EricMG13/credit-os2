import { exactDifference } from "../../../signal";

/**
 * One cell of a handoff table, read without ever turning a gap into a number. A number's `text` is
 * plain (no grouping, a hyphen minus) for arithmetic; `written`, present only when the cell writes
 * the number another way than grouping or the minus glyph (an accounting negative, `(12.3)`), is
 * the cell as written, to print.
 */
export type Reading =
  | { kind: "number"; text: string; value: number; written?: string }
  | { kind: "gap"; text: string; reason: string }
  | { kind: "text"; text: string };

const PLAIN = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
/** An accounting negative: a plain unsigned number in brackets, `(12.3)`, `(1,160)`. */
const BRACKETED = /^\((\d+(?:,\d{3})*(?:\.\d+)?)\)$/;
const STATED_GAP = /^Not (?:supplied|calculable|calculated|applicable):\s*(\S.*)$/;

/**
 * A cell as written: a plain number (an accounting negative `(12.3)` is −12.3), a stated gap with
 * its reason, or other words (`n.m.`, `n.a.`, `NM`, `—` stay words as written: never a gap, never
 * zero).
 */
export function readCell(cell: string): Reading {
  const text = cell.trim().replaceAll("−", "-");
  const gap = STATED_GAP.exec(text)?.[1];
  if (gap !== undefined) return { kind: "gap", text: cell.trim(), reason: gap };
  const bracketed = BRACKETED.exec(text)?.[1];
  if (bracketed !== undefined && PLAIN.test(bracketed)) {
    const bare = bracketed.replaceAll(",", "");
    // "(0)" is zero, not a negative zero.
    const plain = Number(bare) === 0 ? bare : `-${bare}`;
    if (Number.isFinite(Number(plain)))
      return { kind: "number", text: plain, value: Number(plain) + 0, written: cell.trim() };
  }
  if (PLAIN.test(text)) {
    const value = Number(text.replaceAll(",", ""));
    // A digit run too long for a number parses to Infinity: not a readable number, so words as written.
    if (Number.isFinite(value)) return { kind: "number", text: text.replaceAll(",", ""), value };
  }
  return { kind: "text", text: cell.trim() };
}

/** The number of a cell, or null for a gap or words. */
export const numberOf = (cell: string | undefined) => {
  const reading = readCell(cell ?? "");
  return reading.kind === "number" ? reading.value : null;
};

/** Thousands grouped and a true minus; decimals exactly as stated. Words and gaps are returned as written. */
export function group(text: string) {
  const reading = readCell(text);
  if (reading.kind !== "number") return reading.text;
  const [whole = "", fraction] = reading.text.replace(/^-/, "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, ",");
  return `${reading.text.startsWith("-") ? "−" : ""}${grouped}${fraction === undefined ? "" : `.${fraction}`}`;
}

/** `current - prior`, exact, or null when either is not a plain number. */
export function difference(current: string, prior: string) {
  const a = readCell(current);
  const b = readCell(prior);
  return a.kind === "number" && b.kind === "number" ? exactDifference(a.text, b.text) : null;
}

const negate = (text: string) => (text.startsWith("-") ? text.slice(1) : `-${text}`);

/**
 * The exact sum of plain numbers; null if any term is not one. For internal checks (does a bridge
 * reconcile?) and drawing positions only: a sum the module did not write is never printed (ruling i).
 */
export function sum(terms: readonly string[]) {
  const [first, ...rest] = terms.map(readCell);
  if (first?.kind !== "number") return null;
  let total: string | null = first.text;
  for (const term of rest) {
    if (term.kind !== "number" || total === null) return null;
    total = exactDifference(total, negate(term.text));
  }
  return total;
}

/** The sign of a plain number text: 1, 0, -1, or null. */
export function signOf(text: string | null) {
  const reading = text === null ? null : readCell(text);
  return reading?.kind === "number" ? Math.sign(reading.value) : null;
}
