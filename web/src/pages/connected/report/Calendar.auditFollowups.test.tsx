import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { Calendar, buildCalendar } from "./Calendar";

function entry(cells: string[]): OutputEntry {
  return {
    selected: true,
    output: {
      id: "current/events",
      module: "CP-3C",
      label: "",
      href: "",
      sha256: "a".repeat(64),
      events: [{ table: 10, lane: "Issuer events" }],
    },
    sections: [
      {
        heading: "Events: Issuer events",
        level: 3,
        line: 9,
        blocks: [{ type: "table", line: 10, headers: EVENT_HEADERS, rows: [{ line: 12, cells }] }],
      },
    ],
  };
}

it("C4-030 retains the event name while moving its filename reference to Evidence", () => {
  const calendar = buildCalendar(
    [
      entry([
        "2027-03-31",
        "day",
        "2026-03-31",
        "Redemption notice per notice_of_redemption.pdf",
        "Scheduled",
        "notice_of_redemption.pdf",
        "Wall",
      ]),
    ],
    "current",
  );
  render(<Calendar calendar={calendar} />);
  const axis = within(screen.getByRole("group", { name: /^Events on a time axis/ }));
  const table = within(screen.getByRole("table", { name: "Published events" }));
  expect(axis.getAllByText("Redemption notice", { exact: true })).toHaveLength(1);
  expect(table.getByText("Maturity wall", { exact: true })).toBeInTheDocument();
  expect(document.body).not.toHaveTextContent("notice_of_redemption.pdf");
  expect(table.getByRole("rowheader", { name: "Redemption notice" })).toBeInTheDocument();
});

it("T20 residual keeps the recorded status lane when an event cannot be plotted", () => {
  const calendar = buildCalendar(
    [
      entry([
        "2027-02-30",
        "day",
        "2026-03-31",
        "Redemption notice",
        "Scheduled — notice.pdf",
        "notice.pdf",
        "Wall",
      ]),
    ],
    "current",
  );
  expect(calendar.gaps[0]?.unplaced?.[0]?.cells[4]).toBe("Scheduled — See Evidence");
});

it("T20 residual does not blame a valid date for an unsupported status", () => {
  const calendar = buildCalendar(
    [
      entry([
        "2027-03-31",
        "day",
        "2026-03-31",
        "Redemption notice",
        "Not recorded",
        "notice.pdf",
        "Wall",
      ]),
    ],
    "current",
  );
  expect(calendar.gaps[0]?.reason).toContain("event name, status, date or precision");
});

it("J3-011 explains published event categories and date precision without reclassifying dates", () => {
  render(
    <Calendar
      calendar={buildCalendar(
        [
          entry([
            "2027-03-31",
            "day",
            "2026-03-31",
            "Published event",
            "Historical",
            "notice.pdf",
            "Rating",
          ]),
        ],
        "current",
      )}
    />,
  );
  expect(
    screen.getByText(
      "Events keep their recorded status (Historical or Scheduled) regardless of the run’s as-of date. Dates can be precise to the day, month, quarter or year.",
    ),
  ).toBeInTheDocument();
});
