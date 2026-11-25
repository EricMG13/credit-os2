import { fireEvent, render, screen, within } from "@testing-library/react";
import type { PortfolioBasis } from "../report/PortfolioBasis";
import type { Frame } from "./charts";
import type { SourceTable } from "./visualData";
import { portfolioLimits } from "./PortfolioLimits";

const HEADERS = [
  "Limit",
  "Current exposure",
  "Proposed exposure",
  "Limit value",
  "Reporting unit",
  "Basis and limitation",
];

const basis: PortfolioBasis = {
  folder: "run-2026-01",
  output: "CP-6",
  sha256: "a".repeat(64),
  asOf: "2026-01-31",
  tableLines: [14],
};

const frame: Frame = { title: "Portfolio limits" };

function table(rows: string[][], headers = HEADERS): SourceTable {
  return { line: 14, headers: [...headers], rows: rows.map((row) => [...row]) };
}

it("plots distinct nonnegative percent-of-NAV exposure and limit pairs and preserves their table values", () => {
  const result = portfolioLimits(
    table([
      ["Single issuer", "2.5", "3.0", "5.0", "% NAV", "Recorded limit"],
      ["Sector", "0", "1.5", "4.0", "% NAV", "Recorded sector cap"],
    ]),
    basis,
    frame,
  );
  if (!result) throw new Error("valid portfolio limits were rejected");
  const { container } = render(result);
  const figure = screen.getByRole("figure", { name: "Portfolio limits" });
  expect(
    within(figure).getByText("Current exposure and limits in % NAV · 2026-01-31"),
  ).toBeInTheDocument();
  expect(within(figure).getByText("Single issuer")).toBeInTheDocument();
  expect(within(figure).getByText("Sector")).toBeInTheDocument();
  // Screen review F7: value against a limit is a bullet, as on the covenant tests: the exposure a
  // bar from zero and the limit a tick, every row on the one scale (here 0 to 5.0% NAV).
  expect(
    within(figure).getByRole("img", {
      name: "Single issuer: current exposure 2.5% against a limit of 5.0%.",
    }),
  ).toBeInTheDocument();
  expect(container.querySelector('[data-exposure="2.5%"]')).toHaveStyle({ width: "50%" });
  expect(container.querySelector('[data-limit="5.0%"]')).toHaveStyle({ left: "100%" });
  expect(container.querySelector('[data-limit="4.0%"]')).toHaveStyle({ left: "80%" });

  fireEvent.click(within(figure).getByRole("button", { name: "Table" }));
  expect(within(figure).getByRole("table", { name: "Portfolio limits" })).toBeInTheDocument();
  expect(within(figure).getByRole("cell", { name: "2.5%" })).toBeInTheDocument();
  expect(within(figure).getByRole("cell", { name: "5.0%" })).toBeInTheDocument();
  expect(container.querySelectorAll("[data-plot]")).toHaveLength(0);
});

it.each([
  [
    "wrong headings",
    table(
      [["Single issuer", "2.5", "3.0", "5.0", "% NAV", "Basis"]],
      ["Limit", "Current", "Proposal", "Limit value", "Reporting unit", "Basis and limitation"],
    ),
  ],
  ["unsupported unit", table([["Single issuer", "2.5", "3.0", "5.0", "USD millions", "Basis"]])],
  ["missing exposure", table([["Single issuer", "n.a.", "3.0", "5.0", "% NAV", "Basis"]])],
  ["negative exposure", table([["Single issuer", "-0.5", "3.0", "5.0", "% NAV", "Basis"]])],
  ["negative limit", table([["Single issuer", "2.5", "3.0", "-5.0", "% NAV", "Basis"]])],
  ["empty rows", table([])],
  [
    "duplicate labels",
    table([
      ["Sector", "2.5", "3.0", "5.0", "% NAV", "Basis"],
      ["Sector", "1.5", "2.0", "4.0", "% NAV", "Basis"],
    ]),
  ],
])("withholds portfolio limits for %s", (_reason, source) => {
  expect(portfolioLimits(source, basis, frame)).toBeNull();
});
