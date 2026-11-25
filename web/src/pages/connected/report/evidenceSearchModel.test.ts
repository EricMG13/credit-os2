import { expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import { searchEvidence } from "./evidenceSearchModel";

const sha = "a".repeat(64);
const entry = (module: string, id: string, selected = true): OutputEntry => ({
  selected,
  output: { id, module, label: module, href: `${id}.md`, sha256: sha },
  sections: [
    {
      heading: "Key findings",
      level: 2,
      line: 3,
      blocks: [
        {
          type: "text",
          line: 4,
          end: 4,
          text: "Leverage rose to **5.1x** on lower EBITDA.\nBasis: annual.pdf p.84",
        },
        {
          type: "table",
          line: 6,
          headers: ["Measure", "Value"],
          rows: [
            { line: 7, cells: ["Net debt", "USD 1,200m"] },
            { line: 8, cells: ["Cash", "USD 162m"] },
          ],
        },
      ],
    },
    {
      heading: "Gaps",
      level: 2,
      line: 10,
      blocks: [
        {
          type: "table",
          line: 11,
          headers: ["Gap", "Severity"],
          rows: [{ line: 12, cells: ["No facility schedule", "High"] }],
        },
      ],
    },
  ],
});
const entries = [entry("CP-2", "case/CP-2.md"), entry("CP-1", "case/CP-1.md", false)];
const run = {
  folder: "case",
  evidence: {
    sources: [
      {
        name: "annual.pdf",
        type: "pdf",
        documentDate: null,
        readBy: ["CP-2"],
        sha256: "c0ffee" + "0".repeat(58),
      },
    ],
    unused: [{ name: "Spare Deck.pdf", type: "pdf", documentDate: null, readBy: [], sha256: null }],
    unrecorded: [],
  },
} as unknown as PublishedRun;
const at = (line: number) => `/report/case#evidence/case%2FCP-2.md~${sha}-${String(line)}`;

it("finds handoff lines by every typed word, case-insensitively, in document order", () => {
  const { lines } = searchEvidence("LEVERAGE ebitda", entries, run);
  expect(lines.map(({ href }) => href)).toEqual([at(4)]);
  expect(lines[0]?.title).toBe("Key findings");
  expect(lines[0]?.detail).toContain("Leverage rose to 5.1x on lower EBITDA.");
  expect(lines[0]?.detail).not.toContain("**");
});

it("finds a table row by any cell and names its row", () => {
  const { lines } = searchEvidence("usd 162", entries, run);
  expect(lines.map(({ href, title }) => [href, title])).toEqual([[at(8), "Key findings · Cash"]]);
});

it("does not search alternate handoffs, and does not match a word split across cells", () => {
  expect(searchEvidence("Net Cash", entries, run).lines).toEqual([]);
  expect(
    searchEvidence("cash", entries, run).lines.every(({ href }) => !href.includes("CP-1")),
  ).toBe(true);
});

it("finds sources by file name, type or hash prefix and opens that file's row on Sources", () => {
  expect(searchEvidence("spare deck", entries, run).sources.map(({ title }) => title)).toEqual([
    "Spare Deck.pdf",
  ]);
  expect(searchEvidence("c0ffee", entries, run).sources.map(({ title }) => title)).toEqual([
    "annual.pdf",
  ]);
  expect(searchEvidence("c0ffee", entries, run).sources[0]?.href).toBe(
    "#evidence/sources/-/file-0",
  );
  // The row's place counts across the three groups in the order Sources draws them.
  expect(searchEvidence("spare deck", entries, run).sources[0]?.href).toBe(
    "#evidence/sources/-/file-1",
  );
});

it("finds gaps by title or module and opens the gap's handoff line", () => {
  // Gaps are the Gaps tab's: an alternate handoff's are included and named as alternates.
  const found = searchEvidence("facility", entries, run).gaps;
  expect(found.map(({ href }) => href)).toEqual([
    at(12),
    `/report/case#evidence/case%2FCP-1.md~${sha}-12`,
  ]);
  expect(found.map(({ detail }) => detail)).toEqual([
    "Fundamental credit · High",
    "Financial foundation · Alternate handoff · High",
  ]);
  expect(searchEvidence("fundamental credit", entries, run).gaps.map(({ href }) => href)).toEqual([
    at(12),
  ]);
});

it("returns nothing for an empty or blank query", () => {
  expect(searchEvidence("   ", entries, run)).toEqual({
    lines: [],
    sources: [],
    gaps: [],
    words: [],
  });
});

it("matches no fuzzy spelling", () => {
  const found = searchEvidence("leverge", entries, run);
  expect(found.lines).toEqual([]);
});

it("does not let a bar match every table row, because cells are joined by a space", () => {
  expect(searchEvidence("|", entries, run).lines).toEqual([]);
});

it("shows and matches a module by its name, never by its code", () => {
  const coded: OutputEntry = {
    ...entry("CP-2", "case/CP-2.md"),
    sections: [
      { heading: "CP-2", level: 1, line: 1, blocks: [] },
      {
        heading: "Limitations",
        level: 2,
        line: 3,
        blocks: [{ type: "text", line: 4, end: 4, text: "CP-1 prints two annual periods only." }],
      },
    ],
  };
  const byName = searchEvidence("financial foundation prints", [coded], run).lines;
  expect(byName.map(({ title, detail }) => [title, detail])).toEqual([
    ["Limitations", "Fundamental credit · Financial foundation prints two annual periods only."],
  ]);
  const byCode = searchEvidence("cp-2", [coded], run);
  expect(byCode.lines).toEqual([]);
  expect(byCode.gaps).toEqual([]);
  // The handoff's own title line is the bare code: it is found, and shown, as the module's name.
  expect(searchEvidence("fundamental credit", [coded], run).lines[0]?.title).toBe(
    "Fundamental credit",
  );
});
