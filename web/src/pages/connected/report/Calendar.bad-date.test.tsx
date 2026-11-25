import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { buildCalendar, Calendar } from "./Calendar";

function handoff(rows: string[][]): OutputEntry {
  return {
    selected: true,
    output: {
      module: "CP-2D",
      id: "CP-2D-1",
      label: "CP-2D",
      href: "",
      sha256: "2".repeat(64),
      events: [{ table: 20, lane: "Financing" }],
    },
    sections: [
      {
        heading: "Events: Financing",
        line: 19,
        level: 3,
        blocks: [
          {
            type: "table",
            line: 20,
            headers: EVENT_HEADERS,
            rows: rows.map((cells, index) => ({ line: 22 + index, cells })),
          },
        ],
      },
    ],
  };
}

const impossible = [
  "2025-02-30",
  "day",
  "2024-11-07",
  "Impossible date",
  "Scheduled — matures",
  "Filing p.1",
  "Wall",
];
const fine = ["2025-06", "month", "2024-11-07", "Fine", "Historical — noted", "Filing p.1", "Wall"];

it("plots the valid events and lists an event whose date cannot be placed with its recorded date", () => {
  const calendar = buildCalendar([handoff([impossible, fine])], "current");
  expect(calendar.rows.map(({ cells }) => cells[3])).toEqual(["Fine"]);
  render(<Calendar calendar={calendar} />);
  expect(screen.queryByText(/No dated events were published/)).toBeNull();
  const axis = within(screen.getByRole("group", { name: /^Events on a time axis/ }));
  const table = within(screen.getByRole("table", { name: "Published events" }));
  expect(axis.getAllByText("Fine")).toHaveLength(1);
  expect(table.getAllByText("Fine")).toHaveLength(1);
  const unplaced = within(screen.getByRole("grid", { name: "Events not placed on the calendar" }));
  const row = within(unplaced.getByRole("row", { name: /Impossible date/ }));
  expect(row.getByText("2025-02-30")).toBeInTheDocument();
  expect(row.getByText("day")).toBeInTheDocument();
  expect(row.getByText("2024-11-07")).toBeInTheDocument();
  expect(row.getByText("Scheduled — matures")).toBeInTheDocument();
  expect(row.getByRole("link", { name: "Source for Impossible date · Liquidity" })).toHaveAttribute(
    "href",
    `/report/current#evidence/CP-2D-1~${"2".repeat(64)}-22`,
  );
  expect(unplaced.queryByText("Fine")).toBeNull();
});

it("lists every event when no date can be placed and does not claim none were published", () => {
  const unknownStatus = ["2025-06-30", "day", "2024-11-07", "Coupon", "Pending", "Filing", "Wall"];
  const noName = ["2025-07-31", "day", "2024-11-07", "", "Scheduled — pays", "Filing", "Wall"];
  const calendar = buildCalendar([handoff([impossible, unknownStatus, noName])], "current");
  expect(calendar.rows).toEqual([]);
  render(<Calendar calendar={calendar} />);
  expect(screen.queryByText(/No dated events were published/)).toBeNull();
  expect(screen.queryByRole("figure")).toBeNull();
  const unplaced = within(screen.getByRole("grid", { name: "Events not placed on the calendar" }));
  expect(unplaced.getAllByRole("row")).toHaveLength(4);
  expect(unplaced.getByText("Impossible date")).toBeInTheDocument();
  expect(unplaced.getByText("Coupon")).toBeInTheDocument();
  expect(unplaced.getByText("Pending")).toBeInTheDocument();
  expect(unplaced.getByText("2025-07-31")).toBeInTheDocument();
  expect(unplaced.getByText("Not recorded")).toBeInTheDocument();
});

it("plots the readable rows of an event table with a row it cannot read and lists that row", () => {
  const calendar = buildCalendar([handoff([fine, ["2025-07", "month"]])], "current");
  expect(calendar.rows.map(({ cells }) => cells[3])).toEqual(["Fine"]);
  expect(
    calendar.gaps.map(({ reason, unplaced }) => [reason, unplaced?.map(({ href }) => href)]),
  ).toEqual([
    ["An event row could not be read.", [`/report/current#evidence/CP-2D-1~${"2".repeat(64)}-23`]],
  ]);
});

it("says no dated events were published only when no table carries events or gaps", () => {
  render(<Calendar calendar={buildCalendar([], "current")} />);
  expect(screen.getByText("No dated events were published for this run.")).toBeInTheDocument();
});
