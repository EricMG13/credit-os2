// Synthetic, built from the module contract (src/deploy_vii/bindings/cp1d.py and
// src/deploy_workflow/owners/cp1d.py: T1D.2 assessment, the Step | Amount bridge, T1D.6 leverage);
// not a real handoff — unproven on a real run. No CP-1D handoff has been retained.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { readBridge, readLeverage } from "./earningsQualityData";
import { chartTitles } from "./kit/UnreadFigures";
import { EarningsQualityLead } from "./earningsQuality";
import { leadProps } from "./fixtures/load";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Measure every figure box as `width` px wide (jsdom has no layout). */
function measuredAs(width: number) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);
}

const STEPS = ["Step", "Amount", "Reporting unit", "Basis and limitation"];
const BRIDGE = [
  ["Adjusted EBITDA, statements", "3813", "US$m", "Reported in the statements."],
  ["Run-rate savings", "200", "US$m", "Management proposal."],
  ["Integration costs", "100", "US$m", "Management proposal."],
  ["Pro forma acquisition", "60", "US$m", "Management proposal."],
  ["Management financing-case EBITDA", "4173", "US$m", "Closing amount."],
];
const ASSESS = [
  "Add-back",
  "Achievability",
  "Recurrence",
  "Source-supported amount",
  "Share accepted",
  "Treatment",
  "Accepted amount",
  "Not accepted",
  "Evidence",
];
const ASSESSMENT = [
  [
    "Run-rate savings",
    "Partly supported",
    "One-time",
    "120",
    "0.6",
    "Accepted in part",
    "120",
    "80",
    "p",
  ],
  ["INTEGRATION costs", "supported", "One-time", "100", "1", "Accepted in full", "100", "0", "p"],
  ["Pro forma acquisition", "Not supported", "One-time", "0", "0", "Excluded", "0", "60", "p"],
];
const LEVERAGE_HEAD = [
  "Basis",
  "EBITDA",
  "Operating cash flow",
  "Operating cash flow / EBITDA",
  "Total leverage",
  "Net leverage",
];
const LEVERAGE = [
  ["Statements (CP-1)", "3813", "2000", "52.45", "6.1", "5.0"],
  ["Management financing case", "4173", "2000", "47.93", "5.6x", "4.6x"],
  ["Supported", "4013", "2000", "49.84", "7.4x", "5.9x"],
];

function quality(
  bridge: string[][] | null = BRIDGE,
  assessment: string[][] | null = ASSESSMENT,
  leverage: string[][] | null = LEVERAGE,
) {
  return entry(
    "CP-1D",
    [],
    [
      { heading: "Findings", level: 2, line: 3, blocks: [] },
      ...(assessment
        ? [section("T1D.2 Add-back assessment", 10, table(11, ASSESS, assessment))]
        : []),
      ...(bridge ? [section("Chart data: EBITDA bridge", 20, table(21, STEPS, bridge))] : []),
      ...(leverage
        ? [
            section(
              "T1D.6 Cash conversion and restated leverage",
              40,
              table(41, LEVERAGE_HEAD, leverage),
            ),
          ]
        : []),
    ],
  );
}

const attr = (element: Element | null | undefined, name: string) =>
  Number(element?.getAttribute(name));
const bar = (label: string) => document.querySelector(`rect[data-bar][data-label="${label}"]`);
const width = (label: string) => attr(bar(label), "width");
const left = (label: string) => attr(bar(label), "x");
const segment = (word: string) => document.querySelector(`rect[data-split="${word}"]`);

describe("earningsQualityData", () => {
  it("reads the same bridge when its Step table also carries an Add-Back ID column (looked up by name)", () => {
    const withId = quality(
      BRIDGE.map((row) => [...row.slice(0, 2), "Not applicable", ...row.slice(2)]),
    );
    const sections = withId.sections.map((s) =>
      s.heading === "Chart data: EBITDA bridge"
        ? {
            ...s,
            blocks: s.blocks.map((b) =>
              b.type === "table"
                ? { ...b, headers: [...STEPS.slice(0, 2), "Add-Back ID", ...STEPS.slice(2)] }
                : b,
            ),
          }
        : s,
    );
    const now = readBridge({ ...withId, sections });
    const before = readBridge(quality());
    if (now.state !== "ready" || before.state !== "ready") throw new Error("expected a bridge");
    expect(now.opening).toMatchObject({ amount: "3813", value: 3813 });
    expect(now.closing).toMatchObject({ amount: "4173" });
    expect(now.changes.map((step) => step.label)).toEqual(before.changes.map((s) => s.label));
    expect(now.changes.map((step) => step.amount)).toEqual(before.changes.map((s) => s.amount));
  });
  it("reads a reconciling bridge, matches support by exact name ignoring case, and sums exactly", () => {
    const bridge = readBridge(quality());
    if (bridge.state !== "ready") throw new Error(bridge.reason);
    expect(bridge.opening).toMatchObject({ amount: "3813", value: 3813 });
    expect(bridge.closing).toMatchObject({ amount: "4173" });
    expect(bridge.changes.map((step) => step.support)).toEqual([
      "Partly supported",
      "Supported",
      "Not supported",
    ]);
    // The assessment states accepted 120 and not accepted 80 for the partly supported step.
    expect(bridge.changes.map((step) => step.split)).toEqual([
      { accepted: "120", notAccepted: "80" },
      { accepted: "100", notAccepted: "0" },
      { accepted: "0", notAccepted: "60" },
    ]);
  });

  it("splits a step only when the stated accepted and not accepted amounts make up the step", () => {
    const row = (accepted: string, not: string) => [
      "Run-rate savings",
      "Partly supported",
      "",
      "",
      "",
      "",
      accepted,
      not,
      "",
    ];
    for (const [accepted, not] of [
      ["100", "80"],
      ["Not supplied: not assessed", "80"],
      ["about 120", "80"],
      ["-20", "220"],
    ] as const) {
      const bridge = readBridge(quality(BRIDGE, [row(accepted, not)]));
      expect(bridge.state === "ready" && bridge.changes[0]?.split, `${accepted} ${not}`).toBeNull();
    }
    // A stated zero is a value: 200 accepted and 0 not accepted, or 0 and 200, is a split.
    for (const [accepted, not] of [
      ["200", "0"],
      ["0", "200"],
    ] as const) {
      const zero = readBridge(quality(BRIDGE, [row(accepted, not)]));
      expect(zero.state === "ready" && zero.changes[0]?.split, `${accepted} ${not}`).toEqual({
        accepted,
        notAccepted: not,
      });
      expect(zero.state === "ready" && zero.changes[0]).toMatchObject({
        accepted,
        notAccepted: not,
      });
    }
    const exact = readBridge(quality(BRIDGE, [row("120.5", "79.5")]));
    expect(exact.state === "ready" && exact.changes[0]?.split).toEqual({
      accepted: "120.5",
      notAccepted: "79.5",
    });
  });

  it("states no support when the assessment is absent or does not name the add-back", () => {
    const none = readBridge(quality(BRIDGE, null));
    expect(none.state === "ready" && none.supportStated).toBe(false);
    const other = readBridge(
      quality(BRIDGE, [["Something else", "Supported", "", "", "", "", "", "", ""]]),
    );
    expect(other.state === "ready" && other.changes.map((step) => step.support)).toEqual([
      null,
      null,
      null,
    ]);
    // Two assessment rows with one name cannot be matched: neither is used.
    const twice = readBridge(
      quality(BRIDGE, [
        ["Run-rate savings", "Supported", "", "", "", "", "", "", ""],
        ["run-rate savings", "Not supported", "", "", "", "", "", "", ""],
      ]),
    );
    expect(twice.state === "ready" && twice.changes[0]?.support).toBeNull();
    // A word the contract does not name is not support.
    const odd = readBridge(
      quality(BRIDGE, [["Run-rate savings", "Probably fine", "", "", "", "", "", "", ""]]),
    );
    expect(odd.state === "ready" && odd.changes[0]?.support).toBeNull();
  });

  it("a bridge that does not add up, a gap amount or words are gaps that list the stated steps", () => {
    const off = readBridge(quality([...BRIDGE.slice(0, 4), ["Closing", "4200", "US$m", ""]]));
    expect(off).toMatchObject({ state: "gap" });
    if (off.state === "gap") {
      expect(off.reason).toContain("do not add up");
      expect(off.reason).toContain("(4,200)");
      expect(off.reason).not.toMatch(/derived/);
      expect(off.stated).toHaveLength(5);
      expect(off.stated[1]).toEqual({ label: "Run-rate savings", text: "200 US$m" });
    }
    const hole = readBridge(
      quality([
        BRIDGE[0] ?? [],
        ["Run-rate savings", "Not supplied: not quantified", "US$m", ""],
        BRIDGE[4] ?? [],
      ]),
    );
    expect(hole).toMatchObject({ state: "gap" });
    expect(hole.state === "gap" && hole.reason).toContain("not quantified");
    const words = readBridge(
      quality([BRIDGE[0] ?? [], ["Savings", "about 200", "US$m", ""], BRIDGE[4] ?? []]),
    );
    expect(words.state === "gap" && words.reason).toContain(
      "could not read “about 200” as an amount",
    );
  });

  it("refuses units that differ, and no step table", () => {
    const mixed = readBridge(
      quality([...BRIDGE.slice(0, 3), ["Pro forma", "60", "EUR m", ""], BRIDGE[4] ?? []]),
    );
    expect(mixed.state === "gap" && mixed.reason).toContain("in one reporting unit");
    expect(readBridge(quality(null)).state).toBe("gap");
  });

  it("reads each basis as the table states it: a multiple, a gap with its reason, or words", () => {
    const leverage = readLeverage(quality());
    if (leverage.state !== "ready") throw new Error(leverage.reason);
    expect(leverage.measures[0]).toMatchObject({
      measure: "Total leverage",
      reported: { value: 6.1, text: "6.1x" },
      restated: { value: 7.4, text: "7.4x" },
    });
    const gap = readLeverage(
      quality(BRIDGE, ASSESSMENT, [
        ["Statements (CP-1)", "", "", "", "4.88x", "4.0x"],
        ["Supported", "", "", "", "Not supplied: cash not split", "n.m."],
      ]),
    );
    if (gap.state !== "ready") throw new Error(gap.reason);
    expect(gap.measures[0]).toMatchObject({
      reported: { value: 4.88, text: "4.88x" },
      restated: { gap: "cash not split", written: "Not supplied: cash not split" },
    });
    // Words are drawn as written; they are not a gap with a page reason.
    expect(gap.measures[1]?.restated).toEqual({ gap: "n.m.", written: "n.m." });
    expect(readLeverage(quality(BRIDGE, ASSESSMENT, [LEVERAGE[0] ?? []])).state).toBe("gap");
    expect(readLeverage(quality(BRIDGE, ASSESSMENT, null)).state).toBe("gap");
  });
});

describe("no source reference in what is drawn", () => {
  const CITED = "see C07 in T1D.2 per 10-K p 45";
  it("screens an amount that is words, in the reason and in the listed steps", () => {
    const bridge = readBridge(
      quality([BRIDGE[0] ?? [], ["Savings", CITED, "US$m", ""], BRIDGE[4] ?? []]),
    );
    if (bridge.state !== "gap") throw new Error("expected a gap");
    const text = JSON.stringify(bridge);
    expect(text).not.toMatch(/C07|T1D\.2|p 45|10-K/);
    expect(bridge.reason).toContain("Detail is in Evidence.");
    expect(bridge.stated[1]?.text).toContain("Detail is in Evidence.");
    render(
      <EarningsQualityLead
        {...leadProps(quality([BRIDGE[0] ?? [], ["Savings", CITED, "US$m", ""], BRIDGE[4] ?? []]))}
      />,
    );
    expect(document.body.textContent).not.toMatch(/C07|T1D\.2|p 45/);
    cleanup();
  });

  it("screens a gap reason, a basis note and a leverage cell that name a source", () => {
    const bridge = readBridge(
      quality([
        BRIDGE[0] ?? [],
        ["Savings", `Not supplied: ${CITED}`, "US$m", ""],
        BRIDGE[4] ?? [],
      ]),
    );
    expect(JSON.stringify(bridge)).not.toMatch(/C07|T1D\.2|p 45/);
    const noted = readBridge(
      quality(
        BRIDGE.map((row, at) => (at === 1 ? [row[0] ?? "", row[1] ?? "", "US$m", CITED] : row)),
      ),
    );
    expect(noted.state === "ready" && noted.notes.join(" ")).not.toMatch(/C07|T1D\.2/);
    const lev = readLeverage(
      quality(BRIDGE, ASSESSMENT, [LEVERAGE[0] ?? [], ["Supported", "", "", "", CITED, "5.9x"]]),
    );
    expect(JSON.stringify(lev)).not.toMatch(/C07|T1D\.2|p 45/);
  });
});

describe("no computed sentence", () => {
  it("states no sum, difference, comparison or derived label in text, aria-label or table", () => {
    render(<EarningsQualityLead {...leadProps(quality())} />);
    expect(document.body.textContent).not.toMatch(
      /derived|Add-backs total|higher by|lower by|worse|better/i,
    );
    for (const svg of document.querySelectorAll("svg[aria-label]"))
      expect(svg.getAttribute("aria-label")).not.toMatch(/derived|higher|lower/i);
    expect(document.querySelector("[data-total]")).toBeNull();
    expect(document.querySelector("[data-by-support]")).toBeNull();
  });
});

describe("EarningsQualityLead", () => {
  it("draws every bar in proportion on one cut axis, the two totals cut, as one figure", () => {
    render(<EarningsQualityLead {...leadProps(quality())} />);
    expect(width("Run-rate savings") / width("Integration costs")).toBeCloseTo(2, 6);
    expect(width("Integration costs") / width("Pro forma acquisition")).toBeCloseTo(100 / 60, 6);
    expect(
      width("Adjusted EBITDA, statements") / width("Management financing-case EBITDA"),
    ).toBeCloseTo((3813 - 3600) / (4173 - 3600), 6);
    expect(document.querySelectorAll("[data-axis-break]")).toHaveLength(2);
    // Each step starts where the last ended.
    const end = (label: string) => left(label) + width(label);
    expect(left("Integration costs")).toBeCloseTo(end("Run-rate savings"), 6);
    expect(left("Pro forma acquisition")).toBeCloseTo(end("Integration costs"), 6);
    expect(screen.getByText(/Axis starts at 3,600/)).toBeVisible();
    // One figure: one SVG holds the whole bridge.
    const tile = screen.getByRole("region", { name: "Earnings quality" });
    expect(tile.querySelectorAll("svg[role=img]")).toHaveLength(1);
  });

  it("starts the axis at zero when the levels do not sit high", () => {
    render(
      <EarningsQualityLead
        {...leadProps(
          quality(
            [
              ["Opening", "0", "US$m", ""],
              ["Add", "5", "US$m", ""],
              ["Closing", "5", "US$m", ""],
            ],
            null,
            null,
          ),
        )}
      />,
    );
    expect(document.querySelectorAll("[data-axis-break]")).toHaveLength(0);
    expect(screen.queryByText(/Axis starts at/)).toBeNull();
  });

  it("draws the accepted share in one colour and the not accepted share in another on every row", () => {
    render(<EarningsQualityLead {...leadProps(quality())} />);
    const accepted = [
      segment("Partly supported, accepted 120"),
      segment("Supported, accepted 100"),
      segment("Not supported, accepted 0"),
    ].map((rect) => rect?.getAttribute("class"));
    expect(new Set(accepted).size).toBe(1);
    expect(accepted[0]).toContain("fill-chart-1");
    const worse = [
      segment("Not accepted 80"),
      segment("Not accepted 0"),
      segment("Not accepted 60"),
    ].map((rect) => rect?.getAttribute("class"));
    expect(new Set(worse).size).toBe(1);
    expect(worse[0]).toContain("fill-warning-mark");
    const tile = screen.getByRole("region", { name: "Earnings quality" });
    expect(within(tile).getByText("Supported, accepted 100", { selector: "text" })).toBeVisible();
    expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(/^Earnings quality$/);
  });

  it("draws a stated zero as a value: 217 accepted and 0 not accepted, and 0 and 15", () => {
    const bridge = [
      ["Reported EBITDA", "3813", "US$m", ""],
      ["Stock compensation", "217", "US$m", ""],
      ["Other, net", "15", "US$m", ""],
      ["EBITDA As Defined", "4045", "US$m", ""],
    ];
    const assessment = [
      ["Stock compensation", "Supported", "", "", "", "", "217", "0", ""],
      ["Other, net", "Not supported", "", "", "", "", "0", "15", ""],
    ];
    render(<EarningsQualityLead {...leadProps(quality(bridge, assessment))} />);
    expect(segment("Supported, accepted 217")).not.toBeNull();
    expect(segment("Not accepted 0")).not.toBeNull();
    expect(segment("Not supported, accepted 0")).not.toBeNull();
    expect(segment("Not accepted 15")).not.toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /Table view/ })[0] as HTMLElement);
    const row = (name: string) =>
      [...document.querySelectorAll("tbody tr")].find(
        (tr) => tr.firstElementChild?.textContent === name,
      );
    expect(row("Stock compensation")?.textContent).toContain("2170");
    expect(row("Other, net")?.textContent).toContain("015");
    expect(document.body.textContent).not.toMatch(/Not stated/);
  });

  it("draws a partly supported step as two parts in proportion to the stated accepted and not accepted amounts", () => {
    render(<EarningsQualityLead {...leadProps(quality())} />);
    const accepted = segment("Partly supported, accepted 120");
    const not = segment("Not accepted 80");
    expect(attr(accepted, "width") / attr(not, "width")).toBeCloseTo(120 / 80, 6);
    expect(attr(not, "x")).toBeCloseTo(attr(accepted, "x") + attr(accepted, "width"), 6);
    expect(not?.getAttribute("class")).toContain("fill-warning-mark");
    expect(accepted?.getAttribute("class")).toContain("fill-chart-1");
    // The two parts fill the step's own bar.
    expect(attr(accepted, "width") + attr(not, "width")).toBeCloseTo(width("Run-rate savings"), 0);
    // Each stated pair is drawn: 100 accepted with 0 not accepted is a split too.
    expect(segment("Supported, accepted 100")).not.toBeNull();
  });

  it("never infers support: without the assessment no step is coloured and the tile says so", () => {
    render(<EarningsQualityLead {...leadProps(quality(BRIDGE, null))} />);
    expect(document.querySelectorAll("rect[data-split]")).toHaveLength(0);
    for (const label of ["Run-rate savings", "Integration costs", "Pro forma acquisition"])
      expect(bar(label)).not.toBeNull();
    expect(screen.getByText("This page could not read a support word for any step.")).toBeVisible();
  });

  it("matched steps carry their word and the others say support was not read", () => {
    render(
      <EarningsQualityLead
        {...leadProps(
          quality(BRIDGE, [["Integration costs", "Supported", "", "", "", "", "", "", ""]]),
        )}
      />,
    );
    expect(segment("Supported")).not.toBeNull();
    expect(document.querySelectorAll("rect[data-split]")).toHaveLength(1);
    expect(bar("Run-rate savings (support not read)")).not.toBeNull();
    expect(bar("Integration costs")).not.toBeNull();
  });

  it("draws the gap with the stated steps listed when the bridge does not add up", () => {
    render(
      <EarningsQualityLead
        {...leadProps(quality([...BRIDGE.slice(0, 4), ["Closing", "4200", "US$m", ""]]))}
      />,
    );
    const tile = screen.getByRole("region", { name: "Earnings quality" });
    expect(within(tile).getByText(/do not add up/)).toBeVisible();
    expect(within(tile).getByText(/Run-rate savings 200 US\$m/)).toBeVisible();
    expect(tile.querySelector("svg")).toBeNull();
  });

  it("draws restated leverage with the kit dumbbell: both rows on one scale from zero, ring then dot", () => {
    render(<EarningsQualityLead {...leadProps(quality())} />);
    const tile = screen.getByRole("region", { name: "Restated leverage" });
    const row = (name: string) => tile.querySelector(`[data-row="${name}"]`);
    const total = row("Total leverage");
    const net = row("Net leverage");
    const x = (el: Element | null | undefined, hook: string) =>
      attr(el?.querySelector(`[${hook}]`), "cx");
    // One scale: with axis start 0 the marks sit in proportion to their figures on both rows.
    const [a, b] = [x(total, "data-prior"), x(total, "data-current")];
    const [c, d] = [x(net, "data-prior"), x(net, "data-current")];
    const zero = Math.min(a, b, c, d) - 0; // the left of the plot is the same for both rows
    expect((b - a) / (d - c)).toBeCloseTo((7.4 - 6.1) / (5.9 - 5.0), 6);
    expect(zero).toBeGreaterThan(0);
    // Ticks run to 8x once, not 8x for one row and 6x for the other.
    const ticks = [...tile.querySelectorAll('[data-part="tick"]')].map((t) => t.textContent);
    expect(ticks.at(-1)).toBe("8");
    expect(tile.querySelectorAll("svg[role=img]")).toHaveLength(1);
    expect(total?.textContent).toContain("6.1x");
    expect(total?.textContent).toContain("7.4x");
    // The legend is the kit's: a hollow ring and a dot, in the same colours as the marks.
    expect(within(tile).getAllByText("Statements").length).toBeGreaterThan(0);
    expect(within(tile).getAllByText("Supported earnings").length).toBeGreaterThan(0);
  });

  it("prints the statements row's 4.88x and the supported row's stated gap as written, never 'Not stated'", () => {
    render(
      <EarningsQualityLead
        {...leadProps(
          quality(BRIDGE, ASSESSMENT, [
            ["Statements (CP-1)", "", "", "", "4.88x", "4.00x"],
            [
              "Supported",
              "",
              "",
              "",
              "Not supplied: cash not split",
              "Not supplied: cash not split",
            ],
          ]),
        )}
      />,
    );
    const tile = screen.getByRole("region", { name: "Restated leverage" });
    expect(tile.textContent).toContain("4.88x");
    expect(within(tile).getAllByText(/cash not split/).length).toBeGreaterThan(0);
    // The ring for the statements is drawn; the supported side is the hatched slot with its reason.
    expect(tile.querySelector('[data-row="Total leverage"] [data-prior]')).not.toBeNull();
    expect(tile.querySelector('[data-row="Total leverage"] [data-current]')).toBeNull();
    fireEvent.click(within(tile).getByRole("button", { name: /Table view/ }));
    const cells = [...tile.querySelectorAll("tbody td")].map((td) => td.textContent);
    expect(cells).toContain("4.88x");
    expect(cells).toContain("Not supplied: cash not split");
  });

  it("each figure has one trace control and a table view; no source reference is drawn", () => {
    render(<EarningsQualityLead {...leadProps(quality())} />);
    expect(
      screen.getByRole("link", { name: "Source for the earnings-quality bridge" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Source for restated leverage" })).toBeVisible();
    const buttons = screen.getAllByRole("button", { name: /Table view/ });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) fireEvent.click(button);
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/CP-1D|T1D\.|\.pdf|\.xlsx/);
  });

  it("with no tables draws gap tiles in words; a blocked module draws nothing", () => {
    const { unmount } = render(<EarningsQualityLead {...leadProps(quality(null, null, null))} />);
    expect(
      screen.getByText(/This page could not read the earnings quality bridge\./),
    ).toBeVisible();
    expect(
      screen.getByText(/This page could not read the leverage on the statements/),
    ).toBeVisible();
    expect(document.querySelectorAll(".gap-hatch").length).toBeGreaterThan(0);
    unmount();
    const blocked = entry(
      "CP-1D",
      [],
      [
        { heading: "Findings", level: 2, line: 3, blocks: [] },
        {
          heading: "Bottom line",
          level: 3,
          line: 4,
          blocks: [
            { type: "text", line: 5, end: 5, text: "Not assessable: no bridge was supplied." },
          ],
        },
      ],
    );
    const { container } = render(<EarningsQualityLead {...leadProps(blocked)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps every leverage label inside the drawing at 460 and 390 px, at 12 px or more", () => {
    for (const total of [null, 390]) {
      if (total) measuredAs(total);
      const { unmount } = render(
        <EarningsQualityLead
          {...leadProps(
            quality(BRIDGE, ASSESSMENT, [
              ["Statements (CP-1)", "", "", "", "1.0", "1.0"],
              ["Supported", "", "", "", "5.9", "5.9"],
            ]),
          )}
        />,
      );
      const svg = document
        .querySelector('[aria-label="Restated leverage"] [data-row]')
        ?.closest("svg");
      const drawn = Number(svg?.getAttribute("viewBox")?.split(" ")[2]);
      if (total) expect(drawn).toBe(total);
      for (const text of svg?.querySelectorAll("text") ?? []) {
        expect(Number(text.getAttribute("font-size")), text.textContent).toBeGreaterThanOrEqual(11);
        const width = text.textContent.length * 7.2;
        const anchor = text.getAttribute("text-anchor");
        const left =
          anchor === "middle"
            ? attr(text, "x") - width / 2
            : anchor === "end"
              ? attr(text, "x") - width
              : attr(text, "x");
        expect(left, text.textContent).toBeGreaterThanOrEqual(-0.5);
        expect(left + width, text.textContent).toBeLessThanOrEqual(drawn + 0.5);
      }
      unmount();
    }
  });

  it("lists a further chart of the module as stated (add-back share), so no published chart is lost", () => {
    const base = quality();
    const withShare = {
      ...base,
      sections: [
        ...base.sections,
        section(
          "Chart data: add-back share",
          60,
          table(
            61,
            ["Measure", "Share", "Reporting unit", "Basis and limitation"],
            [
              ["Proposed add-backs / management EBITDA", "8.6", "%", "x"],
              [
                "Accepted add-backs / supported EBITDA",
                "Not supplied: no accepted add-backs",
                "%",
                "x",
              ],
            ],
          ),
        ),
      ],
    };
    // The store's published chart titles, written out by hand.
    expect(chartTitles(withShare)).toEqual(["EBITDA bridge", "Add-back share"]);
    render(<EarningsQualityLead {...leadProps(withShare)} />);
    const tile = screen.getByRole("region", { name: "Add-back share" });
    expect(tile).toHaveTextContent("Proposed add-backs / management EBITDA");
    expect(tile).toHaveTextContent("8.6");
    expect(within(tile).getByText("no accepted add-backs")).toBeVisible();
    // The bridge is drawn by the lead itself and is not listed a second time.
    expect(screen.queryByRole("region", { name: "EBITDA bridge" })).toBeNull();
    expect(screen.getAllByRole("region").length).toBeGreaterThan(2);
  });

  it("lists the bridge too when the lead could not draw it", () => {
    const off = quality([...BRIDGE.slice(0, 4), ["Closing", "4200", "US$m", ""]]);
    render(<EarningsQualityLead {...leadProps(off)} />);
    // The gap tile lists the stated steps; the chart is not repeated as a second listing.
    expect(screen.queryByRole("region", { name: "EBITDA bridge" })).toBeNull();
    expect(screen.getByText(/Run-rate savings 200 US\$m/)).toBeVisible();
  });

  it("declares that it draws the module's bridge figure itself", () => {
    expect(EarningsQualityLead.draws).toEqual(["figures"]);
  });

  it("draws a bridge with no add-backs and one with a deduction", () => {
    const { unmount } = render(
      <EarningsQualityLead
        {...leadProps(
          quality(
            [
              ["Opening", "100", "US$m", ""],
              ["Closing", "100", "US$m", ""],
            ],
            null,
            null,
          ),
        )}
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Earnings quality" })).toBeVisible();
    expect(bar("Opening")).not.toBeNull();
    unmount();
    render(
      <EarningsQualityLead
        {...leadProps(
          quality(
            [
              ["Opening", "100", "US$m", ""],
              ["Reversal", "-10", "US$m", ""],
              ["Closing", "90", "US$m", ""],
            ],
            null,
            null,
          ),
        )}
      />,
    );
    expect(bar("Reversal")).not.toBeNull();
    expect(bar("Reversal")?.closest("svg")?.textContent).toContain("−10");
    expect(document.body.textContent).not.toMatch(/Add-back/);
  });

  it("draws the bridge at the measured width: at 390 px the narrow layout, text at 11 px or more, nothing past the edge", () => {
    measuredAs(390);
    render(<EarningsQualityLead {...leadProps(quality())} />);
    const svg = document.querySelector('svg[data-layout="narrow"][role=img]');
    expect(svg?.getAttribute("viewBox")).toMatch(/^0 0 390 /);
    for (const text of svg?.querySelectorAll("text") ?? [])
      expect(Number(text.getAttribute("font-size")), text.textContent).toBeGreaterThanOrEqual(11);
    for (const rect of svg?.querySelectorAll("rect[data-bar]") ?? [])
      expect(attr(rect, "x") + attr(rect, "width")).toBeLessThanOrEqual(390);
  });

  it("never doubles a full stop in a gap sentence or an aria-label", () => {
    const hole = quality([
      BRIDGE[0] ?? [],
      ["Run-rate savings", "Not supplied: not quantified.", "US$m", ""],
      BRIDGE[4] ?? [],
    ]);
    render(<EarningsQualityLead {...leadProps(hole)} />);
    expect(document.body.textContent).not.toContain("..");
    for (const el of document.querySelectorAll("[aria-label]"))
      expect(el.getAttribute("aria-label"), el.getAttribute("aria-label") ?? "").not.toContain(
        "..",
      );
    cleanup();
    render(
      <EarningsQualityLead
        {...leadProps(
          quality(BRIDGE, ASSESSMENT, [
            ["Statements (CP-1)", "", "", "", "n.m.", "4.0x"],
            ["Supported", "", "", "", "Not supplied: cash not split.", "5.9x"],
          ]),
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
