import {
  commonPeriod,
  periodsOrdered,
  evidenceLink,
  factAt,
  fieldUnits,
  figure,
  groupKey,
  matchIssuers,
  NO_FILTERS,
  readBound,
  periodsOf,
  rank,
  trend,
  type Coverage,
  type CoverageRun,
  type Fact,
  type Issuer,
} from "./coverageData";

const LEVERAGE = "cp-1/leverage/net";
const CONFIDENCE = "cp-2/reader-summary/confidence";
const FINDING = "cp-2/reader-summary/finding";
const MATURITY = "cp-1/debt-maturities/debt-maturing";

function run(key: string, asOf: string, pathwayTitle = "Full credit assessment"): CoverageRun {
  return {
    key,
    folder: `folder ${key}`,
    asOf,
    pathway: "credit_snapshot",
    pathwayTitle,
    cells: { "CP-1": { state: "assessed", gaps: 0 }, "CP-6": { state: "not-assessable" } },
    other: [],
  };
}

function fact(runKey: string, issuer: string, field: string, more: Partial<Fact>): Fact {
  return {
    field,
    issuer,
    run: runKey,
    period: null,
    row: null,
    text: "",
    at: null,
    line: 1,
    output: `${runKey}/CP-1.md`,
    sha256: "a".repeat(64),
    ...more,
  };
}

const data: Coverage = {
  columns: [
    { code: "CP-1", title: "Canonical data foundation" },
    { code: "CP-6", title: "Ic debate challenge" },
  ],
  issuers: [
    {
      key: "alpha",
      name: "Alpha",
      sector: "Aerospace",
      runs: [run("a2", "2026-03-31"), run("a1", "2025-03-31")],
    },
    { key: "beta", name: "Beta", sector: "Retail", runs: [run("b1", "2026-03-31")] },
    {
      key: "gamma",
      name: "Gamma",
      sector: null,
      runs: [run("g1", "2026-06-30", "Lite credit assessment")],
    },
    { key: "delta", name: "Delta", sector: "Retail", runs: [run("d1", "2026-03-31")] },
  ],
  fields: [
    {
      id: LEVERAGE,
      module: "CP-1",
      group: "Leverage",
      label: "Net debt / EBITDA",
      kind: "number",
      series: "period",
    },
    {
      id: CONFIDENCE,
      module: "CP-2",
      group: "Reader summary",
      label: "Confidence",
      kind: "choice",
    },
    { id: FINDING, module: "CP-2", group: "Reader summary", label: "Finding", kind: "text" },
  ],
  facts: [
    fact("a2", "alpha", LEVERAGE, { period: "FY2024", text: "5.1", at: 5.1, unit: "x" }),
    fact("a2", "alpha", LEVERAGE, { period: "FY2025", text: "4.6", at: 4.6, unit: "x" }),
    fact("a1", "alpha", LEVERAGE, { period: "FY2024", text: "5.3", at: 5.3, unit: "x" }),
    fact("b1", "beta", LEVERAGE, { period: "FY2025", text: "0.0", at: 0, unit: "x" }),
    fact("g1", "gamma", LEVERAGE, { period: "FY2025", text: "1,250", at: 1250, unit: "US$m" }),
    fact("d1", "delta", LEVERAGE, {
      period: "FY2025",
      text: "Not supplied: no cash",
      gap: true,
      unit: "x",
    }),
    fact("b1", "beta", MATURITY, { period: "Thereafter", text: "900", at: 900, unit: "US$m" }),
    fact("b1", "beta", MATURITY, { period: "FY2027", text: "40", at: 40, unit: "US$m" }),
    fact("b1", "beta", MATURITY, { period: "FY2026 / 2026-09-30", text: "5", at: 5, unit: "US$m" }),
    fact("a2", "alpha", CONFIDENCE, { text: "High" }),
    fact("b1", "beta", CONFIDENCE, { text: "Low" }),
    fact("a2", "alpha", FINDING, { text: "Covenant headroom is thin.", impact: "Waiver risk" }),
  ],
};

const names = (issuers: readonly { name: string }[]) => issuers.map((issuer) => issuer.name);

test("periods are read as written, ordered by year, and the view opens on the most stated", () => {
  expect(periodsOf(data, data.issuers, LEVERAGE)).toEqual(["FY2024", "FY2025"]);
  expect(commonPeriod(data, data.issuers, LEVERAGE)).toBe("FY2025");
  // "Thereafter" cannot be ordered, so the module's own order stands.
  expect(periodsOf(data, data.issuers, MATURITY)).toEqual([
    "Thereafter",
    "FY2027",
    "FY2026 / 2026-09-30",
  ]);
  expect(factAt(data, "a2", LEVERAGE, "FY2024")?.text).toBe("5.1");
  expect(factAt(data, "b1", LEVERAGE, "FY2024")).toBeUndefined();
  expect(commonPeriod(data, data.issuers, "no such field")).toBeNull();
});

test("a rank reads one period, keeps units apart, keeps zero and lists missing separately", () => {
  const ranking = rank(data, data.issuers, LEVERAGE, "FY2025", "low");
  expect(
    ranking.units.map((u) => [u.unit, u.rows.map((r) => [r.issuer.name, r.fact.text])]),
  ).toEqual([
    [
      "x",
      [
        ["Beta", "0.0"],
        ["Alpha", "4.6"],
      ],
    ],
    ["US$m", [["Gamma", "1,250"]]],
  ]);
  expect(
    ranking.missing.map((m) => [m.issuer.name, m.fact?.text, m.stated, m.repeated.length]),
  ).toEqual([["Delta", "Not supplied: no cash", [], 0]]);
  const high = rank(data, data.issuers, LEVERAGE, "FY2025", "high").units[0]?.rows ?? [];
  expect(high.map((row) => row.issuer.name)).toEqual(["Alpha", "Beta"]);
});

test("an issuer with no figure for the chosen period is never ranked on another period", () => {
  const ranking = rank(data, data.issuers, LEVERAGE, "FY2024", "high");
  expect(ranking.units.map((u) => u.rows.map((r) => [r.issuer.name, r.fact.text]))).toEqual([
    [["Alpha", "5.1"]],
  ]);
  expect(
    ranking.missing.map((m) => [m.issuer.name, m.fact?.text, m.stated, m.repeated.length]),
  ).toEqual([
    ["Beta", undefined, ["FY2025"], 0],
    ["Gamma", undefined, ["FY2025"], 0],
    ["Delta", undefined, [], 0],
  ]);
});

test("filters read the newest run only, and a numeric bound never removes an issuer it did not compare", () => {
  const at = (filters: Partial<typeof NO_FILTERS>, period: string | null = "FY2025") =>
    names(matchIssuers(data, { ...NO_FILTERS, ...filters }, LEVERAGE, period));
  expect(at({})).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
  // Delta states no figure for FY2025, so no bound compares it: it stays, whatever the bound.
  expect(at({ max: "5" })).toEqual(["Alpha", "Beta", "Delta"]);
  expect(at({ min: "5" })).toEqual(["Gamma", "Delta"]);
  expect(at({ min: "0", max: "0" })).toEqual(["Beta", "Delta"]);
  // Only Alpha states a figure for FY2024; the others were not compared and stay.
  expect(at({ max: "5.1" }, "FY2024")).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
  expect(at({ max: "5" }, "FY2024")).toEqual(["Beta", "Gamma", "Delta"]);
  expect(at({ max: "5" }, null)).toHaveLength(4);
  expect(at({ sector: "Retail" })).toEqual(["Beta", "Delta"]);
  expect(at({ pathway: "Lite credit assessment" })).toEqual(["Gamma"]);
  expect(at({ choice: CONFIDENCE, word: "High" })).toEqual(["Alpha"]);
  expect(at({ query: "waiver" })).toEqual(["Alpha"]);
  expect(at({ query: "headroom IS thin" })).toEqual(["Alpha"]);
  expect(at({ module: "CP-6", state: "assessed" })).toEqual([]);
  expect(at({ module: "CP-6", state: "not-assessable" })).toHaveLength(4);
});

test("groups are the delivered word, the sector or the pathway", () => {
  const [alpha, , gamma] = data.issuers;
  if (!alpha || !gamma) throw new Error("fixture");
  expect(groupKey(data, alpha, CONFIDENCE)).toBe("High");
  expect(groupKey(data, gamma, CONFIDENCE)).toBe("Not stated");
  expect(groupKey(data, gamma, "sector")).toBe("Sector not recorded");
  expect(groupKey(data, gamma, "pathway")).toBe("Lite credit assessment");
  expect(groupKey(data, alpha, "none")).toBe("");
});

test("a trend follows the module's periods, one line per issuer's newest run, in one unit", () => {
  expect(fieldUnits(data, data.issuers, LEVERAGE)).toEqual(["US$m", "x"]);
  const { periods, series } = trend(data, data.issuers, LEVERAGE, "x");
  expect(periods).toEqual(["FY2024", "FY2025"]);
  expect(series.map((s) => [s.name, s.run.key, s.points.map((p) => p?.text ?? null)])).toEqual([
    ["Alpha", "a2", ["5.1", "4.6"]],
    ["Beta", "b1", [null, "0.0"]],
  ]);
});

test("a figure is drawn as written and links to its own line of evidence", () => {
  const [first, , , , money, gap] = data.facts;
  const [alpha] = data.issuers;
  if (!first || !money || !gap || !alpha?.runs[0]) throw new Error("fixture");
  expect(figure(first)).toBe("5.1x");
  expect(figure(money)).toBe("$1,250m");
  expect(figure(gap)).toBe("Not supplied: no cash");
  expect(evidenceLink(alpha.runs[0], first)).toBe(
    `/report/folder%20a2#evidence/a2%2FCP-1.md~${"a".repeat(64)}-1`,
  );
});

test("a period of one form is put in time order whatever order the rows are in", () => {
  const dated = (period: string) =>
    fact("b1", "beta", "x", { period, text: "1", at: 1, unit: "x" });
  const mixed: Coverage = {
    ...data,
    facts: [
      dated("FY2025 / 2025-06-30"),
      dated("FY2024 / 2024-12-28"),
      dated("FY2023 / 2023-12-30"),
    ],
  };
  expect(periodsOf(mixed, mixed.issuers, "x")).toEqual([
    "FY2023 / 2023-12-30",
    "FY2024 / 2024-12-28",
    "FY2025 / 2025-06-30",
  ]);
  // A date written in words is read by its month and year.
  const loose: Coverage = { ...data, facts: [dated("30 June 2025"), dated("31 March 2025")] };
  expect(periodsOf(loose, loose.issuers, "x")).toEqual(["31 March 2025", "30 June 2025"]);
  // A label with no year is not placed, so the modules' own order stands.
  const unread: Coverage = { ...data, facts: [dated("Second half"), dated("First half")] };
  expect(periodsOf(unread, unread.issuers, "x")).toEqual(["Second half", "First half"]);
});

test("a period stated twice has no one figure: it is not ranked, bounded or drawn", () => {
  const twice: Coverage = {
    ...data,
    facts: [
      ...data.facts,
      fact("a2", "alpha", LEVERAGE, { period: "FY2025", text: "4.1", at: 4.1, unit: "x" }),
    ],
  };
  expect(factAt(twice, "a2", LEVERAGE, "FY2025")).toBeUndefined();
  const ranking = rank(twice, twice.issuers, LEVERAGE, "FY2025", "high");
  expect(ranking.units[0]?.rows.map((row) => row.issuer.name)).toEqual(["Beta"]);
  const alpha = ranking.missing.find((item) => item.issuer.name === "Alpha");
  expect(alpha?.repeated.map((row) => row.text)).toEqual(["4.6", "4.1"]);
  // Alpha states the period twice (no one figure), Delta none: neither was compared, so both stay.
  expect(names(matchIssuers(twice, { ...NO_FILTERS, max: "5" }, LEVERAGE, "FY2025"))).toEqual([
    "Alpha",
    "Beta",
    "Delta",
  ]);
  const [series] = trend(twice, twice.issuers, LEVERAGE, "x").series;
  expect(series?.points.map((point) => point?.text ?? null)).toEqual(["5.1", null]);
});

test("a comma that is not a thousands group is invalid, never read as a different number", () => {
  for (const typed of ["1,0", "1,00", "12,34", "1,2345", ",5", "1,000,0"])
    expect(readBound(typed)).toEqual({ value: null, invalid: true });
  expect(readBound("1,000")).toEqual({ value: 1000, invalid: false });
  expect(readBound("1,234,567.5")).toEqual({ value: 1234567.5, invalid: false });
});

test("a bound compares one reporting unit and never removes an issuer it did not compare", () => {
  const mixed: Coverage = {
    ...data,
    facts: [
      fact("a2", "alpha", LEVERAGE, { period: "FY2025", text: "4.6", at: 4.6, unit: "x" }),
      fact("b1", "beta", LEVERAGE, { period: "FY2025", text: "610", at: 610, unit: "%" }),
    ],
  };
  const bound = { ...NO_FILTERS, min: "5" };
  // Gamma and Delta state nothing for the period: not compared, so they stay.
  expect(names(matchIssuers(mixed, bound, LEVERAGE, "FY2025", "x"))).toEqual([
    "Beta",
    "Gamma",
    "Delta",
  ]);
  expect(names(matchIssuers(mixed, bound, LEVERAGE, "FY2025", "%"))).toEqual([
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
  ]);
});

test("a bound may carry thousands separators; any other text is invalid, not ignored silently", () => {
  expect(readBound("")).toEqual({ value: null, invalid: false });
  expect(readBound(" 1,250 ")).toEqual({ value: 1250, invalid: false });
  expect(readBound("-0.5")).toEqual({ value: -0.5, invalid: false });
  expect(readBound("5x")).toEqual({ value: null, invalid: true });
  expect(names(matchIssuers(data, { ...NO_FILTERS, min: "1,000" }, LEVERAGE, "FY2025"))).toEqual([
    "Gamma",
    "Delta",
  ]);
});

const ltm = (rows: [string, number][]): Coverage => ({
  ...data,
  issuers: [data.issuers[0] as Issuer],
  facts: rows.map(([period, at], line) =>
    fact("a2", "alpha", LEVERAGE, { period, text: String(at), at, unit: "x", line }),
  ),
});

// Owner's ruling, 2026-11-25: fiscal years oldest first, then year to date, last twelve months,
// pro forma and forecast periods; every expected order below is written by hand.
test("a trend puts last twelve months, quarters and forecasts in the one period order", () => {
  const one = (rows: [string, number][]) => trend(ltm(rows), ltm(rows).issuers, LEVERAGE, "x");
  const newestFirst = one([
    ["LTM Jun 2026", 4.0],
    ["LTM Dec 2025", 4.5],
    ["LTM Jun 2025", 5.0],
    ["LTM Dec 2024", 5.5],
  ]);
  expect(newestFirst.ordered).toBe(true);
  expect(newestFirst.periods).toEqual([
    "LTM Dec 2024",
    "LTM Jun 2025",
    "LTM Dec 2025",
    "LTM Jun 2026",
  ]);
  const quarters = one([
    ["Q3 2025", 1],
    ["Q4 2025", 2],
    ["Q1 2025", 3],
  ]);
  expect(quarters.ordered).toBe(true);
  expect(quarters.periods).toEqual(["Q1 2025", "Q3 2025", "Q4 2025"]);
  const mixed = one([
    ["FY2026E", 1],
    ["PF LTM Dec 2025", 5],
    ["LTM Dec 2025", 4],
    ["FY2024", 2],
    ["FY2025", 3],
  ]);
  expect(mixed.ordered).toBe(true);
  expect(mixed.periods).toEqual(["FY2024", "FY2025", "LTM Dec 2025", "PF LTM Dec 2025", "FY2026E"]);
  const fiscal = one([
    ["FY2025", 3],
    ["FY2023", 1],
    ["FY2024", 2],
  ]);
  expect(fiscal.ordered).toBe(true);
  expect(fiscal.periods).toEqual(["FY2023", "FY2024", "FY2025"]);
  expect(
    one([
      ["2025-03-31", 1],
      ["2024-09-30", 2],
    ]).ordered,
  ).toBe(true);
  // A label the rule cannot read leaves the modules' own order, and says so.
  const unread = one([
    ["Second half", 1],
    ["FY2024", 2],
  ]);
  expect(unread.ordered).toBe(false);
  expect(unread.periods).toEqual(["Second half", "FY2024"]);
  // One label is trivially in order, whatever it is.
  expect(one([["Second half", 1]]).ordered).toBe(true);
});

test("a period the rule cannot order is opened on the first stated, never on 'the later'", () => {
  const unordered = ltm([
    ["Second half", 4.0],
    ["First half", 4.5],
  ]);
  expect(periodsOrdered(unordered, unordered.issuers, LEVERAGE)).toBe(false);
  expect(commonPeriod(unordered, unordered.issuers, LEVERAGE)).toBe("Second half");
  const newestFirst = ltm([
    ["LTM Jun 2026", 4.0],
    ["LTM Dec 2025", 4.5],
  ]);
  expect(periodsOrdered(newestFirst, newestFirst.issuers, LEVERAGE)).toBe(true);
  expect(commonPeriod(newestFirst, newestFirst.issuers, LEVERAGE)).toBe("LTM Jun 2026");
  const ordered = ltm([
    ["FY2024", 4.0],
    ["FY2025", 4.5],
  ]);
  expect(periodsOrdered(ordered, ordered.issuers, LEVERAGE)).toBe(true);
  expect(commonPeriod(ordered, ordered.issuers, LEVERAGE)).toBe("FY2025");
});

// Review of 2026-11-25: Coverage opens on a reported period (an actual, a year to date or a last
// twelve months) where the newest runs state one, never on a pro forma or forecast period that
// happens to be stated as often.
test("the view opens on the most stated reported period, not a pro forma or forecast one", () => {
  const equal = ltm([
    ["FY2026E", 3.1],
    ["PF LTM Jun 2025", 3.9],
    ["FY2024", 4.5],
    ["LTM Jun 2025", 4.2],
  ]);
  expect(commonPeriod(equal, equal.issuers, LEVERAGE)).toBe("LTM Jun 2025");
  // A forecast stated by more runs than any reported period still does not open the view.
  const two: Coverage = {
    ...data,
    facts: [
      fact("a2", "alpha", LEVERAGE, { period: "FY2026E", text: "3.1", at: 3.1, unit: "x" }),
      fact("b1", "beta", LEVERAGE, { period: "FY2026E", text: "2.9", at: 2.9, unit: "x" }),
      fact("a2", "alpha", LEVERAGE, { period: "FY2024", text: "4.5", at: 4.5, unit: "x" }),
      fact("b1", "beta", LEVERAGE, { period: "FY2025", text: "4.0", at: 4.0, unit: "x" }),
    ],
  };
  expect(commonPeriod(two, two.issuers, LEVERAGE)).toBe("FY2025");
  // With no reported period stated, the most stated period of any class, the later of equals.
  const forward = ltm([
    ["FY2027E", 2.8],
    ["PF FY2025", 3.9],
    ["FY2026E", 3.1],
  ]);
  expect(commonPeriod(forward, forward.issuers, LEVERAGE)).toBe("FY2027E");
  // Where a label cannot be placed there is no "later": the first reported period as written.
  const unordered = ltm([
    ["FY2026E", 3.1],
    ["Run rate", 4.4],
    ["FY2024", 4.5],
    ["FY2023", 4.9],
  ]);
  expect(periodsOrdered(unordered, unordered.issuers, LEVERAGE)).toBe(false);
  expect(commonPeriod(unordered, unordered.issuers, LEVERAGE)).toBe("FY2024");
  // No figure stated for any period: still a reported period, the latest.
  const gaps: Coverage = {
    ...data,
    issuers: [data.issuers[0] as Issuer],
    facts: ["FY2026E", "FY2024", "FY2023"].map((period) =>
      fact("a2", "alpha", LEVERAGE, { period, text: "Not supplied", gap: true }),
    ),
  };
  expect(commonPeriod(gaps, gaps.issuers, LEVERAGE)).toBe("FY2024");
});

it("a search does not keep an issuer on a decision module's passage", () => {
  const base = run("r1", "2026-03-31");
  const issuer: Issuer = { key: "a", name: "Alpha", sector: null, runs: [base] };
  const text = (module: string): Coverage["fields"][number] => ({
    id: `${module.toLowerCase()}/reader-summary/bottomline`,
    module,
    group: "Findings",
    label: "Bottom line",
    kind: "text",
  });
  const fact = (module: string, words: string): Fact => ({
    field: text(module).id,
    issuer: "a",
    run: "r1",
    period: null,
    row: null,
    text: words,
    at: null,
    line: 1,
    output: `f/${module}.md`,
    sha256: "a".repeat(64),
  });
  const data: Coverage = {
    columns: [],
    issuers: [issuer],
    fields: [text("CP-2"), text("CP-6")],
    facts: [fact("CP-2", "moderate leverage"), fact("CP-6", "add exposure")],
  };
  expect(matchIssuers(data, { ...NO_FILTERS, query: "moderate" }, null)).toHaveLength(1);
  expect(matchIssuers(data, { ...NO_FILTERS, query: "add exposure" }, null)).toHaveLength(0);
});
