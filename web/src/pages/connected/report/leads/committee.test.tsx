import path from "node:path";
// Synthetic, built from the module contract (src/deploy_vii/cp6_committee.py: the Final-bias
// register, T6A.4 "Bear cross-examination" and the portfolio-limits chart); not a real handoff.
// No real CP-6 handoff is retained. The thin case uses the retained synthetic CP-6 fixture.
// Every expected value below is written out by hand.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OutputEntry, Section } from "../../publishedReport";
import { entry as buildEntry, table } from "../overview/rows.fixture";
import { CommitteeLead } from "./committee";
import { ledger, stance } from "./committeeData";
import { cp6Entry, leadProps } from "./fixtures/load";
import { fixtureEntry } from "./markdown.fixture";

afterEach(cleanup);

let at = 0;
const tbl = (heading: string, headers: string[], ...rows: string[][]): Section => ({
  heading,
  level: 3,
  line: (at += 20),
  blocks: [table((at += 2), headers, rows)],
});
const text = (heading: string, paragraph: string): Section => ({
  heading,
  level: 3,
  line: (at += 20),
  blocks: [{ type: "text", line: (at += 2), end: at, text: paragraph }],
});
const cp6 = (...sections: Section[]): OutputEntry =>
  buildEntry("CP-6", [], [{ heading: "Findings", level: 2, line: 1, blocks: [] }, ...sections]);

const BIAS_HEADERS = [
  "Item",
  "Action bias",
  "Rationale",
  "Conditions",
  "Confidence",
  "Basis",
  "Limitation",
];
const bias = (word: string, conditions: string, confidence: string) =>
  tbl("T6-FINAL Final bias", BIAS_HEADERS, [
    "Recommendation",
    word,
    "Cover is thin.",
    conditions,
    confidence,
    "n/a",
    "None",
  ]);
const LEDGER_HEADERS = [
  "Item",
  "CP-2 row",
  "Counter-case",
  "Evidence for",
  "Evidence against",
  "What would change the view",
  "Basis",
];
const claim = (n: number, over: Partial<Record<string, string>> = {}) => [
  `r${String(n)}`,
  over["point"] ?? `Point ${String(n)}`,
  over["counter"] ?? `Counter ${String(n)}`,
  over["for"] ?? `For ${String(n)}`,
  over["against"] ?? `Against ${String(n)}`,
  over["change"] ?? `Change ${String(n)}`,
  "n/a",
];
const LIMIT_HEADERS = [
  "Limit",
  "Current exposure",
  "Proposed exposure",
  "Limit value",
  "Reporting unit",
  "Basis and limitation",
];
const LIMITS = tbl(
  "Chart data: portfolio limits",
  LIMIT_HEADERS,
  ["Max single issuer", "2.37", "2.40", "2.50", "% NAV", "Snapshot."],
  ["Max unrated", "3.73", "Not supplied: no proposal", "5.00", "% NAV", "Snapshot."],
);

describe("stance", () => {
  it("reads the action bias and confidence from the Final-bias table, as written", () => {
    const found = stance(cp6(bias("Underweight", "Refinance by 2027; Cover above 3x", "Medium")));
    expect(found).toMatchObject({
      state: "stated",
      word: "Underweight",
      confidence: "Medium",
      source: "table",
    });
    // The Conditions cell as written: one item, never split at the semicolon.
    expect(found.state === "stated" && found.conditions).toEqual({
      kind: "list",
      items: [{ kind: "text", text: "Refinance by 2027; Cover above 3x" }],
    });
  });
  it("parses the challenge sentence with a strict pattern when there is no table", () => {
    const found = stance(
      cp6(
        text(
          "Committee challenge",
          "Action bias: Neutral (confidence Low). The cover is thin. Conditions: none.\nBasis: x",
        ),
      ),
    );
    expect(found).toMatchObject({ word: "Neutral", confidence: "Low", source: "sentence" });
  });
  it("does not guess from a sentence that is not exactly that shape", () => {
    expect(stance(cp6(text("Committee challenge", "The action bias is Neutral."))).state).toBe(
      "gap",
    );
    expect(
      stance(cp6(text("Committee challenge", "Action bias: Neutral confidence Low."))).state,
    ).toBe("gap");
    expect(stance(cp6()).state).toBe("gap");
  });
  it("keeps a stated gap as a gap, with its reason", () => {
    expect(stance(cp6(bias("Not supplied: no committee view", "x", "Low")))).toEqual({
      state: "gap",
      reason: "no committee view",
    });
  });
  it("refuses a Final-bias table with two rows", () => {
    const two = tbl(
      "F",
      BIAS_HEADERS,
      ["a", "Neutral", "r", "c", "Low", "b", "l"],
      ["b", "Overweight", "r", "c", "High", "b", "l"],
    );
    expect(stance(cp6(two)).state).toBe("gap");
  });
  it("sends a conditions cell that cites a source to Evidence, whole", () => {
    const found = stance(cp6(bias("Neutral", "Refinance by 2027; see annual.pdf p. 4", "High")));
    expect(found.state === "stated" && found.conditions).toEqual({
      kind: "list",
      items: [{ kind: "evidence" }],
    });
  });
});

describe("ledger", () => {
  it("reads one row per CP-2 row with its four cells", () => {
    const found = ledger(
      cp6(tbl("T6A.4 Bear cross-examination", LEDGER_HEADERS, claim(1), claim(2))),
    );
    expect(found.state === "rows" && found.rows.map((row) => row.evidenceFor)).toEqual([
      { kind: "text", text: "For 1" },
      { kind: "text", text: "For 2" },
    ]);
  });
  it("reads the handoff's own empty row as none, with its reason", () => {
    const empty = tbl("T", LEDGER_HEADERS, [
      "None",
      "Not supplied: None in the CP-6 submission (challenges)",
      "Not supplied: None in the CP-6 submission (challenges)",
      "Not supplied: None in the CP-6 submission (challenges)",
      "Not supplied: None in the CP-6 submission (challenges)",
      "Not supplied: None in the CP-6 submission (challenges)",
      "Not supplied: None in the CP-6 submission (challenges)",
    ]);
    expect(ledger(cp6(empty))).toEqual({
      state: "none",
      reason: "None in the Committee decision submission (challenges)",
    });
  });
  it("is absent without the table and refuses two", () => {
    expect(ledger(cp6()).state).toBe("absent");
    const one = tbl("A", LEDGER_HEADERS, claim(1));
    expect(ledger(cp6(one, one)).state).toBe("duplicate");
  });
});

const renderLead = (entry: OutputEntry) => render(<CommitteeLead {...leadProps(entry)} />);
const FULL = () =>
  cp6(
    bias("Underweight", "Refinance by 2027; Cover above 3x", "Medium"),
    tbl("T6A.4 Bear cross-examination", LEDGER_HEADERS, claim(1), claim(2)),
  );

describe("CommitteeLead", () => {
  it("draws the stance as written, the caption, the confidence meter and the conditions", () => {
    const { container } = renderLead(FULL());
    const tile = screen.getByRole("region", { name: "Committee stance" });
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Committee stance");
    expect(tile.querySelector("[data-action-bias]")?.textContent).toBe("Underweight");
    expect(within(tile).getByText("Confidence Medium")).toBeVisible();
    expect(within(tile).queryByText(/typed field/)).toBeNull();
    // The confidence is the word as written: the page makes no scale of its own from it
    // (the contract's call scale is 1, 2, 3, 5, not three steps).
    expect(container.querySelector("[data-step], [data-confidence]")).toBeNull();
    expect(tile.querySelector("[data-confidence-word]")?.textContent).toBe("Confidence Medium");
    expect([...tile.querySelectorAll("[data-condition]")].map((item) => item.textContent)).toEqual([
      "Refinance by 2027; Cover above 3x",
    ]);
  });
  it("draws the gap when no action bias is stated but the challenged points are", () => {
    renderLead(cp6(tbl("T6A.4", LEDGER_HEADERS, claim(1))));
    expect(screen.getByText(/This page could not read an action bias\./)).toBeVisible();
  });
  it("draws one ledger row per claim with a verdict gap that is always the same designed words", () => {
    renderLead(FULL());
    const tile = screen.getByRole("region", { name: "Challenged points" });
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Challenged points");
    const rows = tile.querySelectorAll("ol > li");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelector('[data-cell="point"]')?.textContent).toContain("Point 1");
    expect(rows[0]?.querySelector('[data-cell="for"]')?.textContent).toContain("For 1");
    expect(rows[1]?.querySelector('[data-cell="counter"]')?.textContent).toContain("Counter 2");
    expect(rows[1]?.querySelector('[data-cell="against"]')?.textContent).toContain("Against 2");
    expect(rows[0]?.querySelector('[data-cell="change"]')?.textContent).toContain("Change 1");
    // The verdict gap is said once, above the ledger, never per claim.
    expect(
      within(tile).getAllByText("This page could not read a verdict for these claims."),
    ).toHaveLength(1);
    expect(tile.querySelectorAll('[data-cell="verdict"]')).toHaveLength(0);
    expect(tile.textContent).not.toMatch(/verdict for this claim/);
  });
  it("caps the ledger at eight rows and holds the rest in a details", () => {
    const many = cp6(
      bias("Neutral", "x", "Low"),
      tbl("T6A.4", LEDGER_HEADERS, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => claim(n))),
    );
    renderLead(many);
    const tile = screen.getByRole("region", { name: "Challenged points" });
    const lists = tile.querySelectorAll("ol");
    expect(lists[0]?.children).toHaveLength(8);
    const more = tile.querySelector("details");
    expect(more?.querySelector("summary")?.textContent).toBe("Show 2 more points");
    expect(more?.querySelectorAll("li")).toHaveLength(2);
    expect(within(tile).getByRole("heading", { level: 3 }).textContent).toBe("Challenged points");
  });
  it("trims a long case to two lines with Show more, and draws a stated gap and a citation as such", () => {
    const long = "A long statement about the credit case. ".repeat(8).trim();
    renderLead(
      cp6(
        tbl(
          "T6A.4",
          LEDGER_HEADERS,
          claim(1, {
            for: long,
            against: "Not supplied: nothing was found",
            change: "See annual.pdf page 3",
          }),
        ),
      ),
    );
    const row = document.querySelector("ol > li") as HTMLElement;
    const forCell = row.querySelector('[data-cell="for"]') as HTMLElement;
    expect(forCell.querySelector("p.line-clamp-2")).not.toBeNull();
    expect(within(forCell).getByText("Show more")).toBeVisible();
    expect(
      within(row.querySelector('[data-cell="against"]') as HTMLElement).getByText(
        "Not supplied: nothing was found",
      ),
    ).toBeVisible();
    expect(
      within(row.querySelector('[data-cell="change"]') as HTMLElement).getByText(
        "Detail is in Evidence.",
      ),
    ).toBeVisible();
    expect(row.textContent).not.toContain("annual.pdf");
  });
  it("draws a gap for a ledger that is absent or empty", () => {
    renderLead(cp6(bias("Neutral", "x", "Low")));
    expect(
      screen.getByText(/This page could not read the cross-examination of the credit case\./),
    ).toBeVisible();
  });
  it("draws one trace control per figure and no source reference", () => {
    const { container } = renderLead(FULL());
    expect(screen.getAllByRole("link", { name: /Source for/ })).toHaveLength(2);
    expect(container.textContent).not.toMatch(/\bCP-\d|T6A|T2\./);
  });
  it("draws the challenged point as the row's subject, with the module's own column names and no bull or bear words", () => {
    const { container } = renderLead(
      cp6(
        bias("Neutral", "x", "Low"),
        tbl(
          "T6A.4",
          LEDGER_HEADERS,
          claim(1, {
            point: "Weakness: leverage is high and rising",
            for: "Gross debt rose from 19,750 to 24,880 while EBITDA rose less.",
            counter: "EBITDA growth may outpace debt.",
            against: "Cash covers the 2026 maturity.",
          }),
        ),
      ),
    );
    const row = container.querySelector("ol > li") as HTMLElement;
    expect(row.querySelector('[data-cell="point"]')?.textContent).toBe(
      "Challenged pointWeakness: leverage is high and rising",
    );
    const labels = [...row.querySelectorAll("p")]
      .filter((p) => p.className.includes("font-medium text-text-tertiary"))
      .map((p) => p.textContent);
    expect(labels).toEqual([
      "Challenged point",
      "Counter-case",
      "Evidence for this point",
      "Evidence against this point",
      "What would change the view",
    ]);
    expect(row.querySelector('[data-cell="for"]')?.textContent).toContain("Gross debt rose");
    expect(container.textContent).not.toMatch(/bull|bear|case for|case against/i);
  });
  it("wraps very long words", () => {
    const long = "y".repeat(200);
    renderLead(cp6(tbl("T", LEDGER_HEADERS, claim(1, { counter: long }))));
    expect(screen.getAllByText(long)[0]?.className).toContain("wrap-anywhere");
  });
});

describe("layout, titles and what the lead draws", () => {
  it("names each tile plainly, with no count", () => {
    renderLead(FULL());
    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(["Committee stance", "Challenged points"]);
  });
  it("draws no typed figure, event lane or map: the frame draws the limits and the events", () => {
    expect(CommitteeLead.draws).toEqual([]);
  });
  it("draws no limits tile and no watch tile for an entry that carries both tables", () => {
    const events = tbl(
      "Events: Decision and watch",
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
        "2025-03-31",
        "day",
        "2024-11-07",
        "Receivables facility matures",
        "Scheduled",
        "Filing p.1",
        "Wall",
      ],
    );
    const { container } = renderLead(
      cp6(...[FULL()].flatMap((e) => e.sections.slice(1)), LIMITS, events),
    );
    expect(
      [...container.querySelectorAll("section[aria-label]")].map((tile) =>
        tile.getAttribute("aria-label"),
      ),
    ).toEqual(["Committee stance", "Challenged points"]);
    expect(container.textContent).not.toMatch(/Current 2\.37|Limit 2\.50|Receivables facility/);
    expect(container.querySelector("[data-limit], [data-watch]")).toBeNull();
  });
  it("sets the stance and the challenged points side by side, each at its own height", () => {
    renderLead(FULL());
    const place = (name: string) =>
      (screen.getByRole("region", { name }).parentElement as HTMLElement).className;
    expect(place("Committee stance")).toContain("lg:col-span-5");
    expect(place("Challenged points")).toContain("lg:col-span-7");
    for (const name of ["Committee stance", "Challenged points"])
      expect(place(name)).toContain("self-start");
  });
  it("draws one gap tile, and no other tile, for a committee decision with nothing readable, even with limits and events tables", () => {
    renderLead(cp6Entry());
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Committee decision" })).toHaveTextContent(
      "This page could not read the committee decision.",
    );
    cleanup();
    renderLead(cp6());
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Committee decision" })).toHaveTextContent(
      "This page could not read the committee decision.",
    );
  });
  it("offers Show more only for text long enough to clamp", () => {
    renderLead(
      cp6(
        bias("Neutral", "x", "Low"),
        tbl("T6A.4", LEDGER_HEADERS, claim(1, { for: "A short claim.", against: "Another." })),
      ),
    );
    expect(screen.queryByText("Show more")).toBeNull();
  });
});

describe("disclosures", () => {
  it("makes every Show more summary a real target with a marker and the token focus ring", () => {
    const long = "A long statement about the credit case. ".repeat(8).trim();
    const { container } = renderLead(
      cp6(
        bias("Neutral", "a; b; c; d; e; f", "Low"),
        tbl("T6A.4", LEDGER_HEADERS, claim(1, { for: long })),
      ),
    );
    const summaries = [...container.querySelectorAll("details > summary")];
    expect(summaries.map((summary) => summary.textContent)).toEqual(["Show more"]);
    for (const summary of summaries) {
      expect(summary.className).toContain("min-h-8");
      expect(summary.className).toContain("max-[480px]:min-h-11");
      expect(summary.className).toContain("focus-visible:outline-2");
      expect(summary.querySelector("svg")).not.toBeNull();
    }
  });
});

// Verbatim from the replayed TDG handoff: the stance is one sentence, "Final Action Bias: X.",
// with no confidence.
const REAL_DECISION =
  "Final Action Bias: Requires More Work. The decision is driven by documented cash generation alongside unresolved creditor protection and compensation, because payment capacity alone does not establish acceptable loss-adjusted return, which implies no investment approval. The main factor preventing a higher-conviction recommendation is whether an exactly identified claim offers sufficient compensation for continuing extraction and uncertain loss protection. Neither wins overall: Bull Sustained on narrow cash service, Bear Sustained on demonstrated financial policy, and unresolved on investability.\nBasis: Financial foundation (CP-1); Business & governance (CP-1A); Security selection (CP-3); Evidence validation (CP-5)";

it("reads the stance from the module's own 'Final Action Bias' sentence, no confidence invented", () => {
  const entry = cp6(text("Decision and greatest uncertainty", REAL_DECISION));
  expect(stance(entry)).toMatchObject({
    state: "stated",
    word: "Requires More Work",
    confidence: null,
    source: "sentence",
  });
  render(<CommitteeLead {...leadProps(entry)} />);
  const tile = screen.getByRole("region", { name: "Committee stance" });
  expect(within(tile).getAllByText("Requires More Work").length).toBeGreaterThan(0);
  expect(tile.textContent).not.toContain("could not read");
});

// The whole replayed TDG CP-6 handoff, verbatim (fixtures/cp6_tdg_replay.md): the cross-examination
// is its "T6A.4 Bear cross-examination" register under the module's own headings.
it("draws the replayed handoff's bear cross-examination as written, not a page failure", () => {
  const whole = fixtureEntry(
    "CP-6",
    path.resolve(import.meta.dirname, "fixtures", "cp6_tdg_replay.md"),
  );
  render(<CommitteeLead {...leadProps(whole)} />);
  const tile = screen.getByRole("region", { name: "Challenged points" });
  expect(tile.textContent).not.toContain("could not read");
  expect(within(tile).getAllByText("B1 Cash conversion").length).toBeGreaterThan(0);
  expect(
    within(tile).getAllByText(
      /scheduled interest USD 1,524 million exceeds historical paid USD 1,158 million/,
    ).length,
  ).toBeGreaterThan(0);
  expect(
    within(tile).getAllByRole("columnheader", { name: /what would prove bear wrong/i }).length,
  ).toBeGreaterThan(0);
});
