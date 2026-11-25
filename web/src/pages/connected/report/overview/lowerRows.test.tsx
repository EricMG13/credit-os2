import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { DatesRow } from "./DatesRow";
import { LimitsRow } from "./LimitsRow";
import { PipelineRow } from "./PipelineRow";

const mocks = vi.hoisted(() => ({
  lines: [] as unknown[],
  limitations: [] as unknown[],
  calendar: [] as unknown[],
  upcoming: [] as unknown[] | null,
  gaps: [] as unknown[],
}));

vi.mock("../../reportView", () => ({
  moduleBottomLines: () => mocks.lines,
  runLimitations: () => mocks.limitations,
  moduleState: () => "Delivered",
}));
vi.mock("../Calendar", () => ({
  buildCalendar: () => ({ rows: mocks.calendar, gaps: mocks.gaps }),
  upcomingCalendarRows: () => mocks.upcoming,
}));

const entry = (module: string): OutputEntry => ({
  output: {
    id: `${module}-1`,
    module,
    label: module,
    href: `${module}.md`,
    sha256: "a".repeat(64),
  },
  sections: [],
  selected: true,
});
const line = (
  id: string,
  name: string,
  state: string,
  text: string | null,
  referenced = false,
) => ({
  id,
  name,
  state,
  entry: entry(id),
  text,
  referenced,
  line: text === null && !referenced ? null : 4,
});
const run = { folder: "run", asOf: "2025-03-31" } as PublishedRun;
const snapshot = {} as Snapshot;
const view = { lead: entry("CP-6"), entries: [] } as unknown as ReportView;
const props = { snapshot, run, view };
const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const event = (iso: string, name: string) => ({
  cells: [iso, "", "", name, "Scheduled", "", "Maturity wall"],
  from: day(iso),
  to: day(iso),
  href: `/report/run#evidence/${name}`,
  owner: "Liquidity",
  timingWithinRecordedPeriod: false,
});

afterEach(() => {
  cleanup();
  mocks.lines = [];
  mocks.limitations = [];
  mocks.calendar = [];
  mocks.gaps = [];
  mocks.upcoming = [];
});

it("draws every module as a linked node under its stage, the lead included", () => {
  mocks.lines = [
    line("CP-0", "Source readiness", "Delivered", "Sources are complete."),
    line("CP-2", "Fundamental credit", "Delivered", "Credit is stable."),
    line("CP-4", "Legal & covenants", "Not assessable", null),
  ];
  render(<PipelineRow {...props} />);
  const tile = screen.getByRole("region", { name: "Bottom line by module" });
  const stages = within(tile).getByRole("list", { name: "Stages" });
  expect(
    within(stages)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent),
  ).toEqual(["Sources1", "Credit1", "Structure and market1", "Validation and decision1"]);
  expect(within(stages).getByRole("link", { name: /Legal & covenants/ })).toHaveAttribute(
    "href",
    "#modules/CP-4",
  );
  expect(within(stages).getByRole("link", { name: /Committee decision|CP-6/ })).toHaveAttribute(
    "href",
    "#modules/CP-6",
  );
  expect(within(stages).getAllByRole("link")).toHaveLength(4);
});

it("passes nothing on from a blocked module and animates only delivered edges", () => {
  mocks.lines = [
    line("CP-0", "Source readiness", "Delivered", "Sources are complete."),
    line("CP-4", "Legal & covenants", "Not assessable", null),
  ];
  render(<PipelineRow {...props} />);
  const stages = within(screen.getByRole("list", { name: "Stages" }));
  const blocked = stages.getByRole("link", { name: /Legal & covenants/ });
  expect(blocked).toHaveClass("border-dashed", "border-warning-mark");
  expect(within(blocked).getByText("Not assessable")).toBeInTheDocument();
  expect(blocked.closest("li")?.querySelector("[data-edge]")).toBeNull();
  const delivered = stages.getByRole("link", { name: /Source readiness/ }).closest("li");
  expect(delivered?.querySelector("[data-edge]")).toHaveClass("pipeline-flow");
});

it("keeps each bottom line's three text states and its source control", () => {
  mocks.lines = [
    line("CP-1", "Financial foundation", "Delivered", "Leverage is high."),
    line("CP-3", "Security selection", "Delivered", null, true),
    line("CP-2D", "Liquidity", "Delivered", null),
  ];
  render(<PipelineRow {...props} />);
  const lines = screen.getByRole("list", { name: "Bottom lines" });
  expect(within(lines).getByText("Leverage is high.")).toBeInTheDocument();
  expect(
    within(lines).getByRole("link", { name: "Read this bottom line in Evidence" }),
  ).toBeInTheDocument();
  expect(within(lines).getByText(/wrote no bottom line/)).toBeInTheDocument();
  expect(within(lines).getAllByRole("link", { name: /^Source for / })).toHaveLength(3);
});

it("groups limitations into one well per module and keeps the in-page anchor", () => {
  mocks.limitations = [
    {
      id: "CP-2",
      name: "Fundamental credit",
      entry: entry("CP-2"),
      text: "Two periods only.",
      line: 7,
    },
    {
      id: "CP-2",
      name: "Fundamental credit",
      entry: entry("CP-2"),
      text: "See debt.xlsx.",
      line: 8,
    },
    { id: "CP-3", name: "Security selection", entry: entry("CP-3"), text: "No yields.", line: 9 },
  ];
  mocks.lines = [
    line("CP-4", "Legal & covenants", "Not assessable", "Not assessable: no document."),
  ];
  render(<LimitsRow {...props} />);
  const tile = screen.getByRole("region", { name: "What this run could not do" });
  const heading = within(tile).getByRole("heading", {
    level: 3,
    name: "What this run could not do",
  });
  expect(heading).toHaveAttribute("id", "overview-limitations");
  expect(heading).toHaveAttribute("tabindex", "-1");
  const wells = within(tile)
    .getAllByRole("listitem")
    .filter((li) => li.className.includes("border-dashed"));
  expect(wells).toHaveLength(3);
  expect(wells[0]).toHaveClass("border-warning-mark", "gap-hatch");
  expect(wells[0]?.className).not.toMatch(/repeating-linear-gradient/);
  for (const link of within(tile).getAllByRole("link", { name: /^(Legal|Fundamental|Security)/ }))
    expect(link).toHaveClass("min-h-8", "max-[480px]:min-h-11");
  expect(within(wells[0] as HTMLElement).getByText("Not assessable")).toBeInTheDocument();
  expect(within(wells[1] as HTMLElement).getByText("2 recorded")).toBeInTheDocument();
  expect(
    within(tile).getByRole("link", { name: "Read this limitation in Evidence" }),
  ).toBeInTheDocument();
});

it("says so when no limitation is listed", () => {
  render(<LimitsRow {...props} />);
  expect(screen.getByText(/No limitation is listed on this page for this run/)).toBeInTheDocument();
});

it("keeps the dates tile and its anchor for a run with no recorded dates, and says so", () => {
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveAttribute("id", "overview-dates");
  expect(within(tile).getByRole("status")).toHaveTextContent(
    "No dated events were recorded in this run.",
  );
  expect(within(tile).queryByRole("listitem")).toBeNull();
});

it("keeps the invalid as-of and nothing-upcoming sentences", () => {
  mocks.calendar = [event("2025-01-01", "Past")];
  mocks.upcoming = null;
  const { rerender } = render(<DatesRow {...props} />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "This run needs a valid as-of date to identify upcoming events.",
  );
  mocks.upcoming = [];
  rerender(<DatesRow {...props} />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "No recorded event dates fall on or after this run’s as-of date.",
  );
});

it("places marks by date, keeps marks clear of each other, and lists at most five events", () => {
  const rows = [
    event("2025-07-01", "Securitization matures"),
    event("2025-07-01", "Coupon"),
    event("2026-07-01", "Notes mature"),
    event("2027-07-01", "Loan matures"),
    event("2027-08-01", "Second loan"),
    event("2028-01-01", "Sixth"),
  ];
  mocks.calendar = rows;
  mocks.upcoming = rows;
  const { container } = render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveAttribute("id", "overview-dates");
  expect(within(within(tile).getByRole("list")).getAllByRole("listitem")).toHaveLength(5);
  expect(within(tile).queryByText("Sixth")).toBeNull();
  const marks = [...container.querySelectorAll<HTMLElement>("[data-mark]")];
  // The two events of 1 July 2025 share one mark; the two a month apart take separate lanes.
  expect(marks.map((mark) => mark.style.left)).toEqual([
    "0%",
    expect.any(String),
    expect.any(String),
    "100%",
  ]);
  expect(marks[0]).toHaveTextContent("1–2");
  const tops = (at: number) => marks[at]?.style.top;
  expect(tops(2)).not.toBe(tops(3));
  expect(within(tile).getByText("2026")).toBeInTheDocument();
});

it("collapses one event recorded by several modules into one mark that names them", () => {
  const twice = [
    { ...event("2025-03-31", "Synthetic note"), owner: "Source readiness" },
    { ...event("2025-03-31", "Synthetic note"), owner: "Legal & covenants" },
    { ...event("2025-03-31", "Synthetic note"), owner: "Liquidity" },
    event("2026-07-01", "Notes mature"),
  ];
  mocks.calendar = twice;
  mocks.upcoming = twice;
  const { container } = render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  const items = within(within(tile).getByRole("list")).getAllByRole("listitem");
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveTextContent("Source readiness, Legal & covenants, Liquidity");
  expect(container.querySelectorAll("[data-mark]")).toHaveLength(2);
  expect(within(within(tile).getByRole("list")).getByText("Notes mature")).toBeVisible();
});

it("prints dates as the header does, labels the axis ends, and gives each record its own trace", () => {
  const rows = [event("2025-03-31", "Coupon"), event("2026-07-01", "Notes mature")];
  mocks.calendar = rows;
  mocks.upcoming = rows;
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(tile).not.toHaveTextContent("2025-03-31");
  expect(within(tile).getAllByText("31 March 2025").length).toBeGreaterThan(0);
  expect(within(tile).getAllByText("1 July 2026").length).toBeGreaterThan(0);
  expect(within(tile).queryByRole("link", { name: "Evidence" })).toBeNull();
  // Without the report's trace provider the shared control falls back to its Evidence link.
  expect(
    within(tile).getByRole("link", { name: "Source for Coupon on 31 March 2025 from Liquidity" }),
  ).toHaveAttribute("href", "/report/run#evidence/Coupon");
});

it("draws one date with its tick and label in the middle of the axis", () => {
  const rows = [event("2025-03-31", "Coupon")];
  mocks.calendar = rows;
  mocks.upcoming = rows;
  const { container } = render(<DatesRow {...props} />);
  expect(container.querySelector<HTMLElement>("[data-mark]")?.style.left).toBe("50%");
  expect(container.querySelector("[data-axis-label]")).toHaveTextContent("31 March 2025");
});

it("says the recorded events could not be placed, not that none were recorded, when only gaps exist", () => {
  mocks.gaps = [{ owner: "Legal & covenants", reason: "No date stated." }];
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(
    within(tile).getByText(
      "No recorded event could be placed on the time axis. The issuer calendar lists the recorded gaps.",
    ),
  ).toBeVisible();
  expect(within(tile).queryByText("No dated events were recorded in this run.")).toBeNull();
  expect(within(tile).getByRole("link", { name: "Open issuer calendar" })).toHaveAttribute(
    "href",
    "#calendar",
  );
});

it("keeps rows apart when their status, relevance or timing differ, and never merges unnamed events", () => {
  const base = event("2025-03-31", "Synthetic note");
  const lapsed = {
    ...base,
    owner: "Legal & covenants",
    cells: [
      "2025-03-31",
      "",
      "",
      "Synthetic note",
      "Scenario — only if the waiver lapses",
      "",
      "Cost",
    ],
  };
  const unnamed = (owner: string) => ({
    ...event("2025-06-30", ""),
    owner,
    cells: ["2025-06-30", "", "", "", "Scheduled", "", "Maturity wall"],
  });
  const rows = [base, lapsed, unnamed("Liquidity"), unnamed("Downside")];
  mocks.calendar = rows;
  mocks.upcoming = rows;
  render(<DatesRow {...props} />);
  const items = within(
    within(screen.getByRole("region", { name: "Dates to watch" })).getByRole("list"),
  ).getAllByRole("listitem");
  expect(items).toHaveLength(4);
  expect(items[1]).toHaveTextContent("Scenario — only if the waiver lapses");
  expect(items[1]).toHaveTextContent("Legal & covenants · Cost");
  expect(items[0]).not.toHaveTextContent("Legal & covenants");
});

it("shows the next five dated items and says how many more are on the Calendar", () => {
  const rows = [
    "2025-07-01",
    "2025-08-01",
    "2025-09-01",
    "2025-10-01",
    "2025-11-01",
    "2025-12-01",
    "2026-01-01",
  ].map((iso, at) => event(iso, `Event ${String(at + 1)}`));
  mocks.calendar = rows;
  mocks.upcoming = rows;
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(within(tile).getByRole("list")).getAllByRole("listitem")).toHaveLength(5);
  expect(
    within(tile).getByRole("link", { name: "2 later events in the Calendar" }),
  ).toHaveAttribute("href", "#calendar");
});

it("groups events of one day under one mark with their count, and names marks only in the numbered list", () => {
  const rows = [
    event("2025-07-01", "Coupon"),
    event("2025-07-01", "Securitization matures"),
    event("2026-07-01", "Notes mature"),
  ];
  mocks.calendar = rows;
  mocks.upcoming = rows;
  const { container } = render(<DatesRow {...props} />);
  const marks = [...container.querySelectorAll<HTMLElement>("[data-mark]")];
  expect(marks).toHaveLength(2);
  expect(marks[0]).toHaveTextContent("1–2");
  expect(container.querySelector("[data-mark] .truncate")).toBeNull();
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(within(tile).getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
});

it("prints a date that is not a full date as the handoff states it", () => {
  const quarter = {
    ...event("2025-07-01", "Review"),
    cells: ["2025-Q3", "", "", "Review", "Scenario", "", "Rating"],
  };
  const year = {
    ...event("2026-01-01", "Maturity"),
    cells: ["2026", "", "", "Maturity", "Scheduled", "", "Wall"],
  };
  mocks.calendar = [quarter, year];
  mocks.upcoming = [quarter, year];
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(tile).getAllByText("2025-Q3").length).toBeGreaterThan(0);
  expect(within(tile).getAllByText("2026").length).toBeGreaterThan(0);
  expect(tile).not.toHaveTextContent(/1 July 2025|1 January 2026/);
});

it("draws the limitations as one list when every module recorded one, after the blocked wells", () => {
  mocks.limitations = [
    {
      id: "CP-2",
      name: "Fundamental credit",
      entry: entry("CP-2"),
      text: "Two periods only.",
      line: 7,
    },
    { id: "CP-3", name: "Security selection", entry: entry("CP-3"), text: "No yields.", line: 9 },
  ];
  mocks.lines = [line("CP-4", "Legal & covenants", "Not assessable", "No document.")];
  render(<LimitsRow {...props} />);
  const tile = screen.getByRole("region", { name: "What this run could not do" });
  expect(within(tile).queryAllByText(/recorded$/)).toHaveLength(0);
  const list = within(tile).getByRole("list", { name: "Limitations by module" });
  expect(list.children).toHaveLength(2);
  expect(within(list).getByRole("link", { name: "Fundamental credit" })).toHaveAttribute(
    "href",
    "#modules/CP-2",
  );
});

it("says how many recorded events could not be placed on the axis, beside the dated ones, and no more", () => {
  const rows = [event("2025-07-01", "Coupon")];
  mocks.calendar = rows;
  mocks.upcoming = rows;
  mocks.gaps = [
    {
      owner: "Liquidity",
      reason: "No date.",
      unplaced: [
        { href: "a", cells: [] },
        { href: "b", cells: [] },
      ],
    },
  ];
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(
    within(tile).getByRole("link", {
      name: "2 recorded events could not be placed on the axis; see the Calendar",
    }),
  ).toHaveAttribute("href", "#calendar");
  expect(tile).not.toHaveTextContent(/no date/);
  cleanup();
  // An event dated "H2 2025" has a date the axis cannot place, not no date.
  mocks.gaps = [
    {
      owner: "Liquidity",
      reason: "Half-year date.",
      unplaced: [{ href: "a", cells: ["H2 2025"] }],
    },
  ];
  render(<DatesRow {...props} />);
  expect(
    screen.getByRole("link", {
      name: "1 recorded event could not be placed on the axis; see the Calendar",
    }),
  ).toBeVisible();
  expect(screen.getByRole("region", { name: "Dates to watch" })).not.toHaveTextContent(/no date/);
});

it("draws event cells through the reader rule: markers removed, a cell carrying an unnamed id not drawn", () => {
  const marked = {
    ...event("2025-07-01", "Covenant test [E3]"),
    cells: ["2025-07-01", "", "", "Covenant test [E3]", "Per T4.18 test", "", "Wall"],
  };
  mocks.calendar = [marked];
  mocks.upcoming = [marked];
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(within(tile).getByRole("list")).getByText("Covenant test")).toBeVisible();
  expect(tile).not.toHaveTextContent(/\[E3\]|T4\.18/);
});
