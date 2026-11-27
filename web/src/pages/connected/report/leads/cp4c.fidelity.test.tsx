// Synthetic CP-4C handoffs. The retained TDG fixture's placeholder gaps have separate tests.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { RestructuringLead } from "./cp4c";
import { leadProps } from "./lead.fixture";

const base = "Value allocation — base case";
const downside = "Value allocation — downside case";
const placeholder = "Value allocation — scenario 3";

function scenarios(
  publishedAsGap: boolean,
  scenarios = [
    { title: base, line: 4, gap: "base valuation was withheld pending the appraisal" },
    { title: downside, line: 12, gap: "downside class priorities remain disputed" },
    { title: placeholder, line: 20, gap: "no third scenario" },
  ],
) {
  const headers = ["Step", "Amount", "Reporting unit", "Basis and limitation"];
  const sections = scenarios.map(({ title, line, gap }) =>
    section(
      `Chart data: ${title}`,
      line - 1,
      table(line, headers, [
        ["Opening enterprise value", `Not supplied: ${gap}`, "US$m", ""],
        ["Closing undistributed value", `Not supplied: ${gap}`, "US$m", ""],
      ]),
    ),
  );
  const output = entry(
    "CP-4C",
    publishedAsGap
      ? []
      : scenarios.map(({ title, line }) => ({
          title,
          table: line,
          kind: "waterfall",
          amount: 1,
          unit: "US$m",
        })),
    sections,
  );
  if (publishedAsGap) {
    output.output.chartGaps = scenarios.map(({ title, line, gap }) => ({
      title,
      table: line,
      gap,
    }));
  }
  return output;
}

it.each([true, false])(
  "lets the reader switch distinct stated scenario gaps, with chartGaps metadata %s",
  (publishedAsGap) => {
    render(<RestructuringLead {...leadProps(scenarios(publishedAsGap))} />);
    const tile = within(screen.getByRole("region", { name: "Value allocation" }));
    expect(
      tile.getAllByText(/base valuation was withheld pending the appraisal/i).length,
    ).toBeGreaterThan(0);
    expect(tile.queryByRole("button", { name: "Scenario 3" })).toBeNull();
    const second = tile.getByRole("button", { name: "Downside case" });
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(tile.getAllByText(/downside class priorities remain disputed/i).length).toBeGreaterThan(
      0,
    );
    expect(tile.queryByText(/base valuation was withheld pending the appraisal/i)).toBeNull();
  },
);

it.each([true, false])(
  "keeps the named case when its only allocation is unpublished, with chartGaps metadata %s",
  (publishedAsGap) => {
    const output = scenarios(publishedAsGap, [
      { title: downside, line: 4, gap: "Scenario not published" },
    ]);
    render(<RestructuringLead {...leadProps(output)} />);
    const tile = within(screen.getByRole("region", { name: "Value allocation" }));
    expect(tile.getByText("Downside case")).toBeVisible();
    expect(tile.getAllByText("Scenario not published").length).toBeGreaterThan(0);
    expect(tile.queryByRole("group", { name: "Scenario" })).toBeNull();
  },
);
