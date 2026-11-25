import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import type { ReportView } from "../reportView";
import { readMeasure } from "./forecastData";
import { CaseFigure, ForecastHeader, ForecastStats } from "./ForecastHeader";

const run = { folder: "current", issuer: "Northbridge" } as PublishedRun;

function forward(text: string): OutputEntry {
  return {
    selected: true,
    output: {
      id: "forward",
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
  };
}
const view = (entries: OutputEntry[]) =>
  ({
    catalogue: undefined,
    lead: undefined,
    entries,
    modules: [{ id: "CP-2G", name: "Forward credit model", state: "Delivered", outputs: entries }],
    models: [],
  }) as unknown as ReportView;

function header(entries: OutputEntry[], onSelect = vi.fn()) {
  return render(
    <ForecastHeader
      run={run}
      view={view(entries)}
      preview={false}
      handoff={entries[0]}
      cases={[
        { name: "Base case", rawGroup: "Base case", hatched: false },
        {
          name: "Downside shock",
          rawGroup: "Downside case",
          hatched: true,
          absent: "No net leverage figure for this case.",
        },
      ]}
      current="Base case"
      onSelect={onSelect}
      basis={[{ label: "Units", value: "USD millions" }]}
      hasModel
    />,
  );
}

it("leads with the forward model's bottom line in its words, with one trace", () => {
  header([forward("Net leverage falls to 3.05x by FY2027 and cover never drops below 3.01x.")]);
  const tile = within(screen.getByRole("region", { name: "Forecast" }));
  expect(
    tile.getByText("Net leverage falls to 3.05x by FY2027 and cover never drops below 3.01x."),
  ).toBeInTheDocument();
  expect(tile.getByRole("link", { name: "Source for the forward view" })).toHaveAttribute(
    "href",
    expect.stringContaining("-21") as string,
  );
  expect(tile.getByText("USD millions")).toBeInTheDocument();
  expect(tile.getByText("Forward credit model, delivered")).toBeInTheDocument();
});

it("switches case from the header and marks a case with no leverage path", () => {
  const onSelect = vi.fn();
  header([forward("The view.")], onSelect);
  const cases = within(screen.getByRole("group", { name: "Case" }));
  expect(cases.getByRole("button", { name: "Base case" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(
    cases.getByRole("button", { name: "Downside shock: No net leverage figure for this case." }),
  );
  expect(onSelect).toHaveBeenCalledWith("Downside shock");
  // The lead's own words, not the switch's.
  expect(screen.getByText("Hatched: No net leverage figure for this case.")).toBeInTheDocument();
});

it("draws the gap in place of the bottom line when the forward model did not run", () => {
  render(
    <ForecastHeader
      run={run}
      view={{ ...view([]), modules: [] }}
      preview={false}
      handoff={undefined}
      cases={[]}
      current={undefined}
      onSelect={vi.fn()}
      basis={[]}
      hasModel={false}
    />,
  );
  expect(screen.getByText("Forward credit model did not run in this run.")).toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "Case" })).toBeNull();
});

const value = (exact: string) => ({ status: "value", exact, display: `${exact}x` });
const COLUMNS = ["FY2025E", "FY2026E", "FY2027E"].map((period) => ({
  label: period,
  group: "Base case",
}));
const modelOf = (rows: Record<string, unknown[]>) => ({
  cashflow: {
    columns: COLUMNS,
    rows: Object.entries(rows).map(([label, cells]) => ({
      label,
      band: "",
      kind: "",
      total: false,
      cells,
    })),
  },
});
const leverageOf = (model: unknown) =>
  readMeasure(model, "net leverage", /^Net leverage\b/, {
    pattern: /net debt \/ Adj EBITDA/,
    basis: "net debt over Adj EBITDA",
  });
const coverOf = (model: unknown) => readMeasure(model, "interest cover", /^Interest coverage\b/);

function stats(model: unknown, folderView = view([])) {
  render(
    <ForecastStats
      view={folderView}
      folder="current"
      leverage={leverageOf(model)}
      cover={coverOf(model)}
      group="Base case"
      caseName="Base case"
      basis="Base case · Adj EBITDA"
    />,
  );
  return within(screen.getByLabelText("Forecast figures"));
}

it("labels its selections as selections: highest and lowest published years, ties and gaps named", () => {
  const strip = stats(
    modelOf({
      "Net leverage (net debt / Adj EBITDA)": [value("5.65"), value("5.50"), value("5.65")],
      "Interest coverage": [
        value("3.40"),
        { status: "unavailable", display: "n.a.", reason: "Interest is zero" },
        value("3.90"),
      ],
    }),
  );
  expect(
    strip.getByText("Net leverage: highest published forecast year, Base case"),
  ).toBeInTheDocument();
  expect(strip.getAllByText("5.65x")).toHaveLength(2);
  // A tie is named, not resolved silently to one year.
  expect(strip.getByText("FY2025E and FY2027E")).toBeInTheDocument();
  expect(strip.getByText("Net leverage, FY2027E")).toBeInTheDocument();
  expect(strip.getByText(/from 5.65x in FY2025E/)).toBeInTheDocument();
  expect(
    strip.getByText("Interest cover: lowest published forecast year, Base case"),
  ).toBeInTheDocument();
  expect(strip.getByText("3.40x")).toBeInTheDocument();
  // The year with no figure is named in the same cell, with the model's reason.
  expect(strip.getByText("FY2026E not calculated: Interest is zero")).toBeInTheDocument();
  expect(strip.queryByText(/peak|minimum/i)).toBeNull();
  expect(
    strip.getByText(
      "Liquidity did not run in this run. Refinancing & LME did not run in this run.",
    ),
  ).toBeInTheDocument();
});

it("counts a case's published years and names each year with no figure", () => {
  const strip = stats(
    modelOf({
      "Net leverage (net debt / Adj EBITDA)": [
        value("2.50"),
        value("2.20"),
        { status: "unavailable", display: "n.a.", reason: "EBITDA is not positive" },
      ],
      "Interest coverage": [
        value("5.0"),
        { status: "unavailable", display: "n.a.", reason: "Interest is zero" },
        { status: "unavailable", display: "n.a." },
      ],
    }),
  );
  // Three years, one without a figure: a highest year among the two that have one.
  expect(strip.getByText("2.50x")).toBeInTheDocument();
  // Named in the highest-year cell and as the reason the last year has no figure.
  expect(strip.getAllByText("FY2027E not calculated: EBITDA is not positive")).toHaveLength(2);
  // Cover has one figure: it is not a lowest year, and the other years are named.
  expect(
    strip.getByText(
      "Only FY2025E has a figure; FY2026E not calculated: Interest is zero; FY2027E not calculated",
    ),
  ).toBeInTheDocument();
  expect(strip.queryByText("5.0x")).toBeNull();
});

it("says what the lead says when the model publishes two rows and none on the stated basis", () => {
  const strip = stats(
    modelOf({
      "Net leverage (gross)": [value("3"), value("2"), value("1")],
      "Net leverage (covenant basis)": [value("4"), value("3"), value("2")],
    }),
  );
  const words =
    "The model publishes 2 net leverage rows: Net leverage (gross) and Net leverage (covenant basis). None is on net debt over Adj EBITDA, so none is drawn.";
  expect(strip.getAllByText(words)).toHaveLength(2);
  expect(strip.queryByText(/publishes no net leverage figure/)).toBeNull();
});

it("says why a stat is empty, never zero", () => {
  const strip = stats(modelOf({ Revenue: [value("1"), value("2"), value("3")] }));
  expect(strip.getAllByText("The model publishes no net leverage figure.")).toHaveLength(2);
  expect(strip.getByText("The model publishes no interest cover figure.")).toBeInTheDocument();
  expect(strip.queryByText(/^0/)).toBeNull();
});

it("says an unreadable forward-model handoff could not be read", () => {
  const unreadable = { ...forward("x"), output: { ...forward("x").output, parseError: "bad" } };
  header([unreadable]);
  expect(
    screen.getByText("Forward credit model's output could not be read; it is in Evidence."),
  ).toBeInTheDocument();
  expect(screen.queryByText(/wrote no bottom line/)).toBeNull();
});

it("draws the selected case's cash proxy as the model displays it, never rounded", () => {
  render(
    <CaseFigure
      option={{
        name: "Base case",
        rawGroup: "Base case",
        period: "FY2027E",
        value: 1234.5,
        units: "USD millions",
        description: undefined,
      }}
      display="1,234.50"
      notice={undefined}
      shownQualifications={[]}
    />,
  );
  expect(screen.getByText("1,234.50")).toBeInTheDocument();
  expect(screen.queryByText("1,234.5")).toBeNull();
  expect(screen.queryByText(/rounded/)).toBeNull();
});

it("offers no way to a forward model the run does not have", () => {
  render(
    <ForecastHeader
      run={run}
      view={{ ...view([]), modules: [] }}
      preview={false}
      handoff={undefined}
      cases={[]}
      current={undefined}
      onSelect={vi.fn()}
      basis={[]}
      hasModel={false}
    />,
  );
  expect(screen.queryByRole("link", { name: "Open module" })).toBeNull();
});

it("stacks the case switch one case per row when a case name does not fit on one line", () => {
  // jsdom has no layout: a 600px name in a 390px column is given by its measures.
  const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(390);
  const natural = vi
    .spyOn(HTMLElement.prototype, "scrollWidth", "get")
    .mockImplementation(function (this: HTMLElement) {
      return this.tagName === "BUTTON" && !this.closest("[role=group].flex-col") ? 600 : 100;
    });
  header([forward("The view.")]);
  const group = screen.getByRole("group", { name: "Case" });
  expect(group).toHaveClass("flex-col");
  // Every case is still one press away, with its name whole.
  expect(within(group).getByRole("button", { name: "Base case" })).toBeInTheDocument();
  natural.mockRestore();
  width.mockRestore();
});

it("keeps the case switch on one row where the names fit", () => {
  const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
  const natural = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(120);
  header([forward("The view.")]);
  expect(screen.getByRole("group", { name: "Case" })).not.toHaveClass("flex-col");
  natural.mockRestore();
  width.mockRestore();
});
