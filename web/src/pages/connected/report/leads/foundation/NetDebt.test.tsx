// Expected values are written out by hand from the retained TransDigm CP-1 handoffs
// (tests/fixtures/live_2026_11_15/: earnings_update-CP-1-draft3-accepted.md, relative_value-CP-1-draft1.md,
// distressed-CP-1-draft1.md), not computed by the code under test. The handoffs are outdated
// evidence (FY2024): shape and scope only. The one-adjustment, none-row, three-period and edited
// entries (fixtures/mutations.ts) are test inputs, not real handoffs.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OutputEntry } from "../../../publishedReport";
import { containsReference } from "../../../publishedReport";
import { cp1Entry, distressedCp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import {
  dropTable,
  edited,
  mixedPeriodsCp1,
  setCell,
  threePeriodCp1,
  withRows,
} from "../fixtures/mutations";
import { NO_ADJUSTMENT, netDebtView } from "./foundationData";
import { barsLayout, stripEntries, stripLayout } from "./netDebtGeometry";
import { NetDebtTile } from "./NetDebt";

afterEach(cleanup);

const ADJUSTMENTS = "Post-balance-sheet adjustments";
const DIVIDEND = [
  "Special dividend and dividend equivalent settlement",
  "2024-10-18",
  "4348",
  "22967",
  "6.02",
  "US$m",
  "Standalone September adjustment / reported EBITDA 3813.",
];
/** The accepted handoff with only its dividend row: exactly one adjustment states a pro forma. */
const oneAdjustment = () => withRows(cp1Entry(), ADJUSTMENTS, [DIVIDEND]);

function draw(entry: OutputEntry = cp1Entry()) {
  render(<NetDebtTile lead={leadProps(entry)} />);
  return screen.getByRole("region", { name: "Net debt" });
}

function everything(tile: HTMLElement) {
  const labels = [...tile.querySelectorAll("[aria-label]")].map(
    (node) => node.getAttribute("aria-label") ?? "",
  );
  return [tile.textContent, ...labels].join(" ");
}

/** No equation, sum, ratio or movement sentence; no source reference. */
function noAnalysis(tile: HTMLElement) {
  const text = everything(tile);
  expect(text).not.toMatch(/÷|deriv|growth|=| \+ /i);
  expect(text).not.toMatch(/\b(rose|fell|reverses)\b/);
  expect(text).not.toMatch(/does not add|not gross debt less cash/i);
  expect(containsReference(text)).toBe(false);
}

const attr = (node: Element | null | undefined, name: string) => Number(node?.getAttribute(name));
const bar = (tile: HTMLElement, label: string) =>
  tile.querySelector(`[data-row="${label}"] rect[data-bar]`);
const readings = (tile: HTMLElement) =>
  [...tile.querySelectorAll("[data-part=reading]")].map((node) =>
    [...node.querySelectorAll("tspan")].map((span) => span.textContent).join(" "),
  );
/** The Adjustments table's rows, headers first, each cell's text (the panel is closed by default). */
const adjustmentRows = (tile: HTMLElement) =>
  [...tile.querySelectorAll("[data-adjustments] tr")].map((row) =>
    [...row.querySelectorAll("th, td")].map((cell) => cell.textContent),
  );
const marks = (tile: HTMLElement) => [...tile.querySelectorAll("[data-strip] [data-mark]")];
const markX = (tile: HTMLElement, label: string) =>
  attr(tile.querySelector(`[data-strip] [data-mark="${label}"]`), "cx");
const stripLabels = (tile: HTMLElement) =>
  [...tile.querySelectorAll("[data-strip] [data-part=label]")].map((node) =>
    [...node.querySelectorAll("tspan")].map((span) => span.textContent).join(" "),
  );

const SECURITISATION = "Remaining securitization draw";
const DIVIDEND_NAME = "Special dividend and dividend equivalent settlement";
const REPURCHASES = "Common-stock repurchases";
const RAPTOR = "Raptor acquisition working-capital settlement received";
const CPI = "CPI acquisition working-capital settlement paid";
const FIRST_Q = "Not supplied: the source states first quarter FY2025 only";

describe("Net debt: the accepted handoff, FY2023 and FY2024", () => {
  it("titles the tile plainly, the unit and periods in the kicker", () => {
    const tile = draw();
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Net debt");
    expect(tile.textContent).toContain("Net debt, $m · FY2023 → FY2024");
  });

  it("draws each period's net debt and its cash to gross debt as stated, proportional from zero", () => {
    const tile = draw();
    const [fy23, fy24] = [bar(tile, "FY2023"), bar(tile, "FY2024")];
    expect(attr(fy23, "data-value")).toBe(16278);
    expect(attr(fy24, "data-value")).toBe(18619);
    expect(fy23?.getAttribute("class")).toContain("fill-chart-3");
    expect(fy24?.getAttribute("class")).toContain("fill-chart-1");
    const zero = attr(fy23, "x");
    expect(attr(fy24, "x")).toBe(zero);
    const perUnit = attr(fy24, "width") / 18619;
    expect(attr(fy23, "width")).toBeCloseTo(16278 * perUnit, 6);
    // Cash starts where net debt ends and has its own stated length; gross debt is marked where stated.
    const cash = tile.querySelector('[data-cash="FY2024"]');
    expect(attr(cash, "x") - 0.5).toBeCloseTo(zero + 18619 * perUnit, 6);
    expect(attr(cash, "width") + 1).toBeCloseTo(6261 * perUnit, 6);
    expect(attr(tile.querySelector('[data-gross="FY2023"]'), "x1")).toBeCloseTo(
      zero + 19750 * perUnit,
      6,
    );
    expect(attr(tile.querySelector('[data-gross="FY2024"]'), "x1")).toBeCloseTo(
      zero + 24880 * perUnit,
      6,
    );
    expect(readings(tile)).toEqual([
      "Net 16,278 · cash 3,472 · gross debt 19,750",
      "Net 18,619 · cash 6,261 · gross debt 24,880",
    ]);
  });

  it("with five stated pro formas draws no pro forma bar: the periods only", () => {
    const tile = draw();
    expect(tile.querySelector("[data-pro-forma]")).toBeNull();
    expect(tile.querySelector('[data-row="Pro forma"]')).toBeNull();
    expect(
      [...tile.querySelectorAll("rect[data-bar]")].map((b) => b.getAttribute("data-bar")),
    ).toEqual(["FY2023", "FY2024"]);
  });

  it("draws each adjustment's pro forma net leverage as its own labelled mark on the strip, in handoff order", () => {
    const tile = draw();
    expect(marks(tile).map((mark) => mark.getAttribute("data-mark"))).toEqual([
      "FY2023",
      "FY2024",
      `Pro forma · ${SECURITISATION}`,
      `Pro forma · ${DIVIDEND_NAME}`,
      `Pro forma · ${REPURCHASES}`,
      `Pro forma · ${RAPTOR}`,
      `Pro forma · ${CPI}`,
    ]);
    expect(marks(tile).map((mark) => attr(mark, "data-value"))).toEqual([
      5.17, 4.88, 4.88, 6.02, 4.97, 4.88, 4.88,
    ]);
    // Reported marks keep the chart colours; every pro forma mark is the signal colour with its word.
    expect(marks(tile)[0]?.getAttribute("class")).toContain("fill-chart-3");
    expect(marks(tile)[1]?.getAttribute("class")).toContain("fill-chart-1");
    for (const mark of marks(tile).slice(2))
      expect(mark.getAttribute("class")).toContain("fill-category-3");
    expect(stripLabels(tile)).toEqual([
      "FY2023",
      "FY2024",
      `Pro forma · ${SECURITISATION}`,
      `Pro forma · ${DIVIDEND_NAME}`,
      `Pro forma · ${REPURCHASES}`,
      `Pro forma · ${RAPTOR}`,
      `Pro forma · ${CPI}`,
    ]);
  });

  it("places the strip's marks proportionally on one scale and gives each its own row", () => {
    const tile = draw();
    // Hand: 5.17, 4.88, 6.02 and 4.97 on one axis: offsets from 4.88 are 0.29 (left of it? no:
    // 5.17 is above), 1.14 and 0.09, so 0.29 : 1.14 : 0.09.
    const unit = (markX(tile, `Pro forma · ${DIVIDEND_NAME}`) - markX(tile, "FY2024")) / 1.14;
    expect(markX(tile, "FY2023") - markX(tile, "FY2024")).toBeCloseTo(0.29 * unit, 6);
    expect(markX(tile, `Pro forma · ${REPURCHASES}`) - markX(tile, "FY2024")).toBeCloseTo(
      0.09 * unit,
      6,
    );
    const rows = marks(tile).map((mark) => attr(mark, "cy"));
    for (const [at, y] of rows.entries())
      if (at > 0) expect(y - (rows[at - 1] ?? 0)).toBeGreaterThanOrEqual(24);
    // The wrapped row labels never overlap the next row's mark.
    const label = tile.querySelector("[data-strip] [data-row] [data-part=label]");
    expect(label).not.toBeNull();
  });

  it("reads the strip with the name of every adjustment", () => {
    const tile = draw();
    const strip = within(tile).getByRole("img", { name: /Net debt \/ EBITDA/ });
    expect(strip.getAttribute("aria-label")).toBe(
      `Net debt / EBITDA on its own scale: FY2023 5.17x, FY2024 4.88x, pro forma ${SECURITISATION} 4.88x, pro forma ${DIVIDEND_NAME} 6.02x, pro forma ${REPURCHASES} 4.97x, pro forma ${RAPTOR} 4.88x, pro forma ${CPI} 4.88x.`,
    );
  });

  it("puts the adjustments in a compact headed table behind an Adjustments button", () => {
    const tile = draw();
    const button = within(tile).getByRole("button", { name: /^Adjustments/ });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(tile.querySelector("[data-adjustments]")?.hasAttribute("hidden")).toBe(true);
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(tile.querySelector("[data-adjustments]")?.hasAttribute("hidden")).toBe(false);
    expect(adjustmentRows(tile)).toEqual([
      ["Adjustment", "Date", "Amount", "Pro forma net debt", "Pro forma net leverage"],
      [SECURITISATION, "2024-10-16", "0", "18,619", "4.88x"],
      [DIVIDEND_NAME, "2024-10-18", "4,348", "22,967", "6.02x"],
      [REPURCHASES, FIRST_Q, "316", "18,935", "4.97x"],
      [RAPTOR, FIRST_Q, "−1", "18,618", "4.88x"],
      [CPI, FIRST_Q, "1", "18,620", "4.88x"],
    ]);
    // A stated gap in a cell is a small chip holding the module's own words.
    const chips = [...tile.querySelectorAll("[data-adjustments] [data-gap-chip]")];
    expect(chips.map((chip) => chip.textContent)).toEqual([FIRST_Q, FIRST_Q, FIRST_Q]);
  });

  it("shows the stated liquidity total beside the stated cash and undrawn facilities, never a sum", () => {
    const tile = draw();
    const well = within(tile).getByRole("group", { name: "Liquidity" });
    expect(well.textContent).toContain("Liquidity · Cash plus available revolver");
    const rows = [...well.querySelectorAll("[data-liquidity]")].map((row) => row.textContent);
    expect(rows).toEqual([
      "FY20234,227cash 3,472 · undrawn committed facilities 755",
      "FY20247,104cash 6,261 · undrawn committed facilities 843",
    ]);
  });

  it("prints no equation, sum or movement sentence, and has one trace control", () => {
    const tile = draw();
    noAnalysis(tile);
    expect(within(tile).getAllByRole("link", { name: /Source for/ })).toHaveLength(1);
  });

  it("opens the table view from the button: every period, then every adjustment as written", () => {
    const tile = draw();
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const rows = within(within(tile).getByRole("table"))
      .getAllByRole("row")
      .map((row) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent));
    expect(rows.slice(0, 3)).toEqual([
      [
        "Period or adjustment",
        "Date",
        "Amount",
        "Gross debt",
        "Cash",
        "Net debt",
        "Net debt / EBITDA",
      ],
      ["FY2023", "Not applicable", "Not applicable", "19,750", "3,472", "16,278", "5.17x"],
      ["FY2024", "Not applicable", "Not applicable", "24,880", "6,261", "18,619", "4.88x"],
    ]);
    expect(rows[5]).toEqual([
      "Pro forma: Common-stock repurchases",
      "Not supplied: the source states first quarter FY2025 only",
      "316",
      "Not stated",
      "Not stated",
      "18,935",
      "4.97x",
    ]);
    expect(rows).toHaveLength(8);
  });
});

describe("Net debt: one or two stated pro formas are drawn as bars", () => {
  it("draws one as a solid signal-coloured bar with a seam where the reported net debt ends", () => {
    const tile = draw(oneAdjustment());
    const pro = tile.querySelector("[data-pro-forma]");
    expect(attr(pro, "data-value")).toBe(22967);
    expect(pro?.getAttribute("class")).toContain("fill-category-3");
    const label = tile.querySelector('[data-row="Pro forma"] [data-part="label"]');
    expect(label?.getAttribute("class")).toContain("fill-text-primary");
    expect(label?.getAttribute("class")).toContain("font-medium");
    expect(label?.getAttribute("class")).not.toContain("fill-warning-text");
    const key = tile.querySelector('[data-part="legend"] [data-swatch].fill-category-3');
    expect(key?.closest("[data-legend]")?.textContent).toContain("Pro forma net debt");
    // Solid, not the hatch (hatch means not known).
    expect(pro?.getAttribute("fill")).toBeNull();
    expect(tile.querySelector('[data-row="Pro forma"] [data-gap]')).toBeNull();
    const fy24 = bar(tile, "FY2024");
    const perUnit = attr(fy24, "width") / 18619;
    expect(attr(pro, "width")).toBeCloseTo(22967 * perUnit, 6);
    const seam = tile.querySelector("[data-seam]");
    expect(seam?.getAttribute("class")).toContain("stroke-surface-card");
    expect(attr(seam, "x1")).toBeCloseTo(attr(fy24, "x") + 18619 * perUnit, 6);
    expect(readings(tile)[2]).toBe(
      "Net 22,967 · Special dividend and dividend equivalent settlement · 2024-10-18 · amount 4,348",
    );
    expect(tile.textContent).toContain("Pro forma net debt");
    noAnalysis(tile);
  });

  it("draws two as two bars, each with its own reading, in handoff order", () => {
    const tile = draw(relativeValueCp1Entry());
    const pros = [...tile.querySelectorAll("[data-pro-forma]")];
    expect(pros.map((node) => attr(node, "data-value"))).toEqual([22967, 22967]);
    expect(readings(tile).slice(1)).toEqual([
      "Net 22,967 · Special dividend and vested dividend equivalents paid · Not supplied: the source states October 2024 only for the combined payment · amount 4,348",
      "Net 22,967 · Remaining securitization availability drawn · Not supplied: the source states October 2024 only · amount 0",
    ]);
  });

  it("with the one pro forma, joins the strip with a mark in the signal colour carrying its word and name", () => {
    const tile = draw(oneAdjustment());
    const strip = within(tile).getByRole("img", { name: /Net debt \/ EBITDA/ });
    expect(strip.getAttribute("aria-label")).toBe(
      `Net debt / EBITDA on its own scale: FY2023 5.17x, FY2024 4.88x, pro forma ${DIVIDEND_NAME} 6.02x.`,
    );
    expect(strip.textContent).toContain(`Pro forma · ${DIVIDEND_NAME}`);
    expect(strip.querySelector("circle.fill-category-3")).not.toBeNull();
    // FY2023 → FY2024 joined by one line; the pro forma mark is not joined to a period page-chosen.
    expect(strip.querySelectorAll("line[data-join]")).toHaveLength(1);
  });

  it("draws no bar when the pro forma net debt is not a number, and a hatched mark for a leverage gap", () => {
    const tile = draw(
      withRows(cp1Entry(), ADJUSTMENTS, [
        DIVIDEND.map((cell, at) =>
          at === 3 ? "Not supplied: not split" : at === 4 ? "Not supplied: no ratio" : cell,
        ),
      ]),
    );
    expect(tile.querySelector("[data-pro-forma]")).toBeNull();
    const gap = tile.querySelector("[data-strip] [data-gap]");
    expect(gap?.getAttribute("data-gap")).toBe("Not supplied: no ratio");
    expect(
      tile.querySelector(`[data-strip] [data-mark="Pro forma · ${DIVIDEND_NAME}"]`),
    ).toBeNull();
    // The reason is written beside the slot, never a zero mark.
    expect(
      [...tile.querySelectorAll("[data-strip] [data-part=reason]")].map((node) =>
        [...node.querySelectorAll("tspan")].map((span) => span.textContent).join(" "),
      ),
    ).toEqual(["Not supplied: no ratio"]);
    expect(adjustmentRows(tile)[1]).toEqual([
      DIVIDEND_NAME,
      "2024-10-18",
      "4,348",
      "Not supplied: not split",
      "Not supplied: no ratio",
    ]);
  });

  it("draws a cell written as a source dash as the dash", () => {
    const tile = draw(
      withRows(cp1Entry(), ADJUSTMENTS, [
        DIVIDEND.map((cell, at) => (at === 2 ? "Not supplied: source dash" : cell)),
      ]),
    );
    expect(adjustmentRows(tile)[1]).toEqual([DIVIDEND_NAME, "2024-10-18", "—", "22,967", "6.02x"]);
    expect(tile.textContent).not.toMatch(/source dash/);
  });
});

describe("Net debt: other real handoffs and gap states", () => {
  it("draws the relative value handoff's one period, its two adjustments, no comparison", () => {
    const tile = draw(relativeValueCp1Entry());
    expect(tile.textContent).toContain("Net debt, $m · FY2024");
    expect(
      [...tile.querySelectorAll("rect[data-bar]")].map((b) => b.getAttribute("data-bar")),
    ).toEqual(["FY2024", "Pro forma", "Pro forma"]);
    expect(adjustmentRows(tile).slice(1)).toEqual([
      [
        "Special dividend and vested dividend equivalents paid",
        "Not supplied: the source states October 2024 only for the combined payment",
        "4,348",
        "22,967",
        "6.02x",
      ],
      [
        "Remaining securitization availability drawn",
        "Not supplied: the source states October 2024 only",
        "0",
        "22,967",
        "6.02x",
      ],
    ]);
    // One reported ratio and two pro forma marks: drawn, the reported mark first.
    const strip = within(tile).getByRole("img", { name: /Net debt \/ EBITDA/ });
    expect(marks(tile).map((mark) => attr(mark, "data-value"))).toEqual([4.88, 6.02, 6.02]);
    expect(strip.querySelectorAll("line[data-join]")).toHaveLength(0);
    const well = within(tile).getByRole("group", { name: "Liquidity" });
    expect(well.textContent).not.toContain("revolver");
    expect([...well.querySelectorAll("[data-liquidity]")].map((r) => r.textContent)).toEqual([
      "FY2024cash 6,261 · undrawn committed facilities 1,006",
    ]);
    noAnalysis(tile);
  });

  it("lists the distressed handoff's two adjustments in its own order", () => {
    const tile = draw(distressedCp1Entry());
    expect(
      adjustmentRows(tile)
        .slice(1)
        .map(([event]) => event),
    ).toEqual([
      "Remaining securitization availability drawn",
      "Special dividend and vested dividend equivalents paid",
    ]);
    noAnalysis(tile);
  });

  it("with one stated ratio and no adjustment writes the figure instead of a strip", () => {
    const tile = draw(
      withRows(dropTable(relativeValueCp1Entry(), ADJUSTMENTS), ADJUSTMENTS, [
        [NO_ADJUSTMENT, "—", "—", "—", "—", "US$m", "Synthetic."],
      ]),
    );
    expect(within(tile).queryByRole("img", { name: /Net debt \/ EBITDA/ })).toBeNull();
    expect(within(tile).getByRole("list", { name: /Net debt \/ EBITDA/ }).textContent).toBe(
      "FY20244.88x",
    );
  });

  it("draws the three-period mutation's FY2022 as the hatched gap with its reason, in place", () => {
    const tile = draw(threePeriodCp1());
    expect(tile.textContent).toContain("Net debt, $m · FY2022 → FY2023 → FY2024");
    const row = tile.querySelector('[data-row="FY2022"]');
    expect(row?.querySelector("rect[data-bar]")).toBeNull();
    expect(row?.querySelector("[data-gap]")?.getAttribute("data-gap")).toBe(
      "Not supplied: outside the comparison scope",
    );
    expect(readings(tile)[0]).toBe("Not supplied: outside the comparison scope");
    // The leverage strip keeps FY2022 in its place as the hatched slot with the same words.
    const stripGap = tile.querySelector('[data-strip] [data-row="FY2022"] [data-gap]');
    expect(stripGap?.getAttribute("data-gap")).toBe("Not supplied: outside the comparison scope");
    expect(
      marks(tile)
        .map((mark) => mark.getAttribute("data-mark"))
        .slice(0, 2),
    ).toEqual(["FY2023", "FY2024"]);
    noAnalysis(tile);
  });

  it("draws the stated figures when they do not add up, and says nothing about it", () => {
    const tile = draw(setCell(cp1Entry(), "Net debt data", 1, "Cash", "6000"));
    const fy24 = bar(tile, "FY2024");
    const perUnit = attr(fy24, "width") / 18619;
    expect(attr(tile.querySelector('[data-cash="FY2024"]'), "width") + 1).toBeCloseTo(
      6000 * perUnit,
      6,
    );
    expect(attr(tile.querySelector('[data-gross="FY2024"]'), "x1")).toBeCloseTo(
      attr(fy24, "x") + 24880 * perUnit,
      6,
    );
    expect(readings(tile)[1]).toBe("Net 18,619 · cash 6,000 · gross debt 24,880");
    noAnalysis(tile);
  });

  it("draws a stated net cash position leftward from zero, its reading from the plot's start", () => {
    const tile = draw(
      setCell(
        setCell(cp1Entry(), "Net debt data", 1, "Net debt", "-500"),
        "Net debt data",
        1,
        "Cash",
        "25380",
      ),
    );
    const fy24 = bar(tile, "FY2024");
    const fy23 = bar(tile, "FY2023");
    // FY2023 starts at zero; FY2024's bar ends there, drawn to the left.
    expect(attr(fy24, "x") + attr(fy24, "width")).toBeCloseTo(attr(fy23, "x"), 6);
    const perUnit = attr(fy23, "width") / 16278;
    expect(attr(fy24, "width")).toBeCloseTo(500 * perUnit, 6);
    // Cash beyond a negative net debt is not drawn as a segment; the stated figures are written.
    expect(tile.querySelector('[data-cash="FY2024"]')).toBeNull();
    expect(readings(tile)[1]).toBe("Net −500 · cash 25,380 · gross debt 24,880");
    const starts = [...tile.querySelectorAll("[data-part=reading]")].map((r) =>
      r.getAttribute("x"),
    );
    expect(new Set(starts).size).toBe(1);
    noAnalysis(tile);
  });

  it("states the contract's none row in the module's own words, as a plain line", () => {
    const tile = draw(
      withRows(cp1Entry(), ADJUSTMENTS, [
        [
          NO_ADJUSTMENT,
          "—",
          "—",
          "—",
          "—",
          "US$m",
          "Synthetic; the annual report and its notes were read.",
        ],
      ]),
    );
    expect(tile.querySelector("[data-adjustments]")).toBeNull();
    expect(tile.querySelector("[data-pro-forma]")).toBeNull();
    expect(tile.querySelector("[data-no-adjustments]")?.textContent).toBe(
      "None found in the sources read. Synthetic.",
    );
  });

  it("is the gap tile with the true reason when the net debt table is absent", () => {
    const tile = draw(dropTable(cp1Entry(), "Net debt data"));
    expect(within(tile).queryByRole("img")).toBeNull();
    expect(within(tile).queryByRole("link")).toBeNull();
    expect(tile.textContent).toContain("This page could not read net debt data.");
  });
});

// The ruling of 2026-11-25: every supplied period, oldest fiscal year → latest fiscal year → YTD →
// LTM → PF → forecast years; "latest" is the latest reported period. The fixture writes its rows
// scrambled; expected orders and figures are written by hand from the fixture's cells.
describe("Net debt: five scrambled periods in the one period order", () => {
  const ORDER = ["FY2023", "FY2024", "LTM Jun-2025", "PF FY2024", "FY2025E"];

  it("draws the bars and the leverage marks in rule order, each figure its own", () => {
    const tile = draw(mixedPeriodsCp1());
    expect(tile.textContent).toContain(
      "Net debt, $m · FY2023 → FY2024 → LTM Jun-2025 → PF FY2024 → FY2025E",
    );
    const bars = [...tile.querySelectorAll("svg:not([data-strip]) rect[data-bar]")];
    expect(bars.map((node) => node.getAttribute("data-bar"))).toEqual(ORDER);
    expect(bars.map((node) => attr(node, "data-value"))).toEqual([
      16278, 18619, 22850, 22967, 23100,
    ]);
    const ratios = marks(tile).slice(0, 5);
    expect(ratios.map((mark) => mark.getAttribute("data-mark"))).toEqual(ORDER);
    expect(ratios.map((mark) => attr(mark, "data-value"))).toEqual([5.17, 4.88, 4.8, 6.02, 4.6]);
    expect(tile.textContent).not.toMatch(/time order/);
  });

  it("the current bar and mark are the latest reported period, never the pro forma or forecast", () => {
    const view = netDebtView(mixedPeriodsCp1());
    if (!view) throw new Error("expected a view");
    expect(barsLayout(view, [], 600).bars.map((bar) => [bar.label, bar.kind])).toEqual([
      ["FY2023", "prior"],
      ["FY2024", "prior"],
      ["LTM Jun-2025", "current"],
      ["PF FY2024", "prior"],
      ["FY2025E", "prior"],
    ]);
    const strip = stripLayout(stripEntries(view), 600);
    expect(strip.rows.slice(0, 5).map((row) => [row.entry.label, row.tone])).toEqual([
      ["FY2023", "prior"],
      ["FY2024", "prior"],
      ["LTM Jun-2025", "current"],
      ["PF FY2024", "prior"],
      ["FY2025E", "prior"],
    ]);
    // The hairline down the adjustment rows stands at the latest reported ratio, 4.80x.
    expect(strip.reference?.x).toBe(strip.x(4.8));
    const tile = draw(mixedPeriodsCp1());
    expect(tile.textContent).toContain(
      "FY2023, FY2024, PF FY2024, FY2025E net debtLTM Jun-2025 net debt",
    );
  });

  it("only pro forma and forecast rows: every row drawn, none marked as the current period", () => {
    const entry = withRows(cp1Entry(), "Net debt data", [
      ["FY2025E", "25100", "2000", "23100", "US$m", "-"],
      ["PF FY2024", "24880", "1913", "22967", "US$m", "-"],
    ]);
    const view = netDebtView(entry);
    if (!view) throw new Error("expected a view");
    expect(barsLayout(view, [], 600).bars.map((bar) => [bar.label, bar.kind])).toEqual([
      ["PF FY2024", "prior"],
      ["FY2025E", "prior"],
    ]);
    expect(view.comparison).toBeNull();
  });
});

describe("NetDebtTile: units and sources of stated words", () => {
  it("does not draw a liquidity total in another unit as a figure of the US$m tile", () => {
    // Mutation of the retained TransDigm CP-1 (not a real handoff): the metrics row in USD thousands.
    const entry = edited(cp1Entry(), (table, heading) =>
      heading !== "Financials and credit metrics"
        ? table
        : {
            ...table,
            rows: table.rows.map((row) => {
              if (row.cells[0] !== "Cash plus available revolver") return row;
              const cells = [...row.cells];
              cells[table.headers.indexOf("FY2024")] = "7104000";
              cells[table.headers.indexOf("Unit")] = "USD thousands";
              return { ...row, cells };
            }),
          },
    );
    render(<NetDebtTile lead={leadProps(entry)} />);
    const tile = screen.getByRole("region", { name: "Net debt" });
    const text = tile.querySelector('[data-liquidity="FY2024"]')?.textContent ?? "";
    expect(text).toContain("6,261");
    expect(text).not.toContain("7,104,000");
    expect(tile.querySelector("[data-liquidity-unit]")?.textContent).toMatch(
      /another unit \(.*thousand.*\) than the net debt data/i,
    );
  });

  it("drops a no-adjustment clause that cites a filing, as the maturity tile does", () => {
    const basis =
      "Annual Form 10-K subsequent-events note; no later event that changes net debt is stated.";
    const na = "Not applicable: no event";
    const entry = withRows(cp1Entry(), ADJUSTMENTS, [
      [NO_ADJUSTMENT, na, na, na, na, "US$m", basis],
    ]);
    render(<NetDebtTile lead={leadProps(entry)} />);
    const words =
      screen.getByRole("region", { name: "Net debt" }).querySelector("[data-no-adjustments]")
        ?.textContent ?? "";
    expect(words).toContain("no later event that changes net debt is stated.");
    expect(words).not.toMatch(/10-K/);
  });
});
