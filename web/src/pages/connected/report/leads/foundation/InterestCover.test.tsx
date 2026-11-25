// Expected values are written out by hand from the retained TransDigm CP-1 handoffs (accepted
// FY2024, relative value draft 1: one period; outdated evidence: shape and scope only), not
// computed by the code under test. The three-period, gap, words, unordered and all-gap cases are
// mutations of the accepted handoff (fixtures/mutations.ts), not real handoffs.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { containsReference, type OutputEntry } from "../../../publishedReport";
import { cp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import { addRow, dropTable, mixedPeriodsCp1, setCell, withRows } from "../fixtures/mutations";
import { coverLayout } from "./coverGeometry";
import { interestCover } from "./foundationData";
import { InterestCoverTile } from "./InterestCover";

afterEach(cleanup);

const COVER = "Chart data: interest cover";
const RATIO = "EBITDA / cash interest";

function draw(entry: OutputEntry) {
  render(<InterestCoverTile lead={leadProps(entry)} />);
  const tile = screen.getByRole("region", { name: "Interest cover" });
  return { tile, svg: tile.querySelector("svg[role='img']") };
}

const marks = (tile: HTMLElement) =>
  [...tile.querySelectorAll("circle[data-mark]")].map((mark) => [
    mark.closest("[data-period]")?.getAttribute("data-period"),
    mark.getAttribute("data-mark"),
    Number(mark.getAttribute("data-value")),
  ]);
const parts = (tile: HTMLElement, part: string) =>
  [...tile.querySelectorAll(`[data-part="${part}"]`)].map((node) => node.textContent);
const legend = (tile: HTMLElement) =>
  [...tile.querySelectorAll("[data-legend]")].map((item) => [
    item.getAttribute("data-legend"),
    item.textContent,
  ]);

function openTable(tile: HTMLElement) {
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  return within(within(tile).getByRole("table"))
    .getAllByRole("row")
    .map((row) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent));
}

describe("interest cover: the accepted CP-1, two periods", () => {
  it("titles the tile plainly, kicker with the measure and unit, one trace control", () => {
    const { tile } = draw(cp1Entry());
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Interest cover");
    expect(tile.textContent).toContain("EBITDA / cash interest · x");
    expect(within(tile).getAllByRole("link", { name: /Source for interest cover/ })).toHaveLength(
      1,
    );
  });

  it("draws FY2023 as the ring and FY2024 as the dot, in proportion from zero, joined", () => {
    const { tile } = draw(cp1Entry());
    expect(marks(tile)).toEqual([
      ["FY2023", "prior", 2.71],
      ["FY2024", "current", 3.29],
    ]);
    const cover = interestCover(cp1Entry());
    if (!cover) throw new Error("expected a cover");
    const zero = coverLayout(cover, 600).x(0); // the test setup measures 600 px
    const [ring, dot] = [...tile.querySelectorAll("circle[data-mark]")].map(
      (mark) => Number(mark.getAttribute("cx")) - zero,
    );
    expect((dot ?? 0) / (ring ?? 1)).toBeCloseTo(3.29 / 2.71, 6);
    expect(tile.querySelectorAll('[data-part="link"]')).toHaveLength(1);
    expect(parts(tile, "value")).toEqual(["2.71x", "3.29x"]);
    expect(legend(tile)).toEqual([
      ["ring", "FY2023"],
      ["dot", "FY2024"],
    ]);
  });

  it("prints the one change by the kit rule, a year apart, better from signal.ts", () => {
    const { tile, svg } = draw(cp1Entry());
    // Hand: 3.29 − 2.71 = 0.58; coverage up is better.
    expect(parts(tile, "change")).toEqual(["FY2023 to FY2024: +0.58x, up, better"]);
    expect(svg?.getAttribute("aria-label")).toBe(
      "EBITDA / cash interest, x, by period: FY2023 2.71x, FY2024 3.29x. FY2023 to FY2024: +0.58x, up, better. Axis from 0.",
    );
  });

  it("has a table view with the module's basis words and its note, no source reference", () => {
    const { tile } = draw(cp1Entry());
    expect(openTable(tile)).toEqual([
      ["Period", "EBITDA / cash interest, x", "Basis and limitation"],
      ["FY2023", "2.71", "Reported EBITDA / net cash interest paid."],
      [
        "FY2024",
        "3.29",
        "Same identity and annual duration; cash paid is not accrued interest expense.",
      ],
    ]);
    expect(tile.textContent).toContain(
      "Coverage is historical and uses net cash interest paid rather than a forward coupon run rate.",
    );
    expect(containsReference(tile.textContent)).toBe(false);
    expect(tile.textContent).not.toMatch(/p71|p123|\.jsonl|C10|derived/i);
  });

  it("draws text at 12 px at the measured width (600 px in the test setup)", () => {
    const { svg } = draw(cp1Entry());
    expect(svg?.getAttribute("data-layout")).toBe("wide");
    expect(svg?.getAttribute("viewBox")).toMatch(/^0 0 600 /);
    for (const text of svg?.querySelectorAll("text") ?? [])
      expect(Number(text.getAttribute("font-size") ?? 12)).toBeGreaterThanOrEqual(12);
  });

  it("lays out narrow below 520 px: each label above its mark, nothing past the width", () => {
    const cover = interestCover(cp1Entry());
    if (!cover) throw new Error("expected a cover");
    const narrow = coverLayout(cover, 358);
    expect(narrow.narrow).toBe(true);
    expect(narrow.rows.every((row) => row.labelY < row.y - 6)).toBe(true);
    // Each value is written 12 px right of its mark; the widest, "3.29x", fits inside 358 px.
    expect(narrow.x(3.29) + 12 + 5 * 12 * 0.6).toBeLessThanOrEqual(358);
    const wide = coverLayout(cover, 600);
    expect(wide.rows.map((row) => row.labelY - row.y)).toEqual([4, 4]);
  });
});

describe("interest cover: other handoffs and mutations", () => {
  it("one period (relative value): the one figure as the dot, no comparison, no change", () => {
    const { tile, svg } = draw(relativeValueCp1Entry());
    expect(marks(tile)).toEqual([["FY2024", "current", 3.29]]);
    expect(tile.querySelectorAll('[data-part="link"]')).toHaveLength(0);
    expect(parts(tile, "change")).toEqual([]);
    expect(legend(tile)).toEqual([]);
    expect(svg?.getAttribute("aria-label")).toBe(
      "EBITDA / cash interest, x, by period: FY2024 3.29x. Axis from 0.",
    );
  });

  it("three periods: every period in year order, a stated gap in place with its reason, never joined across it", () => {
    let entry = addRow(cp1Entry(), COVER, ["FY2022 / 2022-09-30", "2.05", "x", "Test row."]);
    entry = setCell(entry, COVER, 0, RATIO, "Not supplied: cash interest not split");
    const { tile, svg } = draw(entry);
    expect(
      [...tile.querySelectorAll("[data-period]")].map((row) => row.getAttribute("data-period")),
    ).toEqual(["FY2022", "FY2023", "FY2024"]);
    expect(marks(tile)).toEqual([
      ["FY2022", "prior", 2.05],
      ["FY2024", "current", 3.29],
    ]);
    expect(tile.querySelector('[data-gap="Not supplied: cash interest not split"]')).not.toBeNull();
    expect(parts(tile, "reason")).toEqual(["Not supplied: cash interest not split"]);
    expect(tile.querySelectorAll('[data-part="link"]')).toHaveLength(0);
    expect(parts(tile, "change")).toEqual([]);
    expect(svg?.getAttribute("aria-label")).toContain(
      "FY2023 not stated: Not supplied: cash interest not split",
    );
    expect(legend(tile).map(([kind]) => kind)).toEqual(["ring", "dot", "hatch"]);
  });

  it("three stated periods: a line by period, joined FY2022 → FY2023 → FY2024", () => {
    const entry = addRow(cp1Entry(), COVER, ["FY2022 / 2022-09-30", "2.05", "x", "Test row."]);
    const { tile } = draw(entry);
    expect(marks(tile).map(([period, mark]) => [period, mark])).toEqual([
      ["FY2022", "prior"],
      ["FY2023", "prior"],
      ["FY2024", "current"],
    ]);
    expect(tile.querySelectorAll('[data-part="link"]')).toHaveLength(2);
    expect(parts(tile, "change")).toEqual(["FY2023 to FY2024: +0.58x, up, better"]);
  });

  it("two years apart: both figures, no change and no better/worse word", () => {
    const entry = withRows(cp1Entry(), COVER, [
      ["FY2022", "2.05", "x", "-"],
      ["FY2024", "3.29", "x", "-"],
    ]);
    const { tile } = draw(entry);
    expect(parts(tile, "value")).toEqual(["2.05x", "3.29x"]);
    expect(parts(tile, "change")).toEqual([]);
    expect(tile.textContent).not.toMatch(/better|worse/);
  });

  it("a fall is worse; a stated zero is a value at zero; words are written in place", () => {
    const fall = setCell(cp1Entry(), COVER, 1, RATIO, "2.40");
    expect(parts(draw(fall).tile, "change")).toEqual(["FY2023 to FY2024: −0.31x, down, worse"]);
    cleanup();
    const zero = setCell(cp1Entry(), COVER, 0, RATIO, "0");
    expect(marks(draw(zero).tile)[0]).toEqual(["FY2023", "prior", 0]);
    cleanup();
    const words = setCell(cp1Entry(), COVER, 0, RATIO, "n.m.");
    const { tile } = draw(words);
    expect(parts(tile, "words")).toEqual(["n.m."]);
    expect(parts(tile, "change")).toEqual([]);
  });

  // Rewritten to the ruling of 2026-11-25 (was "periods it cannot put in time order: drawn as
  // stated, not joined, and said so", on FY2024 beside YTD 2024): a year to date is placed after
  // the fiscal year; only a label the period order cannot read is drawn last and named.
  it("a year to date is placed after the fiscal year and joined; nothing is said of the order", () => {
    const entry = withRows(cp1Entry(), COVER, [
      ["YTD 2024", "3.10", "x", "-"],
      ["FY2024", "3.29", "x", "-"],
    ]);
    const { tile } = draw(entry);
    expect(marks(tile)).toEqual([
      ["FY2024", "prior", 3.29],
      ["YTD 2024", "current", 3.1],
    ]);
    expect(tile.querySelectorAll('[data-part="link"]')).toHaveLength(1);
    expect(parts(tile, "change")).toEqual([]);
    expect(tile.textContent).not.toMatch(/time order/);
  });

  it("a period it cannot place is drawn last, not joined to the others, and named once", () => {
    const entry = withRows(cp1Entry(), COVER, [
      ["Current", "3.10", "x", "-"],
      ["FY2024", "3.29", "x", "-"],
      ["FY2023", "2.71", "x", "-"],
    ]);
    const { tile, svg } = draw(entry);
    // The dot is the latest reported period, FY2024: never the label that cannot be placed.
    expect(marks(tile)).toEqual([
      ["FY2023", "prior", 2.71],
      ["FY2024", "current", 3.29],
      ["Current", "prior", 3.1],
    ]);
    // One line, FY2023 to FY2024: none runs to the period that is not placed.
    expect(tile.querySelectorAll('[data-part="link"]')).toHaveLength(1);
    expect(parts(tile, "change")).toEqual(["FY2023 to FY2024: +0.58x, up, better"]);
    expect(tile.textContent.split("Not placed in time order, shown last: Current.")).toHaveLength(
      2,
    );
    expect(svg?.getAttribute("aria-label")).toBe(
      "EBITDA / cash interest, x, by period, those not placed in time order last: " +
        "FY2023 2.71x, FY2024 3.29x, Current 3.10x. FY2023 to FY2024: +0.58x, up, better. " +
        "Axis from 0.",
    );
  });

  it("five scrambled periods: fiscal years, then LTM, PF and the forecast; the dot is the LTM", () => {
    const { tile, svg } = draw(mixedPeriodsCp1());
    expect(marks(tile)).toEqual([
      ["FY2023", "prior", 2.71],
      ["FY2024", "prior", 3.29],
      ["LTM Jun-2025", "current", 3.4],
      ["PF FY2024", "prior", 3.05],
      ["FY2025E", "prior", 3.9],
    ]);
    expect(parts(tile, "value")).toEqual(["2.71x", "3.29x", "3.40x", "3.05x", "3.90x"]);
    expect(legend(tile)).toEqual([
      ["ring", "FY2023, FY2024, PF FY2024, FY2025E"],
      ["dot", "LTM Jun-2025"],
    ]);
    // FY2024 → LTM Jun-2025 is not one kind a year apart: no change is printed, none to FY2025E.
    expect(parts(tile, "change")).toEqual([]);
    expect(svg?.getAttribute("aria-label")).toBe(
      "EBITDA / cash interest, x, by period: FY2023 2.71x, FY2024 3.29x, LTM Jun-2025 3.40x, " +
        "PF FY2024 3.05x, FY2025E 3.90x. Axis from 0.",
    );
    expect(openTable(tile).map((row) => row.slice(0, 2))).toEqual([
      ["Period", "EBITDA / cash interest, x"],
      ["FY2023", "2.71"],
      ["FY2024", "3.29"],
      ["LTM Jun-2025", "3.40"],
      ["PF FY2024", "3.05"],
      ["FY2025E", "3.90"],
    ]);
  });

  it("a forecast year after two fiscal years: the change stays FY2023 to FY2024, the dot FY2024", () => {
    const entry = withRows(cp1Entry(), COVER, [
      ["FY2025E", "3.90", "x", "-"],
      ["FY2024", "3.29", "x", "-"],
      ["FY2023", "2.71", "x", "-"],
    ]);
    const { tile } = draw(entry);
    expect(marks(tile)).toEqual([
      ["FY2023", "prior", 2.71],
      ["FY2024", "current", 3.29],
      ["FY2025E", "prior", 3.9],
    ]);
    expect(parts(tile, "change")).toEqual(["FY2023 to FY2024: +0.58x, up, better"]);
  });

  it("without the table, or all gaps: the one gap tile, the module's own reason when it states one", () => {
    render(<InterestCoverTile lead={leadProps(dropTable(cp1Entry(), COVER))} />);
    expect(screen.getByRole("region", { name: "Interest cover" }).textContent).toBe(
      "Interest coverThis page could not read interest cover.",
    );
    cleanup();
    const allGap = withRows(cp1Entry(), COVER, [
      ["FY2023", "Not supplied: source dash", "x", "-"],
      ["FY2024", "Not supplied: source dash", "x", "-"],
    ]);
    render(<InterestCoverTile lead={leadProps(allGap)} />);
    const tile = screen.getByRole("region", { name: "Interest cover" });
    expect(tile.textContent).toBe("Interest coverNot supplied: —");
    expect(tile.querySelector("svg")).toBeNull();
  });
});
