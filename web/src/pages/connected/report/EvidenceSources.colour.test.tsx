import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, Snapshot } from "../publishedReport";
import { EvidenceSources, type SourceGroup } from "./EvidenceSources";

afterEach(cleanup);

const row = (name: string, type: string | null, readBy: string[]) => ({
  name,
  type,
  documentDate: "2025-03-31",
  readBy,
  sha256: name.padEnd(64, "0"),
});
const snapshot = { chips: {} } as unknown as Snapshot;
const entries: OutputEntry[] = [];

function show(groups: SourceGroup[], module?: string) {
  return render(
    <EvidenceSources
      folder="case"
      entries={entries}
      sourceGroups={groups}
      modules={["CP-1", "CP-2", "CP-3", "CP-4"]}
      snapshot={snapshot}
      module={module}
    />,
  );
}

const dotOf = (name: string) => {
  const cell = screen.getByText(name).closest("tr")?.querySelector("[data-part='type-dot']");
  return cell?.className ?? null;
};

const SIX: SourceGroup[] = [
  {
    label: "Used by a module",
    rows: [
      row("a", "pdf", ["CP-1"]),
      row("b", "htm.jsonl", ["CP-1"]),
      row("c", "xlsx", ["CP-1"]),
      row("d", "txt", ["CP-1"]),
      row("e", "docx", ["CP-1"]),
    ],
  },
  { label: "Supplied, not used", rows: [row("f", "PDF", []), row("g", "pdf", [])] },
];

it("gives six distinct type words slots 3, 4, 5, 6, 8, 8 in first-appearance order", () => {
  show(SIX);
  const classes = ["a", "b", "c", "d", "e", "f"].map(dotOf);
  expect(classes.map((value) => /bg-category-\d/.exec(value ?? "")?.[0])).toEqual([
    "bg-category-3",
    "bg-category-4",
    "bg-category-5",
    "bg-category-6",
    "bg-category-8",
    "bg-category-8",
  ]);
  // The same word in another group keeps its slot (case differs: PDF is its own word).
  expect(dotOf("g")).toContain("bg-category-3");
});

it("keeps a word's slot when the module filter hides the rows before it", () => {
  const groups: SourceGroup[] = [
    {
      label: "Used by a module",
      rows: [row("a", "pdf", ["CP-1"]), row("b", "htm.jsonl", ["CP-2"])],
    },
  ];
  show(groups, "CP-2");
  expect(screen.queryByText("a")).toBeNull();
  expect(dotOf("b")).toContain("bg-category-4");
});

it("draws no dot for a row without a type and lists only the drawn words in the legend", () => {
  show([
    {
      label: "Used by a module",
      rows: [row("a", "pdf", ["CP-1"]), row("b", null, ["CP-1"]), row("c", "txt", ["CP-1"])],
    },
  ]);
  expect(dotOf("b")).toBeNull();
  const legend = document.querySelector("[data-part='legend']") as HTMLElement;
  const dots = Array.from(legend.querySelectorAll("[data-legend='dot']"), (li) => li.textContent);
  expect(dots).toEqual(["pdf", "txt"]);
  expect(
    within(screen.getByText("b").closest("tr") as HTMLElement).getByText("Document type n.a."),
  ).toBeVisible();
});

it("shades the used-by chip against the most-read file shown", () => {
  show([
    {
      label: "Used by a module",
      rows: [
        row("a", "pdf", ["CP-1", "CP-2", "CP-3", "CP-4"]),
        row("b", "pdf", ["CP-1"]),
        row("c", "pdf", ["CP-1", "CP-2"]),
      ],
    },
  ]);
  const chip = (name: string) =>
    screen.getByText(name).closest("tr")?.querySelector<HTMLElement>("[data-part='used-by-count']");
  expect(chip("a")).toHaveTextContent(/^4$/);
  expect(chip("a")?.style.backgroundColor).toBe("var(--color-scale-amount-5)");
  // 1 of 4 is a quarter: the second of five equal bins.
  expect(chip("b")).toHaveTextContent(/^1$/);
  expect(chip("b")?.style.backgroundColor).toBe("var(--color-scale-amount-2)");
  // 2 of 4 is half: the third bin.
  expect(chip("c")?.style.backgroundColor).toBe("var(--color-scale-amount-3)");
  expect(
    screen.getByText(/Shade: the module count against the most-read file shown/),
  ).toBeVisible();
});

it("takes the largest count over the rows shown after the module filter", () => {
  show(
    [
      {
        label: "Used by a module",
        rows: [row("a", "pdf", ["CP-1", "CP-2", "CP-3"]), row("b", "pdf", ["CP-3"])],
      },
    ],
    "CP-3",
  );
  const chip = screen
    .getByText("b")
    .closest("tr")
    ?.querySelector<HTMLElement>("[data-part='used-by-count']");
  // Both rows are shown for CP-3, so the largest is 3 and 1 of 3 is the second bin.
  expect(chip?.style.backgroundColor).toBe("var(--color-scale-amount-2)");
});

it("states a not-recorded use as a gap, with no count chip and no shade legend", () => {
  show([
    { label: "Used by a module", rows: [] },
    { label: "Not recorded as used", rows: [row("a", "pdf", [])] },
  ]);
  const tr = screen.getByText("a").closest("tr") as HTMLElement;
  expect(within(tr).getByText("Use not recorded")).toBeVisible();
  expect(tr.querySelector("[data-part='used-by-count']")).toBeNull();
  expect(screen.queryByText(/Shade: the module count/)).toBeNull();
});
