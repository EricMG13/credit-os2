// Expected values are written out by hand from the retained TransDigm CP-1 handoffs (accepted
// FY2024, relative value draft 1 single period FY2024, distressed draft 1; outdated evidence:
// shape and scope only), not computed by the code under test. The three-period case and the
// edited cells are mutations of the accepted handoff (fixtures/mutations.ts), not real handoffs.
// The ladder is the handoff's own stated rows (ruling i): no plug, no invented end level, no sum.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { containsReference, type OutputEntry } from "../../../publishedReport";
import { cp1Entry, distressedCp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import { dropTable, edited, setLabelled, threePeriodCp1 } from "../fixtures/mutations";
import { CashLadderTile } from "./CashLadder";

afterEach(cleanup);

const CASH = "T4.5 Cash flow statement";

function draw(entry: OutputEntry) {
  render(<CashLadderTile lead={leadProps(entry)} />);
  const tile = screen.getByRole("region", { name: "Cash conversion" });
  const all = (selector: string) => [...tile.querySelectorAll(selector)];
  return { tile, all, svg: tile.querySelector("svg[role='img']") };
}

const num = (element: Element | undefined, name: string) => Number(element?.getAttribute(name));
const spans = (elements: Element[]) =>
  elements.map((bar) => [
    bar.getAttribute("data-label"),
    num(bar, "data-from"),
    num(bar, "data-to"),
  ]);
const parts = (tile: HTMLElement, part: string) =>
  [...tile.querySelectorAll(`[data-part="${part}"]`)].map((node) => node.textContent);

/** Row labels, each wrapped label's lines joined with a space. */
const labels = (tile: HTMLElement) =>
  [...tile.querySelectorAll('[data-part="label"]')].map((label) =>
    [...label.querySelectorAll("tspan")].map((line) => line.textContent).join(" "),
  );

function openTable(tile: HTMLElement) {
  fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
  const table = within(tile).getByRole("table");
  const rows = within(table)
    .getAllByRole("row")
    .map((row) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent));
  return rows;
}

/** Nothing the module did not write: no plug, no end level, no sum, no ratio. */
function expectNoPlug(tile: HTMLElement) {
  const text = `${tile.textContent} ${tile.querySelector("svg")?.getAttribute("aria-label") ?? ""}`;
  for (const banned of [
    /not itemised/i,
    /deriv/i,
    /\+360/,
    /÷/,
    /Other items/i,
    /after acquisitions/i,
    /2,347 \+ 2,038/,
    /2,505/,
  ])
    expect(text).not.toMatch(banned);
}

describe("cash ladder: the accepted CP-1, FY2024 bars and FY2023 beneath", () => {
  it("titles the tile plainly and names the periods in the kicker", () => {
    const { tile } = draw(cp1Entry());
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Cash conversion");
    expect(tile.textContent).toContain("Cash conversion · US$m, FY2024; FY2023 beneath");
    expect(within(tile).getByRole("link", { name: /Source for cash conversion/ })).toBeTruthy();
  });

  it("draws each stated level from zero and each deduction from the bar above it, as written", () => {
    const { tile, all } = draw(cp1Entry());
    // Hand: 4,173 − 1,158 = 3,015; 3,015 − 539 = 2,476; 2,045 − 165 = 1,880;
    // 1,880 − 2,038 = −158; −158 − 2,347 = −2,505 (a bar end, never written).
    expect(spans(all("rect[data-bar]"))).toEqual([
      ["EBITDA (Adjusted)", 0, 4173],
      ["Cash Interest Paid", 4173, 3015],
      ["Cash taxes paid", 3015, 2476],
      ["Net Cash from Operating Activities", 0, 2045],
      ["Capital expenditures", 2045, 1880],
      ["Levered free cash flow", 0, 1880],
      ["Dividends and dividend equivalent payments", 1880, -158],
      ["Discretionary cash flow after distributions", 0, -158],
      ["Acquisition of businesses, net of cash acquired", -158, -2505],
    ]);
    // As written: "1158" paid prints "1,158", never "−1,158"; the module's own "−2,038" stays.
    expect(parts(tile, "value")).toEqual([
      "4,173",
      "1,158",
      "539",
      "2,045",
      "−165",
      "1,880",
      "−2,038",
      "−158",
      "−2,347",
    ]);
    expect(labels(tile)).toContain("Repurchases of common stock");
  });

  // L9. The module writes cash interest and taxes as positive amounts paid ("1158"): the figure
  // prints as written, the fall is geometry (the bar hangs left of the level above) and the row
  // label already says "paid".
  it("prints an amount the module wrote as paid without a sign it did not write", () => {
    const { tile } = draw(cp1Entry());
    expect(parts(tile, "value").slice(1, 3)).toEqual(["1,158", "539"]);
    expect(parts(tile, "prior-value").slice(1, 3)).toEqual(["1,160", "260"]);
    expect(tile.querySelector("svg[role=img]")?.getAttribute("aria-label")).toContain(
      "Cash Interest Paid 1,158",
    );
  });

  it("hangs a paid amount left of the level above although it writes no sign", () => {
    const { all } = draw(cp1Entry());
    const [, interest, taxes] = all("rect[data-bar]");
    expect([num(interest, "data-from"), num(interest, "data-to")]).toEqual([4173, 3015]);
    expect([num(taxes, "data-from"), num(taxes, "data-to")]).toEqual([3015, 2476]);
    expect(num(interest, "x") + num(interest, "width")).toBeCloseTo(
      num(all("rect[data-bar]")[0], "x") + num(all("rect[data-bar]")[0], "width"),
      6,
    );
  });

  it("says where the stated levels do not follow from the steps above, with no number", () => {
    const { tile } = draw(cp1Entry());
    // Hand: taxes end at 2,476 (4,173 − 1,158 − 539) and cash from operations is stated 2,045.
    expect(tile.textContent).toContain(
      "Levels as stated; the steps between them are not all stated.",
    );
    expect(tile.textContent).not.toMatch(/431|plug/);
  });

  it("does not say it where every level follows from the steps above it", () => {
    // Hand: 4,173 − 1,158 − 539 = 2,476 (cash from operations); 2,476 − 165 = 2,311 (free cash flow).
    let entry = setLabelled(
      cp1Entry(),
      CASH,
      "Net Cash from Operating Activities",
      "FY2024",
      "2476",
    );
    entry = setLabelled(entry, CASH, "Levered free cash flow", "FY2024", "2311");
    const { tile } = draw(entry);
    expect(tile.textContent).not.toContain("Levels as stated");
  });

  it("is proportional: one scale for every bar, current and earlier", () => {
    const { all } = draw(cp1Entry());
    const bars = all("rect[data-bar]");
    const perUnit = num(bars[0], "width") / 4173;
    const sizes = [4173, 1158, 539, 2045, 165, 1880, 2038, 158, 2347];
    bars.forEach((bar, at) => {
      expect(num(bar, "width") / (sizes[at] ?? 1)).toBeCloseTo(perUnit, 6);
    });
    const prior = all("rect[data-prior]");
    expect(num(prior[0], "width") / 3395).toBeCloseTo(perUnit, 6);
    // The stated CFO level is drawn where it is stated, not where the deductions above reach.
    const [ebitda, , taxes, cfo] = bars;
    expect(num(cfo, "x")).toBeCloseTo(num(ebitda, "x"), 6);
    expect(num(cfo, "width")).toBeLessThan(num(taxes, "x"));
  });

  it("draws FY2023 beneath as thin bars with its stated figures, walking the same way", () => {
    const { tile, all } = draw(cp1Entry());
    // Hand: 3,395 − 1,160 = 2,235; 2,235 − 260 = 1,975; 1,375 − 139 = 1,236; 1,236 − 38 = 1,198;
    // 1,198 − 762 = 436.
    expect(
      all("rect[data-prior]").map((bar) => [
        bar.getAttribute("data-prior"),
        num(bar, "data-from"),
        num(bar, "data-to"),
      ]),
    ).toEqual([
      ["EBITDA (Adjusted)", 0, 3395],
      ["Cash Interest Paid", 3395, 2235],
      ["Cash taxes paid", 2235, 1975],
      ["Net Cash from Operating Activities", 0, 1375],
      ["Capital expenditures", 1375, 1236],
      ["Levered free cash flow", 0, 1236],
      ["Dividends and dividend equivalent payments", 1236, 1198],
      ["Discretionary cash flow after distributions", 0, 1198],
      ["Acquisition of businesses, net of cash acquired", 1198, 436],
    ]);
    expect(parts(tile, "prior-value")).toEqual([
      "3,395",
      "1,160",
      "260",
      "1,375",
      "−139",
      "1,236",
      "−38",
      "1,198",
      "−762",
    ]);
    expect(parts(tile, "legend-text")).toEqual([
      "FY2024 level",
      "Decrease",
      "Not stated",
      "FY2023",
    ]);
  });

  it("draws the stated repurchase gap as the hatched slot with its reason, never dropped", () => {
    const { tile } = draw(cp1Entry());
    const reason = "— (FY2023 and FY2024)";
    expect(tile.querySelector(`[data-gap="${reason}"] rect`)).not.toBeNull();
    expect(parts(tile, "reason")).toEqual([reason]);
    expect(tile.querySelector('[data-step="Repurchases of common stock"]')).toBeNull();
  });

  it("joins a bar to the next only where the walk continues there", () => {
    const { tile } = draw(cp1Entry());
    const path = tile.querySelector("path.stroke-connector")?.getAttribute("d") ?? "";
    // EBITDA→interest→taxes, CFO→capex→FCF→dividends, after distributions→acquisitions: 6.
    // Not taxes→CFO (2,476 is not 2,045), nor across the repurchase gap.
    expect(path.match(/M/g)).toHaveLength(6);
  });

  it("reads every figure in its aria-label, the earlier in brackets", () => {
    const { svg } = draw(cp1Entry());
    expect(svg?.getAttribute("aria-label")).toBe(
      "Cash conversion, US$m, FY2024, FY2023 in brackets: EBITDA (Adjusted) 4,173 (FY2023 3,395), Cash Interest Paid 1,158, decrease (FY2023 1,160), Cash taxes paid 539, decrease (FY2023 260), Net Cash from Operating Activities 2,045 (FY2023 1,375), Capital expenditures −165, decrease (FY2023 −139), Levered free cash flow 1,880 (FY2023 1,236), Dividends and dividend equivalent payments −2,038, decrease (FY2023 −38), Repurchases of common stock not stated: — (FY2023 and FY2024), Discretionary cash flow after distributions −158 (FY2023 1,198), Acquisition of businesses, net of cash acquired −2,347, decrease (FY2023 −762). Axis starts at −4,000.",
    );
  });

  it("opens the table view from the button: every stated figure as written", () => {
    const { tile } = draw(cp1Entry());
    expect(openTable(tile)).toEqual([
      ["Step", "FY2023", "FY2024", "Kind"],
      ["EBITDA (Adjusted)", "3,395", "4,173", "Level"],
      ["Cash Interest Paid", "1,160", "1,158", "Deduction, as paid"],
      ["Cash taxes paid", "260", "539", "Deduction, as paid"],
      ["Net Cash from Operating Activities", "1,375", "2,045", "Level"],
      ["Capital expenditures", "−139", "−165", "Deduction, signed"],
      ["Levered free cash flow", "1,236", "1,880", "Level"],
      ["Dividends and dividend equivalent payments", "−38", "−2,038", "Deduction, signed"],
      ["Repurchases of common stock", "—", "—", "Deduction, signed"],
      ["Discretionary cash flow after distributions", "1,198", "−158", "Level"],
      ["Acquisition of businesses, net of cash acquired", "−762", "−2,347", "Deduction, signed"],
    ]);
  });

  it("writes no plug, no end level, no sum and no source reference", () => {
    const { tile } = draw(cp1Entry());
    expectNoPlug(tile);
    openTable(tile);
    expectNoPlug(tile);
    expect(containsReference(tile.textContent)).toBe(false);
    expect(tile.textContent).not.toMatch(/CP-1|T4\.5|C\d{2}/);
  });

  it("carries no note on how it is drawn, and no period list when both periods are drawn", () => {
    const { tile } = draw(cp1Entry());
    expect(tile.textContent).not.toContain("Each level is drawn from zero");
    expect(tile.textContent).not.toContain("Drawn:");
  });
});

describe("cash ladder: other real handoffs and mutations", () => {
  it("relative value, one period: bars only, no earlier ticks, its own label forms", () => {
    const { tile, all } = draw(relativeValueCp1Entry());
    expect(tile.textContent).toContain("Cash conversion · US$m, FY2024");
    expect(tile.textContent).not.toContain("beneath");
    expect(all("[data-prior]")).toHaveLength(0);
    expect(spans(all("rect[data-bar]"))).toEqual([
      ["EBITDA (Adjusted)", 0, 4173],
      ["Cash Interest Paid", 4173, 3015],
      ["Cash Taxes Paid", 3015, 2476],
      ["Net Cash from Operating Activities", 0, 2045],
      ["Capital expenditures", 2045, 1880],
      ["Free cash flow, levered after working capital", 0, 1880],
      ["Dividends and dividend equivalent payments", 1880, -158],
      ["Discretionary cash flow after dividends and equivalents", 0, -158],
      ["Acquisition of businesses, net of cash acquired", -158, -2505],
    ]);
    expect(parts(tile, "reason")).toEqual(["—"]);
    expect(parts(tile, "legend-text")).toEqual(["FY2024 level", "Decrease", "Not stated"]);
    expect(openTable(tile)[0]).toEqual(["Step", "FY2024", "Kind"]);
    expectNoPlug(tile);
  });

  it("distressed: its tax label as written; the after-distributions level read from its KPI dashboard", () => {
    const { tile, all } = draw(distressedCp1Entry());
    expect(spans(all("rect[data-bar]")).slice(0, 3)).toEqual([
      ["EBITDA (Adjusted)", 0, 4173],
      ["Cash Interest Paid", 4173, 3015],
      ["Cash taxes paid, net of refunds", 3015, 2476],
    ]);
    // The distressed draft states the after-distributions level only in its KPI dashboard (−158):
    // the data layer reads it from there, so it is drawn as a level, not a gap.
    expect(spans(all("rect[data-bar]")).slice(3)).toEqual([
      ["Net Cash from Operating Activities", 0, 2045],
      ["Capital expenditures", 2045, 1880],
      ["Levered free cash flow", 0, 1880],
      ["Dividends and dividend equivalent payments", 1880, -158],
      ["DCF after cash dividends and equivalents", 0, -158],
      // Acquisitions hang from the stated level above (−158); the bar's end is a drawing position.
      ["Acquisition of businesses, net of cash acquired", -158, -2505],
    ]);
    // Only the repurchase line is a stated gap; nothing is unplaced.
    expect(parts(tile, "reason")).toEqual(["— (FY2023 and FY2024)"]);
    expect(parts(tile, "unplaced")).toEqual([]);
    expectNoPlug(tile);
  });

  // Rewritten to the ruling of 2026-11-25 (was "…drawn, latest first…": FY2024, FY2023, FY2022):
  // the ladders follow the one period order, oldest fiscal year first.
  it("three periods: every stated period is drawn, oldest first; an all-gap period is its gap line", () => {
    const { tile } = draw(threePeriodCp1());
    expect(tile.textContent).not.toContain("table view");
    expect(tile.textContent).toContain("Cash conversion · US$m, FY2022, FY2023, FY2024");
    const ladders = [...tile.querySelectorAll("[data-ladder], [data-ladder-gap]")];
    expect(
      ladders.map(
        (node) => node.getAttribute("data-ladder") ?? node.getAttribute("data-ladder-gap"),
      ),
    ).toEqual(["FY2022", "FY2023", "FY2024"]);
    const first = (period: string) =>
      tile.querySelector(`[data-ladder="${period}"] rect[data-bar]`) ?? undefined;
    expect(num(first("FY2024"), "data-to")).toBe(4173);
    expect(num(first("FY2023"), "data-to")).toBe(3395);
    // No earlier period beneath: each period is its own ladder.
    expect(tile.querySelectorAll("[data-prior]")).toHaveLength(0);
    // FY2022 states only a gap on every row: its reason once, as written, not an empty ladder.
    expect(tile.querySelector("[data-ladder-gap=FY2022]")?.textContent).toBe(
      "FY2022: Not supplied: outside the comparison scope",
    );
    const rows = openTable(tile);
    expect(rows[0]).toEqual(["Step", "FY2022", "FY2023", "FY2024", "Kind"]);
    expect(rows[1]).toEqual([
      "EBITDA (Adjusted)",
      "Not supplied: outside the comparison scope",
      "3,395",
      "4,173",
      "Level",
    ]);
  });

  it("an LTM and a forecast column: a ladder per period, fiscal years, then the LTM, then the forecast", () => {
    // The cash flow statement's FY2024 column is renamed FY2025E and its FY2023 column
    // LTM Jun-2025; EBITDA (Adjusted) still comes from the income statement's FY2023 and FY2024.
    const renamed = edited(cp1Entry(), (table, heading) =>
      heading === "T4.5 Cash flow statement"
        ? {
            ...table,
            headers: table.headers.map((header) =>
              header === "FY2024" ? "FY2025E" : header === "FY2023" ? "LTM Jun-2025" : header,
            ),
          }
        : table,
    );
    const { tile } = draw(renamed);
    expect(tile.textContent).toContain(
      "Cash conversion · US$m, FY2023, FY2024, LTM Jun-2025, FY2025E",
    );
    const ladders = [...tile.querySelectorAll("[data-ladder], [data-ladder-gap]")];
    expect(
      ladders.map(
        (node) => node.getAttribute("data-ladder") ?? node.getAttribute("data-ladder-gap"),
      ),
    ).toEqual(["FY2023", "FY2024", "LTM Jun-2025", "FY2025E"]);
    expect(tile.querySelectorAll("[data-prior]")).toHaveLength(0);
    const rows = openTable(tile);
    expect(rows[0]).toEqual(["Step", "FY2023", "FY2024", "LTM Jun-2025", "FY2025E", "Kind"]);
    expect(rows.find(([step]) => step === "Net Cash from Operating Activities")).toEqual([
      "Net Cash from Operating Activities",
      "Not stated",
      "Not stated",
      "1,375",
      "2,045",
      "Level",
    ]);
  });

  it("a stated tax gap in FY2024 is drawn in place; the steps after it are written, not placed", () => {
    const entry = setLabelled(
      cp1Entry(),
      CASH,
      "Cash taxes paid",
      "FY2024",
      "Not supplied: refund netting unclear",
    );
    const { tile, all } = draw(entry);
    expect(tile.querySelector('[data-gap="Not supplied: refund netting unclear"]')).not.toBeNull();
    expect(spans(all("rect[data-bar]")).slice(0, 3)).toEqual([
      ["EBITDA (Adjusted)", 0, 4173],
      ["Cash Interest Paid", 4173, 3015],
      ["Net Cash from Operating Activities", 0, 2045],
    ]);
    // FY2023's 260 is still drawn beneath the gap slot, from FY2023's own walk.
    const taxes = tile.querySelector('[data-prior="Cash taxes paid"]');
    expect([num(taxes ?? undefined, "data-from"), num(taxes ?? undefined, "data-to")]).toEqual([
      2235, 1975,
    ]);
  });

  it("an FY2023 gap is written beneath with its period and reason", () => {
    const entry = setLabelled(
      cp1Entry(),
      CASH,
      "Capital expenditures",
      "FY2023",
      "Not supplied: restated",
    );
    const { tile } = draw(entry);
    expect(parts(tile, "prior-reason")).toEqual(["FY2023: Not supplied: restated"]);
    // The next earlier level is stated, so the FY2023 walk picks up again there.
    expect(parts(tile, "prior-unplaced")).toEqual([]);
    const fcf = tile.querySelector('[data-prior="Levered free cash flow"]');
    expect(num(fcf ?? undefined, "data-to")).toBe(1236);
  });

  it("words where a number is expected are a gap with the words, never zero", () => {
    const entry = setLabelled(cp1Entry(), CASH, "Capital expenditures", "FY2024", "about 165");
    const { tile } = draw(entry);
    expect(tile.querySelector('[data-gap="about 165"]')).not.toBeNull();
    expect(tile.querySelector('[data-step="Capital expenditures"]')).toBeNull();
  });

  it("a stated zero stays a figure, and a paid amount of zero is not written −0", () => {
    const entry = setLabelled(cp1Entry(), CASH, "Cash taxes paid", "FY2024", "0");
    const { tile } = draw(entry);
    expect(tile.querySelector('[data-step="Cash taxes paid"]')).not.toBeNull();
    expect(parts(tile, "value")[2]).toBe("0");
    expect(tile.textContent).not.toContain("−0");
  });

  it("a negative amount paid (a net refund) is drawn as the rise it is, its figure as written", () => {
    const entry = setLabelled(cp1Entry(), CASH, "Cash taxes paid", "FY2024", "-20");
    const { tile } = draw(entry);
    const taxes = tile.querySelector('[data-step="Cash taxes paid"]') ?? undefined;
    // Hand: 3,015 + 20 = 3,035.
    expect([num(taxes, "data-from"), num(taxes, "data-to")]).toEqual([3015, 3035]);
    expect(parts(tile, "value")[2]).toBe("−20");
    expect(openTable(tile)[3]).toEqual(["Cash taxes paid", "260", "−20", "Deduction, as paid"]);
  });

  it("a step the handoff does not state is a gap row with the reason, not dropped", () => {
    const entry = setLabelled(cp1Entry(), CASH, "Capital expenditures", "Unit", "EUR millions");
    const { tile } = draw(entry);
    // The reason wraps over lines of the drawing, so compare it without the wrapped spaces.
    const reasons = parts(tile, "reason").map((text) => text.replaceAll(" ", ""));
    expect(reasons).toContain(
      "This page could not read capital expenditures because it is in another unit than the other rows.".replaceAll(
        " ",
        "",
      ),
    );
    expect(labels(tile)).toContain("Capital expenditures");
  });

  it("without a cash flow statement: the one gap tile with the true reason", () => {
    render(<CashLadderTile lead={leadProps(dropTable(cp1Entry(), CASH))} />);
    const tile = screen.getByRole("region", { name: "Cash conversion" });
    expect(tile.textContent).toBe(
      "Cash conversionThis page could not read the cash flow statement.",
    );
    expect(tile.querySelector("svg")).toBeNull();
  });
});

describe("cash ladder: nothing stated (round 4b)", () => {
  /** Every numeric cell of every table of the accepted handoff written as a stated gap. */
  const allGap = () =>
    edited(cp1Entry(), (table) => ({
      ...table,
      rows: table.rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell, at) =>
          at >= 1 && /^-?[\d.,]+$/.test(cell) ? "Not supplied: synthetic" : cell,
        ),
      })),
    }));
  it("draws no axis, no plot and no break sentence: the gaps as lines, the table view kept", () => {
    const { tile } = draw(allGap());
    expect(tile.querySelector("svg[role=img]")).toBeNull();
    expect(tile.textContent).not.toMatch(/1\.0|0\.2/);
    expect(tile.querySelectorAll('[data-part="tick"]')).toHaveLength(0);
    expect(tile.textContent).not.toContain("Levels as stated");
    // One chip for the one reason, every label in handoff order beside it.
    const chips = [...tile.querySelectorAll("[data-gap-line]")];
    // Two reasons, so two chips: the synthetic one for every row, and the repurchases' own dash.
    expect(
      [...tile.querySelectorAll("[data-gap-lines] [data-gap]")].map((c) =>
        c.getAttribute("data-gap"),
      ),
    ).toEqual(["Not supplied: synthetic (FY2023 and FY2024)", "— (FY2023 and FY2024)"]);
    const all = chips.map((chip) => chip.getAttribute("data-gap-line")).join("; ");
    for (const label of [
      "Cash Interest Paid",
      "Cash taxes paid",
      "Net Cash from Operating Activities",
      "Capital expenditures",
      "Levered free cash flow",
    ])
      expect(all).toContain(label);
    expect(openTable(tile)[0]).toEqual(["Step", "FY2023", "FY2024", "Kind"]);
  });
  it("lists a stated figure that cannot be placed once per period, and the gaps merged by reason", () => {
    // The proof shape: EBITDA a gap, Cash Interest Paid 125 in both periods, everything else a gap.
    const entry = edited(allGap(), (table, heading) =>
      heading === "T4.5 Cash flow statement"
        ? {
            ...table,
            rows: table.rows.map((row) =>
              row.cells[0] === "Cash Interest Paid"
                ? {
                    ...row,
                    cells: row.cells.map((cell, at) => (at === 1 || at === 2 ? "125" : cell)),
                  }
                : row,
            ),
          }
        : table,
    );
    const { tile } = draw(entry);
    expect(tile.querySelector("svg[role=img]")).toBeNull();
    expect(tile.textContent).not.toMatch(/1\.0|0\.2|not placed:/);
    expect([...tile.querySelectorAll("[data-unplaced]")].map((item) => item.textContent)).toEqual([
      "Cash Interest Paid 125, FY2024: not placed, an earlier step is not stated",
      "Cash Interest Paid 125, FY2023: not placed, an earlier step is not stated",
    ]);
    expect(
      [...tile.querySelectorAll("[data-gap-lines] [data-gap]")].map((c) =>
        c.getAttribute("data-gap"),
      ),
    ).toEqual(["Not supplied: synthetic (FY2023 and FY2024)", "— (FY2023 and FY2024)"]);
    const merged = tile.querySelector("[data-gap-line]")?.getAttribute("data-gap-line") ?? "";
    expect(merged).toContain("Net Cash from Operating Activities");
    expect(merged).toContain("Cash taxes paid");
    expect(merged).not.toContain("Cash Interest Paid");
  });
  it("keeps the Waterfall for one placed level and the steps after it", () => {
    const entry = edited(allGap(), (table, heading) =>
      heading === "T4.5 Cash flow statement"
        ? {
            ...table,
            rows: table.rows.map((row) =>
              row.cells[0] === "Net Cash from Operating Activities"
                ? {
                    ...row,
                    cells: row.cells.map((cell, at) => (at === 1 || at === 2 ? "2000" : cell)),
                  }
                : row,
            ),
          }
        : table,
    );
    const { tile } = draw(entry);
    expect(tile.querySelector("svg[role=img]")).not.toBeNull();
    expect(tile.querySelector("[data-unplaced]")).toBeNull();
  });
});
