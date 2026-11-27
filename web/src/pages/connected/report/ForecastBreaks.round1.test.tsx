import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { covenant, renderBreaks, standardDownside } from "./ForecastBreaks.fixture";

const RAW = /credit_agreement|annual_report|\.pdf|\bpages?\s+\d|\[E\d+\]|T2E\.\d/u;
const REASON = "Liquidity not modelled (T2E.3.r03) see credit_agreement.pdf page 4";
const schedule = {
  years: [
    {
      year: 2026,
      label: "FY2026",
      key: "FY2026",
      cell: { text: "6637 (annual_report.pdf pages 59, 153)", value: null, reason: null },
    },
  ],
  offAxis: [],
  unit: "US$m",
  reason: null,
};
const legal = covenant(
  "5.0 per credit_agreement.pdf page 4",
  "Not supplied: net debt missing [E14]",
);
const downside = standardDownside(
  "Not calculated: net debt missing [E14]",
  "3.10 per annual_report.pdf page 9",
  "2.00 (annual_report.pdf page 9)",
);

it("draws no file name, page, marker or register id in the liquidity gap, schedule, covenant or stress parts", () => {
  const { container } = renderBreaks([legal, downside], REASON, schedule);
  const drawn = [
    container.textContent,
    ...[...container.querySelectorAll("[aria-label]")].map((node) =>
      node.getAttribute("aria-label"),
    ),
  ].join("\n");
  expect(drawn).not.toMatch(RAW);
  const liquidity = within(screen.getByRole("region", { name: "Accessible liquidity, Base case" }));
  expect(liquidity.getByText("n.a.: Reason recorded in model evidence.")).toBeInTheDocument();
  const debt = within(screen.getByRole("region", { name: "Debt maturing" }));
  expect(debt.getByText("6637")).toBeInTheDocument();
  const drawing = within(screen.getByRole("group", { name: "Point-in-time stress" })).getByRole(
    "img",
  );
  expect(within(drawing).getByText("2.00")).toBeInTheDocument();
});
