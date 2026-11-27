import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import type { ReportView } from "../reportView";
import { readMeasure } from "./forecastData";
import { ForecastHeader, ForecastStats } from "./ForecastHeader";

const run = { folder: "current", issuer: "Northbridge" } as PublishedRun;
const entryOf = (id: string, text: string): OutputEntry =>
  ({
    selected: id === "selected",
    output: {
      id,
      sha256: "b".repeat(64),
      module: "CP-2G",
      label: "",
      href: "",
      state: { established: true, declared: null },
    },
    sections: [
      { heading: "Findings", level: 2, line: 17, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 19,
        blocks: [{ type: "text", line: 21, end: 21, text }],
      },
    ],
  }) as unknown as OutputEntry;
const view = (entries: OutputEntry[]) =>
  ({
    catalogue: undefined,
    lead: undefined,
    entries,
    modules: [],
    models: [],
  }) as unknown as ReportView;

function header(entries: OutputEntry[], handoff: OutputEntry) {
  return render(
    <ForecastHeader
      run={run}
      view={view(entries)}
      preview={false}
      handoff={handoff}
      cases={[]}
      current={undefined}
      onSelect={vi.fn()}
      basis={[]}
      hasModel={false}
    />,
  );
}

it("draws the matched handoff's own blocked state when no CP-2G entry is selected", () => {
  const blockedHandoff = entryOf(
    "other",
    "Not assessable: the forward model inputs did not validate.",
  );
  header([blockedHandoff], blockedHandoff);
  expect(screen.getByText(/forward model inputs did not validate/u)).toBeInTheDocument();
  expect(screen.queryByText(/did not run in this run/u)).toBeNull();
});

it("draws the matched handoff's blocked state, not a different selected entry's headline", () => {
  const blockedHandoff = entryOf(
    "other",
    "Not assessable: the forward model inputs did not validate.",
  );
  const selected = entryOf("selected", "Net leverage falls to 3.05x.");
  header([blockedHandoff, selected], blockedHandoff);
  expect(screen.queryByText("Net leverage falls to 3.05x.")).toBeNull();
  // The designed blocked state, not the raw sentence as a headline.
  expect(screen.getByText("Not assessable")).toBeInTheDocument();
  expect(screen.getByText(/forward model inputs did not validate/u)).toBeInTheDocument();
});

const REASON = "EBITDA not positive (T2E.3.r03) see credit_agreement.pdf page 4";
const columns = ["FY2025E", "FY2026E"].map((label) => ({ label, group: "Base case" }));
const modelOf = {
  cashflow: {
    columns,
    rows: [
      {
        label: "Net leverage (net debt / Adj EBITDA)",
        band: "",
        kind: "",
        total: false,
        cells: [
          { status: "value", exact: "5", display: "5.00x" },
          { status: "unavailable", display: "n.a.", reason: REASON },
        ],
      },
      {
        label: "Interest coverage",
        band: "",
        kind: "",
        total: false,
        cells: [
          { status: "unavailable", display: "n.a.", reason: REASON },
          { status: "unavailable", display: "n.a.", reason: REASON },
        ],
      },
    ],
  },
};

it("draws a no-figure year's reason through the reader rule in the stat strip", () => {
  const { container } = render(
    <ForecastStats
      view={view([])}
      folder="current"
      leverage={readMeasure(modelOf, "net leverage", /^Net leverage\b/, {
        pattern: /net debt \/ Adj EBITDA/,
        basis: "net debt over Adj EBITDA",
      })}
      cover={readMeasure(modelOf, "interest cover", /^Interest coverage\b/)}
      group="Base case"
      caseName="Base case"
      basis="Base case"
    />,
  );
  const strip = within(screen.getByLabelText("Forecast figures"));
  expect(container.textContent).not.toMatch(/credit_agreement|\.pdf|page 4|T2E\.3/u);
  expect(
    strip.getAllByText(/FY2026E not calculated: Reason recorded in model evidence\./u).length,
  ).toBeGreaterThan(0);
});
