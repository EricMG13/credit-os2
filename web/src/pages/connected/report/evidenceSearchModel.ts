import { moduleName } from "../api";
import { evidencePath, readerText, type OutputEntry, type PublishedRun } from "../publishedReport";
import { collectGaps } from "./EvidenceGaps";
import { handoffName } from "./evidenceLabels";

export type SearchHit = { key: string; title: string; detail: string; href: string };

const MARKS = /\*\*|`/g;
// Reader text: a module code reads as the module's name, so a hit shows and matches the name.
const cleanText = (text: string, pathway?: string | null) =>
  readerText(text.replace(MARKS, ""), pathway).replace(/\s+/g, " ").trim();

/** The Sources address that lands on one file's row: its place across the three groups, in order. */
const sourceRowHref = (index: number) => `#evidence/sources/-/file-${String(index)}`;

/** A hit's own words around the first typed word, so the reader sees why it matched. */
function snippet(text: string, words: string[]) {
  const plain = text;
  const at = Math.max(0, plain.toLowerCase().indexOf(words[0] ?? ""));
  const from = Math.max(0, at - 60);
  return `${from > 0 ? "…" : ""}${plain.slice(from, from + 200)}${plain.length > from + 200 ? "…" : ""}`;
}

/**
 * The run's handoff lines (designated handoffs only), source files and recorded gaps whose text
 * holds every typed word as a case-insensitive substring. Document order, no ranking, no fuzzy
 * matching. A table row matches on its cells together; a word is not looked for across a cell edge.
 * Text is matched as the reader sees it: a module is found by its name, not by its code.
 */
export function searchEvidence(query: string, entries: OutputEntry[], run: PublishedRun) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const none = {
    lines: [] as SearchHit[],
    sources: [] as SearchHit[],
    gaps: [] as SearchHit[],
    words,
  };
  if (words.length === 0) return none;
  const clean = (text: string) => cleanText(text, run.pathway);
  const holds = (text: string) => {
    const lower = text.toLowerCase();
    return words.every((word) => lower.includes(word));
  };
  const lines: SearchHit[] = [];
  for (const entry of entries.filter((item) => item.selected)) {
    const module = moduleName(entry.output.module, run.pathway);
    for (const section of entry.sections) {
      const heading = clean(section.heading);
      const add = (line: number, title: string, text: string) => {
        lines.push({
          key: `${entry.output.id}:${String(line)}`,
          title,
          detail: `${module} · ${snippet(text, words)}`,
          href: evidencePath(run.folder, entry, line),
        });
      };
      if (holds(heading)) add(section.line, heading, heading);
      for (const block of section.blocks) {
        if (block.type === "table") {
          for (const row of block.rows) {
            const text = clean(row.cells.join(" "));
            if (holds(text)) add(row.line, `${heading} · ${clean(row.cells[0] ?? "")}`, text);
          }
        } else if ("text" in block && block.text !== undefined && holds(clean(block.text)))
          add(block.line, heading, clean(block.text));
      }
    }
  }
  let row = -1;
  const sources: SearchHit[] = [
    { label: "Used by a module", rows: run.evidence.sources },
    { label: "Supplied, not used", rows: run.evidence.unused },
    { label: "Not recorded as used", rows: run.evidence.unrecorded },
  ].flatMap(({ label, rows }) =>
    rows.flatMap((source) => {
      row += 1;
      return holds(
        [
          source.name,
          source.type ?? "",
          source.documentDate ?? "",
          source.sha256 ?? "",
          label,
        ].join(" "),
      )
        ? [
            {
              key: `${label}:${source.name}`,
              title: source.name,
              detail: `${label}${source.type ? ` · ${source.type}` : ""}`,
              href: sourceRowHref(row),
            },
          ]
        : [];
    }),
  );
  const gaps: SearchHit[] = collectGaps(entries)
    .filter(({ entry, gap }) =>
      holds(`${clean(gap.title)} ${moduleName(entry.output.module, run.pathway)}`),
    )
    .map(({ entry, gap }) => ({
      key: `${entry.output.id}:${String(gap.line)}`,
      title: clean(gap.title),
      detail: `${handoffName(entry)}${gap.severity ? ` · ${gap.severity}` : ""}`,
      href: evidencePath(run.folder, entry, gap.line),
    }));
  return { lines, sources, gaps, words };
}
