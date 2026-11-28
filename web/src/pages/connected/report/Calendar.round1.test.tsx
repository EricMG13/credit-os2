import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { buildCalendar, Calendar } from "./Calendar";

const HASH = "2".repeat(64);

function emptyTable(gap?: string): OutputEntry {
  return {
    selected: true,
    output: {
      module: "CP-2D",
      id: "CP-2D-1",
      label: "CP-2D",
      href: "",
      sha256: HASH,
      events: [{ table: 20, lane: "Refinancing", ...(gap ? { gap } : {}) }],
    },
    sections: [
      {
        heading: "Events: Refinancing",
        line: 19,
        level: 3,
        blocks: [{ type: "table", line: 20, headers: EVENT_HEADERS, rows: [] }],
      },
    ],
  };
}

it("C8-2: a stated gap on a header-only table is recorded and drawn", () => {
  const calendar = buildCalendar(
    [emptyTable("Not supplied: no dated events were found")],
    "current",
  );
  render(<Calendar calendar={calendar} />);
  expect(screen.getByText("Not supplied: no dated events were found")).toBeVisible();
  expect(screen.queryByText("No dated events were published for this run.")).toBeNull();
  expect(
    screen.getByText("No events could be plotted. See the recorded gaps below."),
  ).toBeVisible();
});

it("C8-2: a header-only table with no gap still says nothing was published", () => {
  render(<Calendar calendar={buildCalendar([emptyTable()], "current")} />);
  expect(screen.getByText("No dated events were published for this run.")).toBeVisible();
});

it("C8-2: a gap whose table does not exist is not recorded", () => {
  const entry = emptyTable("Not supplied: x");
  entry.sections = [];
  expect(buildCalendar([entry], "current").gaps).toEqual([]);
});
