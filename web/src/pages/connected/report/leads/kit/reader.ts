import { containsReference, readerText } from "../../../publishedReport";

// Words that cite a filing in a context where the caller is already looking for a source.
const FILING = /\b(?:Form\s+)?10-?[KQ]\b|\bannual report\b|\bprospectus\b|^\s*Sources?\s*:/i;

// A whole-cell filing title or section locator. Bare amounts such as 10K can be findings.
const FILING_LOCATOR =
  /^(?:the\s+)?(?:(?:annual|quarterly)\s+)?(?:Form\s+10-?[KQ]|10-[KQ])(?:,?\s+(?:(?:(?:balance sheet and )?[\w-]+\s+)?note(?:\s+\d+[A-Z]?)?|non-GAAP reconciliation))?\.?$/i;

/** True when handoff text cites a source: a file, page, register, calculation or a named filing. */
export const citesSource = (text: string) => namesSource(text) || FILING.test(text);

/**
 * The text's clauses and sentences, cut at a ";" or "." followed by a space, but never after a page
 * abbreviation that a page number follows ("p. 120", "pp. 3-4", "pg. 9", any case), so a page
 * locator stays whole and is still read as one. The abbreviation is a whole word: "S&P.", "L.P."
 * and a percentage-point "0.4 pp." before a word still end their clause (S15-5-2). Empty pieces are
 * dropped.
 */
export const clauses = (text: string) =>
  text
    .trim()
    .split(/(?<=[;.])(?<!(?<![\w&.])(?:pp?|pg)\.(?=\s+\d))\s+/i)
    .filter(Boolean);

/** What a working page says in place of handoff text that names a source or a register entry. */
export const IN_EVIDENCE = "Detail is in Evidence.";

// Register and calculation identifiers the library's own `containsReference` does not catch: `T4.4`,
// `T5B.5`, `T1D.2`, `TL10.1`, a calculation or driver id (`C07`, `D14`), the words "calculation C07".
const IDENTIFIER = /\bT[A-Z]*\d+[A-Z]?\.\d+\b|\b[CD]\d{2}\b|\bcalculations? [A-Z]\d+\b/;

// Evidence ID families match publishedReport's bracket grammar. Financial labels such as
// [FY26E], [CET1], and [H1] remain in the reader text.
const ID = String.raw`(?:[CDEGKRS]\d+(?:\.[A-Za-z]?\d+)*[A-Za-z]?|T[A-Z0-9]{0,5}\.\d+(?:\.[A-Za-z]?\d+)*[A-Za-z]?)`;
const JOIN = String.raw`(?:\s*[,;/–-]\s*(?:(?:and|or)\s+)?|\s+(?:and|or)\s+)`;
const CITATIONS = new RegExp(String.raw`^\s*(?:see\s+)?${ID}(?:${JOIN}${ID})*\s*$`);
// A dash stays inside a list item so that periods and ranges such as S1-2025 and 1.0x–1.25x
// stay whole. A slash with digits on both sides, ignoring spaces, can belong to a date or ratio.
const LIST_JOIN = /(\s*(?:[,;]|(?<!\d\s*)\/|\/(?!\s*\d))\s*(?:(?:and|or)\s+)?|\s+(?:and|or)\s+)/;

function stripBracket(bracket: string, space: string, body: string) {
  if (CITATIONS.test(body)) return "";
  const parts = body.split(LIST_JOIN);
  const kept: string[] = [];
  let removed = false;
  for (let index = 0; index < parts.length; index += 2) {
    const item = parts[index] ?? "";
    if (CITATIONS.test(item)) {
      removed = true;
      continue;
    }
    if (kept.length) kept.push(parts[index - 1] ?? "");
    kept.push(item);
  }
  return removed ? `${space}[${kept.join("").trim()}]` : bracket;
}

/** Remove inline citations while keeping the meaningful items in a bracket list. */
const withoutMarkers = (text: string) =>
  text
    .replace(/(\s*)\[([^\][]*)\]/g, stripBracket)
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

const hasReference = (text: string) => containsReference(text) || IDENTIFIER.test(text);

/**
 * True when the text names a source, a register entry or a calculation: it belongs in Evidence.
 * Inline markers are not counted: they are stripped before the text is drawn.
 */
export const namesSource = (text: string) => hasReference(withoutMarkers(text));

/**
 * Handoff text for a working page: reader wording with module codes as names and inline markers
 * (`[E3]`) stripped, or "Detail is in Evidence." when it names a source. Every handoff sentence a
 * lead draws goes through this.
 */
export function safeText(text: string, pathway?: string | null) {
  const bare = withoutMarkers(text);
  return hasReference(bare) || FILING_LOCATOR.test(bare) ? IN_EVIDENCE : readerText(bare, pathway);
}

/** A stated gap's reason as drawn: "—" for a cell the source left as a dash ("source dash"), else `safeText`. */
export const reasonText = (reason: string) =>
  /^source dash$/i.test(reason.trim()) ? "—" : safeText(reason);
