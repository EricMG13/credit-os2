import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { entry, section, table } from "../../overview/rows.fixture";
import { leadProps } from "../fixtures/load";
import { CashLadderTile } from "./CashLadder";

afterEach(cleanup);

const EBITDA_GAP = "Not supplied: latest EBITDA unavailable";
const INTEREST_GAP = "Not supplied: latest interest unavailable";
const CFO_GAP = "Not supplied: latest operating cash unavailable";
const HEADERS = ["Line item", "FY2024", "FY2023", "Unit", "Basis", "Source"];

function draw(cfo: string) {
  const handoff = entry(
    "CP-1",
    [],
    [
      section(
        "T4.4 Income statement",
        1,
        table(2, HEADERS, [["EBITDA (Adjusted)", EBITDA_GAP, "200", "USD millions", "", ""]]),
      ),
      section(
        "T4.5 Cash flow statement",
        6,
        table(7, HEADERS, [
          ["Cash Interest Paid", INTEREST_GAP, "100", "USD millions", "", ""],
          ["Net Cash from Operating Activities", cfo, "75", "USD millions", "", ""],
        ]),
      ),
    ],
  );
  render(<CashLadderTile lead={leadProps(handoff)} />);
  return screen.getByRole("region", { name: "Cash conversion" });
}

it("draws the stated FY2023 amounts with their unit and the distinct FY2024 gap reasons", () => {
  const tile = draw(CFO_GAP);
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(/Cash conversion, \$m, FY2024, FY2023 in brackets/);
  expect(figure).toHaveAccessibleName(/latest EBITDA unavailable \(FY2023 200\)/);
  expect(figure).toHaveAccessibleName(/latest interest unavailable \(FY2023 100\)/);
  expect(figure).toHaveAccessibleName(/latest operating cash unavailable \(FY2023 75\)/);
  const bars = [...figure.querySelectorAll("rect[data-prior]")];
  expect(bars.map((bar) => [bar.getAttribute("data-prior"), bar.getAttribute("data-to")])).toEqual([
    ["EBITDA (Adjusted)", "200"],
    ["Cash Interest Paid", "100"],
    ["Net Cash from Operating Activities", "75"],
  ]);
  expect(
    [...figure.querySelectorAll('[data-part="prior-value"]')].map((value) => value.textContent),
  ).toEqual(["200", "100", "75"]);
  expect(
    [...figure.querySelectorAll("[data-gap]")].map((gap) => gap.getAttribute("data-gap")),
  ).toEqual(expect.arrayContaining([EBITDA_GAP, INTEREST_GAP, CFO_GAP]));
  expect(figure.querySelectorAll("rect[data-bar]")).toHaveLength(0);
});

it("prints the stated FY2023 cash interest of 100 when FY2024 interest is a gap", () => {
  const tile = draw("50");
  const figure = within(tile).getByRole("img");
  const priorBar = figure.querySelector('rect[data-prior="Cash Interest Paid"]');
  expect(priorBar).toHaveAttribute("data-from", "200");
  expect(priorBar).toHaveAttribute("data-to", "100");
  expect(priorBar?.parentElement?.querySelector('[data-part="prior-value"]')).toHaveTextContent(
    /^100$/,
  );
  expect(
    figure.querySelector('[data-gap="Not supplied: latest interest unavailable"]'),
  ).toBeVisible();
});
