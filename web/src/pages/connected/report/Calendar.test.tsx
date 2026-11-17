import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { buildCalendar, Calendar, upcomingCalendarRows } from "./Calendar";

let entrySequence = 0;
function entry(module: string, cells: string[], selected = true): OutputEntry {
  entrySequence += 1;
  const revision = module.match(/\d/u)?.[0] ?? "0";
  return {
    selected,
    output: {
      module,
      id: `${module}-${String(entrySequence)}`,
      label: module,
      href: "",
      sha256: revision.repeat(64),
      events: [{ table: 20, lane: "Dated events" }],
    },
    sections: [
      {
        heading: "Events: Dated events",
        line: 19,
        level: 3,
        blocks: [{ type: "table", line: 20, headers: EVENT_HEADERS, rows: [{ line: 22, cells }] }],
      },
    ],
  };
}

it("keeps same-date contributions distinct with their original row traces and separate date precision", () => {
  entrySequence = 0;
  const event = [
    "2027-Q2",
    "quarter",
    "2026-09-30",
    "Notes due",
    "Scheduled — Contract",
    "agreement.pdf",
    "Refinancing",
  ];
  const first = entry("CP-2D", event);
  first.output.events?.push({ table: 20, lane: "Same published table" });
  const second = entry("CP-3C", event);
  const scenario = entry("CP-4", [
    "2027-04-15",
    "day",
    "Not supplied: publication date was absent",
    "Consent outcome",
    "Scenario — Conditional",
    "approval.pdf",
    "Possible waiver noted in approval.pdf",
  ]);
  const alternative = entry(
    "CP-3C",
    [...event.slice(0, 3), "Earlier revision", ...event.slice(4)],
    false,
  );
  render(
    <Calendar calendar={buildCalendar([first, alternative, second, scenario], "retained case")} />,
  );
  const figure = within(screen.getByRole("figure", { name: "Published events" }));
  const events = within(figure.getByRole("group", { name: "Events in date order" }));
  const markers = within(figure.getByRole("group", { name: "Events by year" }));
  const dates = events.getAllByText("2027-Q2 · quarter");
  expect(dates).toHaveLength(2);
  expect(events.getByText("2027-04-15 · day")).toBeInTheDocument();
  const notes = markers.getAllByRole("button", { name: /Notes due, 2027-Q2, quarter/ });
  expect(notes).toHaveLength(2);
  notes.forEach((note) => {
    expect(note).toHaveAttribute("data-event-category", "Scheduled");
  });
  expect(markers.getByRole("button", { name: /Consent outcome, 2027-04-15, day/ })).toHaveAttribute(
    "data-event-category",
    "Scenario",
  );
  expect(events.getByRole("link", { name: "Source for Notes due · Liquidity" })).toHaveAttribute(
    "href",
    `/report/retained%20case#evidence/CP-2D-1~${"2".repeat(64)}-22`,
  );
  expect(
    events.getByRole("link", { name: "Source for Notes due · Refinancing & LME" }),
  ).toHaveAttribute("href", `/report/retained%20case#evidence/CP-3C-2~${"3".repeat(64)}-22`);
  expect(figure.queryByText(/approval\.pdf|agreement\.pdf|Earlier revision/)).toBeNull();
  fireEvent.click(figure.getByRole("radio", { name: "Table" }));
  expect(figure.getAllByRole("cell", { name: "2026-09-30" })).toHaveLength(2);
  expect(
    figure.getByRole("cell", { name: "Not supplied: publication date was absent" }),
  ).toBeInTheDocument();
  expect(
    figure.getByRole("link", { name: "Source for Notes due · Refinancing & LME" }),
  ).toHaveAttribute("href", `/report/retained%20case#evidence/CP-3C-2~${"3".repeat(64)}-22`);
});

it("keeps recorded gaps as reasons and leaves a mismatched precision unplotted", () => {
  entrySequence = 0;
  const gap = entry(
    "CP-6",
    EVENT_HEADERS.map(() => "Not supplied: no review date"),
  );
  gap.output.events = [
    { table: 20, lane: "Decision and watch", gap: "No review date was assigned." },
  ];
  const invalid = entry("CP-0", [
    "2027-02-29",
    "day",
    "2026-09-30",
    "Invalid date",
    "Historical — Published",
    "file.pdf",
    "Period",
  ]);
  render(<Calendar calendar={buildCalendar([gap, invalid], "current")} />);
  expect(screen.getByText("No review date was assigned.")).toBeInTheDocument();
  expect(
    screen.getByText(/recorded event name, status, date or precision could not be plotted/),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Source for Decision and watch" })).toHaveAttribute(
    "href",
    `/report/current#evidence/CP-6-1~${"6".repeat(64)}-20`,
  );
  expect(screen.queryByRole("figure")).toBeNull();
});

it("selects upcoming dates by recorded spans and keeps partial-date precision and chronology", () => {
  entrySequence = 0;
  const calendar = buildCalendar(
    [
      entry("CP-1", ["1973", "year", "2026-09-30", "Historical", "Historical", "file", ""]),
      entry("CP-1", [
        "2026",
        "year",
        "2026-09-30",
        "Historical year",
        "Historical — Completed",
        "file",
        "",
      ]),
      entry("CP-1", [
        "2026-Q4",
        "quarter",
        "2026-09-30",
        "Historical quarter",
        "Historical — Closed",
        "file",
        "",
      ]),
      entry("CP-1", [
        "2026-10",
        "month",
        "2026-09-30",
        "Historical month",
        "Historical — Filed",
        "file",
        "",
      ]),
      entry("CP-2D", ["2027-Q2", "quarter", "2026-09-30", "Quarter", "Scheduled", "file", ""]),
      entry("CP-3C", [
        "2026-10",
        "month",
        "2026-09-30",
        "October",
        "Scenario — Conditional",
        "file",
        "",
      ]),
      entry("CP-3C", ["2026-11", "month", "2026-09-30", "November", "User reminder", "file", ""]),
    ],
    "current",
  );
  const rows = upcomingCalendarRows(calendar.rows, "2026-10-15");
  expect(
    rows?.map(({ cells, timingWithinRecordedPeriod }) => [
      cells[3],
      cells[0],
      cells[1],
      cells[4],
      timingWithinRecordedPeriod,
    ]),
  ).toEqual([
    ["October", "2026-10", "month", "Scenario — Conditional", true],
    ["November", "2026-11", "month", "User reminder", false],
    ["Quarter", "2027-Q2", "quarter", "Scheduled", false],
  ]);
  expect(upcomingCalendarRows(calendar.rows, null)).toBeNull();
  expect(upcomingCalendarRows(calendar.rows, "2026-02-30")).toBeNull();
  expect(upcomingCalendarRows(calendar.rows, "2028-01-01")).toEqual([]);
});

it.each([20, 0, 22.5, 22])(
  "withholds events whose source rows are invalid or duplicated: %s",
  (line) => {
    const handoff = entry("CP-2D", [
      "2027-04-15",
      "day",
      "2026-09-30",
      "Notes due",
      "Scheduled",
      "file",
      "",
    ]);
    const block = handoff.sections[0]?.blocks[0];
    if (block?.type !== "table" || !block.rows[0]) throw new Error("Missing table fixture");
    block.rows.push({ ...block.rows[0], line });
    const calendar = buildCalendar([handoff], "current");
    expect(calendar.rows).toEqual([]);
    expect(calendar.gaps).toHaveLength(1);
    expect(calendar.gaps[0]?.reason).toBe("The event table does not identify each event row.");
    expect(calendar.gaps[0]?.href).toContain(`~${"2".repeat(64)}-20`);
  },
);
