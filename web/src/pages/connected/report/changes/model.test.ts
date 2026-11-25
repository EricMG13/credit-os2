import { describe, expect, it } from "vitest";
import type { OutputEntry, PublishedChanges, Section } from "../../publishedReport";
import {
  analysisRows,
  words,
  classifyMeasures,
  issuerFacts,
  ledgerOf,
  leftovers,
  statusColumn,
  verdictOf,
} from "./model";

const side = (value: string, unit = "x", period = "FY2025") => ({ value, unit, period });
const measure = (key: string, prior: string, current: string, difference: number, extra = {}) => ({
  key,
  label: `Measure ${key}`,
  prior: side(prior),
  current: side(current, "x", "FY2026"),
  difference,
  unit: "x",
  ...extra,
});
const verdicts = (keys: string[], kind = "comparable") => ({
  measures: Object.fromEntries(keys.map((key) => [key, { kind, label: "Label", reason: "Why" }])),
});

function entryWith(sections: Section[]): OutputEntry {
  return {
    selected: true,
    output: { id: "a", module: "CP-8", label: "a", href: "", sha256: "a".repeat(64) },
    sections,
  };
}
const table = (heading: string, headers: string[], rows: string[][]): Section => ({
  heading,
  level: 3,
  line: 10,
  blocks: [
    {
      type: "table",
      headers,
      line: 11,
      rows: rows.map((cells, index) => ({ line: 12 + index, cells })),
    },
  ],
});

describe("classifyMeasures", () => {
  it("keeps the pack's order and groups by what the pack says, never by a computed size", () => {
    const change: PublishedChanges = {
      pack: {
        measures: [
          measure("small", "10", "11", 1),
          measure("big", "2", "4", 2),
          measure("flat", "5", "5", 0),
          measure("same", "3", "3.5", 0.5, {
            current: side("3.5", "x", "FY2025"),
            same_period: true,
          }),
          measure("none", "1", "2", 1),
          measure("units", "1", "2", 1, { current: side("2", "US$m", "FY2026") }),
          measure("empty", "", "2", 2),
        ],
      },
      verdicts: {
        measures: {
          ...verdicts(["small", "big", "flat", "same", "units", "empty"]).measures,
          none: { kind: "not_comparable", label: "L", reason: "Different basis" },
        },
      },
    };
    const groups = classifyMeasures(change, (label) => `#trace/${label}`);
    expect(groups.moved.map((item) => item.key)).toEqual(["small", "big", "empty"]);
    expect(groups.revised.map((item) => item.key)).toEqual(["same"]);
    expect(groups.unmoved.map((item) => item.key)).toEqual(["flat"]);
    expect(groups.notAssessable.map((item) => item.key)).toEqual(["none", "units"]);
    expect(groups.moved[1]).toMatchObject({
      before: "2x (FY2025)",
      after: "4x (FY2026)",
      beforeValue: 2,
      afterValue: 4,
      href: "#trace/Measure big",
    });
  });

  it("replaces a reason that cites a source with a pointer to the comparison evidence", () => {
    const change: PublishedChanges = {
      pack: { measures: [measure("a", "1", "2", 1)] },
      verdicts: {
        measures: { a: { kind: "comparable", label: "L", reason: "Per filing.pdf p. 3" } },
      },
    };
    expect(classifyMeasures(change, () => undefined).moved[0]?.reason).toBe(
      "See comparison evidence.",
    );
  });

  it("never turns a missing side into zero", () => {
    const change: PublishedChanges = {
      pack: {
        measures: [
          {
            key: "net_leverage",
            label: "Net leverage",
            prior: { value: null, unit: "x" },
            current: side("3"),
            difference: null,
            unit: "x",
          },
        ],
      },
    };
    const [item] = classifyMeasures(change, () => undefined).notAssessable;
    expect(item?.before).toBe("Not stated");
    expect(item?.beforeValue).toBeNull();
  });

  it("reads the stated cause and effect of a measure from the issuer table, as written", () => {
    const entry = entryWith([
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        [
          ["Measure big", "2x", "4x", "Unresolved", "Weaker cover"],
          ["Measure small", "10x", "11x", "New period", "—"],
          ["measure referenced", "1x", "2x", "Per filing.pdf p. 3", ""],
          ["Measure blank", "1x", "2x", "—", ""],
        ],
      ),
    ]);
    const change: PublishedChanges = {
      pack: {
        measures: [
          measure("big", "2", "4", 2),
          measure("small", "10", "11", 1),
          measure("referenced", "1", "2", 1),
          measure("blank", "1", "2", 1),
          measure("elsewhere", "1", "2", 1),
        ],
      },
      verdicts: verdicts(["big", "small", "referenced", "blank", "elsewhere"]),
    };
    const { moved } = classifyMeasures(change, () => undefined, entry);
    expect(moved.map((item) => [item.key, item.cause, item.effect])).toEqual([
      ["big", { kind: "written", text: "Unresolved" }, { kind: "written", text: "Weaker cover" }],
      ["small", { kind: "written", text: "New period" }, { kind: "dash" }],
      ["referenced", { kind: "referenced" }, { kind: "absent" }],
      ["blank", { kind: "dash" }, { kind: "absent" }],
      ["elsewhere", { kind: "unmatched" }, null],
    ]);
  });
});

describe("statusColumn", () => {
  it.each([
    ["Unchanged", "unchanged"],
    ["Strengthened", "revised"],
    ["Weakened", "revised"],
    ["Reversed", "revised"],
    ["New", "new"],
    ["Not run this time", "missing"],
    ["", null],
    ["Something else", null],
  ])("%j sits in %j", (status, column) => {
    expect(statusColumn(status)).toBe(column);
  });
});

describe("ledgerOf", () => {
  const rows = [
    ["E1", "—", "Revolver terms unavailable", "**Closed**", "Amended agreement supplied"],
    ["—", "C2", "Hedge book not provided", "New", "—"],
    ["E3", "C3", "Lease schedule open", "Remaining", ""],
    ["—", "C4", "Per filing.pdf p. 3 the swap is unclear", "New", "—"],
    ["E5", "—", "Pension terms old", "Watching", ""],
    ["E6", "—", "Segment margins", "Parked", ""],
  ];
  const headers = ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"];
  const ledger = (h = headers, r = rows) =>
    ledgerOf(entryWith([table("Limitations ledger", h, r)]), "cur");

  it("groups every status: added and removed first, then Remaining, Parked, the rest by name", () => {
    const result = ledger();
    if (!result || "table" in result) throw new Error("expected groups");
    expect(result.groups.map((g) => [g.heading, g.items.length])).toEqual([
      ["Added", 2],
      ["Removed", 1],
      ["Remaining", 1],
      ["Parked", 1],
      ["Watching", 1],
    ]);
    expect(result.groups[1]?.items[0]).toMatchObject({
      text: "Revolver terms unavailable",
      note: "Amended agreement supplied",
    });
  });

  it("keeps a row that cites a source as a link to Evidence, not a missing row", () => {
    const result = ledger();
    if (!result || "table" in result) throw new Error("expected groups");
    expect(result.groups[0]?.items[1]).toMatchObject({ text: null });
    expect(result.groups[0]?.items[1]?.href).toMatch(/^\/report\/cur#evidence\//);
  });

  it("falls back to the table when a Status column is missing", () => {
    const result = ledger(headers.slice(0, 3), [["E1", "C1", "Margins"]]);
    expect(result).toHaveProperty("table");
  });

  it("is null without a ledger", () => {
    expect(ledgerOf(entryWith([]), "cur")).toBeNull();
    expect(ledgerOf(undefined, "cur")).toBeNull();
  });
});

describe("issuerFacts", () => {
  it("returns the issuer-table rows that are not pack measures, with a link each", () => {
    const entry = entryWith([
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        [
          ["Net leverage", "6x", "7x", "Unresolved", "Worse"],
          ["New term loan B of US$600m signed", "—", "Signed", "New source", "More debt"],
        ],
      ),
    ]);
    const { facts } = issuerFacts(entry, "cur", new Set([12]));
    expect(facts).toHaveLength(1);
    expect(facts[0]).toMatchObject({
      label: { kind: "written", text: "New term loan B of US$600m signed" },
      before: { kind: "dash" },
      after: { kind: "written", text: "Signed" },
    });
    expect(facts[0]?.href).toMatch(/^\/report\/cur#evidence\//);
  });
});

describe("verdictOf", () => {
  const bottom = (...texts: string[]) =>
    entryWith([
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "Bottom line",
        level: 3,
        line: 2,
        blocks: texts.map((text, at) => ({
          type: "text" as const,
          line: 3 + at,
          end: 3 + at,
          text,
        })),
      },
    ]);

  it("is the first paragraph whole, never split at a full stop", () => {
    const verdict = verdictOf(
      bottom(
        "About the same: net leverage is approx. 7x. Cover is steady.",
        "Worse: Acme Inc. rose.",
      ),
      "cur",
    );
    expect(verdict?.first.text).toBe(
      "About the same: net leverage is approx. 7x. Cover is steady.",
    );
    expect(verdict?.body).toHaveLength(1);
  });

  it("keeps a clean second paragraph and links a later one that cites a source", () => {
    const verdict = verdictOf(
      bottom(
        "See filing.pdf p. 3 for the position.",
        "Cover is steady.",
        "Per report.pdf p. 2 more.",
      ),
      "cur",
    );
    expect(verdict?.first.text).toBeNull();
    expect(verdict?.body.map((item) => (item.kind === "text" ? item.text : "table"))).toEqual([
      "Cover is steady.",
      null,
    ]);
  });

  it("is null without a Bottom line", () => {
    expect(verdictOf(entryWith([]), "cur")).toBeNull();
    expect(verdictOf(undefined, "cur")).toBeNull();
  });
});

describe("issuerFacts placeholders and labels", () => {
  const issuer = (rows: string[][]) =>
    entryWith([
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        rows,
      ),
    ]);

  it("recognises the contract's no-change row and keeps its reason, not a changed fact", () => {
    const result = issuerFacts(
      issuer([["No material change", "—", "—", "None", "Nothing at the issuer moved."]]),
      "cur",
      new Set(),
    );
    expect(result.facts).toEqual([]);
    expect(result.noChange[0]).toMatchObject({
      reason: { kind: "written", text: "Nothing at the issuer moved." },
    });
  });

  it("matches a measure's row after units and case are trimmed, so it is drawn once", () => {
    const entry = issuer([["Net Leverage (x)", "6x", "7x", "New period", ""]]);
    const change: PublishedChanges = {
      pack: { measures: [measure("net_leverage", "6", "7", 1, { label: "Net leverage" })] },
      verdicts: verdicts(["net_leverage"]),
    };
    expect(classifyMeasures(change, () => undefined, entry).moved[0]?.cause).toEqual({
      kind: "written",
      text: "New period",
    });
    expect(issuerFacts(entry, "cur", new Set([12])).facts).toEqual([]);
  });
});

describe("ledgerOf statuses", () => {
  const headers = ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"];
  it("matches statuses case-insensitively after marks, and keeps a New row's note", () => {
    const result = ledgerOf(
      entryWith([
        table("Limitations ledger", headers, [
          ["E1", "—", "A", "Closed ✓", "Filed"],
          ["E2", "—", "B", "CLOSED", "Filed too"],
          ["—", "C1", "C", "new", "Arrived with the new facility"],
          ["—", "C2", "D", "New", "—"],
        ]),
      ]),
      "cur",
    );
    if (!result || "table" in result) throw new Error("expected groups");
    expect(result.groups.map((g) => [g.heading, g.items.length])).toEqual([
      ["Added", 2],
      ["Removed", 2],
    ]);
    expect(result.groups[0]?.items[0]).toMatchObject({
      status: "new",
      note: "Arrived with the new facility",
    });
    expect(result.groups[1]?.items[0]?.status).toBe("Closed ✓");
  });
});

describe("leftovers and unlisted analysis rows", () => {
  it("returns prose under a register, extra sections and an off-contract table as written", () => {
    const entry = entryWith([
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "What changed: the issuer",
        level: 3,
        line: 10,
        blocks: [
          {
            type: "table",
            headers: ["Measure or fact", "Earlier"],
            line: 11,
            rows: [{ line: 12, cells: ["X", "1"] }],
          },
          { type: "text", line: 14, end: 14, text: "A note under the register." },
        ],
      },
      {
        heading: "Unresolved differences",
        level: 3,
        line: 20,
        blocks: [{ type: "text", line: 21, end: 21, text: "Two figures still differ." }],
      },
    ]);
    const rest = leftovers(entry, "cur");
    expect(rest.map((section) => section.heading)).toEqual([
      "What changed: the issuer",
      "Unresolved differences",
    ]);
    expect(rest[0]?.items.map((item) => item.kind)).toEqual(["table", "text"]);
  });

  it("does not repeat a table a tile already draws", () => {
    const entry = entryWith([
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        [["X", "1", "2", "None", ""]],
      ),
    ]);
    expect(leftovers(entry, "cur")).toEqual([]);
  });

  it("lists analysis rows whose module is not in the pack", () => {
    const entry = entryWith([
      table(
        "What changed: the analysis",
        ["Module", "Status", "Cause", "Why"],
        [
          ["Fundamental credit (CP-2)", "Weakened", "New period", "x"],
          ["Liquidity (CP-2D)", "New", "New source", "y"],
        ],
      ),
    ]);
    expect(analysisRows(entry, "cur", new Set(["CP-2"])).map((row) => row.line)).toEqual([13]);
  });
});

describe("cause matching on the whole label", () => {
  const rowsOf = (rows: string[][]) =>
    entryWith([
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        rows,
      ),
    ]);

  it("gives each of two like-named measures its own cause and leaves neither as a fact", () => {
    const entry = rowsOf([
      ["EBITDA (reported)", "100", "110", "New period", "Reported up"],
      ["EBITDA (adjusted)", "120", "125", "Unresolved", "Adjusted up"],
    ]);
    const change: PublishedChanges = {
      pack: {
        measures: [
          measure("ebitda_reported", "100", "110", 10, { label: "EBITDA (reported)" }),
          measure("ebitda_adjusted", "120", "125", 5, { label: "EBITDA (adjusted)" }),
        ],
      },
      verdicts: verdicts(["ebitda_reported", "ebitda_adjusted"]),
    };
    const groups = classifyMeasures(change, () => undefined, entry, "cur");
    expect(groups.moved.map((m) => [m.key, m.cause])).toEqual([
      ["ebitda_reported", { kind: "written", text: "New period" }],
      ["ebitda_adjusted", { kind: "written", text: "Unresolved" }],
    ]);
    expect(issuerFacts(entry, "cur", groups.matchedLines).facts).toEqual([]);
  });

  it("trims a trailing unit only when it is the measure's own unit, and takes the trace from that row", () => {
    const entry = rowsOf([["Interest cover", "2.1x", "1.7x", "New period", ""]]);
    const change: PublishedChanges = {
      pack: {
        measures: [measure("coverage", "2.1", "1.7", -0.4, { label: "Interest Cover (x)" })],
      },
      verdicts: verdicts(["coverage"]),
    };
    const [item] = classifyMeasures(change, () => undefined, entry, "cur").moved;
    expect(item?.cause).toEqual({ kind: "written", text: "New period" });
    expect(item?.href).toMatch(/^\/report\/cur#evidence\/.*-12$/);
    const other: PublishedChanges = {
      pack: {
        measures: [measure("coverage", "2.1", "1.7", -0.4, { label: "Interest cover (reported)" })],
      },
      verdicts: verdicts(["coverage"]),
    };
    expect(classifyMeasures(other, () => undefined, entry, "cur").moved[0]?.cause).toEqual({
      kind: "unmatched",
    });
  });

  it("matches none when two rows would match one measure, and draws both rows as facts", () => {
    const entry = rowsOf([
      ["Net leverage", "6x", "7x", "New period", ""],
      ["net leverage", "6x", "7x", "Unresolved", ""],
    ]);
    const change: PublishedChanges = {
      pack: { measures: [measure("net_leverage", "6", "7", 1, { label: "Net leverage" })] },
      verdicts: verdicts(["net_leverage"]),
    };
    const groups = classifyMeasures(change, () => undefined, entry, "cur");
    expect(groups.moved[0]?.cause).toEqual({ kind: "unmatched" });
    expect(issuerFacts(entry, "cur", groups.matchedLines).facts).toHaveLength(2);
  });

  it("keeps the no-change row beside facts, and tells a written dash from an empty cell", () => {
    const entry = rowsOf([
      ["No material change", "—", "—", "None", "Nothing else moved."],
      ["New term loan", "", "Signed", "—", ""],
    ]);
    const { facts, noChange } = issuerFacts(entry, "cur", new Set());
    expect(noChange[0]?.reason).toEqual({ kind: "written", text: "Nothing else moved." });
    expect(facts[0]).toMatchObject({
      before: { kind: "absent" },
      after: { kind: "written", text: "Signed" },
      cause: { kind: "dash" },
      effect: { kind: "absent" },
    });
  });
});

describe("words", () => {
  it("names a module and drops a bracketed code the shared reader does not know", () => {
    expect(words("Short credit memo (CP-MEMO)")).toBe("Short credit memo");
    expect(words("Liquidity (CP-2D) and Other (CP-9X)")).toBe("Liquidity and Other");
  });
});

describe("handoff content that is off-contract", () => {
  it("draws a register-pattern Findings section as an Evidence link naming it, and a level-2 extra section as written", () => {
    const entry = entryWith([
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "Period table",
        level: 3,
        line: 5,
        blocks: [{ type: "text", line: 6, end: 6, text: "x" }],
      },
      {
        heading: "Comparison notes",
        level: 2,
        line: 20,
        blocks: [{ type: "text", line: 21, end: 21, text: "Notes on how the runs were matched." }],
      },
    ]);
    const rest = leftovers(entry, "cur");
    expect(rest.map((s) => s.heading)).toEqual(["Period table", "Comparison notes"]);
    expect(rest[0]?.items[0]).toMatchObject({ kind: "link", label: "Period table" });
    expect(rest[1]?.items[0]).toMatchObject({
      kind: "text",
      text: "Notes on how the runs were matched.",
    });
  });

  it("draws a ledger row whose Limitation cell is a dash but which carries a status and a note", () => {
    const result = ledgerOf(
      entryWith([
        table(
          "Limitations ledger",
          ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"],
          [["E1", "—", "—", "Closed", "Superseded by the new agreement"]],
        ),
      ]),
      "cur",
    );
    if (!result || "table" in result) throw new Error("expected groups");
    expect(result.groups[0]?.items[0]).toMatchObject({
      missing: true,
      note: "Superseded by the new agreement",
      noteLabel: "What closed it",
    });
  });
});

describe("final checks on matching, placeholders and ledger groups", () => {
  const rowsOf = (rows: string[][]) =>
    entryWith([
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        rows,
      ),
    ]);

  it("links an unmatched measure to the issuer table, never to an exact-text row the matcher refused", () => {
    const entry = rowsOf([
      ["Net leverage", "6x", "7x", "New period", ""],
      ["net leverage", "6x", "7x", "Unresolved", ""],
    ]);
    const change: PublishedChanges = {
      pack: { measures: [measure("net_leverage", "6", "7", 1, { label: "Net leverage" })] },
      verdicts: verdicts(["net_leverage"]),
    };
    const [item] = classifyMeasures(change, (label) => `#exact/${label}`, entry, "cur").moved;
    expect(item?.cause).toEqual({ kind: "unmatched" });
    // the table is at line 11; neither row (12, 13) is claimed
    expect(item?.href).toMatch(/^\/report\/cur#evidence\/.*-11$/);
  });

  it("draws every No material change row in order, and the written cause when the effect is a dash", () => {
    const entry = rowsOf([
      ["No material change", "—", "—", "Nothing moved at the issuer.", "—"],
      ["New facility", "", "Signed", "New source", "More debt"],
      ["No material change", "—", "—", "None", "Still nothing."],
    ]);
    const { noChange } = issuerFacts(entry, "cur", new Set());
    expect(noChange.map((row) => row.reason)).toEqual([
      { kind: "written", text: "Nothing moved at the issuer." },
      { kind: "written", text: "Still nothing." },
    ]);
    expect(noChange[0]?.href).toMatch(/-12$/);
    expect(noChange[1]?.href).toMatch(/-14$/);
  });

  it("drops a bracket only when it has the module-code shape, in either case", () => {
    expect(words("Short credit memo (cp-memo)")).toBe("Short credit memo");
    expect(words("Backstop lines (CP-backstop)")).toBe("Backstop lines (CP-backstop)");
    expect(words("Liquidity (CP-9X) and Downside (cp-2a)")).toBe("Liquidity and Downside");
  });

  it("gives a measure's effect the same states as a fact's", () => {
    const entry = rowsOf([
      ["A", "1x", "2x", "New period", ""],
      ["B", "1x", "2x", "New period", "Per filing.pdf p. 3 the effect is large"],
      ["C", "1x", "2x", "New period", "Wider cover"],
    ]);
    const change: PublishedChanges = {
      pack: {
        measures: ["A", "B", "C"].map((label) =>
          measure(label.toLowerCase(), "1", "2", 1, { label }),
        ),
      },
      verdicts: verdicts(["a", "b", "c"]),
    };
    expect(
      classifyMeasures(change, () => undefined, entry, "cur").moved.map((m) => m.effect),
    ).toEqual([
      { kind: "absent" },
      { kind: "referenced" },
      { kind: "written", text: "Wider cover" },
    ]);
  });

  it("keeps an empty status and a written dash apart, each its own group", () => {
    const result = ledgerOf(
      entryWith([
        table(
          "Limitations ledger",
          ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"],
          [
            ["E1", "—", "One", "", ""],
            ["E2", "—", "Two", "—", ""],
          ],
        ),
      ]),
      "cur",
    );
    if (!result || "table" in result) throw new Error("expected groups");
    expect(result.groups.map((g) => [g.heading, g.items.length])).toEqual([
      ["—", 1],
      ["Not stated", 1],
    ]);
  });
});

describe("last-round fixes", () => {
  const ledgerHeaders = ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"];

  it("draws two ledger tables without their reference columns", () => {
    const entry = entryWith([
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      table("Limitations ledger", ledgerHeaders, [["E1", "C9", "Margins", "Open", ""]]),
      table("Limitations ledger", ["Reference", "Limitation"], [["E2", "Revolver"]]),
    ]);
    const rest = leftovers(entry, "cur");
    const tables = rest
      .flatMap((s) => s.items)
      .flatMap((i) => (i.kind === "table" ? [i.table] : []));
    expect(tables.map((x) => x.headers)).toEqual([
      ["Limitation", "Status", "What closed it"],
      ["Limitation"],
    ]);
    expect(tables.flatMap((x) => x.rows.flatMap((r) => r.cells))).toEqual([
      "Margins",
      "Open",
      "",
      "Revolver",
    ]);
  });

  it("gives each measure an index and keeps a same-labelled pair apart", () => {
    const entry = entryWith([
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        [["Net leverage (x)", "6x", "7x", "New period", ""]],
      ),
    ]);
    const mk = (key: string, unit: string) => ({
      key,
      label: "Net leverage",
      prior: { value: "6", unit, period: "FY2025" },
      current: { value: "7", unit, period: "FY2026" },
      difference: 1,
      unit,
    });
    for (const order of [
      [mk("a", "US$m"), mk("b", "x")],
      [mk("b", "x"), mk("a", "US$m")],
    ]) {
      const change: PublishedChanges = {
        pack: { measures: order },
        verdicts: verdicts(["a", "b"]),
      };
      const groups = classifyMeasures(change, () => undefined, entry, "cur");
      const byIndex = new Map(groups.moved.map((m) => [m.index, m.href ?? ""]));
      const xIndex = order.findIndex((m) => m.unit === "x");
      expect(byIndex.get(xIndex)).toMatch(/-12$/);
      expect(byIndex.get(1 - xIndex)).toMatch(/-11$/);
    }
  });

  it("keeps a written dash effect a dash, and a referenced no-change cause a link", () => {
    const entry = entryWith([
      table(
        "What changed: the issuer",
        ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        [
          ["A", "1x", "2x", "New period", "—"],
          ["No material change", "—", "—", "Per filing.pdf p. 3", "—"],
          ["No material change", "—", "—", "NONE", "Still nothing."],
        ],
      ),
    ]);
    const change: PublishedChanges = {
      pack: { measures: [measure("a", "1", "2", 1, { label: "A" })] },
      verdicts: verdicts(["a"]),
    };
    expect(classifyMeasures(change, () => undefined, entry, "cur").moved[0]?.effect).toEqual({
      kind: "dash",
    });
    const { noChange } = issuerFacts(entry, "cur", new Set([12]));
    expect(noChange.map((row) => row.reason)).toEqual([
      { kind: "referenced" },
      { kind: "written", text: "Still nothing." },
    ]);
  });

  it("does not file the word Dash with the written dash", () => {
    const result = ledgerOf(
      entryWith([
        table("Limitations ledger", ledgerHeaders, [
          ["E1", "—", "One", "—", ""],
          ["E2", "—", "Two", "Dash", ""],
        ]),
      ]),
      "cur",
    );
    if (!result || "table" in result) throw new Error("expected groups");
    expect(result.groups.map((g) => [g.heading, g.items.length]).sort()).toEqual([
      ["Dash", 1],
      ["—", 1],
    ]);
  });
});
