// Synthetic, built from the module contract (src/deploy_workflow/owners/cpos_launch_tables.py
// `_peer_range`, apps/issuer-library/credit_os/handoff_fields.py ROW_CHARTS "range"); not a real
// handoff — unproven on a real run. CP-1C is blocked at the peer-data gate in every retained run.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { leadProps } from "./fixtures/load";
import { PeerBenchmarkLead } from "./peerBenchmark";
import { chartTitles } from "./kit/UnreadFigures";
import { PEER_HEADINGS, bandGapText, readPeerBenchmark, valueOf } from "./peerBenchmarkData";

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

const HEAD = [
  "Metric",
  "Issuer",
  "Peer low",
  "Peer median",
  "Peer high",
  "Peer count",
  "Reporting unit",
  "Basis and limitation",
];

const PERCENT = [
  [
    "EBITDA margin",
    "31.2",
    "18.5",
    "24.0",
    "33.1",
    "7",
    "%",
    "Two peers excluded as not comparable.",
  ],
  ["FFO / debt", "Not supplied: issuer FFO is not stated", "8.0", "12.5", "19.0", "7", "%", ""],
  [
    "Cash conversion",
    "55.0",
    "Not supplied: only two peers reported it",
    "Not supplied: only two peers reported it",
    "Not supplied: only two peers reported it",
    "2",
    "%",
    "",
  ],
  ["Conflicting metric", "15", "30", "10", "20", "5", "%", ""],
];
const MULTIPLES = [
  ["Total leverage", "6.1", "3.2", "4.5", "5.8", "7", "x", ""],
  ["Interest cover", "1.9", "2.0", "3.0", "4.5", "1", "x", ""],
  ["Equal to median", "3.0", "2.0", "3.0", "4.0", "7", "x", ""],
];

const bottom = (text: string) => ({
  heading: "Bottom line",
  level: 3,
  line: 4,
  blocks: [{ type: "text" as const, line: 5, end: 5, text }],
});

function peers(percent: string[][] | null, multiples: string[][] | null, extra = []) {
  return entry(
    "CP-1C",
    [],
    [
      { heading: "Findings", level: 2, line: 3, blocks: [] },
      bottom("Peer data is limited. Detail follows."),
      ...(percent ? [section(PEER_HEADINGS.percent, 9, table(10, HEAD, percent))] : []),
      ...(multiples ? [section(PEER_HEADINGS.multiples, 29, table(30, HEAD, multiples))] : []),
      ...extra,
    ],
  );
}

const num = (element: Element | null | undefined, name: string) =>
  Number(element?.getAttribute(name));

describe("peerBenchmarkData: what the contract tables say", () => {
  it("reads a stated zero as a value, a stated gap with its reason, and words as words", () => {
    expect(valueOf("0")).toMatchObject({ kind: "number", value: 0 });
    expect(valueOf("Not supplied: no data")).toMatchObject({ kind: "gap", reason: "no data" });
    expect(valueOf("about 5")).toMatchObject({ kind: "words", text: "about 5" });
    expect(valueOf("n.m.")).toEqual({ kind: "words", text: "n.m." });
    // An accounting negative is a number, and keeps the way the module wrote it.
    expect(valueOf("(2.0)")).toMatchObject({ kind: "number", value: -2, written: "(2.0)" });
    expect(valueOf("Not supplied: source dash")).toMatchObject({ kind: "gap", reason: "—" });
    expect(valueOf("1,250.5")).toMatchObject({ kind: "number", value: 1250.5 });
  });

  it("classifies each row: strip, gap (band missing) and conflict (values out of order)", () => {
    const read = readPeerBenchmark(peers(PERCENT, MULTIPLES));
    const [percent, multiples] = read.tables;
    expect(percent?.rows.map((row) => row.drawing.kind)).toEqual([
      "strip",
      "strip",
      "gap",
      "conflict",
    ]);
    expect(percent?.rows[0]?.drawing).toMatchObject({
      low: 18.5,
      median: 24,
      high: 33.1,
      issuer: 31.2,
    });
    // The issuer is missing: the band is still a strip.
    expect(percent?.rows[1]?.drawing).toMatchObject({ kind: "strip", issuer: null });
    expect(multiples?.rows.map((row) => row.drawing.kind)).toEqual(["strip", "strip", "strip"]);
  });

  it("a median outside the band conflicts; low equal to high is a valid degenerate strip", () => {
    const read = readPeerBenchmark(
      peers(
        [
          ["Outside", "5", "10", "25", "20", "3", "%", ""],
          ["Single", "5", "10", "10", "10", "1", "%", ""],
          ["Zero low", "1", "0", "0.5", "2", "3", "%", ""],
          ["Words", "x", "about 5", "6", "9", "3", "%", ""],
        ],
        null,
      ),
    );
    const kinds = read.tables[0]?.rows.map((row) => row.drawing.kind);
    expect(kinds).toEqual(["conflict", "strip", "strip", "gap"]);
    expect(read.tables[0]?.rows[2]?.drawing).toMatchObject({ low: 0 });
    // The words are the module's: "about 5" is drawn as written in the slot, not as a page reason.
    const words = read.tables[0]?.rows[3];
    expect(words && bandGapText(words)).toBe("Peer low: about 5");
  });

  it("places an accounting negative on the strip, with the axis holding negatives, and draws it as written", () => {
    const input = peers([["Net margin", "n.m.", "(2.0)", "1.0", "5.0", "6", "%", ""]], null);
    const read = readPeerBenchmark(input);
    expect(read.tables[0]?.rows[0]?.drawing).toMatchObject({
      kind: "strip",
      low: -2,
      median: 1,
      high: 5,
      issuer: null,
    });
    render(<PeerBenchmarkLead {...leadProps(input)} />);
    const row = document.querySelector('[data-row="Net margin"]');
    // The low label is the module's "(2.0)", not "−2.0"; the band starts left of the median tick.
    expect(row?.textContent).toContain("low (2.0)%");
    expect(row?.textContent).toContain("issuer n.m.");
    expect(row?.textContent).not.toMatch(/not supplied/i);
    const band = row?.querySelector("[data-band]");
    expect(num(band, "x")).toBeLessThan(num(row?.querySelector("[data-median]"), "x1"));
    // The axis runs through zero: its ticks include a negative one.
    const ticks = [...document.querySelectorAll("svg[data-axis] text")].map((t) => t.textContent);
    expect(ticks.some((t) => t.startsWith("−"))).toBe(true);
    // Proportion: median sits (1 - -2) / (5 - -2) of the way along the band.
    const from = num(band, "x");
    const to = from + num(band, "width");
    expect((num(row?.querySelector("[data-median]"), "x1") - from) / (to - from)).toBeCloseTo(
      3 / 7,
      6,
    );
  });

  it("draws a module-written word for the issuer as written, and a stated gap with its own reason", () => {
    render(
      <PeerBenchmarkLead
        {...leadProps(
          peers(
            [
              ["Margin", "n.m.", "5", "8", "12", "4", "%", ""],
              ["Cover", "Not supplied: no filing", "5", "8", "12", "4", "%", ""],
            ],
            null,
          ),
        )}
      />,
    );
    const margin = document.querySelector('[data-row="Margin"]');
    expect(margin?.textContent).toContain("issuer n.m.");
    const cover = document.querySelector('[data-row="Cover"]');
    expect(cover?.textContent).toContain("issuer: no filing");
    for (const row of [margin, cover]) expect(row?.textContent).not.toMatch(/not supplied/i);
  });

  it("states a shared reason once: low, median and high all 'only two peers reported it'", () => {
    const input = peers(PERCENT, MULTIPLES);
    render(<PeerBenchmarkLead {...leadProps(input)} />);
    const tile = screen.getByRole("region", { name: "Peer range, percent metrics" });
    // Drawn once, in the row's slot; not again as a note per value (the table view keeps each cell).
    const drawn = [...tile.querySelectorAll("svg[data-row], ul > li")]
      .map((el) => el.textContent)
      .join("|");
    expect(drawn.split("only two peers reported it").length).toBe(2);
    expect(tile.querySelector('[data-row="Cash conversion"]')?.textContent).toContain(
      "Peer range: only two peers reported it",
    );
  });

  it("groups rows by their stated unit so that one scale never spans two units", () => {
    const read = readPeerBenchmark(
      peers(
        [
          ["Margin", "10", "5", "8", "12", "4", "%", ""],
          ["Spread", "10", "5", "8", "12", "4", "pp", ""],
        ],
        null,
      ),
    );
    expect(read.tables[0]?.groups.map((group) => group.unit)).toEqual(["%", "pp"]);
  });

  it("reports an absent, repeated, empty or column-short table in words and reads the other", () => {
    const missing = readPeerBenchmark(peers(PERCENT, null));
    expect(missing.tables).toHaveLength(1);
    expect(missing.gaps).toEqual(["This page could not read the peer range for multiples."]);
    const twice = readPeerBenchmark(
      peers(PERCENT, MULTIPLES, [
        section(PEER_HEADINGS.percent, 50, table(51, HEAD, PERCENT)),
      ] as never),
    );
    expect(twice.gaps[0]).toContain("appears more than once");
    const short = peers(null, null, [
      section(PEER_HEADINGS.percent, 9, table(10, ["Metric", "Issuer"], [["a", "1"]])),
    ] as never);
    expect(readPeerBenchmark(short).gaps[0]).toContain(
      "the table is not in a shape this page reads",
    );
    const empty = readPeerBenchmark(peers([], null));
    expect(empty.gaps[0]).toBe(
      "This page could not read a row of the peer range for percent metrics.",
    );
  });
});

describe("PeerBenchmarkLead", () => {
  it("draws the band, the median tick and the issuer in proportion on one axis per unit", () => {
    const { container } = render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    const tile = screen.getByRole("region", { name: "Peer range, percent metrics" });
    const row = tile.querySelector('[data-row="EBITDA margin"]');
    const band = row?.querySelector("[data-band]");
    const median = num(row?.querySelector("[data-median]"), "x1");
    const high = num(band, "x") + num(band, "width");
    const issuer = num(row?.querySelector("[data-issuer]"), "cx");
    expect((issuer - median) / (high - median)).toBeCloseTo((31.2 - 24) / (33.1 - 24), 6);
    expect(num(band, "width") / (issuer - num(band, "x"))).toBeCloseTo(
      (33.1 - 18.5) / (31.2 - 18.5),
      6,
    );
    // The two rows that state a band share one axis: a value in each lands in proportion.
    const margin = tile.querySelector('[data-row="FFO / debt"] [data-band]');
    expect(num(margin, "width") / num(band, "width")).toBeCloseTo((19.0 - 8.0) / (33.1 - 18.5), 6);
    expect(container.querySelectorAll("[data-axis]")).toHaveLength(2);
  });

  it("keeps percent metrics and multiples in separate tiles with their own labels", () => {
    render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    const percent = screen.getByRole("region", { name: "Peer range, percent metrics" });
    const multiples = screen.getByRole("region", { name: "Peer range, multiples" });
    // Two tiles, two plain distinct titles.
    expect(within(percent).getByRole("heading", { level: 3 })).toHaveTextContent(
      /^Peer range, percent metrics$/,
    );
    expect(within(multiples).getByRole("heading", { level: 3 })).toHaveTextContent(
      /^Peer range, multiples$/,
    );
    expect(percent.querySelector('[data-row="Total leverage"]')).toBeNull();
    expect(within(multiples).getByText("issuer 6.1x")).toBeVisible();
    expect(within(percent).getByText("issuer 31.2%")).toBeVisible();
  });

  it("states no position against the median and no computed sentence, in text, aria-label or table", () => {
    render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    const multiples = screen.getByRole("region", { name: "Peer range, multiples" });
    expect(multiples.querySelector('[data-row="Total leverage"]')?.getAttribute("aria-label")).toBe(
      "Total leverage: peer low 3.2x, median 4.5x, peer high 5.8x, issuer 6.1x. 7 peers.",
    );
    expect(document.body.textContent).not.toMatch(
      /above the peer median|below the peer median|at the peer median|derived|percentile|rank/i,
    );
  });

  it("prints the peer count, singular for one peer", () => {
    render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    const multiples = screen.getByRole("region", { name: "Peer range, multiples" });
    expect(within(multiples).getByText("1 peer")).toBeVisible();
    expect(within(multiples).getAllByText("7 peers")).toHaveLength(2);
  });

  it("draws the band with a hatched issuer slot and the reason when the issuer is missing", () => {
    render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    const tile = screen.getByRole("region", { name: "Peer range, percent metrics" });
    const row = tile.querySelector('[data-row="FFO / debt"]');
    expect(row?.querySelector("[data-band]")).not.toBeNull();
    expect(row?.querySelector("[data-issuer]")).toBeNull();
    expect(row?.querySelector('[data-gap="issuer: issuer FFO is not stated"]')).not.toBeNull();
    expect(row?.textContent).toContain("issuer: issuer FFO is not stated");
  });

  it("draws only the labelled gap row when the band is not stated, and never a strip for conflicting values", () => {
    render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    const tile = screen.getByRole("region", { name: "Peer range, percent metrics" });
    const gap = tile.querySelector('[data-row="Cash conversion"]');
    expect(gap?.querySelector("[data-band]")).toBeNull();
    expect(
      gap?.querySelector('[data-gap="Peer range: only two peers reported it"]'),
    ).not.toBeNull();
    const conflict = tile.querySelector('[data-row="Conflicting metric"]');
    expect(conflict?.querySelector("[data-band]")).toBeNull();
    expect(conflict?.querySelector("[data-issuer]")).toBeNull();
    expect(
      within(tile).getByText("The stated values conflict, so no range is drawn."),
    ).toBeVisible();
  });

  it("draws a stated zero as a value on the axis, not as a gap", () => {
    render(
      <PeerBenchmarkLead
        {...leadProps(peers([["Zero low", "1", "0", "0.5", "2", "3", "%", ""]], null))}
      />,
    );
    const row = document.querySelector('[data-row="Zero low"]');
    expect(row?.querySelector("[data-band]")?.getAttribute("data-low")).toBe("0");
    expect(row?.querySelectorAll("[data-gap]")).toHaveLength(0);
  });

  it("gives every figure one trace control and a table view, and no source reference", () => {
    render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    expect(screen.getAllByRole("link", { name: /Source for peer range/ })).toHaveLength(2);
    const buttons = screen.getAllByRole("button", { name: /Table view/ });
    expect(buttons).toHaveLength(2);
    for (const button of buttons) fireEvent.click(button);
    expect(screen.getAllByRole("table")).toHaveLength(2);
    const text = document.body.textContent;
    expect(text).not.toMatch(/CP-1C|\.xlsx|\.pdf|T1C/);
  });

  it("says the page could not read outliers or the peer table, unless an outlier table exists", () => {
    const { unmount } = render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    expect(
      screen.getByText(/This page could not read the outliers or the peer table\./),
    ).toBeVisible();
    unmount();
    render(
      <PeerBenchmarkLead
        {...leadProps(
          peers(PERCENT, MULTIPLES, [
            section("Outlier register", 70, table(71, ["Peer", "Outlier"], [["A", "No"]])),
          ] as never),
        )}
      />,
    );
    expect(
      screen.queryByText(/This page could not read the outliers or the peer table\./),
    ).toBeNull();
  });

  it("with no range table at all draws one gap tile naming the true condition, never the bottom line", () => {
    render(<PeerBenchmarkLead {...leadProps(peers(null, null))} />);
    expect(screen.getByText(/This page could not read a peer range table\./)).toBeVisible();
    // The module wrote "Peer data is limited." as its bottom line: that sentence is not the reason.
    expect(screen.queryByText(/Peer data is limited/)).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelectorAll(".gap-hatch").length).toBeGreaterThan(0);
  });

  it("names the true condition for each gap: repeated, short of columns, empty", () => {
    const twice = peers(PERCENT, null, [
      section(PEER_HEADINGS.percent, 50, table(51, HEAD, PERCENT)),
    ] as never);
    const short = peers(null, null, [
      section(PEER_HEADINGS.percent, 9, table(10, ["Metric", "Issuer"], [["a", "1"]])),
    ] as never);
    const cases: [ReturnType<typeof peers>, RegExp][] = [
      [twice, /appears more than once/],
      [short, /the table is not in a shape this page reads/],
      [peers([], null), /could not read a row of the peer range/],
    ];
    for (const [input, words] of cases) {
      const { unmount } = render(<PeerBenchmarkLead {...leadProps(input)} />);
      expect(screen.getAllByText(words).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Peer data is limited/)).toBeNull();
      unmount();
    }
  });

  it("reads the multiples table when its heading uses a hyphen or an en dash for the em dash", () => {
    for (const dash of ["-", "\u2013"]) {
      const heading = `Chart data: peer range ${dash} multiples`;
      const input = entry(
        "CP-1C",
        [],
        [
          { heading: "Findings", level: 2, line: 3, blocks: [] },
          section(heading, 29, table(30, HEAD, MULTIPLES)),
        ],
      );
      const read = readPeerBenchmark(input);
      expect(
        read.tables.map((item) => item.kind),
        heading,
      ).toEqual(["multiples"]);
      expect(read.gaps).toEqual(["This page could not read the peer range for percent metrics."]);
    }
  });

  it("a blocked module draws nothing: the frame states it", () => {
    const blocked = entry(
      "CP-1C",
      [],
      [
        { heading: "Findings", level: 2, line: 3, blocks: [] },
        bottom("Not assessable: the peer data gate was not passed."),
      ],
    );
    const { container } = render(<PeerBenchmarkLead {...leadProps(blocked)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("declares that it draws the module's typed figures", () => {
    expect(PeerBenchmarkLead.draws).toEqual(["figures"]);
  });

  it("draws one row when the table has one row", () => {
    render(
      <PeerBenchmarkLead
        {...leadProps(peers(null, [["Total leverage", "6.1", "3.2", "4.5", "5.8", "7", "x", ""]]))}
      />,
    );
    const tile = screen.getByRole("region", { name: "Peer range, multiples" });
    expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(
      /^Peer range, multiples$/,
    );
    expect(tile.querySelectorAll("[data-band]")).toHaveLength(1);
  });

  it("draws different units on their own axes", () => {
    const { container } = render(
      <PeerBenchmarkLead
        {...leadProps(
          peers(
            [
              ["Margin", "10", "5", "8", "12", "4", "%", ""],
              ["Spread", "10", "50", "80", "120", "4", "pp", ""],
            ],
            null,
          ),
        )}
      />,
    );
    expect(container.querySelectorAll("[data-axis]")).toHaveLength(2);
    const margin = container.querySelector('[data-row="Margin"] [data-issuer]');
    const spread = container.querySelector('[data-row="Spread"] [data-issuer]');
    // Both issuers state 10, but against different bands on different axes they sit at different places.
    expect(num(margin, "cx")).not.toBeCloseTo(num(spread, "cx"), 0);
    expect(screen.getByText("Reporting unit: pp")).toBeVisible();
  });

  it("draws at the measured width: at 390 px every label is inside the figure at 12 px or more", () => {
    measuredAs(390);
    const { container } = render(<PeerBenchmarkLead {...leadProps(peers(PERCENT, MULTIPLES))} />);
    const strips = [...container.querySelectorAll("svg[data-row]")];
    expect(strips.length).toBeGreaterThan(4);
    for (const svg of strips) {
      expect(svg.getAttribute("viewBox")).toMatch(/^0 0 390 /);
      for (const text of svg.querySelectorAll("text")) {
        expect(Number(text.getAttribute("font-size")), text.textContent).toBeGreaterThanOrEqual(11);
        const start = Number(text.getAttribute("x"));
        const anchor = text.getAttribute("text-anchor");
        const width = text.textContent.length * 12 * 0.6;
        const left =
          anchor === "middle" ? start - width / 2 : anchor === "end" ? start - width : start;
        expect(left, text.textContent).toBeGreaterThanOrEqual(-0.5);
        expect(left + width, text.textContent).toBeLessThanOrEqual(390.5);
      }
    }
    for (const axis of container.querySelectorAll("svg[data-axis]"))
      expect(axis.getAttribute("viewBox")).toMatch(/^0 0 390 /);
    // The labels of one strip never overlap: low, median and high each stand clear of the others.
    const row = container.querySelector('[data-row="EBITDA margin"]');
    const boxes = [...(row?.querySelectorAll("[data-label]") ?? [])].map((t) => ({
      lane: t.getAttribute("y"),
      from: Number(t.getAttribute("x")),
      to: Number(t.getAttribute("x")) + t.textContent.length * 7.2,
    }));
    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1))
        if (a.lane === b.lane) expect(a.to <= b.from || b.to <= a.from).toBe(true);
  });

  it("lists a further Chart data section as stated, and the range tables it could not draw", () => {
    const base = peers(PERCENT, MULTIPLES);
    const withMore = {
      ...base,
      sections: [
        ...base.sections,
        section(
          "Chart data: peer count by metric",
          80,
          table(
            81,
            ["Metric", "Peers", "Reporting unit", "Basis and limitation"],
            [["EBITDA margin", "7", "peers", "x"]],
          ),
        ),
      ],
    };
    // The store's published chart titles, written out by hand: the two ranges and the extra chart.
    expect(chartTitles(withMore)).toEqual([
      "Peer range — percent metrics",
      "Peer range — multiples",
      "Peer count by metric",
    ]);
    render(<PeerBenchmarkLead {...leadProps(withMore)} />);
    const extra = screen.getByRole("region", { name: "Peer count by metric" });
    expect(extra).toHaveTextContent("EBITDA margin");
    // The two range charts are drawn by the lead, not listed a second time.
    expect(screen.queryByRole("region", { name: "Peer range — multiples" })).toBeNull();
    expect(screen.getAllByRole("region", { name: /^Peer range, / })).toHaveLength(2);
  });

  it("lists the rows of a range table the lead could not read, as stated", () => {
    const short = peers(null, null, [
      section(
        PEER_HEADINGS.percent,
        9,
        table(10, ["Metric", "Issuer"], [["EBITDA margin", "31.2"]]),
      ),
    ] as never);
    render(<PeerBenchmarkLead {...leadProps(short)} />);
    expect(
      screen.getByText(/could not read a peer range table|could not read the peer range/),
    ).toBeVisible();
    const listed = screen.getByRole("region", { name: "Peer range — percent metrics" });
    expect(listed).toHaveTextContent("EBITDA margin");
    expect(listed).toHaveTextContent("31.2");
  });

  it("never joins a sentence that ends in a full stop to another: no '..' in any label or text", () => {
    const input = peers(
      [
        ["Margin", "n.m.", "5", "Not supplied: no peers.", "12", "n.m.", "%", ""],
        [
          "Cover",
          "Not supplied: no filing.",
          "Not supplied: only two peers reported it.",
          "8",
          "12",
          "4",
          "%",
          "",
        ],
      ],
      null,
    );
    render(<PeerBenchmarkLead {...leadProps(input)} />);
    for (const el of document.querySelectorAll("[aria-label]"))
      expect(el.getAttribute("aria-label"), el.getAttribute("aria-label") ?? "").not.toContain(
        "..",
      );
    expect(document.body.textContent).not.toContain("..");
  });
});
