import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { RunCharts } from "./RunCharts";

type View = ReturnType<typeof buildReportView>;

function entryWith(gap: string): OutputEntry {
  return {
    selected: true,
    output: {
      id: "events",
      sha256: "e".repeat(64),
      module: "CP-2D",
      label: "",
      href: "",
      state: { established: true, declared: null },
      summary: null,
      events: [{ lane: "Refinancing events", table: 41, gap }],
    },
    sections: [
      {
        heading: "Chart data: refinancing events",
        level: 3,
        line: 40,
        blocks: [
          {
            type: "table",
            line: 41,
            headers: ["Event", "Date"],
            rows: [{ line: 43, cells: ["Notes redeemed", "2026-03-31"] }],
          },
        ],
      },
    ],
  };
}

function draw(gap: string) {
  const output = entryWith(gap);
  const view: View = {
    catalogue: undefined,
    lead: undefined,
    entries: [output],
    models: [],
    modules: [{ id: "CP-2D", name: "Events", state: "Delivered", outputs: [output] }],
  };
  render(<RunCharts view={view} folder="current" />);
  return within(screen.getByRole("region", { name: "Chart tables from this run" }));
}

it("C8-1: an event descriptor's gap that cites a file and page is drawn as See Evidence.", () => {
  const section = draw("Not supplied: see Filing.pdf p.12 for the schedule");
  expect(section.getByRole("note")).toHaveTextContent("See Evidence.");
  expect(section.queryByText(/Filing\.pdf|p\.12/)).toBeNull();
});

it("C8-1: an uncited event gap is drawn as written", () => {
  const section = draw("Not supplied: no refinancing schedule was found");
  expect(section.getByRole("note")).toHaveTextContent(
    "Not supplied: no refinancing schedule was found",
  );
});
