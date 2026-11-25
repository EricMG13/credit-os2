import { expect, it } from "vitest";
import { forecastCaseOptions } from "../visuals/LegacyForecast";
import { forecastTraceContext, type ForecastModel } from "./ForecastRecord";

const CASH_PROXY = "Cash proxy (not issuer free cash flow)";
const value = (exact: string) => ({ status: "value", exact, display: exact });

function modelOf(columns: { label: string; group: string }[], cells: unknown[]) {
  return {
    cashflow: {
      units: "USD millions",
      columns,
      rows: [{ label: CASH_PROXY, band: "Cash", total: true, cells }],
    },
  } as unknown as ForecastModel;
}

it("lists as forecast cases only the groups whose columns the trend charts read", () => {
  const model = modelOf(
    [
      { label: "FY2027E", group: "Base case" },
      // Not a dated forecast period: the trend charts ignore this column.
      { label: "FY27E", group: "Upside" },
    ],
    [value("10"), value("14")],
  );
  const { details, qualification } = forecastTraceContext(
    model,
    { base: {}, base_drivers: {}, years: [] },
    "Cash proxy by scenario",
    { row: CASH_PROXY, case: "" },
  );
  expect(details.map(({ label }) => label).filter((label) => /upside/i.test(label))).toEqual([]);
  expect(qualification).not.toContain("driver basis was not recorded");
});

it("finds a placeholder-only case's column from the card's selection, which names no period", () => {
  const model = modelOf(
    [
      { label: "FY2027E", group: "Base case" },
      { label: "FY2028E", group: "Base case" },
      { label: "Downside", group: "Downside case" },
    ],
    [
      value("10"),
      value("12"),
      {
        status: "na",
        exact: null,
        display: "n.a.",
        reason: "no downside case was computed in this run",
      },
    ],
  );
  const card = forecastCaseOptions(model).find(({ rawGroup }) => rawGroup === "Downside case");
  if (!card) throw new Error("The Downside case card is missing");
  expect(card.period).toBeUndefined();
  // The selection report/Forecast.tsx sends for a case card.
  const trace = forecastTraceContext(model, { years: [] }, card.name, {
    case: card.name,
    rawGroup: card.rawGroup,
    rawGroups: [card.rawGroup],
    period: card.period,
    row: CASH_PROXY,
    periodStart: card.periodStart,
    periodEnd: card.periodEnd,
  });
  expect(trace.heading).toBe("Downside case · Downside case");
  expect(trace.statement).toContain(
    "Downside case · Downside: n.a. (no downside case was computed in this run)",
  );
  expect(trace.statement).not.toContain("FY2027E");
});

it("identifies a same-label column by its recorded raw group in the trace, not its page name", () => {
  const coded = "Downside (CP-2G drivers)";
  const model = modelOf(
    ["Base case", coded, "Downside drivers"].map((group) => ({ label: "FY2027E", group })),
    [value("10"), value("7"), value("8")],
  );
  const trace = forecastTraceContext(model, { years: [] }, "Cash proxy by scenario", {
    row: CASH_PROXY,
    case: "",
  });
  expect(trace.statement).toContain("Base case · FY2027E: 10");
  expect(trace.statement).toContain(`Downside drivers · ${coded} · FY2027E: 7`);
  expect(trace.statement).toContain("Downside drivers · Downside drivers · FY2027E: 8");
  // The page names the two apart in reader text, with no module code.
  const names = Object.fromEntries(
    forecastCaseOptions(model).map(({ rawGroup, name }) => [rawGroup, name]),
  );
  expect(names[coded]).toBe("Downside drivers · Downside (Forward credit model drivers)");
  expect(names["Downside drivers"]).toBe("Downside drivers · second case");
  // A selection by page name still finds its own column.
  const one = forecastTraceContext(model, { years: [] }, "Cash proxy", {
    row: CASH_PROXY,
    case: names["Downside drivers"],
  });
  expect(one.statement).toContain("Downside drivers · Downside drivers · FY2027E: 8");
  expect(one.statement).not.toContain("FY2027E: 7");
});
