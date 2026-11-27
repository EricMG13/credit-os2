// The retained CP-0 handoff is synthetic and thin (two areas); the larger and adversarial cases are
// synthetic too, built from the module contract (src/deploy_vii/methods/cp0.md); not a real handoff.
// The consumer-shaped tables quote the retained reviews of the TransDigm run (outdated evidence, shape
// only): reviews/2026-11-12-module-output-adversarial/latest-run-tdg-proof-snapshot-opus-002.md
// (lines 70, 83, 155) and earlier-run-tdg-reader-format-001.md (line 71).
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { entry, section, table } from "../overview/rows.fixture";
import { cp0Entry, leadProps } from "./fixtures/load";
import { SourceReadinessLead } from "./sourceReadiness";
import { readinessWord, sourceReadiness } from "./sourceReadinessData";

afterEach(cleanup);

const HEADERS = ["Area", "Readiness", "Key limitation"];

function readiness(rows: string[][], headers = HEADERS, extra: ReturnType<typeof section>[] = []) {
  return entry(
    "CP-0",
    [],
    [section("Source-readiness summary", 7, table(9, headers, rows)), ...extra],
  );
}

function objectiveGate(boundary: string) {
  return section(
    "T1 Input gate",
    7,
    table(
      9,
      ["Gate field", "Resolved input", "Readiness boundary", "Source"],
      [
        [
          "Objective and profile",
          "Public deep credit assessment",
          boundary,
          "annual report, page 1",
        ],
      ],
    ),
  );
}

const FIVE = [
  ["Financial foundation", "READY", "None stated by the issuer."],
  ["Earnings delta", "Ready with limitations", "Only two annual periods are available."],
  ["Peer benchmark", "CONDITIONAL", "Peer financials were not supplied."],
  ["Acquisition financing", "Blocked", "The financing agreement is unreadable."],
  ["Committee decision", "Not ready", "No prior deliverable was supplied."],
];

const CONSUMER_HEADERS = [
  "Consumer",
  "Readiness",
  "Evidence demand",
  "Available support",
  "Bounded limitations carried",
  "Command",
];
const CONSUMER_ROWS = [
  ["CP-2G", "READY_WITH_LIMITATIONS", "Forecast inputs", "Filings", "No Q1 filing.", "RUN"],
  [
    "CP-8",
    "CONDITIONAL",
    "Needs a prior deliverable to compare",
    "None",
    "Context states no prior case attached",
    "DO NOT RUN until a prior deliverable is supplied or scope is changed",
  ],
  [
    "CP-1",
    "READY",
    "Statements",
    "Filings",
    "Complete.",
    "DO NOT RUN until a prior deliverable is supplied",
  ],
  ["CP-3", "READY", "Terms", "Filings", "Complete.", "DO NOT RUN"],
];

describe("readiness words", () => {
  it("keeps each state as the handoff wrote it, in the library's words for its enum forms", () => {
    expect(readinessWord("READY")).toEqual({ word: "Ready", mark: "ready" });
    expect(readinessWord(" Ready ")).toEqual({ word: "Ready", mark: "ready" });
    expect(readinessWord("READY_WITH_LIMITATIONS")).toEqual({
      word: "Ready with limitations",
      mark: "limited",
    });
    expect(readinessWord("Ready with limitations")).toEqual({
      word: "Ready with limitations",
      mark: "limited",
    });
    expect(readinessWord("CONDITIONAL")).toEqual({ word: "Conditional", mark: "conditional" });
    expect(readinessWord("BLOCKED")).toEqual({ word: "Blocked", mark: "blocked" });
  });
  it('never turns "Not ready" into "Blocked"', () => {
    expect(readinessWord("Not ready")).toEqual({ word: "Not ready", mark: "blocked" });
    expect(readinessWord("NOT_READY")).toEqual({ word: "Not ready", mark: "blocked" });
  });
  it("draws any other word as written, with the neutral mark", () => {
    expect(readinessWord("Mostly ready")).toEqual({ word: "Mostly ready", mark: "other" });
    expect(readinessWord("PARTIAL")).toEqual({ word: "PARTIAL", mark: "other" });
    expect(readinessWord("")).toEqual({ word: "Not read", mark: "other" });
  });
});

describe("sourceReadiness data", () => {
  it("reads the retained handoff: two areas with their limitation, the source column left out", () => {
    const result = sourceReadiness(cp0Entry());
    expect(result).toMatchObject({ kind: "ready", line: 9, reasonHeader: "Key limitation" });
    if (result.kind !== "ready") throw new Error("expected rows");
    expect(result.rows.map(({ area, word, mark, reason }) => [area, word, mark, reason])).toEqual([
      [
        "Financial statements",
        "Ready with limitations",
        "limited",
        "Only the synthetic filing is available",
      ],
      ["Acquisition financing", "Conditional", "conditional", "Financing terms are absent"],
    ]);
  });
  it("shows an explicit overall verdict without treating use-specific rows as readiness areas", () => {
    const result = sourceReadiness(
      entry(
        "CP-0",
        [],
        [
          objectiveGate(
            "`READY_WITH_LIMITATIONS` for the objective overall; usable historical financial evidence is present.",
          ),
          section(
            "T4 Content-to-module map",
            7,
            table(
              30,
              ["Evidence and scope", "Analytical use", "Source disposition", "Source"],
              [
                [
                  "Annual filing",
                  "Financial foundation",
                  "READY_WITH_LIMITATIONS",
                  "annual report",
                ],
              ],
            ),
          ),
        ],
      ),
    );
    expect(result).toMatchObject({
      kind: "overall",
      word: "Ready with limitations",
      mark: "limited",
      context: "for the objective overall; usable historical financial evidence is present.",
    });
    expect(result.kind === "ready" ? result.rows : []).toEqual([]);
  });
  it("does not guess the overall verdict from ambiguous or narrative-only gate rows", () => {
    const ambiguous = entry(
      "CP-0",
      [],
      [
        objectiveGate("`READY_WITH_LIMITATIONS` for the objective overall."),
        objectiveGate("`READY_WITH_LIMITATIONS` for the objective overall."),
      ],
    );
    const narrativeOnly = entry(
      "CP-0",
      [],
      [objectiveGate("Historical readiness was reviewed; availability remains limited.")],
    );

    expect(sourceReadiness(ambiguous)).toEqual({ kind: "absent" });
    expect(sourceReadiness(narrativeOnly)).toEqual({ kind: "absent" });
  });
  it("keeps the handoff's order and states, and carries no count of its own", () => {
    const result = sourceReadiness(readiness(FIVE));
    if (result.kind !== "ready") throw new Error("expected rows");
    expect(result.rows.map((row) => row.area)).toEqual(FIVE.map((row) => row[0]));
    expect(result.rows.map((row) => row.word)).toEqual([
      "Ready",
      "Ready with limitations",
      "Conditional",
      "Blocked",
      "Not ready",
    ]);
    expect(Object.keys(result)).not.toContain("counts");
  });
  it("is absent without the table, with another header, with no rows, or when two tables carry it", () => {
    expect(sourceReadiness(entry("CP-0", [], []))).toEqual({ kind: "absent" });
    expect(sourceReadiness(readiness(FIVE, ["Owner", "Readiness", "Key limitation"]))).toEqual({
      kind: "absent",
    });
    expect(sourceReadiness(readiness([]))).toEqual({ kind: "absent" });
    const twice = readiness(FIVE, HEADERS, [section("Other", 40, table(41, HEADERS, FIVE))]);
    expect(sourceReadiness(twice)).toEqual({ kind: "absent" });
  });
  it("draws a row with another state word as written, and every other row as usual", () => {
    const result = sourceReadiness(readiness([...FIVE, ["Segments", "Mostly ready", "x"]]));
    if (result.kind !== "ready") throw new Error("expected rows");
    expect(result.rows).toHaveLength(6);
    expect(result.rows[5]).toMatchObject({ word: "Mostly ready", mark: "other" });
  });
  it("points to Evidence for a reason or an area that names a source, and says so for an empty one", () => {
    const result = sourceReadiness(
      readiness([
        [
          "Financial foundation",
          "CONDITIONAL",
          "The 10-K tdg-20240930.htm.jsonl, page 45 is partial.",
        ],
        ["Debt terms", "READY", ""],
        ["Source pack hash 0123456789abcdef0123456789abcdef", "READY", "Complete."],
      ]),
    );
    if (result.kind !== "ready") throw new Error("expected rows");
    expect(result.rows.map(({ area, reason }) => [area, reason])).toEqual([
      ["Financial foundation", "Reason is in Evidence."],
      ["Debt terms", "This page could not read a limitation for this area."],
      ["Detail is in Evidence.", "Complete."],
    ]);
  });
  it("names a module by its page name, never by its code", () => {
    const result = sourceReadiness(
      readiness([["CP-8", "CONDITIONAL", "Needs a prior deliverable."]]),
    );
    if (result.kind !== "ready") throw new Error("expected rows");
    expect(result.rows[0]?.area).not.toMatch(/CP-/);
    expect(result.rows[0]?.area.length).toBeGreaterThan(3);
  });
  it("sees a table with an Evidence or Conflict header, and nothing else, as the P2 items", () => {
    const withEvidence = readiness(FIVE, HEADERS, [
      section("Located", 30, table(31, ["Item", "Evidence located"], [["a", "b"]])),
    ]);
    const withConflicts = readiness(FIVE, HEADERS, [
      section("Issues", 30, table(31, ["Conflict", "Severity"], [["a", "b"]])),
    ]);
    const neither = readiness(FIVE, HEADERS, [
      section("Other", 30, table(31, ["Date", "Event"], [["a", "b"]])),
    ]);
    for (const [handoff, expected] of [
      [withEvidence, true],
      [withConflicts, true],
      [neither, false],
    ] as const) {
      const result = sourceReadiness(handoff);
      expect(result.kind === "ready" && result.hasEvidenceTable).toBe(expected);
    }
  });
});

describe("the consumer shape of the readiness table", () => {
  const result = () => sourceReadiness(readiness(CONSUMER_ROWS, CONSUMER_HEADERS));
  it("reads the consumer as the area and the bounded limitation as the reason, under the handoff's own header", () => {
    const found = result();
    if (found.kind !== "ready") throw new Error("expected rows");
    expect(found.reasonHeader).toBe("Bounded limitations carried");
    expect(found.rows[0]).toMatchObject({
      word: "Ready with limitations",
      mark: "limited",
      reason: "No Q1 filing.",
      hold: null,
    });
    expect(found.rows[1]).toMatchObject({
      word: "Conditional",
      reason: "Context states no prior case attached",
    });
    for (const row of found.rows) expect(row.area).not.toMatch(/CP-/);
  });
  it("keeps a READY row ready and shows its hold in the command's words, without the command syntax", () => {
    const found = result();
    if (found.kind !== "ready") throw new Error("expected rows");
    expect(found.rows[2]).toMatchObject({
      word: "Ready",
      mark: "ready",
      hold: "On hold until a prior deliverable is supplied",
    });
    expect(found.rows[1]?.hold).toBe(
      "On hold until a prior deliverable is supplied or scope is changed",
    );
    // A command that is only the token leaves nothing to quote.
    expect(found.rows[3]).toMatchObject({ word: "Ready", hold: "On hold" });
    expect(JSON.stringify(found.rows)).not.toMatch(/DO NOT RUN|\bRUN\b/);
  });
  it("names the earlier real run's free-text column as its own header", () => {
    const found = sourceReadiness(
      readiness(
        [["Legal and covenant package", "NOT_READY", "No executed agreement.", "DO NOT RUN"]],
        ["Canonical consumer", "Readiness", "Evidence demand and available support", "Command"],
      ),
    );
    if (found.kind !== "ready") throw new Error("expected rows");
    expect(found.reasonHeader).toBe("Evidence demand and available support");
    expect(found.rows[0]).toMatchObject({
      area: "Legal and covenant package",
      word: "Not ready",
      reason: "No executed agreement.",
      hold: "On hold",
    });
  });
});

const lead = (handoff = cp0Entry()) => render(<SourceReadinessLead {...leadProps(handoff)} />);
const matrix = () => screen.getByRole("list", { name: "Readiness by area" });
const rowOf = (name: string) => within(matrix()).getByText(name).closest("li") as HTMLElement;

describe("SourceReadinessLead", () => {
  it("draws no headline count: the title names the subject, and there is no strip of counts", () => {
    lead(readiness(FIVE));
    expect(screen.getByRole("heading", { name: "Readiness by area" })).toBeVisible();
    expect(screen.queryByRole("group", { name: /Areas by readiness/ })).toBeNull();
    expect(document.body.textContent).not.toMatch(/\d+ of \d+ areas|\d+ areas?\b/);
  });
  it("draws one row per area with the state as a shape and the handoff's word, and the reason in words", () => {
    lead(readiness(FIVE));
    const rows = within(matrix()).getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    expect(
      rows.map((row) => row.querySelector("[data-state]")?.getAttribute("data-state")),
    ).toEqual(["ready", "limited", "conditional", "blocked", "blocked"]);
    expect(
      rows.map((row) => row.querySelector("[data-shape]")?.getAttribute("data-shape")),
    ).toEqual(["dot", "half-dot", "ring", "slash", "slash"]);
    expect(within(rowOf("Peer benchmark")).getByText("Conditional")).toBeVisible();
    expect(
      within(rowOf("Peer benchmark")).getByText("Peer financials were not supplied."),
    ).toBeVisible();
    expect(within(rowOf("Committee decision")).getByText("Not ready")).toBeVisible();
    expect(within(rowOf("Committee decision")).queryByText("Blocked")).toBeNull();
    expect(within(rowOf("Acquisition financing")).getByText("Blocked")).toBeVisible();
  });
  it("draws a state word it does not know as written, with the neutral mark, and keeps the matrix", () => {
    lead(readiness([...FIVE, ["Segments", "Mostly ready", "Thin."]]));
    const row = rowOf("Segments");
    expect(within(row).getByText("Mostly ready")).toBeVisible();
    expect(row.querySelector("[data-shape]")?.getAttribute("data-shape")).toBe("neutral");
    expect(within(matrix()).getAllByRole("listitem")).toHaveLength(6);
    expect(
      screen.queryByText("The readiness table uses states this page does not recognise."),
    ).toBeNull();
  });
  it("puts the row's state in its own column and in no other", () => {
    lead(readiness([...FIVE, ["Segments", "Mostly ready", "Thin."]]));
    const columns = ["ready", "limited", "conditional", "blocked", "other"];
    for (const [area, state] of [
      ["Financial foundation", "ready"],
      ["Earnings delta", "limited"],
      ["Peer benchmark", "conditional"],
      ["Acquisition financing", "blocked"],
      ["Committee decision", "blocked"],
      ["Segments", "other"],
    ]) {
      const mark = rowOf(area as string).querySelector("[data-state]") as HTMLElement;
      expect(mark.className).toContain(
        `lg:col-start-${String(columns.indexOf(state as string) + 2)}`,
      );
    }
  });
  it("shows the hold of a READY row beside its state, as the command's words", () => {
    const { container } = lead(readiness(CONSUMER_ROWS, CONSUMER_HEADERS));
    const row = rowOf("Changes since the last run");
    expect(within(row).getByText("Conditional")).toBeVisible();
    const ready = [...within(matrix()).getAllByRole("listitem")].filter((item) =>
      item.querySelector('[data-state="ready"]'),
    );
    expect(ready).toHaveLength(2);
    expect(ready[0]).toHaveTextContent("On hold until a prior deliverable is supplied");
    expect(ready[1]).toHaveTextContent("On hold");
    expect(container.textContent).not.toMatch(/DO NOT RUN|\bRUN\b|CP-|READY_WITH/);
  });
  it("names the free-text column as the handoff does, in the table view too", () => {
    const { container } = lead(readiness(CONSUMER_ROWS, CONSUMER_HEADERS));
    expect(screen.getAllByText("Bounded limitations carried").length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("Key limitation");
    const heads = [...container.querySelectorAll("thead th")].map((cell) => cell.textContent);
    expect(heads).toEqual(["Area", "Readiness", "Bounded limitations carried", "On hold"]);
  });
  it("keeps one trace control and hides the shapes from assistive technology", () => {
    const { container } = lead(readiness(FIVE));
    expect(screen.getAllByRole("link", { name: /Source for/ })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Source for/ })).toHaveAttribute(
      "href",
      expect.stringContaining("/report/run#evidence/"),
    );
    const shapes = container.querySelectorAll("[data-shape]");
    expect(shapes.length).toBeGreaterThan(4);
    for (const shape of shapes) expect(shape.getAttribute("aria-hidden")).toBe("true");
  });
  it("carries a table view with every area, state and reason", () => {
    const { container } = lead(readiness(FIVE));
    const cells = [...container.querySelectorAll("tbody tr")].map((row) =>
      [...row.querySelectorAll("td")].map((cell) => cell.textContent),
    );
    expect(cells[2]).toEqual([
      "Peer benchmark",
      "Conditional",
      "Peer financials were not supplied.",
    ]);
    expect(cells[4]?.[1]).toBe("Not ready");
    expect(cells).toHaveLength(5);
  });
  it("draws no source reference, and the retained handoff's source column stays out", () => {
    const { container } = lead();
    expect(container.textContent).not.toMatch(/Filing p\.|\.md|sha256|CP-0/);
    expect(within(matrix()).getByText("Only the synthetic filing is available")).toBeVisible();
    expect(screen.queryByText("Filing p.1")).toBeNull();
  });
  it("says in one gap tile that the key evidence located and the conflicts are not read", () => {
    lead();
    const tile = screen.getByRole("region", { name: "Key evidence located and conflicts" });
    expect(tile).toHaveTextContent(
      "This page could not read the key evidence located or the conflicts.",
    );
    expect(tile.className).not.toContain("border-dashed");
  });
  it("does not say so when the handoff has a table that could hold them", () => {
    lead(
      readiness(FIVE, HEADERS, [
        section("Located", 30, table(31, ["Item", "Evidence"], [["a", "b"]])),
      ]),
    );
    expect(screen.queryByText(/could not read the key evidence/)).toBeNull();
    expect(matrix()).toBeInTheDocument();
  });
  it("draws one plain gap tile when the table is absent", () => {
    lead(entry("CP-0", [], []));
    const tile = screen.getByRole("region", { name: "Readiness by area" });
    expect(tile).toHaveTextContent("No readiness-by-area table is present in this module.");
    expect(tile.className).not.toContain("border-dashed");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText(/could not read the key evidence/)).toBeNull();
  });
  it("draws the objective-level state and preserves its row in the trace table", () => {
    lead(entry("CP-0", [], [objectiveGate("`READY_WITH_LIMITATIONS` for the objective overall.")]));
    const tile = screen.getByRole("region", { name: "Overall source readiness" });
    expect(within(tile).getByText("Ready with limitations")).toBeVisible();
    expect(within(tile).getByText("for the objective overall.")).toBeVisible();
    expect(screen.queryByRole("list", { name: "Readiness by area" })).toBeNull();
    expect(screen.queryByText(/could not read the readiness by area/)).toBeNull();
    fireEvent.click(
      within(tile).getByRole("button", { name: "Table view: Overall source readiness" }),
    );
    expect(within(tile).getByRole("table")).toHaveTextContent("Objective and profile");
    expect(within(tile).getByRole("table")).toHaveTextContent("Public deep credit assessment");
    expect(within(tile).queryByRole("cell", { name: "annual report, page 1" })).toBeNull();
  });
  it("draws nothing for a module the frame reports as unreadable", () => {
    const source = readiness(FIVE);
    (source.output as { parseError?: string }).parseError = "unreadable";
    const { container } = lead(source);
    expect(container).toBeEmptyDOMElement();
  });
  it("lists no figures, events or maps among what it draws itself", () => {
    expect(SourceReadinessLead.draws).toEqual([]);
  });
  it("collapses to one chip column below lg and wraps the reason under the area", () => {
    lead(readiness(FIVE));
    const row = rowOf("Peer benchmark");
    expect(row.className).toContain("grid-cols-[1fr_auto]");
    expect(row.className).toContain("lg:grid-cols-");
    const reason = within(row).getByText("Peer financials were not supplied.");
    expect(reason.className).toContain("col-span-2");
    expect(reason.className).toContain("lg:col-span-1");
    // Text on a phone is the page's caption size or larger, never smaller.
    expect(row.querySelector("[class*='text-[']")).toBeNull();
  });
});
