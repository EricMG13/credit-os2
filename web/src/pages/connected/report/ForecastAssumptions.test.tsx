import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { AssumptionsByCase } from "./ForecastAssumptions";

const document = {
  currency: "USD",
  scale: 1,
  years: [{ year: 2025 }, { year: 2026 }, { year: 2027 }],
  base_drivers: {
    revenue_growth: { values: [0.05, 0.05, 0.05] },
    ebitda_margin: { values: ["0.40", "0.41", "0.42"] },
    interest_rate: { values: ["0.04125", "0.04125", "0.04125"] },
    dividends: { values: ["4348", "2038", "2038"] },
  },
  upside_drivers: {
    revenue_growth: { values: [0.08, 0.08, 0.08] },
    ebitda_margin: { values: [0.4, 0.41, 0.42] },
    interest_rate: { values: ["0.04125", "0.04125", "0.04125"] },
    debt_repayment: { values: ["10", "10", "10"] },
  },
  downside_shock: { ebitda_decline: 0.15 },
};
const names = new Map([["Downside case", "Downside (EBITDA -15%)"]]);
const note = "Downside case is the base case with an EBITDA decline applied to EBITDA and margin.";

const YEARS = "2025 · 2026 · 2027";
const region = () => screen.getByRole("region", { name: "Assumptions by case table" });
const rowOf = (name: string) =>
  within(region()).getByRole("row", { name: new RegExp(`^${name}`, "u") });
const texts = (row: HTMLElement) =>
  within(row)
    .getAllByRole("cell")
    .map((cell) => cell.textContent.replace(/\s+/gu, " ").trim());

it("shows recorded values as recorded and marks only a real difference, with words and not colour", () => {
  render(<AssumptionsByCase document={document} />);
  const growth = within(rowOf("Revenue growth")).getAllByRole("cell");
  expect(growth[0]?.textContent).toContain("0.05 each year");
  expect(growth[0]?.textContent).not.toContain("differs from base");
  expect(growth[1]?.textContent).toContain("0.08 each year");
  expect(growth[1]?.textContent).toContain("differs from base");
  expect(growth[1]).toHaveClass("bg-surface-selected");
  expect(growth[1]?.className).not.toMatch(/warning|worse-mark|better-mark/);
  expect(growth[1]?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  // 0.40 and 0.4 are the same recorded number; 0.04125 is not rounded to 4.13%.
  expect(texts(rowOf("EBITDA margin"))[1]).not.toContain("differs");
  expect(texts(rowOf("Interest rate"))[0]).toBe("0.04125 each year");
  expect(region().textContent).not.toContain("%");
});

it("says only this case states it for a driver base does not give, never differs", () => {
  render(<AssumptionsByCase document={document} />);
  const repayment = texts(rowOf("Debt repayment"));
  expect(repayment[0]).toBe("Not stated");
  expect(repayment[1]).toContain("only this case states it");
  expect(repayment[1]).not.toContain("differs");
});

it("gives the shock its own column named by the model's case name, with the downside note", () => {
  render(<AssumptionsByCase document={document} caseNames={names} downsideNote={note} />);
  expect(
    within(region())
      .getAllByRole("columnheader")
      .map((head) => head.textContent),
  ).toEqual([
    "Driver",
    // The planning years head each case's per-year values; the shock is one value, not a run.
    "Base case2025 · 2026 · 2027",
    "Upside case2025 · 2026 · 2027",
    "Downside (EBITDA -15%)",
    "Trace",
  ]);
  expect(texts(rowOf("Downside EBITDA decline"))).toEqual(["Not stated", "Not stated", "0.15", ""]);
  expect(texts(rowOf("Revenue growth"))[2]).toBe("Not stated");
  expect(screen.getByText(note)).toBeInTheDocument();
  for (const years of region().querySelectorAll('[data-part="years"]'))
    expect(years).toHaveClass("whitespace-nowrap");
});

it("falls back to the raw case name and adds a downside drivers column only when it states something", () => {
  render(
    <AssumptionsByCase
      document={{ ...document, downside_drivers: { revenue_growth: { values: ["0", "0", "0"] } } }}
    />,
  );
  expect(
    within(region())
      .getAllByRole("columnheader")
      .map((head) => head.textContent),
  ).toEqual([
    "Driver",
    `Base case${YEARS}`,
    `Upside case${YEARS}`,
    `Downside drivers${YEARS}`,
    "Downside case",
    "Trace",
  ]);
  expect(screen.queryByText(note)).toBeNull();
});

it("states the unit of monetary drivers and draws Not stated as a gap chip in the legend and table", () => {
  render(<AssumptionsByCase document={document} />);
  expect(rowOf("Dividends").textContent).toContain("$m");
  expect(rowOf("Dividends").textContent).not.toContain("USD millions");
  expect(rowOf("Revenue growth").textContent).toContain("Fraction");
  const chips = screen.getAllByText("Not stated");
  expect(chips.length).toBeGreaterThan(1);
  for (const chip of chips) expect(chip.closest(".gap-hatch")).toHaveClass("border-border-gap");
});

it("renders the trace control once per row", () => {
  const seen: string[] = [];
  render(
    <AssumptionsByCase
      document={document}
      source={(name, selection) => {
        seen.push(`${name}|${selection?.inputPath?.join(".") ?? ""}`);
        return <button type="button">trace</button>;
      }}
    />,
  );
  expect(seen).toContain("Revenue growth assumptions|base_drivers.revenue_growth");
  expect(seen).toContain("Downside EBITDA decline assumptions|downside_shock.ebitda_decline");
});

it("closes the recorded drivers disclosure by default, with a chevron and a focus-ringed 32px summary", () => {
  render(<AssumptionsByCase document={document} />);
  const summary = screen
    .getByText("Recorded drivers, rationale and limitations")
    .closest("summary");
  expect(summary?.closest("details")).not.toHaveAttribute("open");
  expect(summary).toHaveClass("min-h-8", "max-[480px]:min-h-11", "focus-visible:outline-2");
  const chevron = summary?.querySelector("svg");
  expect(chevron).toHaveAttribute("aria-hidden", "true");
  expect(chevron).toHaveClass("group-open:rotate-90");
  expect(summary?.closest("details")).toHaveClass("group");
});

it("draws the recorded block in the table look, with h4 headings and a named scrollable region", () => {
  render(<AssumptionsByCase document={document} />);
  const details = screen
    .getByText("Recorded drivers, rationale and limitations")
    .closest("details");
  details?.setAttribute("open", "");
  const inner = within(details as HTMLElement);
  for (const name of [
    "Recorded forecast drivers",
    "Recorded downside shock",
    "Recorded facilities",
  ])
    expect(inner.getByRole("heading", { level: 4, name })).toHaveClass("text-small", "font-medium");
  const scroller = inner.getByRole("region", { name: "Forecast driver values by planning year" });
  expect(scroller).toHaveAttribute("tabindex", "0");
  const heads = within(scroller).getAllByRole("columnheader");
  expect(heads.at(-2)).toHaveTextContent("Limitation");
  for (const head of heads) {
    expect(head).toHaveClass("text-caption", "font-medium", "text-text-secondary");
    expect(head.className).not.toContain("font-bold");
  }
  const limitation = heads.at(-2);
  expect(limitation?.className).toMatch(/min-w-/u);
});

it("keeps chips and values on one line in the driver table", () => {
  render(<AssumptionsByCase document={document} />);
  for (const cell of within(rowOf("Debt repayment")).getAllByRole("cell").slice(0, 3))
    expect(cell).toHaveClass("whitespace-nowrap");
});

it("marks a value only one case states with the same icon in the legend and the table", () => {
  render(<AssumptionsByCase document={document} />);
  const legend = screen.getByText(/Only this case states it:/u);
  expect(legend.parentElement?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  const cell = within(rowOf("Debt repayment")).getAllByRole("cell")[1] as HTMLElement;
  expect(cell.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  expect(cell.textContent).toContain("only this case states it");
});

it("draws a gap when the inputs are unreadable", () => {
  render(<AssumptionsByCase document={null} />);
  expect(
    screen.getByText("No recorded inputs to tabulate: the inputs record is not matched."),
  ).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
});

it("draws a gap, not an empty table, when the inputs state no driver", () => {
  render(<AssumptionsByCase document={{}} />);
  expect(screen.getByText("The forecast inputs state no driver for any case.")).toBeInTheDocument();
  expect(screen.queryByRole("table")).toBeNull();
});

it("draws the downside note with module names, never codes or register ids", () => {
  const real = "Downside case is CP-2G's own downside drivers; no CP-2A shock was supplied.";
  const { unmount } = render(<AssumptionsByCase document={document} downsideNote={real} />);
  expect(screen.queryByText(/CP-2/u)).toBeNull();
  expect(
    screen.getByText(/^Downside case is .+'s own downside drivers; no .+ shock was supplied\.$/u),
  ).toBeInTheDocument();
  unmount();
  render(<AssumptionsByCase document={document} downsideNote="(CP-2A s01, see T2B.1)" />);
  expect(
    screen.getByText("The model's note on the downside case is in Evidence."),
  ).toBeInTheDocument();
  expect(screen.queryByText(/T2B\.1/u)).toBeNull();
});

it("draws a null year as the gap chip, an unknown key with no unit, and unlike forms as stated differently", () => {
  render(
    <AssumptionsByCase
      document={{
        base_drivers: {
          revenue_growth: { values: ["0.1", null] },
          ebitda_margin: "0.1",
          mystery: { values: ["1e-7"] },
        },
        upside_drivers: { ebitda_margin: "10%" },
      }}
    />,
  );
  expect(texts(rowOf("Revenue growth"))[0]).toBe("0.1 · Not stated");
  const margin = texts(rowOf("EBITDA margin"));
  expect(margin[1]).toContain("stated differently from base");
  expect(margin[1]).not.toContain("differs");
  expect(rowOf("mystery").textContent).not.toContain("USD");
  expect(texts(rowOf("mystery"))[0]).toBe("0.0000001");
  expect(within(rowOf("mystery")).getByTitle("1e-7")).toBeInTheDocument();
});

it("draws only the key entries the table uses", () => {
  render(
    <AssumptionsByCase
      document={{
        years: document.years,
        base_drivers: { revenue_growth: { values: [0.05, 0.05, 0.05] } },
        upside_drivers: { revenue_growth: { values: [0.05, 0.05, 0.05] } },
      }}
    />,
  );
  expect(screen.queryByText("Differs from base")).toBeNull();
  expect(screen.queryByText(/Only this case states it:/u)).toBeNull();
  expect(screen.queryByText(/nothing is assumed/u)).toBeNull();
  // The note on how values are recorded stays, under the table.
  const note = screen.getByText(/Values are the module's recorded fractions/u);
  expect(region().compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("makes the table's scroll box a tab stop only while it overflows, with the token ring", () => {
  render(<AssumptionsByCase document={document} />);
  // Nothing overflows where nothing is measured (jsdom): no inert stop.
  expect(region()).not.toHaveAttribute("tabindex");
  expect(region()).toHaveClass("outline-focus-ring", "focus-visible:outline-2");
});

// The replayed TDG forecast inputs (forecast_exact.json): the upside states two drivers and the
// forward model inherits every other driver from base (cpos_launch_prompts.py).
const replayed = {
  currency: "USD",
  scale: 1,
  years: [{ year: 2025 }, { year: 2026 }, { year: 2027 }],
  base_drivers: {
    revenue_growth: { values: ["0.10", "0.07", "0.06"] },
    ebitda_margin: { values: ["0.4802", "0.4802", "0.4802"] },
    capex_pct_revenue: { values: ["0.03", "0.03", "0.03"] },
    dividends: { values: ["4348", "0", "0"] },
  },
  upside_drivers: {
    revenue_growth: { values: ["0.14", "0.10", "0.08"] },
    ebitda_margin: { values: ["0.4850", "0.4900", "0.4950"] },
  },
  downside_shock: { ebitda_decline: "0.2000", rate_increase: "0.3420" },
};

it("says an upside driver the model does not restate is as base, not that nothing is assumed", () => {
  render(<AssumptionsByCase document={replayed} />);
  const capex = texts(rowOf("Capital expenditure"));
  expect(capex[0]).toBe("0.03 each year");
  expect(capex[1]).toBe("As base");
  const dividends = texts(rowOf("Dividends"));
  expect(dividends[1]).toBe("As base");
  expect(texts(rowOf("Revenue growth"))[1]).toContain("0.14 · 0.10 · 0.08");
  expect(region().textContent).not.toContain("nothing is assumed");
  // The shock column still states nothing for a base driver.
  expect(texts(rowOf("Dividends"))[2]).toBe("Not stated");
});
