import { readerText, type OutputEntry, type Row, type Table } from "../../publishedReport";
import { bottomLine } from "../overview/read";
import { readCell } from "./kit/numbers";
import { IN_EVIDENCE, namesSource, reasonText, safeText as readerSafe } from "./kit/reader";
import { allTables } from "./kit/tables";

/** A handoff's words for a working page; null when they name a source (the trace control has it). */
function safeText(text: string): string | null {
  const words = readerSafe(text);
  return text.trim() === "" || words === IN_EVIDENCE ? null : words;
}

/** One cell as a lead may draw it: words, the handoff's stated gap, a source citation, or nothing. */
export type Said =
  | { kind: "text"; text: string }
  | { kind: "gap"; reason: string }
  | { kind: "evidence" }
  | { kind: "empty" };

export function said(cell: string | undefined): Said {
  const text = (cell ?? "").trim();
  if (text === "") return { kind: "empty" };
  const reading = readCell(text);
  if (reading.kind === "gap") return { kind: "gap", reason: reasonText(reading.reason) };
  const words = readerSafe(text);
  if (words === "") return { kind: "empty" };
  return words === IN_EVIDENCE ? { kind: "evidence" } : { kind: "text", text: words };
}

/** The words of a `Said` as a table view writes them. */
export function saidText(value: Said): string {
  if (value.kind === "text") return value.text;
  if (value.kind === "gap") return `Not supplied: ${value.reason}`;
  return value.kind === "evidence" ? IN_EVIDENCE : "";
}

export type Located = { state: "found"; table: Table } | { state: "absent" | "duplicate" };

/** The one table of the entry carrying all these headers, or why there is none. Never by heading. */
export function locate(entry: OutputEntry, headers: readonly string[]): Located {
  const found = allTables(entry).filter(({ table }) =>
    headers.every((name) => table.headers.includes(name)),
  );
  const [only] = found;
  if (found.length > 1) return { state: "duplicate" };
  return only ? { state: "found", table: only.table } : { state: "absent" };
}

export const cellAt = (table: Table, row: Row, header: string) =>
  row.cells[table.headers.indexOf(header)];

// ---------------------------------------------------------------------------------------------
// Severity

export type Severity = {
  /** The word as the handoff wrote it (Critical, Material and Minor in their one spelling). */
  word: string;
  /** Exactly Critical, Material or Minor; any other word is drawn as written with a neutral mark. */
  known: boolean;
  stated: boolean;
};

const KNOWN_SEVERITY = ["Critical", "Material", "Minor"] as const;

function severityOf(cell: string | undefined): Severity {
  const value = said(cell);
  if (value.kind !== "text") return { word: "Severity not stated", known: false, stated: false };
  const known = KNOWN_SEVERITY.find((word) => word === value.text);
  return { word: value.text, known: known !== undefined, stated: true };
}

// ---------------------------------------------------------------------------------------------
// The two issue registers

export type Issue = {
  kind: "gap" | "contradiction";
  severity: Severity;
  line: number;
  /** What the issue is: the gap's or the contradiction's own cell. */
  text: Said;
  /** Why it matters (gaps) or the rationale (contradictions). */
  why: Said;
  /** Gaps register only. */
  action: Said | null;
  affected: string[] | "evidence" | null;
};

type Register =
  | { state: "rows"; issues: Issue[]; line: number }
  | { state: "none"; reason: string | null; line: number }
  | { state: "absent" | "duplicate" };

const GAP_HEADERS = ["Gap", "Why it matters", "Affected modules", "Severity", "Action"];
const CONTRADICTION_HEADERS = ["Contradiction", "Claims", "Nature", "Severity", "Rationale"];

const NOTHING = /^(?:none|—|-|–)$/i;

/** The handoff's own empty row: first cell `None`, every other cell `None`, a dash, a gap or empty. */
function noneRow(row: Row) {
  const [first = "", ...rest] = row.cells;
  return (
    first.trim().toLowerCase() === "none" &&
    rest.every((cell) => ["gap", "empty"].includes(said(cell).kind) || NOTHING.test(cell.trim()))
  );
}

const reasonOf = (row: Row) => {
  const gap = row.cells.map(said).find((cell) => cell.kind === "gap");
  return gap?.kind === "gap" ? gap.reason : null;
};

function affectedOf(cell: string | undefined): Issue["affected"] {
  const text = (cell ?? "").trim();
  if (text === "" || readCell(text).kind === "gap") return null;
  if (namesSource(text)) return "evidence";
  return text
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .map(readerText);
}

function readRegister(entry: OutputEntry, headers: string[], kind: Issue["kind"]): Register {
  const found = locate(entry, headers);
  if (found.state !== "found") return found;
  const { table } = found;
  const rows = table.rows.filter((row) => !noneRow(row));
  const [none] = table.rows.filter(noneRow);
  if (rows.length === 0)
    return { state: "none", reason: none ? reasonOf(none) : null, line: table.line };
  return {
    state: "rows",
    line: table.line,
    issues: rows.map((row) => ({
      kind,
      severity: severityOf(cellAt(table, row, "Severity")),
      line: row.line,
      text: said(cellAt(table, row, kind === "gap" ? "Gap" : "Contradiction")),
      why: said(cellAt(table, row, kind === "gap" ? "Why it matters" : "Rationale")),
      action: kind === "gap" ? said(cellAt(table, row, "Action")) : null,
      affected: kind === "gap" ? affectedOf(cellAt(table, row, "Affected modules")) : null,
    })),
  };
}

type Group = { severity: Severity; issues: Issue[] };

export type Issues = {
  gaps: Register;
  contradictions: Register;
  /**
   * One group per severity word as written, in the order each word first appears in the handoff
   * (the register that comes first in the handoff first, then its rows in order); the issues of a
   * group are its rows. No ranking of our own, and no count is drawn from these.
   */
  groups: Group[];
  total: number;
  /** The reasons stated by a synthetic `Item | Value` register placeholder, when there is one. */
  placeholders: string[];
};

/**
 * `Item | Value` registers that only say `Not supplied: …`: the synthetic shape. They are no issue
 * register; their reason is shown, and no count is drawn from them.
 */
function placeholderReasons(entry: OutputEntry) {
  const reasons = allTables(entry).flatMap(({ heading, table }) => {
    const [row] = table.rows;
    const [label, value] = table.headers;
    if (table.headers.length !== 2 || label !== "Item" || value !== "Value") return [];
    if (!/register/i.test(heading) || table.rows.length !== 1 || !row) return [];
    const stated = said(row.cells[1]);
    return stated.kind === "gap" ? [stated.reason] : [];
  });
  return [...new Set(reasons)];
}

const lineOf = (register: Register) => ("line" in register ? register.line : Infinity);

export function issues(entry: OutputEntry): Issues {
  const gaps = readRegister(entry, GAP_HEADERS, "gap");
  const contradictions = readRegister(entry, CONTRADICTION_HEADERS, "contradiction");
  // The handoff's own order: the register written first comes first, then each severity word where
  // it first appears. No ranking of our own.
  const listed = [gaps, contradictions]
    .sort((a, b) => Number(lineOf(a) > lineOf(b)) - Number(lineOf(a) < lineOf(b)))
    .flatMap((register) => (register.state === "rows" ? register.issues : []));
  const words = new Map<string, Group>();
  for (const issue of listed) {
    const key = issue.severity.word;
    const group = words.get(key) ?? { severity: issue.severity, issues: [] };
    group.issues.push(issue);
    words.set(key, group);
  }
  return {
    gaps,
    contradictions,
    groups: [...words.values()],
    total: listed.length,
    placeholders: placeholderReasons(entry),
  };
}

/** The gaps register's actions in the handoff's own order. */
export function remediation(entry: OutputEntry) {
  const { gaps } = issues(entry);
  return gaps.state === "rows" ? gaps.issues : null;
}

// ---------------------------------------------------------------------------------------------
// Clearance verdict

export type Shape = "filled" | "half" | "slash" | "ring";

export type Clearance = {
  /** The status as the verdict row wrote it, without the "over the evaluated set" scope. */
  status: string | null;
  scope: string | null;
  notEvaluated: string | null;
  limit: string | null;
  shape: Shape | null;
  source: "verdict" | "bottom line";
  line: number;
};

const SCOPE_SUFFIX = /\s+over the evaluated set\s*\.?$/i;

/** Only the module's own status words get a mark; any other wording is drawn as written, neutral. */
function shapeOf(status: string): Shape {
  const word = status.trim().toLowerCase();
  if (word === "accepted" || word === "cleared") return "filled";
  if (word === "restricted") return "half";
  if (["blocked", "rejected", "refused"].includes(word)) return "slash";
  return "ring";
}

/** The verdict table: `Item | Value` carrying a `Status` row. More than one such table: none. */
function verdictRows(entry: OutputEntry) {
  const found = allTables(entry).filter(
    ({ table }) =>
      table.headers.length === 2 &&
      table.headers[0] === "Item" &&
      table.headers[1] === "Value" &&
      table.rows.some((row) => (row.cells[0] ?? "").trim() === "Status"),
  );
  const [only] = found;
  return found.length === 1 && only ? only.table : null;
}

const row = (table: Table, label: string) =>
  table.rows.find((candidate) => (candidate.cells[0] ?? "").trim() === label);

/** The clearance as the verdict states it; else the module's first bottom-line sentence; else null. */
export function clearance(entry: OutputEntry): Clearance | null {
  const verdict = verdictRows(entry);
  const status = verdict && row(verdict, "Status");
  const stated = status && said(status.cells[1]);
  if (verdict && status && stated?.kind === "text") {
    const word = stated.text.replace(SCOPE_SUFFIX, "").trim();
    const detail = (label: string) => {
      const value = said(row(verdict, label)?.cells[1]);
      return value.kind === "text" ? value.text : null;
    };
    const outside = detail("Not evaluated");
    return {
      status: word === "" ? stated.text : word,
      scope: SCOPE_SUFFIX.test(stated.text) ? "over the evaluated set" : null,
      notEvaluated: outside !== null && outside.toLowerCase() !== "none" ? outside : null,
      limit: detail("Scope"),
      shape: shapeOf(word),
      source: "verdict",
      line: status.line,
    };
  }
  const [first] = bottomLine(entry);
  const opening = first?.text ? safeText(first.text) : null;
  if (first && opening) {
    // The paragraph whole: sentences are never cut ("the U.S. notes" is not a sentence end).
    return {
      status: opening,
      scope: null,
      notEvaluated: null,
      limit: null,
      shape: null,
      source: "bottom line",
      line: first.line,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Module integrity

export type ModuleIntegrity = {
  name: string;
  head: string | null;
  result: string;
  shape: Shape;
  line: number;
};

/** The three results the module writes get a mark; any other wording is drawn as written, neutral. */
function resultShape(result: string): Shape {
  const word = result.trim().toLowerCase();
  if (word === "evaluated: no finding") return "filled";
  if (word === "evaluated with findings") return "half";
  if (word === "blocked upstream: not evaluated") return "slash";
  return "ring";
}

/** "blocked (up the input chain)" as a phrase: the inner brackets read as words, never nested. */
const unbracket = (text: string) =>
  text
    .replace(/\s*[([]([^()[\]]*)[)\]]/g, " $1")
    .replace(/\s{2,}/g, " ")
    .trim();

export function moduleIntegrity(entry: OutputEntry): ModuleIntegrity[] | null {
  const found = locate(entry, ["Module", "Head status", "CP-5 findings", "Result"]);
  if (found.state !== "found" || found.table.rows.length === 0) return null;
  const { table } = found;
  return table.rows.map((item) => {
    const result = said(cellAt(table, item, "Result"));
    const head = said(cellAt(table, item, "Head status"));
    const written = result.kind === "text" ? result.text : saidText(result) || "Not stated";
    return {
      name: saidText(said(cellAt(table, item, "Module"))) || "A module",
      head: head.kind === "text" ? unbracket(head.text) : null,
      result: written,
      shape: result.kind === "text" ? resultShape(written) : "ring",
      line: item.line,
    };
  });
}
