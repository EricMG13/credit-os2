import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { forecastMeasure } from "../report/forecastData";
import { LeveragePath, type PathSchedule } from "./ForecastPath";

const NET = "Net leverage (net debt / Adj EBITDA)";
const EVIDENCE = "Reason recorded in model evidence.";
const noSchedule: PathSchedule = { years: [], offAxis: [] };

function measureOf(cells: unknown[]) {
  return forecastMeasure(
    {
      cashflow: {
        columns: ["FY2025E", "FY2026E"].map((label) => ({ label, group: "Base case" })),
        rows: [{ label: NET, band: "Leverage", kind: "multiple", total: false, cells }],
      },
    },
    /^Net leverage\b/,
    /net debt \/ Adj EBITDA/,
  );
}
const drawn = (schedule: PathSchedule, cells: unknown[]) =>
  render(
    <LeveragePath
      measure={measureOf(cells)}
      group="Base case"
      caseName="Base case"
      schedule={schedule}
    />,
  );
const ok = { status: "value", exact: "2", display: "2x" };

it("draws the evidence sentence, not a register id, for a gap reason in the note and the table", () => {
  const { container } = drawn(noSchedule, [
    ok,
    { status: "na", display: "n.a.", reason: "CP-2A has no EBITDA (T2E.3.r03)." },
  ]);
  expect(container.textContent).not.toContain("T2E.3.r03");
  expect(screen.getByText(`Base case, FY2026E: ${EVIDENCE}`)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(document.body.textContent).not.toContain("T2E.3.r03");
  expect(screen.getAllByText(EVIDENCE).length).toBeGreaterThan(0);
});

it("does not double the full stop of a reason that already ends in one", () => {
  const { container } = drawn(noSchedule, [
    ok,
    { status: "na", display: "n.a.", reason: "EBITDA is not positive." },
  ]);
  expect(container.textContent).toContain("Base case, FY2026E: EBITDA is not positive.");
  expect(container.textContent).not.toContain("..");
});

it("draws a schedule gap that cites a register id as the evidence sentence", () => {
  const schedule: PathSchedule = {
    years: [
      {
        year: 2026,
        label: "FY2026",
        key: "FY2026",
        cell: {
          text: "Not supplied: the schedule is silent (T2E.3.r03)",
          value: null,
          reason: "the schedule is silent (T2E.3.r03)",
        },
      },
    ],
    offAxis: [],
  };
  const { container } = drawn(schedule, [ok, ok]);
  expect(container.textContent).not.toContain("T2E.3.r03");
  expect(screen.getByText(`Debt maturing, FY2026: ${EVIDENCE}`)).toBeInTheDocument();
});

it("draws unparsed schedule text as written, not as a gap", () => {
  const schedule: PathSchedule = {
    years: [
      {
        year: 2026,
        label: "FY2026",
        key: "FY2026",
        cell: { text: "approx. 500", value: null, reason: null },
      },
    ],
    offAxis: [],
  };
  const { container } = drawn(schedule, [ok, ok]);
  expect(container.querySelector('[data-lane-gap="FY2026"]')).toBeNull();
  expect(screen.queryByText("No amount")).toBeNull();
  expect(screen.getByRole("figure").querySelector("svg")?.textContent).toContain("approx. 500");
});
