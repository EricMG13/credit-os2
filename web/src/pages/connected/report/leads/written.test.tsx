import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, table } from "../overview/rows.fixture";
import { DownsideLead } from "./cp2a";
import { LiquidityLead } from "./cp2d";
import { MacroLead } from "./cp2e";
import { RatingsLead } from "./cp2h";
import { leadProps, tableSection } from "./lead.fixture";

afterEach(cleanup);

/** A covenants handoff with its published headroom chart. */
const covenants = () =>
  entry(
    "CP-4",
    [{ title: "Covenant headroom", table: 5, label: 0, threshold: 1, current: 2 }],
    [
      tableSection(
        "Chart data: covenant headroom",
        table(
          5,
          ["Test", "Threshold", "Current", "Reporting unit", "Basis and limitation"],
          [["Net leverage", "5.0", "4.2", "x", "Synthetic."]],
        ),
      ),
    ],
  );

// Review 3, P7: a lead draws only its own module's other charts.
it.each([
  ["CP-2A", DownsideLead],
  ["CP-2D", LiquidityLead],
  ["CP-2E", MacroLead],
  ["CP-2H", RatingsLead],
])("%s draws no chart of another module's handoff", (_, Lead) => {
  render(<Lead {...leadProps(covenants())} />);
  expect(screen.queryByRole("region", { name: "Covenant headroom" })).toBeNull();
  expect(document.body.textContent).not.toMatch(/Net leverage/);
});

it("draws its own module's other charts", () => {
  const own = covenants();
  own.output.module = "CP-2D";
  render(<LiquidityLead {...leadProps(own)} />);
  expect(screen.getByRole("region", { name: "Covenant headroom" })).toBeVisible();
});
