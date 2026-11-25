// The whole replayed TDG CP-4C handoff, verbatim (fixtures/cp4c_tdg_replay.md), with the chart
// metadata the store publishes for it: every chart table states a gap (typed from the handoff).
import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { RestructuringLead } from "./cp4c";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

const GAPS = [
  { title: "Recovery by class", table: 74, gap: "distress gate not met" },
  { title: "Value allocation — scenario 1", table: 82, gap: "distress gate not met" },
  { title: "Value allocation — scenario 2", table: 91, gap: "no second scenario" },
  { title: "Value allocation — scenario 3", table: 100, gap: "no third scenario" },
];

function real(): OutputEntry {
  const markdown = readFileSync(
    path.resolve(import.meta.dirname, "fixtures", "cp4c_tdg_replay.md"),
    "utf8",
  );
  return {
    output: {
      module: "CP-4C",
      id: "run/CP-4C",
      label: "CP-4C",
      sha256: "h",
      href: "CP-4C.md",
      charts: [],
      chartGaps: GAPS,
    },
    sections: sectionsOf(markdown),
    selected: true,
  };
}

it("draws no scenario switch when the handoff says no second or third scenario exists", () => {
  render(<RestructuringLead {...leadProps(real())} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  expect(within(tile).queryByRole("group", { name: "Scenario" })).toBeNull();
  for (const name of ["Scenario 1", "Scenario 2", "Scenario 3"])
    expect(within(tile).queryByRole("button", { name })).toBeNull();
});

it("keeps the module's own stated gap for the one allocation it draws", () => {
  render(<RestructuringLead {...leadProps(real())} />);
  const tile = screen.getByRole("region", { name: "Value allocation" });
  expect(within(tile).getByText("Distress gate not met")).toBeVisible();
  expect(tile.textContent).not.toMatch(/could not read the value allocation/);
});
