import { readFileSync } from "node:fs";
import path from "node:path";
import type { Block, OutputEntry, Section } from "../../publishedReport";

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const RULE = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

/**
 * For tests only: a Markdown handoff as the store's sections, near enough to read retained real
 * output as written. Headings open sections; a pipe table is a table block; other runs of lines are
 * paragraphs; `<!-- -->` lines are skipped as the store skips them. Lines are 1-based.
 */
export function sectionsOf(markdown: string): Section[] {
  const lines = markdown.split(/\r?\n/);
  const sections: Section[] = [];
  let current: Section | undefined;
  let at = 0;
  const push = (block: Block) => current?.blocks.push(block);
  while (at < lines.length) {
    const line = lines[at] ?? "";
    const heading = /^(#{1,6})\s+(.*?)\s*$/.exec(line);
    if (heading) {
      current = {
        heading: heading[2] ?? "",
        level: heading[1]?.length ?? 1,
        line: at + 1,
        blocks: [],
      };
      sections.push(current);
      at += 1;
    } else if (line.trim().startsWith("|") && RULE.test(lines[at + 1] ?? "")) {
      const start = at;
      const headers = splitRow(line);
      at += 2;
      const rows = [];
      while (at < lines.length && (lines[at] ?? "").trim().startsWith("|")) {
        rows.push({ line: at + 1, cells: splitRow(lines[at] ?? "") });
        at += 1;
      }
      push({ type: "table", line: start + 1, headers, rows });
    } else if (!line.trim() || line.trim().startsWith("<!--")) {
      at += 1;
    } else {
      const start = at;
      const text: string[] = [];
      while (
        at < lines.length &&
        (lines[at] ?? "").trim() &&
        !/^#{1,6}\s/.test(lines[at] ?? "") &&
        !(lines[at] ?? "").trim().startsWith("|")
      ) {
        text.push(lines[at] ?? "");
        at += 1;
      }
      push({ type: "text", line: start + 1, end: at, text: text.join("\n") });
    }
  }
  return sections;
}

/** For tests only: a retained file under the repository's `tests/fixtures`. */
export const retained = (...parts: string[]) =>
  path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "..",
    "tests",
    "fixtures",
    ...parts,
  );

/** For tests only: one retained Markdown file as a selected output of `module`. */
export function fixtureEntry(
  module: string,
  file: string,
  extra: Partial<OutputEntry["output"]> = {},
) {
  const entry: OutputEntry = {
    output: {
      module,
      id: `fixture/${module}`,
      label: module,
      sha256: `hash-${module}`,
      href: `${module}.md`,
      ...extra,
    },
    sections: sectionsOf(readFileSync(file, "utf8")),
    selected: true,
  };
  return entry;
}
