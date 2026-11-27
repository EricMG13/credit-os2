// Expected values are written out by hand from the retained TransDigm CP-1 handoffs
// (tests/fixtures/live_2026_11_15/: earnings_update-CP-1-draft3-accepted.md, relative_value-CP-1-draft1.md,
// distressed-CP-1-draft1.md), not computed by the code under test. The handoffs are outdated
// evidence (FY2024): shape and scope only. The three-period, LTM and edited entries
// (fixtures/mutations.ts) are test inputs, not real handoffs.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { OutputEntry } from "../../../publishedReport";
import { containsReference } from "../../../publishedReport";
import { cp1Entry, distressedCp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import {
  dropTable,
  edited,
  ltmCp1,
  mixedPeriodsCp1,
  setCell,
  setLabelled,
  threePeriodCp1,
} from "../fixtures/mutations";
import { Dumbbell } from "../kit/marks";
import { EarningsDebtTile } from "./EarningsDebt";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const LEVERAGE = "Chart data: leverage";

function draw(entry: OutputEntry = cp1Entry()) {
  render(<EarningsDebtTile lead={leadProps(entry)} />);
  return screen.getByRole("region", { name: "Earnings and debt" });
}

/** Every word the tile shows or reads out: its text and every aria-label in it. */
function everything(tile: HTMLElement) {
  const labels = [...tile.querySelectorAll("[aria-label]")].map(
    (node) => node.getAttribute("aria-label") ?? "",
  );
  return [tile.textContent, ...labels].join(" ");
}

function noAnalysis(tile: HTMLElement) {
  const text = everything(tile);
  expect(text).not.toMatch(/÷|deriv|growth|%/i);
  expect(text).not.toMatch(/\b(rose|fell)\b/);
  expect(text).not.toMatch(/ while /);
  expect(containsReference(text)).toBe(false);
}

const attr = (node: Element, name: string) => Number(node.getAttribute(name));

/** An SVG text's wrapped lines read as one: its tspans joined with a space. */
const lines = (node: Element) => {
  const spans = [...node.querySelectorAll("tspan")];
  return spans.length ? spans.map((span) => span.textContent).join(" ") : node.textContent;
};
const reasonsOf = (tile: HTMLElement) =>
  [...tile.querySelectorAll("[data-part=reason]")].map(lines);

/** Centres of the stated figures' marks, keyed by figure. */
function marksOf(tile: HTMLElement) {
  return [...tile.querySelectorAll("[data-prior], [data-current]")].map((node) => ({
    value: attr(node, node.hasAttribute("data-prior") ? "data-prior" : "data-current"),
    cx: attr(node, "cx"),
  }));
}

describe("Earnings and debt: the accepted handoff, FY2023 and FY2024", () => {
  it("titles the tile plainly and names the unit and periods in the kicker", () => {
    const tile = draw();
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Earnings and debt");
    expect(tile.textContent).toContain("Earnings against debt and leverage · $m, FY2023 → FY2024");
  });

  it("draws each measure as a ring and a dot on one scale from zero, positions proportional", () => {
    const tile = draw();
    const rows = [...tile.querySelectorAll("[data-row]")].map((g) => g.getAttribute("data-row"));
    expect(rows).toEqual(["Revenue", "EBITDA (Reported)", "Adjusted EBITDA", "Gross debt"]);
    const marks = marksOf(tile);
    expect(marks.map((mark) => mark.value).sort((a, b) => a - b)).toEqual([
      3148, 3395, 3813, 4173, 6585, 7940, 19750, 24880,
    ]);
    // One linear scale: the pixel distance per US$m is the same for every pair of marks.
    const [low, high] = [marks.find((m) => m.value === 3148), marks.find((m) => m.value === 24880)];
    if (!low || !high) throw new Error("marks missing");
    const perUnit = (high.cx - low.cx) / (24880 - 3148);
    for (const mark of marks)
      expect(mark.cx - low.cx).toBeCloseTo((mark.value - 3148) * perUnit, 6);
    // From zero: the zero tick is where the scale puts 0.
    const zero = low.cx - 3148 * perUnit;
    const tick = [...tile.querySelectorAll("[data-part=tick]")].find((t) => t.textContent === "0");
    expect(Number(tick?.getAttribute("x"))).toBeCloseTo(zero, 6);
  });

  it("draws earnings blue and gross debt plum, with debt's own legend entry", () => {
    const tile = draw();
    const current = (label: string) =>
      tile.querySelector(`[data-row="${label}"] [data-current]`)?.getAttribute("class");
    expect(current("Revenue")).toContain("fill-chart-1");
    expect(current("EBITDA (Reported)")).toContain("fill-chart-1");
    expect(current("Adjusted EBITDA")).toContain("fill-chart-1");
    expect(current("Gross debt")).toContain("fill-chart-2");
    expect(tile.textContent).toContain("FY2023");
    expect(tile.textContent).toContain("FY2024 earnings");
    expect(tile.textContent).toContain("FY2024 gross debt");
  });

  it("writes only the exact change of each stated measure, with better or worse from the owner's table", () => {
    const tile = draw();
    const changes = [...tile.querySelectorAll("[data-part=change]")].map((t) => t.textContent);
    expect(changes).toEqual(["+1,355", "+665", "+778", "+5,130"]);
    const notes = [...tile.querySelectorAll("[data-part=note]")].map((t) => t.textContent);
    // Reported EBITDA is not in the owner's table: direction only.
    expect(notes).toEqual(["up, better", "up", "up, better", "up, worse"]);
  });

  it("draws total debt / EBITDA with the overview Slope, the stated change and the owner's worse", () => {
    const tile = draw();
    const lev = tile.querySelector("[data-leverage]") as HTMLElement;
    const slope = within(lev).getByRole("img");
    expect(slope.getAttribute("aria-label")).toBe(
      "Total debt / EBITDA on its own scale: FY2023 6.27x, FY2024 6.53x, +0.26x, worse.",
    );
    expect(slope.textContent).toContain("6.27x");
    expect(slope.textContent).toContain("6.53x");
    // The Slope's last segment and dot take the signal colour for a worse move.
    expect(slope.querySelector(".stroke-worse-mark")).not.toBeNull();
    expect(lev.querySelector("[data-change]")?.textContent).toBe("+0.26x · worse");
    expect(lev.querySelector("[data-tone]")?.getAttribute("data-tone")).toBe("worse");
    expect(lev.querySelector("[data-change] [data-tone]")).toHaveClass("text-worse-mark");
    expect(tile.textContent).toContain("Leverage, worse");
  });

  it("prints the basis line from the leverage table's own cell, without the page citation", () => {
    const tile = draw();
    expect(tile.querySelector("[data-basis]")?.textContent).toBe(
      "Carrying debt; reported EBITDA; dividend-only pro forma 6.02x after 2024-10-18.",
    );
  });

  it("prints no ratio, growth, sum, equation or movement sentence anywhere", () => {
    noAnalysis(draw());
  });

  it("has one trace control and the table view behind a button in the tile head", () => {
    const tile = draw();
    expect(within(tile).getAllByRole("link", { name: /Source for/ })).toHaveLength(1);
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const table = within(tile).getByRole("table");
    const rows = within(table)
      .getAllByRole("row")
      .map((row) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent));
    expect(rows).toEqual([
      ["Measure", "FY2023", "FY2024", "Change, FY2023 → FY2024"],
      ["Revenue", "6,585", "7,940", "+1,355, up, better"],
      ["EBITDA (Reported)", "3,148", "3,813", "+665, up"],
      ["Adjusted EBITDA", "3,395", "4,173", "+778, up, better"],
      ["Gross debt", "19,750", "24,880", "+5,130, up, worse"],
      ["Total debt / EBITDA", "6.27x", "6.53x", "+0.26x, worse"],
    ]);
  });
});

describe("Earnings and debt: other real handoffs", () => {
  it("draws the relative value handoff's one period as one bar per measure, no comparison", () => {
    const tile = draw(relativeValueCp1Entry());
    expect(tile.textContent).toContain("$m, FY2024");
    expect(tile.querySelectorAll("[data-prior], [data-current]")).toHaveLength(0);
    const bars = [...tile.querySelectorAll("rect[data-bar]")].map((bar) => ({
      label: bar.getAttribute("data-bar"),
      value: attr(bar, "data-value"),
      width: attr(bar, "width"),
      series: bar.getAttribute("data-series"),
    }));
    expect(bars.map(({ label, value, series }) => [label, value, series])).toEqual([
      ["Revenue", 7940, "primary"],
      ["EBITDA (Reported)", 3813, "primary"],
      ["Adjusted EBITDA", 4173, "primary"],
      ["Gross debt", 24880, "secondary"],
    ]);
    // Widths from zero, proportional to the stated figures.
    const perUnit = (bars[3]?.width ?? 0) / 24880;
    for (const bar of bars) expect(bar.width).toBeCloseTo(bar.value * perUnit, 6);
    expect(tile.querySelectorAll("[data-part=change]")).toHaveLength(0);
    const lev = tile.querySelector("[data-leverage]") as HTMLElement;
    // One stated ratio is written, not drawn as a slope; no change, no better or worse.
    expect(within(lev).queryByRole("img")).toBeNull();
    expect(lev.textContent).toContain("FY2024");
    expect(lev.textContent).toContain("6.53x");
    expect(lev.querySelector("[data-change]")).toBeNull();
    expect(lev.textContent).not.toMatch(/worse|better/);
    expect(tile.querySelector("[data-basis]")?.textContent).toBe(
      "Carrying debt and reported EBITDA, not EBITDA As Defined; Before October payments and draw; subsequent-event table keeps adjustments separate.",
    );
    noAnalysis(tile);
  });

  it("reads the distressed handoff's basis without its calculation id or pages", () => {
    const tile = draw(distressedCp1Entry());
    expect(tile.querySelector("[data-basis]")?.textContent).toBe(
      "Carrying-value debt divided by issuer unadjusted EBITDA 3813 US$m; October distribution excluded.",
    );
    expect(tile.querySelector("[data-change]")?.textContent).toBe("+0.26x · worse");
    noAnalysis(tile);
  });
});

describe("Earnings and debt: three or more periods, gaps and absences", () => {
  it("draws a line per measure across all three periods, the FY2022 gap hatched in place with its reason", () => {
    const tile = draw(threePeriodCp1());
    expect(tile.textContent).toContain("$m, FY2022 → FY2024");
    const panels = [...tile.querySelectorAll("[data-panel]")].map((p) =>
      p.getAttribute("data-panel"),
    );
    expect(panels).toEqual(["Revenue", "EBITDA (Reported)", "Adjusted EBITDA", "Gross debt"]);
    const points = (panel: string) =>
      [...tile.querySelectorAll(`[data-panel="${panel}"] [data-point]`)].map((p) =>
        attr(p, "data-value"),
      );
    expect(points("Revenue")).toEqual([6585, 7940]);
    expect(points("EBITDA (Reported)")).toEqual([2646, 3148, 3813]);
    expect(points("Adjusted EBITDA")).toEqual([2646, 3395, 4173]);
    expect(points("Gross debt")).toEqual([19750, 24880]);
    // A line joins only adjacent stated periods: none runs across FY2022 where it is a gap.
    const segments = (panel: string) =>
      tile.querySelectorAll(`[data-panel="${panel}"] [data-segment]`).length;
    expect([
      segments("Revenue"),
      segments("EBITDA (Reported)"),
      segments("Adjusted EBITDA"),
      segments("Gross debt"),
    ]).toEqual([1, 2, 2, 1]);
    const gap = (at: string) =>
      tile.querySelector(`[data-gap-point="${at}"] [data-gap]`)?.getAttribute("data-gap");
    expect(gap("Revenue FY2022")).toBe("FY2022: Not supplied: outside the comparison scope");
    expect(gap("Gross debt FY2022")).toBe("FY2022: Not supplied: outside the comparison scope");
    expect(gap("EBITDA (Reported) FY2022")).toBeUndefined();
    expect(reasonsOf(tile)).toEqual([
      "FY2022: Not supplied: outside the comparison scope",
      "FY2022: Not supplied: outside the comparison scope",
    ]);
    // Leverage: FY2022 is a stated gap, written with its reason; the slope joins FY2023 and FY2024.
    const lev = tile.querySelector("[data-leverage]") as HTMLElement;
    expect(lev.querySelector("[data-gap-reason]")?.textContent).toBe(
      "FY2022: Not supplied: outside the comparison scope",
    );
    expect(lev.querySelector("[data-change]")?.textContent).toBe(
      "+0.26x · worse · FY2023 → FY2024",
    );
    noAnalysis(tile);
  });

  it("draws an LTM row beside the annual periods, the measure it lacks hatched as not stated", () => {
    const tile = draw(ltmCp1());
    const sales = [...tile.querySelectorAll('[data-panel="Revenue"] [data-point]')].map((p) =>
      attr(p, "data-value"),
    );
    expect(sales).toEqual([6585, 7940, 8000]);
    expect(
      tile
        .querySelector('[data-gap-point="EBITDA (Reported) LTM Dec-2024"] [data-gap]')
        ?.getAttribute("data-gap"),
    ).toBe("LTM Dec-2024: not read");
    expect(reasonsOf(tile)).toEqual(["LTM Dec-2024: not read", "LTM Dec-2024: not read"]);
    expect(tile.textContent).not.toContain("not stated in this table");
    noAnalysis(tile);
  });

  it("keeps a stated gap a gap: the hatched strip and its reason, no change", () => {
    const tile = draw(
      setCell(cp1Entry(), "Net debt data", 1, "Gross debt", "Not supplied: not extracted"),
    );
    const debt = tile.querySelector('[data-row="Gross debt"]');
    expect(debt?.querySelector("[data-current]")).toBeNull();
    expect(debt?.querySelector("[data-gap]")?.getAttribute("data-gap")).toBe(
      "FY2024: Not supplied: not extracted",
    );
    // The dumbbell writes a wrapped reason one line per text.
    expect(reasonsOf(tile).join(" ")).toBe("FY2024: Not supplied: not extracted");
    const changes = [...tile.querySelectorAll("[data-part=change]")].map((t) => t.textContent);
    expect(changes).toEqual(["+1,355", "+665", "+778"]);
  });

  it("omits the basis line when the leverage table states none, and screens a cited one", () => {
    expect(
      draw(setCell(cp1Entry(), LEVERAGE, 1, "Basis and limitation", "")).querySelector(
        "[data-basis]",
      ),
    ).toBeNull();
    cleanup();
    expect(
      draw(setCell(cp1Entry(), LEVERAGE, 1, "Basis and limitation", "Annual p120.")).querySelector(
        "[data-basis]",
      )?.textContent,
    ).toBe("Detail is in Evidence.");
  });

  it("names a measure the handoff does not carry, and draws the rest", () => {
    const tile = draw(dropTable(cp1Entry(), "Net debt data"));
    expect(tile.querySelector('[data-row="Gross debt"]')).toBeNull();
    expect(tile.querySelector("[data-absent]")?.textContent).toBe(
      "This page could not read gross debt.",
    );
    expect(tile.textContent).not.toContain("FY2024 gross debt");
  });

  it("is the gap tile with the true reason when no measure table is readable", () => {
    let none = cp1Entry();
    for (const heading of [
      "Chart data: revenue and EBITDA",
      "Net debt data",
      "T4.4 Income statement",
    ])
      none = dropTable(none, heading);
    const tile = draw(none);
    expect(within(tile).queryByRole("img")).toBeNull();
    expect(within(tile).queryByRole("link")).toBeNull();
    expect(tile.textContent).toContain("This page could not read revenue.");
    expect(tile.textContent).toContain("This page could not read gross debt.");
  });

  it("says an identical gap sentence once when several measures are absent for the same reason", () => {
    let none = cp1Entry();
    for (const heading of [
      "Chart data: revenue and EBITDA",
      "Net debt data",
      "T4.4 Income statement",
    ])
      none = dropTable(none, heading);
    const text = draw(none).textContent;
    const sentences = text.match(/This page could not read [^.]*\./g) ?? [];
    expect(sentences.length).toBeGreaterThan(0);
    expect(new Set(sentences).size).toBe(sentences.length);
    // Revenue and Adjusted EBITDA are both read from the one revenue-and-EBITDA table.
    expect(text.split("could not read the revenue and EBITDA").length - 1).toBeLessThanOrEqual(1);
  });

  it("says each absent-measure sentence once beside the measures that are drawn", () => {
    let some = dropTable(cp1Entry(), "Chart data: revenue and EBITDA");
    some = dropTable(some, "T4.4 Income statement");
    const tile = draw(some);
    const note = tile.querySelector("[data-absent]")?.textContent ?? "";
    const sentences = note.match(/This page could not read [^.]*\./g) ?? [];
    expect(sentences.length).toBeGreaterThan(0);
    expect(new Set(sentences).size).toBe(sentences.length);
  });
});

describe("Dumbbell series (the one kit extension)", () => {
  const periods = { prior: "FY2023", current: "FY2024" };
  const pair = { prior: { value: 1, text: "1" }, current: { value: 2, text: "2" } };
  it("draws a secondary row's current dot plum and marks it; a plain row stays blue and unmarked", () => {
    render(
      <Dumbbell
        width={640}
        unit="US$m"
        periods={periods}
        rows={[
          { label: "A", ...pair },
          { label: "B", ...pair, series: "secondary" },
          { label: "C", ...pair, series: "primary" },
        ]}
      />,
    );
    const dot = (label: string) => document.querySelector(`[data-row="${label}"] [data-current]`);
    expect(dot("A")?.getAttribute("class")).toContain("fill-chart-1");
    expect(dot("A")?.hasAttribute("data-series")).toBe(false);
    expect(dot("B")?.getAttribute("class")).toContain("fill-chart-2");
    expect(dot("B")?.getAttribute("data-series")).toBe("secondary");
    expect(dot("C")?.getAttribute("class")).toContain("fill-chart-1");
  });
  it("keeps the signal colour for a worse row whatever its series", () => {
    render(
      <Dumbbell
        width={640}
        unit="US$m"
        periods={periods}
        rows={[{ label: "D", ...pair, series: "secondary", tone: "worse", note: "up, worse" }]}
      />,
    );
    expect(
      document.querySelector('[data-row="D"] [data-current]')?.getAttribute("class"),
    ).toContain("fill-worse-mark");
  });
});

describe("a change prints only a year apart (L2)", () => {
  /** The accepted handoff with FY2023 relabelled FY2022: periods two years apart, no change. */
  const twoYearsApart = () => {
    let entry = cp1Entry();
    entry = setCell(entry, "Chart data: revenue and EBITDA", 0, "Period", "FY2022");
    entry = setCell(entry, "Net debt data", 0, "Period", "FY2022 / 2022-09-30");
    entry = setCell(entry, LEVERAGE, 0, "Period", "FY2022 / 2022-09-30");
    return dropTable(entry, "T4.4 Income statement");
  };
  it("prints FY2023 → FY2024 as a change, with the owner's word", () => {
    const tile = draw();
    expect([...tile.querySelectorAll("[data-part=change]")].map((t) => t.textContent)).toEqual([
      "+1,355",
      "+665",
      "+778",
      "+5,130",
    ]);
    expect(tile.querySelector("[data-change]")?.textContent).toBe("+0.26x · worse");
  });
  it("prints each stated figure with its period and no change for FY2022 → FY2024", () => {
    const tile = draw(twoYearsApart());
    expect(tile.querySelectorAll("[data-part=change]")).toHaveLength(0);
    expect(tile.querySelector("[data-change]")).toBeNull();
    // Hand: revenue FY2022 6,585 and FY2024 7,940 are both drawn, each in its period.
    const text = everything(tile);
    expect(text).toContain("Revenue FY2022 6,585, FY2024 7,940");
    expect(text).toContain("Total debt / EBITDA on its own scale: FY2022 6.27x, FY2024 6.53x.");
    expect(text).not.toMatch(/better|worse|\+1,355|\+0\.26/);
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const headers = [...within(tile).getByRole("table").querySelectorAll("thead th")].map(
      (cell) => cell.textContent,
    );
    expect(headers).toEqual(["Measure", "FY2022", "FY2024"]);
  });
});

describe("the head: caption and legend (N4, N8)", () => {
  const kinds = (tile: HTMLElement) =>
    [...tile.querySelectorAll("[data-legend]")].map((li) => [
      li.getAttribute("data-legend"),
      li.textContent,
    ]);
  it("says which period each figure is in, in the head under the kicker", () => {
    const tile = draw();
    expect(tile.querySelector("[data-part=caption]")?.textContent).toBe(
      "Each figure in its stated period: FY2023, FY2024",
    );
    cleanup();
    expect(draw(threePeriodCp1()).querySelector("[data-part=caption]")).toBeNull();
  });
  it("draws a ring for the earlier period, dots for the current ones and a line for leverage", () => {
    expect(kinds(draw())).toEqual([
      ["ring", "FY2023"],
      ["dot", "FY2024 earnings"],
      ["dot", "FY2024 gross debt"],
      ["line", "Leverage, worse"],
    ]);
  });
  it("adds a Leverage, better entry in the better mark when the slope is better", () => {
    const tile = draw(setCell(cp1Entry(), LEVERAGE, 1, "Total debt / EBITDA", "5.50"));
    expect(kinds(tile)).toContainEqual(["line", "Leverage, better"]);
    expect(kinds(tile)).not.toContainEqual(["line", "Leverage, worse"]);
    const swatch = tile.querySelector("[data-legend=line] [data-swatch=line]");
    expect(swatch).toHaveClass("stroke-better-mark");
    expect(tile.querySelector("[data-leverage] svg .stroke-better-mark")).not.toBeNull();
    expect(tile.querySelector("[data-leverage] [data-change] [data-tone]")).toHaveClass(
      "text-better-mark",
    );
  });
  it("draws bars for one period and lines for three", () => {
    // One period: no change, so no "Leverage, worse" entry.
    expect(kinds(draw(relativeValueCp1Entry())).map(([kind]) => kind)).toEqual(["bar", "bar"]);
    cleanup();
    const three = kinds(draw(threePeriodCp1())).map(([kind]) => kind);
    expect(three).toContain("line");
    expect(three).not.toContain("ring");
  });
});

describe("a third period: the compared pair is named and carries the tone (round 5 U2)", () => {
  // The accepted handoff plus `LTM Dec-2024 | 6.90 | 5.95 | x` in Chart data: leverage. Both
  // orders order in time (FY2023, FY2024, LTM Dec-2024) and compare the same-kind periods exactly
  // one year apart, FY2023 → FY2024; the LTM row is another kind, so it is never part of a change.
  const LTM = ["LTM Dec-2024", "6.90", "5.95", "x", "Test mutation."];
  const withLtm = (where: "append" | "prepend") =>
    edited(cp1Entry(), (table, heading) =>
      heading === LEVERAGE
        ? {
            ...table,
            rows:
              where === "append"
                ? [...table.rows, { line: 90, cells: LTM }]
                : [{ line: 90, cells: LTM }, ...table.rows],
          }
        : table,
    );
  for (const where of ["append", "prepend"] as const) {
    describe(`the LTM row ${where}ed`, () => {
      it("draws the slope in time order with the chip naming the pair", () => {
        const tile = draw(withLtm(where));
        const slope = within(tile).getByRole("img", { name: /^Total debt \/ EBITDA/ });
        expect(slope.getAttribute("aria-label")).toBe(
          "Total debt / EBITDA on its own scale: FY2023 6.27x, FY2024 6.53x, LTM Dec-2024 6.90x, +0.26x, worse (FY2023 → FY2024).",
        );
        expect(
          [...slope.querySelectorAll("[data-dot]")].map((dot) => [
            dot.getAttribute("data-dot"),
            attr(dot, "data-value"),
          ]),
        ).toEqual([
          ["FY2023", 6.27],
          ["FY2024", 6.53],
          ["LTM Dec-2024", 6.9],
        ]);
        expect(tile.querySelector("[data-change]")?.textContent).toBe(
          "+0.26x · worse · FY2023 → FY2024",
        );
      });
      it("colours the FY2023 → FY2024 segment worse and leaves FY2024 → LTM neutral", () => {
        const tile = draw(withLtm(where));
        const segments = [...tile.querySelectorAll("[data-leverage] [data-segment]")];
        expect(segments.map((line) => line.getAttribute("data-segment"))).toEqual([
          "FY2023 → FY2024",
          "FY2024 → LTM Dec-2024",
        ]);
        expect(segments[0]?.getAttribute("data-tone")).toBe("worse");
        expect(segments[0]?.getAttribute("class")).toContain("stroke-worse-mark");
        expect(segments[1]?.hasAttribute("data-tone")).toBe(false);
        expect(segments[1]?.getAttribute("class")).not.toMatch(/warning-mark|worse-mark/);
      });
      it("names the pair beside every measure's change in the figure's reading", () => {
        const tile = draw(withLtm(where));
        const reading = tile.querySelector("svg[aria-label*='on one scale from zero']");
        const text = reading?.getAttribute("aria-label") ?? "";
        expect(text).toContain("Gross debt FY2023 19,750, FY2024 24,880");
        expect(text).toContain("+5,130 up, worse (FY2023 → FY2024)");
        expect(text).toContain("Revenue FY2023 6,585, FY2024 7,940");
        expect(text).toContain("+1,355 up, better (FY2023 → FY2024)");
      });
    });
  }
  it("keeps two periods unchanged: the chip names no pair", () => {
    const tile = draw();
    expect(tile.querySelector("[data-change]")?.textContent).toBe("+0.26x · worse");
    expect(everything(tile)).not.toContain("(FY2023 → FY2024)");
  });
});

// The ruling of 2026-11-25: every supplied period on X, oldest fiscal year → latest fiscal year →
// YTD → LTM → PF → forecast years. The fixture writes its rows scrambled; expected orders and
// figures are written by hand from the fixture's cells.
describe("Earnings and debt: five scrambled periods on X in the one period order", () => {
  const ORDER = ["FY2023", "FY2024", "LTM Jun-2025", "PF FY2024", "FY2025E"];
  const points = (tile: HTMLElement, panel: string) =>
    [...tile.querySelectorAll(`[data-panel="${panel}"] [data-point]`)].map((point) => ({
      at: point.getAttribute("data-point"),
      value: attr(point, "data-value"),
      cx: attr(point, "cx"),
    }));

  it("draws LTM and PF after the fiscal years and before the forecast year, each value its own", () => {
    const tile = draw(mixedPeriodsCp1());
    expect(tile.textContent).toContain("$m, FY2023 → FY2025E");
    const revenue = points(tile, "Revenue");
    expect(revenue.map((point) => point.at)).toEqual(ORDER.map((label) => `Revenue ${label}`));
    expect(revenue.map((point) => point.value)).toEqual([6585, 7940, 8500, 8100, 8800]);
    // Left to right on X: every point is right of the one before it.
    const xs = revenue.map((point) => point.cx);
    expect(xs.every((x, at) => at === 0 || x > (xs[at - 1] ?? x))).toBe(true);
    expect(points(tile, "Adjusted EBITDA").map((point) => point.value)).toEqual([
      3395, 4173, 4500, 4250, 4700,
    ]);
    expect(points(tile, "Gross debt").map((point) => point.value)).toEqual([
      19750, 24880, 24950, 24880, 25100,
    ]);
    // The income statement states the two fiscal years only: the other periods keep their place.
    expect(points(tile, "EBITDA (Reported)").map((point) => point.value)).toEqual([3148, 3813]);
    const axis = [...tile.querySelectorAll('[data-panel="Revenue"] [data-part=period]')].map(
      (label) => lines(label),
    );
    expect(axis).toEqual(["FY2023", "FY2024", "LTM Jun-2025", "PF FY2024", "FY2025E"]);
    expect(tile.textContent).not.toMatch(/time order/);
  });

  it("leverage runs in the same order; the change and the basis are the reported periods'", () => {
    const tile = draw(mixedPeriodsCp1());
    const lev = tile.querySelector("[data-leverage]") as HTMLElement;
    expect([...lev.querySelectorAll("[data-part=period]")].map((node) => node.textContent)).toEqual(
      ORDER,
    );
    expect(lev.querySelector("svg")?.getAttribute("aria-label")).toBe(
      "Total debt / EBITDA on its own scale: FY2023 6.27x, FY2024 6.53x, LTM Jun-2025 6.40x, " +
        "PF FY2024 7.10x, FY2025E 5.90x, +0.26x, worse (FY2023 → FY2024).",
    );
    // The basis words are the latest reported row's (LTM Jun-2025), never the forecast row's.
    expect(lev.querySelector("[data-basis]")?.textContent).toBe("Twelve-month row.");
  });
});

describe("EarningsDebtTile: a stated negative measure", () => {
  it("draws a negative EBITDA (Reported) as a bar from its value up to zero", () => {
    // Retained relative value CP-1 draft 1 (one period, FY2024) with T4.4 EBITDA (Reported) edited to -9000
    // (a mutation, not a real handoff).
    const entry = setLabelled(
      relativeValueCp1Entry(),
      "T4.4 Income statement",
      "EBITDA (Reported)",
      "FY2024",
      "-9000",
    );
    const tile = draw(entry);
    const num = (node: Element, name: string) => Number(node.getAttribute(name));
    const negative = tile.querySelector('[data-bar="EBITDA (Reported)"]');
    const positive = tile.querySelector('[data-bar="Revenue"]');
    expect(negative).not.toBeNull();
    expect(positive).not.toBeNull();
    if (!negative || !positive) return;
    expect(num(negative, "width")).toBeGreaterThan(50);
    expect(num(negative, "x") + num(negative, "width")).toBeCloseTo(num(positive, "x"), 5);
    const figure = negative.parentElement?.querySelector('[data-part="value"]');
    expect(figure?.getAttribute("text-anchor")).toBe("start");
    expect(num(figure as Element, "x")).toBeCloseTo(num(positive, "x") + 6, 5);
  });
});

describe("EarningsDebtTile: a figure never sits on its own bar (S15-3-1)", () => {
  /** Draws the tile; with a width, a stubbed ResizeObserver reports it so the layout switches. */
  function drawAt(entry: OutputEntry, width?: number) {
    type Cb = (entries: { contentRect: { width: number } }[]) => void;
    const callbacks: Cb[] = [];
    class Stub {
      constructor(cb: Cb) {
        callbacks.push(cb);
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", Stub);
    const tile = draw(entry);
    if (width !== undefined)
      act(() => {
        for (const cb of callbacks) cb([{ contentRect: { width } }]);
      });
    return tile;
  }
  const num = (node: Element, name: string) => Number(node.getAttribute(name));
  function positivesBeyondBars(tile: HTMLElement) {
    const rows = [...tile.querySelectorAll("[data-row]")];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const bar = row.querySelector("[data-bar]");
      const figure = row.querySelector('[data-part="value"]');
      if (!bar || !figure || num(bar, "data-value") < 0) continue;
      expect(figure.getAttribute("text-anchor")).toBe("start");
      expect(num(figure, "x")).toBeGreaterThanOrEqual(num(bar, "x") + num(bar, "width"));
    }
  }
  const negative = () =>
    setLabelled(
      relativeValueCp1Entry(),
      "T4.4 Income statement",
      "EBITDA (Reported)",
      "FY2024",
      "-9000",
    );

  it.each([
    ["wide", undefined],
    ["narrow", 400],
  ])("%s: every positive figure starts at or beyond its bar's far end", (layout, width) => {
    const tile = drawAt(relativeValueCp1Entry(), width);
    expect(tile.querySelector("svg[data-layout]")?.getAttribute("data-layout")).toBe(layout);
    positivesBeyondBars(tile);
  });

  it.each([
    ["wide", undefined],
    ["narrow", 400],
  ])(
    "%s: with a negative row, it sits at the zero line and the positives stay clear",
    (_l, width) => {
      const tile = drawAt(negative(), width);
      positivesBeyondBars(tile);
      const zero = tile.querySelector('[data-bar="Revenue"]');
      const bar = tile.querySelector('[data-bar="EBITDA (Reported)"]');
      const figure = bar?.parentElement?.querySelector('[data-part="value"]');
      if (!zero || !figure) throw new Error("rows not drawn");
      expect(num(figure, "x")).toBeCloseTo(num(zero, "x") + 6, 5);
    },
  );
});

describe("a stated source dash (S15-5-4)", () => {
  // Answer key: the kit's rule for a cell the source left as a dash (periodsData `written`, marks
  // `gapWords`): it reads "—", and the words "source dash" are shown nowhere.
  const DASH = "Not supplied: source dash";
  it("one period: the chip, table and reading draw the dash", () => {
    // Mutation of the retained relative value CP-1 (one period; not a real handoff).
    const tile = draw(setCell(relativeValueCp1Entry(), "Net debt data", 0, "Gross debt", DASH));
    expect(everything(tile)).not.toMatch(/source dash/i);
  });
  it("two periods: the table and the reading say what the dumbbell says", () => {
    // Mutation of the retained TransDigm CP-1 (not a real handoff).
    const tile = draw(
      setLabelled(cp1Entry(), "T4.4 Income statement", "EBITDA (Reported)", "FY2023", DASH),
    );
    expect(everything(tile)).not.toMatch(/source dash/i);
  });
});
