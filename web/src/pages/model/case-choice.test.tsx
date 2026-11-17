import { fireEvent, render, screen } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { ForecastPage } from "./ForecastPage";
import { PortfolioFitPage } from "./PortfolioFitPage";
import { StatementsPage } from "./StatementsPage";
import { fixtureSlice, must } from "./slice/test-fixture";
import type { ModelRun } from "./slice/types";

const params = { issuer: "transdigm", run: "2025-06-30" };

it("S5-010 keeps the chosen case across Model, Forecast and intervening pages, separately per run", () => {
  const model = fixtureSlice() as { runs: ModelRun[] };
  const other = structuredClone(must(model.runs[0]));
  other.run = "other";
  model.runs.push(other);
  const data: LibraryData = { schema: "credit-os-data/1", issuers: [], model };
  const draw = (page: React.ReactNode) => (
    <SourceContext.Provider value={data}>{page}</SourceContext.Provider>
  );
  const { rerender } = render(draw(<StatementsPage params={params} />));
  fireEvent.click(screen.getByRole("radio", { name: "Downside case" }));
  rerender(draw(<ForecastPage params={params} />));
  expect(screen.getByRole("radio", { name: "Downside case" })).toBeChecked();
  rerender(draw(<PortfolioFitPage params={params} />));
  rerender(draw(<StatementsPage params={params} />));
  expect(screen.getByRole("radio", { name: "Downside case" })).toBeChecked();
  rerender(draw(<StatementsPage params={{ issuer: "transdigm", run: "other" }} />));
  expect(screen.getByRole("radio", { name: "Base case" })).toBeChecked();
});

it("S5-011 names the Model views that follow the choice", () => {
  const data: LibraryData = { schema: "credit-os-data/1", issuers: [], model: fixtureSlice() };
  render(
    <SourceContext.Provider value={data}>
      <StatementsPage params={params} />
    </SourceContext.Provider>,
  );
  expect(
    screen.getByText(
      "The forecast columns and cash flow bridges follow the chosen case. The other charts show both cases or the balance sheet date.",
    ),
  ).toBeVisible();
});

it("S5-020 takes the cash flow heading's period from the supplied walk", () => {
  const model = fixtureSlice() as { runs: ModelRun[] };
  const forecast = must(must(model.runs[0]).forecast);
  forecast.walk.subtitle = "FY29, GBP millions";
  const data: LibraryData = { schema: "credit-os-data/1", issuers: [], model };
  render(
    <SourceContext.Provider value={data}>
      <ForecastPage params={params} />
    </SourceContext.Provider>,
  );
  expect(
    screen.getByRole("heading", { level: 2, name: "Cash flow: FY29, GBP millions" }),
  ).toBeVisible();
  expect(
    screen.getByText(
      "Interest cover, the cash flow walk and the highlighted driver markers follow the chosen case. EBITDA by case shows both cases.",
    ),
  ).toBeVisible();
});
