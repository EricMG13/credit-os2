import { cleanup, render, screen, within } from "@testing-library/react";
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

const row = (date: string, precision: string, name: string, status = "Scheduled") => [
  date,
  precision,
  "2026-09-30",
  name,
  status,
  "file",
  "Wall",
];

const PLOT_PX = 1200;

/** The browser has laid the plot out at 1200px (jsdom has no layout, so size and observer are stubbed). */
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(PLOT_PX);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function draw(data: string[][], asOf?: string) {
  render(<Calendar calendar={buildCalendar([handoff(data)], "current")} asOf={asOf} />);
  return within(screen.getByRole("group", { name: /^Events on a time axis/ }));
}

/** The width a label needs in the jsdom estimate: date in mono, a gap, the name. */
const needed = (date: string, name: string) => Math.ceil(date.length * 7.4 + 6 + name.length * 7.2);

const labelOf = (button: HTMLElement) =>
  button.querySelector<HTMLElement>("[data-event-label]") as HTMLElement;
const maxOf = (button: HTMLElement) => Number.parseFloat(labelOf(button).style.maxWidth);

it("F1: six day events after an earlier one keep their dates and full names", () => {
  const names = Array.from({ length: 6 }, (_, at) => `Late event ${String(at + 1)}`);
  const axis = draw([
    row("2026-01-10", "day", "January event"),
    ...names.map((name, at) => row(`2026-12-${String(21 + at)}`, "day", name)),
  ]);
  names.forEach((name, at) => {
    const date = `2026-12-${String(21 + at)}`;
    const button = axis.getByRole("button", { name: new RegExp(`^${name},`) });
    expect(labelOf(button)).toHaveTextContent(date);
    expect(labelOf(button)).toHaveTextContent(name);
    expect(maxOf(button)).toBeGreaterThanOrEqual(needed(date, name));
  });
});

it("F1: a label inside a quarter span may use the span's full width", () => {
  const names = [
    "Annual report publication",
    "Rating review",
    "Bondholder meeting",
    "Refinancing of the term loan",
  ];
  const others = Array.from({ length: 12 }, (_, at) =>
    row(
      `2026-0${String(4 + (at % 5))}-${String(3 + at * 2).padStart(2, "0")}`,
      "day",
      `${names[at % 4] ?? ""} ${String(at)}`,
    ),
  );
  const axis = draw([
    row("2026-Q2", "quarter", "Refinancing of the term loan"),
    row("2026-08-15", "day", "Closing"),
    ...others,
  ]);
  const quarter = axis.getByRole("button", { name: /^Refinancing of the term loan, 2026-Q2/ });
  const label = labelOf(quarter);
  expect(label).toHaveAttribute("data-label-side", "inside");
  expect(maxOf(quarter)).toBeGreaterThan(500);
  expect(maxOf(quarter)).toBeGreaterThanOrEqual(needed("2026-Q2", "Refinancing of the term loan"));
  axis.getAllByRole("button").forEach((button) => {
    const date = /, (\d{4}-[\dQ-]+),/.exec(button.getAttribute("aria-label") ?? "")?.[1] ?? "";
    expect(labelOf(button)).toHaveTextContent(date);
  });
});

it("F1: narrowing the names is kept only when it saves rows, and the dates stay", () => {
  const long = "Refinancing of the term loan facility";
  const crowded = Array.from({ length: 6 }, (_, at) =>
    row(`2026-05-${String(1 + at * 4).padStart(2, "0")}`, "day", `${long} ${String(at)}`),
  );
  const axis = draw(crowded);
  const tops = new Set(axis.getAllByRole("button").map((button) => button.style.top));
  expect(tops.size).toBeLessThanOrEqual(3);
  axis.getAllByRole("button").forEach((button) => {
    expect(labelOf(button).querySelector(".font-mono")).not.toBeNull();
  });
  // A name that narrowing would not have helped is not narrowed.
  cleanup();
  const loose = draw([
    row("2026-02-01", "day", "Annual report publication"),
    row("2026-06-01", "day", "Rating review"),
  ]);
  const first = loose.getByRole("button", { name: /^Annual report publication/ });
  expect(maxOf(first)).toBeGreaterThanOrEqual(needed("2026-02-01", "Annual report publication"));
});

/** Pixels from the plot's left edge to the far edge of a tick label, from its drawn position. */
function tickEdge(span: HTMLElement) {
  const left = span.style.left;
  const at = left.endsWith("%")
    ? (Number.parseFloat(left) / 100) * PLOT_PX
    : Number.parseFloat(left);
  return at + span.textContent.length * 7.2 + 5;
}

it.each([
  ["a 14-month range ending 2028-01", "2026-11-20", "2028-01-05", "2028-01"],
  ["an 8-year range ending 2034", "2026-03-01", "2034-02-15", "2034"],
])("F4: the last tick label stays inside the plot for %s", (_name, from, to, last) => {
  draw([row(from, "day", "First"), row(to, "day", "Last")]);
  const labels = Array.from(document.querySelectorAll<HTMLElement>("[data-axis-tick-label]"));
  expect(labels.map((span) => span.getAttribute("data-axis-tick-label"))).toContain(last);
  labels.forEach((span) => {
    expect(tickEdge(span)).toBeLessThanOrEqual(PLOT_PX + 12);
  });
});

it("writes the year on the first tick of each calendar year, also when the step skips January", () => {
  draw([row("2025-03-15", "day", "First"), row("2026-12-28", "day", "Last")]);
  const text = (key: string) =>
    document.querySelector(`[data-axis-tick-label='${key}']`)?.textContent;
  expect(document.querySelector("[data-axis-tick-label='2026-01']")).toBeNull();
  expect(text("2025-04")).toBe("Apr 2025");
  expect(text("2025-06")).toBe("Jun");
  expect(text("2026-02")).toBe("Feb 2026");
  expect(text("2026-04")).toBe("Apr");
});

it("F4: tick labels never touch one another once the last one has slid left", () => {
  draw([row("2026-01-01", "day", "First"), row("2027-12-28", "day", "Last")]);
  const labels = Array.from(document.querySelectorAll<HTMLElement>("[data-axis-tick-label]"));
  const edges = labels.map((span) => [
    tickEdge(span) - span.textContent.length * 7.2 - 5,
    tickEdge(span),
  ]);
  edges.slice(1).forEach(([start], at) => {
    expect(start ?? 0).toBeGreaterThanOrEqual((edges[at]?.[1] ?? 0) + 6);
  });
});

it("F6: a bar's label is nudged clear of the as-of rule; the rule does not move", () => {
  const axis = draw([row("2026-Q4", "quarter", "Annual report publication")], "2026-10-05");
  const button = axis.getByRole("button", { name: /^Annual report publication/ });
  const label = labelOf(button);
  const rule = document.querySelector<HTMLElement>("[data-as-of-rule]") as HTMLElement;
  const ruleAt = (Number.parseFloat(rule.style.left) / 100) * PLOT_PX;
  expect(ruleAt).toBeGreaterThan(0);
  expect(label).toHaveAttribute("data-label-side", "inside");
  expect(Number.parseFloat(label.style.marginLeft)).toBeGreaterThan(0);
  expect(Number.parseFloat(label.style.marginLeft) + 6).toBeGreaterThan(ruleAt + 3);
});

it("F6: a mark's label does not run across the as-of rule where the other side is free", () => {
  const axis = draw(
    [
      row("2026-03-01", "day", "Before"),
      row("2026-06-10", "day", "Review"),
      row("2026-12-01", "day", "After"),
    ],
    "2026-06-20",
  );
  const label = labelOf(axis.getByRole("button", { name: /^Review/ }));
  expect(label).toHaveAttribute("data-label-side", "left");
});
