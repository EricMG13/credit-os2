// The first cases read retained TransDigm CP-1 handoffs (outdated evidence: shape and scope only):
// the accepted handoff (two periods, rows by business unit), the relative value draft (one period,
// segment rows in its own wide shape) and the distressed draft (rows by segment and measure). The
// expected values are written out by hand from each `Segment schedule`. The other cases are
// mutations of the accepted handoff (labelled; not a real handoff).
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cp1Entry, distressedCp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import { addRow, dropTable, setCell } from "../fixtures/mutations";
import type { OutputEntry } from "../../../publishedReport";
import { segmentView } from "./foundationData";
import { SegmentsTile } from "./Segments";
import { segmentLayout, segmentPeriods } from "./segmentsGeometry";

afterEach(cleanup);

const draw = (data: OutputEntry) => {
  render(<SegmentsTile lead={leadProps(data)} />);
  return screen.getByRole("region", { name: "Segments" });
};
const num = (element: Element | null, name: string) => Number(element?.getAttribute(name));
/** The element whose `data-<attr>` is exactly `value` (jsdom's selector engine mis-reads "&"). */
const byData = (tile: HTMLElement, attr: string, value: string) =>
  [...tile.querySelectorAll(`[data-${attr}]`)].find(
    (el) => el.getAttribute(`data-${attr}`) === value,
  ) ?? null;
const bar = (tile: HTMLElement, name: string) => byData(tile, "bar", name);
const texts = (tile: HTMLElement) => [...tile.querySelectorAll("svg text")];
const SCHEDULE = "Segment schedule";

describe("SegmentsTile on the accepted handoff (two periods)", () => {
  it("is titled plainly, with the unit and the drawn period in the kicker", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getByRole("heading", { name: "Segments" })).toBeVisible();
    expect(within(tile).getByText("Segments · $m, FY2024")).toBeVisible();
  });
  it("draws FY2024 bars on one scale from zero, each in proportion to its stated amount", () => {
    const tile = draw(cp1Entry());
    const pcSales = bar(tile, "Power & Control sales");
    const zero = num(pcSales, "x");
    for (const name of ["Airframe sales", "Non-aviation ebitda", "Power & Control ebitda"])
      expect(num(bar(tile, name), "x")).toBeCloseTo(zero, 6);
    const unit = num(pcSales, "width") / 3941;
    expect(num(bar(tile, "Airframe sales"), "width") / unit).toBeCloseTo(3809, 6);
    expect(num(bar(tile, "Power & Control ebitda"), "width") / unit).toBeCloseTo(2236, 6);
    expect(num(bar(tile, "Airframe ebitda"), "width") / unit).toBeCloseTo(1962, 6);
    expect(num(bar(tile, "Non-aviation sales"), "width") / unit).toBeCloseTo(190, 6);
    expect(num(bar(tile, "Non-aviation ebitda"), "width") / unit).toBeCloseTo(81, 6);
    // Tint by size against the largest drawn bar, 3,941 (ruling C4), shares worked by hand:
    // P&C sales 3941/3941 = 1 -> 5; Airframe sales 3809/3941 = 0.9665 -> 5; P&C EBITDA 2236/3941 = 0.5674 -> 3;
    // Airframe EBITDA 1962/3941 = 0.4978 -> 3; Non-aviation sales 190/3941 = 0.048 -> 1; EBITDA 81/3941 = 0.021 -> 1.
    const tone = (name: string, step: number) =>
      expect(bar(tile, name)).toHaveClass(
        `fill-scale-amount-${String(step)}`,
        "stroke-scale-amount-edge",
      );
    tone("Power & Control sales", 5);
    tone("Airframe sales", 5);
    tone("Power & Control ebitda", 3);
    tone("Airframe ebitda", 3);
    tone("Non-aviation sales", 1);
    tone("Non-aviation ebitda", 1);
  });
  it("tells the two measures apart in words, not colour, and keys the tint in the legend", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getByText("Net sales, FY2024", { selector: "span" })).toBeVisible();
    expect(within(tile).getByText("EBITDA As Defined, FY2024", { selector: "span" })).toBeVisible();
    expect(within(tile).getByText(/^Shade by size against the biggest bar/)).toBeVisible();
    expect(within(tile).getByText("biggest")).toBeVisible();
  });
  it("writes the FY2023 figure under each bar at a thin tick on the same scale", () => {
    const tile = draw(cp1Entry());
    const zero = num(bar(tile, "Power & Control sales"), "x");
    const unit = num(bar(tile, "Power & Control sales"), "width") / 3941;
    const prior = (name: string) => byData(tile, "prior", name);
    expect(prior("Power & Control sales")?.textContent).toBe("FY2023 3,316");
    expect(prior("Airframe ebitda")?.textContent).toBe("FY2023 1,547");
    expect(prior("Non-aviation ebitda")?.textContent).toBe("FY2023 71");
    const tick = prior("Power & Control ebitda")?.querySelector("line");
    expect((num(tick ?? null, "x1") - zero) / unit).toBeCloseTo(1866, 6);
    expect(within(tile).getByText("Tick: FY2023")).toBeVisible();
  });
  it("prints no ratio, sum, reconciliation or group figure (ruling i)", () => {
    const tile = draw(cp1Entry());
    expect(tile.textContent).not.toMatch(/÷|ratio|margin|sum|reconcil|deriv|%|7,940|4,173|total/i);
    expect(tile.querySelector("[data-ratio]")).toBeNull();
  });
  it("states unallocated corporate apart, in words, never as a bar", () => {
    const tile = draw(cp1Entry());
    expect(
      within(tile).getByText(
        "Unallocated corporate, FY2024: Net sales Not supplied: no separate revenue line; EBITDA As Defined −106 (FY2023 −89).",
      ),
    ).toBeVisible();
    expect(byData(tile, "segment", "Unallocated corporate")).toBeNull();
  });
  it("says every drawn figure in the aria-label", () => {
    const tile = draw(cp1Entry());
    // Two periods only: the accepted handoff draws no sparkline (ruling C5).
    expect(tile.querySelector("[data-values], [data-end]")).toBeNull();
    expect(within(tile).getByRole("img").getAttribute("aria-label")).toBe(
      "Segments, $m, FY2024 with FY2023 beneath. Power & Control: Net sales 3,941 (FY2023 3,316), EBITDA As Defined 2,236 (FY2023 1,866); Airframe: Net sales 3,809 (FY2023 3,094), EBITDA As Defined 1,962 (FY2023 1,547); Non-aviation: Net sales 190 (FY2023 175), EBITDA As Defined 81 (FY2023 71); Unallocated corporate, FY2024: Net sales Not supplied: no separate revenue line; EBITDA As Defined −106 (FY2023 −89).",
    );
  });
  it("opens the table view from the button: every stated period, no source column", () => {
    const tile = draw(cp1Entry());
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const grid = within(tile).getByRole("table");
    const rows = within(grid)
      .getAllByRole("row")
      .map((row) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent));
    expect(rows).toEqual([
      [
        "Segment",
        "Net sales, FY2023",
        "Net sales, FY2024",
        "EBITDA As Defined, FY2023",
        "EBITDA As Defined, FY2024",
      ],
      ["Power & Control", "3,316", "3,941", "1,866", "2,236"],
      ["Airframe", "3,094", "3,809", "1,547", "1,962"],
      ["Non-aviation", "175", "190", "71", "81"],
      [
        "Unallocated corporate",
        "Not supplied: no separate revenue line",
        "Not supplied: no separate revenue line",
        "−89",
        "−106",
      ],
    ]);
  });
  it("has one trace control and draws no source reference", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getAllByRole("link", { name: /^Source for / })).toHaveLength(1);
    expect(tile.textContent).not.toMatch(/jsonl|pages? \d|10-K|TDG_/);
  });
  it("draws all SVG text at 11 px or more", () => {
    const tile = draw(cp1Entry());
    for (const text of texts(tile))
      expect(Number(text.getAttribute("font-size"))).toBeGreaterThanOrEqual(11);
  });
});

describe("SegmentsTile on the other retained handoffs", () => {
  it("draws the relative value draft's one period from its own segment rows: bars only", () => {
    const tile = draw(relativeValueCp1Entry());
    expect(within(tile).getByText("Segments · $m, FY2024")).toBeVisible();
    const unit = num(bar(tile, "Power & Control sales"), "width") / 3941;
    expect(num(bar(tile, "Airframe sales"), "width") / unit).toBeCloseTo(3809, 6);
    expect(num(bar(tile, "Non-aviation ebitda"), "width") / unit).toBeCloseTo(81, 6);
    expect(tile.querySelector("[data-prior]")).toBeNull();
    expect(within(tile).queryByText(/^Tick:/)).toBeNull();
    // The sub-lines (Defense, OEM, aftermarket) are not segments; they are not drawn or summed.
    expect(tile.textContent).not.toMatch(/Defense|aftermarket|1,903/);
    expect(
      within(tile).getByText(
        "Corporate and eliminations, FY2024: Revenue Not supplied: no monetary corporate revenue line.",
      ),
    ).toBeVisible();
    expect(
      within(tile).getByText("Unallocated corporate, FY2024: EBITDA As Defined −106."),
    ).toBeVisible();
    expect(within(tile).getByText("Revenue, FY2024", { selector: "span" })).toBeVisible();
  });
  it("draws the distressed draft's rows by segment and measure with its own measure names", () => {
    const tile = draw(distressedCp1Entry());
    expect(within(tile).getByText("Revenue, FY2024", { selector: "span" })).toBeVisible();
    expect(byData(tile, "prior", "Airframe sales")?.textContent).toBe("FY2023 3,094");
    expect(
      within(tile).getByText(
        "Corporate and eliminations, FY2024: Revenue Not supplied: no separate revenue row; EBITDA As Defined −106 (FY2023 −89).",
      ),
    ).toBeVisible();
    expect(tile.textContent).not.toMatch(/C11|page/);
  });
});

describe("SegmentsTile states (mutations of the accepted handoff; not a real handoff)", () => {
  it("draws the latest pair and names the drawn periods when the schedule states three", () => {
    const three = addRow(cp1Entry(), SCHEDULE, [
      "Power & Control",
      "FY2022",
      "Not supplied: outside the comparison scope",
      "1500",
      "USD millions",
      "-",
      "-",
    ]);
    const tile = draw(three);
    expect(within(tile).getByText("Segments · $m, FY2024")).toBeVisible();
    expect(byData(tile, "prior", "Power & Control ebitda")?.textContent).toBe("FY2023 1,866");
    expect(
      within(tile).getByText(
        "Bars show FY2024; ticks show FY2023. The schedule also states FY2022; it is in the table view.",
      ),
    ).toBeVisible();
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const pc = within(within(tile).getByRole("table")).getByRole("row", {
      name: /^Power & Control/,
    });
    expect(
      within(pc)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual([
      "Power & Control",
      "Not supplied: outside the comparison scope",
      "3,316",
      "3,941",
      "1,500",
      "1,866",
      "2,236",
    ]);
    expect(tile.querySelector("[data-values], [data-end]")).toBeNull();
  });
  it("draws the annual pair beside a last-twelve-months row and names the LTM period", () => {
    const ltm = addRow(cp1Entry(), SCHEDULE, [
      "Airframe",
      "LTM Dec-2024",
      "4000",
      "2000",
      "USD millions",
      "-",
      "-",
    ]);
    const tile = draw(ltm);
    expect(within(tile).getByText("Segments · $m, FY2024")).toBeVisible();
    expect(
      within(tile).getByText(
        "Bars show FY2024; ticks show FY2023. The schedule also states LTM Dec-2024; it is in the table view.",
      ),
    ).toBeVisible();
    // The LTM figures are in the table view only: no bar, tick or label draws them.
    const drawn = [...tile.querySelectorAll('[data-part="value"], [data-part="prior"]')];
    expect(drawn.map((text) => text.textContent).join(" ")).not.toMatch(/4,000|2,000/);
  });
  it("draws a gap cell as the hatched slot with the module's reason, never a bar", () => {
    const gap = setCell(cp1Entry(), SCHEDULE, 1, "Net sales", "Not supplied: no line");
    const tile = draw(gap);
    expect(bar(tile, "Airframe sales")).toBeNull();
    expect(byData(tile, "gap", "Airframe sales: Not supplied: no line")).not.toBeNull();
    expect(
      within(tile).getByText("Not supplied: no line", { selector: "tspan" }),
    ).toBeInTheDocument();
    expect(within(tile).getByText("Not supplied", { selector: "span" })).toBeVisible();
  });
  it("keeps a reason that names a source in Evidence", () => {
    const gap = setCell(cp1Entry(), SCHEDULE, 1, "Net sales", "Not supplied: see 10-K page 49");
    const tile = draw(gap);
    expect(tile.textContent).not.toMatch(/page 49/);
    expect(within(tile).getAllByText("Detail is in Evidence.").length).toBeGreaterThan(0);
  });
  it("keeps a stated zero as a value: a zero-width bar labelled 0", () => {
    const zero = setCell(cp1Entry(), SCHEDULE, 2, "EBITDA As Defined", "0");
    const tile = draw(zero);
    expect(num(bar(tile, "Non-aviation ebitda"), "width")).toBe(0);
    const value = bar(tile, "Non-aviation ebitda")?.parentElement?.querySelector(
      '[data-part="value"]',
    );
    expect(value?.textContent).toBe("0");
  });
  it("draws a segment loss leftward of zero on a scale that holds it", () => {
    const loss = setCell(cp1Entry(), SCHEDULE, 2, "EBITDA As Defined", "-400");
    const tile = draw(loss);
    const zero = num(bar(tile, "Power & Control sales"), "x");
    const lossBar = bar(tile, "Non-aviation ebitda");
    expect(num(lossBar, "x") + num(lossBar, "width")).toBeCloseTo(zero, 6);
    const unit = num(bar(tile, "Power & Control sales"), "width") / 3941;
    expect(num(lossBar, "width") / unit).toBeCloseTo(400, 6);
    expect(texts(tile).map((t) => t.textContent)).toContain("−400");
  });
  it("draws the one gap pattern when the schedule is absent or states a figure twice", () => {
    let tile = draw(dropTable(cp1Entry(), SCHEDULE));
    expect(tile.textContent).toBe("SegmentsThis page could not read the segment schedule.");
    expect(tile.className).not.toMatch(/gap-hatch/);
    cleanup();
    tile = draw(
      addRow(cp1Entry(), SCHEDULE, ["Airframe", "FY2024", "1", "1", "USD millions", "-", "-"]),
    );
    expect(tile.textContent).toBe(
      "SegmentsThis page could not read the segment schedule because Airframe net sales appears more than once for FY2024.",
    );
  });
  it("shows the FY2024 gaps alongside the stated FY2023 segment amounts", () => {
    let data = cp1Entry();
    for (const row of [0, 1, 2])
      for (const column of ["Net sales", "EBITDA As Defined"])
        data = setCell(data, SCHEDULE, row, column, "Not supplied: withheld");
    const tile = draw(data);
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const table = within(tile).getByRole("table", { name: "Segments, $m, by period" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Segment", "Measure", "FY2023", "FY2024"]);
    const rows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      );
    expect(rows).toEqual(
      expect.arrayContaining([
        ["Power & Control", "Net sales", "3,316", "Not supplied: withheld"],
        ["Power & Control", "EBITDA As Defined", "1,866", "Not supplied: withheld"],
      ]),
    );
    expect(
      rows
        .filter((row) => row[3] === "Not supplied: withheld")
        .map(([segment, measure]) => [segment, measure]),
    ).toEqual([
      ["Power & Control", "Net sales"],
      ["Power & Control", "EBITDA As Defined"],
      ["Airframe", "Net sales"],
      ["Airframe", "EBITDA As Defined"],
      ["Non-aviation", "Net sales"],
      ["Non-aviation", "EBITDA As Defined"],
    ]);
  });
});

// Mutation (not a real handoff): the accepted handoff's Power & Control sales carried over four
// years. FY2024 3,941 and FY2023 3,316 are the schedule's own cells; FY2022 and FY2021 are invented.
describe("SegmentsTile sparkline (mutation: four stated years for one segment)", () => {
  const row = (period: string, sales: string) => [
    "Power & Control",
    period,
    sales,
    "1000",
    "USD millions",
    "-",
    "-",
  ];
  const four = () =>
    addRow(
      addRow(cp1Entry(), SCHEDULE, row("FY2022", "2900")),
      SCHEDULE,
      row("FY2021", "Not supplied: not stated"),
    );
  it("draws the stated sales years as a line, the unstated year as a gap, and says them in the reading", () => {
    const tile = draw(four());
    const spark = within(tile).getByRole("img", {
      name: "Power & Control Net sales, FY2021 to FY2024",
    });
    expect(spark.querySelector("path")?.getAttribute("data-values")).toBe("2900 3316 3941");
    expect(spark.querySelectorAll("line[data-gap]")).toHaveLength(0);
    expect(spark.querySelector("circle[data-end]")?.getAttribute("data-value")).toBe("3941");
    const figure = within(tile).getByRole("img", { name: /^Segments, \$m, FY2024 with FY2023/ });
    expect(figure.getAttribute("aria-label")).toContain(
      "Power & Control Net sales: FY2021 Not supplied; FY2022 2,900; FY2023 3,316; FY2024 3,941",
    );
  });
  it("marks a stated gap inside the series as a gap, never bridged", () => {
    const tile = draw(
      addRow(
        addRow(
          addRow(cp1Entry(), SCHEDULE, row("FY2022", "Not supplied: not stated")),
          SCHEDULE,
          row("FY2021", "2500"),
        ),
        SCHEDULE,
        row("FY2020", "2400"),
      ),
    );
    const spark = within(tile).getByRole("img", {
      name: "Power & Control Net sales, FY2020 to FY2024",
    });
    expect(
      [...spark.querySelectorAll("path")].map((path) => path.getAttribute("data-values")),
    ).toEqual(["2400 2500", "3316 3941"]);
    expect(spark.querySelectorAll("line[data-gap]")).toHaveLength(1);
  });
});

// Mutation (not a real handoff): Power & Control sales FY2021 2,500 (invented), FY2022 stated as the
// words "n.m." (invented), FY2023 3,316 and FY2024 3,941 (the schedule's own cells).
describe("SegmentsTile sparkline reading of non-number cells (mutation)", () => {
  const row = (name: string, period: string, sales: string) => [
    name,
    period,
    sales,
    "1000",
    "USD millions",
    "-",
    "-",
  ];
  const figureOf = (tile: HTMLElement) =>
    within(tile)
      .getByRole("img", { name: /^Segments, \$m, FY2024 with FY2023/ })
      .getAttribute("aria-label");
  it("reads stated words as written, not as Not supplied, and breaks the line there", () => {
    const tile = draw(
      addRow(
        addRow(
          addRow(cp1Entry(), SCHEDULE, row("Power & Control", "FY2022", "n.m.")),
          SCHEDULE,
          row("Power & Control", "FY2021", "2500"),
        ),
        SCHEDULE,
        row("Power & Control", "FY2020", "2400"),
      ),
    );
    const said = figureOf(tile) ?? "";
    expect(said).toContain(
      "Net sales: FY2020 2,400; FY2021 2,500; FY2022 n.m.; FY2023 3,316; FY2024 3,941",
    );
    expect(said).not.toContain("FY2022 Not supplied");
    const spark = within(tile).getByRole("img", {
      name: "Power & Control Net sales, FY2020 to FY2024",
    });
    expect(
      [...spark.querySelectorAll("path")].map((path) => path.getAttribute("data-values")),
    ).toEqual(["2400 2500", "3316 3941"]);
  });
  it("reads a period with no row as not stated", () => {
    // FY2022 exists as a period through Airframe's row only; Power & Control has none.
    const tile = draw(
      addRow(
        addRow(
          addRow(
            addRow(cp1Entry(), SCHEDULE, row("Airframe", "FY2022", "3000")),
            SCHEDULE,
            row("Power & Control", "FY2021", "2500"),
          ),
          SCHEDULE,
          row("Power & Control", "FY2020", "2400"),
        ),
        SCHEDULE,
        row("Power & Control", "FY2019", "2300"),
      ),
    );
    expect(figureOf(tile)).toContain(
      "Net sales: FY2019 2,300; FY2020 2,400; FY2021 2,500; FY2022 not stated; FY2023 3,316; FY2024 3,941",
    );
  });
});

describe("segmentLayout at a measured width", () => {
  const view = segmentView(cp1Entry());
  const periods = view ? segmentPeriods(view) : null;
  it("puts names left from 520 px and above each pair below it", () => {
    if (!view || !periods) throw new Error("no view");
    const wide = segmentLayout(view, periods, 700);
    expect(wide.layout).toBe("wide");
    expect(wide.from).toBeGreaterThan(100);
    const narrow = segmentLayout(view, periods, 318);
    expect(narrow.layout).toBe("narrow");
    expect(narrow.from).toBeLessThan(10);
    const [first] = narrow.blocks;
    expect(first?.nameY[0] ?? 0).toBeLessThan(first?.rows[0]?.y ?? 0);
  });
  it("keeps every bar and its figure inside the figure's width", () => {
    if (!view || !periods) throw new Error("no view");
    for (const width of [318, 508, 700]) {
      const layout = segmentLayout(view, periods, width);
      for (const row of layout.blocks.flatMap((block) => block.rows)) {
        expect((row.bar?.x ?? 0) + (row.bar?.width ?? 0)).toBeLessThanOrEqual(layout.to + 0.001);
        expect(row.labelX + 6 * 12 * 0.6).toBeLessThanOrEqual(width);
      }
    }
  });
  it("reads one period as bars only and two as bars with ticks", () => {
    const single = segmentView(relativeValueCp1Entry());
    expect(single && segmentPeriods(single)).toEqual({
      drawn: "FY2024",
      prior: null,
      notDrawn: [],
    });
    expect(periods).toEqual({ drawn: "FY2024", prior: "FY2023", notDrawn: [] });
  });
});

// The ruling of 2026-11-25: the bars are the latest reported period, never a pro forma or forecast
// one while a reported period is stated. Expected values are the accepted schedule's own cells.
describe("SegmentsTile: which period the bars draw when no two years are compared", () => {
  const renamed = (first: string, second: string) => {
    let data = cp1Entry();
    for (const row of [0, 1, 2, 3]) data = setCell(data, SCHEDULE, row, "Period", first);
    for (const row of [4, 5, 6, 7]) data = setCell(data, SCHEDULE, row, "Period", second);
    return data;
  };
  it("a forecast year beside an LTM: the bars are the LTM, the forecast is named as not drawn", () => {
    // Rows 0–3 (3,941 …) become FY2025E and rows 4–7 (3,316 …) LTM Jun-2025.
    const data = renamed("FY2025E", "LTM Jun-2025");
    const view = segmentView(data);
    if (!view) throw new Error("expected a view");
    expect(view.periods.map((period) => period.label)).toEqual(["LTM Jun-2025", "FY2025E"]);
    expect(segmentPeriods(view)).toEqual({
      drawn: "LTM Jun-2025",
      prior: null,
      notDrawn: ["FY2025E"],
    });
    const tile = draw(data);
    expect(within(tile).getByText("Segments · $m, LTM Jun-2025")).toBeVisible();
    expect(num(bar(tile, "Power & Control sales"), "data-value")).toBe(3316);
  });
  it("only a pro forma and a forecast period: the last in period order is drawn, nothing compared", () => {
    const view = segmentView(renamed("FY2025E", "PF FY2024"));
    if (!view) throw new Error("expected a view");
    expect(segmentPeriods(view)).toEqual({
      drawn: "FY2025E",
      prior: null,
      notDrawn: ["PF FY2024"],
    });
    expect(view.comparison).toBeNull();
  });
});

// Mutations (not a real handoff) of the accepted handoff's Power & Control sales (FY2023 3,316 and
// FY2024 3,941 are its own cells; the other years are invented).
describe("SegmentsTile sparkline: stated words, skipped years, a drawn period that is not a number", () => {
  const row = (period: string, sales: string) => [
    "Power & Control",
    period,
    sales,
    "1000",
    "USD millions",
    "-",
    "-",
  ];
  const rows = (...pairs: [string, string][]) =>
    pairs.reduce(
      (entry, [period, sales]) => addRow(entry, SCHEDULE, row(period, sales)),
      cp1Entry(),
    );
  const figureOf = (tile: HTMLElement) =>
    within(tile)
      .getByRole("img", { name: /^Segments, \$m, FY2024 with FY2023/ })
      .getAttribute("aria-label") ?? "";
  const sparkOf = (tile: HTMLElement, first: string) =>
    within(tile).getByRole("img", { name: `Power & Control Net sales, ${first} to FY2024` });

  it.each(["restated in the Form 10-K", "n.m. per the annual report", "Source: the prospectus"])(
    "says a words cell that cites a filing as the table does: %s",
    (words) => {
      const tile = draw(rows(["FY2022", words], ["FY2021", "2500"], ["FY2020", "2400"]));
      const said = figureOf(tile);
      expect(said).not.toMatch(/Form 10-K|annual report|prospectus|Source:/);
      expect(said).toContain("FY2021 2,500; FY2022 Detail is in Evidence.; FY2023 3,316");
    },
  );
  it("breaks the line at each year the schedule does not state and says so", () => {
    // FY2019, FY2021, FY2023, FY2024 stated; FY2020 and FY2022 have no period at all.
    const tile = draw(rows(["FY2021", "2500"], ["FY2019", "2300"]));
    expect(figureOf(tile)).toContain(
      "Power & Control Net sales: FY2019 2,300; FY2020 not stated; FY2021 2,500; FY2022 not stated; FY2023 3,316; FY2024 3,941",
    );
    const spark = sparkOf(tile, "FY2019");
    expect(spark.querySelectorAll("line[data-gap]")).toHaveLength(2);
    expect(
      [...spark.querySelectorAll("path")].map((path) => path.getAttribute("data-values")),
    ).toEqual(["3316 3941"]);
  });
  it("does not bridge a year the schedule states only as pro forma", () => {
    const tile = draw(rows(["FY2022 PF", "3000"], ["FY2021", "2500"], ["FY2020", "2400"]));
    const spark = sparkOf(tile, "FY2020");
    expect(spark.querySelectorAll("line[data-gap]")).toHaveLength(1);
    expect(
      [...spark.querySelectorAll("path")].map((path) => path.getAttribute("data-values")),
    ).toEqual(["2400 2500", "3316 3941"]);
    expect(figureOf(tile)).toContain("FY2021 2,500; FY2022 not stated; FY2023 3,316");
  });
  it("draws no sparkline when the drawn period's own sales is not a number", () => {
    const tile = draw(
      setCell(
        rows(["FY2022", "2900"], ["FY2021", "2800"]),
        SCHEDULE,
        0,
        "Net sales",
        "Not supplied: withheld",
      ),
    );
    expect(within(tile).queryByRole("img", { name: /^Power & Control Net sales, FY/ })).toBeNull();
  });
});

// Mutation (not a real handoff): Power & Control sales stated for FY2008, FY2009, FY2010 and FY2022
// (invented) beside the schedule's FY2023 and FY2024. The twelve-year fill does not apply (16 years),
// so a line would bridge FY2010 to FY2022 across eleven unstated years: none is drawn (ruling C5).
describe("SegmentsTile sparkline: years that are not consecutive and cannot be filled (mutation)", () => {
  it("draws no sparkline and reads the figure without a series", () => {
    const row = (period: string, sales: string) => [
      "Power & Control",
      period,
      sales,
      "1000",
      "USD millions",
      "-",
      "-",
    ];
    const entry = [
      ["FY2022", "2900"],
      ["FY2010", "2100"],
      ["FY2009", "2000"],
      ["FY2008", "1900"],
    ].reduce(
      (one, [period = "", sales = ""]) => addRow(one, SCHEDULE, row(period, sales)),
      cp1Entry(),
    );
    const tile = draw(entry);
    expect(within(tile).queryByRole("img", { name: /^Power & Control Net sales, FY/ })).toBeNull();
    const said =
      within(tile)
        .getByRole("img", { name: /^Segments, \$m, FY2024 with FY2023/ })
        .getAttribute("aria-label") ?? "";
    expect(said).not.toContain("Net sales: FY");
  });
});

// Mutation (not a real handoff): Power & Control FY2024 net sales is a 400-digit run (invented).
describe("SegmentsTile: a figure too large to be a number (mutation)", () => {
  it("renders the tile, shows that row as words, and tints the other bars as before", () => {
    const huge = "9".repeat(400);
    const tile = draw(setCell(cp1Entry(), SCHEDULE, 0, "Net sales", huge));
    expect(bar(tile, "Power & Control sales")).toBeNull();
    // The row is the words state: the cell as written, no bar, no value.
    const row = byData(tile, "measure", "Power & Control sales");
    expect(row?.querySelector('[data-part="reason"]')?.textContent).toContain("9999");
    expect(row?.querySelector('[data-part="value"]')).toBeNull();
    // Largest drawn bar is now Airframe sales 3809: Airframe 3809/3809 = 1 -> 5; P&C EBITDA 2236/3809 = 0.587 -> 3;
    // Airframe EBITDA 1962/3809 = 0.515 -> 3; Non-aviation sales 190/3809 = 0.05 -> 1.
    const tone = (name: string, step: number) =>
      expect(bar(tile, name)).toHaveClass(`fill-scale-amount-${String(step)}`);
    tone("Airframe sales", 5);
    tone("Power & Control ebitda", 3);
    tone("Airframe ebitda", 3);
    tone("Non-aviation sales", 1);
  });
});
