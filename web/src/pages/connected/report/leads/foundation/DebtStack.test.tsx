// Expected values are written out by hand from the retained TransDigm CP-1 handoffs (accepted
// FY2024: six secured notes; relative value draft 1: ten facilities in two rankings; outdated
// evidence: shape and scope only), not computed by the code under test. The gap, zero, ranking and
// all-gap cases are mutations of them (fixtures/mutations.ts), not real handoffs.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { containsReference, type OutputEntry } from "../../../publishedReport";
import { cp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import { dropTable, setCell, withRows } from "../fixtures/mutations";
import { stackLayout } from "./debtStackGeometry";
import { DebtStackTile } from "./DebtStack";
import { debtStack } from "./foundationData";

afterEach(cleanup);

const STACK = "Chart data: debt stack";

function draw(entry: OutputEntry) {
  render(<DebtStackTile lead={leadProps(entry)} />);
  const tile = screen.getByRole("region", { name: "Debt stack" });
  return { tile, svg: tile.querySelector("svg[role='img']") };
}

const num = (element: Element | undefined | null, name: string) =>
  Number(element?.getAttribute(name));
const segments = (tile: HTMLElement) => [...tile.querySelectorAll("rect[data-segment]")];
const words = (tile: HTMLElement) =>
  [...tile.querySelectorAll("[data-facility]")].map((group) =>
    [...group.querySelectorAll("text")].map((text) =>
      [...text.querySelectorAll("tspan")].length
        ? [...text.querySelectorAll("tspan")].map((line) => line.textContent).join(" ")
        : text.textContent,
    ),
  );

function openTable(tile: HTMLElement) {
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  return within(within(tile).getByRole("table"))
    .getAllByRole("row")
    .map((row) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent));
}

describe("debt stack: the accepted CP-1", () => {
  it("titles the tile plainly, kicker with the unit, one trace control", () => {
    const { tile } = draw(cp1Entry());
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Debt by ranking");
    expect(tile.textContent).toContain("Debt stack · $m");
    expect(within(tile).getAllByRole("link", { name: /Source for the debt stack/ })).toHaveLength(
      1,
    );
  });

  it("stacks the six notes in the module's order, each as tall as its stated amount", () => {
    const { tile } = draw(cp1Entry());
    const bars = segments(tile);
    expect(
      bars.map((bar) => [bar.getAttribute("data-segment"), bar.getAttribute("data-amount")]),
    ).toEqual([
      ["2028 secured notes", "2100"],
      ["2029 secured notes", "2750"],
      ["2030 secured notes", "1450"],
      ["2031 secured notes", "1000"],
      ["2032 secured notes", "2200"],
      ["2033 secured notes", "1500"],
    ]);
    // One scale: each segment's height (plus its 1 px seam) per unit of its amount is the same.
    const amounts = [2100, 2750, 1450, 1000, 2200, 1500];
    const perUnit = (num(bars[0], "height") + 1) / 2100;
    for (const [at, bar] of bars.entries())
      expect((num(bar, "height") + 1) / (amounts[at] ?? 1)).toBeCloseTo(perUnit, 6);
    // First claim at the top, each segment below the one before it.
    const tops = bars.map((bar) => num(bar, "y"));
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    // Secured "Yes" in the primary colour; the word is written beside it too.
    expect(bars.every((bar) => bar.getAttribute("class")?.includes("fill-chart-1"))).toBe(true);
  });

  it("writes each facility's name, amount, ranking, secured flag and cumulative leverage as written", () => {
    const { tile } = draw(cp1Entry());
    expect(words(tile)[0]).toEqual([
      "2028 secured notes",
      "2,100",
      "Ranking 1 · Secured: Yes · Cumulative leverage 0.55",
    ]);
    expect(words(tile)[5]).toEqual([
      "2033 secured notes",
      "1,500",
      "Ranking 1 · Secured: Yes · Cumulative leverage 2.88",
    ]);
    // The figure says nothing about priority beyond the stated ranking and secured flag (the
    // module's own basis words, which do, are in the table view).
    expect(tile.querySelector("svg")?.textContent).not.toMatch(/0\.55x|senior|junior|priority/i);
  });

  it("reads every facility in the aria-label; legend by the secured flag; the module's own note", () => {
    const { tile, svg } = draw(cp1Entry());
    expect(svg?.getAttribute("aria-label")).toBe(
      "Debt stack, $m, in ranking order, first claim at the top: " +
        "2028 secured notes 2,100, Ranking 1 · Secured: Yes · Cumulative leverage 0.55; " +
        "2029 secured notes 2,750, Ranking 1 · Secured: Yes · Cumulative leverage 1.27; " +
        "2030 secured notes 1,450, Ranking 1 · Secured: Yes · Cumulative leverage 1.65; " +
        "2031 secured notes 1,000, Ranking 1 · Secured: Yes · Cumulative leverage 1.91; " +
        "2032 secured notes 2,200, Ranking 1 · Secured: Yes · Cumulative leverage 2.49; " +
        "2033 secured notes 1,500, Ranking 1 · Secured: Yes · Cumulative leverage 2.88.",
    );
    expect([...tile.querySelectorAll("[data-legend]")].map((item) => item.textContent)).toEqual([
      "Secured: Yes",
    ]);
    expect(tile.textContent).toContain(
      "Only notes with both affirmative security descriptions and relative payment rank established are included; omitted instruments prevent this from representing a complete capital structure or recovery waterfall.",
    );
  });

  it("opens the table view: every cell as written, basis words without sources", () => {
    const { tile } = draw(cp1Entry());
    const rows = openTable(tile);
    expect(rows[0]).toEqual([
      "Facility",
      "Ranking",
      "Secured",
      "Amount, $m",
      "Cumulative leverage",
      "Basis and limitation",
    ]);
    expect(rows[1]?.slice(0, 5)).toEqual(["2028 secured notes", "1", "Yes", "2,100", "0.55"]);
    expect(containsReference(tile.textContent)).toBe(false);
    expect(tile.textContent).not.toMatch(/p153|p148|\.jsonl|derived/i);
  });

  it("draws 12 px text at the measured width; narrow below 520 px with the amount in the words", () => {
    const { svg } = draw(cp1Entry());
    expect(svg?.getAttribute("viewBox")).toMatch(/^0 0 600 /);
    for (const text of svg?.querySelectorAll("text") ?? [])
      expect(Number(text.getAttribute("font-size"))).toBeGreaterThanOrEqual(12);
    const stack = debtStack(cp1Entry());
    if (!stack) throw new Error("expected a stack");
    const narrow = stackLayout(stack, 358);
    expect(narrow.narrow).toBe(true);
    expect(narrow.segments[0]?.detail.join(" ")).toBe(
      "2,100 · Ranking 1 · Secured: Yes · Cumulative leverage 0.55",
    );
    // Every line fits inside 358 px at 12 px (0.6 em a character).
    for (const segment of narrow.segments)
      for (const line of [...segment.name, ...segment.detail])
        expect(narrow.textX + line.length * 7.2).toBeLessThanOrEqual(358);
  });
});

describe("debt stack: other handoffs and mutations", () => {
  it("relative value: ten facilities, a break between ranking 1 and ranking 2, Secured: No in plum", () => {
    const { tile } = draw(relativeValueCp1Entry());
    const bars = segments(tile);
    expect(bars).toHaveLength(10);
    expect(bars.map((bar) => bar.getAttribute("data-amount"))).toEqual([
      "8702",
      "2100",
      "2750",
      "1450",
      "1000",
      "2200",
      "1500",
      "2650",
      "1200",
      "750",
    ]);
    // Hand: 8,702 is 8,702 / 750 times as tall as 750 (seams aside).
    expect((num(bars[0], "height") + 1) / (num(bars[9], "height") + 1)).toBeCloseTo(8702 / 750, 6);
    const lastRankOne = num(bars[6], "y") + num(bars[6], "height") + 1;
    expect(num(bars[7], "y") - lastRankOne).toBe(14);
    expect(num(bars[2], "y") - (num(bars[1], "y") + num(bars[1], "height") + 1)).toBeCloseTo(0, 6);
    expect(bars[7]?.getAttribute("class")).toContain("fill-chart-2");
    expect(words(tile)[7]?.[2]).toBe("Ranking 2 · Secured: No · Cumulative leverage 6.37");
    expect([...tile.querySelectorAll("[data-legend]")].map((item) => item.textContent)).toEqual([
      "Secured: Yes",
      "Secured: No",
    ]);
  });

  it("a stated gap amount is a hatched slot with the module's reason; a stated zero is a hairline", () => {
    let entry = setCell(
      cp1Entry(),
      STACK,
      2,
      "Amount",
      "Not supplied: principal not in the note read",
    );
    entry = setCell(entry, STACK, 3, "Amount", "0");
    const { tile, svg } = draw(entry);
    expect(
      tile.querySelector('[data-gap="Not supplied: principal not in the note read"]'),
    ).not.toBeNull();
    expect(
      [...tile.querySelectorAll('[data-part="reason"]')].map((node) => node.textContent),
    ).toEqual(["Not supplied: principal not in the note read"]);
    const zero = tile.querySelector('line[data-segment="2031 secured notes"]');
    expect(zero?.getAttribute("data-amount")).toBe("0");
    expect(svg?.getAttribute("aria-label")).toContain(
      "2030 secured notes Not supplied: principal not in the note read",
    );
    expect(svg?.getAttribute("aria-label")).toContain("2031 secured notes 0,");
    expect([...tile.querySelectorAll("[data-legend]")].map((item) => item.textContent)).toContain(
      "Not stated",
    );
    // The stated amounts keep one scale around the slot.
    const bars = segments(tile);
    expect((num(bars[0], "height") + 1) / 2100).toBeCloseTo((num(bars[1], "height") + 1) / 2750, 6);
  });

  it("a ranking that falls down the rows: the gap tile with the page's reason", () => {
    render(
      <DebtStackTile
        lead={leadProps(setCell(relativeValueCp1Entry(), STACK, 9, "Ranking", "1"))}
      />,
    );
    expect(screen.getByRole("region", { name: "Debt stack" }).textContent).toBe(
      "Debt stackThis page could not read the debt stack because a ranking is not a whole number from 1 that never falls down the rows.",
    );
  });

  it("without the table, or all gaps: the one gap tile, the module's reason when it states one", () => {
    render(<DebtStackTile lead={leadProps(dropTable(cp1Entry(), STACK))} />);
    expect(screen.getByRole("region", { name: "Debt stack" }).textContent).toBe(
      "Debt stackThis page could not read the debt stack.",
    );
    cleanup();
    const gap = "Not supplied: debt note not in the filing read";
    render(
      <DebtStackTile
        lead={leadProps(withRows(cp1Entry(), STACK, [[gap, gap, gap, gap, gap, "US$m", "x"]]))}
      />,
    );
    const tile = screen.getByRole("region", { name: "Debt stack" });
    expect(tile.textContent).toBe(`Debt stack${gap}`);
    expect(tile.querySelector("svg")).toBeNull();
  });
});
