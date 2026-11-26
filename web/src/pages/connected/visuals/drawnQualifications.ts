import { containsReference, methodNote, readParagraph } from "../publishedReport";
import { readerReason } from "../report/overview/reason";
import { items, publishedTables, record, word } from "./visualData";

/** What a drawn reason says when it cites a source: the source itself stays in Evidence. */
export const EVIDENCE_REASON = "Reason recorded in model evidence.";

/** A register row id the reader rule does not yet name: "(T2E.3.r03)", "T2E.3.r03". */
const ROW_ID = /\(\s*T[A-Z0-9]*\.\d+(?:\.[A-Za-z0-9]+)*\s*\)|\bT[A-Z0-9]*\.\d+\.r\d+\b/u;

/**
 * A cell's recorded reason as a reader sees it: module codes named; a reason that cites a source,
 * a file, a hash or a register id is replaced by the evidence sentence. No reason stays empty.
 */
export function drawnReason(reason: string) {
  if (!reason.trim()) return "";
  return ROW_ID.test(reason) ? EVIDENCE_REASON : (readerReason(reason) ?? EVIDENCE_REASON);
}

/** Whether text cites a source, a file, a page, a register id or a marker the trace carries. */
const citesSource = (text: string) => ROW_ID.test(text) || readerReason(text) === null;

/** A bracketed group: "(see p. 45)", "[E3]", "【4†source】". */
const GROUP = /(\s*)(?:\(([^()]*)\)|\[([^\]]*)\]|【([^】]*)】)/gu;
/** The cue words that open a citation at the end of a text: "per …", "see p. …", "; from …". */
const CUE = /\s*[,;]?(?:\s*\b(?:per|see|from|sources?:?|pp?\.|pages?)(?=[\s\d]))+/giu;

/** Text without the closing clauses that cite a source, the last first; the rest as written. */
function withoutTrailingCitation(text: string) {
  let rest = text;
  for (const cue of [...text.matchAll(CUE)].reverse())
    if (cue.index < rest.length && citesSource(rest.slice(cue.index).trim()))
      rest = rest.slice(0, cue.index);
  return rest.trimEnd();
}

/** What a schedule cell's amount is drawn as when its source cannot be set aside. */
export const EVIDENCE_AMOUNT = "Amount recorded in model evidence.";

/**
 * An amount written as text, as a reader sees it: every bracketed group and closing clause that
 * cites a source set aside (the trace holds them), everything else exactly as written, sign and
 * qualification included. Null when what is left still cites a source.
 */
export function drawnAmount(text: string): string | null {
  const grouped = text
    .trim()
    .replace(GROUP, (whole: string, space: string, ...inner: unknown[]) => {
      const group = whole.slice(space.length);
      if (!citesSource(group)) return whole;
      const words =
        inner.slice(0, 3).find((part): part is string => typeof part === "string") ?? "";
      const kept = withoutTrailingCitation(words);
      if (kept === words.trimEnd() || !kept.trim() || citesSource(kept)) return "";
      return `${space}${group.slice(0, 1)}${kept}${group.slice(-1)}`;
    });
  const rest = withoutTrailingCitation(grouped).trim();
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
