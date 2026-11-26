import path from "node:path";
import { expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { entry, section, table } from "../overview/rows.fixture";
import { EVENT_HEADERS } from "./lead.fixture";
import { fixtureEntry, retained, sectionsOf } from "./markdown.fixture";
import {
  chartOf,
  chartsStartingWith,
  axisAsOf,
  eventsOf,
  leadingMillions,
  mapOf,
  readerCell,
  registerTable,
  sectionParagraphs,
  statedInProse,
  withStatedUnit,
} from "./read";

const H3 = retained("esg", "CP-2E-h3.md");
const H4 = retained("esg", "CP-2E-h4.md");

it("finds a register by its id whatever the title says after it, and only with its headers", () => {
  // Retained real output (TransDigm FY2024, outdated): the two runs title T2F.4 differently.
  const h3 = fixtureEntry("CP-2E", H3);
  const h4 = fixtureEntry("CP-2E", H4);
  expect(registerTable(h3, "T2F.4", ["Metric", "Amount"])?.headers[0]).toBe("Metric");
  expect(registerTable(h4, "T2F.4", ["Metric", "Amount"])).toBeDefined();
  expect(registerTable(h3, "T2F.4", ["Metric", "Not a header"])).toBeUndefined();
  expect(registerTable(h3, "T2F", ["Metric", "Amount"])).toBeUndefined();
});

it("does not take T2F.50 for T2F.5", () => {
  const made = entry("CP-2E", [], [section("T2F.50 Other", 1, table(2, ["A", "B"], [["1", "2"]]))]);
  expect(registerTable(made, "T2F.5", ["A"])).toBeUndefined();
});

it("reads a chart table, its stated gap, or neither", () => {
  const made = entry(
    "CP-4",
    [{ title: "Covenant headroom", table: 3 }],
    [section("Chart data: covenant headroom", 1, table(3, ["Test", "Threshold"], [["A", "1"]]))],
  );
  made.output.chartGaps = [{ title: "Rating triggers", table: 9, gap: "no agency trigger stated" }];
  expect(chartOf(made, "Covenant headroom").state).toBe("ready");
  expect(chartOf(made, "Rating triggers")).toEqual({
    state: "gap",
    reason: "No agency trigger stated",
  });
  expect(chartOf(made, "Liquidity bridge")).toEqual({ state: "absent" });
});

const edges = (rows: string[][], gap: string | null = null): OutputEntry => {
  const made = entry(
    "CP-1A",
    [],
    [
      section(
        "Map: ownership and control",
        1,
        table(3, ["From", "Relationship", "Edge type", "To", "Evidence"], rows),
      ),
    ],
  );
  made.output.maps = [{ name: "ownership and control", table: 3, gap }];
  return made;
};

it("reads a map's edges, and a map whose rows state a gap as that gap", () => {
  const ready = mapOf(
    edges([["Parent", "Owns", "Ownership", "Issuer", "Filing p.1"]]),
    "ownership and control",
  );
  expect(ready.state === "ready" && ready.edges[0]).toMatchObject({ from: "Parent", to: "Issuer" });
  const stated = mapOf(
    edges([["Not supplied: guarantor exhibit absent", "x", "Guarantee", "y", "z"]]),
    "ownership and control",
  );
  expect(stated).toMatchObject({ state: "gap", reason: "Guarantor exhibit absent" });
  expect(
    mapOf(edges([], "the intercreditor agreement is absent"), "ownership and control"),
  ).toMatchObject({
    state: "gap",
    reason: "The intercreditor agreement is absent",
  });
  expect(mapOf(edges([]), "legal entities")).toEqual({ state: "absent" });
});

it("orders dated events by date and keeps each one's stated precision", () => {
  const made = entry(
    "CP-2D",
    [],
    [
      section(
        "Events: Financing",
        1,
        table(
          3,
          [
            "Event date",
            "Date precision",
            "Published",
            "Event",
            "Status",
            "Source",
            "Credit relevance",
          ],
          [
            ["2026", "year", "2024-11-07", "Late", "Scheduled — maturity", "Filing", "Wall"],
            ["2025-03-31", "day", "2024-11-07", "Early", "Scheduled — matures", "Filing", "Wall"],
          ],
        ),
      ),
    ],
  );
  made.output.events = [{ lane: "Financing", table: 3, gap: null }];
  const lane = eventsOf(made, "Financing");
  expect(
    lane?.state === "ready" && lane.events.map(({ event, precision }) => [event, precision]),
  ).toEqual([
    ["Early", "day"],
    ["Late", "year"],
  ]);
  expect(eventsOf(made, "Hedges")).toBeNull();
});

it("reads a stated leading amount exactly and nothing else", () => {
  expect(leadingMillions("+USD 57.89 million annual cash interest")).toEqual({
    currency: "USD",
    value: 57.89,
    written: "+USD 57.89 million",
  });
  expect(leadingMillions("USD 5,789 million", "USD")).toMatchObject({
    currency: "USD",
    value: 5789,
  });
  expect(leadingMillions("USD -57.89 million")).toMatchObject({ value: -57.89 });
  expect(leadingMillions("+USD -5 million")).toBeNull();
  expect(leadingMillions("USD 300–500 million")).toBeNull();
  expect(leadingMillions("Approximately +USD 30 million annual interest costs")).toBeNull();
  expect(leadingMillions("EUR 5 million", "USD")).toBeNull();
  expect(leadingMillions("Not calculable: no base")).toBeNull();
});

it("draws a passage's paragraphs and keeps one that names a source in Evidence", () => {
  const made = entry("CP-DR", [], []);
  made.sections = [
    {
      heading: "Causal synthesis and scenarios",
      level: 3,
      line: 1,
      blocks: [
        { type: "text", line: 2, end: 2, text: "The downside path starts with a traffic shock." },
        { type: "text", line: 4, end: 4, text: "See TDG_10-K.htm, page 7." },
      ],
    },
  ];
  expect(sectionParagraphs(made, "Causal synthesis and scenarios")).toEqual([
    { line: 2, text: "The downside path starts with a traffic shock." },
    { line: 4, text: null },
  ]);
});

it("draws a map's edges and dated events without their source references or module codes", () => {
  const made = edges([
    ["Retail", "Drives EBITDA per annual_report.pdf p. 12", "Documentary Fact", "CP-2A", "S1"],
  ]);
  const map = mapOf(made, "ownership and control");
  expect(map.state === "ready" && map.edges[0]).toMatchObject({
    from: "Retail",
    relationship: "Drives EBITDA",
    type: "Documentary Fact",
    to: "Downside",
  });
  made.sections.push(
    section(
      "Events: Issuer history",
      20,
      table(21, EVENT_HEADERS, [
        [
          "2024-03-01",
          "day",
          "2024-03-01",
          "Notes issued (offering_memo.pdf p. 3)",
          "Historical — CP-2D",
          "S2",
          "Debt",
        ],
      ]),
    ),
  );
  made.output.events = [{ lane: "Issuer history", table: 21 }];
  const lane = eventsOf(made, "Issuer history");
  expect(lane?.state === "ready" && lane.events[0]).toMatchObject({
    event: "Notes issued",
    status: "Historical — Liquidity",
  });
});

const PROOF_2E = path.resolve(import.meta.dirname, "../../../../../../proof/handoffs/CP-2E.md");

it("reads the amounts the repo's handoffs write: USD 300m and USD +57.89 million", () => {
  // proof/handoffs/CP-2E.md T2F.4 (synthetic) and tests/fixtures/esg/CP-2E-h4.md T2F.5 (TransDigm FY2024, outdated).
  const proof = fixtureEntry("CP-2E", PROOF_2E);
  const exposure = registerTable(proof, "T2F.4", ["Metric", "Amount"]);
  const hedged = exposure?.rows.find(({ cells }) => cells[0] === "Hedged floating-rate debt");
  expect(leadingMillions(hedged?.cells[1] ?? "")).toEqual({
    currency: "USD",
    value: 300,
    written: "USD 300m",
  });
  const h4 = fixtureEntry("CP-2E", H4);
  const shocks = registerTable(h4, "T2F.5", ["Sensitivity", "Estimated Cash Impact"]);
  const impact = shocks?.rows[0]?.cells[3] ?? "";
  expect(impact).toMatch(/^USD \+57\.89 million annual/);
  expect(leadingMillions(impact)).toEqual({
    currency: "USD",
    value: 57.89,
    written: "USD +57.89 million",
  });
});

// Review 3, P11: the cited clause goes to the trace, the readable words and figures stay.
it("keeps a cell's readable words and drops only the clause that cites a register id or a source", () => {
  // tests/fixtures/esg/CP-2E-h4.md T2F.3: "Individual coupons in T2F.2".
  const h4 = fixtureEntry("CP-2E", H4);
  const hedges = registerTable(h4, "T2F.3", ["Hedge Type"]);
  const coupons = hedges?.rows.flatMap(({ cells }) => cells).find((cell) => cell.includes("T2F.2"));
  expect(coupons).toBe("Individual coupons in T2F.2");
  expect(readerCell(coupons ?? "")).toBe("Individual coupons");
  expect(readerCell("USD 300m hedged, per T2F.4; matures 2027")).toBe(
    "USD 300m hedged; matures 2027",
  );
  expect(readerCell("Leverage 4.2x (credit_agreement.pdf page 3)")).toBe("Leverage 4.2x");
  // Nothing readable is left: the whole cell is in Evidence.
  for (const id of ["T2DS.6", "T4C.5", "TDR.3", "T2R.1", "T3E.5", "T2B.7"])
    expect(readerCell(`See ${id}`)).toBe("In Evidence");
  expect(readerCell("Per annual_report.pdf p. 4")).toBe("In Evidence");
  expect(readerCell("T2F.2")).toBe("In Evidence");
  // A later clause that only locates a source is dropped whole, never left as "page" or "p.".
  expect(readerCell("See TDG_10-K.htm, page 7")).toBe("In Evidence");
  expect(readerCell("Coupons 5.5%, see T2F.2, p. 4")).toBe("Coupons 5.5%");
  expect(readerCell("Fixed 5.0% (see indenture.pdf, section 4.01)")).toBe("Fixed 5.0%");
  expect(readerCell("- 5")).toBe("- 5");
  expect(readerCell("Stress CP-2G")).not.toMatch(/CP-2G/);
  expect(readerCell("Tranche I")).toBe("Tranche I");
  expect(readerCell("Term SOFR +2.75%")).toBe("Term SOFR +2.75%");
});

// Review 6, V2: leading words stay only after a link word, and never end on a dangling word.
it("keeps a cell's leading words only when a link word introduces what it cites", () => {
  expect(readerCell("Run 20261113-101500-01 retained")).toBe("In Evidence");
  expect(readerCell("Retained in run 20261113-101500-01")).toBe("In Evidence");
  expect(readerCell("Individual coupons in T2F.2")).toBe("Individual coupons");
  expect(readerCell("Coupon step-up per T2F.2; margin ratchet")).toBe(
    "Coupon step-up; margin ratchet",
  );
  expect(readerCell("Amortisation schedule rows of T2F.2")).toBe("Amortisation schedule");
  expect(readerCell("Hedges and per T2F.4")).toBe("In Evidence");
});

const PROOF_2D = path.resolve(import.meta.dirname, "../../../../../../proof/handoffs/CP-2D.md");

it("reads a chart table the store withheld from the handoff, and tells it from none", () => {
  const made = fixtureEntry("CP-2D", PROOF_2D);
  expect(chartOf(made, "Liquidity bridge")).toMatchObject({ state: "withheld", line: 22 });
  const chart = chartOf(made, "Liquidity bridge");
  expect(chart.state === "withheld" && chart.table.rows[0]).toEqual([
    "Opening accessible liquidity",
    "900",
    "US$m",
    "Synthetic.",
  ]);
  expect(chart.state === "withheld" && chart.table.rowLines?.[3]).toBe(27);
  expect(chartOf(made, "Refinancing need")).toEqual({ state: "absent" });
  made.output.chartGaps = [{ title: "Liquidity bridge", table: 22, gap: "no cash flow stated" }];
  expect(chartOf(made, "Liquidity bridge")).toEqual({
    state: "gap",
    reason: "No cash flow stated",
  });
  expect(chartsStartingWith(made, "Liquidity").map(({ title }) => title)).toEqual([
    "Liquidity bridge",
  ]);
});

it("draws a map's stated edges and marks each gap row with its reason", () => {
  const made = edges([
    ["Parent", "Owns", "Ownership", "Issuer", "Filing p.1"],
    ["Not supplied: guarantor exhibit absent", "Guarantees", "Guarantee", "Notes", "—"],
    ["Issuer", "", "Other stated", "Notes", "Filing p.2"],
  ]);
  const read = mapOf(made, "ownership and control");
  expect(read.state === "ready" && read.edges.map(({ from, to }) => [from, to])).toEqual([
    ["Parent", "Issuer"],
  ]);
  expect(read.state === "ready" && read.gaps).toEqual([
    { line: 6, reason: "Guarantor exhibit absent" },
    { line: 7, reason: "This page could not read every cell of the row" },
  ]);
});

it("reads a map and a lane the store withheld from the handoff's own table", () => {
  const made = edges([["Parent", "Owns", "Ownership", "Issuer", "—"]]);
  made.output.maps = [];
  made.sections.push(
    section(
      "Events: Financing",
      20,
      table(21, EVENT_HEADERS, [
        ["2026", "year", "—", "Late", "Scheduled — maturity", "Filing", "Wall"],
        ["2026", "year", "—", "Notes", "Scheduled — x", "Filing", "Wall"],
        ["sometime", "year", "—", "Unplaced", "Scheduled — maturity", "Filing", "Wall"],
        ["2025-03-31", "day", "2024-11-07", "Early", "Historical — paid", "Filing", "Cost"],
      ]),
    ),
  );
  const map = mapOf(made, "ownership and control");
  expect(map.state === "ready" && map.edges).toHaveLength(1);
  const lane = eventsOf(made, "Financing");
  expect(lane).toMatchObject({
    state: "ready",
    unplaced: [{ date: "sometime", event: "Unplaced", line: 25 }],
    line: 21,
  });
  expect(lane?.state === "ready" && lane.events.map((event) => event.event)).toEqual([
    "Early",
    "Late",
    "Notes",
  ]);
  expect(lane?.state === "ready" && lane.events[0]).toMatchObject({
    published: "2024-11-07",
    relevance: "Cost",
  });
});

it("prints a lane's stated gap", () => {
  const made = entry("CP-2D", [], []);
  made.output.events = [{ lane: "Financing", table: 3, gap: "no financing calendar supplied" }];
  expect(eventsOf(made, "Financing")).toEqual({
    state: "gap",
    reason: "No financing calendar supplied",
    line: 3,
  });
  expect(eventsOf(made, "Hedges")).toBeNull();
});

it("reads the run's as-of date for the event axis only as a calendar date", () => {
  expect(axisAsOf("2025-06-30")).toEqual({ time: Date.UTC(2025, 5, 30), text: "2025-06-30" });
  for (const text of ["2025-02-30", "30 Jun 2025", "", null, undefined])
    expect(axisAsOf(text)).toBeNull();
});

it("gives each placed lane event the category and days the event axis places", () => {
  const made = entry(
    "CP-2D",
    [],
    [
      {
        heading: "Events: Financing",
        level: 3,
        line: 20,
        blocks: [
          {
            type: "table" as const,
            line: 21,
            headers: [
              "Event date",
              "Date precision",
              "Published",
              "Event",
              "Status",
              "Source",
              "Credit relevance",
            ],
            rows: [
              {
                line: 23,
                cells: ["2025-Q3", "quarter", "—", "Review", "Scenario — modelled", "Memo", ""],
              },
            ],
          },
        ],
      },
    ],
  );
  const lane = eventsOf(made, "Financing");
  expect(lane?.state === "ready" && lane.events[0]).toMatchObject({
    category: "Scenario",
    from: Date.UTC(2025, 6, 1),
    to: Date.UTC(2025, 8, 30),
  });
});

// Review 6, V3: a drawing section the module wrote as prose, no table, is the frame's to draw.
it("tells a chart, a lane and a map the module wrote as prose with no table", () => {
  const made = entry(
    "CP-2D",
    [],
    sectionsOf(`## Findings

### Chart data: liquidity bridge

The module could not chart this: no cash flow statement is supplied.

### Events: Financing

No dated financing event is stated for this run.

### Map: credit-risk transmission

The module could not map this transmission.

### Chart data: leverage

| Year | Leverage |
| --- | --- |
| 2025 | 4.1x |

### Map: ownership and control
`),
  );
  expect(statedInProse(made, "Chart data: Liquidity bridge")).toBe(true);
  expect(statedInProse(made, "Events: Financing")).toBe(true);
  expect(statedInProse(made, "Map: credit-risk transmission")).toBe(true);
  // A table, an empty section and no section at all are not prose.
  expect(statedInProse(made, "Chart data: Leverage")).toBe(false);
  expect(statedInProse(made, "Map: ownership and control")).toBe(false);
  expect(statedInProse(made, "Chart data: Interest cover")).toBe(false);
  // A prose-only chart is not one the page lists among the module's charts.
  expect(chartsStartingWith(made, "").map(({ title }) => title)).toEqual(["Leverage"]);
});

it("keeps the written minus sign and draws the money unit as a symbol", () => {
  expect(withStatedUnit("−25", "US$m")).toBe("−$25m");
});
