import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { basisNotes, basisNotesRaw, moduleSource } from "./figureData";
import { FigureNotes } from "./figureParts";

afterEach(cleanup);

const blockedEntry = (reason: string): OutputEntry => ({
  output: {
    id: "CP-2-1",
    module: "CP-2",
    label: "CP-2",
    href: "CP-2.md",
    sha256: "b".repeat(64),
    state: { established: false, declared: null },
  },
  sections: [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    {
      heading: "Bottom line",
      level: 3,
      line: 2,
      blocks: [{ type: "text", line: 3, end: 4, text: reason }],
    },
  ],
  selected: true,
});

const view = (entry: OutputEntry) => ({ entries: [entry] }) as unknown as ReportView;

it("gives a blocked module's reason without its Basis line, codes named", () => {
  const entry = blockedEntry("Not assessable: CP-1C did not run.\nBasis: notes_2024.pdf page 88");
  expect(moduleSource(view(entry), "CP-2", "Credit view").reason).toBe(
    "Not assessable: Peer benchmark did not run.",
  );
});

it("sends a blocked reason that cites a source to Evidence", () => {
  const entry = blockedEntry("Not assessable: see notes_2024.pdf page 88.");
  expect(moduleSource(view(entry), "CP-2", "Credit view").reason).toBe(
    "Not assessable; the reason is recorded in Evidence.",
  );
});

it("gives basis notes in the reader's words, each once, none that cites a source", () => {
  const table = {
    headers: ["Period", "Value", "Basis and limitation"],
    rows: [
      ["FY2023", "1", "Per **CP-1C**."],
      ["FY2024", "2", "Per **CP-1C**."],
      ["FY2025", "3", "As in notes_2024.pdf page 88."],
      ["FY2026", "4", "Per T4.18."],
    ],
  };
  expect(basisNotes(table as never)).toEqual(["Per Peer benchmark."]);
});

it("gives the raw notes, a cited one included, for FigureNotes to link to Evidence", () => {
  const table = {
    headers: ["Period", "Value", "Basis and limitation"],
    rows: [
      ["FY2023", "1", "Per **CP-1C**."],
      ["FY2024", "2", "Per **CP-1C**. "],
      ["FY2025", "3", "As in notes_2024.pdf page 88."],
      ["FY2026", "4", " "],
    ],
  };
  const notes = basisNotesRaw(table as never);
  expect(notes).toEqual(["Per **CP-1C**.", "As in notes_2024.pdf page 88."]);
  render(<FigureNotes notes={notes} href={() => "/report/run#evidence/CP-1"} />);
  expect(screen.getByText("Per Peer benchmark.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Read the reason in Evidence" })).toHaveAttribute(
    "href",
    "/report/run#evidence/CP-1",
  );
  expect(document.body).not.toHaveTextContent(/notes_2024|page 88|CP-1C/);
});
