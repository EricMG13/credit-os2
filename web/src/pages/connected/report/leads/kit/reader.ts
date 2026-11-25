import { containsReference, readerText } from "../../../publishedReport";

/** What a working page says in place of handoff text that names a source or a register entry. */
export const IN_EVIDENCE = "Detail is in Evidence.";

// Register and calculation identifiers the library's own `containsReference` does not catch: `T4.4`,
// `T5B.5`, `T1D.2`, `TL10.1`, a calculation or driver id (`C07`, `D14`), the words "calculation C07".
const IDENTIFIER = /\bT[A-Z]*\d+[A-Z]?\.\d+\b|\b[CD]\d{2}\b|\bcalculations? [A-Z]\d+\b/;

/** One inline reference id: `E3`, `C07`, `T4.4`, `D14a`. */
const ID = String.raw`[A-Z]{1,3}\d+[A-Za-z]?(?:\.\d+)?`;
/** An inline marker: a square-bracket list of reference ids, `[E3]`, `[E12, E14]`, `[C07; T4.4]`, `[E3–E5]`. */
const MARKER = new RegExp(String.raw`\s*\[${ID}(?:\s*[,;–-]\s*${ID})*\]`, "g");

/** The text without its inline reference markers (`[E3]`, `[E12, E14]`): machinery, never drawn. */
const withoutMarkers = (text: string) =>
  text
    .replace(MARKER, "")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

/**
 * True when the text names a source, a register entry or a calculation: it belongs in Evidence.
 * Inline markers are not counted: they are stripped before the text is drawn.
 */
export const namesSource = (text: string) => {
  const bare = withoutMarkers(text);
  return containsReference(bare) || IDENTIFIER.test(bare);
};

/**
 * Handoff text for a working page: reader wording with module codes as names and inline markers
 * (`[E3]`) stripped, or "Detail is in Evidence." when it names a source. Every handoff sentence a
 * lead draws goes through this.
 */
export function safeText(text: string) {
  const bare = withoutMarkers(text);
  return namesSource(bare) ? IN_EVIDENCE : readerText(bare);
}

/** A stated gap's reason as drawn: "—" for a cell the source left as a dash ("source dash"), else `safeText`. */
export const reasonText = (reason: string) =>
  /^source dash$/i.test(reason.trim()) ? "—" : safeText(reason);
