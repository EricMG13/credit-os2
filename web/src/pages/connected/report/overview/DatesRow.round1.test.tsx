import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { DatesRow } from "./DatesRow";

const mocks = vi.hoisted(() => ({ rows: [] as unknown[] }));
vi.mock("../Calendar", () => ({
  buildCalendar: () => ({ rows: mocks.rows, gaps: [] }),
  upcomingCalendarRows: () => mocks.rows,
}));

const props = {
  snapshot: {} as Snapshot,
  run: { folder: "run", asOf: "2025-03-31" } as PublishedRun,
  view: { entries: [] } as unknown as ReportView,
};
const day = Date.parse("2027-06-30T00:00:00Z");
const row = (name: string, line: number) => ({
  cells: ["2027-06-30", "", "", name, "Scheduled", "", "Maturity wall"],
  from: day,
  to: day,
  href: `/report/run#evidence/${String(line)}`,
  owner: "Liquidity",
  timingWithinRecordedPeriod: false,
});

afterEach(() => {
  cleanup();
  mocks.rows = [];
});

it("keeps two maturities on one date apart when both names are only the evidence placeholder", () => {
  mocks.rows = [row("See Evidence", 10), row("See Evidence", 11)];
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(within(tile).getByRole("list")).getAllByRole("listitem")).toHaveLength(2);
});

it("still merges identical named rows", () => {
  mocks.rows = [row("Notes due 2027", 10), row("Notes due 2027", 11)];
  render(<DatesRow {...props} />);
  const tile = screen.getByRole("region", { name: "Dates to watch" });
  expect(within(within(tile).getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
});
