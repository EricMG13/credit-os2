import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { PipelineRow } from "./PipelineRow";

const mocks = vi.hoisted(() => ({ lines: [] as unknown[] }));
vi.mock("../../reportView", () => ({
  moduleBottomLines: () => mocks.lines,
  runLimitations: () => [],
  moduleState: () => "Delivered",
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
  state = "Delivered",
  text: string | null = "A finding.",
) => ({
  id,
  name,
  state,
  entry: entry(id),
  text,
  referenced: false,
  line: 4,
});
const props = {
  snapshot: {} as Snapshot,
  run: { folder: "run", asOf: "2025-03-31" } as PublishedRun,
  view: { lead: entry("CP-6"), entries: [] } as unknown as ReportView,
};

afterEach(() => {
  cleanup();
  mocks.lines = [];
});

const IDS = [
  "CP-0",
  "CP-1",
  "CP-2",
  "CP-2A",
  "CP-2E",
  "CP-2G",
  "CP-3",
  "CP-3C",
  "CP-4",
  "CP-5",
  "CP-8",
];

it("lists the bottom lines in stage order, as the graph has them (item 22)", () => {
  // The service sends them in its own order, with Legal & covenants early.
  mocks.lines = [
    line("CP-4", "Legal & covenants"),
    ...IDS.filter((id) => id !== "CP-4").map((id) => line(id, `Module ${id}`)),
  ];
  render(<PipelineRow {...props} />);
  const names = within(screen.getByRole("list", { name: "Bottom lines" }))
    .getAllByRole("heading", { level: 4 })
    .map((h) => h.textContent);
  const stageOrder = [
    "CP-0",
    "CP-1",
    "CP-2",
    "CP-2A",
    "CP-2E",
    "CP-2G",
    "CP-3",
    "CP-3C",
    "CP-4",
    "CP-5",
    "CP-8",
  ];
  expect(names).toEqual(
    stageOrder.map((id) => (id === "CP-4" ? "Legal & covenants" : `Module ${id}`)),
  );
  // The lead (CP-6) is a graph node but has no bottom line of its own to place.
});

it("balances thirteen lines 5 / 4 / 4 in three columns and 7 / 6 in two (item 18)", () => {
  mocks.lines = Array.from({ length: 13 }, (_, i) =>
    line(`CP-${String(i)}`, `Module ${String(i)}`),
  );
  render(<PipelineRow {...props} />);
  const items = within(screen.getByRole("list", { name: "Bottom lines" })).getAllByRole("listitem");
  const column = (attr: string) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const key = item.style.getPropertyValue(attr);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.values()];
  };
  expect(column("--c3")).toEqual([5, 4, 4]);
  expect(column("--c2")).toEqual([7, 6]);
  // Filled down each column in pipeline order: the first five are the first column.
  expect(items.slice(0, 5).map((item) => item.style.getPropertyValue("--c3"))).toEqual([
    "1",
    "1",
    "1",
    "1",
    "1",
  ]);
  expect(items[5]?.style.getPropertyValue("--c3")).toBe("2");
});

it("draws the visible heading as the region's own name (item 21)", () => {
  mocks.lines = [line("CP-0", "Source readiness")];
  render(<PipelineRow {...props} />);
  const region = screen.getByRole("region", { name: "Bottom line by module" });
  expect(
    within(region).getByRole("heading", { level: 3, name: "Bottom line by module" }),
  ).toBeVisible();
  expect(within(region).queryByText("Module pipeline")).toBeNull();
});

it("gives a blocked module its full name, a dashed orange outline, the slash icon and the word (item 19)", () => {
  mocks.lines = [
    line("CP-0", "Source readiness"),
    line("CP-4", "Legal & covenants", "Not assessable", null),
  ];
  render(<PipelineRow {...props} />);
  const link = within(screen.getByRole("list", { name: "Stages" })).getByRole("link", {
    name: /Legal & covenants/,
  });
  expect(link).toHaveTextContent("Legal & covenants");
  expect(link).toHaveClass("border-dashed", "border-warning-mark", "bg-warning-fill");
  const word = within(link).getByText("Not assessable");
  expect(word).toBeVisible();
  expect(word.parentElement?.querySelector("svg[data-shape='slashed circle']")).not.toBeNull();
  expect(link.querySelector(".line-clamp-2, [class*='line-clamp']")?.textContent).toBe(
    "Legal & covenants",
  );
});

it("keys only the states present, and says nothing of a blocked module when none is (item 20)", () => {
  mocks.lines = [line("CP-0", "Source readiness"), line("CP-2", "Fundamental credit")];
  render(<PipelineRow {...props} />);
  const key = screen.getByRole("list", { name: "Pipeline key" });
  expect(
    within(key)
      .getAllByRole("listitem")
      .map((li) => li.textContent),
  ).toEqual(["Delivered"]);
  expect(screen.queryByText(/nothing passed on/)).toBeNull();
});
