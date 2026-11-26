import { containsReference, methodNote, readParagraph } from "../publishedReport";
import { readerReason } from "../report/overview/reason";
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
/** A bare register row id with the one space before it. */
const BARE_ID = / ?\bT[A-Z0-9]*\.\d+\.r\d+\b/gu;
const ID_FULL = new RegExp(`^${ID}$`, "u");

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

/** Whether text cites a source, a file, a page, a register id or a marker the trace carries. */
const citesSource = (text: string) => ROW_ID.test(text) || readerReason(text) === null;

/** A bracketed group: "(see p. 45)", "[E3]", "【4†source】". No leading space, so scanning is linear. */
const GROUP = /\(([^()]*)\)|\[([^\]]*)\]|【([^】]*)】/gu;
/** A cue word that opens a citation: "per", "see", "from", "source:", "p.", "pp.", "pages". */
const CUE_WORD = /^(?:per|see|from|sources?:?|pp?\.|pages?)$/iu;
const CUE_SCAN = /\b(?:per|see|from|sources?:?|pp?\.|pages?)(?=[\s\d]|$)/giu;
const TOKEN = /\s*([^\s,;()[\]【】]+)/uy;
/** A list link between two page numbers or ids: ",", ";", " and ", " or ". */
const LINK = /(?:\s*[,;]|\s+(?:and|or|&))\s*/uy;
const FILE = /^[\w().-]+\.(?:pdf|xlsx?|xlsm|docx?|csv|txt|html?|pptx?|json|md)$/iu;

type Kind = "id" | "file" | "page" | "title";

/** What one word of a citation target is: an id or marker, a file, a page number, a title word. */
function kindOf(token: string): Kind | null {
  if (token.includes("†") || ID_FULL.test(token) || /^E\d+[a-z]?$/u.test(token)) return "id";
  if (FILE.test(token)) return "file";
  if (/^\d{1,4}(?:[-–]\d{1,4})?$/u.test(token)) return "page";
  return /^(?:[A-Z][\w&'’-]*|FY\d{2,4})$/u.test(token) ? "title" : null;
}

/**
 * The citation target from `from`: page numbers or ids (a list of one kind may be joined by a
 * separator or "and"/"or"), a file name, or title words. Ends at the first word that is none.
 */
function parseTarget(text: string, from: number) {
  let at = from;
  let pages = 0;
  let strong = false;
  let prev: Kind | null = null;
  for (;;) {
    let next = at;
    let joined = false;
    if (prev === "page" || prev === "id") {
      LINK.lastIndex = at;
      if (LINK.exec(text)) {
        next = LINK.lastIndex;
        joined = true;
      }
    }
    TOKEN.lastIndex = next;
    const found = TOKEN.exec(text);
    const kind = found?.[1] === undefined ? null : kindOf(found[1]);
    if (kind === null || (joined && kind !== prev)) break;
    at = TOKEN.lastIndex;
    prev = kind;
    if (kind === "page") pages += 1;
    if (kind === "id" || kind === "file") strong = true;
  }
  return { end: at, pages, strong };
}

/** The cue words from `from`: where they end, and whether only "p."/"page" (one page) was used. */
function skipCues(text: string, from: number) {
  let at = from;
  let single = false;
  let plural = false;
  for (;;) {
    TOKEN.lastIndex = at;
    const found = TOKEN.exec(text);
    if (!found?.[1] || !CUE_WORD.test(found[1])) break;
    if (/^(?:pp\.|pages)$/iu.test(found[1])) plural = true;
    if (/^(?:p\.|page)$/iu.test(found[1])) single = true;
    at = TOKEN.lastIndex;
  }
  return { at, onePage: single && !plural };
}

const SEPARATORS = " \t\n,;:-–—";
/** Text without its trailing separators and dashes (only where a citation was just cut off). */
function trimSeparators(text: string) {
  let end = text.length;
  while (end > 0 && SEPARATORS.includes(text.charAt(end - 1))) end -= 1;
  return text.slice(0, end);
}

const balanced = (text: string) => {
  let depth = 0;
  for (const char of text) {
    if ("([【".includes(char)) depth += 1;
    if (")]】".includes(char)) depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
};

/**
 * Whether a whole part of a group is one citation: cue words and/or a page list, ids, markers,
 * a file or a document title, nothing else. A single page ("p.") with a list is not one.
 */
function isCitation(part: string) {
  const text = part.trim();
  const cues = skipCues(text, 0);
  const target = parseTarget(text, cues.at);
  if (!text || target.end !== text.length || target.end === cues.at) return false;
  if (cues.onePage && target.pages > 1) return false;
  return cues.at > 0 || target.strong;
}

/**
 * The text with its one citation clause cut: from a cue word to the end of what that cue cites.
 * What follows must be nothing, a separator ("," ";") or a bracketed group, and is kept as
 * written; anything else (a qualification the cut cannot bound) gives null, as does a cut that
 * would leave nothing or an unbalanced bracket.
 */
function cutCitation(text: string): string | null {
  for (const cue of text.matchAll(CUE_SCAN)) {
    const cues = skipCues(text, cue.index);
    const target = parseTarget(text, cues.at);
    if (cues.onePage && target.pages > 1) continue;
    const tail = text.slice(target.end).trimStart();
    if (tail !== "" && !/^[,;([【]/u.test(tail)) continue;
    // A cue that cites nothing ("per share", "from 2027") is part of the figure.
    if (!target.strong && !citesSource(text.slice(cue.index, target.end).trim())) continue;
    const prefix = trimSeparators(text.slice(0, cue.index));
    if (!prefix || !balanced(prefix)) continue;
    return /^[([【]/u.test(tail) ? `${prefix} ${tail}` : prefix + tail;
  }
  return null;
}

/** The text before a dropped group without a cue word left dangling in front of it. */
function beforeDropped(text: string) {
  const trimmed = text.trimEnd();
  const cue = /\b(?:per|see|from|sources?:?|pp?\.|pages?)$/iu.exec(trimmed);
  return cue ? trimSeparators(trimmed.slice(0, cue.index)) : trimmed;
}

/** A group's words: its parts that are citations dropped with their separator, others kept. */
function cleanInner(inner: string): string | null {
  const grouped = cleanGroups(inner);
  if (grouped === null) return null;
  const pieces = grouped.split(/([,;])/u);
  let out = "";
  let kept = false;
  for (let at = 0; at < pieces.length; at += 2) {
    const raw = pieces[at] ?? "";
    const bare = raw.replace(BARE_ID, "");
    let part = raw;
    if (bare !== raw && !bare.trim()) continue;
    if (bare.trim() && (isCitation(bare) || citesSource(bare))) {
      if (isCitation(bare)) continue;
      const cut = cutCitation(bare);
      if (cut === null) return null;
      part = cut;
    } else part = bare;
    out += kept ? `${pieces[at - 1] ?? ""}${part}` : at === 0 ? part : part.trimStart();
    kept = true;
  }
  return out;
}

/** The text with each bracketed citation set aside and each other group cleaned; null if unsafe. */
function cleanGroups(text: string): string | null {
  let out = "";
  let last = 0;
  for (const group of text.matchAll(GROUP)) {
    out += text.slice(last, group.index);
    last = group.index + group[0].length;
    const inner = group[1] ?? group[2] ?? group[3] ?? "";
    const cleaned = cleanInner(inner);
    if (cleaned === null) return null;
    if (cleaned === inner) out += group[0];
    else if (!cleaned.trim()) out = beforeDropped(out);
    else out += `${group[0].slice(0, 1)}${cleaned}${group[0].slice(-1)}`;
  }
  return out + text.slice(last);
}

/** What a schedule cell's amount is drawn as when its source cannot be set aside. */
export const EVIDENCE_AMOUNT = "Amount recorded in model evidence.";

/**
 * An amount written as text, as a reader sees it. Text that cites nothing is drawn exactly as
 * written. Otherwise bracketed citations (ids, id lists, markers, page references, files) are set
 * aside, a part of a group that cites goes with its separator, and outside brackets one closing
 * citation clause is cut from its cue word to the end of what it cites; everything else, sign and
 * qualification included, stays. Null, so the caller draws EVIDENCE_AMOUNT, when what is left
 * still cites a source or where the citation ends cannot be told.
 */
export function drawnAmount(text: string): string | null {
  const whole = text.trim();
  const grouped = whole ? cleanGroups(whole) : null;
  const rest = grouped?.replace(BARE_ID, "").trim();
  if (!rest) return null;
  const result = cutCitation(rest) ?? rest;
  return citesSource(result) ? null : result;
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
