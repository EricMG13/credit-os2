import { fireEvent, render, screen, within } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { AnalysisPage } from "./AnalysisPage";
import { ForecastPage } from "./ForecastPage";
import { PortfolioFitPage } from "./PortfolioFitPage";
import { readRuns, fixtureSlice, must } from "./slice/test-fixture";
import type { ModelRun } from "./slice/types";

const params = { issuer: "transdigm", run: "2025-06-30" };
const trace = "#/library/transdigm/2025-06-30/evidence/trace/row-source";

function renderPage(page: "analysis" | "portfolio" | "forecast", traced = true) {
  const model = fixtureSlice() as { runs: ModelRun[] };
  const run = must(model.runs[0]);
  const limits = run.portfolioFit.limits;
  const scatter = run.portfolioFit.scatter;
  const forecast = must(run.forecast);
  const groups = [
    run.analysis.headroom.rows,
    run.analysis.segments.rows,
    ...("gap" in limits ? [] : [limits.columns]),
    ...("gap" in scatter ? [] : [scatter.points]),
    run.portfolioFit.strips.rows,
    forecast.drivers.rows,
    forecast.interestCover.rows,
    forecast.ebitda.rows,
    forecast.walk.rows,
  ];
  if (traced) for (const rows of groups) for (const row of rows) Object.assign(row, { trace });
  const data: LibraryData = { schema: "credit-os-data/1", issuers: [], model };
  render(
    <SourceContext.Provider value={data}>
      {page === "analysis" ? (
        <AnalysisPage params={params} />
      ) : page === "portfolio" ? (
        <PortfolioFitPage params={params} />
      ) : (
        <ForecastPage params={params} />
      )}
    </SourceContext.Provider>,
  );
}

it.each([
  ["analysis", ["Headroom to covenants and rating triggers", "EBITDA margin by segment"]],
  [
    "portfolio",
    [
      "Exposure against limits",
      "Leverage and margin against holdings",
      "Where the issuer sits in the portfolio",
    ],
  ],
  [
    "forecast",
    ["What drives each case", "Interest cover", "EBITDA by case", "From EBITDA to free cash flow"],
  ],
] as const)("S5-012 uses each supplied row source on %s tables", (page, titles) => {
  renderPage(page);
  for (const title of titles) {
    const figure = screen.getByRole("figure", { name: title });
    fireEvent.click(within(figure).getByRole("button", { name: "Table" }));
    const rows = within(figure).getAllByRole("row").slice(1);
    for (const row of rows)
      expect(within(row).getByRole("link", { name: /^Show the sources for/ })).toHaveAttribute(
        "href",
        trace,
      );
  }
});

it("S5-012 states when a table row's source was not supplied", () => {
  renderPage("forecast", false);
  const figure = screen.getByRole("figure", { name: "Interest cover" });
  fireEvent.click(within(figure).getByRole("button", { name: "Table" }));
  for (const row of within(figure).getAllByRole("row").slice(1)) {
    expect(within(row).getByText("Source not recorded")).toBeVisible();
    expect(within(row).queryByRole("link", { name: /^Show the sources for/ })).toBeNull();
  }
});

it("S5-012 rejects a supplied row source outside the library", () => {
  const model = fixtureSlice() as { runs: ModelRun[] };
  Object.assign(must(must(model.runs[0]).analysis.headroom.rows[0]), {
    trace: "https://example.com",
  });
  expect(readRuns(model)).toEqual({
    kind: "invalid",
    reason: 'runs[0].analysis.headroom.rows[0].trace: expected an address starting with "#/"',
  });
});
