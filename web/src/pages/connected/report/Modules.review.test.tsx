import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
  CatalogueRun,
  OutputEntry,
  PublishedRun,
  Section,
  Snapshot,
  Table,
} from "../publishedReport";
import type { ReportView } from "../reportView";
import type { LeadProps } from "./leads/types";
import { placeProse } from "./ModuleProse";
import { Modules } from "./Modules";

// Cases from the coordinator's review of the module frame (2026-11-24); each names its item.

const lead = vi.hoisted(() => ({
  current: undefined as undefined | (((props: LeadProps) => unknown) & { draws?: string[] }),
}));
vi.mock("./leads", () => ({ leadFor: () => lead.current }));

afterEach(cleanup);
beforeEach(() => {
  lead.current = undefined;
});

const table = (line: number, headers: string[], rows: string[][]): Table => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const text = (line: number, value: string) => ({
  type: "text" as const,
  line,
  end: line,
  text: value,
});
const section = (heading: string, level: number, line: number, blocks: Section["blocks"] = []) => ({
  heading,
  level,
  line,
  blocks,
});

function page(
  sections: Section[],
  {
    module = "CP-2",
    name = "Fundamental credit",
    extra = {},
    catalogue,
  }: {
    module?: string;
    name?: string;
    extra?: Partial<OutputEntry["output"]>;
    catalogue?: CatalogueRun;
  } = {},
) {
  const entry: OutputEntry = {
    selected: true,
    output: {
      id: `r/${module}.md`,
      module,
      label: "a",
      href: "",
      sha256: "a".repeat(64),
      ...extra,
    },
    sections,
  };
  const view = {
    entries: [entry],
    modules: [{ id: module, name, state: "Delivered", outputs: [entry] }],
    catalogue,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = { folder: "r", issuer: "Issuer", asOf: "2026-10-31", modules: {} } as PublishedRun;
  return render(
    <Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module={module} />,
  );
}

const findings = section("Findings", 2, 1);
const bottom = section("Bottom line", 3, 2, [text(3, "The credit is sound but thin.")]);

it("3: draws a table written in the Limitations passage inside the limitations block", () => {
  page([
    findings,
    bottom,
    section("Limitations", 3, 10, [
      text(11, "Only one period was supplied."),
      table(12, ["Limitation", "Effect"], [["No FY2022", "One step only"]]),
    ]),
  ]);
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getByText("Only one period was supplied.")).toBeVisible();
  expect(within(limits).getByRole("cell", { name: "No FY2022" })).toBeVisible();
});

it("4: draws a drawing section's prose with no table as the stated gap for that visual", () => {
  page([
    findings,
    bottom,
    section("Map: transmission", 3, 20, [
      text(21, "Not supplied: no relationships were documented."),
    ]),
  ]);
  const gap = screen.getByRole("region", { name: "transmission" });
  expect(within(gap).getByText("Not supplied: no relationships were documented.")).toBeVisible();
});

it("6: keeps a chart gap's word and its source link when the reason cites a source", () => {
  page(
    [
      findings,
      bottom,
      section("Chart data: liquidity", 3, 30, [table(31, ["Period", "Cash"], [["FY2024", "1"]])]),
    ],
    {
      extra: {
        chartGaps: [
          {
            table: 31,
            title: "Liquidity",
            gap: "Not supplied: see TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63",
          },
        ],
        maps: [{ table: 31, name: "Transmission", gap: "Withheld: no executed documents" }],
      },
    },
  );
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getByText("Not supplied.")).toBeVisible();
  expect(within(limits).queryByText(/10-K/)).toBeNull();
  // E4: each link is named by the table it opens, never the same words twice on a page.
  expect(
    within(limits).getByRole("link", { name: "Liquidity: source table in Evidence" }),
  ).toHaveAttribute("href", expect.stringContaining("#evidence/"));
  expect(within(limits).queryByRole("link", { name: "Source table in Evidence" })).toBeNull();
  // A map that carries a gap is a limitation too.
  expect(within(limits).getByText("Transmission: not drawn")).toBeVisible();
  expect(within(limits).getByText("Withheld: no executed documents")).toBeVisible();
});

it("7: keeps the portfolio-limits chart on the committee page with its mandate note", () => {
  page(
    [
      findings,
      bottom,
      section("Chart data: portfolio limits", 3, 40, [
        table(41, ["Limit", "Current", "Maximum"], [["Single name", "2%", "5%"]]),
      ]),
    ],
    {
      module: "CP-6",
      name: "Committee decision",
      extra: { charts: [{ table: 41, title: "Portfolio limits", kind: "limits" }] },
    },
  );
  const tile = screen.getByRole("region", { name: "Portfolio limits" });
  expect(tile).toHaveTextContent(/portfolio limits could not be checked against the mandate/i);
});

it("8: draws one Key findings region for a passage that holds only its Basis line", () => {
  page([
    findings,
    bottom,
    section("Key findings", 3, 5, [text(6, "Basis: annual report, page 4")]),
  ]);
  const regions = screen.getAllByRole("region", { name: "Key findings" });
  expect(regions).toHaveLength(1);
  // The passage exists and holds only its Basis: say so, and keep its trace.
  expect(within(regions[0] as HTMLElement).getByText("This passage holds no text.")).toBeVisible();
  expect(within(regions[0] as HTMLElement).queryByText(/no such passage/)).toBeNull();
  expect(
    within(regions[0] as HTMLElement).getByRole("button", {
      name: "Show sources for Key findings",
    }),
  ).toBeVisible();
});

it("9: keeps drawing, after the lead, the kinds the lead does not draw", () => {
  const sections = [
    findings,
    bottom,
    section("Map: transmission", 3, 20, [table(21, ["From", "To", "Kind"], [["A", "B", "Fact"]])]),
    section("Events: dates", 3, 30, [table(31, ["Date", "Event"], [["2026-01-01", "Maturity"]])]),
  ];
  const extra = {
    maps: [{ table: 21, name: "Transmission" }],
    events: [{ table: 31, lane: "Dates" }],
  };
  const Lead = vi.fn(() => <section aria-label="Lead">lead</section>);
  lead.current = Object.assign(Lead, { draws: ["maps"] });
  page(sections, { extra });
  expect(screen.getByRole("region", { name: "Lead" })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Transmission" })).toBeNull();
  const dates = screen.getByRole("region", { name: "Dates" });
  expect(screen.getByRole("region", { name: "Lead" }).compareDocumentPosition(dates)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  cleanup();
  // A lead that lists nothing leaves every kind to the frame.
  lead.current = Object.assign(
    vi.fn(() => <section aria-label="Lead">lead</section>),
    {},
  );
  page(sections, { extra });
  expect(screen.getByRole("region", { name: "Transmission" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Dates" })).toBeInTheDocument();
});

it("10: keeps register and entity-key sections off the page and a table's note with its table", () => {
  page([
    findings,
    bottom,
    section("T4.2 Entity period key", 3, 10, [
      text(11, "Balance-sheet observations are instants."),
      table(12, ["Entity Name", "Fiscal Year End"], [["Issuer", "September 30"]]),
    ]),
    section("T4.18 Debt instruments", 3, 20, [
      text(21, "All money columns below are USD millions."),
      table(
        22,
        ["Instrument", "Principal"],
        [
          ["Notes", "500"],
          ["Loan", "250"],
        ],
      ),
    ]),
    section("Financial interpretation", 3, 30, [text(31, "Operating improvement is genuine.")]),
  ]);
  expect(screen.queryByRole("region", { name: "Entity period key" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Debt instruments" })).toBeNull();
  expect(screen.queryByText("All money columns below are USD millions.")).toBeNull();
  expect(screen.getByRole("region", { name: "Financial interpretation" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
  expect(screen.getByText("All money columns below are USD millions.")).toBeVisible();
});

it("10: reads a long section in two columns and pairs short ones side by side", () => {
  const prose = (line: number, words: number) => ({
    section: section(`S${String(line)}`, 3, line),
    title: `S${String(line)}`,
    paragraphs: [],
    typed: [],
    words,
  });
  const spans = (...words: number[]) =>
    placeProse(words.map((count, at) => prose(at + 1, count))).map(({ span, measured }) =>
      measured ? `${String(span)} measured` : span,
    );
  // V5: a long section takes the row; short ones of like length pair; a lone short one takes the
  // row with its text held to the reading measure, leaving no boxed hole beside it.
  expect(spans(400, 50, 50, 50)).toEqual([12, 6, 6, "12 measured"]);
  // Two short sections of unlike length do not pair: the shorter tile would be mostly empty.
  expect(spans(170, 40)).toEqual(["12 measured", "12 measured"]);
  expect(spans(60)).toEqual(["12 measured"]);
});

const metrics = {
  leverage: {
    value: "6.53",
    unit: "x",
    period: "FY2024",
    basis: "Total debt over reported EBITDA",
    prior: { value: "6.27", period: "FY2023" },
    change: "0.26",
  },
  cash: { value: "6261", unit: "US$m", period: "FY2024", basis: "Reported" },
};

const chartRows = [
  section("Chart data: leverage", 3, 40, [
    table(41, ["Period", "Total debt / EBITDA", "Net debt / EBITDA"], [["FY2024", "6.53", "4.88"]]),
  ]),
  section("Chart data: liquidity", 3, 50, [table(51, ["Period", "Cash"], [["FY2024", "6261"]])]),
];

it("11: draws the CP-1 strip from the catalogue, each figure with its period, basis and prior", () => {
  page([findings, bottom, ...chartRows], {
    module: "CP-1",
    name: "Financial foundation",
    catalogue: { id: "r", metrics } as unknown as CatalogueRun,
  });
  const strip = within(screen.getByLabelText("Headline figures"));
  expect(strip.getByText("6.53x")).toBeVisible();
  expect(strip.getByText(/from 6\.27x in FY2023/)).toBeVisible();
  expect(strip.getByText("+0.26x worse")).toBeVisible();
  expect(strip.getByText("FY2024 · Total debt over reported EBITDA")).toBeVisible();
  // No change is drawn where the catalogue gives none; an absent figure is a gap, never zero.
  expect(strip.getByText("FY2024 · Reported")).toBeVisible();
  expect(strip.getAllByText("Not shown here").length).toBeGreaterThan(0);
  expect(strip.queryByText("0")).toBeNull();
  // V4: the mockup's two-point mark, prior to current, drawn from the figures as written.
  expect(
    strip.getByRole("img", { name: "Gross leverage 6.27 in FY2023 and 6.53 in FY2024" }),
  ).toBeInTheDocument();
  // A figure the strip does not draw has no control: no dead tab stop.
  const gap = strip.getByText("Adjusted EBITDA").closest("div") as HTMLElement;
  expect(within(gap).queryByRole("button")).toBeNull();
});

it("V4: draws no figure the handoff's own row does not state", () => {
  const disagreeing = {
    ...metrics,
    leverage: { ...metrics.leverage, value: "2.80" },
  };
  page([findings, bottom, ...chartRows], {
    module: "CP-1",
    name: "Financial foundation",
    catalogue: { id: "r", metrics: disagreeing } as unknown as CatalogueRun,
  });
  const strip = within(screen.getByLabelText("Headline figures"));
  expect(strip.queryByText("2.80x")).toBeNull();
  expect(strip.getByText("Gross leverage").closest("div")).toHaveTextContent("Not shown here");
});

it("11: draws no strip for another module or a catalogue that states no headline figure", () => {
  page([findings, bottom], { catalogue: { id: "r", metrics } as unknown as CatalogueRun });
  expect(screen.queryByLabelText("Headline figures")).toBeNull();
});

it("14: states the basis from the entity period key and names the module without its code", () => {
  page(
    [
      findings,
      bottom,
      section("T4.2 Entity period key", 3, 10, [
        table(
          12,
          [
            "Entity Name",
            "Fiscal Year End",
            "Reporting Currency",
            "Reporting Unit",
            "Accounting Basis",
            "Available Periods",
          ],
          [["Issuer", "September 30", "USD", "millions", "US GAAP", "FY2024; FY2023"]],
        ),
      ]),
    ],
    { module: "CP-1", name: "Financial foundation" },
  );
  const header = screen.getByRole("region", { name: "Financial foundation" });
  expect(within(header).getByText("Issuer:")).toBeVisible();
  // The parts are read with real separators, not run together.
  expect(header).toHaveTextContent(
    "Issuer: Fiscal year end September 30 · $m · US GAAP · FY2024; FY2023",
  );
  expect(
    within(header).getByRole("heading", { level: 2, name: "Financial foundation" }),
  ).toBeVisible();
  expect(header.textContent).not.toMatch(/CP-\d/);
});

it.each([
  [{ value: 72, band: "Medium" }, ["72", "/ 100", "Medium"]],
  [{ value: 0, band: "Insufficient Information" }, ["0", "/ 100", "Insufficient Information"]],
  [{ missing: "the scorer refused the inputs" }, ["Not scored: the scorer refused the inputs"]],
])(
  "20: draws the page's confidence %j with its trace to the scored inputs",
  async (confidence, words) => {
    page(
      [
        findings,
        bottom,
        section("Confidence inputs", 3, 50, [
          table(51, ["Input", "Value"], [["Coverage", "High"]]),
        ]),
      ],
      { extra: { confidence } },
    );
    const score = within(screen.getByRole("group", { name: "Confidence score" }));
    for (const word of words) expect(score.getByText(word)).toBeVisible();
    fireEvent.click(score.getByRole("button", { name: "Show sources for the confidence score" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Coverage");
  },
);

const profile = (rows: string[][]) =>
  section("Company profile", 3, 60, [table(61, ["Field", "Value"], rows)]);
const businessPage = (sections: Section[]) =>
  page([findings, bottom, ...sections], { module: "CP-1A", name: "Business & governance" });

it("21: draws the business description on Business & governance, register over profile", () => {
  businessPage([
    section("T1A.1 company_description", 3, 70, [
      table(
        71,
        ["Issuer", "Business description", "Sector"],
        [["I", "Makes aircraft parts.", "Aerospace"]],
      ),
    ]),
    profile([["Business", "From the profile."]]),
  ]);
  const header = screen.getByRole("region", { name: "Business & governance" });
  expect(within(header).getByText("Makes aircraft parts.")).toBeVisible();
  expect(within(header).getByText("Aerospace")).toBeVisible();
  expect(within(header).queryByText("From the profile.")).toBeNull();
  expect(within(header).getByRole("link", { name: "Business description" })).toHaveAttribute(
    "href",
    expect.stringContaining("#evidence/"),
  );
});

it("21: draws the gap rather than guess between two Business rows", () => {
  businessPage([
    profile([
      ["Business", "First."],
      ["Business", "Second."],
    ]),
  ]);
  const header = screen.getByRole("region", { name: "Business & governance" });
  expect(within(header).getByText("Business description not in this run")).toBeVisible();
  expect(within(header).queryByText("First.")).toBeNull();
});

it("21: prints no description that cites a file, and names modules in place of codes", () => {
  businessPage([
    profile([
      ["Business", "Per TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 4"],
    ]),
  ]);
  expect(screen.getByText("Business description in Evidence")).toBeVisible();
  expect(screen.queryByText(/10-K/)).toBeNull();
  cleanup();
  businessPage([profile([["Business", "Described by CP-1 as an aerospace supplier."]])]);
  expect(screen.queryByText(/CP-1 as/)).toBeNull();
});

it("21: draws no business description on other modules", () => {
  page([findings, bottom, profile([["Business", "Makes parts."]])]);
  expect(screen.queryByText("Makes parts.")).toBeNull();
  expect(screen.queryByText("Business description not in this run")).toBeNull();
});

it("17: draws a typed table's section as one region of its name, without the register code", () => {
  page([
    findings,
    bottom,
    section("T2.12 Monitoring triggers", 3, 80, [
      table(
        81,
        ["Trigger", "Threshold", "Signal", "Why It Matters", "Credit Impact"],
        [["Interest cover", "Below 3.1x", "Falling", "Lower cash cover", "Less headroom"]],
      ),
    ]),
  ]);
  expect(screen.getAllByRole("region", { name: "Monitoring triggers" })).toHaveLength(1);
  expect(screen.getByRole("region", { name: "Monitoring triggers table" })).toBeVisible();
  expect(document.body.textContent).not.toContain("T2.12");
});

it("H5: shows the catalogue's figures only on the selected output, a gap line on another", () => {
  const catalogue = { id: "r", metrics } as unknown as CatalogueRun;
  const selected: OutputEntry = {
    selected: true,
    output: { id: "r/CP-1.md", module: "CP-1", label: "a", href: "", sha256: "a".repeat(64) },
    sections: [findings, bottom],
  };
  const other: OutputEntry = {
    ...selected,
    selected: false,
    output: { ...selected.output, id: "r/CP-1-draft1.md", sha256: "b".repeat(64) },
  };
  const view = {
    entries: [selected, other],
    modules: [
      { id: "CP-1", name: "Financial foundation", state: "Delivered", outputs: [selected, other] },
    ],
    catalogue,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = { folder: "r", issuer: "Issuer", asOf: "2026-10-31", modules: {} } as PublishedRun;
  const { rerender } = render(
    <Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module="CP-1" output="1" />,
  );
  expect(screen.queryByLabelText("Headline figures")).toBeNull();
  expect(screen.getByText("Headline figures are shown for the selected output.")).toBeVisible();
  rerender(
    <Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module="CP-1" output="0" />,
  );
  expect(screen.getByLabelText("Headline figures")).toBeVisible();
});

it.each([
  [
    "Not disclosed: see TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 63",
    "Not disclosed.",
  ],
  ["Not calculable per annual.pdf p. 4", "Not calculable."],
  [
    "The filing (annual.pdf, page 12) does not split the facility",
    "The filing does not split the facility.",
  ],
])(
  "H6: keeps the module's words of a cited chart-gap reason %#, cutting only the citation",
  (gap, kept) => {
    page(
      [
        findings,
        bottom,
        section("Chart data: liquidity", 3, 30, [table(31, ["Period", "Cash"], [["FY2024", "1"]])]),
      ],
      { extra: { chartGaps: [{ table: 31, title: "Liquidity", gap }] } },
    );
    const limits = screen.getByRole("region", { name: "Limitations of this module" });
    expect(within(limits).getByText(kept)).toBeVisible();
    expect(limits.textContent).not.toMatch(/\.pdf|\.jsonl|page \d|p\. \d/);
  },
);

it("H7: draws a drawing's prose plainly unless it states a gap, without register codes", () => {
  page(
    [
      findings,
      bottom,
      section("Map: transmission", 3, 20, [
        text(21, "Relationships are drawn from T4.18 rows only."),
      ]),
      section("Map: control", 3, 25, [text(26, "Not supplied: no relationships were documented.")]),
    ],
    {
      extra: {
        chartGaps: [{ table: 31, title: "Leverage", gap: "Not supplied: one period" }],
        maps: [{ table: 31, name: "Transmission", gap: "Withheld: no executed documents" }],
      },
    },
  );
  const plain = screen.getByRole("region", { name: "transmission" });
  expect(within(plain).getByText("Relationships are drawn from rows only.")).toBeVisible();
  expect(plain.querySelector(".gap-hatch")).toBeNull();
  const gap = screen.getByRole("region", { name: "control" });
  expect(gap.querySelector(".gap-hatch")).not.toBeNull();
  // A chart gap and a map gap on one table are two limitations, each drawn once.
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getByText("Leverage: not drawn")).toBeVisible();
  expect(within(limits).getByText("Transmission: not drawn")).toBeVisible();
});

it("H8: names the entity, draws a gap cell as a gap, and says when the key lists more entities", () => {
  page(
    [
      findings,
      bottom,
      section("T4.2 Entity period key", 3, 10, [
        table(
          12,
          [
            "Entity Name",
            "Fiscal Year End",
            "Reporting Currency",
            "Reporting Unit",
            "Accounting Basis",
          ],
          [
            ["Parent plc", "Not supplied: no standalone periods", "USD", "millions", "IFRS"],
            ["Issuer Ltd", "December 31", "USD", "millions", "IFRS"],
            ["Guarantors", "December 31", "USD", "millions", "IFRS"],
          ],
        ),
      ]),
    ],
    { module: "CP-1", name: "Financial foundation" },
  );
  const header = screen.getByRole("region", { name: "Financial foundation" });
  expect(within(header).getByText("Parent plc:")).toBeVisible();
  expect(
    within(header).getByText("Fiscal year end: Not supplied: no standalone periods"),
  ).toHaveClass("border-dashed");
  expect(header).toHaveTextContent("3 reporting entities; first shown.");
  expect(
    within(header).getByRole("link", { name: "Entity period key in Evidence" }),
  ).toHaveAttribute("href", expect.stringContaining("#evidence/"));
});

it.each([
  ["a blocked output", true, "Not assessable: no filings were supplied.", null],
  [
    "an output that is not the selected one",
    false,
    "Makes parts.",
    "The business description is shown for the selected output.",
  ],
])(
  "H9, C3: draws no business description from %s, and no false gap",
  (_, selected, bottomText, said) => {
    const entry: OutputEntry = {
      selected,
      output: { id: "r/CP-1A.md", module: "CP-1A", label: "a", href: "", sha256: "a".repeat(64) },
      sections: [
        findings,
        section("Bottom line", 3, 2, [text(3, bottomText)]),
        profile([["Business", "Makes aircraft parts."]]),
      ],
    };
    const view = {
      entries: [entry],
      modules: [
        { id: "CP-1A", name: "Business & governance", state: "Delivered", outputs: [entry] },
      ],
      catalogue: undefined,
      lead: undefined,
      models: [],
    } as unknown as ReportView;
    const run = { folder: "r", issuer: "Issuer", asOf: "2026-10-31", modules: {} } as PublishedRun;
    render(
      <Modules
        snapshot={{ chips: {} } as Snapshot}
        run={run}
        view={view}
        module="CP-1A"
        output="0"
      />,
    );
    expect(screen.queryByText("Makes aircraft parts.")).toBeNull();
    expect(screen.queryByText("Business description not in this run")).toBeNull();
    if (said) expect(screen.getByText(said)).toBeVisible();
    else expect(screen.queryByText(/business description/i)).toBeNull();
  },
);

it("C6: draws an entity the key does not state as a gap, like its other gap cells", () => {
  page(
    [
      findings,
      bottom,
      section("T4.2 Entity period key", 3, 10, [
        table(
          12,
          ["Entity Name", "Fiscal Year End", "Reporting Currency", "Reporting Unit"],
          [["Not stated", "September 30", "EUR", "Not supplied"]],
        ),
      ]),
    ],
    { module: "CP-1", name: "Financial foundation" },
  );
  const header = screen.getByRole("region", { name: "Financial foundation" });
  expect(within(header).getByText("Entity: Not stated")).toHaveClass("border-dashed");
  expect(within(header).getByText("Unit: Not supplied")).toHaveClass("border-dashed");
  expect(within(header).queryByText("Not stated:")).toBeNull();
});

// D3 on the two module-page surfaces: the module's words where they survive the cut whole, else
// the surface's own way to Evidence. Expectations written by hand.
const D3: [string, string | null, string][] = [
  [
    "Not supplied: T4.18 shows 6.5x; T4.19 shows 5.9x.",
    null,
    "Not supplied. The reason cites a source, shown in Evidence.",
  ],
  [
    "Leverage excluding T4.18 items is 5.0x.",
    null,
    "Not established. The reason cites a source, shown in Evidence.",
  ],
  [
    "Debt in T4.18 is gross; debt in T4.19 is net.",
    null,
    "Not established. The reason cites a source, shown in Evidence.",
  ],
  ["Not in T4.18", null, "Not established. The reason cites a source, shown in Evidence."],
  [
    "Per T4.18 the covenant is not met.",
    null,
    "Not established. The reason cites a source, shown in Evidence.",
  ],
  ["Not supplied: see T4.18.", null, "Not supplied. The reason cites a source, shown in Evidence."],
  [
    "P2.5 billion of notes mature in 2027.",
    "P2.5 billion of notes mature in 2027.",
    "P2.5 billion of notes mature in 2027.",
  ],
  [
    "Relationships are drawn from T4.18 rows only.",
    "Relationships are drawn from rows only.",
    "Relationships are drawn from rows only.",
  ],
];

it.each(D3)("D3: a drawing gap tile draws %j as %j", (written, shown) => {
  page([findings, bottom, section("Map: transmission", 3, 20, [text(21, written)])]);
  const tile = screen.getByRole("region", { name: "transmission" });
  if (shown) expect(within(tile).getByText(shown)).toBeVisible();
  else
    expect(within(tile).getByRole("link", { name: "Read this passage in Evidence" })).toBeVisible();
  expect(tile.textContent).not.toMatch(/T4\.1[89]/);
});

it.each(D3)("D3: a chart gap well draws %j, its reason as %j", (written, _, reason) => {
  page([findings, bottom], {
    extra: { chartGaps: [{ table: 31, title: "Leverage", gap: written }] },
  });
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getByText(reason)).toBeVisible();
  expect(limits.textContent).not.toMatch(/T4\.1[89]/);
});

it("D: draws an entity cell holding only a dash as a gap named Entity", () => {
  page(
    [
      findings,
      bottom,
      section("T4.2 Entity period key", 3, 10, [
        table(
          12,
          ["Entity Name", "Fiscal Year End", "Reporting Currency"],
          [["—", "September 30", "EUR"]],
        ),
      ]),
    ],
    { module: "CP-1", name: "Financial foundation" },
  );
  const header = screen.getByRole("region", { name: "Financial foundation" });
  expect(within(header).getByText("Entity: —")).toHaveClass("border-dashed");
  expect(within(header).queryByText("—:")).toBeNull();
});
