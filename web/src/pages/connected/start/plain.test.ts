import { type MockInstance } from "vitest";
import {
  comparisonCaveat,
  copilotEfforts,
  copilotPairVerified,
  documentRefusal,
  filedElsewhere,
  issuerIdFor,
  issuerIdRefusal,
  issuerKey,
  lookupSentence,
  refusalLines,
  refusalProblems,
} from "./plain";

it("treats an absent capability map as legacy support but an empty map as unverified", () => {
  expect(copilotPairVerified(undefined, "gpt", "balanced")).toBe(true);
  expect(copilotPairVerified({}, "gpt", "balanced")).toBe(false);
});

it("limits Luna to the verified extra-high effort", () => {
  expect(copilotEfforts({ luna: ["fast", "xhigh"] }, "luna")).toEqual(["xhigh"]);
  expect(copilotPairVerified({ luna: ["fast", "xhigh"] }, "luna", "fast")).toBe(false);
  expect(copilotPairVerified({ luna: ["xhigh"] }, "luna", "xhigh")).toBe(true);
  expect(copilotEfforts({ gpt: ["fast", "xhigh"] }, "gpt")).toEqual(["fast"]);
});

const LOOKUP_LINES: [string, string][] = [
  [
    "Web lookup: off: synthetic case (default); --web-lookup on forces it",
    "Off, because this is a synthetic case.",
  ],
  [
    "Lookup:   off: synthetic case (default); --web-lookup on forces it",
    "Off, because this is a synthetic case.",
  ],
  [
    "Lookup:   on: CP-DR may fetch allowlisted public pages and SEC EDGAR (public case default)",
    "On, because this is a public case: Research questions may fetch allowlisted public pages and SEC EDGAR.",
  ],
  [
    "Lookup:   on: CP-DR may fetch allowlisted public pages and SEC EDGAR (public case default); case hosts: example.com, data.example.org",
    "On, because this is a public case: Research questions may fetch allowlisted public pages and SEC EDGAR. Case hosts: example.com, data.example.org.",
  ],
  ["Lookup:   on (forced by --web-lookup on)", "On, because it was set that way for this run."],
  ["Lookup:   off (forced by --web-lookup off)", "Off, because it was set that way for this run."],
  [
    "Lookup:   on (as recorded when this run folder was started)",
    "On, as recorded when this run folder was started.",
  ],
  [
    "Lookup:   off (as recorded when this run folder was started)",
    "Off, as recorded when this run folder was started.",
  ],
  [
    "SEC:      sec.gov lookups will be refused: DEPLOY_WORKFLOW_SEC_USER_AGENT is not set",
    "SEC lookups will be refused because the contact string for them is not set.",
  ],
];

it.each(LOOKUP_LINES)("writes the lookup line %s as a sentence", (line, sentence) => {
  expect(lookupSentence(line)).toBe(sentence);
});

it("returns a lookup line it does not recognise as it is", () => {
  expect(lookupSentence("Lookup:   something new")).toBe("something new");
});

it("reads the comparison caveat from the changes line", () => {
  const head = "CP-8 compares with the credit_snapshot run as of 2025-03-31";
  expect(comparisonCaveat(`${head} (20261116-083145-01)`)).toBe("");
  expect(comparisonCaveat(`${head} (20261116-083145-01; earlier format)`)).toBe(
    " (earlier format)",
  );
  expect(comparisonCaveat(`${head} (20261116-083145-01; earlier methods)`)).toBe(
    " (earlier methods)",
  );
  expect(comparisonCaveat(`${head} (20261116-083145-01; earlier format, earlier methods)`)).toBe(
    " (earlier format, earlier methods)",
  );
});
it("reads the caveat from the compared run's bracket, not a later not-used note", () => {
  expect(
    comparisonCaveat(
      "CP-8 compares with the credit_snapshot run as of 2025-03-31 (20261116-083145-01) (not used: 20261001-000000-01: its issuer name is 'acme earlier methods', not 'Acme')",
    ),
  ).toBe("");
});

it("shows a refusal in the screen's own section and box labels", () => {
  expect(refusalLines("assumptions.cp4c.ev_multiple: must be 99.99 or less.")).toEqual([
    "Scenario assumptions · Recovery & fulcrum · EV multiple: must be 99.99 or less.",
  ]);
  expect(refusalLines("deal_terms[1].size_m: must be a number.")).toEqual([
    "Facilities and deal terms · Facility 2 · Size (m): must be a number.",
  ]);
  const two = refusalLines(
    "deal_terms[0].size_m: is required.; assumptions.cp2e.rate_shocks_bps: is required.",
  );
  expect(two).toHaveLength(2);
  expect(two[1]).toBe(
    "Scenario assumptions · Rates, FX & hedging · Rate shocks (bps): is required.",
  );
  const [multiple] = refusalLines("valuation.user_multiple.value: is required.");
  expect(multiple).toMatch(/^Valuation and peers · .*Multiple \(x\): is required\.$/);
  expect(multiple).not.toMatch(/valuation\.|user_multiple/);
  expect(refusalLines("valuation.peers: must be empty when peer_source is none.")).toEqual([
    "Valuation and peers · Peers: must be empty when Peer source is No peers.",
  ]);
  const [scenario] = refusalLines(
    "assumptions.cp2a.scenarios[1].ebitda_decline_pct: must be 100 or less.",
  );
  expect(scenario).toMatch(/^Scenario assumptions · Downside · .*2.*EBITDA decline \(%\)/);
  expect(scenario).not.toMatch(/cp2a|scenarios\[|ebitda_decline_pct/);
});

it("returns what it does not recognise unchanged, as one line", () => {
  expect(refusalLines("foo.bar_baz[2].qux: must be x.")).toEqual([
    "foo.bar_baz[2].qux: must be x.",
  ]);
  const cap = "The pathway cap changed while preparing this summary. Review the run again.";
  expect(refusalLines(cap)).toEqual([cap]);
  expect(refusalLines("Read a; b: c")).toEqual(["Read a; b: c"]);
});

it.each([
  "run.as_of",
  "run.current_period",
  "run.prior_period",
  "run.reporting_currency",
  "run.cutoff",
  "identity.issuer_name",
  "identity.issuer_id",
  "identity.issue_classification",
  "identity.borrower_name",
  "identity.parent_name",
  "identity.guarantors",
  "identity.aliases",
  "identity.ticker",
  "identity.sector",
  "identity.country",
  "identity.sponsor",
  "deal_terms[0].facility_id",
  "deal_terms[0].instrument",
  "deal_terms[0].currency",
  "deal_terms[0].tenor_years",
  "deal_terms[0].talk_spread_bps_low",
  "deal_terms[0].floor_pct",
  "deal_terms[0].maturity",
  "deal_terms[0].call_protection",
  "deal_terms[0].use_of_proceeds",
  "quotes[0].facility_id",
  "quotes[0].kind",
  "quotes[0].bid",
  "quotes[0].yield_pct",
  "quotes[0].spread_bps",
  "quotes[0].as_of",
  "quotes[0].provider",
  "ratings[0].agency",
  "ratings[0].scope",
  "ratings[0].rating",
  "ratings[0].outlook",
  "research_questions[0].text",
  "research_questions[0].focus_module",
  "valuation.peer_source",
  "valuation.basis",
  "valuation.issuer_market.market_cap_m",
  "valuation.issuer_market.net_debt_m",
  "valuation.issuer_market.ev_m",
  "valuation.issuer_market.ebitda_basis",
  "valuation.issuer_market.as_of",
  "valuation.issuer_market.source",
  "valuation.peers[0].name",
  "valuation.peers[0].ev_m",
  "valuation.peers[0].ebitda_m",
  "valuation.precedents[0].target",
  "valuation.precedents[0].acquirer",
  "valuation.precedents[0].date",
  "valuation.user_multiple.basis",
  "valuation.user_multiple.rationale",
  "assumptions.cp2a.rationale",
  "assumptions.cp2d.horizon_months",
  "assumptions.cp2d.minimum_cash_m",
  "assumptions.cp2e.fx_shocks_pct",
  "assumptions.cp2e.hedge_ratio_pct",
  "assumptions.cp3c.repricing_bps",
  "assumptions.cp3d.recovery_pct",
  "attachments.legal_documents",
  "module_options.cp3_mode",
  "module_options.cp6_deep_debate",
])("names the box for a missing %s", (path) => {
  const lines = refusalLines(`${path}: is required.`);
  expect(lines).toHaveLength(1);
  expect(lines[0]).not.toContain(path);
  expect(lines[0]).not.toMatch(/[a-z]+_[a-z_]+/);
  expect(lines[0]).not.toMatch(/\[\d+\]/);
  expect(lines[0]).toMatch(/: is required\.$/);
});

it("names a list item's line in the box it belongs to", () => {
  expect(refusalLines("identity.guarantors[1]: list items must not be empty.")).toEqual([
    "Issuer details · Guarantors · entry 2: list items must not be empty.",
  ]);
  expect(refusalLines("identity.aliases[0]: list items must not be empty.")).toEqual([
    "Issuer details · Other names in the filings · entry 1: list items must not be empty.",
  ]);
});

it("shows the box's own option value by its label, whole words only", () => {
  expect(refusalLines("valuation.basis: issuer_trading needs a listed issuer.")).toEqual([
    "Valuation and peers · Valuation basis: Issuer's own trading multiple needs a listed issuer.",
  ]);
  expect(refusalLines("valuation.basis: none of these apply to autonomous issuers.")).toEqual([
    "Valuation and peers · Valuation basis: none of these apply to autonomous issuers.",
  ]);
});

it("keeps two identical problems as two lines", () => {
  const one = "assumptions.cp2e.rate_shocks_bps: is required.";
  expect(refusalLines(`${one}; ${one}`)).toHaveLength(2);
});

describe("a refusal line never shows raw data", () => {
  const FORM_SENTENCE = "The form could not be read by the service. Reload the page and try again.";
  let warn: MockInstance<typeof console.warn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("D1 leaves text that is not in the service's form whole", () => {
    const text = "Error: the service failed; Detail: try later";
    expect(refusalLines(text)).toEqual([text]);
  });

  it("D2 spells an unknown box out in plain words and logs the raw problem once", () => {
    expect(refusalLines("deal_terms[0].zzz_yyy: must be x.")).toEqual([
      "Facilities and deal terms · Facility 1 · Zzz yyy: must be x.",
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("deal_terms[0].zzz_yyy");
  });

  it("D3 turns form-level problems into one fixed sentence", () => {
    expect(refusalLines("$: duplicate key 'run'")).toEqual([FORM_SENTENCE]);
    expect(refusalLines("schema: must be 'x/1'.")).toEqual([FORM_SENTENCE]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("D4 puts the service's choice message in plain words", () => {
    const [line = ""] = refusalLines(
      "run.run_type: Input should be 'research', 'primary' or 'secondary'",
    );
    expect(line).toMatch(/: choose one of the listed options\.$/);
    expect(line).not.toMatch(/'|research|primary|secondary/);
  });

  it("D5 puts a missing value in plain words", () => {
    const lines = refusalLines("identity.issuer_name: Field required");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/: required\.$/);
  });

  it("D6 puts an extra input in plain words without its name", () => {
    const lines = refusalLines("run.foo: Extra inputs are not permitted");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/: is not a value this form sends\. Reload the page and try again\.$/);
    expect(lines[0]).not.toMatch(/run\.foo/);
  });

  it("D7 names the box and the option a message mentions", () => {
    const lines = refusalLines(
      "valuation.peers[0].ev_m: must be blank when peer_source is user_list.",
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toMatch(/peer_source|user_list/);
    expect(lines[0]).toContain("Peer source");
    expect(lines[0]).toMatch(/Peer source is .*\S/);
  });

  it("D8 says this value for a name no box carries, and logs it", () => {
    const lines = refusalLines("quotes[0].bid: must be at most ask_price_limit.");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("this value");
    expect(lines[0]).not.toContain("ask_price_limit");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("D9 counts list entries, not lines", () => {
    expect(refusalLines("identity.guarantors[1]: list items must not be empty.")).toEqual([
      "Issuer details · Guarantors · entry 2: list items must not be empty.",
    ]);
  });

  // [path, message]: every message template of `_Rules` in src/deploy_vii/context.py, with the
  // values filled in as the service writes them (the line of each is named).
  const TEMPLATES: readonly (readonly [string, string])[] = [
    ["run.as_of", "required."], // l.457
    [
      "research_questions[0].text",
      "contains a pipe character, a line feed or a carriage return, which a dossier table cell cannot hold.",
    ], // l.461-462
    ["research_questions[0].text", "contains <<<, which a dossier block cannot show."], // l.465
    ["deal_terms[0].size_m", "no thousands separators; write 1250, not 1,250."], // l.789
    ["deal_terms[0].size_m", "enter a plain number such as 1250 or 99.5."], // l.791
    ["deal_terms[0].tenor_years", "enter a whole number."], // l.793
    ["deal_terms[0].floor_pct", "use at most 2 decimal places."], // l.795
    ["deal_terms[0].floor_pct", "must be 0 or more."], // l.798
    ["assumptions.cp4c.ev_multiple", "must be above 0."], // l.799
    ["assumptions.cp4c.ev_multiple", "must be 99.99 or less."], // l.800
    ["assumptions.cp3d.recovery_pct", "must be below 100."], // l.801
    ["run.as_of", "enter a date as YYYY-MM-DD."], // l.498
    [
      "quotes[0].as_of",
      "is after the run as-of date (2026-01-01); sources dated after it are refused.",
    ], // l.502
    ["run.reporting_currency", "use three uppercase letters, such as USD."], // l.510
    ["assumptions.cp2e.rate_shocks_bps", "give at most 3 values."], // l.517
    ["assumptions.cp2e.rate_shocks_bps", '"5": must be 0 or more.'], // l.533
    ["assumptions.cp2e.rate_shocks_bps", "values must increase."], // l.535
    ["run.current_period", "use q1-2026, h2-2026 or fy-2025 (lowercase)."], // l.564
    ["run.prior_period", "must be earlier than the current period."], // l.569
    ["run.current_period", "earnings runs compare quarters or fiscal years only."], // l.580
    ["run.prior_period", "must be the same kind as the current period."], // l.582
    [
      "identity.issuer_id",
      "use lowercase letters, digits and hyphens only, not starting with a hyphen.",
    ], // l.592
    ["identity.guarantors[0]", "list items must not be empty."], // l.597
    ["identity.ticker", "must be empty for an unlisted issuer."], // l.599
    ["deal_terms", "add at least one facility row."], // l.604
    ["deal_terms", "give at most 20 rows."], // l.635
    ["deal_terms[0].talk_spread_bps_low", "low must not exceed high."], // l.627
    ["quotes[0].bid", "bid must not exceed ask."], // l.645
    ["valuation.precedents", "must be empty when basis is auto."], // l.666
    ["valuation.issuer_market", "must be blank when basis is blend."], // l.670
    ["valuation.user_multiple", "must be blank when basis is precedents."], // l.673
    ["valuation.peers", "must be empty when peer_source is cp_dr_public."], // l.685
    ["valuation.peers[0].ev_m", "must be blank when peer_source is user_list."], // l.693
    ["valuation.basis", "issuer_trading needs a listed issuer."], // l.703
    ["valuation.issuer_market.ev_m", "give EV, or both market cap and net debt."], // l.710
    ["assumptions.cp2a.scenarios", "add 1 to 4 scenarios."], // l.717
  ];

  it.each(TEMPLATES)("D10 %s: %s", (path, message) => {
    const lines = refusalLines(`${path}: ${message}`);
    expect(lines).toHaveLength(1);
    const [line = ""] = lines;
    expect(line).not.toMatch(/\b[a-z]+_[a-z0-9_]+\b/);
    expect(line).not.toMatch(/\[\d+\]/);
    expect(line).not.toMatch(/'[a-z_]+'/);
    expect(line).not.toMatch(/\b[a-z_]+\.[a-z_]+/);
  });
});

describe("low batch", () => {
  let warn: MockInstance<typeof console.warn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it.each([
    ["run.run_type", "Purpose", "Market view", "'research', 'primary' or 'secondary'"],
    ["run.case_kind", "Purpose", "Case kind", "'public', 'private' or 'synthetic'"],
    ["run.pathway", "Purpose", "Pathway", "'credit_snapshot' or 'earnings_update'"],
  ])("L1 labels %s as the screen does", (path, section, label, values) => {
    expect(refusalLines(`${path}: Input should be ${values}`)).toEqual([
      `${section} · ${label}: choose one of the listed options.`,
    ]);
  });

  it("L2 drops a launcher flag prefix and names modules", () => {
    expect(
      refusalLines("--modules CP-0 CP-1: fills no Distressed & Restructuring report section"),
    ).toEqual([
      "The modules chosen (Source readiness, Financial foundation): fills no Distressed & Restructuring report section",
    ]);
    expect(warn).not.toHaveBeenCalled();
    const planned =
      "--modules: CP-8 is planned automatically when an earlier run of this issuer and pathway is listed; it cannot be selected";
    const lines = refusalLines(planned);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^Requested modules: .*cannot be selected$/);
    expect(lines[0]).not.toContain("--");
    expect(warn).not.toHaveBeenCalled();
    expect(refusalLines("--cap 30: one sol-medium call holds up to USD 31.00")).toEqual([
      "One sol-medium call holds up to USD 31.00",
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    const dashes = "Reading a -- b went wrong; try again";
    expect(refusalLines(dashes)).toEqual([dashes]);
  });

  it("L3 keeps text inside double quotes as typed", () => {
    expect(
      refusalLines(
        'assumptions.cp2e.rate_shocks_bps: "a_b": enter a plain number such as 1250 or 99.5.',
      ),
    ).toEqual([
      'Scenario assumptions · Rates, FX & hedging · Rate shocks (bps): "a_b": enter a plain number such as 1250 or 99.5.',
    ]);
  });
  it("L6 replaces any flag token left in a line, never a dash or a quoted value", () => {
    const [high = ""] = refusalLines("--high-modules names modules outside this run: CP-9");
    expect(high).not.toMatch(/(?<![\w-])--[a-z]/);
    expect(high).toContain("CP-9");
    const [live = ""] = refusalLines("--live needs --ruling docs/x.md");
    expect(live).not.toMatch(/(?<![\w-])--[a-z]/);
    expect(live).toContain("this setting");
    expect(warn).toHaveBeenCalledTimes(3); // the dropped prefixes, and the flag left in the second
    warn.mockClear();
    expect(refusalLines('Read "--keep" a -- b')).toEqual(['Read "--keep" a -- b']);
    expect(warn).not.toHaveBeenCalled();
    const [inner = ""] = refusalLines("run.as_of: use --force here");
    expect(inner).toBe("Issuer and case date · As-of date: use this setting here");
  });
});

describe("refusalProblems: each problem with the control that sets its path", () => {
  it("N1 names the control of one problem and keeps refusalLines' line", () => {
    const error = "assumptions.cp4c.ev_multiple: must be 99.99 or less.";
    expect(refusalProblems(error)).toEqual([
      { line: refusalLines(error)[0], field: "assumptions" },
    ]);
  });

  it("N2 keeps the service's order across two problems", () => {
    const error =
      "deal_terms[0].size_m: is required.; assumptions.cp2e.rate_shocks_bps: is required.";
    const problems = refusalProblems(error);
    expect(problems.map(({ field }) => field)).toEqual(["deal_terms", "assumptions"]);
    expect(problems.map(({ line }) => line)).toEqual(refusalLines(error));
  });

  it("N3 gives no control to text that names none", () => {
    const cap = "The pathway cap changed while preparing this summary. Review the run again.";
    expect(refusalProblems("foo.bar: x.")).toEqual([{ line: "foo.bar: x." }]);
    expect(refusalProblems(cap)).toEqual([{ line: cap }]);
  });

  it.each([
    ["identity.issuer_name: is required.", "issuer_name"],
    ["run.cutoff: must not be after the as-of date.", "cutoff"],
    ["run.current_period: is required.", "current_period"],
    ["run.prior_period: must be before the current period.", "prior_period"],
    ["attachments.legal_documents: is required.", "legal_documents"],
    ["deal_terms[0].size_m: is required.", "deal_terms"],
    ["quotes[1].price: must be a number.", "quotes"],
    ["ratings[0].agency: is required.", "ratings"],
    ["research_questions[2].text: is required.", "research_questions"],
    ["valuation.user_multiple.value: is required.", "valuation"],
    ["assumptions.cp4c.ev_multiple: must be 99.99 or less.", "assumptions"],
    ["module_options.cp3_mode: is required.", "module_options"],
  ])("maps %s to %s", (error, field) => {
    expect(refusalProblems(error)[0]?.field).toBe(field);
  });

  it.each([
    "attachments.prior_case: is required.",
    "identity.ticker: is required.",
    "run.as_of: is required.",
    "run.pathway: is required.",
  ])("leaves %s without a control", (error) => {
    expect(refusalProblems(error)[0]?.field).toBeUndefined();
  });

  it("gives no control to a problem whose control the pathway does not draw", () => {
    const lite = ["CP-0", "CP-1", "CP-1A", "CP-2", "CP-2A"];
    expect(
      refusalProblems("module_options.cp3_mode: is required.", lite)[0]?.field,
    ).toBeUndefined();
    expect(
      refusalProblems("module_options.cp3_mode: is required.", [...lite, "CP-3"])[0]?.field,
    ).toBe("module_options");
    expect(
      refusalProblems("assumptions.cp4c.ev_multiple: must be 1.", lite)[0]?.field,
    ).toBeUndefined();
    expect(refusalProblems("assumptions.cp2a.rationale: is required.", lite)[0]?.field).toBe(
      "assumptions",
    );
    expect(refusalProblems("valuation.basis: is required.", lite)[0]?.field).toBe("valuation");
  });
});

const HOLDINGS = "Northbridge Synthetic Group International Holdings Limited";
const FINANCE = "Northbridge Synthetic Group International Finance plc";

describe("issuerIdFor", () => {
  it("keeps the usual ID when no other issuer holds it", () => {
    expect(issuerIdFor(HOLDINGS, undefined)).toBe("northbridge-synthetic-group-internationa");
    expect(issuerIdFor("Northbridge Group plc", undefined)).toBe("northbridge-group-plc");
  });
  it("keeps the usual ID for the issuer that already holds it", () => {
    expect(issuerIdFor(HOLDINGS, HOLDINGS)).toBe("northbridge-synthetic-group-internationa");
    expect(issuerIdFor(HOLDINGS, ` ${HOLDINGS.toUpperCase()} `)).toBe(
      "northbridge-synthetic-group-internationa",
    );
  });
  it("gives a different issuer with the same first 40 characters its own valid ID", () => {
    const id = issuerIdFor(FINANCE, HOLDINGS);
    expect(id).not.toBe(issuerIdFor(HOLDINGS, undefined));
    expect(id).toMatch(/^[a-z0-9][a-z0-9-]{0,39}$/);
    expect(id.startsWith("northbridge-synthetic-group-")).toBe(true);
    expect(issuerIdFor(FINANCE, HOLDINGS)).toBe(id);
    expect(issuerIdFor(HOLDINGS, FINANCE)).not.toBe(id);
  });
  it("separates a short name or a word-boundary cut that another issuer holds", () => {
    const short = issuerIdFor("Acme Finance", "Acme Corp");
    expect(short).toMatch(/^acme-finance-[0-9a-f]{8}$/);
    const cut = "Northbridge Synthetic Group Internation Holdings Limited";
    expect(issuerIdFor(cut, undefined)).toBe("northbridge-synthetic-group-internation");
    const other = issuerIdFor("Northbridge Synthetic Group Internation Finance plc", cut);
    expect(other).toMatch(/^[a-z0-9][a-z0-9-]{0,39}$/);
    expect(other).not.toBe("northbridge-synthetic-group-internation");
  });
  it("treats an owner with no recorded name as the same issuer", () => {
    expect(issuerIdFor(HOLDINGS, "")).toBe("northbridge-synthetic-group-internationa");
  });
});

describe("documentRefusal", () => {
  const files = [
    { name: "annual-report.pdf", size: 8 },
    { name: "empty.txt", size: 0 },
    { name: "scan.txt", size: 20 },
  ];
  it("names an unreadable file in plain words, with no decoder text", () => {
    const got = documentRefusal(
      "Cannot read annual-report.pdf: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte",
      files,
    );
    expect(got.file).toBe("annual-report.pdf");
    expect(got.sentence).toBe("annual-report.pdf could not be read.");
    expect(got.sentence).not.toMatch(/codec|byte|utf|PDF file|decoded/);
  });
  it("gives the decoding reason only for a text file; a damaged workbook or PDF is only unreadable", () => {
    // The service reads anything that is not a PDF or a workbook by its magic bytes as UTF-8 text
    // (`_pages` in model/handoff.py), so a damaged workbook or PDF fails with the decoder's text.
    const decode = "'utf-8' codec can't decode byte 0x9c in position 10: invalid start byte";
    for (const name of ["holdings.xlsx", "deck.pdf", "photo.png"])
      expect(documentRefusal(`Cannot read ${name}: ${decode}`, []).sentence).toBe(
        `${name} could not be read.`,
      );
    for (const name of ["notes.txt", "data.CSV", "page.html"])
      expect(documentRefusal(`Cannot read ${name}: ${decode}`, []).sentence).toBe(
        `${name} could not be read: its text could not be decoded.`,
      );
  });
  it("keeps the file name's own case and says an empty file is empty", () => {
    expect(documentRefusal("Empty.txt has no extractable text (scanned image?)", files)).toEqual({
      file: "empty.txt",
      sentence: "empty.txt is empty (0 bytes).",
    });
  });
  it("keeps the scanned-image hint for a file that has bytes", () => {
    expect(
      documentRefusal("--sources: scan.txt has no extractable text (scanned image?)", files),
    ).toEqual({
      file: "scan.txt",
      sentence: "scan.txt has no text that can be read; it may be a scanned image.",
    });
  });
  it("says only what the service's message states, never a file type it did not report", () => {
    expect(documentRefusal("Cannot read notes.docx: File is not a zip file", []).sentence).toBe(
      "notes.docx could not be read: its contents are not a valid zip archive.",
    );
    // A Latin-1 text file, a truncated workbook or an encrypted PDF are not "not a txt/xlsx/PDF file".
    for (const [name, detail] of [
      [
        "notes.txt",
        "'utf-8' codec can't decode byte 0xe9 in position 4: invalid continuation byte",
      ],
      ["holdings.xlsx", "'utf-8' codec can't decode byte 0x9c in position 10: invalid start byte"],
      ["deck.pdf", "File has not been decrypted"],
    ] as const) {
      const got = documentRefusal(`Cannot read ${name}: ${detail}`, []);
      expect(got.file).toBe(name);
      expect(got.sentence).not.toMatch(/not a (txt|xlsx|PDF|a) file/);
      expect(got.sentence.startsWith(`${name} could not be read`)).toBe(true);
    }
    expect(documentRefusal("Cannot read deck.pdf: File has not been decrypted", []).sentence).toBe(
      "deck.pdf could not be read.",
    );
  });
  it("marks no row when no file is named", () => {
    const got = documentRefusal("The uploaded documents: no readable issuer file", files);
    expect(got.file).toBeUndefined();
    expect(got.sentence).toMatch(/^None of the selected documents/);
  });
  it("returns any other text unchanged", () => {
    expect(documentRefusal("Something else.", files)).toEqual({ sentence: "Something else." });
  });
});

// The same literal cases as `ISSUER_KEY_CASES` in tests/test_run_start_submissions.py: the page and
// the service must reduce an issuer name the same way.
describe("issuerKey", () => {
  it.each([
    ["Acme Corp", "acmecorp"],
    ["ACME  corp.", "acmecorp"],
    ["Åre Group A/S", "aregroupas"],
    ["Straße Holdings plc", "straßeholdingsplc"],
    ["Ørsted A/S", "ørstedas"],
    ["Ａｃｍｅ Ｃｏｒｐ", "acmecorp"],
    ["Nestlé S.A. 2", "nestlesa2"],
    ["İstanbul Ltd", "istanbulltd"],
    ["  ", ""],
    ["中国银行 Ltd", "中国银行ltd"],
    ["中国建设银行 Ltd", "中国建设银行ltd"],
    ["Газпром ПАО", "газпромпао"],
    ["Йога-Центр", "иогацентр"],
  ])("reduces %s to %s", (name, key) => {
    expect(issuerKey(name)).toBe(key);
  });
});

describe("issuerIdRefusal", () => {
  const refused = (id: string, holder: string, name: string) =>
    `Issuer ID "${id}" is filed under the name "${holder}", not "${name}". If that is this issuer under another name, type that name; otherwise use another Issuer ID.`;
  const message = refused("acme", "Acme Corp", "Eastmoor Plc");
  const ifSame = "If that is this issuer under another name, type that name.";
  it("reads the service's refusal back into the holder and the name", () => {
    expect(filedElsewhere(message)).toEqual({
      id: "acme",
      holder: "Acme Corp",
      name: "Eastmoor Plc",
    });
    expect(filedElsewhere("Something else.")).toBeUndefined();
    expect(filedElsewhere(refused("a", 'Say "hi" Ltd', "B"))?.holder).toBe('Say "hi" Ltd');
  });
  it("says only what is known: the ID is filed under that name", () => {
    const got = issuerIdRefusal(message);
    expect(
      got?.sentence.startsWith(`Issuer ID acme is filed under the name "Acme Corp". ${ifSame}`),
    ).toBe(true);
    expect(got?.sentence).not.toMatch(/different issuer/);
  });
  it("offers the name's usual ID when it is free, not the suffixed one", () => {
    const got = issuerIdRefusal(message);
    expect(got?.offer).toBe("eastmoor-plc");
    expect(got?.sentence).toBe(
      `Issuer ID acme is filed under the name "Acme Corp". ${ifSame} Otherwise use eastmoor-plc for Eastmoor Plc, or type another Issuer ID.`,
    );
    // The usual ID is held by this issuer itself (another spelling of its name).
    expect(issuerIdRefusal(message, "EASTMOOR  plc")?.offer).toBe("eastmoor-plc");
  });
  it("offers the suffixed ID only when the usual ID is held by a different issuer", () => {
    const got = issuerIdRefusal(message, "Eastmoor Group");
    expect(got?.offer).toBe(issuerIdFor("Eastmoor Plc", "Eastmoor Group"));
    expect(got?.offer).toMatch(/^eastmoor-plc-[0-9a-f]{8}$/);
    // The refused ID is the usual one: the holder is the usual ID's holder.
    const usual = issuerIdRefusal(refused("eastmoor-plc", "Eastmoor Group", "Eastmoor Plc"));
    expect(usual?.offer).toBe(got?.offer);
  });
  it("offers nothing when the offer is the ID just refused", () => {
    const id = issuerIdFor("Eastmoor Plc", "Acme Corp");
    const again = refused(id, "Acme Corp", "Eastmoor Plc");
    expect(issuerIdRefusal(again, "Acme Corp")?.offer).toBeUndefined();
    expect(issuerIdRefusal(again, "Acme Corp")?.sentence).toBe(
      `Issuer ID ${id} is filed under the name "Acme Corp". ${ifSame} Otherwise type another Issuer ID.`,
    );
  });
  it("never offers an invalid ID for a name with no Latin letters or digits", () => {
    const got = issuerIdRefusal(refused("issuer-1", "中国银行", "中国建设银行"), "Other");
    expect(got?.offer).toBeUndefined();
    expect(got?.sentence).toBe(
      `Issuer ID issuer-1 is filed under the name "中国银行". ${ifSame} Otherwise type an Issuer ID of your own for 中国建设银行.`,
    );
    expect(issuerIdFor("中国建设银行 Ltd", "中国银行 Ltd")).toMatch(/^[a-z0-9][a-z0-9-]{0,39}$/);
    expect(issuerIdFor("中国建设银行", "中国银行")).toBe("");
  });
  it("leaves any other refusal alone", () => {
    expect(issuerIdRefusal("Anything else.")).toBeUndefined();
  });
});
