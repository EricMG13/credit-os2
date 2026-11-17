import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { buildCalendar, Calendar, upcomingCalendarRows } from "./Calendar";

const HASH = "2".repeat(64);
const evidence = (line: number) => `/report/current#evidence/CP-2D-1~${HASH}-${String(line)}`;

function handoff(rows: { line: number; cells: string[] }[], gap?: string): OutputEntry {
  return {
    selected: true,
    output: {
      module: "CP-2D",
      id: "CP-2D-1",
      label: "CP-2D",
      href: "",
      sha256: HASH,
      events: [{ table: 20, lane: "Financing", ...(gap ? { gap } : {}) }],
    },
    sections: [
      {
        heading: "Events: Financing",
        line: 19,
        level: 3,
        blocks: [{ type: "table", line: 20, headers: EVENT_HEADERS, rows }],
      },
    ],
  };
}

const numbered = (rows: string[][]) => rows.map((cells, index) => ({ line: 22 + index, cells }));
const fine = ["2025-06", "month", "2024-11-07", "Fine", "Historical — noted", "Filing p.1", "Wall"];
const refDate = [
  "annual-report-2024.pdf p.12",
  "day",
  "2024-11-07",
  "RefDate",
  "Scheduled — x",
  "Filing p.1",
  "Wall",
];
const refStatus = [
  "2025-06-30",
  "day",
  "2024-11-07",
  "RefStatus",
  "Per CP-2D-GAP-007",
  "Filing p.1",
  "Wall",
];
const unplacedGrid = () =>
  within(screen.getByRole("grid", { name: "Events not placed on the calendar" }));

it("draws no source reference from any cell of an unplaced row and keeps its source control", () => {
  render(
    <Calendar
      calendar={buildCalendar([handoff(numbered([refDate, refStatus, fine]))], "current")}
    />,
  );
  const grid = unplacedGrid();
  expect(grid.queryByText(/annual-report-2024\.pdf/)).toBeNull();
  expect(grid.queryByText(/CP-2D-GAP-007/)).toBeNull();
  expect(document.body.textContent).not.toMatch(/annual-report-2024\.pdf|CP-2D-GAP-007/);
  expect(grid.getAllByText("See Evidence")).toHaveLength(2);
  expect(grid.getByRole("link", { name: "Source for RefDate · Liquidity" })).toHaveAttribute(
    "href",
    evidence(22),
  );
  expect(grid.getByRole("link", { name: "Source for RefStatus · Liquidity" })).toHaveAttribute(
    "href",
    evidence(23),
  );
});

it("says events are listed only when a gap card lists unplaced rows", () => {
  const recorded = buildCalendar(
    [handoff(numbered([fine]), "No event dates were disclosed by the issuer.")],
    "current",
  );
  render(<Calendar calendar={recorded} />);
  expect(screen.queryByText(/events and date gaps are listed below/)).toBeNull();
  expect(
    screen.getByText(
      "No events could be placed on the calendar; the recorded gaps are listed below.",
    ),
  ).toBeInTheDocument();
});

it("plots the readable rows and lists a row of the wrong cell count as unreadable", () => {
  const calendar = buildCalendar(
    [handoff(numbered([fine, ["2025-07", "month"], refDate]))],
    "current",
  );
  expect(calendar.rows.map(({ cells, href }) => [cells[3], href])).toEqual([
    ["Fine", evidence(22)],
  ]);
  render(<Calendar calendar={calendar} />);
  const grid = unplacedGrid();
  expect(grid.getAllByRole("row")).toHaveLength(3);
  const unreadable = within(grid.getByRole("row", { name: /could not be read/ }));
  expect(unreadable.getByRole("link")).toHaveAttribute("href", evidence(23));
  expect(unreadable.queryByText("Not recorded")).toBeNull();
  expect(grid.getByRole("row", { name: /RefDate/ })).toBeInTheDocument();
});

it.each([
  ["share a source line", [22, 22]],
  ["have no line of their own", [22, 0]],
])("withholds every row of a table whose rows %s, as the base did", (_case, lines) => {
  const second = [...fine.slice(0, 3), "Second", ...fine.slice(4)];
  const rows = [
    { line: lines[0] ?? 22, cells: fine },
    { line: lines[1] ?? 22, cells: second },
    { line: 24, cells: refDate },
  ];
  const calendar = buildCalendar([handoff(rows)], "current");
  expect(calendar.rows).toEqual([]);
  expect(calendar.gaps).toEqual([
    {
      owner: "Liquidity",
      href: evidence(20),
      title: "Financing",
      reason: "The recorded event name, status, date or precision could not be plotted.",
    },
  ]);
  render(<Calendar calendar={calendar} />);
  expect(screen.queryByRole("grid", { name: "Events not placed on the calendar" })).toBeNull();
  expect(screen.queryByText("Fine")).toBeNull();
  expect(screen.queryByText("Second")).toBeNull();
  expect(screen.getByRole("link", { name: "Source for Financing" })).toHaveAttribute(
    "href",
    evidence(20),
  );
});

it("withholds a table whose rows are not each identified when a row cannot be read", () => {
  const rows = [
    { line: 22, cells: fine },
    { line: 22, cells: ["2025-07", "month"] },
  ];
  const calendar = buildCalendar([handoff(rows)], "current");
  expect(calendar.rows).toEqual([]);
  expect(calendar.gaps.map(({ reason, unplaced }) => [reason, unplaced])).toEqual([
    ["The event table could not be read.", undefined],
  ]);
});

it("keeps the lane of a plotted status and draws no reference from it", () => {
  const historical = [...fine.slice(0, 4), "Historical — per annual-report-2024.pdf p.3"];
  const scheduled = [
    "2027-03-31",
    "day",
    "2024-11-07",
    "Notes due",
    "Scheduled — CP-2D-GAP-007 open",
    "Filing p.1",
    "Wall",
  ];
  const calendar = buildCalendar(
    [handoff(numbered([[...historical, ...fine.slice(5)], scheduled]))],
    "current",
  );
  expect(calendar.rows.map(({ cells }) => cells[4])).toEqual([
    "Historical — See Evidence",
    "Scheduled — See Evidence",
  ]);
  expect(upcomingCalendarRows(calendar.rows, "2026-01-01")?.map(({ cells }) => cells[3])).toEqual([
    "Notes due",
  ]);
  render(<Calendar calendar={calendar} />);
  expect(document.body.textContent).not.toMatch(/annual-report-2024\.pdf|CP-2D-GAP-007/);
  expect(screen.getAllByText("Historical — See Evidence").length).toBeGreaterThan(0);
});

it("says events are listed only when a listed row is a readable event", () => {
  render(<Calendar calendar={buildCalendar([handoff(numbered([["a", "b"]]))], "current")} />);
  expect(screen.queryByText(/events and date gaps are listed below/)).toBeNull();
  expect(
    screen.getByText(
      "No events could be placed on the calendar; the recorded gaps are listed below.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("row", { name: /could not be read/ })).toBeInTheDocument();
});
