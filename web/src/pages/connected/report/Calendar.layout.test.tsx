import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
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

const row = (date: string, precision: string, name: string, status: string) => [
  date,
  precision,
  "2026-09-30",
  name,
  status,
  "file",
  "Wall",
];

/** The jsdom plot has no layout, so the axis draws at its 560px fallback width. */
const PLOT_PX = 560;
const MARGIN_PX = 16;

/** The plot is laid out at this width, as a 1440px window gives it. */
function laidOutAt(px: number) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(px);
}

function draw(data: string[][], asOf?: string) {
  render(<Calendar calendar={buildCalendar([handoff(data)], "current")} asOf={asOf} />);
  return within(screen.getByRole("group", { name: /^Events on a time axis/ }));
}

/**
 * A browser window of this width. Rewritten from a mock that matched only the 640px phone query:
 * the axis now switches at 720px and the table disclosure at 641px, so queries are answered
 * from the width itself.
 */
function mockViewport(width: number) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      const limit = Number(/(\d+)px/.exec(query)?.[1]);
      const matches = query.includes("max-width") ? width <= limit : width >= limit;
      return {
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }),
  );
}

const mockPhone = (matches: boolean) => {
  mockViewport(matches ? 390 : 1440);
};

beforeEach(() => {
  mockPhone(false);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const september = Array.from({ length: 10 }, (_, at) =>
  row(
    `2026-09-${String(3 + at * 2).padStart(2, "0")}`,
    "day",
    `September event ${String(at)}`,
    "Scheduled",
  ),
);
const withQuarter = [...september, row("2026-Q4", "quarter", "Annual report", "Scheduled")];

/** Pixels from the plot's left edge to the far edge of a label, read from the drawn styles. */
function labelEdges(button: HTMLElement) {
  const label = button.querySelector<HTMLElement>("[data-event-label]");
  const side = label?.getAttribute("data-label-side");
  const max = Number.parseFloat(label?.style.maxWidth ?? "");
  const start = (Number.parseFloat(button.style.left) / 100) * PLOT_PX;
  const bar = button.querySelector<HTMLElement>("[data-span-bar]");
  const span = Number.parseFloat(bar?.style.width ?? "0");
  const hit = Math.max(span, 32);
  if (side === "left") return { side, left: start - 22 - 6 - max, right: start + hit };
  if (side === "inside") return { side, left: start, right: start + max };
  return { side, left: start, right: start + (bar ? hit : 22) + 6 + max };
}

it("N5: a quarter that ends the axis keeps its label inside the plot and does not widen it", () => {
  const axis = draw(withQuarter);
  const quarter = axis.getByRole("button", { name: /Annual report, 2026-Q4/ });
  const edges = labelEdges(quarter);
  expect(edges.side).not.toBe("right");
  expect(edges.left).toBeGreaterThanOrEqual(-MARGIN_PX);
  expect(edges.right).toBeLessThanOrEqual(PLOT_PX + MARGIN_PX);
  axis.getAllByRole("button").forEach((button) => {
    const { left, right } = labelEdges(button);
    expect(left).toBeGreaterThanOrEqual(-MARGIN_PX);
    expect(right).toBeLessThanOrEqual(PLOT_PX + MARGIN_PX);
  });
});

it("N5: a quarter that is the only event draws its label inside its own bar", () => {
  const axis = draw([row("2026-Q4", "quarter", "Annual report", "Scheduled")]);
  const label = axis
    .getByRole("button", { name: /Annual report/ })
    .querySelector("[data-event-label]");
  expect(label).toHaveAttribute("data-label-side", "inside");
  expect(label).toHaveTextContent("Annual report");
  expect(Number.parseFloat((label as HTMLElement).style.maxWidth)).toBeGreaterThan(60);
});

it("N6: a short name beside empty space is not truncated", () => {
  const axis = draw([
    row("2026-01-10", "day", "AGM", "Scheduled"),
    row("2026-06-30", "day", "Check waiver", "Scheduled"),
    row("2026-12-20", "day", "Year end", "Historical"),
  ]);
  for (const name of ["AGM", "Check waiver"]) {
    const label = axis
      .getByRole("button", { name: new RegExp(`^${name},`) })
      .querySelector<HTMLElement>("[data-event-label]");
    expect(label).toHaveTextContent(name);
    expect(label?.textContent).not.toContain("…");
    expect(Number.parseFloat(label?.style.maxWidth ?? "")).toBeGreaterThanOrEqual(150);
    expect(label?.style.width).toBe("");
  }
});

it("N6: names are measured from real text widths when the browser can measure them", () => {
  const events = [
    row("2026-01-01", "day", "AGM", "Scheduled"),
    row("2026-07-20", "day", "Waiver", "Scheduled"),
    row("2026-12-31", "day", "Close", "Scheduled"),
  ];
  const tops = () => {
    const axis = draw(events);
    const top = (name: RegExp) => axis.getByRole("button", { name }).style.top;
    const result = [top(/^AGM/), top(/^Waiver/)];
    cleanup();
    return result;
  };
  const [first, second] = tops();
  expect(first).toBe(second);
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 Chrome/130");
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    fontStyle: "normal",
    fontWeight: "500",
    fontSize: "14px",
    fontFamily: "sans-serif",
    getPropertyValue: () => "",
  } as unknown as CSSStyleDeclaration);
  const context = { font: "", measureText: (text: string) => ({ width: text.length * 30 }) };
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const [wideFirst, wideSecond] = tops();
  getContext.mockRestore();
  vi.restoreAllMocks();
  expect(wideFirst).not.toBe(wideSecond);
});

// Rewritten: the lane used to give up each label's date to fit ten events two days apart in
// eight rows. A label now always keeps its date, so events whose marks overlap take a row each;
// the "handful of rows" promise holds for events that are spread out.
it("N7: ten events two days apart keep their dates and take at most a row each", () => {
  laidOutAt(1200);
  const axis = draw(withQuarter);
  const buttons = axis.getAllByRole("button");
  const tops = new Set(buttons.map((button) => button.style.top));
  expect(tops.size).toBeLessThanOrEqual(buttons.length);
  expect(tops.size).toBeGreaterThan(1);
  buttons.forEach((button) => {
    const date = /, (\d{4}-[\dQ-]+),/.exec(button.getAttribute("aria-label") ?? "")?.[1];
    expect(button.querySelector("[data-event-label]")).toHaveTextContent(date ?? "no date");
  });
});

it("N7: ten events spread across a year take a handful of rows", () => {
  laidOutAt(1200);
  const axis = draw(
    Array.from({ length: 10 }, (_, at) =>
      row(
        `2026-${String(at + 1).padStart(2, "0")}-15`,
        "day",
        `Spread event ${String(at)}`,
        "Scheduled",
      ),
    ),
  );
  const tops = new Set(axis.getAllByRole("button").map((button) => button.style.top));
  expect(tops.size).toBeLessThanOrEqual(3);
});

it("N7: events whose labels do not collide share one row", () => {
  laidOutAt(1200);
  const axis = draw([
    row("2026-01-10", "day", "AGM", "Scheduled"),
    row("2026-06-30", "day", "Check waiver", "Scheduled"),
    row("2026-12-20", "day", "Year end", "Scheduled"),
  ]);
  const tops = new Set(axis.getAllByRole("button").map((button) => button.style.top));
  expect(tops.size).toBe(1);
});

it("N7c: the as-of rule stops above the axis-range row so it never strikes a date", () => {
  draw(withQuarter, "2026-09-10");
  const rule = document.querySelector("[data-as-of-rule]");
  expect(rule?.parentElement?.parentElement).toHaveClass("bottom-7");
  expect(document.querySelector("[data-axis-end='start']")).toHaveTextContent("2026-09-03");
  expect(rule?.closest("[data-testid='event-axis']")).not.toBeNull();
});

it("D19: the Overview link is 32px tall, 44px on a phone", () => {
  draw(withQuarter);
  expect(screen.getByRole("link", { name: "Overview" })).toHaveClass(
    "min-h-8",
    "max-[480px]:min-h-11",
  );
});

const phoneRows = [
  row("2026-09-03", "day", "Covenant test", "Scheduled"),
  row("2026-01-20", "day", "Notes issued", "Historical"),
  row("2026-Q4", "quarter", "Annual report", "Scheduled"),
  row("2026-10-15", "day", "Sponsor exit case", "Scenario — Conditional"),
  row("2026-11-05", "day", "Review", "User reminder"),
];

it("phone: draws the axis down the page, in date order, with no sideways plot", () => {
  mockPhone(true);
  const axis = draw(phoneRows, "2026-09-20");
  const region = screen.getByTestId("event-axis");
  expect(region).not.toHaveClass("overflow-x-auto");
  expect(region.querySelector(".min-w-\\[720px\\]")).toBeNull();
  expect(screen.queryByText(/Scroll the axis sideways/)).toBeNull();
  const names = axis.getAllByRole("button").map((button) => button.getAttribute("aria-label"));
  expect(names).toEqual([
    "Notes issued, 2026-01-20, day, Historical",
    "Covenant test, 2026-09-03, day, Scheduled",
    "Annual report, 2026-Q4, quarter, Scheduled",
    "Sponsor exit case, 2026-10-15, day, Scenario — Conditional",
    "Review, 2026-11-05, day, User reminder",
  ]);
});

it("phone: each row shows the date in mono, the name and the status word", () => {
  mockPhone(true);
  const axis = draw(phoneRows);
  const button = axis.getByRole("button", { name: /Sponsor exit case/ });
  expect(button.querySelector(".font-mono")).toHaveTextContent("2026-10-15");
  expect(button).toHaveTextContent("Sponsor exit case");
  expect(button).toHaveTextContent("Scenario — Conditional");
  expect(button).toHaveClass("min-h-11");
  expect(button).toHaveAttribute("data-event-category", "Scenario");
});

it("phone: month labels sit on the rail where the month changes", () => {
  mockPhone(true);
  draw(phoneRows);
  const months = Array.from(document.querySelectorAll("[data-rail-month]")).map(
    (element) => element.textContent,
  );
  expect(months).toEqual(["Jan 2026", "Sep 2026", "2026 Q4", "Oct 2026", "Nov 2026"]);
});

it("phone: a period draws a bracket on the rail; a day does not", () => {
  mockPhone(true);
  const axis = draw(phoneRows);
  const quarter = axis.getByRole("button", { name: /Annual report/ });
  expect(quarter).toHaveAttribute("data-event-shape", "span");
  expect(document.querySelectorAll("[data-span-bracket]")).toHaveLength(1);
  expect(document.querySelector("[data-span-bracket]")).toHaveAttribute(
    "data-span-bracket",
    "Annual report",
  );
});

it("phone: the as-of rule sits between the events either side of its date", () => {
  mockPhone(true);
  draw(phoneRows, "2026-09-20");
  const rule = document.querySelector("[data-as-of-rule='2026-09-20']");
  expect(rule).not.toBeNull();
  expect(screen.getByText("As of 2026-09-20")).toBeInTheDocument();
  const order = Array.from(
    screen.getByTestId("event-axis").querySelectorAll("button, [data-as-of-rule]"),
  ).map((element) => element.getAttribute("data-as-of-rule") ?? element.getAttribute("aria-label"));
  const at = order.indexOf("2026-09-20");
  expect(order[at - 1]).toMatch(/^Covenant test/);
  expect(order[at + 1]).toMatch(/^Annual report/);
});

it("phone: legend toggles still hide a lane and its events", () => {
  mockPhone(true);
  const axis = draw(phoneRows);
  fireEvent.click(screen.getByRole("button", { name: "User reminder, 1 event" }));
  expect(axis.queryByRole("button", { name: /Review/ })).toBeNull();
  expect(axis.getAllByRole("button")).toHaveLength(4);
  expect(document.querySelectorAll("[data-rail-month]")).toHaveLength(4);
});

it("phone: a row opens its table row, and the axis range is still dated", () => {
  mockPhone(true);
  const axis = draw(phoneRows);
  fireEvent.click(axis.getByRole("button", { name: /Review/ }));
  const table = within(screen.getByRole("table", { name: "Published events" }));
  expect(document.activeElement).toBe(
    table.getByRole("rowheader", { name: "Review" }).closest("tr"),
  );
  expect(document.querySelector("[data-axis-end='start']")).toHaveTextContent("2026-01-20");
  expect(document.querySelector("[data-axis-end='end']")).toHaveTextContent("2026-Q4");
});
