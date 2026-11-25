import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  PublishedChanges,
  OutputEntry,
  PublishedRun,
  Section,
  Snapshot,
} from "../publishedReport";
import { ReportChanges } from "./Changes";

const run = { folder: "current" } as PublishedRun;
const snapshot = { chips: {} } as unknown as Snapshot;

function renderChanges(change: PublishedChanges | null, entries: OutputEntry[] = []) {
  return render(<ReportChanges snapshot={snapshot} run={run} entries={entries} change={change} />);
}

const LEDGER = [
  ["E1", "C1", "Segment margins are not disclosed", "Remaining", "\u2014"],
  [
    "E2",
    "\u2014",
    "Revolver terms were unavailable",
    "Closed",
    "Amended credit agreement supplied",
  ],
  ["\u2014", "C2", "Hedge book not provided", "New", "\u2014"],
  ["E3", "\u2014", "Lease schedule not reconciled", "Parked", ""],
];

function cp8(ledger: string[][], module = "CP-8", heading = "Limitations ledger"): OutputEntry {
  const sections: Section[] = [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    {
      heading,
      level: 3,
      line: 10,
      blocks: [
        {
          type: "table",
          headers: ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"],
          line: 11,
          rows: ledger.map((cells, index) => ({ line: 12 + index, cells })),
        },
      ],
    },
  ];
  return {
    selected: true,
    output: { id: "a", module, label: "a", href: "", sha256: "a".repeat(64) },
    sections,
  };
}

function issuerEntry(rows: string[][]): OutputEntry {
  return {
    selected: true,
    output: { id: "a", module: "CP-8", label: "a", href: "", sha256: "a".repeat(64) },
    sections: [
      {
        heading: "What changed: the issuer",
        level: 3,
        line: 10,
        blocks: [
          {
            type: "table",
            headers: [
              "Measure or fact",
              "Earlier",
              "Current",
              "Cause",
              "Effect on the credit view",
            ],
            line: 11,
            rows: rows.map((cells, index) => ({ line: 12 + index, cells })),
          },
        ],
      },
    ],
  };
}

describe("connected report Changes", () => {
  it("compares published maturities without turning a missing earlier value into zero", () => {
    renderChanges({
      pack: {
        maturity_profile: {
          unit: "US$m",
          rows: [
            { period: "FY2026", prior: "0", current: "100" },
            { period: "FY2027", prior: null, current: "1250" },
            {
              period: "2030 and thereafter",
              prior: "1,250m",
              current: "Not supplied: schedule absent",
            },
          ],
        },
      },
    });
    const tile = screen.getByRole("region", { name: "Maturities then and now" });
    const walls = within(within(tile).getByRole("region", { name: "Maturity walls" }));
    expect(walls.getAllByText("Not stated")).toHaveLength(1);
    expect(walls.getByText("1,250m")).toBeInTheDocument();
    expect(walls.getByText("Not supplied: schedule absent")).toBeInTheDocument();
    expect(walls.getByText("2030 and thereafter")).toBeInTheDocument();
    expect(walls.getByText("0", { exact: true })).toBeVisible();
    fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
    const values = within(tile).getByRole("table");
    const missing = within(values).getByRole("row", { name: /FY2027/ });
    expect(within(missing).queryByText("0", { exact: true })).toBeNull();
    expect(within(missing).getByText("1250", { exact: true })).toBeInTheDocument();
    expect(
      within(within(values).getByRole("row", { name: /FY2026/ })).getByText("0", { exact: true }),
    ).toBeVisible();
  });

  it("keeps a missing or unreadable comparison distinct from a first run", () => {
    const { rerender } = renderChanges(null);
    expect(screen.getByText("No comparison was recorded for this run.")).toBeInTheDocument();
    rerender(
      <ReportChanges
        snapshot={snapshot}
        run={run}
        entries={[]}
        change={{
          first_run: true,
          problem: "The comparison could not be read.",
        }}
      />,
    );
    expect(screen.getByText("The comparison could not be read.")).toBeInTheDocument();
    expect(screen.queryByText("No earlier run to compare.")).toBeNull();
  });

  it.each([
    ["a missing comparison", null],
    ["a comparison not produced", { first_run: false, pack: null, note: "Changes: not produced" }],
    ["an unreadable comparison", { first_run: false, problem: "Unreadable: pack.json" }],
  ] as const)("offers the Overview and the comparison evidence on %s", (_state, change) => {
    renderChanges(change);
    expect(screen.getByRole("link", { name: "Open the Overview" })).toHaveAttribute(
      "href",
      "#overview",
    );
    expect(screen.getByRole("link", { name: "Review comparison evidence" })).toHaveAttribute(
      "href",
      "#evidence/record",
    );
  });

  it("draws a first run's single Overview action and no evidence link", () => {
    renderChanges({ first_run: true });
    expect(screen.getAllByRole("link", { name: "Open the Overview" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Review comparison evidence" })).toBeNull();
  });

  it.each([
    ["a first run", { first_run: true }],
    ["a comparison not produced", { first_run: false, pack: null, note: "Changes: not produced" }],
  ] as const)("links %s to the list of this issuer's runs", (_state, change) => {
    renderChanges(change);
    expect(screen.getByRole("link", { name: "All runs of this issuer" })).toHaveAttribute(
      "href",
      "#history",
    );
  });

  it("draws each moved measure in the pack's order with earlier, current and the stated cause", () => {
    const measure = (key: string, prior: string, current: string, difference: number) => ({
      key,
      label: `Measure ${key}`,
      prior: { value: prior, unit: "x", period: "FY2025" },
      current: { value: current, unit: "x", period: "FY2026" },
      difference,
      unit: "x",
    });
    renderChanges(
      {
        pack: { measures: [measure("small", "10", "11", 1), measure("big", "2", "4", 2)] },
        verdicts: {
          measures: {
            small: { kind: "comparable", label: "L", reason: "Why" },
            big: { kind: "comparable", label: "L", reason: "Why" },
          },
        },
      },
      [
        issuerEntry([
          ["Measure big", "2x", "4x", "Unresolved", "Cover is thinner"],
          ["Measure small", "10x", "11x", "New period", "—"],
        ]),
      ],
    );
    const list = screen.getByRole("list", { name: "Measures that moved" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows.map((row) => within(row).getByRole("heading").textContent)).toEqual([
      "Measure small",
      "Measure big",
    ]);
    const [small, big] = rows as [HTMLElement, HTMLElement];
    expect(within(big).getByText("Cause: Unresolved")).toBeVisible();
    expect(within(big).getByText("Cover is thinner")).toBeVisible();
    expect(within(small).getByText("Cause: New period")).toBeVisible();
    expect(within(big).getByText("2x (FY2025)")).toBeVisible();
    expect(within(big).getByText("4x (FY2026)")).toBeVisible();
    expect(big.querySelector('[data-mark="dumbbell"]')).not.toBeNull();
  });

  const one = (cause: string | null, label = "Net leverage"): [PublishedChanges, OutputEntry[]] => [
    {
      pack: {
        measures: [
          {
            key: "net_leverage",
            label: "Net leverage",
            prior: { value: "3", unit: "x", period: "FY2025" },
            current: { value: "2", unit: "x", period: "FY2026" },
            difference: -1,
            unit: "x",
          },
        ],
      },
      verdicts: { measures: { net_leverage: { kind: "comparable", label: "L" } } },
    },
    cause === null ? [] : [issuerEntry([[label, "3x", "2x", cause, ""]])],
  ];

  it("says a cause is not stated only when its cell is empty", () => {
    renderChanges(...one("—"));
    expect(screen.getByText("Cause not stated")).toBeVisible();
  });

  it("links to Evidence for a cause that cites a source or whose row it cannot match", () => {
    const { unmount } = renderChanges(...one("Per filing.pdf p. 3"));
    expect(screen.queryByText("Cause not stated")).toBeNull();
    expect(screen.getByRole("link", { name: "Read this cause in Evidence" })).toBeVisible();
    unmount();
    renderChanges(...one("New period", "Another name"));
    expect(screen.queryByText("Cause not stated")).toBeNull();
    expect(
      screen.getByRole("link", { name: "The cause is in the comparison, in Evidence" }),
    ).toBeVisible();
  });

  it("sets a long cause as plain text, not a chip", () => {
    const long = "The refinancing closed after the period end and added a term loan. ".repeat(3);
    renderChanges(...one(long.trim()));
    const line = screen.getByText(/^Cause: The refinancing closed/);
    expect(line.tagName).toBe("P");
    expect(line.className).not.toMatch(/rounded|border/);
  });

  it("points to the comparison evidence where a verdict's reason cites a source", () => {
    renderChanges({
      pack: {
        measures: [
          {
            key: "net_leverage",
            label: "Net leverage",
            prior: { value: "3", unit: "x", period: "FY2025" },
            current: { value: "2", unit: "x", period: "FY2026" },
            difference: -1,
            unit: "x",
          },
        ],
      },
      verdicts: {
        measures: {
          net_leverage: { kind: "comparable", label: "L", reason: "Per filing.pdf p. 3" },
        },
      },
    });
    expect(screen.getByText("See comparison evidence.")).toBeVisible();
    expect(document.body.textContent).not.toMatch(/filing\.pdf/);
  });

  it("collapses the measures that did not move behind a headed count", () => {
    renderChanges({
      pack: {
        measures: [
          {
            key: "flat",
            label: "Measure flat",
            prior: { value: "5", unit: "x", period: "FY2025" },
            current: { value: "5", unit: "x", period: "FY2026" },
            difference: 0,
            unit: "x",
          },
        ],
      },
      verdicts: { measures: { flat: { kind: "comparable", label: "L" } } },
    });
    expect(screen.getByRole("heading", { name: "Measures that did not move" })).toBeVisible();
    expect(screen.getByText("Show the 1 measure").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("No comparable measure moved between the two runs.")).toBeVisible();
  });

  it("draws the first Bottom-line paragraph whole as the verdict, later paragraphs as body", () => {
    const entry = cp8([]);
    entry.sections.splice(1, 0, {
      heading: "Bottom line",
      level: 3,
      line: 2,
      blocks: [
        {
          type: "text",
          line: 3,
          end: 3,
          text: "About the same: net leverage is approx. 7x. Cover is steady.",
        },
        { type: "text", line: 5, end: 5, text: "A second paragraph follows." },
      ],
    });
    renderChanges(
      {
        pack: {
          prior: { run: "r", as_of: "2025-03-31", pathway: "full" },
          current: { as_of: "2025-06-30", pathway: "full" },
          measures: [],
        },
      },
      [entry],
    );
    const verdict = screen.getByRole("region", { name: "Verdict" });
    expect(
      within(verdict).getByText("About the same: net leverage is approx. 7x. Cover is steady.")
        .className,
    ).toMatch(/text-h2/);
    expect(within(verdict).getByText("A second paragraph follows.")).toBeVisible();
    expect(within(verdict).getByText("Earlier run, as of 31 March 2025")).toBeVisible();
    expect(within(verdict).getByText(/Stance, earlier → current/)).toBeVisible();
  });

  it("draws the stance gap even when an as-of date is missing", () => {
    renderChanges({ pack: { measures: [] } });
    expect(screen.getByText(/Stance, earlier → current/)).toBeVisible();
  });

  it("links to Evidence when the Bottom line cites a source, instead of claiming no verdict", () => {
    const entry = cp8([]);
    entry.sections.splice(1, 0, {
      heading: "Bottom line",
      level: 3,
      line: 2,
      blocks: [{ type: "text", line: 3, end: 3, text: "See filing.pdf p. 3 for the position." }],
    });
    renderChanges({ pack: { measures: [] } }, [entry]);
    expect(screen.getByRole("link", { name: "Read the verdict in Evidence" })).toBeVisible();
    expect(screen.queryByText("The comparison does not state a verdict in a sentence.")).toBeNull();
  });

  it("keeps the evidence link with a pack and offers no Overview action", () => {
    renderChanges({ pack: { measures: [] } }, [cp8([])]);
    expect(screen.queryByRole("link", { name: "Open the Overview" })).toBeNull();
    expect(screen.getByRole("link", { name: "Review comparison evidence" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/report\/current#evidence\//),
    );
  });

  it("draws the designed gap in place of the measures when the pack carries none", () => {
    renderChanges({ pack: { measures: [], modules: [] } });
    expect(
      screen.getByText("The comparison carries no measures for these two runs."),
    ).toBeVisible();
  });

  it("draws an h2 and skips no heading level, charts included", () => {
    const { container } = renderChanges({
      pack: {
        maturity_profile: {
          unit: "US$m",
          rows: [{ period: "FY2026", prior: "10", current: "100" }],
        },
      },
    });
    const levels = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6"), (node) =>
      Number(node.tagName.slice(1)),
    );
    expect(levels).toContain(2);
    levels.forEach((level, at) => {
      expect(level).toBeLessThanOrEqual((levels[at - 1] ?? 1) + 1);
    });
  });

  it("shows the compared bottom lines and the verdict's reason without a module code", () => {
    renderChanges({
      pack: {
        measures: [],
        modules: [
          {
            module: "CP-2",
            title: "Fundamental credit",
            ran_prior: true,
            ran_current: true,
            prior_bottom_line: "Credit is stable; Liquidity (CP-2D) is ample.",
            current_bottom_line: "Credit is stable; Liquidity (CP-2D) is thin.",
          },
        ],
      },
      verdicts: {
        modules: {
          "CP-2": {
            status: "Unchanged",
            cause: "Follows Liquidity (CP-2D)",
            why: "The view follows Financial foundation (CP-1), which did not change.",
          },
        },
      },
    });
    expect(screen.getByText("Credit is stable; Liquidity is ample.")).toBeInTheDocument();
    expect(screen.getByText("Credit is stable; Liquidity is thin.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cause: Follows Liquidity · Why: The view follows Financial foundation, which did not change.",
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\(CP-[A-Za-z0-9]+\)/);
  });

  it("draws nothing, not a stray 0, for a pack that compared no modules", () => {
    const { container } = renderChanges({ pack: { measures: [], modules: [] } });
    expect(screen.queryByText("0")).toBeNull();
    expect(container.textContent).not.toMatch(/(?<![\d.,])0(?![\d.,])/);
    expect(screen.queryByRole("heading", { name: "What changed in the analysis" })).toBeNull();
  });

  const withPack: PublishedChanges = { pack: { measures: [] } };
  const ledger = () => within(screen.getByRole("region", { name: "Limitations ledger" }));
  const groupNames = () =>
    ledger()
      .getAllByRole("heading", { level: 4 })
      .map((h) => h.textContent);

  it("groups CP-8's limitations ledger by every status without its reference columns", () => {
    renderChanges(withPack, [cp8(LEDGER)]);
    expect(groupNames()).toEqual(["Added (1)", "Removed (1)", "Remaining (1)", "Parked (1)"]);
    expect(ledger().getByText("Revolver terms were unavailable")).toBeVisible();
    expect(ledger().getByText("Closed by: Amended credit agreement supplied")).toBeVisible();
    expect(ledger().getByText("Lease schedule not reconciled")).toBeVisible();
    expect(ledger().queryByText(/^(E1|E2|E3|C1|C2)$/)).toBeNull();
    expect(ledger().getAllByRole("link", { name: /^Source for / })).toHaveLength(4);
    expect(
      ledger().getByRole("link", { name: "Source for Revolver terms were unavailable" }),
    ).toBeVisible();
  });

  it("names the module in a ledger cell instead of drawing its code", () => {
    renderChanges(withPack, [
      cp8([["—", "—", "Covenant headroom", "Closed", "CP-2A: covenant headroom restated"]]),
    ]);
    expect(ledger().getByText("Closed by: Downside: covenant headroom restated")).toBeVisible();
    expect(ledger().getByRole("region", { name: "Removed" }).textContent).not.toMatch(/CP-2A/);
  });

  it("leaves a Gap ledger of another module out", () => {
    renderChanges(withPack, [cp8(LEDGER, "CP-2", "Gap ledger")]);
    expect(screen.queryByRole("region", { name: "Limitations ledger" })).toBeNull();
  });

  it("orders other statuses after the named ones and draws no placeholder as a closing note", () => {
    renderChanges(withPack, [
      cp8([
        ["E1", "\u2014", "Hedge book is thin", "Watching", "\u2014"],
        ["E2", "\u2014", "Pension terms are old", "No longer stated", "\u2014"],
        ["E3", "\u2014", "Leases are open", "Remaining", "\u2014"],
      ]),
    ]);
    expect(groupNames()).toEqual([
      "Added (none)",
      "Removed (none)",
      "Remaining (1)",
      "No longer stated (1)",
      "Watching (1)",
    ]);
    expect(ledger().queryByText("\u2014")).toBeNull();
  });

  const HEADERS = ["Earlier ref", "Current ref", "Limitation", "Status", "What closed it"];
  function ledgerOf(headers: string[], rows: string[][]) {
    const entry = cp8([]);
    const block = entry.sections[1]?.blocks[0];
    if (block?.type !== "table") throw new Error("fixture has no table");
    block.headers = headers;
    block.rows = rows.map((cells, index) => ({ line: 12 + index, cells }));
    return entry;
  }

  it("draws a status cell without its marks and groups it as the plain status", () => {
    renderChanges(withPack, [
      ledgerOf(HEADERS, [
        ["E1", "\u2014", "Margins", "**Remaining**", "\u2014"],
        ["E2", "\u2014", "Revolver", "**Closed**", "Filing"],
      ]),
    ]);
    expect(groupNames()).toEqual(["Added (none)", "Removed (1)", "Remaining (1)"]);
  });

  it("shows a module named as Name (CP-x) without its code, in the status, text and note", () => {
    renderChanges(withPack, [
      ledgerOf(HEADERS, [
        [
          "E1",
          "\u2014",
          "Covenant view from **Financial foundation (CP-1)** is stale",
          "Closed by Financial foundation (CP-1)",
          "Updated in Liquidity (CP-2D) and **Credit (CP-2)**",
        ],
      ]),
    ]);
    expect(
      ledger().getByRole("heading", { level: 4, name: "Closed by Financial foundation (1)" }),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/\(CP-/);
    expect(ledger().getByText("Covenant view from Financial foundation is stale")).toBeVisible();
    // Emphasis marks are flattened on purpose: the page draws the module's words, not its markdown.
    expect(
      ledger().getByText("What closed it: Updated in Liquidity and Credit (Fundamental credit)"),
    ).toBeVisible();
    expect(
      ledger().getByRole("link", {
        name: "Source for Covenant view from Financial foundation is stale",
      }),
    ).toBeVisible();
    expect(ledger().queryByText(/\*\*/)).toBeNull();
  });

  it("titles the ledger and falls back to the table when a column is missing", () => {
    const { unmount } = renderChanges(withPack, [ledgerOf(HEADERS, LEDGER)]);
    expect(screen.getByRole("heading", { level: 3, name: "Limitations ledger" })).toBeVisible();
    unmount();
    renderChanges(withPack, [ledgerOf(HEADERS.slice(0, 3), [["E1", "C1", "Margins"]])]);
    expect(screen.getByText("Margins")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  });

  it("links a limitation that cites a source to Evidence instead of dropping it", () => {
    renderChanges(withPack, [
      ledgerOf(HEADERS, [["—", "C1", "Per filing.pdf p. 3 the swap is unclear", "New", "—"]]),
    ]);
    expect(
      ledger().getByRole("link", { name: "Read this limitation in Evidence" }),
    ).toHaveAttribute("href", expect.stringMatching(/^\/report\/current#evidence\//));
    expect(document.body.textContent).not.toMatch(/filing\.pdf/);
  });

  it("draws the ledger, the issuer facts and the analysis rows with no pack, as at base", () => {
    const entry = cp8(LEDGER);
    entry.sections.push(
      {
        heading: "What changed: the issuer",
        level: 3,
        line: 30,
        blocks: [
          {
            type: "table",
            headers: [
              "Measure or fact",
              "Earlier",
              "Current",
              "Cause",
              "Effect on the credit view",
            ],
            line: 31,
            rows: [
              {
                line: 32,
                cells: [
                  "New term loan B of US$600m signed",
                  "—",
                  "Signed",
                  "New source",
                  "More debt",
                ],
              },
            ],
          },
        ],
      },
      {
        heading: "What changed: the analysis",
        level: 3,
        line: 40,
        blocks: [
          {
            type: "table",
            headers: ["Module", "Status", "Cause", "Why"],
            line: 41,
            rows: [
              {
                line: 42,
                cells: ["Fundamental credit (CP-2)", "Weakened", "New period", "Cover fell"],
              },
            ],
          },
        ],
      },
    );
    renderChanges({ note: "changes: not compared: x" }, [entry]);
    expect(screen.getByText("Segment margins are not disclosed")).toBeVisible();
    expect(screen.getByText("New term loan B of US$600m signed")).toBeVisible();
    expect(screen.getByText("Fundamental credit")).toBeVisible();
    expect(screen.getByText("This run was not compared with an earlier run.")).toBeVisible();
  });

  it("draws the issuer facts that are not pack measures once, with a source each", () => {
    const entry = cp8([]);
    entry.sections.push({
      heading: "What changed: the issuer",
      level: 3,
      line: 30,
      blocks: [
        {
          type: "table",
          headers: ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
          line: 31,
          rows: [
            { line: 32, cells: ["Measure net_leverage", "3x", "2x", "New period", ""] },
            { line: 33, cells: ["Moody's outlook", "Stable", "Negative", "New source", "Weaker"] },
          ],
        },
      ],
    });
    renderChanges(
      {
        pack: {
          measures: [
            {
              key: "net_leverage",
              label: "Measure net_leverage",
              prior: { value: "3", unit: "x", period: "FY2025" },
              current: { value: "2", unit: "x", period: "FY2026" },
              difference: -1,
              unit: "x",
            },
          ],
        },
        verdicts: { measures: { net_leverage: { kind: "comparable", label: "L" } } },
      },
      [entry],
    );
    const facts = within(screen.getByRole("region", { name: "Also changed at the issuer" }));
    expect(facts.getByText("Moody's outlook")).toBeVisible();
    expect(facts.queryByText("Measure net_leverage")).toBeNull();
    expect(screen.getAllByText("Measure net_leverage")).toHaveLength(1);
  });

  it("draws a table inside a passage within that passage", () => {
    const entry = cp8([]);
    entry.sections.splice(1, 0, {
      heading: "Key findings",
      level: 3,
      line: 2,
      blocks: [
        { type: "text", line: 3, end: 3, text: "Two facilities moved." },
        {
          type: "table",
          headers: ["Facility", "Change"],
          line: 5,
          rows: [{ line: 6, cells: ["Term loan B", "Repriced"] }],
        },
      ],
    });
    renderChanges(withPack, [entry]);
    const tile = within(screen.getByRole("region", { name: "Key findings" }));
    expect(tile.getByText("Two facilities moved.")).toBeVisible();
    expect(tile.getByText("Repriced")).toBeVisible();
  });

  it("says once that the comparison module did not run, not under every measure", () => {
    renderChanges(...one(null));
    expect(screen.getAllByText(/did not run for this report/)).toHaveLength(1);
    expect(screen.queryByText(/The cause is in the comparison/)).toBeNull();
  });

  it("says what is true when no measure could be assessed or only revisions differ", () => {
    renderChanges({
      pack: {
        measures: [
          {
            key: "net_leverage",
            label: "Net leverage",
            prior: { value: "3", unit: "x", period: "FY2025" },
            current: { value: "2", unit: "US$m", period: "FY2026" },
            difference: -1,
          },
        ],
      },
      verdicts: { measures: { net_leverage: { kind: "comparable", label: "L" } } },
    });
    expect(screen.getByText("No measure could be assessed between the two runs.")).toBeVisible();
    expect(screen.queryByText(/No comparable measure moved/)).toBeNull();
  });

  it.each([
    ["changes: first run of this pathway", "First run of this pathway."],
    [
      "changes: first run of this pathway (not used: 20261115-114658-01: it was launched with an explicit module subset)",
      "First run of this pathway. An earlier run exists but could not be used for comparison.",
    ],
    [
      "changes: not produced \u2014 cpos_live_not_accepted: CP-8 not accepted within bounds",
      "The comparison was planned but not produced for this run.",
    ],
    [
      "changes: not produced \u2014 the comparison pack could not be built (no accepted handoffs)",
      "The comparison was planned but not produced for this run.",
    ],
    [
      "changes: not compared: the run folder is not inside a runs folder",
      "This run was not compared with an earlier run.",
    ],
    ["see CP-8-GAP-003", "No comparison was recorded for this run."],
  ])("draws the launcher note %j as a fixed sentence", (note, shown) => {
    const { container } = renderChanges({ note });
    expect(screen.getByText(shown)).toBeVisible();
    expect(container.textContent).not.toMatch(/changes:|CP-|cpos_|\d{8}-\d{6}/);
  });

  it("draws a gap tile for a passage the CP-8 handoff lacks", () => {
    const entry = cp8(LEDGER);
    renderChanges(withPack, [entry]);
    const gap = screen.getByRole("heading", { name: "Key findings" }).closest("section");
    expect(gap).toHaveTextContent("Not established for this run");
    expect(screen.queryByRole("heading", { name: "Bottom line" })).toBeNull();
  });

  it("draws the Key findings, contrary evidence and limitations a handoff writes, once each", () => {
    const entry = cp8(LEDGER);
    const passage = (heading: string, text: string, line: number) => ({
      heading,
      level: 3,
      line,
      blocks: [{ type: "text" as const, line: line + 1, end: line + 1, text }],
    });
    entry.sections.splice(
      1,
      0,
      passage("Key findings", "Leverage rose half a turn.", 2),
      passage(
        "Contrary evidence and what would change the view",
        "A refinancing would reverse it.",
        4,
      ),
      passage("Limitations", "The earlier run is compared in substance only.", 6),
    );
    renderChanges(withPack, [entry]);
    expect(screen.getAllByText("Leverage rose half a turn.")).toHaveLength(1);
    expect(screen.getAllByText("A refinancing would reverse it.")).toHaveLength(1);
    expect(screen.getAllByText("The earlier run is compared in substance only.")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "What changed: the issuer" })).toBeNull();
  });

  it("draws the contract's no-change row as the module's statement, not as a changed fact", () => {
    const entry = cp8([]);
    entry.sections.push({
      heading: "What changed: the issuer",
      level: 3,
      line: 30,
      blocks: [
        {
          type: "table",
          headers: ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
          line: 31,
          rows: [
            {
              line: 32,
              cells: ["No material change", "—", "—", "None", "No fact at the issuer moved."],
            },
          ],
        },
      ],
    });
    renderChanges(withPack, [entry]);
    const tile = within(screen.getByRole("region", { name: "At the issuer" }));
    expect(tile.getByText(/No material change at the issuer\./)).toHaveTextContent(
      "No fact at the issuer moved.",
    );
    expect(screen.queryByRole("region", { name: "Also changed at the issuer" })).toBeNull();
    expect(document.body.textContent).not.toMatch(/Not stated → Not stated/);
  });

  it("draws what a handoff carries off-contract: prose under a register, an extra section, a bare table", () => {
    const entry = cp8([]);
    entry.sections.push(
      {
        heading: "What changed: the issuer",
        level: 3,
        line: 30,
        blocks: [
          {
            type: "table",
            headers: ["Measure or fact", "Earlier"],
            line: 31,
            rows: [{ line: 32, cells: ["Rating", "B1"] }],
          },
          { type: "text", line: 34, end: 34, text: "Ratings are as at the earlier date." },
        ],
      },
      {
        heading: "Unresolved differences",
        level: 3,
        line: 40,
        blocks: [{ type: "text", line: 41, end: 41, text: "Two segment figures still differ." }],
      },
    );
    renderChanges(withPack, [entry]);
    const rest = within(screen.getByRole("region", { name: "More from the comparison" }));
    expect(rest.getByText("Ratings are as at the earlier date.")).toBeVisible();
    expect(rest.getByText("Two segment figures still differ.")).toBeVisible();
    expect(rest.getByText("B1")).toBeVisible();
  });

  it("lists analysis rows for a module the pack does not compare", () => {
    const entry = cp8([]);
    entry.sections.push({
      heading: "What changed: the analysis",
      level: 3,
      line: 40,
      blocks: [
        {
          type: "table",
          headers: ["Module", "Status", "Cause", "Why"],
          line: 41,
          rows: [{ line: 42, cells: ["Liquidity (CP-2D)", "New", "New source", "Newly run"] }],
        },
      ],
    });
    renderChanges(withPack, [entry]);
    expect(
      within(screen.getByRole("region", { name: "Also compared in the analysis" })).getByText(
        "Liquidity",
      ),
    ).toBeVisible();
  });

  it("sets a long verdict smaller on a phone than a short one, whole in both", () => {
    const verdictClass = (text: string) => {
      const entry = cp8([]);
      entry.sections.splice(1, 0, {
        heading: "Bottom line",
        level: 3,
        line: 2,
        blocks: [{ type: "text", line: 3, end: 3, text }],
      });
      const { unmount } = renderChanges(withPack, [entry]);
      const cls = within(screen.getByRole("region", { name: "Verdict" })).getByText(text).className;
      unmount();
      return cls;
    };
    expect(verdictClass("Credit is steady.")).toMatch(/\btext-h3\b/);
    expect(verdictClass("Credit is steady and cover is wide. ".repeat(8).trim())).toMatch(
      /\btext-h4\b/,
    );
  });

  it("hints that the maturity chart scrolls when it has more than two periods", () => {
    renderChanges({
      pack: {
        maturity_profile: {
          unit: "US$m",
          rows: ["FY2026", "FY2027", "FY2028"].map((period) => ({
            period,
            prior: "1",
            current: "2",
          })),
        },
      },
    });
    expect(screen.getByText("Scroll the chart sideways to see every period.")).toBeInTheDocument();
  });

  const issuerSection = (rows: string[][]) => ({
    heading: "What changed: the issuer",
    level: 3,
    line: 30,
    blocks: [
      {
        type: "table" as const,
        headers: ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
        line: 31,
        rows: rows.map((cells, i) => ({ line: 32 + i, cells })),
      },
    ],
  });

  it("gives two like-named measures their own cause and trace, and no fact repeats them", () => {
    const entry = cp8([]);
    entry.sections.push(
      issuerSection([
        ["EBITDA (reported)", "100", "110", "New period", "Reported up"],
        ["EBITDA (adjusted)", "120", "125", "Unresolved", "Adjusted up"],
      ]),
    );
    const side = (v: string, p: string) => ({ value: v, unit: "US$m", period: p });
    renderChanges(
      {
        pack: {
          measures: [
            {
              key: "ebitda_reported",
              label: "EBITDA (reported)",
              prior: side("100", "FY2025"),
              current: side("110", "FY2026"),
              difference: 10,
              unit: "US$m",
            },
            {
              key: "ebitda_adjusted",
              label: "EBITDA (adjusted)",
              prior: side("120", "FY2025"),
              current: side("125", "FY2026"),
              difference: 5,
              unit: "US$m",
            },
          ],
        },
        verdicts: {
          measures: {
            ebitda_reported: { kind: "comparable", label: "L" },
            ebitda_adjusted: { kind: "comparable", label: "L" },
          },
        },
      },
      [entry],
    );
    const list = within(screen.getByRole("list", { name: "Measures that moved" }));
    const [reported, adjusted] = list.getAllByRole("listitem");
    expect(within(reported as HTMLElement).getByText("Cause: New period")).toBeVisible();
    expect(within(adjusted as HTMLElement).getByText("Cause: Unresolved")).toBeVisible();
    expect(
      within(reported as HTMLElement).getByRole("link", { name: "Comparison row" }),
    ).toBeVisible();
    expect(screen.queryByRole("region", { name: "Also changed at the issuer" })).toBeNull();
  });

  it("draws the no-change row beside facts, and says a dash or empty cause and effect is not stated", () => {
    const entry = cp8([]);
    entry.sections.push(
      issuerSection([
        ["No material change", "—", "—", "None", "Nothing else moved."],
        ["New term loan", "", "Signed", "—", ""],
      ]),
    );
    renderChanges(withPack, [entry]);
    const tile = within(screen.getByRole("region", { name: "Also changed at the issuer" }));
    expect(tile.getByText(/No material change at the issuer\./)).toHaveTextContent(
      "Nothing else moved.",
    );
    expect(tile.getByText("Cause not stated")).toBeVisible();
    expect(tile.getByText("Effect not stated")).toBeVisible();
    expect(tile.getByText("Not stated")).toBeVisible();
  });

  it("says the status is not stated, not the explanation, when only the status is empty", () => {
    renderChanges({
      pack: {
        measures: [],
        modules: [
          {
            module: "CP-2A",
            title: "Downside",
            ran_prior: true,
            ran_current: true,
            prior_bottom_line: "a",
            current_bottom_line: "b",
          },
        ],
      },
      verdicts: {
        modules: {
          "CP-2A": { status: "", cause: "New period", why: "Per filing.pdf p. 3 the case changed" },
        },
      },
    });
    expect(screen.getByText("Status not stated")).toBeVisible();
    expect(screen.queryByText("Explanation not stated")).toBeNull();
    expect(screen.getByText("Cause: New period")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read the explanation in Evidence", hidden: true }),
    ).toBeInTheDocument();
  });

  it("draws off-contract handoff content: a register-like Findings section, a level-2 section and a dash-limitation row", () => {
    const entry = cp8([["E1", "—", "—", "Closed", "Superseded by the new agreement"]]);
    entry.sections.push(
      {
        heading: "Period table",
        level: 3,
        line: 50,
        blocks: [{ type: "text", line: 51, end: 51, text: "x" }],
      },
      {
        heading: "Comparison notes",
        level: 2,
        line: 60,
        blocks: [{ type: "text", line: 61, end: 61, text: "How the runs were matched." }],
      },
    );
    renderChanges(withPack, [entry]);
    expect(screen.getByText("Limitation not stated")).toBeVisible();
    expect(screen.getByText("Closed by: Superseded by the new agreement")).toBeVisible();
    const link = within(screen.getByRole("region", { name: "More from the comparison" })).getByRole(
      "link",
      {
        name: "Read Period table in Evidence",
      },
    );
    expect(link).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/report\/current#evidence\/.*-50$/),
    );
    expect(screen.getByText("How the runs were matched.")).toBeVisible();
  });

  it("names a module and drops a bracketed code it does not know, in the analysis rows", () => {
    const entry = cp8([]);
    entry.sections.push({
      heading: "What changed: the analysis",
      level: 3,
      line: 40,
      blocks: [
        {
          type: "table",
          headers: ["Module", "Status", "Cause", "Why"],
          line: 41,
          rows: [
            { line: 42, cells: ["Short credit memo (CP-MEMO)", "New", "New source", "Newly run"] },
          ],
        },
      ],
    });
    renderChanges(withPack, [entry]);
    expect(screen.getByText("Short credit memo")).toBeVisible();
    expect(document.body.textContent).not.toMatch(/CP-MEMO/);
  });

  it("labels a New row's closing note with the column's own header", () => {
    renderChanges(withPack, [
      cp8([["—", "C1", "Hedge book missing", "New", "Arrived with the new facility"]]),
    ]);
    expect(screen.getByText("What closed it: Arrived with the new facility")).toBeVisible();
  });

  it("steps the verdict size by length at every width", () => {
    const cls = (text: string) => {
      const entry = cp8([]);
      entry.sections.splice(1, 0, {
        heading: "Bottom line",
        level: 3,
        line: 2,
        blocks: [{ type: "text", line: 3, end: 3, text }],
      });
      const { unmount } = renderChanges(withPack, [entry]);
      const value = within(screen.getByRole("region", { name: "Verdict" })).getByText(
        text,
      ).className;
      unmount();
      return value;
    };
    expect(cls("Credit is steady.")).toMatch(/\btext-h3\b.*\bsm:text-h2\b/);
    expect(cls("Credit is steady and cover is wide. ".repeat(8).trim())).toMatch(
      /\btext-h4\b.*\bsm:text-h3\b/,
    );
  });

  it("does not number a finding twice when the module already numbered it", () => {
    const entry = cp8([]);
    entry.sections.splice(1, 0, {
      heading: "Key findings",
      level: 3,
      line: 2,
      blocks: [
        { type: "text", line: 3, end: 3, text: "1. Net leverage rose." },
        { type: "text", line: 5, end: 5, text: "Cover fell." },
      ],
    });
    renderChanges(withPack, [entry]);
    const items = within(screen.getByRole("region", { name: "Key findings" })).getAllByRole(
      "listitem",
    );
    expect(items[0]?.className).toMatch(/list-none/);
    expect(items[1]?.className).not.toMatch(/list-none/);
  });

  it("opens each measure's own issuer row in both the list and the table view, and the table for an unmatched one", () => {
    const entry = cp8([]);
    entry.sections.push(
      issuerSection([
        ["Interest cover", "2.1x", "1.7x", "New period", "Thinner"],
        ["Revenue", "1x", "2x", "Unresolved", ""],
        ["Net leverage", "6x", "7x", "New period", ""],
        ["net leverage", "6x", "7x", "Unresolved", ""],
      ]),
    );
    const side = (v: string, p: string, u = "x") => ({ value: v, unit: u, period: p });
    const m = (key: string, label: string, a: string, b: string, d: number) => ({
      key,
      label,
      prior: side(a, "FY2025"),
      current: side(b, "FY2026"),
      difference: d,
      unit: "x",
    });
    renderChanges(
      {
        pack: {
          measures: [
            m("coverage", "Interest Cover (x)", "2.1", "1.7", -0.4),
            m("revenue", "Revenue", "1", "2", 1),
            m("net_leverage", "Net leverage", "6", "7", 1),
          ],
        },
        verdicts: {
          measures: Object.fromEntries(
            ["coverage", "revenue", "net_leverage"].map((k) => [
              k,
              { kind: "comparable", label: "L" },
            ]),
          ),
        },
      },
      [entry],
    );
    const lineOf = (el: HTMLElement) => /-(\d+)$/.exec(el.getAttribute("href") ?? "")?.[1];
    const rows = within(screen.getByRole("list", { name: "Measures that moved" })).getAllByRole(
      "listitem",
    );
    expect(
      rows.map((row) => lineOf(within(row).getByRole("link", { name: "Comparison row" }))),
    ).toEqual(["32", "33", "31"]);
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    const table = within(screen.getByRole("region", { name: "Earlier against current" }));
    expect(table.getAllByRole("link", { name: "Comparison row" }).map(lineOf)).toEqual([
      "32",
      "33",
      "31",
    ]);
  });

  it("says a measure's effect is not stated or links to Evidence, as a fact's does", () => {
    const entry = cp8([]);
    entry.sections.push(
      issuerSection([
        ["A", "1x", "2x", "New period", ""],
        ["B", "1x", "2x", "New period", "Per filing.pdf p. 3 the effect is large"],
      ]),
    );
    const side = (v: string, p: string) => ({ value: v, unit: "x", period: p });
    renderChanges(
      {
        pack: {
          measures: ["A", "B"].map((label) => ({
            key: label.toLowerCase(),
            label,
            prior: side("1", "FY2025"),
            current: side("2", "FY2026"),
            difference: 1,
            unit: "x",
          })),
        },
        verdicts: {
          measures: {
            a: { kind: "comparable", label: "L" },
            b: { kind: "comparable", label: "L" },
          },
        },
      },
      [entry],
    );
    expect(screen.getByText("Effect not stated")).toBeVisible();
    expect(screen.getByRole("link", { name: "Read the effect in Evidence" })).toBeVisible();
  });

  it("draws every No material change row, each with its own source", () => {
    const entry = cp8([]);
    entry.sections.push(
      issuerSection([
        ["No material change", "—", "—", "Nothing moved at the issuer.", "—"],
        ["No material change", "—", "—", "None", "Still nothing."],
      ]),
    );
    renderChanges(withPack, [entry]);
    const tile = within(screen.getByRole("region", { name: "At the issuer" }));
    expect(tile.getByText(/Nothing moved at the issuer\./)).toBeVisible();
    expect(tile.getByText(/Still nothing\./)).toBeVisible();
    expect(tile.getAllByRole("link", { name: "Source for this statement" })).toHaveLength(2);
  });

  it("hides the reference columns in the ledger fallback and says a table with no rows has none", () => {
    const entry = ledgerOf(
      ["Earlier ref", "Current ref", "Limitation", "State"],
      [["E1", "C2", "Margins", "Open"]],
    );
    entry.sections.push({
      heading: "Notes table",
      level: 3,
      line: 70,
      blocks: [{ type: "table", headers: ["A", "B"], line: 71, rows: [] }],
    });
    renderChanges(withPack, [entry]);
    const tile = within(screen.getByRole("region", { name: "Limitations ledger" }));
    expect(tile.getByText("Margins")).toBeVisible();
    expect(tile.queryByText("E1")).toBeNull();
    expect(tile.queryByText("C2")).toBeNull();
    expect(screen.getByText("This table has no rows.")).toBeVisible();
  });

  it("draws two leftover sections that share a heading without a key clash", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const entry = cp8([]);
    const same = (line: number, text: string) => ({
      heading: "Unresolved differences",
      level: 3,
      line,
      blocks: [{ type: "text" as const, line: line + 1, end: line + 1, text }],
    });
    entry.sections.push(same(80, "First difference."), same(90, "Second difference."));
    renderChanges(withPack, [entry]);
    expect(screen.getByText("First difference.")).toBeVisible();
    expect(screen.getByText("Second difference.")).toBeVisible();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("opens the right issuer row in the Table view for two measures that share a label, in either pack order", () => {
    const side = (v: string, unit: string, p: string) => ({ value: v, unit, period: p });
    const mk = (key: string, unit: string) => ({
      key,
      label: "Net leverage",
      prior: side("6", unit, "FY2025"),
      current: side("7", unit, "FY2026"),
      difference: 1,
      unit,
    });
    const lineOf = (el: HTMLElement) => /-(\d+)$/.exec(el.getAttribute("href") ?? "")?.[1];
    for (const order of [
      [mk("a", "US$m"), mk("b", "x")],
      [mk("b", "x"), mk("a", "US$m")],
    ]) {
      const entry = cp8([]);
      entry.sections.push(issuerSection([["Net leverage (x)", "6x", "7x", "New period", ""]]));
      const { unmount } = renderChanges(
        {
          pack: { measures: order },
          verdicts: {
            measures: {
              a: { kind: "comparable", label: "L" },
              b: { kind: "comparable", label: "L" },
            },
          },
        },
        [entry],
      );
      fireEvent.click(screen.getByRole("button", { name: "Table" }));
      const table = within(screen.getByRole("region", { name: "Earlier against current" }));
      const lines = table.getAllByRole("link", { name: "Comparison row" }).map(lineOf);
      expect(lines).toEqual(order.map((m) => (m.unit === "x" ? "32" : "31")));
      unmount();
    }
  });

  it("draws a written dash effect on a measure as a dash, not as not stated", () => {
    const entry = cp8([]);
    entry.sections.push(issuerSection([["A", "1x", "2x", "New period", "—"]]));
    const side = (v: string, p: string) => ({ value: v, unit: "x", period: p });
    renderChanges(
      {
        pack: {
          measures: [
            {
              key: "a",
              label: "A",
              prior: side("1", "FY2025"),
              current: side("2", "FY2026"),
              difference: 1,
              unit: "x",
            },
          ],
        },
        verdicts: { measures: { a: { kind: "comparable", label: "L" } } },
      },
      [entry],
    );
    expect(screen.queryByText("Effect not stated")).toBeNull();
    expect(screen.getByText("Effect on the credit view: —")).toBeVisible();
  });

  // Shaped like the first real comparison (TransDigm, two runs of one as-of date): every cause is
  // "Unresolved", each effect opens with the verdict's own words, and the issuer section leads with
  // a paragraph that qualifies the differences drawn from its table.
  describe("a real comparison whose causes are unresolved", () => {
    const realEntry = () => {
      const entry = cp8([["E1", "C1", "Segment margins are not disclosed", "Remaining", "—"]]);
      entry.sections.push({
        heading: "What changed: the issuer",
        level: 3,
        line: 64,
        blocks: [
          {
            type: "text" as const,
            line: 66,
            end: 66,
            text: "The signed differences below are copied comparisons of different observation dates, not evidence of developments after the earlier review.",
          },
          {
            type: "table" as const,
            headers: [
              "Measure or fact",
              "Earlier",
              "Current",
              "Cause",
              "Effect on the credit view",
            ],
            line: 69,
            rows: [
              {
                line: 76,
                cells: [
                  "Undrawn committed facilities",
                  "843 US$m (FY2024 / 2024-09-30)",
                  "839 US$m (2024-06-29)",
                  "Unresolved",
                  "Same definition: available revolving commitments after letters of credit; supplied difference -4 US$m compares different observation dates. This does not establish a deterioration in access since the earlier review.",
                ],
              },
              {
                line: 77,
                cells: ["Revenue", "6585 US$m", "7940 US$m", "Organic growth", "Supportive"],
              },
            ],
          },
        ],
      });
      const ledger = entry.sections.find((section) => section.heading === "Limitations ledger");
      ledger?.blocks.unshift({
        type: "text" as const,
        line: 9,
        end: 9,
        text: "The ledger pairs limitations by economic meaning rather than wording.",
      });
      return entry;
    };
    const side = (value: string, period: string) => ({ value, unit: "US$m", period });
    const real: PublishedChanges = {
      pack: {
        measures: [
          {
            key: "undrawn",
            label: "Undrawn committed facilities",
            unit: "US$m",
            prior: side("843", "FY2024 / 2024-09-30"),
            current: side("839", "2024-06-29"),
            difference: "-4",
          },
          {
            key: "revenue",
            label: "Revenue",
            unit: "US$m",
            prior: side("6585", "FY2023"),
            current: side("7940", "FY2024"),
            difference: "1355",
          },
        ],
      },
      verdicts: {
        measures: {
          undrawn: { kind: "comparable", label: "Same definition" },
          revenue: { kind: "comparable", label: "Comparable" },
        },
      },
    };
    const rowOf = (name: string) =>
      screen.getByRole("heading", { name }).closest("li") as HTMLElement;

    it("calls a move neither better nor worse when the comparison leaves its cause unresolved", () => {
      renderChanges(real, [realEntry()]);
      const unresolved = rowOf("Undrawn committed facilities");
      expect(within(unresolved).getByText("Cause: Unresolved")).toBeVisible();
      expect(unresolved.querySelector("[data-change]")).not.toHaveTextContent(/better|worse/);
      expect(unresolved.querySelector('[data-mark="dumbbell"] [data-current]')?.className).toMatch(
        /bg-text-secondary/,
      );
      expect(unresolved.querySelector("[data-change]")).toHaveTextContent("-US$4m");
      expect(rowOf("Revenue").querySelector("[data-change]")).toHaveTextContent("better");
    });

    it("does not repeat the verdict's words above an effect that opens with them", () => {
      renderChanges(real, [realEntry()]);
      expect(
        within(rowOf("Undrawn committed facilities")).getAllByText(/Same definition/),
      ).toHaveLength(1);
    });

    it("draws each register's lead paragraph with the register it qualifies, not at the foot of the page", () => {
      renderChanges(real, [realEntry()]);
      const measures = within(screen.getByRole("region", { name: "Measures that moved" }));
      expect(
        measures.getByText(/The signed differences below are copied comparisons/),
      ).toBeVisible();
      const ledger = within(screen.getByRole("region", { name: "Limitations ledger" }));
      expect(ledger.getByText(/The ledger pairs limitations by economic meaning/)).toBeVisible();
      expect(screen.queryByRole("region", { name: "More from the comparison" })).toBeNull();
    });
  });
});
