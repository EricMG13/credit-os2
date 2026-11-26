// The first cases read retained TransDigm CP-1 handoffs (outdated evidence: shape and scope only):
// the accepted handoff (FY2023 and FY2024), the relative value draft (FY2024 only) and the
// distressed draft. Expected values are written out by hand from their figure tables. The other
// cases are mutations (`fixtures/mutations.ts`) or synthetic entries built from the module contract
// (the CP-1 `Chart data: revenue and EBITDA` table); not a real handoff.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OutputEntry } from "../../../publishedReport";
import { entry, section, table } from "../../overview/rows.fixture";
import { cp1Entry, distressedCp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import {
  addRow,
  edited,
  ltmCp1,
  mixedPeriodsCp1,
  OUTSIDE,
  setCell,
  setLabelled,
  threePeriodCp1,
} from "../fixtures/mutations";
import { readCell } from "../kit/numbers";
import { PeriodsTile } from "./Periods";
import { periodStrip, periodsCaption, stateOf } from "./periodsData";

afterEach(cleanup);

const draw = (data: OutputEntry) => {
  render(<PeriodsTile lead={leadProps(data)} />);
  return screen.getByRole("region", { name: "Periods" });
};
const byData = (tile: HTMLElement, attr: string, value: string) =>
  [...tile.querySelectorAll(`[data-${attr}]`)].find(
    (el) => el.getAttribute(`data-${attr}`) === value,
  ) ?? null;
const period = (tile: HTMLElement, label: string) => byData(tile, "period", label);
const cell = (tile: HTMLElement, name: string) =>
  byData(tile, "cell", name)?.getAttribute("data-state");

/** The three-period mutation with FY2022's two stated figures (2646) made gaps too. */
const allGapFy2022 = () => {
  let data = setCell(
    threePeriodCp1(),
    "Chart data: revenue and EBITDA",
    2,
    "Adjusted EBITDA",
    OUTSIDE,
  );
  data = setLabelled(data, "T4.4 Income statement", "EBITDA (Reported)", "FY2022", OUTSIDE);
  return data;
};

describe("PeriodsTile on the retained handoffs", () => {
  it("draws the accepted handoff's two periods as the compared pair, with what is not carried", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getByRole("heading", { name: "Periods" })).toBeVisible();
    expect(within(tile).getByText("Periods the figures cover")).toBeVisible();
    for (const label of ["FY2023", "FY2024"]) {
      expect(period(tile, label)?.getAttribute("data-state")).toBe("figures");
      expect(period(tile, label)?.querySelector('[data-mark="compared"]')).not.toBeNull();
    }
    expect(tile.querySelector("[data-comparison]")).not.toBeNull();
    expect(period(tile, "FY2024")?.textContent).toBe("FY2024Latest, compared");
    expect(period(tile, "FY2023")?.textContent).toBe("FY2023Compared");
    expect(within(tile).getByText("Figures show FY2023 and FY2024.")).toBeVisible();
    expect(tile.textContent).not.toMatch(/not in this handoff|longer trend/);
    // Two periods: the strip says it all; no per-figure matrix.
    expect(tile.querySelector("[data-figure]")).toBeNull();
    expect(within(tile).getByRole("img").getAttribute("aria-label")).toBe(
      "Periods the figures cover: FY2023 compared; FY2024 latest, compared.",
    );
  });
  it("draws the relative value draft's one period with no comparison", () => {
    const tile = draw(relativeValueCp1Entry());
    expect(period(tile, "FY2024")?.querySelector('[data-mark="stated"]')).not.toBeNull();
    expect(tile.querySelector("[data-comparison]")).toBeNull();
    expect(within(tile).getByText("Figures show FY2024.")).toBeVisible();
    expect(tile.textContent).not.toMatch(/not in this handoff|longer trend/);
  });
  it("reads the distressed draft as the accepted one", () => {
    const tile = draw(distressedCp1Entry());
    expect(within(tile).getByText("Figures show FY2023 and FY2024.")).toBeVisible();
    expect(tile.textContent).not.toMatch(/not in this handoff|longer trend/);
  });
  it("has one trace control and a table of each figure's periods from the button", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getAllByRole("link", { name: /^Source for / })).toHaveLength(1);
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const rows = within(within(tile).getByRole("table"))
      .getAllByRole("row")
      .map((row) => [...row.querySelectorAll("th, td")].map((item) => item.textContent));
    expect(rows).toEqual([
      ["Figure", "FY2023", "FY2024"],
      ["Earnings against debt", "Stated", "Stated"],
      ["Cash conversion", "Stated", "Stated"],
      ["Net debt", "Stated", "Stated"],
      ["Segments", "Stated", "Stated"],
    ]);
  });
  it("draws all SVG text at 11 px or more, and no source reference", () => {
    const tile = draw(threePeriodCp1());
    for (const text of tile.querySelectorAll("svg text"))
      expect(Number(text.getAttribute("font-size"))).toBeGreaterThanOrEqual(11);
    expect(tile.textContent).not.toMatch(/T4\.\d|jsonl|page \d/);
  });
});

describe("PeriodsTile beyond two periods (mutations; not a real handoff)", () => {
  it("draws the third period and says which figure states it", () => {
    const tile = draw(threePeriodCp1());
    expect(period(tile, "FY2022")?.getAttribute("data-state")).toBe("figures");
    expect(period(tile, "FY2022")?.textContent).toBe("FY2022Partly stated");
    expect(period(tile, "FY2022")?.querySelector('[data-mark="partly"]')).not.toBeNull();
    expect(cell(tile, "Earnings against debt|FY2022")).toBe("figures");
    expect(cell(tile, "Cash conversion|FY2022")).toBe("gap");
    expect(cell(tile, "Net debt|FY2022")).toBe("gap");
    expect(cell(tile, "Segments|FY2022")).toBe("none");
    expect(cell(tile, "Segments|FY2024")).toBe("figures");
    expect(
      within(tile).getByText(
        "Cash conversion and Net debt, FY2022: Not supplied: outside the comparison scope",
      ),
    ).toBeVisible();
    expect(within(tile).getByText("Figures show FY2022, FY2023 and FY2024.")).toBeVisible();
  });
  it("draws a period stated only as gaps as the hatched slot with its reason", () => {
    const tile = draw(allGapFy2022());
    expect(period(tile, "FY2022")?.getAttribute("data-state")).toBe("gap");
    expect(
      byData(tile, "gap", "FY2022: Not supplied: outside the comparison scope"),
    ).not.toBeNull();
    const words = [
      ...(period(tile, "FY2022")?.querySelectorAll('[data-part="state"] tspan') ?? []),
    ];
    expect(words.map((line) => line.textContent).join(" ")).toBe(
      "Not supplied: outside the comparison scope",
    );
    expect(within(tile).getByText("Figures show FY2023 and FY2024.")).toBeVisible();
  });
  it("lists a last-twelve-months period apart from the annual axis", () => {
    const tile = draw(ltmCp1());
    expect(period(tile, "LTM Dec-2024")).toBeNull();
    expect(
      within(tile).getByText("Other kinds of period: LTM Dec-2024 (Earnings against debt)."),
    ).toBeVisible();
    expect(within(tile).getByText("Figures show FY2023, FY2024 and LTM Dec-2024.")).toBeVisible();
  });
  it("names a figure table whose periods cannot be read", () => {
    const twice = addRow(cp1Entry(), "Net debt data", [
      "FY2024 / 2024-09-30",
      "1",
      "1",
      "0",
      "US$m",
      "x",
    ]);
    const tile = draw(twice);
    expect(
      within(tile).getByText(
        "This page could not read the periods of net debt data because FY2024 appears more than once.",
      ),
    ).toBeVisible();
  });
  it("draws the one gap pattern when no figure table states a period", () => {
    const tile = draw(edited(cp1Entry(), () => null));
    expect(tile.textContent).toBe("PeriodsThis page could not read a period.");
    expect(tile.className).not.toMatch(/gap-hatch/);
  });
});

describe("periodStrip", () => {
  const revenue = (labels: string[]) =>
    entry(
      "CP-1",
      [],
      [
        section(
          "Chart data: revenue and EBITDA",
          30,
          table(
            32,
            ["Period", "Revenue", "Adjusted EBITDA", "Reporting unit", "Basis and limitation"],
            labels.map((label) => [label, "100", "40", "US$m", "Annual."]),
          ),
        ),
      ],
    );
  it("keeps a true year axis: a year between two stated years is drawn as not stated", () => {
    const strip = periodStrip(revenue(["FY2021", "FY2024"]));
    expect(strip.axis.map((p) => [p.label, p.state.kind])).toEqual([
      ["FY2021", "figures"],
      ["FY2022", "unstated"],
      ["FY2023", "unstated"],
      ["FY2024", "figures"],
    ]);
    // Three years apart: no comparison is named (a change is only between years one apart).
    expect(strip.comparison).toBeNull();
  });
  it("draws a period list too long for the axis as rows, one period per row", () => {
    const years = Array.from({ length: 14 }, (_, at) => `FY${String(2011 + at)}`);
    render(<PeriodsTile lead={leadProps(revenue(years))} />);
    const tile = screen.getByRole("region", { name: "Periods" });
    expect(within(tile).getByRole("img").getAttribute("data-layout")).toBe("rows");
    expect(tile.querySelectorAll("[data-period]")).toHaveLength(14);
    expect(byData(tile, "period", "FY2024")?.textContent).toBe("FY2024Latest, compared");
  });
  it("puts non-annual periods on the axis when no period is annual", () => {
    const strip = periodStrip(revenue(["H1 2024", "H2 2024"]));
    expect(strip.axis.map((p) => p.label)).toEqual(["H1 2024", "H2 2024"]);
    expect(strip.apart).toEqual([]);
  });
  it("reads a period's state from its cells: a number wins, then gaps, then words", () => {
    expect(stateOf([readCell("Not supplied: a"), readCell("12")])).toEqual({ kind: "figures" });
    expect(stateOf([readCell("0")])).toEqual({ kind: "figures" });
    expect(stateOf([readCell("Not supplied: a"), readCell("Not supplied: a"), null])).toEqual({
      kind: "gap",
      reasons: ["Not supplied: a"],
    });
    expect(stateOf([readCell("pending"), null])).toEqual({ kind: "words" });
    expect(stateOf([null])).toEqual({ kind: "none" });
  });
});

describe("periodsCaption: the line that replaces the tile for plain periods", () => {
  it("names the stated periods of the accepted handoff and of the one-period draft", () => {
    expect(periodsCaption(cp1Entry())).toBe("Each figure in its stated period: FY2023, FY2024");
    expect(periodsCaption(relativeValueCp1Entry())).toBe(
      "Each figure in its stated period: FY2024",
    );
    expect(periodsCaption(distressedCp1Entry())).toBe(
      "Each figure in its stated period: FY2023, FY2024",
    );
  });
  it("is null where the full strip is needed: three periods, another kind, or a gap period", () => {
    expect(periodsCaption(threePeriodCp1())).toBeNull();
    expect(periodsCaption(ltmCp1())).toBeNull();
    expect(periodsCaption(allGapFy2022())).toBeNull();
  });
  it("says nothing without a period", () => {
    expect(periodsCaption(entry("CP-1", [], []))).toBeNull();
  });
});

// The ruling of 2026-11-25: the stated periods in the one period order; "Latest" is the latest
// reported period. The fixture writes its rows scrambled; the expected order is written by hand.
describe("PeriodsTile: five scrambled periods", () => {
  it("lists fiscal years on the axis, then LTM, PF and the forecast year, in that order", () => {
    const strip = periodStrip(mixedPeriodsCp1());
    expect(strip.axis.map((one) => one.label)).toEqual(["FY2023", "FY2024"]);
    expect(strip.apart.map((one) => one.label)).toEqual(["LTM Jun-2025", "PF FY2024", "FY2025E"]);
    expect(strip.shown).toEqual(["FY2023", "FY2024", "LTM Jun-2025", "PF FY2024", "FY2025E"]);
    expect([strip.ordered, strip.unplaced]).toEqual([true, []]);
    const tile = draw(mixedPeriodsCp1());
    expect(
      within(tile).getByText("Figures show FY2023, FY2024, LTM Jun-2025, PF FY2024 and FY2025E."),
    ).toBeVisible();
  });
  it("FY2024 is compared but not the latest reported period beside a later LTM", () => {
    const tile = draw(mixedPeriodsCp1());
    expect(period(tile, "FY2023")?.textContent).toBe("FY2023Compared");
    expect(period(tile, "FY2024")?.textContent).toBe("FY2024Compared");
    expect(periodStrip(mixedPeriodsCp1()).axis.map((one) => one.latest)).toEqual([false, false]);
    // With the fiscal years alone, FY2024 is the latest reported period.
    expect(periodStrip(cp1Entry()).axis.map((one) => [one.label, one.latest])).toEqual([
      ["FY2023", false],
      ["FY2024", true],
    ]);
  });
});

describe("a stated source dash (S15-5-4)", () => {
  it("a period every net debt cell states as a source dash is drawn as the dash, not the words", () => {
    // Mutation of the retained TransDigm CP-1 (not a real handoff): an FY2022 row of source dashes.
    // Answer key: periodsData `written` (a source dash reads "—").
    const dash = "Not supplied: source dash";
    const tile = draw(
      addRow(cp1Entry(), "Net debt data", [
        "FY2022 / 2022-09-30",
        dash,
        dash,
        dash,
        "US$m",
        "Test row.",
      ]),
    );
    const labels = [...tile.querySelectorAll("[aria-label]")].map(
      (node) => node.getAttribute("aria-label") ?? "",
    );
    expect([tile.textContent, ...labels].join(" ")).not.toMatch(/source dash/i);
  });
});
