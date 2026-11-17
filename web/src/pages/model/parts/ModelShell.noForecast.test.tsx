import { cleanup, render, screen, within } from "@testing-library/react";
import { App } from "@/App";
import type { LoadResult } from "@/data";
import { edited, fixtureSlice } from "../slice/test-fixture";

// S5-001, ruling L8: a run with no forecast still draws its Front page, Analysis, Model, Portfolio
// fit and Limitations, and lists on the index; the Forecast form falls back to the Model's tabs.
const BASE = "#/model/transdigm/2025-06-30";
const EVIDENCE = "#/library/transdigm/2025-06-30/evidence";
const UNREADABLE = "This part of the library could not be read";
const MODEL_TABS = [
  ["Front page", `${BASE}/front`],
  ["Analysis", `${BASE}/analysis`],
  ["Model", `${BASE}/statements`],
  ["Portfolio fit", `${BASE}/portfolio-fit`],
  ["Limitations6", `${BASE}/limitations`],
  ["Evidence", EVIDENCE],
];

const ok = (model: unknown): LoadResult => ({
  kind: "ok",
  data: { schema: "credit-os-data/1", issuers: [], model },
});
const noForecast = () => edited(["runs", 0, "forecast"], undefined);

// What each page draws, copied from the data file's own text, not from a reader.
type Raw = {
  front: { bottomLine: { lead: string } };
  analysis: { findings: { title: string }[] };
  statements: { intro: string };
  portfolioFit: { limits: { title: string } };
  limitations: { lead: string };
};
const raw = (fixtureSlice() as { runs: Raw[] }).runs[0] as Raw;
const PAGES: [string, string][] = [
  ["front", raw.front.bottomLine.lead],
  ["analysis", raw.analysis.findings[0]?.title ?? ""],
  ["statements", raw.statements.intro],
  ["portfolio-fit", raw.portfolioFit.limits.title],
  ["limitations", raw.limitations.lead],
];

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

function open(hash: string, model: unknown) {
  window.location.hash = hash;
  return render(<App result={ok(model)} />);
}

const pagesNav = () => screen.getByRole("navigation", { name: "Pages" });
const tabs = () =>
  within(pagesNav())
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);

describe("a run with no forecast", () => {
  it("offers no source switch on the sentence-only Forecast page, while other model pages retain it", () => {
    open(`${BASE}/forecast`, noForecast());
    expect(screen.queryByRole("switch", { name: "Show sources" })).toBeNull();
    cleanup();
    open(`${BASE}/front`, noForecast());
    expect(screen.getByRole("switch", { name: "Show sources" })).toBeVisible();
  });

  it.each(PAGES)("draws its %s page", (page, anchor) => {
    open(`${BASE}/${page}`, noForecast());
    expect(screen.queryByText(UNREADABLE)).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("TransDigm Group");
    expect(screen.getByRole("main")).toHaveTextContent(anchor);
  });

  it.each(PAGES)("offers the Model's tabs on its %s page", (page) => {
    open(`${BASE}/${page}`, noForecast());
    expect(tabs()).toEqual(MODEL_TABS);
  });

  it("falls back to the Model's tabs on its Forecast page, with the way back into the model", () => {
    open(`${BASE}/forecast`, noForecast());
    expect(tabs()).toEqual(MODEL_TABS);
    expect(within(pagesNav()).queryByRole("link", { current: "page" })).toBeNull();
    expect(screen.getByRole("link", { name: "Open the financial model" })).toHaveAttribute(
      "href",
      `${BASE}/front`,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Forecast");
  });

  it("is listed on the index as a model that can be opened, not one that could not be read", () => {
    open("#/model/runs", noForecast());
    const main = within(screen.getByRole("main"));
    expect(main.queryByText("Could not be read")).toBeNull();
    expect(main.getByRole("link", { name: /TransDigm Group/ })).toHaveAttribute(
      "href",
      `${BASE}/front`,
    );
  });

  it("leaves the Forecast form of a run that has a forecast on the library's tabs", () => {
    open(`${BASE}/forecast`, fixtureSlice());
    expect(tabs().map(([label]) => label)).toEqual([
      "Overview",
      "Changes5",
      "Modules11",
      "Forecast",
      "Evidence",
    ]);
  });
});
