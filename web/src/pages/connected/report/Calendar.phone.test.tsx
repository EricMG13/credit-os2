import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
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

const row = (date: string, precision: string, name: string, status = "Scheduled") => [
  date,
  precision,
  "2026-09-30",
  name,
  status,
  "file",
  "Wall",
];

/** A browser window of this width: the axis switches at 720px, the table disclosure at 641px. */
function mockViewport(width: number) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      const limit = Number(/(\d+)px/.exec(query)?.[1]);
      return {
        matches: query.includes("max-width") ? width <= limit : width >= limit,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function draw(data: string[][], asOf?: string) {
  render(<Calendar calendar={buildCalendar([handoff(data)], "current")} asOf={asOf} />);
  return within(screen.getByRole("group", { name: /^Events on a time axis/ }));
}

const december = [
  row("2026-12", "month", "December window"),
  row("2027-01-10", "day", "January event"),
];
const rowsOf = (element: Element) => (element as HTMLElement).style.gridRow;

it("F5a: the as-of rule inside a period sits within the period's bracket", () => {
  mockViewport(390);
  draw(december, "2026-12-15");
  const bracket = document.querySelector<HTMLElement>("[data-span-bracket]") as HTMLElement;
  const rule = document.querySelector("[data-as-of-rule]")?.closest("li") as HTMLElement;
  const [first, end] = rowsOf(bracket).split(" / ").map(Number);
  const line = Number(rowsOf(rule));
  expect(line).toBeGreaterThan(first ?? 0);
  expect(line).toBeLessThan(end ?? 0);
});

it("F5a: a rule after the period's end does not stretch the bracket over it", () => {
  mockViewport(390);
  draw(december, "2027-01-05");
  const bracket = document.querySelector<HTMLElement>("[data-span-bracket]") as HTMLElement;
  const rule = document.querySelector("[data-as-of-rule]")?.closest("li") as HTMLElement;
  expect(Number(rowsOf(rule))).toBeGreaterThanOrEqual(Number(rowsOf(bracket).split(" / ")[1]));
});

it("F5b: the as-of words start to the right of the period brackets", () => {
  mockViewport(390);
  draw(december, "2026-12-15");
  const label = document.querySelector<HTMLElement>("[data-as-of-label]") as HTMLElement;
  expect(label).toHaveTextContent("As of 2026-12-15");
  expect(Number.parseFloat(label.style.marginLeft)).toBeGreaterThanOrEqual(10);
  const rule = document.querySelector("[data-as-of-rule]");
  expect(rule).toHaveClass("inset-x-0");
});

it("F5c: the sequence is a list; months are headings; each event row is a 44px target", () => {
  mockViewport(390);
  const axis = draw(december, "2026-12-15");
  const list = axis.getByRole("list", { name: "Events in date order" });
  const items = within(list).getAllByRole("listitem");
  expect(items).toHaveLength(5);
  expect(
    within(list)
      .getAllByRole("heading", { level: 4 })
      .map((h) => h.textContent),
  ).toEqual(["Dec 2026", "Jan 2027"]);
  const buttons = within(list).getAllByRole("button");
  expect(buttons).toHaveLength(2);
  buttons.forEach((button) => {
    expect(button.closest("li")).not.toBeNull();
    expect(button).toHaveClass("min-h-11");
  });
  expect(axis.queryByRole("group", { name: /lane$/ })).toBeNull();
});

it("F5d: on a phone the table is behind a closed disclosure; a desktop has it open", () => {
  mockViewport(390);
  draw(december);
  const summary = screen.getByText("Table of events");
  expect(summary.closest("details")).not.toHaveAttribute("open");
  expect(summary).toHaveClass("max-[480px]:min-h-11");
  cleanup();
  mockViewport(1440);
  draw(december);
  expect(screen.getByText("Table of events").closest("details")).toHaveAttribute("open");
  cleanup();
  mockViewport(641);
  draw(december);
  expect(screen.getByText("Table of events").closest("details")).toHaveAttribute("open");
  cleanup();
  mockViewport(640);
  draw(december);
  expect(screen.getByText("Table of events").closest("details")).not.toHaveAttribute("open");
});

it("F5d: choosing an event on a phone opens the table and focuses its row", () => {
  mockViewport(390);
  const axis = draw(december);
  fireEvent.click(axis.getByRole("button", { name: /^January event/ }));
  const details = screen.getByText("Table of events").closest("details");
  expect(details).toHaveAttribute("open");
  const target = within(screen.getByRole("table", { name: "Published events" }))
    .getByRole("rowheader", { name: "January event" })
    .closest("tr");
  expect(document.activeElement).toBe(target);
});

it("F5e: the axis runs down the page at 720px and across it from 721px", () => {
  mockViewport(720);
  draw(december);
  expect(screen.getByRole("list", { name: "Events in date order" })).toBeInTheDocument();
  expect(document.querySelector(".min-w-\\[720px\\]")).toBeNull();
  cleanup();
  mockViewport(721);
  draw(december);
  expect(screen.queryByRole("list", { name: "Events in date order" })).toBeNull();
  expect(document.querySelector(".min-w-\\[720px\\]")).not.toBeNull();
});

it("F5e: a container narrower than the plot's 720px draws down the page at any viewport", () => {
  mockViewport(1440);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(700);
  draw(december);
  expect(screen.getByRole("list", { name: "Events in date order" })).toBeInTheDocument();
  cleanup();
  width.mockReturnValue(720);
  draw(december);
  expect(screen.queryByRole("list", { name: "Events in date order" })).toBeNull();
});
