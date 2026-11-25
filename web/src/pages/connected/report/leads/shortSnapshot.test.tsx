// Synthetic, built from the module contract (src/deploy_vii/methods/cpl10.md, the Key figures table
// `Measure | Value | Period | Source`; src/deploy_vii/bindings/cpl10.py); not a real handoff —
// unproven on a real run. CP-L10 has never run on a real case.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { leadProps } from "./fixtures/load";
import { readChangeScreen, readKeyFigures } from "./shortSnapshotData";
import { ShortSnapshotLead } from "./shortSnapshot";

afterEach(cleanup);

const HEAD = ["Measure", "Value", "Period", "Source"];
const SOURCE = "Canonical data foundation (CP-1)";
const FIGURES = [
  ["Total leverage", "6.1x", "FY2024", SOURCE],
  ["Total leverage", "5.6x", "FY2023", SOURCE],
  ["Net leverage", "5.0x", "FY2024", SOURCE],
  ["Interest coverage", "2.30x", "FY2024", SOURCE],
  ["Liquidity", "USD 1,200m", "FY2024", SOURCE],
  ["Liquidity", "USD 1,050m", "FY2023", SOURCE],
  ["Revenue", "Not supplied: not stated in the filing", "FY2024", SOURCE],
  ["Cash", "0", "FY2024", SOURCE],
  ["Gross debt", "USD 9,000m", "FY2024", SOURCE],
];

function snapshot(figures: string[][] | null = FIGURES, extra: unknown[] = []) {
  return entry(
    "CP-L10",
    [],
    [
      { heading: "Findings", level: 2, line: 3, blocks: [] },
      ...(figures ? [section("Key figures", 10, table(11, HEAD, figures))] : []),
      ...(extra as never[]),
    ],
  );
}

const screenOf = (headers: string[], rows: string[][]) =>
  section("Change screen", 40, table(41, headers, rows));

function figuresOf(rows: string[][]) {
  const read = readKeyFigures(snapshot(rows));
  if (read.state !== "ready") throw new Error(read.reason);
  return read.figures;
}

describe("shortSnapshotData: one rule for a change", () => {
  it("prints the exact change for FY2023 to FY2024 on one unit, with the owner's tone word", () => {
    const [leverage, , , liquidity] = figuresOf(FIGURES);
    expect(leverage).toMatchObject({
      current: { text: "6.1x", period: "FY2024" },
      prior: { text: "5.6x", period: "FY2023" },
      change: { text: "0.5", size: "0.5x", sign: 1, tone: "worse" },
      marks: { prior: 5.6, current: 6.1 },
    });
    expect(liquidity?.change).toMatchObject({ text: "150", size: "USD 150m", tone: "better" });
  });

  it("prints no change between a quarter and a year, a year and an LTM end, or two years apart", () => {
    const figures = figuresOf([
      ["Revenue", "1920", "Q1 2024", SOURCE],
      ["Revenue", "7940", "FY2025", SOURCE],
      ["Net leverage", "4.88x", "FY2024", SOURCE],
      ["Net leverage", "5.10x", "LTM Mar-2025", SOURCE],
      ["Gross debt", "100", "FY2022", SOURCE],
      ["Gross debt", "130", "FY2024", SOURCE],
    ]);
    // Six figures, each with its own period, none paired and none with a change or a tone word.
    expect(figures.map((item) => [item.measure, item.current.period])).toEqual([
      ["Revenue", "Q1 2024"],
      ["Revenue", "FY2025"],
      ["Net leverage", "FY2024"],
      ["Net leverage", "LTM Mar-2025"],
      ["Gross debt", "FY2022"],
      ["Gross debt", "FY2024"],
    ]);
    for (const item of figures) {
      expect(item.prior).toBeNull();
      expect(item.change).toBeNull();
    }
  });

  it("pairs the same quarter or LTM end a year apart, and not different units", () => {
    const figures = figuresOf([
      ["Revenue", "1800", "Q1 2024", SOURCE],
      ["Revenue", "1920", "Q1 2025", SOURCE],
      ["Net leverage", "4.88x", "LTM Mar-2024", SOURCE],
      ["Net leverage", "5.10x", "LTM Mar-2025", SOURCE],
      ["Cash", "10", "FY2023", SOURCE],
      ["Cash", "12x", "FY2024", SOURCE],
    ]);
    expect(figures[0]?.change).toMatchObject({ text: "120", size: "120" });
    expect(figures[1]?.change).toMatchObject({ text: "0.22", size: "0.22x" });
    // Cash: paired as periods a year apart, but "10" and "12x" are not one unit: no change.
    expect(figures[2]).toMatchObject({ prior: { text: "10" }, change: null });
  });

  it("draws no change for a figure not stated, and reads a stated zero as a value with no change", () => {
    const figures = figuresOf([
      ["Cash", "Not supplied: not stated", "FY2024", SOURCE],
      ["Cash", "10", "FY2023", SOURCE],
      ["Debt", "0", "FY2024", SOURCE],
      ["Debt", "0", "FY2023", SOURCE],
    ]);
    expect(figures[0]).toMatchObject({ prior: { text: "10" }, change: null });
    expect(figures[1]).toMatchObject({
      current: { kind: "value", text: "0" },
      change: { sign: 0 },
    });
  });

  it("says the true condition, without naming any column, when the table is absent, repeated or empty", () => {
    const gap = readKeyFigures(snapshot(null));
    expect(gap.state === "gap" && gap.reason).toBe("This page could not read the key figures.");
    const twice = readKeyFigures(
      snapshot(FIGURES, [section("Key figures again", 30, table(31, HEAD, FIGURES))]),
    );
    expect(twice.state === "gap" && twice.reason).toContain("more than once");
    const empty = readKeyFigures(snapshot([]));
    for (const result of [gap, twice, empty])
      expect(JSON.stringify(result)).not.toMatch(/Measure|Value|Period|Source|column|handoff/);
  });

  it("reads a change screen only from Topic, Prior and Current, and strips an inline [E3] marker", () => {
    expect(readChangeScreen(snapshot())).toBeNull();
    const ok = readChangeScreen(
      snapshot(FIGURES, [
        screenOf(
          ["Topic", "Prior", "Current", "Direction", "Change"],
          [
            [
              "Liquidity",
              "1,050",
              "1,200",
              "Up",
              "Liquidity rose [E3] and stayed there [E12, E14].",
            ],
          ],
        ),
      ]),
    );
    expect(ok).toMatchObject({
      state: "ready",
      items: [
        {
          topic: "Liquidity",
          prior: "1,050",
          current: "1,200",
          direction: "Up",
          text: "Liquidity rose and stayed there.",
        },
      ],
    });
    const odd = readChangeScreen(
      snapshot(FIGURES, [section("Screen", 40, table(41, ["Topic", "Notes"], [["A", "b"]]))]),
    );
    expect(odd).toMatchObject({ state: "gap" });
    const none = readChangeScreen(
      snapshot(FIGURES, [
        section("Screen", 40, table(41, ["Topic", "Prior", "Current"], [["A", "1", "2"]])),
      ]),
    );
    expect(none).toMatchObject({ state: "ready", items: [{ direction: null, text: null }] });
  });
});

describe("shortSnapshotData: accounting negatives", () => {
  it("reads (3.3x) as -3.3 with its x: the change is -0.4x with no better or worse word, the marks sit at -2.9 and -3.3", () => {
    const [cover] = figuresOf([
      ["Interest cover", "(2.9x)", "FY2023", SOURCE],
      ["Interest cover", "(3.3x)", "FY2024", SOURCE],
    ]);
    expect(cover).toMatchObject({
      current: { text: "(3.3x)", period: "FY2024" },
      prior: { text: "(2.9x)", period: "FY2023" },
      change: { text: "-0.4", size: "0.4x", sign: -1, tone: "none" },
      marks: { prior: -2.9, current: -3.3, suffix: "x" },
    });
  });

  it("gives a multiple no better or worse word when either figure is negative, only for positive pairs", () => {
    const tones = (rows: string[][]) => figuresOf(rows)[0]?.change?.tone;
    const pair = (name: string, a: string, b: string) => [
      [name, a, "FY2023", SOURCE],
      [name, b, "FY2024", SOURCE],
    ];
    expect(tones(pair("Interest cover", "(2.9x)", "(3.3x)"))).toBe("none");
    expect(tones(pair("Total leverage", "4.88x", "(0.5x)"))).toBe("none");
    expect(tones(pair("Net leverage", "(0.5x)", "4.88x"))).toBe("none");
    expect(tones(pair("Total leverage", "0.0x", "0.5x"))).toBe("worse");
    expect(tones(pair("Interest cover", "2.9x", "3.3x"))).toBe("better");
    // A measure that is not a multiple keeps its own rule: free cash flow across zero is still read.
    expect(tones(pair("Free cash flow", "(1,158)", "(1,160)"))).toBe("worse");
  });

  it("reads (1,158) to (1,160) as a change of -2, worse for free cash flow", () => {
    const [fcf] = figuresOf([
      ["Free cash flow", "(1,158)", "FY2023", SOURCE],
      ["Free cash flow", "(1,160)", "FY2024", SOURCE],
    ]);
    expect(fcf).toMatchObject({
      current: { text: "(1,160)" },
      prior: { text: "(1,158)" },
      change: { text: "-2", size: "2", sign: -1, tone: "worse" },
      marks: { prior: -1158, current: -1160 },
    });
  });

  it("prints a percent measure's change in percentage points, a multiple or money in its own unit", () => {
    const [margin, bracket, money] = figuresOf([
      ["Operating margin", "18.4%", "FY2023", SOURCE],
      ["Operating margin", "17.2%", "FY2024", SOURCE],
      ["Net margin", "(2.9%)", "FY2023", SOURCE],
      ["Net margin", "(3.3%)", "FY2024", SOURCE],
      ["Liquidity", "USD 1,050m", "FY2023", SOURCE],
      ["Liquidity", "USD 1,200m", "FY2024", SOURCE],
    ]);
    expect(margin?.change).toMatchObject({ text: "-1.2", size: "1.2 percentage points", sign: -1 });
    expect(bracket?.change).toMatchObject({ size: "0.4 percentage points", sign: -1 });
    expect(money?.change).toMatchObject({ size: "USD 150m", tone: "better" });
  });

  it("writes the percent change as percentage points in the strip and the table view, never as a bare %", () => {
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot([
            ["Operating margin", "18.4%", "FY2023", SOURCE],
            ["Operating margin", "17.2%", "FY2024", SOURCE],
          ]),
        )}
      />,
    );
    const margin = cell("Operating margin, FY2024");
    expect(margin?.querySelector('[data-part="change"]')).toHaveTextContent(
      /^−1\.2 percentage points$/,
    );
    expect(margin?.querySelector("svg")?.getAttribute("aria-label")).toBe(
      "Operating margin: 18.4% in FY2023, 17.2% in FY2024",
    );
    fireEvent.click(screen.getByRole("button", { name: /Table view/ }));
    expect(document.body.textContent).toContain("−1.2 percentage points");
    expect(document.body.textContent).not.toMatch(/−1\.2%/);
  });

  it("keeps the positive control: 2.9x to 3.3x is +0.4x, better", () => {
    const [cover] = figuresOf([
      ["Interest cover", "2.9x", "FY2023", SOURCE],
      ["Interest cover", "3.3x", "FY2024", SOURCE],
    ]);
    expect(cover?.change).toMatchObject({ text: "0.4", size: "0.4x", sign: 1, tone: "better" });
  });

  it("reads the suffix variants (3.3)x and (3.3%) the same way, and gives an unknown measure a direction only", () => {
    const [x, pct, other] = figuresOf([
      ["Interest cover", "(2.9)x", "FY2023", SOURCE],
      ["Interest cover", "(3.3)x", "FY2024", SOURCE],
      ["Net margin", "(2.9%)", "FY2023", SOURCE],
      ["Net margin", "(3.3%)", "FY2024", SOURCE],
      ["Other measure", "(5)", "FY2023", SOURCE],
      ["Other measure", "(9)", "FY2024", SOURCE],
    ]);
    expect(x).toMatchObject({
      change: { text: "-0.4", size: "0.4x", sign: -1, tone: "none" },
      marks: { prior: -2.9, current: -3.3, suffix: "x" },
      current: { text: "(3.3)x" },
    });
    expect(pct).toMatchObject({
      change: { text: "-0.4", size: "0.4 percentage points", sign: -1, tone: "none" },
      marks: { suffix: "%" },
      current: { text: "(3.3%)" },
    });
    expect(other?.change).toMatchObject({ text: "-4", sign: -1, tone: "none" });
  });

  it("draws the ruler without brackets in its ticks, the change as -0.4x with no word, the figures as written", () => {
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot([
            ["Interest cover", "(2.9x)", "FY2023", SOURCE],
            ["Interest cover", "(3.3x)", "FY2024", SOURCE],
            ["Free cash flow", "(1,158)", "FY2023", SOURCE],
            ["Free cash flow", "(1,160)", "FY2024", SOURCE],
          ]),
        )}
      />,
    );
    const cover = document.querySelector('li[data-figure="Interest cover, FY2024"]');
    expect(cover).toHaveTextContent("(3.3x)");
    expect(cover?.querySelector('[data-part="change"]')).toHaveTextContent(/^−0\.4x$/);
    expect(cover).toHaveTextContent("from (2.9x) in FY2023");
    const ticks = [...(cover?.querySelectorAll("svg text") ?? [])].map((t) => t.textContent);
    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) expect(tick).not.toMatch(/[()]/);
    expect(ticks.every((tick) => /^[-−]/.test(tick))).toBe(true);
    const fcf = document.querySelector('li[data-figure="Free cash flow, FY2024"]');
    expect(fcf?.querySelector('[data-part="change"]')).toHaveTextContent(/^−2 worse$/);
    expect(fcf).toHaveTextContent("(1,160)");
  });
});

const cell = (label: string) => document.querySelector(`li[data-figure="${label}"]`);

describe("no source reference in what is drawn", () => {
  it("screens a gap value, its reason and a change-screen cell that name a source", () => {
    const cited = "Not supplied: not in TDG_10-K.htm page 45";
    const read = readKeyFigures(snapshot([["Revenue", cited, "FY2024", SOURCE]]));
    if (read.state !== "ready") throw new Error(read.reason);
    expect(JSON.stringify(read)).not.toMatch(/TDG|10-K|page 45/);
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot(
            [["Revenue", cited, "FY2024", SOURCE]],
            [screenOf(["Topic", "Prior", "Current"], [["Cash", "see C07 in T4.4", "1"]])],
          ),
        )}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Table view/ })[0] as HTMLElement);
    expect(document.body.textContent).not.toMatch(/TDG|10-K|page 45|C07|T4\.4/);
    expect(screen.getAllByText("Detail is in Evidence.").length).toBeGreaterThan(0);
  });
});

describe("ShortSnapshotLead", () => {
  it("draws every figure, nothing hidden behind a count, prior to current where a year apart", () => {
    render(<ShortSnapshotLead {...leadProps(snapshot())} />);
    const tile = screen.getByRole("region", { name: "Key figures" });
    // Nine rows, two of them pairs: seven figures, all drawn.
    expect(tile.querySelectorAll("li[data-figure]")).toHaveLength(7);
    expect(within(tile).queryByText(/more figures? (is|are)/)).toBeNull();
    const leverage = cell("Total leverage, FY2024");
    expect(leverage).toHaveTextContent("6.1x");
    expect(leverage?.querySelector('[data-part="change"]')).toHaveTextContent("+0.5x worse");
    expect(leverage).toHaveTextContent("from 5.6x in FY2023");
    expect(within(leverage as HTMLElement).getByRole("img")).toHaveAccessibleName(
      "Total leverage: 5.6x in FY2023, 6.1x in FY2024",
    );
    expect(cell("Liquidity, FY2024")?.querySelector('[data-part="change"]')).toHaveTextContent(
      "+USD 150m better",
    );
    expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(/^Key figures$/);
  });

  it("draws a pair as a ruler from the earlier to the later figure, never a two-point sparkline", () => {
    render(<ShortSnapshotLead {...leadProps(snapshot())} />);
    const leverage = cell("Total leverage, FY2024");
    expect(leverage?.querySelectorAll("polyline")).toHaveLength(0);
    expect(leverage?.querySelectorAll("circle").length).toBeGreaterThan(0);
    expect(leverage?.querySelectorAll("polygon")).toHaveLength(1);
  });

  it("puts every figure's value on its own line, in the same row of its band, however long its label", () => {
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot([
            ["Interest coverage", "2.30x", "FY2024", SOURCE],
            ["Cash", "1", "FY2024", SOURCE],
            ["Net debt", "Not supplied: not stated", "FY2024", SOURCE],
          ]),
        )}
      />,
    );
    for (const item of document.querySelectorAll("li[data-figure]")) {
      // Four rows in a fixed order: label, value, change line, mark; the subgrid aligns the bands.
      expect(item.children).toHaveLength(4);
      expect(item.className).toContain("grid-rows-subgrid");
      expect(item.children[0]?.tagName).toBe("P");
      expect(item.children[1]?.tagName).toBe("DIV");
    }
    expect(cell("Interest coverage, FY2024")?.children[1]).toHaveTextContent("2.30x");
  });

  it("a single-period figure shows its period and no prior, no ruler and no change", () => {
    render(<ShortSnapshotLead {...leadProps(snapshot())} />);
    const net = cell("Net leverage, FY2024");
    expect(net).toHaveTextContent("5.0x");
    expect(net).not.toHaveTextContent("from");
    expect(net?.querySelector("svg")).toBeNull();
  });

  it("draws a missing figure as the hatched chip with the module's reason, and 'source dash' as a dash", () => {
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot([
            ["Revenue", "Not supplied: not stated in the filing", "FY2024", SOURCE],
            ["Debt", "Not supplied: source dash", "FY2024", SOURCE],
            ["Cash", "0", "FY2024", SOURCE],
          ]),
        )}
      />,
    );
    const revenue = cell("Revenue, FY2024");
    expect(revenue?.querySelector(".gap-hatch")).toHaveTextContent("not stated in the filing");
    expect(cell("Debt, FY2024")?.querySelector("[data-gap]")).toHaveTextContent(/^—$/);
    // A stated zero is a value, not a gap.
    expect(cell("Cash, FY2024")).toHaveTextContent("0");
    expect(cell("Cash, FY2024")?.querySelector(".gap-hatch")).toBeNull();
  });

  it("puts no better or worse word on a measure the owner's table does not know, or where no change is printed", () => {
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot([
            ["Cash", "5", "FY2024", SOURCE],
            ["Cash", "9", "FY2023", SOURCE],
            ["Net leverage", "5.10x", "LTM Mar-2025", SOURCE],
            ["Net leverage", "4.88x", "FY2024", SOURCE],
          ]),
        )}
      />,
    );
    const cash = cell("Cash, FY2024");
    expect(cash?.querySelector('[data-part="change"]')).toHaveTextContent("−4");
    expect(cash).not.toHaveTextContent(/better|worse/);
    expect(cell("Net leverage, LTM Mar-2025")).not.toHaveTextContent(/better|worse/);
    expect(cell("Net leverage, FY2024")).not.toHaveTextContent(/better|worse/);
    expect(cell("Net leverage, FY2024")?.querySelector('[data-part="change"]')).toBeNull();
  });

  it("gives the figure one trace control and a table view, and draws no source column or reference", () => {
    render(<ShortSnapshotLead {...leadProps(snapshot())} />);
    expect(screen.getAllByRole("link", { name: "Source for the key figures" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Table view/ }));
    expect(screen.getByRole("table")).toBeVisible();
    expect(document.body.textContent).not.toMatch(/Canonical data foundation|CP-1|CP-L10/);
  });

  it("draws one plain gap tile when there is no key figures table", () => {
    render(<ShortSnapshotLead {...leadProps(snapshot(null))} />);
    expect(screen.getByText(/This page could not read the key figures\./)).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelectorAll(".gap-hatch")).toHaveLength(1);
  });

  it("draws one figure from a one-row table", () => {
    render(<ShortSnapshotLead {...leadProps(snapshot([["Cash", "5", "FY2024", SOURCE]]))} />);
    const tile = screen.getByRole("region", { name: "Key figures" });
    expect(tile.querySelectorAll("li[data-figure]")).toHaveLength(1);
  });

  it("lists the change screen with a direction word only where the table states one, markers stripped", () => {
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot(FIGURES, [
            screenOf(
              ["Topic", "Prior", "Current", "Direction", "Change"],
              [
                ["Liquidity", "1,050", "1,200", "Up", "Liquidity rose [E3]."],
                ["Maturities", "2026", "2027", "", ""],
              ],
            ),
          ]),
        )}
      />,
    );
    const tile = screen.getByRole("region", { name: "Change screen" });
    const items = within(tile).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("1,050");
    expect(items[0]).toHaveTextContent("Up");
    expect(items[0]).toHaveTextContent("Liquidity rose.");
    expect(tile.textContent).not.toMatch(/\[E\d+\]/);
    expect(items[1]).toHaveTextContent("2026");
    expect(items[1]).not.toHaveTextContent(/Up|Down/);
  });

  it("says why a change screen in another shape is not drawn, and draws none when there is none", () => {
    const { unmount } = render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot(FIGURES, [section("Screen", 40, table(41, ["Topic", "Notes"], [["A", "b"]]))]),
        )}
      />,
    );
    expect(screen.getByText(/could not read the change screen/)).toBeVisible();
    unmount();
    render(<ShortSnapshotLead {...leadProps(snapshot())} />);
    expect(screen.queryByRole("region", { name: "Change screen" })).toBeNull();
  });

  it("a blocked module draws nothing: the frame states it", () => {
    const blocked = entry(
      "CP-L10",
      [],
      [
        { heading: "Findings", level: 2, line: 3, blocks: [] },
        {
          heading: "Bottom line",
          level: 3,
          line: 4,
          blocks: [
            {
              type: "text",
              line: 5,
              end: 5,
              text: "Not assessable: the financial foundation states no figure.",
            },
          ],
        },
      ],
    );
    const { container } = render(<ShortSnapshotLead {...leadProps(blocked)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says nothing derived, never names the module in a kicker, and draws none of the typed figures", () => {
    render(<ShortSnapshotLead {...leadProps(snapshot())} />);
    expect(document.body.textContent).not.toMatch(/derived|the module|from the handoff/i);
    expect(ShortSnapshotLead.draws).toEqual([]);
  });

  it("never doubles a full stop in a reason, a label or the change screen text", () => {
    render(
      <ShortSnapshotLead
        {...leadProps(
          snapshot(
            [
              ["Revenue", "Not supplied: not stated.", "FY2024", SOURCE],
              ["Cash", "5", "FY2023", SOURCE],
              ["Cash", "9", "FY2024", SOURCE],
            ],
            [screenOf(["Topic", "Prior", "Current", "Change"], [["Cash", "5", "9", "Cash rose."]])],
          ),
        )}
      />,
    );
    expect(document.body.textContent).not.toContain("..");
    for (const el of document.querySelectorAll("[aria-label]"))
      expect(el.getAttribute("aria-label"), el.getAttribute("aria-label") ?? "").not.toContain(
        "..",
      );
  });
});
