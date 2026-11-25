import { containsReference } from "../../publishedReport";
import type { SourceTable } from "../../visuals/visualData";
import type { Cell } from "./figureData";
import { Reason, readerReason } from "./reason";

/**
 * A note a figure draws: an optional lead the page writes ("FY2027: "), then the module's words,
 * closed with `end` when the page composed the sentence. `line` is where the handoff wrote them.
 */
export type Note = { lead?: string; text: string; line?: number; end?: string };

/** Where a note's reason is read in Evidence, by the handoff line it was written on. */
export type NoteHref = (line?: number) => string | undefined;

const sentence = (words: string, end: string) =>
  end && !/[.!?]$/.test(words) ? words + end : words;

/** One note: the lead and the module's words as one sentence, or the lead and a link to Evidence. */
export function NoteText({ note, href }: { note: Note; href: NoteHref }) {
  const words = readerReason(note.text);
  if (words !== null) return <>{`${note.lead ?? ""}${sentence(words, note.end ?? "")}`}</>;
  return (
    <>
      {note.lead}
      <Reason text={note.text} href={href(note.line)} />
    </>
  );
}

/** The notes under a figure, each through the reader rule, set apart by a hairline. */
export function ReasonNotes({ notes, href }: { notes: readonly Note[]; href: NoteHref }) {
  if (!notes.length) return null;
  return (
    <ul className="flex flex-col gap-1.5 border-t border-border-hairline pt-3 text-caption font-normal text-text-secondary">
      {notes.map((note, at) => (
        <li key={at} className="wrap-anywhere">
          <NoteText note={note} href={href} />
        </li>
      ))}
    </ul>
  );
}

/** A trailing bracketed citation: " (credit_agreement.pdf page 3)", " [E3]", " (CP-4-CALC-01)". */
const TRAILING = /\s*(\([^()]*\)|\[[^\]]*\])$/;
const CITED = (text: string) => containsReference(text) || /^[([]\s*CP-[A-Z0-9]+-/i.test(text);

/**
 * A label or cell a tile draws, through the reader rule: a trailing citation set aside, the rest
 * as `readerReason` reads it; null when what is left still cites a source.
 */
export function readerCell(text: string): string | null {
  let rest = text.trim();
  for (let match = TRAILING.exec(rest); match && CITED(match[1] ?? ""); match = TRAILING.exec(rest))
    rest = rest.slice(0, match.index).trimEnd();
  return readerReason(rest);
}

const TRAILING_LINK = /\s+(?:per|see|from|in|at|on|of|for|and|by|-|–|—)$/i;

/**
 * The readable words of a name that cites a source: the longest leading run of its words the
 * reader rule draws, without a dangling "per" or "see". Null when no word can be drawn.
 */
export function readableWords(text: string): string | null {
  const whole = readerCell(text);
  if (whole !== null) return whole;
  const words = text.trim().split(/\s+/);
  for (let count = words.length - 1; count > 0; count -= 1) {
    const lead = words
      .slice(0, count)
      .join(" ")
      .replace(TRAILING_LINK, "")
      .replace(/[\s,;:(]+$/, "");
    const drawn = lead && readerCell(lead);
    if (drawn) return drawn;
  }
  return null;
}

/** A stated figure's cell as drawn: through the reader rule, else its leading figure alone. */
export const figureText = (text: string) => readerCell(text) ?? text.trim().split(/\s+/)[0] ?? "";

/** A label as drawn: through the reader rule, else what it names, held in Evidence. */
export const labelText = (text: string, what: string) =>
  readerCell(text) ?? `${what} named in Evidence`;

const GAP_WORD = /^(Not (?:supplied|calculated))\b/;
const SHORT_WORD = 16;

/**
 * The word a cell with no figure is drawn with: the module's "Not supplied" or "Not calculated";
 * a short word of its own ("n.m."); "Not supplied" for an empty cell; otherwise "No figure", its
 * words then drawn as its reason.
 */
export function gapWord(text: string) {
  const trimmed = text.trim();
  const stated = GAP_WORD.exec(trimmed)?.[1];
  if (stated) return stated;
  if (!trimmed) return "Not supplied";
  const words = readerCell(trimmed);
  return words !== null && words === trimmed && words.length <= SHORT_WORD ? words : "No figure";
}

/** The gap word as a reading says it mid-sentence: "not calculated", "no figure", "n.m.". */
export const gapReading = (text: string) => {
  const word = gapWord(text);
  return GAP_WORD.test(word) || word === "No figure" ? word.toLowerCase() : word;
};

/** The words a cell with no figure stands for, beyond its gap word; null when the word is all. */
export function gapText(cell: Cell) {
  if (cell.reason) return cell.reason;
  const trimmed = cell.text.trim();
  if (!trimmed) return "No value stated";
  return gapWord(trimmed) === trimmed ? null : trimmed;
}

/** Plain notes (a table's own basis notes) as notes with no lead. */
export const plainNotes = (texts: readonly string[]): Note[] => texts.map((text) => ({ text }));

/** The table's own notes on its basis, each once, at the first row that states it. One that cites
 * a source is a link to Evidence. */
export function basisNoteList(table: SourceTable): Note[] {
  const column = table.headers.findIndex((header) => /^Basis and limitation$/i.test(header));
  if (column < 0) return [];
  const seen = new Set<string>();
  return table.rows.flatMap((row, at) => {
    const text = (row[column] ?? "").trim();
    if (!text || seen.has(text)) return [];
    seen.add(text);
    return [{ text, line: table.rowLines?.[at] }];
  });
}
