// The credit screening lead (ruling C7): CP-L10 in a `credit_screening` run draws the five reader
// tables of the synthetic handoff tests/fixtures/credit-screening/CP-L10.md, read from its published
// form (fixtures/credit_screening_cpl10.json, built by fixtures/build_fixtures.py), cells verbatim.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../../publishedReport";
import { creditScreeningEntry, leadProps } from "./fixtures/load";
import { readScreens, SCREEN_HEADERS, SCREEN_TITLES } from "./shortSnapshotData";
import { ShortSnapshotLead } from "./shortSnapshot";

afterEach(cleanup);

const props = (entry: OutputEntry, pathway: string | null = "credit_screening") => ({
  ...leadProps(entry),
  run: { folder: "run", pathway } as PublishedRun,
});

function without(heading: string): OutputEntry {
  const entry = creditScreeningEntry();
  return { ...entry, sections: entry.sections.filter((item) => item.heading !== heading) };
}

function withHeaders(heading: string, headers: string[]): OutputEntry {
  const entry = creditScreeningEntry();
  return {
    ...entry,
    sections: entry.sections.map((item) =>
      item.heading === heading
        ? {
            ...item,
            blocks: item.blocks.map((block) =>
              block.type === "table" ? { ...block, headers } : block,
            ),
          }
        : item,
    ),
  };
}

/** The fixture's own table under a heading, as the library published it. */
function fixtureRows(heading: string) {
  const section = creditScreeningEntry().sections.find((item) => item.heading === heading);
  const block = section?.blocks.find((item) => item.type === "table");
  if (block?.type !== "table") throw new Error(`no table under ${heading}`);
  return block.rows.map((row) => row.cells);
}

describe("readScreens", () => {
  it("reads the five screens under their titles, each with the exact header", () => {
    const read = readScreens(creditScreeningEntry());
    expect(read.map((item) => item.title)).toEqual([...SCREEN_TITLES]);
    for (const item of read) {
      expect(item.state).toBe("ready");
      if (item.state === "ready") {
        expect(item.headers).toEqual([...SCREEN_HEADERS]);
        expect(item.rows).toEqual(fixtureRows(item.title));
        expect(item.rows).toHaveLength(6);
      }
    }
  });

  it("is a gap for a screen that is missing, or whose header is not the permitted one", () => {
    expect(readScreens(without("Credit screen"))[1]).toMatchObject({ state: "gap" });
    const wrong = readScreens(
      withHeaders("Credit screen", ["Topic", "Finding", "Materiality", "Evidence", "Action"]),
    );
    expect(wrong[1]).toMatchObject({ state: "gap" });
    expect(wrong[0]).toMatchObject({ state: "ready" });
  });
});

describe("readScreens reader text", () => {
  function withCell(heading: string, row: number, column: number, value: string): OutputEntry {
    const entry = creditScreeningEntry();
    return {
      ...entry,
      sections: entry.sections.map((item) =>
        item.heading === heading
          ? {
              ...item,
              blocks: item.blocks.map((block) =>
                block.type === "table"
                  ? {
                      ...block,
                      rows: block.rows.map((r, at) =>
                        at === row
                          ? { ...r, cells: r.cells.map((c, k) => (k === column ? value : c)) }
                          : r,
                      ),
                    }
                  : block,
              ),
            }
          : item,
      ),
    };
  }
  const cell = (entry: OutputEntry, pathway?: string) => {
    const read = readScreens(entry, pathway)[1];
    if (read?.state !== "ready") throw new Error("not ready");
    return read.rows[0] ?? [];
  };

  it("names a module code in a Next step cell by the run's pathway", () => {
    const row = cell(withCell("Credit screen", 0, 4, "Upgrade to CP-L10"), "credit_screening");
    expect(row[4]).toBe("Upgrade to Credit screening");
  });

  it("answers a cell that names a source with the Evidence line, and drops a register id", () => {
    const row = cell(
      withCell("Credit screen", 0, 3, "harbourline_annual_report.txt, page 12"),
      "credit_screening",
    );
    expect(row[3]).toBe("Detail is in Evidence.");
    expect(
      cell(withCell("Credit screen", 0, 1, "Leverage rose (TL10.2)."), "credit_screening")[1],
    ).not.toMatch(/TL\d/);
  });

  it("leaves all 150 fixture cells unchanged", () => {
    for (const item of readScreens(creditScreeningEntry(), "credit_screening")) {
      if (item.state !== "ready") throw new Error("not ready");
      expect(item.rows).toEqual(fixtureRows(item.title));
    }
  });

  it("gives a materiality such as constructor no class", () => {
    const entry = withCell("Credit screen", 0, 2, "constructor");
    render(<ShortSnapshotLead {...props(entry)} />);
    const tile = screen.getByRole("region", { name: "Credit screen" });
    const marks = within(tile)
      .getAllByText("constructor")
      .filter((node) => node.tagName === "SPAN");
    expect(marks).toHaveLength(1);
    expect(marks[0]).not.toHaveClass("text-warning-text");
    expect(marks[0]?.className).not.toMatch(/function|native code/);
  });
});

describe("the credit screening lead", () => {
  it("draws the five screens and every cell of the fixture, verbatim", () => {
    render(<ShortSnapshotLead {...props(creditScreeningEntry())} />);
    for (const title of SCREEN_TITLES) {
      const table = screen.getByRole("table", { name: title, hidden: true });
      const header = within(table)
        .getAllByRole("columnheader", { hidden: true })
        .map((item) => item.textContent);
      expect(header).toEqual([...SCREEN_HEADERS]);
      const cells = within(table)
        .getAllByRole("row", { hidden: true })
        .slice(1)
        .map((row) =>
          within(row)
            .getAllByRole("cell", { hidden: true })
            .map((cell) => cell.textContent),
        );
      expect(cells).toEqual(fixtureRows(title));
    }
    // Nothing of the short snapshot's own gap tiles, and no module code, source or register column.
    expect(screen.queryByText(/key figures/i)).toBeNull();
    expect(screen.queryByText(/could not read/i)).toBeNull();
    const text = document.body.textContent;
    expect(text).not.toMatch(/CP-/);
    expect(text).not.toMatch(/source_ref|_module_id|TL\d\d?\.\d/);
  });

  it("draws the gap tile, and only for that screen, when a screen is missing or its header differs", () => {
    const { unmount } = render(
      <ShortSnapshotLead {...props(without("Liquidity and forward-risk screen"))} />,
    );
    expect(screen.getAllByRole("table", { hidden: true })).toHaveLength(4);
    // The gap tile names its screen as its title (main's GapTile: a heading, not a chip span).
    expect(
      screen.getByRole("heading", { name: /Liquidity and forward-risk screen/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/could not read/i)).toBeInTheDocument();
    unmount();
    render(
      <ShortSnapshotLead
        {...props(withHeaders("Credit screen", ["Topic", "Finding", "Materiality", "Evidence"]))}
      />,
    );
    expect(screen.getAllByRole("table", { hidden: true })).toHaveLength(4);
    expect(screen.getAllByText(/could not read/i)).toHaveLength(1);
  });

  it("leaves the short snapshot's own reading for any other pathway", () => {
    render(<ShortSnapshotLead {...props(creditScreeningEntry(), "short_snapshot")} />);
    expect(screen.getAllByText(/could not read the key figures/i).length).toBeGreaterThan(0);
  });

  it("draws the next step at secondary strength with a visible label, and the materiality mark without regard to case", () => {
    const entry = creditScreeningEntry();
    const sections = entry.sections.map((item) =>
      item.heading === "Credit screen"
        ? {
            ...item,
            blocks: item.blocks.map((block) =>
              block.type === "table"
                ? {
                    ...block,
                    rows: block.rows.map((row, at) => ({
                      ...row,
                      cells: row.cells.map((cell, column) =>
                        column === 2
                          ? (["HIGH", "high", "High", "Medium", "Low", "Low"][at] ?? cell)
                          : cell,
                      ),
                    })),
                  }
                : block,
            ),
          }
        : item,
    );
    render(<ShortSnapshotLead {...props({ ...entry, sections })} />);
    const tile = screen.getByRole("region", { name: "Credit screen" });
    const items = within(tile).getAllByRole("listitem");
    const marks = items.map((item) => item.querySelector("span.font-medium"));
    expect(marks.slice(0, 3).map((mark) => mark?.textContent)).toEqual(["HIGH", "high", "High"]);
    for (const mark of marks.slice(0, 3)) expect(mark).toHaveClass("text-warning-text");
    for (const mark of marks.slice(3)) expect(mark).not.toHaveClass("text-warning-text");
    const next = within(items[1] as HTMLElement).getByText("Full assessment of resilience");
    expect(next).toHaveClass("text-text-secondary");
    expect(next.textContent).toBe("Full assessment of resilience");
    expect(within(items[1] as HTMLElement).getByText("Next step")).toBeInTheDocument();
  });
});
