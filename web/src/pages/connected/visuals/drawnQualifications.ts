import { containsReference, methodNote, readParagraph } from "../publishedReport";
import { carriesUnreadId, readerReason } from "../report/overview/reason";
import { items, publishedTables, record, word } from "./visualData";

/** What a drawn reason says when it cites a source: the source itself stays in Evidence. */
export const EVIDENCE_REASON = "Reason recorded in model evidence.";

/** One register row id: "T2E.3.r03", "T4.18". */
const ID = String.raw`T[A-Z0-9]*\.\d+(?:\.[A-Za-z0-9]+)*`;
/**
 * A register row id the reader rule does not yet name: "(T2E.3.r03)", "T2E.3.r03", or a bracketed
 * list of ids separated by ",", ";", "and" or "or": "(T4.18; T4.19)", "[T4.18, T4.19]".
 */
const ROW_ID = new RegExp(
  String.raw`[(\[]\s*${ID}(?:(?:\s*[,;]\s*|\s+(?:and|or)\s+)${ID})*\s*[)\]]|\bT[A-Z0-9]*\.\d+\.r\d+\b`,
  "u",
);

/**
 * A cell's recorded reason as a reader sees it: module codes named; a reason that cites a source,
 * a file, a hash or a register id is replaced by the evidence sentence (also when only its body
 * does: the closing Basis line is the trace's and is not judged). No reason stays empty.
 */
export function drawnReason(reason: string) {
  if (!reason.trim()) return "";
  return ROW_ID.test(readParagraph(reason).body)
    ? EVIDENCE_REASON
    : (readerReason(reason) ?? EVIDENCE_REASON);
}

/** What a schedule cell's amount is drawn as when its source cannot be set aside. */
export const EVIDENCE_AMOUNT = "Amount recorded in model evidence.";

/** Longer text is not drawn as an amount; the cap also bounds every scan below. */
const LONGEST_AMOUNT = 160;
/** Citations `containsReference` does not name: register ids, evidence markers, module codes. */
const CITES_CASED =
  /\bT[A-Z0-9]{0,8}\.\d|\bE\d{1,4}[a-z]?\b|\[\s*[A-Z]\d{1,3}\b|【|†|\bCP-[A-Z0-9]/u;
/** Words that, in a schedule cell, only open a source reference. */
const CITES_WORDED = /\bsee\b|\bcf\.|\bsources?\s*:|\bbasis\s*:|\bnote\s+\d{1,3}\b/iu;

/** Whether text cites a source, a file, a page, a register id, a marker or a module code. */
const citesSource = (text: string) =>
  CITES_CASED.test(text) ||
  CITES_WORDED.test(text) ||
  containsReference(text) ||
  carriesUnreadId(text);

const PAGES = String.raw`\d{1,4}(?:\s*[-–]\s*\d{1,4})?`;
const ITEM = [
  String.raw`(?:p\.|page)\s*${PAGES}`,
  String.raw`(?:pp\.|pages)\s*${PAGES}(?:\s*(?:[,;&]|and)\s*${PAGES})*`,
  String.raw`T[A-Z0-9]{0,8}\.\d+(?:\.[A-Za-z0-9]+)*`,
  String.raw`E\d{1,4}[a-z]?`,
].join("|");
/** A bracket's words that are only a citation: a cue, then pages, register ids or markers. */
const PURE = new RegExp(
  String.raw`^\s*(?:(?:[Ss]ee|[Pp]er|cf\.|[Ss]ources?:)\s*)?(?:${ITEM})(?:\s*(?:[,;&]|and)\s*(?:${ITEM}))*\s*$`,
  "u",
);
/**
 * An innermost bracket with the one space before it, where it ends the text or comes before a
 * closing bracket or punctuation: never between two words or figures it would join.
 */
const GROUP =
  /\s?(?:【[^()[\]【】]*】|\(([^()[\]【】]*)\)|\[([^()[\]【】]*)\])(?=$|[.,;:](?=\s|$)|[)\]】])/gu;
/** A word a citation bracket completes: with the bracket gone it would say nothing. */
const DANGLING = /\b(?:per|see|from|in|at|on|by|of|to|cf\.|according to|sources?:?)\s*$/iu;

/**
 * An amount written as text, as a reader sees it: exactly as written when it cites nothing.
 * Otherwise only whole brackets that are nothing but a citation are left out; null (the caller
 * draws EVIDENCE_AMOUNT) when anything else cites, when a left-out bracket completes a word, and
 * for text longer than LONGEST_AMOUNT.
 */
export function drawnAmount(text: string): string | null {
  const whole = text.trim();
  if (!whole || whole.length > LONGEST_AMOUNT) return null;
  if (!citesSource(whole)) return whole;
  const rest = whole
    .replace(
      GROUP,
      (group: string, round: string | undefined, square: string | undefined, at: number) => {
        const inner = round ?? square;
        const pure = inner === undefined || PURE.test(inner);
        // A kept citation bracket still cites, so the check below returns null.
        return pure && !DANGLING.test(whole.slice(0, at)) ? "" : group;
      },
    )
    .trim();
  return rest && !citesSource(rest) ? rest : null;
}

/** One sentence from a drawn reason: ended by a single full stop, never two. */
export const sentence = (text: string) => (/[.!?]$/u.test(text) ? text : `${text}.`);

/** The text blocks of the section that owns the table at `line`, when a chart may draw them. */
export function qualificationBlocks(sections: unknown, line: number) {
  const owners = items(sections)
    .map(record)
    .filter((section) =>
      items(section.blocks).some(
        (block) => record(block).type === "table" && record(block).line === line,
      ),
    );
  const owner = owners.length === 1 ? owners[0] : undefined;
  if (!owner || !word(owner.heading).startsWith("Chart data: ")) return [];
  const blocks = items(owner.blocks).map(record);
  // More than one table makes the scope of the prose ambiguous.
  if (blocks.filter((block) => block.type === "table").length !== 1) return [];
  return blocks.filter(
    (block) =>
      block.type === "text" &&
      typeof block.line === "number" &&
      Number.isSafeInteger(block.line) &&
      block.line > line &&
      !methodNote(word(block.text)),
  );
}

/** Whether the chart shows this body word for word; otherwise it shows a placeholder. */
export function chartDrawsVerbatim(body: string) {
  return body !== "" && !containsReference(body) && !/\bCP-[A-Z0-9]+\b/u.test(body);
}

/**
 * The chart descriptors (`charts` and `chartGaps`) that reach `ChartQualifications`: a published
 * chart with a title, a table line, a drawable table and no gap reason. `LegacyVisuals` draws
 * qualifications only for these, and `drawnQualificationLines` hides from the findings only the
 * text these draw, so the two cannot disagree.
 */
export function chartsWithQualifications(output: unknown, sections: unknown) {
  const published = record(output);
  const tables = publishedTables(sections);
  return ["charts", "chartGaps"].flatMap((key) =>
    items(published[key])
      .map(record)
      .filter((descriptor) => {
        const title = word(descriptor.title ?? descriptor.lane ?? descriptor.name);
        const line = descriptor.table;
        return (
          title !== "" &&
          typeof line === "number" &&
          line > 0 &&
          !word(descriptor.gap) &&
          tables.has(line)
        );
      }),
  );
}

/**
 * Lines of the text blocks that the module page's charts draw beside themselves
 * (`ChartQualifications`), word for word.
 */
export function drawnQualificationLines(output: unknown, sections: unknown): Set<number> {
  const lines = new Set<number>();
  for (const descriptor of chartsWithQualifications(output, sections)) {
    for (const block of qualificationBlocks(sections, descriptor.table as number)) {
      if (chartDrawsVerbatim(readParagraph(word(block.text)).body)) lines.add(block.line as number);
    }
  }
  return lines;
}
