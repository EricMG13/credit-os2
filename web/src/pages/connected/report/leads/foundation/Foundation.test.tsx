// Reads the retained TransDigm CP-1 handoffs (accepted FY2024, relative value and distressed draft
// 1, earnings update draft 1; outdated evidence: shape and scope only) and mutations of them
// (`fixtures/mutations.ts`: tables dropped, a third period); a mutation is not a real handoff.
// The chart lists below are written out by hand from the fixtures' `Chart data:` sections and chart
// descriptors, not computed by the code under test.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OutputEntry } from "../../../publishedReport";
import {
  cp1Entry,
  distressedCp1Entry,
  earningsUpdateCp1Draft1Entry,
  leadProps,
  relativeValueCp1Entry,
} from "../fixtures/load";
import { addRow, dropTable, edited, threePeriodCp1 } from "../fixtures/mutations";
import { section, table } from "../../overview/rows.fixture";
import { FoundationLead } from "./Foundation";

afterEach(cleanup);

const regions = () =>
  screen.getAllByRole("region").map((region) => region.getAttribute("aria-label"));
const spans = () =>
  screen.getAllByRole("region").map((region) => /lg:col-span-(\d+)/.exec(region.className)?.[1]);

describe("the composition", () => {
  it("draws the eight tiles in rows of neighbours: 12, 7 + 5, 6 + 6, 6 + 6, then the wall across the row", () => {
    render(<FoundationLead {...leadProps(cp1Entry())} />);
    expect(regions()).toEqual([
      "Earnings and debt",
      "Cash conversion",
      "Net debt",
      "EBITDA bridge",
      "Segments",
      "Interest cover",
      "Debt stack",
      "Debt maturities",
    ]);
    // The wall is the last, unpaired figure: it takes the whole row.
    expect(spans()).toEqual(["12", "7", "5", "6", "6", "6", "6", "12"]);
  });

  it("adds the periods tile beside the wall only for three periods (or another kind, or a gap)", () => {
    render(<FoundationLead {...leadProps(threePeriodCp1())} />);
    expect(regions().slice(-2)).toEqual(["Debt maturities", "Periods"]);
    expect(spans()).toEqual(["12", "7", "5", "6", "6", "6", "6", "6", "6"]);
  });

  it("keeps every tile as tall as its content, never stretched to the tile beside it", () => {
    render(<FoundationLead {...leadProps(threePeriodCp1())} />);
    for (const name of ["Interest cover", "Debt stack", "Debt maturities", "Periods"]) {
      const tile = screen.getByRole("region", { name });
      const wrapper = tile.parentElement?.className ?? "";
      expect(wrapper, name).toMatch(/\bcontents\b/);
      expect(wrapper, name).toMatch(/lg:\[&>section\]:self-start/);
    }
  });

  it("gives every drawn figure exactly one trace control", () => {
    render(<FoundationLead {...leadProps(cp1Entry())} />);
    for (const name of ["Interest cover", "Debt stack", "EBITDA bridge"]) {
      const tile = screen.getByRole("region", { name });
      expect(within(tile).getAllByRole("link", { name: /Source for/ }), name).toHaveLength(1);
    }
  });

  it("lists the figures it draws itself, so the frame does not draw the typed figures again", () => {
    expect(FoundationLead.draws).toEqual(["figures"]);
  });
});

describe("gaps", () => {
  it("draws one plain gap for an absent figure, in that figure's place", () => {
    render(<FoundationLead {...leadProps(dropTable(cp1Entry(), "Segment schedule"))} />);
    expect(regions()).toHaveLength(8);
    const segments = screen.getByRole("region", { name: "Segments" });
    expect(segments.textContent).toBe("SegmentsThis page could not read the segment schedule.");
    expect(segments.className).not.toMatch(/gap-hatch/);
  });

  it("draws the interest cover and debt stack gaps in their places", () => {
    let entry = dropTable(cp1Entry(), "Chart data: interest cover");
    entry = dropTable(entry, "Chart data: debt stack");
    render(<FoundationLead {...leadProps(entry)} />);
    expect(screen.getByRole("region", { name: "Interest cover" }).textContent).toBe(
      "Interest coverThis page could not read interest cover.",
    );
    expect(screen.getByRole("region", { name: "Debt stack" }).textContent).toBe(
      "Debt stackThis page could not read the debt stack.",
    );
  });

  it("draws a single gap, not eight, when the handoff carries no figure at all", () => {
    render(<FoundationLead {...leadProps(edited(cp1Entry(), () => null))} />);
    expect(regions()).toEqual(["Financial foundation"]);
    expect(screen.getByRole("region").textContent).toBe(
      "Financial foundationThis page could not read a figure of the financial foundation.",
    );
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("draws nothing for a blocked or unreadable module: the frame states it in the header", () => {
    const entry = cp1Entry();
    const props = leadProps({ ...entry, output: { ...entry.output, parseError: "unreadable" } });
    const { container } = render(<FoundationLead {...props} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// Every chart the store publishes for Financial foundation (its `Chart data:` sections, and the
// descriptor titles the library writes for them) must be drawn by this lead once the frame defers
// to it ("figures"). Hand-written: each fixture's charts and the tile that draws each.
const SEVEN = [
  "Leverage",
  "Interest cover",
  "Liquidity",
  "Debt maturities",
  "Revenue and EBITDA",
  "Debt stack",
  "EBITDA bridge",
];
const FIXTURES: [string, () => OutputEntry, string[]][] = [
  ["accepted", cp1Entry, SEVEN],
  ["relative value", relativeValueCp1Entry, SEVEN],
  ["distressed", distressedCp1Entry, SEVEN],
  ["earnings update draft 1", earningsUpdateCp1Draft1Entry, SEVEN],
  ["three-period mutation", threePeriodCp1, SEVEN],
];
/** The tile that draws each chart, and a figure the tile must show from that chart's table. */
const DRAWN_BY: Record<string, { tile: string; shows: RegExp }> = {
  Leverage: { tile: "Earnings and debt", shows: /6\.53/ },
  "Interest cover": { tile: "Interest cover", shows: /3\.29x/ },
  Liquidity: { tile: "Net debt", shows: /6,261/ },
  "Debt maturities": { tile: "Debt maturities", shows: /\d/ },
  "Revenue and EBITDA": { tile: "Earnings and debt", shows: /7,940/ },
  // The 2028 secured notes: 2,100 principal; 2,077 carrying value in the distressed draft.
  "Debt stack": { tile: "Debt stack", shows: /2028 secured notes[^]*2,(100|077)/i },
  "EBITDA bridge": { tile: "EBITDA bridge", shows: /4,173/ },
};

const chartTitles = (entry: OutputEntry) =>
  entry.sections
    .filter((section) => section.heading.startsWith("Chart data: "))
    .map((section) => section.heading.slice("Chart data: ".length))
    .map((title) => title.charAt(0).toUpperCase() + title.slice(1));
const descriptorTitles = (entry: OutputEntry) =>
  (entry.output.charts as { title: string }[] | undefined)?.map((chart) => chart.title) ?? [];

describe("every published chart of Financial foundation is drawn by the lead", () => {
  it("lists a published chart no tile draws as its stated rows, after the tiles (mutation)", () => {
    const base = cp1Entry();
    const entry: OutputEntry = {
      ...base,
      sections: [
        ...base.sections,
        section(
          "Chart data: add-back share",
          900,
          table(
            901,
            ["Period", "Add-back share", "Reporting unit", "Basis and limitation"],
            [["FY2024", "8.6", "%", "Test row."]],
          ),
        ),
      ],
    };
    render(<FoundationLead {...leadProps(entry)} />);
    expect(regions().slice(-2)).toEqual(["Debt maturities", "Add-back share"]);
    const tile = screen.getByRole("region", { name: "Add-back share" });
    expect(tile.querySelector('[data-cell="Add-back share"]')?.textContent).toBe("8.6");
  });

  for (const [name, make, expected] of FIXTURES)
    it(`${name}: ${String(expected.length)} charts, each in its tile with its figures`, () => {
      const entry = make();
      expect(chartTitles(entry)).toEqual(expected);
      expect(descriptorTitles(entry)).toEqual(expected);
      render(<FoundationLead {...leadProps(entry)} />);
      // Nothing is left to the stated-rows fallback: every chart is in one of the lead's own tiles.
      expect(regions()).toHaveLength(name === "three-period mutation" ? 9 : 8);
      for (const title of expected) {
        const drawn = DRAWN_BY[title];
        expect(drawn, title).toBeDefined();
        if (!drawn) continue;
        const tile = screen.getByRole("region", { name: drawn.tile });
        const reading = [...tile.querySelectorAll("svg[role='img']")]
          .map((svg) => svg.getAttribute("aria-label") ?? "")
          .join(" ");
        expect(tile.querySelector("svg[role='img']"), `${name}: ${title}`).not.toBeNull();
        expect(`${tile.textContent} ${reading}`, `${name}: ${title}`).toMatch(drawn.shows);
      }
    });
});

// Coordinator input T3 (mutations of the accepted handoff): a real-looking "FY2024 pro forma" row
// the kit cannot put in time order beside FY2024. Every stated figure is drawn with its period as
// written, in the handoff's order: no line, no change, no better/worse, the sentence once per tile.
const UNORDERED = "Periods are in the order stated; this page could not put them in time order.";
const proFormaLeverage = () =>
  addRow(cp1Entry(), "Chart data: leverage", [
    "FY2024 pro forma",
    "7.10",
    "6.02",
    "x",
    "Test row.",
  ]);
const proFormaNetDebt = () =>
  addRow(cp1Entry(), "Net debt data", [
    "FY2024 pro forma",
    "24880",
    "1913",
    "22967",
    "US$m",
    "Test row.",
  ]);

/** Everything a reader gets from a tile: its text and every SVG's aria-label. */
const said = (tile: HTMLElement) =>
  [
    tile.textContent,
    ...[...tile.querySelectorAll("svg[role='img'], [aria-label]")].map(
      (node) => node.getAttribute("aria-label") ?? "",
    ),
  ].join(" ");
const count = (text: string, part: string) => text.split(part).length - 1;

describe("periods the kit cannot put in time order (mutations)", () => {
  it("leverage with FY2024 pro forma: 6.27, 6.53 and 7.10 written with their periods, no slope, no change", () => {
    render(<FoundationLead {...leadProps(proFormaLeverage())} />);
    const tile = screen.getByRole("region", { name: "Earnings and debt" });
    const leverage = tile.querySelector("[data-leverage]") as HTMLElement;
    const list = within(leverage).getByRole("list");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["FY20236.27x", "FY20246.53x", "FY2024 pro forma7.10x"]);
    expect(tile.querySelector("[data-change]")).toBeNull();
    expect(tile.querySelectorAll("[data-segment]")).toHaveLength(0);
    expect(said(tile)).not.toMatch(/better|worse|This page could not read total debt/);
    expect(count(tile.textContent, UNORDERED)).toBe(1);
  });

  it("leverage with FY2024 pro forma: the net debt strip writes 5.17, 4.88 and 6.02, not joined", () => {
    render(<FoundationLead {...leadProps(proFormaLeverage())} />);
    const tile = screen.getByRole("region", { name: "Net debt" });
    const strip = tile.querySelector("svg[data-strip]");
    expect(strip?.getAttribute("aria-label")).toContain(
      "FY2023 5.17x, FY2024 4.88x, FY2024 pro forma 6.02x",
    );
    expect(tile.querySelectorAll("[data-join]")).toHaveLength(0);
    expect(said(tile)).not.toMatch(/not stated|better|worse/);
    expect(count(tile.textContent, UNORDERED)).toBe(1);
  });

  it("net debt data with FY2024 pro forma: the tile draws all three periods, 22,967 among them", () => {
    render(<FoundationLead {...leadProps(proFormaNetDebt())} />);
    const tile = screen.getByRole("region", { name: "Net debt" });
    expect(tile.textContent).not.toMatch(/This page could not read/);
    const bars = tile.querySelector("svg[role='img']")?.getAttribute("aria-label") ?? "";
    expect(bars).toMatch(/FY2023[^;]*16,278/);
    expect(bars).toMatch(/FY2024[^;]*18,619/);
    expect(bars).toMatch(/FY2024 pro forma[^;]*22,967/);
    expect(tile.querySelectorAll("[data-join]")).toHaveLength(0);
    expect(said(tile)).not.toMatch(/better|worse/);
    expect(count(tile.textContent, UNORDERED)).toBe(1);
    // The earnings tile draws its gross debt in all three periods as written, with no change.
    const earnings = screen.getByRole("region", { name: "Earnings and debt" });
    expect(said(earnings)).toMatch(/Gross debt[^;]*FY2024 pro forma 24,880/);
    expect(earnings.querySelector("[data-change]")).toBeNull();
    expect(count(earnings.textContent, UNORDERED)).toBe(1);
  });

  it("the periods tile says the sentence once, exactly as the kit writes it", () => {
    render(<FoundationLead {...leadProps(proFormaLeverage())} />);
    const tile = screen.getByRole("region", { name: "Periods" });
    expect(count(tile.textContent, UNORDERED)).toBe(1);
    expect(tile.textContent).not.toMatch(/because Periods/);
  });

  it("no text or aria-label of the lead has a doubled full stop, on any fixture or mutation", () => {
    for (const make of [
      cp1Entry,
      relativeValueCp1Entry,
      distressedCp1Entry,
      earningsUpdateCp1Draft1Entry,
      threePeriodCp1,
      proFormaLeverage,
      proFormaNetDebt,
    ]) {
      const { container, unmount } = render(<FoundationLead {...leadProps(make())} />);
      for (const region of within(container).getAllByRole("region"))
        expect(said(region), region.getAttribute("aria-label") ?? "").not.toMatch(/\.\./);
      unmount();
    }
  });
});
