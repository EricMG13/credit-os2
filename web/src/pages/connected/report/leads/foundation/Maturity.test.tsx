// The first cases read retained TransDigm CP-1 handoffs (outdated evidence: shape and scope only);
// expected values are written out by hand from each `Chart data: debt maturities`. The adversarial
// cases are synthetic, built from the module contract (the CP-1 debt maturities chart table); not a
// real handoff. jsdom measures every figure at 600 px (src/setup.ts); the layouts at the real
// widths (412 px at 1128, 318 px at 390) are tested on `wallLayout` directly.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { entry, section, table } from "../../overview/rows.fixture";
import { cp1Entry, distressedCp1Entry, leadProps, relativeValueCp1Entry } from "../fixtures/load";
import { citesSource, MaturityTile } from "./Maturity";
import { wallLayout, type WallSlot } from "./maturityGeometry";

afterEach(cleanup);

const HEADERS = ["Period", "Debt maturing", "Reporting unit", "Basis and limitation"];

function wall(
  rows: string[][],
  charts = [{ title: "Debt maturities", table: 10, unit: "US$m", columns: [1] }],
  basis = "Unaudited.",
) {
  return entry("CP-1", charts, [
    section(
      "Chart data: debt maturities",
      9,
      table(
        10,
        HEADERS,
        rows.map((row) => [...row, "US$m", basis]),
      ),
    ),
  ]);
}

const draw = (data: ReturnType<typeof wall>) => {
  render(<MaturityTile lead={leadProps(data)} />);
  return screen.getByRole("region", { name: "Debt maturities" });
};
const num = (element: Element | null | undefined, name: string) =>
  Number(element?.getAttribute(name));
const bar = (tile: HTMLElement, label: string) => tile.querySelector(`[data-bar="${label}"]`);
const gap = (tile: HTMLElement, reason: string) =>
  [...tile.querySelectorAll("[data-gap]")].find((el) => el.getAttribute("data-gap") === reason);

describe("MaturityTile on the accepted handoff", () => {
  it("is titled plainly and names the unit in the kicker", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getByRole("heading", { name: "Debt maturities" })).toBeVisible();
    expect(within(tile).getByText("Debt maturities · US$m")).toBeVisible();
  });
  it("draws at the measured width: a viewBox of real pixels", () => {
    const tile = draw(cp1Entry());
    const svg = within(tile).getByRole("img");
    expect(svg).toHaveAttribute("width", "100%");
    expect(svg.getAttribute("viewBox")).toMatch(/^0 0 600 \d+$/);
    expect(svg.getAttribute("data-layout")).toBe("columns");
  });
  it("draws each dated bar in proportion on a year axis and the undated bucket after a break", () => {
    const tile = draw(cp1Entry());
    expect(num(bar(tile, "FY2028"), "height") / num(bar(tile, "FY2029"), "height")).toBeCloseTo(
      6637 / 4768,
      6,
    );
    expect(num(bar(tile, "FY2025"), "height") / num(bar(tile, "FY2028"), "height")).toBeCloseTo(
      580 / 6637,
      6,
    );
    // The undated bar is inset by 0.75 on each side for its stroke.
    expect(
      (num(bar(tile, "Thereafter"), "height") + 1.5) / num(bar(tile, "FY2028"), "height"),
    ).toBeCloseTo(12637 / 6637, 6);
    const slot = num(bar(tile, "FY2026"), "x") - num(bar(tile, "FY2025"), "x");
    expect(num(bar(tile, "FY2029"), "x") - num(bar(tile, "FY2028"), "x")).toBeCloseTo(slot, 6);
    expect(num(bar(tile, "Thereafter"), "x") - num(bar(tile, "FY2029"), "x")).toBeGreaterThan(
      slot + 10,
    );
    expect(tile.querySelector("[data-axis-break]")).not.toBeNull();
  });
  it("draws the two small years at the 2 px minimum, with no note about it", () => {
    const tile = draw(cp1Entry());
    expect(num(bar(tile, "FY2026"), "height")).toBe(2);
    expect(num(bar(tile, "FY2027"), "height")).toBe(2);
    expect(num(bar(tile, "FY2025"), "height")).toBeGreaterThan(2);
    expect(tile.textContent).not.toMatch(/2 px minimum/);
  });
  it("prints no bracket, no sum and no ranking (ruling i)", () => {
    const tile = draw(cp1Entry());
    expect(tile.querySelector("[data-bracket]")).toBeNull();
    expect(tile.textContent).not.toMatch(/764|deriv|largest|before FY2028|only|wall of/i);
  });
  it("says every amount in the aria-label, and nothing else", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getByRole("img").getAttribute("aria-label")).toBe(
      "Debt maturities, US$m: FY2025 580, FY2026 92, FY2027 92, FY2028 6,637, FY2029 4,768, Thereafter 12,637.",
    );
  });
  it("draws all SVG text at 11 px or more", () => {
    const tile = draw(cp1Entry());
    for (const text of tile.querySelectorAll("svg text"))
      expect(Number(text.getAttribute("font-size"))).toBeGreaterThanOrEqual(11);
  });
  it("has one trace control, the full-wall link at a 32 px target, a table view, and no citation", () => {
    const tile = draw(cp1Entry());
    expect(within(tile).getAllByRole("link", { name: /^Source for / })).toHaveLength(1);
    const full = within(tile).getByRole("link", { name: "Full wall on Overview" });
    expect(full).toHaveAttribute("href", "#overview");
    expect(full.className).toMatch(/min-h-8/);
    expect(full.className).toMatch(/max-\[480px\]:min-h-11/);
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const rows = within(within(tile).getByRole("table"))
      .getAllByRole("row")
      .map((row) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent));
    expect(rows).toEqual([
      ["Period", "Amount"],
      ["FY2025", "580"],
      ["FY2026", "92"],
      ["FY2027", "92"],
      ["FY2028", "6,637"],
      ["FY2029", "4,768"],
      ["Thereafter", "12,637"],
    ]);
    // Every basis note of this table cites a page ("Annual p153"): none is drawn.
    expect(tile.textContent).not.toMatch(/p153|p144|Annual p/);
  });
});

describe("MaturityTile on the other retained handoffs", () => {
  it("does not draw the relative value note that cites the annual Form 10-K", () => {
    const tile = draw(relativeValueCp1Entry());
    expect(tile.textContent).not.toMatch(/10-K|debt note|Source long-term/);
    expect(
      within(tile).getByText("subordinated November 2027 maturity falls in FY2028."),
    ).toBeVisible();
    expect(tile.textContent).not.toMatch(/2 px minimum/);
    expect(within(tile).getByRole("img").getAttribute("aria-label")).toBe(
      "Debt maturities, US$m: FY2025 93, FY2026 92, FY2027 92, FY2028 6,637, FY2029 4,768, Thereafter 12,637.",
    );
  });
  it("draws no distressed note that cites a calculation or filing page", () => {
    const tile = draw(distressedCp1Entry());
    expect(tile.textContent).not.toMatch(/C10|page|filing/i);
    expect(num(bar(tile, "FY2025"), "height") / num(bar(tile, "FY2028"), "height")).toBeCloseTo(
      580 / 6637,
      6,
    );
  });
});

describe("citesSource", () => {
  it("treats a named filing as a source reference, beside the library's own", () => {
    expect(citesSource("excludes finance leases; annual Form 10-K debt note.")).toBe(true);
    expect(citesSource("from the 10-Q")).toBe(true);
    expect(citesSource("per the annual report")).toBe(true);
    expect(citesSource("as the prospectus states")).toBe(true);
    expect(citesSource("Annual p153; excludes finance leases.")).toBe(true);
    expect(citesSource("Calculated at debt-table precision, C10.")).toBe(true);
    expect(citesSource("Same schedule and exclusions.")).toBe(false);
    expect(citesSource("Fiscal, not calendar year.")).toBe(false);
  });
});

describe("MaturityTile states (synthetic, from the module contract)", () => {
  it("draws a stated gap as a hatched slot with its reason", () => {
    const tile = draw(
      wall([
        ["FY2025", "100"],
        ["FY2026", "Not supplied: refinancing terms pending"],
        ["FY2027", "300"],
      ]),
    );
    expect(bar(tile, "FY2026")).toBeNull();
    expect(gap(tile, "FY2026: Not supplied: refinancing terms pending")).toBeDefined();
    expect(within(tile).getByText("FY2026: refinancing terms pending.")).toBeVisible();
    expect(within(tile).getByText("Not supplied", { selector: "span" })).toBeVisible();
  });
  it("keeps a year with no row on the axis as a gap slot, never zero", () => {
    const tile = draw(
      wall([
        ["FY2025", "100"],
        ["FY2027", "300"],
      ]),
    );
    expect(gap(tile, "FY2026: No row read")).toBeDefined();
    expect(
      within(tile).getByText("FY2026: this page could not read a row for this year."),
    ).toBeVisible();
    const slot = num(bar(tile, "FY2027"), "x") - num(bar(tile, "FY2025"), "x");
    expect(slot).toBeGreaterThan(0);
  });
  it("keeps a stated zero as a value: no height, labelled 0", () => {
    const tile = draw(
      wall([
        ["FY2025", "0"],
        ["FY2026", "300"],
      ]),
    );
    expect(num(bar(tile, "FY2025"), "height")).toBe(0);
    expect(within(tile).getByRole("img").getAttribute("aria-label")).toContain("FY2025 0,");
    expect(tile.textContent).not.toMatch(/2 px minimum/);
  });
  it("keeps a reason that names a source in Evidence", () => {
    const tile = draw(
      wall([
        ["FY2025", "100"],
        ["FY2026", "Not supplied: see the annual report"],
      ]),
    );
    expect(within(tile).getByText("FY2026: Detail is in Evidence.")).toBeVisible();
    expect(tile.textContent).not.toMatch(/annual report/);
  });
  it("draws the one gap pattern for a period stated twice, no amount, or no table", () => {
    let tile = draw(
      wall([
        ["FY2026", "100"],
        ["2026", "200"],
      ]),
    );
    expect(tile.textContent).toBe(
      "Debt maturities · US$mThis page could not read the maturity wall because 2026 appears more than once.",
    );
    cleanup();
    // No amount and no reason stated: the page's own words.
    tile = draw(wall([["FY2026", "n/a"]]));
    expect(tile.textContent).toBe(
      "Debt maturities · US$mThis page could not read an amount for any period of the maturity wall.",
    );
    cleanup();
    tile = draw(wall([["FY2026", "1"]], []));
    expect(tile.textContent).toBe("Debt maturitiesThis page could not read the debt maturities.");
    expect(tile.className).not.toMatch(/gap-hatch/);
  });
});

describe("MaturityTile: every amount is a stated gap", () => {
  const REASON = "Not supplied: maturity note not in the filing read";
  it("prints the module's own reason once when every period states the same one", () => {
    const tile = draw(
      wall([
        ["FY2025", REASON],
        ["FY2026", REASON],
        ["FY2027", REASON],
      ]),
    );
    expect(tile.textContent).toBe(`Debt maturities · US$m${REASON}.`);
    expect(tile.textContent).not.toMatch(/could not read an amount/);
    expect(tile.querySelector("svg")).toBeNull();
  });
  it("prints each distinct reason once with its periods when they differ", () => {
    const tile = draw(
      wall([
        ["FY2025", REASON],
        ["FY2026", "Not supplied: refinancing terms pending"],
        ["FY2027", REASON],
      ]),
    );
    expect(tile.textContent).toBe(
      `Debt maturities · US$mFY2025, FY2027: ${REASON}. FY2026: Not supplied: refinancing terms pending.`,
    );
  });
  it("uses the page's wording when one period states no reason", () => {
    const tile = draw(
      wall([
        ["FY2025", REASON],
        ["FY2026", "n/a"],
      ]),
    );
    expect(tile.textContent).toBe(
      "Debt maturities · US$mThis page could not read an amount for any period of the maturity wall.",
    );
  });
  it("draws a source dash as the dash", () => {
    const tile = draw(wall([["FY2025", "Not supplied: source dash"]]));
    expect(tile.textContent).toBe("Debt maturities · US$m—");
  });
});

describe("MaturityTile: repeated notes", () => {
  it("prints a note that repeats across rows once, and only what each further row adds", () => {
    const tile = draw(relativeValueCp1Entry());
    const text = tile.textContent;
    expect(text.split("Same schedule and exclusions").length - 1).toBe(1);
    expect(text).toContain("subordinated November 2027 maturity falls in FY2028.");
    expect(text).toContain("not allocated to individual later years.");
  });
  it("prints identical notes once", () => {
    const tile = draw(
      wall(
        [
          ["FY2025", "10"],
          ["FY2026", "20"],
        ],
        undefined,
        "Same basis.",
      ),
    );
    expect(tile.textContent.split("Same basis.").length - 1).toBe(1);
  });
});

describe("wallLayout at the real widths", () => {
  const cell = (text: string) => ({ text, value: Number(text), reason: null });
  const dated: WallSlot[] = [
    ["FY2025", "580"],
    ["FY2026", "92"],
    ["FY2027", "92"],
    ["FY2028", "6637"],
    ["FY2029", "4768"],
  ].map(([label = "", text = ""]) => ({ label, cell: cell(text) }));
  const undated: WallSlot[] = [{ label: "Thereafter", cell: cell("12637") }];
  it("draws columns at 508 px (span 6 at 1128) with every label inside its slot", () => {
    const layout = wallLayout(dated, undated, 508);
    expect(layout.layout).toBe("columns");
    const centres = layout.marks.map((mark) => mark.centre);
    const slot = (centres[1] ?? 0) - (centres[0] ?? 0);
    // "FY2025" and "6,637" at 12 px are under 46 px wide; the slot holds them.
    expect(slot).toBeGreaterThanOrEqual(46);
    expect(layout.marks.at(-1)?.centre ?? 0).toBeLessThan(508 - 30);
  });
  it("draws rows at 412 px, where 12 px labels do not fit a column", () => {
    expect(wallLayout(dated, undated, 412).layout).toBe("rows");
  });
  it("draws rows at 318 px (390 phone), one period per row, on one scale", () => {
    const layout = wallLayout(dated, undated, 318);
    expect(layout.layout).toBe("rows");
    const [first, , , fourth] = layout.marks;
    expect((fourth?.width ?? 0) / (first?.width ?? 1)).toBeCloseTo(6637 / 580, 6);
    expect(layout.breakAt).not.toBeNull();
    for (const mark of layout.marks)
      expect(mark.x + mark.width + 6 + 6 * 12 * 0.6).toBeLessThanOrEqual(318);
  });
});
