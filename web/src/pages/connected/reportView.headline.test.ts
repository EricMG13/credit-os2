import { describe, expect, it } from "vitest";
import type { CatalogueRun, OutputEntry, Section } from "./publishedReport";
import { evidencePath } from "./publishedReport";
import { headlineSources } from "./reportView";

const SHA = "a".repeat(64);
const NOT_STATED = "Not supplied: the measure is not stated";

const chart = (title: string, headers: string[], rows: string[][], at = 10): Section => ({
  heading: `Chart data: ${title}`,
  level: 3,
  line: at,
  blocks: [
    {
      type: "table",
      line: at + 2,
      headers: ["Period", ...headers, "Reporting unit", "Basis and limitation"],
      rows: rows.map((cells, i) => ({ line: at + 4 + i, cells })),
    },
  ],
});

const sections = (adjusted = false): Section[] => [
  chart(
    "leverage",
    adjusted
      ? ["Total debt / adjusted EBITDA", "Net debt / adjusted EBITDA"]
      : ["Total debt / EBITDA", "Net debt / EBITDA"],
    [
      ["FY2023", "3.75", "3.00", "x", "Synthetic."],
      ["FY2024", "2.80", "2.25", "x", "Synthetic."],
    ],
    10,
  ),
  chart(
    "revenue and EBITDA",
    ["Revenue", "Adjusted EBITDA"],
    [
      ["FY2023", "2,100", "410", "US$m", "Synthetic."],
      ["FY2024", "2,250", NOT_STATED, "US$m", "Synthetic."],
    ],
    30,
  ),
];

const entry = (blocks: Section[] = sections(), module = "CP-1"): OutputEntry => ({
  output: { id: "run/CP-1.md", module, label: "x", href: "x", sha256: SHA },
  sections: blocks,
  selected: true,
});

const catalogue = (metrics: CatalogueRun["metrics"]): CatalogueRun => ({
  id: "run",
  name: "Run",
  issuer: "A",
  title: "",
  date: "2025-03-31",
  sector: "",
  period: "FY2024",
  metrics,
});
const figure = (value: string | number | null, unit = "x", period = "FY2024") => ({
  value,
  unit,
  period,
});
const FULL = {
  net_leverage: figure("2.25"),
  leverage: figure("2.80"),
  revenue: figure("2,250", "US$m"),
};

describe("headlineSources", () => {
  it("addresses the row each figure is read from, and the row that says one is not supplied", () => {
    const source = entry();
    expect(headlineSources(source, catalogue(FULL), "run")).toEqual({
      net_leverage: { href: evidencePath("run", source, 15), period: "FY2024" },
      leverage: { href: evidencePath("run", source, 15), period: "FY2024" },
      revenue: { href: evidencePath("run", source, 35), period: "FY2024" },
      adjusted_ebitda: {
        href: evidencePath("run", source, 35),
        period: "FY2024",
        reason: NOT_STATED,
      },
    });
  });

  it("reads an adjusted heading as the reported one", () => {
    const source = entry(sections(true));
    expect(headlineSources(source, catalogue(FULL), "run").net_leverage).toEqual({
      href: evidencePath("run", source, 15),
      period: "FY2024",
    });
  });

  it("gives no source where the row states another value, another period or none", () => {
    const sources = headlineSources(
      entry(),
      catalogue({
        net_leverage: figure("2.26"),
        leverage: figure("2.80", "x", "FY2022"),
        revenue: figure("2,250", "US$m", ""),
      }),
      "run",
    );
    expect(Object.keys(sources)).toEqual(["adjusted_ebitda"]);
  });

  it.each([
    ["an empty cell", ""],
    ["a figure the catalogue could not quote", "approximately 410"],
  ])(
    "points at the row with no reason when the module did not say %s was not supplied",
    (_, cell) => {
      const rows = sections();
      const [, revenue] = rows;
      const table = revenue?.blocks[0];
      if (table?.type !== "table") throw new Error("the fixture has a revenue table");
      const last = table.rows[1];
      if (!last) throw new Error("the fixture has an FY2024 row");
      last.cells[2] = cell;
      const source = entry(rows);
      const gap = headlineSources(source, catalogue(FULL), "run").adjusted_ebitda;
      expect(gap).toEqual({ href: evidencePath("run", source, 35), period: "FY2024" });
      expect(gap).not.toHaveProperty("reason");
    },
  );

  it("gives no source when a heading matches two columns", () => {
    const rows = [
      chart(
        "leverage",
        ["Total debt / EBITDA", "Total debt / adjusted EBITDA", "Net debt / EBITDA"],
        [["FY2024", "2.80", "2.80", "2.25", "x", "Synthetic."]],
      ),
    ];
    const sources = headlineSources(entry(rows), catalogue(FULL), "run");
    expect(sources.leverage).toBeUndefined();
    expect(sources.net_leverage).toBeDefined();
  });

  it("gives none for a handoff that is not Financial foundation, or has no entry or catalogue", () => {
    expect(headlineSources(entry(sections(), "CP-6"), catalogue(FULL), "run")).toEqual({});
    expect(headlineSources(undefined, catalogue(FULL), "run")).toEqual({});
    expect(headlineSources(entry(), undefined, "run")).toEqual({});
  });
});

describe("headlineSources for a figure the catalogue lacks", () => {
  const LATEST = "FY2024 / 2024-09-30";
  const leverage = (periods: [string, string], at = 10) =>
    chart(
      "leverage",
      ["Total debt / EBITDA", "Net debt / EBITDA"],
      [
        [periods[0], "3.75", "3.00", "x", "Synthetic."],
        [periods[1], "2.80", "2.25", "x", "Synthetic."],
      ],
      at,
    );
  const revenue = (rows: string[][], at = 30) =>
    chart("revenue and EBITDA", ["Revenue", "Adjusted EBITDA"], rows, at);
  const stated = (reason: string, period = "FY2024") => [
    period,
    "2,250",
    reason,
    "US$m",
    "Synthetic.",
  ];

  it("is read at the latest row of its own chart, beside a chart whose periods carry a date", () => {
    const source = entry([
      leverage(["FY2023 / 2023-09-30", LATEST]),
      revenue([stated("2,100", "FY2023"), stated(NOT_STATED)]),
    ]);
    const metrics = {
      net_leverage: figure("2.25", "x", LATEST),
      leverage: figure("2.80", "x", LATEST),
      revenue: figure("2,250", "US$m", "FY2024"),
    };
    expect(headlineSources(source, catalogue(metrics), "run")).toEqual({
      net_leverage: { href: evidencePath("run", source, 15), period: LATEST },
      leverage: { href: evidencePath("run", source, 15), period: LATEST },
      revenue: { href: evidencePath("run", source, 35), period: "FY2024" },
      adjusted_ebitda: {
        href: evidencePath("run", source, 35),
        period: "FY2024",
        reason: NOT_STATED,
      },
    });
  });

  it("never carries the reason of another period than its chart's latest", () => {
    const source = entry([
      leverage(["FY2023", "FY2024"]),
      revenue([
        stated("Not supplied: old reason", "FY2024"),
        stated("Not supplied: new reason", "FY2025"),
      ]),
    ]);
    const metrics = { net_leverage: figure("2.25"), revenue: figure("2,250", "US$m", "FY2025") };
    expect(headlineSources(source, catalogue(metrics), "run").adjusted_ebitda).toEqual({
      href: evidencePath("run", source, 35),
      period: "FY2025",
      reason: "Not supplied: new reason",
    });
  });

  it("chooses the latest row by its period, whatever the order of the rows", () => {
    const source = entry([
      leverage(["FY2023", "FY2024"]),
      revenue([stated("Not supplied: new", "FY2025"), stated("Not supplied: old", "FY2024")]),
    ]);
    const gap = headlineSources(
      source,
      catalogue({ net_leverage: figure("2.25") }),
      "run",
    ).adjusted_ebitda;
    expect(gap).toEqual({
      href: evidencePath("run", source, 34),
      period: "FY2025",
      reason: "Not supplied: new",
    });
  });

  it("orders dated periods by their date", () => {
    const source = entry([
      leverage(["FY2023", "FY2024"]),
      revenue([
        stated("Not supplied: leap day", "2024-02-29"),
        stated("Not supplied: latest", "2024-09-30"),
        stated("Not supplied: earlier", "2023-12-31"),
      ]),
    ]);
    const gap = headlineSources(
      source,
      catalogue({ net_leverage: figure("2.25") }),
      "run",
    ).adjusted_ebitda;
    expect(gap?.reason).toBe("Not supplied: latest");
  });

  it.each([
    ["a period the period rule cannot read", ["First half", "FY2024"]],
    ["one period written two ways", ["FY2024", "2024"]],
    ["only pro forma and forecast periods", ["PF FY2024", "FY2025E"]],
    ["a period that repeats", ["FY2024", "FY2024"]],
    ["a year that disagrees with its date", ["FY2023 / 2024-09-30", "FY2024 / 2024-09-30"]],
    ["an impossible date", ["2024-02-30", "2024-09-30"]],
    ["a leap day in a year with none", ["2023-02-29", "2024-09-30"]],
    // Which of a fiscal year and a date is later depends on the year end: no latest is guessed.
    ["a fiscal year beside a dated period", ["2024-09-30", "FY2023"]],
    ["a fiscal year beside a later date", ["FY2025", "2025-06-30"]],
    ["a dated fiscal year beside a fiscal quarter", ["FY2024 / 2024-09-30", "Q1 2025", "LTM 2025"]],
  ])("has no source for it when its chart has %s", (_, periods) => {
    const source = entry([
      leverage(["FY2023", "FY2024"]),
      revenue(periods.map((period) => stated(NOT_STATED, period))),
    ]);
    const sources = headlineSources(source, catalogue({ net_leverage: figure("2.25") }), "run");
    expect(sources.adjusted_ebitda).toBeUndefined();
    expect(sources.net_leverage).toBeDefined();
  });

  // Owner's ruling, 2026-11-25: quarters, year to date, last twelve months, pro forma and forecast
  // periods order by one rule; the latest reported row is never a pro forma or forecast one.
  it.each([
    ["a last twelve months period after the fiscal years", ["LTM Jun 2025", "FY2023", "FY2024"], 0],
    ["quarters in time order", ["Q3 FY2024", "Q1 FY2024", "Q2 FY2024"], 0],
    ["a year to date before a last twelve months", ["LTM Jun 2025", "FY2024", "YTD Jun 2025"], 0],
    [
      "dated fiscal years before a last twelve months period",
      ["LTM Jun 2025", "FY2023 / 2023-09-30", "FY2024 / 2024-09-30"],
      0,
    ],
    ["fiscal years and quarters, none carrying a date", ["Q1 2025", "FY2023", "FY2024"], 0],
    [
      "the last reported period, not the pro forma or forecast ones after it",
      ["FY2026E", "PF LTM Jun 2025", "FY2024", "LTM Jun 2025", "FY2025E"],
      3,
    ],
  ])("reads the latest reported row of a chart with %s", (_, periods, latest) => {
    const source = entry([
      leverage(["FY2023", "FY2024"]),
      revenue(periods.map((period, at) => stated(`Not supplied: row ${String(at)}`, period))),
    ]);
    const gap = headlineSources(
      source,
      catalogue({ net_leverage: figure("2.25") }),
      "run",
    ).adjusted_ebitda;
    expect(gap).toEqual({
      href: evidencePath("run", source, 34 + latest),
      period: periods[latest],
      reason: `Not supplied: row ${String(latest)}`,
    });
  });

  it("has no source for it when a row of its chart has fewer cells than the headings", () => {
    const source = entry([
      leverage(["FY2023", "FY2024"]),
      revenue([stated("2,100", "FY2023"), ["FY2024", "2,250", NOT_STATED]]),
    ]);
    const sources = headlineSources(source, catalogue({ net_leverage: figure("2.25") }), "run");
    expect(sources.adjusted_ebitda).toBeUndefined();
  });
});
