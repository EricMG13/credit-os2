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
    expect(within(tile).getByText("Segments · US$m, FY2024")).toBeVisible();
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
    // Sales in plum, EBITDA As Defined in blue, as the mockup.
    expect(pcSales?.getAttribute("class")).toBe("fill-chart-2");
    expect(bar(tile, "Power & Control ebitda")?.getAttribute("class")).toBe("fill-chart-1");
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
    expect(within(tile).getByRole("img").getAttribute("aria-label")).toBe(
      "Segments, US$m, FY2024 with FY2023 beneath. Power & Control: Net sales 3,941 (FY2023 3,316), EBITDA As Defined 2,236 (FY2023 1,866); Airframe: Net sales 3,809 (FY2023 3,094), EBITDA As Defined 1,962 (FY2023 1,547); Non-aviation: Net sales 190 (FY2023 175), EBITDA As Defined 81 (FY2023 71); Unallocated corporate, FY2024: Net sales Not supplied: no separate revenue line; EBITDA As Defined −106 (FY2023 −89).",
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
    expect(within(tile).getByText("Segments · US$m, FY2024")).toBeVisible();
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
    expect(within(tile).getByText("Segments · US$m, FY2024")).toBeVisible();
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
    expect(within(tile).getByText("Segments · US$m, FY2024")).toBeVisible();
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
  it("draws the gap when no segment states an amount for the drawn period", () => {
    let data = cp1Entry();
    for (const row of [0, 1, 2])
      for (const column of ["Net sales", "EBITDA As Defined"])
        data = setCell(data, SCHEDULE, row, column, "Not supplied: withheld");
    const tile = draw(data);
    expect(tile.textContent).toBe(
      "Segments · US$m, FY2024This page could not read an amount for any business unit in FY2024.",
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
    expect(within(tile).getByText("Segments · US$m, LTM Jun-2025")).toBeVisible();
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
