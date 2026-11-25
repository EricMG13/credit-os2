import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { FigureRow } from "./FigureRow";
import { outside, struck } from "./svgText.fixture";

afterEach(cleanup);

/** A line by its whole text, where part of it (the change) sits in its own no-wrap span. */
const wholeLine = (content: string) => (_: string, element: Element | null) =>
  element?.tagName === "P" && element.textContent === content;

let line = 100;
const chart = (name: string, headers: string[], ...rows: string[][]): Section => ({
  heading: `Chart data: ${name}`,
  level: 3,
  line: (line += 1),
  blocks: [
    {
      type: "table" as const,
      line: (line += 1),
      headers,
      rows: rows.map((cells) => ({ line: (line += 1), cells })),
    },
  ],
});

const LEVERAGE = ["Period", "Total debt / EBITDA", "Net debt / EBITDA", "Reporting unit", "Basis"];
const REVENUE = ["Period", "Revenue", "Adjusted EBITDA", "Reporting unit", "Basis"];

/** Calendar fiscal years: each starts and ends a year after the one before. */
const CALENDAR = ["2020", "2021", "2022", "2023", "2024"].map((year) => [
  `FY${year}`,
  `${year}-01-01`,
  `${year}-12-31`,
]);
const periodTable = (rows: string[][]): Section => ({
  heading: "Period table",
  level: 3,
  line: 10,
  blocks: [
    {
      type: "table" as const,
      line: 11,
      headers: ["Period", "Start", "End"],
      rows: rows.map((cells, at) => ({ line: 12 + at, cells })),
    },
  ],
});

/**
 * A foundation whose leverage chart has the rows given; the other charts are plain FY2023→FY2024.
 * Its period table states when each period starts and ends (none when `periods` is null).
 */
function foundation(
  leverage: Section,
  extra: Partial<OutputEntry["output"]> = {},
  periods: string[][] | null = CALENDAR,
): OutputEntry {
  return {
    output: {
      id: "CP-1-1",
      module: "CP-1",
      label: "CP-1",
      href: "CP-1.md",
      sha256: "a".repeat(64),
      ...extra,
    },
    sections: [
      ...(periods ? [periodTable(periods)] : []),
      leverage,
      chart(
        "interest cover",
        ["Period", "EBITDA / cash interest", "Reporting unit", "Basis"],
        ["FY2023", "3.20", "x", "Stated."],
        ["FY2024", "4.00", "x", "Stated."],
      ),
      chart(
        "liquidity",
        ["Period", "Cash", "Undrawn committed facilities", "Reporting unit", "Basis"],
        ["FY2023", "300", "450", "US$m", "Stated."],
        ["FY2024", "275", "400", "US$m", "Stated."],
      ),
      chart(
        "revenue and EBITDA",
        REVENUE,
        ["FY2023", "2,100", "410", "US$m", "Stated."],
        ["FY2024", "2,250", "450", "US$m", "Stated."],
      ),
    ],
    selected: true,
  };
}

const run = { folder: "run-1" } as unknown as PublishedRun;
const snapshot = {} as Snapshot;
const view = (entry: OutputEntry) => ({ entries: [entry], models: [] }) as unknown as ReportView;
const draw = (entry: OutputEntry) =>
  render(<FigureRow snapshot={snapshot} run={run} view={view(entry)} />);
const gross = () => screen.getByRole("region", { name: "Total debt / EBITDA" });

describe("the latest figure is the latest period, never the last row", () => {
  it("reads rows written newest first in period order: leverage fell, so it is better", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2024", "4.00", "3.50", "x", "Stated."],
          ["FY2023", "5.00", "4.50", "x", "Stated."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByText("4.00x", { selector: "span" })).toBeVisible();
    expect(within(tile).getByText(wholeLine("from 5.00x in FY2023 (-1.00x)"))).toBeVisible();
    expect(within(tile).getByText("Better")).toBeVisible();
    expect(within(tile).queryByText("Worse")).toBeNull();
    expect(
      within(tile).getByRole("img", {
        name: "Total debt / EBITDA: 5.00x in FY2023, 4.00x in FY2024.",
      }),
    ).toBeVisible();
  });

  it.each([
    ["a period with no year", "First half", "FY2024"],
    ["one year written two ways", "2024", "FY2024"],
    ["a restated year beside the same year", "FY2024 (restated)", "FY2024"],
    ["only a pro forma and a forecast", "PF FY2024", "FY2025E"],
    ["a period that repeats", "FY2024", "FY2024"],
  ])(
    "draws each stated figure with its period as written, and its trace, for %s",
    (_, first, second) => {
      draw(
        foundation(
          chart(
            "leverage",
            LEVERAGE,
            [first, "5.00", "4.50", "x", "Stated."],
            [second, "4.00", "3.50", "x", "Stated."],
          ),
        ),
      );
      const tile = gross();
      expect(within(tile).getByText(`5.00x in ${first}`)).toBeVisible();
      expect(within(tile).getByText(`4.00x in ${second}`)).toBeVisible();
      expect(
        within(tile).getByText(
          "These periods give no single latest reported period, so no latest figure or change is drawn.",
        ),
      ).toBeVisible();
      expect(tile).not.toHaveTextContent(/n\.a\.|Not supplied|Better|Worse|from |-1\.00x/);
      expect(
        within(tile).getByRole("link", { name: "Source for Total debt / EBITDA" }),
      ).toBeVisible();
      expect(within(tile).queryByRole("img")).toBeNull();
    },
  );

  // Owner's ruling, 2026-11-25: every supplied period is drawn in the one period order, and the
  // latest reported figure is never a pro forma or forecast one. Expected values are literals.
  it("draws every period in period order and reads the last twelve months as the latest", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2025E", "3.00", "2.50", "x", "Stated."],
          ["PF LTM Jun 2025", "3.50", "3.00", "x", "Stated."],
          ["FY2023", "5.00", "4.50", "x", "Stated."],
          ["LTM Jun 2025", "4.20", "3.70", "x", "Stated."],
          ["FY2024", "4.60", "4.10", "x", "Stated."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByText("4.20x", { selector: "span" })).toBeVisible();
    expect(tile).not.toHaveTextContent("cannot be put in order");
    expect(
      within(tile).getByRole("img", {
        name: "Total debt / EBITDA: 5.00x in FY2023, 4.60x in FY2024, 4.20x in LTM Jun 2025, 3.50x in PF LTM Jun 2025, 3.00x in FY2025E.",
      }),
    ).toBeVisible();
  });

  it("reads a figure with its unit, a Unicode minus and a padded period", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023 ", "5.0x", "\u22122.0", "x", "Stated."],
          ["FY2024", "4.0x", "\u22121.5", "x", "Stated."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByText("4.0x", { selector: "span" })).toBeVisible();
    expect(within(tile).getByText(wholeLine("from 5.0x in FY2023 (-1.0x)"))).toBeVisible();
    expect(tile).not.toHaveTextContent(/n\.a\.|not one figure/);
    const net = screen.getByRole("region", { name: "Net debt / EBITDA" });
    expect(within(net).getByText("-1.5x", { selector: "span" })).toBeVisible();
    expect(within(net).getByText(wholeLine("from -2.0x in FY2023 (+0.5x)"))).toBeVisible();
  });

  it("calls no leverage change better or worse when either year's ratio is below zero", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "3.00", "(1.0)", "x", "Stated."],
          ["FY2024", "(12.3)", "(3.0)", "x", "Stated."],
        ),
      ),
    );
    for (const name of ["Total debt / EBITDA", "Net debt / EBITDA"]) {
      const tile = screen.getByRole("region", { name });
      expect(tile).not.toHaveTextContent(/Better|Worse/);
      expect(tile.querySelector("[class*='success'], [class*='warning']")).toBeNull();
    }
    expect(within(gross()).getByText(wholeLine("from 3.00x in FY2023 (-15.30x)"))).toBeVisible();
  });

  it("compares only a period whose start and end are both a year earlier, by the period table", () => {
    const rows = [
      ["FY2023", "2022-07-01", "2023-12-31"],
      ["FY2024", "2024-01-01", "2024-12-31"],
    ];
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "5.00", "4.50", "x", "Stated."],
          ["FY2024", "4.00", "3.50", "x", "Stated."],
        ),
        {},
        rows,
      ),
    );
    expect(within(gross()).getByText("No period a year earlier to compare.")).toBeVisible();
    expect(gross()).not.toHaveTextContent(/Better|Worse|-1\.00x/);
  });

  it("draws no change where the period table does not say when the latest period runs", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "5.00", "4.50", "x", "Stated."],
          ["FY2024", "4.00", "3.50", "x", "Stated."],
        ),
        {},
        null,
      ),
    );
    expect(
      within(gross()).getByText(
        "No change is drawn: the period table does not state when FY2024 starts and ends.",
      ),
    ).toBeVisible();
    expect(gross()).not.toHaveTextContent(/Better|Worse|-1\.00x/);
  });

  it("draws no change or chip when the prior period is not a year earlier, and says why", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2022", "5.00", "4.50", "x", "Stated."],
          ["FY2024", "4.00", "3.50", "x", "Stated."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByText("4.00x", { selector: "span" })).toBeVisible();
    expect(within(tile).getByText("No period a year earlier to compare.")).toBeVisible();
    expect(tile).not.toHaveTextContent(/Better|Worse|-1\.00x|from 5\.00x/);
  });

  it("compares dated periods a year apart by their dates", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["2023-09-30", "5.00", "4.50", "x", "Stated."],
          ["2024-03-31", "4.50", "4.00", "x", "Stated."],
          ["2024-09-30", "4.00", "3.50", "x", "Stated."],
        ),
        {},
        [
          ["FY2023", "2022-10-01", "2023-09-30"],
          ["H1 FY2024", "2023-10-01", "2024-03-31"],
          ["FY2024", "2023-10-01", "2024-09-30"],
        ],
      ),
    );
    expect(within(gross()).getByText(wholeLine("from 5.00x in 2023-09-30 (-1.00x)"))).toBeVisible();
  });
});

describe("each figure's basis", () => {
  it("draws the latest basis, and no change or chip across two bases", () => {
    draw(
      foundation(
        chart(
          "leverage",
          [
            "Period",
            "Total debt / EBITDA",
            "Net debt / EBITDA",
            "Reporting unit",
            "Basis and limitation",
          ],
          ["FY2023", "5.00", "4.50", "x", "Reported."],
          ["FY2024", "4.00", "3.50", "x", "Pro forma for the disposal."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByText("Pro forma for the disposal.")).toBeVisible();
    expect(tile).not.toHaveTextContent(/Better|Worse|-1\.00x/);
    expect(
      within(tile).getByText(
        "Not compared with FY2023: the two periods are stated on different bases.",
      ),
    ).toBeVisible();
    for (const name of ["Total debt / EBITDA", "Net debt / EBITDA"]) {
      const mark = within(screen.getByRole("region", { name })).getByRole("img");
      expect(mark.querySelectorAll("[data-segment]")).toHaveLength(0);
    }
  });

  it("links a basis that cites a source to Evidence and prints none of it", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "5.00", "4.50", "x", "As in notes_2024.pdf page 88."],
          ["FY2024", "4.00", "3.50", "x", "As in notes_2024.pdf page 88."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByRole("link", { name: "Read the reason in Evidence" })).toBeVisible();
    expect(tile).not.toHaveTextContent(/notes_2024|page 88/);
    expect(within(tile).getByText("Better")).toBeVisible();
  });

  it("shows the latest figure's period on every small tile", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    for (const name of ["Revenue", "EBITDA / cash interest", "Adjusted EBITDA", "Cash"])
      expect(within(screen.getByRole("region", { name })).getByText("FY2024")).toBeVisible();
  });
});

describe("a period the module did not supply between stated periods", () => {
  const gapped = () =>
    foundation(
      chart(
        "leverage",
        LEVERAGE,
        ["FY2021", "3.20", "2.90", "x", "Stated."],
        ["FY2022", "3.00", "2.70", "x", "Stated."],
        ["FY2023", "Not supplied: restated", "Not supplied: restated", "x", "Stated."],
        ["FY2024", "2.80", "2.25", "x", "Stated."],
      ),
    );

  it("breaks the slope at the gap, marks the gap, and states the period and the reason", () => {
    draw(gapped());
    const tile = gross();
    const mark = within(tile).getByRole("img");
    expect(mark).toHaveAccessibleName(
      "Total debt / EBITDA: 3.20x in FY2021, 3.00x in FY2022, no figure in FY2023, 2.80x in FY2024.",
    );
    expect(mark.querySelectorAll("[data-segment]")).toHaveLength(1);
    expect(mark.querySelectorAll("[data-gap]")).toHaveLength(1);
    expect(within(tile).getByText("FY2023: restated")).toBeVisible();
    expect(tile).not.toHaveTextContent(/Better|Worse/);
  });

  it("breaks the dot strip and the small slope at the gap too", () => {
    const entry = gapped();
    const revenue = entry.sections.find(({ heading }) => heading.endsWith("revenue and EBITDA"))
      ?.blocks[0];
    if (revenue?.type !== "table") throw new Error("fixture");
    revenue.rows = [
      { line: 1, cells: ["FY2021", "1,900", "400", "US$m", "Stated."] },
      { line: 2, cells: ["FY2022", "Not supplied: restated", "405", "US$m", "Stated."] },
      { line: 3, cells: ["FY2023", "2,100", "410", "US$m", "Stated."] },
      { line: 4, cells: ["FY2024", "2,250", "450", "US$m", "Stated."] },
    ];
    draw(entry);
    const net = within(screen.getByRole("region", { name: "Net debt / EBITDA" })).getByRole("img");
    expect(net.querySelectorAll("[data-segment]")).toHaveLength(1);
    expect(net.querySelectorAll("[data-gap]")).toHaveLength(1);
    const tile = screen.getByRole("region", { name: "Revenue" });
    const mini = within(tile).getByRole("img");
    expect(mini.querySelectorAll("[data-segment]")).toHaveLength(1);
    expect(mini.querySelectorAll("[data-gap]")).toHaveLength(1);
    expect(within(tile).getByText("FY2022: restated")).toBeVisible();
  });
});

describe("gap reasons in the reader's words", () => {
  it("names module codes in a gap reason, and links one that cites a source", () => {
    const entry = foundation(
      chart(
        "leverage",
        LEVERAGE,
        ["FY2023", "Not supplied: CP-1C did not reconcile the peer set.", "4.50", "x", "Stated."],
        [
          "FY2024",
          "Not supplied: not stated in notes_2024.pdf page 88 [E3].",
          "3.50",
          "x",
          "Stated.",
        ],
      ),
    );
    draw(entry);
    const tile = gross();
    expect(
      within(tile).getByText("FY2023: Peer benchmark did not reconcile the peer set."),
    ).toBeVisible();
    expect(within(tile).getByText("FY2024: not supplied")).toBeVisible();
    expect(within(tile).getByRole("link", { name: "Read the reason in Evidence" })).toBeVisible();
    expect(tile).not.toHaveTextContent(/CP-1C|notes_2024|E3/);
  });
});

describe("the true reason a figure is not drawn", () => {
  it.each([
    [
      "two matching columns",
      chart(
        "leverage",
        ["Period", "Total debt / EBITDA", "Total debt / EBITDA (pro forma)", "Reporting unit"],
        ["FY2024", "4.00", "3.90", "x"],
      ),
      "The 'leverage' chart table has more than one Total debt / EBITDA column.",
    ],
    [
      "two reporting units",
      chart(
        "leverage",
        LEVERAGE,
        ["FY2023", "5.00", "4.50", "x", "Stated."],
        ["FY2024", "4.00", "3.50", "%", "Stated."],
      ),
      "The 'leverage' chart table states more than one reporting unit.",
    ],
    [
      "no reporting unit",
      chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "", "Stated."]),
      "The 'leverage' chart table states no reporting unit for a period.",
    ],
    [
      "no table",
      chart("covenants", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."]),
      "The financial foundation has no 'leverage' chart table.",
    ],
  ])("states it for %s", (_, leverage, reason) => {
    draw(foundation(leverage));
    expect(within(gross()).getByText(reason)).toBeVisible();
    expect(gross()).not.toHaveTextContent("Not supplied in this run's financial foundation.");
  });

  it("states it for a handoff that could not be read", () => {
    draw(
      foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."]), {
        parseError: "bad table",
      }),
    );
    expect(
      within(gross()).getByText(
        "The financial foundation's output could not be read; it is in Evidence.",
      ),
    ).toBeVisible();
  });
});

describe("mark labels sit clear of the lines", () => {
  const cases = [
    ["FY2023", "3.75", "3.00"],
    ["FY2024", "2.80", "2.25"],
  ];
  it("keeps every dot-strip label off its connector", () => {
    draw(foundation(chart("leverage", LEVERAGE, ...cases.map((row) => [...row, "x", "Stated."]))));
    const mark = within(screen.getByRole("region", { name: "Net debt / EBITDA" })).getByRole("img");
    expect(within(mark).getByText("3.00x")).toBeTruthy();
    expect(struck(mark, "[data-segment]")).toEqual([]);
    expect(outside(mark)).toEqual([]);
  });

  it("keeps every slope label off its line and its gridlines", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2022", "3.10", "2.60", "x", "Stated."],
          ...cases.map((row) => [...row, "x", "Stated."]),
        ),
      ),
    );
    const mark = within(gross()).getByRole("img");
    expect(within(mark).getByText("2.80x")).toBeTruthy();
    expect(struck(mark, "line")).toEqual([]);
    expect(outside(mark)).toEqual([]);
  });
});

describe("the small figure tiles", () => {
  it("draw the better or worse word inline, unboxed, and never break a change after its minus", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    const revenue = screen.getByRole("region", { name: "Revenue" });
    const better = within(revenue).getByText("Better");
    expect(better).toHaveClass("whitespace-nowrap");
    expect(better).not.toHaveClass("border");
    const cash = screen.getByRole("region", { name: "Cash" });
    expect(within(cash).getByText("(-US$25m)")).toHaveClass("whitespace-nowrap");
  });

  it("are tiles with the small head, the title a real h3", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    const cover = screen.getByRole("region", { name: "EBITDA / cash interest" });
    const heading = within(cover).getByRole("heading", {
      level: 3,
      name: "EBITDA / cash interest",
    });
    expect(heading).toHaveClass("text-small");
    expect(cover).not.toHaveClass("lg:col-span-12");
  });

  it("set the two large figures below the bottom line's size", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    expect(within(gross()).getByText("4.00x", { selector: "span" })).toHaveClass("text-metric");
    expect(within(gross()).getByText("4.00x", { selector: "span" })).not.toHaveClass(
      "text-display",
    );
  });
});

describe("the trace control of a tile with no figure", () => {
  it("is drawn only where there is a table row to trace", () => {
    draw(foundation(chart("covenants", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    expect(within(gross()).queryByRole("link", { name: /^Source for / })).toBeNull();
    cleanup();
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "5.00", "4.50", "x", "Stated."],
          ["FY2024", "4.00", "3.50", "%", "Stated."],
        ),
      ),
    );
    expect(
      within(gross()).getByRole("link", { name: "Source for Total debt / EBITDA" }),
    ).toBeVisible();
  });
});

describe("series marks place periods by time", () => {
  it("spaces dated points by their dates", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["2023-12-31", "5.00", "4.50", "x", "Stated."],
          ["2024-03-31", "4.50", "4.00", "x", "Stated."],
          ["2024-12-31", "4.00", "3.50", "x", "Stated."],
        ),
      ),
    );
    const dots = [...within(gross()).getByRole("img").querySelectorAll("circle")].map((dot) =>
      Number(dot.getAttribute("cx")),
    );
    const [first = 0, second = 0, third = 0] = dots;
    expect((second - first) / (third - second)).toBeCloseTo(91 / 275, 2);
  });

  it("leaves a missing year as room on the slope, not an even step", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2021", "5.00", "4.50", "x", "Stated."],
          ["FY2023", "4.50", "4.00", "x", "Stated."],
          ["FY2024", "4.00", "3.50", "x", "Stated."],
        ),
      ),
    );
    const dots = [...within(gross()).getByRole("img").querySelectorAll("circle")].map((dot) =>
      Number(dot.getAttribute("cx")),
    );
    const [first = 0, second = 0, third = 0] = dots;
    expect((second - first) / (third - second)).toBeCloseTo(2, 5);
  });
});

describe("the figure rows' layout", () => {
  it("sizes every mark text by its font-size, at least the ramp's 12, never by a class", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "3.75", "3.00", "x", "Stated."],
          ["FY2024", "2.80", "2.25", "x", "Stated."],
        ),
      ),
    );
    const texts = [...document.querySelectorAll("svg text")];
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      expect(text.getAttribute("class") ?? "").not.toMatch(/text-\[|text-caption|text-mono/);
      expect(Number(text.getAttribute("font-size"))).toBeGreaterThanOrEqual(12);
    }
  });

  it("lets the large tiles and their grid take their content height, not stretch", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    for (const name of ["Total debt / EBITDA", "Net debt / EBITDA"]) {
      const tile = screen.getByRole("region", { name });
      expect(tile).toHaveClass("self-start");
      expect(tile).not.toHaveClass("justify-between");
    }
    expect(screen.getByRole("region", { name: "Revenue" }).parentElement).toHaveClass("self-start");
  });

  it("keeps each small tile's trace in its head row, the title wrapping instead", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    for (const name of ["Revenue", "EBITDA / cash interest", "Adjusted EBITDA", "Cash"]) {
      const tile = screen.getByRole("region", { name });
      const heading = within(tile).getByRole("heading", { level: 3, name });
      const row = heading.parentElement;
      expect(row).not.toHaveClass("flex-wrap");
      expect(heading).toHaveClass("min-w-0");
      const control = within(tile).getByRole("link", { name: `Source for ${name}` });
      expect(row).toContainElement(control);
      expect(control.parentElement).toHaveClass("flex-none");
    }
  });

  it("puts the better or worse word inline after the figure on every small tile", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    for (const name of ["Revenue", "EBITDA / cash interest", "Adjusted EBITDA"]) {
      const word = within(screen.getByRole("region", { name })).getByText(/^(Better|Worse)$/);
      const row = word.parentElement;
      // One placement: the word follows the figure in the same row; the figure itself never breaks.
      expect(row?.firstElementChild).toHaveClass("whitespace-nowrap");
      expect(row?.firstElementChild?.className).toMatch(/font-mono/);
    }
  });
});

describe("cells drawn as the module wrote them", () => {
  it("reads an accounting negative as a figure, drawn as written, with its exact change", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "5.00", "4.50", "x", "Stated."],
          ["FY2024", "4.00", "(1.50)", "x", "Stated."],
        ),
      ),
    );
    const net = screen.getByRole("region", { name: "Net debt / EBITDA" });
    expect(within(net).getByText("(1.50x)", { selector: "span" })).toBeVisible();
    expect(within(net).getByText(wholeLine("from 4.50x in FY2023 (-6.00x)"))).toBeVisible();
    expect(net).not.toHaveTextContent(/Better|Worse/);
    expect(net).not.toHaveTextContent(/n\.a\.|not one figure/);
  });

  it.each(["n.m.", "—"])("draws the module's own word %s as written, not n.a.", (word) => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "5.00", "4.50", "x", "Stated."],
          ["FY2024", word, "3.50", "x", "Stated."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByText(word, { selector: "span" })).toBeVisible();
    expect(within(tile).getByText(`FY2024: ${word}`)).toBeVisible();
    expect(tile).not.toHaveTextContent(/n\.a\.|not one figure|Better|Worse/);
  });
});

describe("labels, bases and reasons through the reader rule", () => {
  it("names a figure without the citation after its heading", () => {
    draw(
      foundation(
        chart(
          "leverage",
          [
            "Period",
            "Total debt / EBITDA (CP-1-CALC-02)",
            "Net debt / EBITDA",
            "Reporting unit",
            "Basis",
          ],
          ["FY2024", "4.00", "3.50", "x", "Stated [E3]."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByRole("heading", { name: "Total debt / EBITDA" })).toBeVisible();
    expect(within(tile).getByText("Stated.")).toBeVisible();
    expect(document.body).not.toHaveTextContent(/CP-1-CALC|\[E3\]/);
  });

  it("links a gap reason that carries an id the page cannot name", () => {
    draw(
      foundation(
        chart(
          "leverage",
          LEVERAGE,
          ["FY2023", "5.00", "4.50", "x", "Stated."],
          ["FY2024", "Not supplied: per T4.18", "3.50", "x", "Stated."],
        ),
      ),
    );
    const tile = gross();
    expect(within(tile).getByText("FY2024: not supplied")).toBeVisible();
    expect(within(tile).getByRole("link", { name: "Read the reason in Evidence" })).toBeVisible();
    expect(tile).not.toHaveTextContent("T4.18");
  });
});

describe("the cash tile", () => {
  it("names the second part of its split bar beside its figure, not only to assistive technology", () => {
    draw(foundation(chart("leverage", LEVERAGE, ["FY2024", "4.00", "3.50", "x", "Stated."])));
    const cash = screen.getByRole("region", { name: "Cash" });
    const legend = within(cash).getByRole("list", { name: "Parts of the bar" });
    const items = within(legend).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Cash US$275m",
      "Undrawn committed facilities US$400m",
    ]);
  });
});
