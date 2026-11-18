import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import type { moduleBottomLines, runLimitations } from "../reportView";
import { ModuleBottomLines, RunLimitations } from "./OverviewModules";

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

const rows = [
  {
    id: "CP-1",
    name: "Financial foundation",
    state: "Delivered",
    entry: entry("CP-1"),
    text: "Leverage is high.",
    referenced: false,
    line: 4,
  },
  {
    id: "CP-3",
    name: "Securities",
    state: "Delivered",
    entry: entry("CP-3"),
    text: null,
    referenced: true,
    line: 5,
  },
  {
    id: "CP-4",
    name: "Legal and covenants",
    state: "Delivered",
    entry: entry("CP-4"),
    text: null,
    referenced: false,
    line: null,
  },
] as unknown as ReturnType<typeof moduleBottomLines>;

it("draws each row's trace control beside its sentence, not alone on a line below", () => {
  render(<ModuleBottomLines run={{ folder: "run" } as PublishedRun} rows={rows} />);
  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(3);
  for (const item of items) {
    const control = within(item).getByRole("link", { name: /^Source for / });
    const content = control.parentElement;
    // The control and the row's sentence, link or gap share one flex row.
    expect(content?.className).toMatch(/\bflex\b/);
    expect(content?.children.length).toBe(2);
    expect(content?.parentElement).toBe(item);
  }
  const first = screen.getByText("Leverage is high.");
  expect(first.parentElement).toBe(
    within(items[0] as HTMLElement).getByRole("link", { name: /^Source for / }).parentElement,
  );
});

it("names the module once per limitation group, with one trace control beside each limitation", () => {
  const limitations = [
    {
      id: "CP-1",
      name: "Financial foundation",
      entry: entry("CP-1"),
      text: "Interim only.",
      line: 9,
    },
    { id: "CP-1", name: "Financial foundation", entry: entry("CP-1"), text: "No audit.", line: 12 },
  ] as unknown as ReturnType<typeof runLimitations>;
  render(<RunLimitations run={{ folder: "run" } as PublishedRun} rows={limitations} />);
  expect(screen.getAllByText(/Financial foundation/)).toHaveLength(1);
  expect(screen.getByText("Financial foundation (2)")).toBeInTheDocument();
  for (const text of ["Interim only.", "No audit."]) {
    const item = screen.getByText(text).closest("li") as HTMLElement;
    expect(
      within(item).getAllByRole("link", {
        name: "Source for this limitation from Financial foundation",
      }),
    ).toHaveLength(1);
  }
});
