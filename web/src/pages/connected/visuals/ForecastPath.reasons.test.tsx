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
  expect(screen.getByText(`Debt maturing, FY2026: Not supplied: ${EVIDENCE}`)).toBeInTheDocument();
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

const scheduleOf = (...cells: { text: string; value: number | null; reason: string | null }[]) =>
  ({
    years: cells.map((cell, at) => ({
      year: 2026 + at,
      label: `FY${String(2026 + at)}`,
      key: `FY${String(2026 + at)}`,
      cell,
    })),
    offAxis: [],
  }) satisfies PathSchedule;

it.each([
  ["250 (T2E.3.r03)", "250", "T2E.3.r03"],
  ["250 [E3]", "250", "[E3]"],
  ["250 (see p. 45)", "250", "p. 45"],
])("draws %j as its amount, its citation left to the trace", (text, amount, citation) => {
  const { container } = drawn(scheduleOf({ text, value: null, reason: null }), [ok, ok]);
  const label = container.querySelector("figure svg text title")?.parentElement;
  expect(label?.querySelector("title")?.textContent).toBe(amount);
  expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
    `Debt maturing: FY2026 ${amount}.`,
  );
  expect(container.querySelector('[data-lane-gap="FY2026"]')).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(screen.getByText(amount)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain(citation);
  expect(document.body.textContent).not.toContain(EVIDENCE);
});

it.each([
  ["250 per Annual Report FY25.pdf", "FY25.pdf"],
  ["1,250 (of which RCF 200; see p. 45)", "p. 45"],
])("draws the evidence sentence for %j, its citation left to the trace", (text, citation) => {
  drawn(scheduleOf({ text, value: null, reason: null }), [ok, ok]);
  expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
    "Debt maturing: FY2026 Amount recorded in model evidence.",
  );
  expect(document.body.textContent).not.toContain(citation);
});

it("draws an off-axis and a beyond-axis amount without its citation in the notes", () => {
  render(
    <LeveragePath
      measure={measureOf([ok, ok])}
      group="Base case"
      caseName="Base case"
      schedule={{
        years: [
          {
            year: 2034,
            label: "FY2034",
            key: "FY2034",
            cell: { text: "900 [E3]", value: null, reason: null },
          },
        ],
        offAxis: [
          {
            year: 0,
            label: "Thereafter",
            key: "Thereafter",
            cell: { text: "4,768 (see p. 45)", value: null, reason: null },
          },
        ],
      }}
    />,
  );
  expect(
    screen.getByText("Debt maturing in years not on this axis: FY2034 900."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Debt maturing, not by fiscal year: Thereafter 4,768."),
  ).toBeInTheDocument();
});

it.each([["approx. 500"], ["- 250 (approx.)"], ["1,250 (of which RCF 200)"]])(
  "keeps a qualified amount %j whole",
  (text) => {
    drawn(scheduleOf({ text, value: null, reason: null }), [ok, ok]);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
      `Debt maturing: FY2026 ${text}.`,
    );
  },
);

it("draws the evidence sentence for an amount whose citation cannot be set aside", () => {
  drawn(scheduleOf({ text: "250 FY25.pdf", value: null, reason: null }), [ok, ok]);
  expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
    "Debt maturing: FY2026 Amount recorded in model evidence.",
  );
});

it("draws three unparsed rows of one year whole, each with its title", () => {
  const schedule: PathSchedule = {
    years: ["approx. 500", "- 250 (approx.)", "1,250 (of which RCF 200)"].map((text, at) => ({
      year: 2026,
      label: "FY2026",
      key: `FY2026-${String(at)}`,
      cell: { text, value: null, reason: null },
    })),
    offAxis: [],
  };
  const { container } = drawn(schedule, [ok, ok]);
  const labels = [...container.querySelectorAll("figure svg text")].filter((node) =>
    node.querySelector("title"),
  );
  const whole = ["approx. 500", "- 250 (approx.)", "1,250 (of which RCF 200)"];
  expect(labels.map((node) => node.lastChild?.textContent)).toEqual(whole);
  expect(labels.map((node) => node.querySelector("title")?.textContent)).toEqual(whole);
});

it("draws a lone unparsed row whole", () => {
  const { container } = drawn(
    scheduleOf({ text: "1,250 (of which RCF 200)", value: null, reason: null }),
    [ok, ok],
  );
  const label = container.querySelector("figure svg text title")?.parentElement;
  expect(label?.lastChild?.textContent).toBe("1,250 (of which RCF 200)");
});

it("keeps the sign of an unparsed negative amount", () => {
  drawn(scheduleOf({ text: "- 250 (approx.)", value: null, reason: null }), [ok, ok]);
  expect(screen.getByRole("img").getAttribute("aria-label")).toContain("FY2026 - 250 (approx.)");
});

it("hatches a bare gap marker with its own words and notes it", () => {
  const { container } = drawn(
    scheduleOf(
      { text: "Not supplied", value: null, reason: null },
      { text: "n.a.", value: null, reason: null },
    ),
    [ok, ok],
  );
  expect(container.querySelector('[data-lane-gap="FY2026"]')).not.toBeNull();
  expect(container.querySelector('[data-lane-gap="FY2027"]')).not.toBeNull();
  expect(screen.getByText("Debt maturing, FY2026: Not supplied.")).toBeInTheDocument();
  expect(screen.getByText("Debt maturing, FY2027: n.a.")).toBeInTheDocument();
});

it("draws a long unparsed label whole in the lane, the reading and the table", () => {
  const long = "approx. 500 of which revolving facility 200";
  const { container } = drawn(scheduleOf({ text: long, value: null, reason: null }), [ok, ok]);
  const label = [...container.querySelectorAll("figure svg text")].find((node) =>
    node.textContent.startsWith("approx"),
  );
  const drawnLabel = label?.lastChild?.textContent ?? "";
  expect(drawnLabel).toBe(long);
  expect(screen.getByRole("img").getAttribute("aria-label")).toContain(long);
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(screen.getByText(long)).toBeInTheDocument();
});
