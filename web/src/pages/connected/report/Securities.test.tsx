import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { Securities, securityView } from "./Securities";

afterEach(cleanup);

/** The instrument's row in the instrument table. */
function instrumentRow(name: string) {
  const found = screen.getByRole("rowheader", { name }).closest("tr");
  if (!found) throw new Error(`missing row ${name}`);
  return found;
}

/** The yield bars drawn in the instrument table, by instrument. */
const bars = () =>
  [...document.querySelectorAll("[data-bar]")].map(
    (bar) => bar.closest("tr")?.querySelector("th")?.textContent,
  );

/** The bar widths under `selector`, as numbers of percent. */
const widths = (selector: string) =>
  [
    ...document.querySelectorAll<HTMLElement>(`${selector} .bg-chart-1, ${selector} .bg-chart-2`),
  ].map((bar) => Number.parseFloat(bar.style.width));

/** One instrument's card in the phone list. */
function card(name: string) {
  const list = screen.getByRole("list", { name: "Instruments" });
  const found = within(list)
    .getAllByRole("listitem")
    .find((item) => within(item).queryByRole("heading", { name }));
  if (!found) throw new Error(`missing card ${name}`);
  return found;
}

function basis(date: string, amounts = "USD millions") {
  return `All amounts ${amounts} unless stated; yields are percentages from last trades on ${date}; differences in yield are percentage points, shown in bp.`;
}

function dataset(when: string, marketBasis: string[]): OutputEntry {
  return {
    output: {
      module: "CP-3",
      id: "decision",
      label: "Security selection",
      sha256: "hash",
      href: "decision.md",
    },
    selected: true,
    sections: [
      {
        heading: "Security decision summary",
        line: 2,
        level: 3,
        blocks: [
          {
            type: "table",
            line: 4,
            headers: [
              "Instrument",
              `Market level (${when})`,
              "Rank",
              "Relative value",
              "Recommendation",
              "Source",
            ],
            rows: [
              {
                line: 6,
                cells: [
                  "Secured notes",
                  "$99.00; yield 7.005000%, 7.01% rounded",
                  "First lien",
                  "Fair",
                  "Neutral",
                  "Filing p.1",
                ],
              },
              {
                line: 7,
                cells: [
                  "Unsecured notes",
                  "$89.00; yield 9.12%",
                  "Unsecured",
                  "Unclear",
                  "Requires More Work",
                  "Filing p.2",
                ],
              },
              {
                line: 8,
                cells: [
                  "Term loan",
                  "Not supplied: no loan observation",
                  "Secured",
                  "Unclear",
                  "Requires More Work",
                  "Filing p.3",
                ],
              },
            ],
          },
        ],
      },
      {
        heading: "Calculations",
        line: 10,
        level: 2,
        blocks: marketBasis.map((text, i) => ({ type: "text", line: 11 + i, end: 11 + i, text })),
      },
    ],
  };
}

it("shows the paired observed quote with all authored digits and keeps the unquoted decision outside it", () => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  // Each last-trade yield as written, with its bar against the largest stated yield; the unquoted
  // loan has no yield and no bar.
  expect(within(instrumentRow("Secured notes")).getByText("7.005000%")).toBeInTheDocument();
  expect(within(instrumentRow("Unsecured notes")).getByText("9.12%")).toBeInTheDocument();
  expect(bars()).toEqual(["Secured notes", "Unsecured notes"]);
  // 7.005 of 9.12 is about 76.81% of the track; the largest is the whole track.
  const [secured, unsecured] = widths("[data-bar]");
  expect(secured).toBeCloseTo(76.809, 3);
  expect(unsecured).toBe(100);
  const loan = instrumentRow("Term loan");
  expect(within(loan).queryByText(/yield/)).toBeNull();
  // The market level's stated gap and the yield it leaves: the word, and the module's reason once.
  expect(within(loan).getAllByText("Not supplied")).toHaveLength(2);
  expect(within(loan).getAllByText("No loan observation")).toHaveLength(2);
  expect(within(loan).getByRole("link", { name: "Source for Term loan" })).toHaveAttribute(
    "href",
    "#evidence/5-8",
  );
  expect(within(loan).getByText("Requires More Work")).toBeInTheDocument();
  expect(within(instrumentRow("Secured notes")).getByText("Neutral")).toBeInTheDocument();
  // Every column the module wrote, in its order; the source column is the trace only.
  expect(
    within(screen.getByRole("table", { name: "Instrument decisions" }))
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent),
  ).toEqual([
    "Instrument",
    "Market level (1 Oct 2026)",
    // The heading, then the key naming the two bars of each row by colour.
    "Last-trade price and yieldPriceYield",
    "Rank",
    "Relative value",
    "Recommendation",
    "Source",
  ]);
  expect(screen.queryByText("Filing p.1")).toBeNull();
});

it("compares the two comparable last-trade prices on one scale, as written", () => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  const prices = [...document.querySelectorAll<HTMLElement>("[data-price]")];
  expect(prices.map((price) => price.dataset.price)).toEqual(["$99.00", "$89.00"]);
  expect(within(instrumentRow("Unsecured notes")).getByText("$89.00")).toBeInTheDocument();
  // $89.00 of $99.00 is about 89.90% of the track.
  expect(widths("[data-price]")).toEqual([100, expect.closeTo(89.899, 3) as number]);
  expect(instrumentRow("Term loan").querySelector("[data-price]")).toBeNull();
});

it("draws one card per instrument for a phone: name, rank, bars, recommendation and trace", () => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  const list = screen.getByRole("list", { name: "Instruments" });
  expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  const secured = card("Secured notes");
  expect(within(secured).getByText("First lien")).toBeInTheDocument();
  expect(within(secured).getByText("7.005000%")).toBeInTheDocument();
  expect(within(secured).getByText("$99.00")).toBeInTheDocument();
  expect(within(secured).getByText("Neutral")).toBeInTheDocument();
  expect(within(secured).getByRole("link", { name: "Source for Secured notes" })).toHaveAttribute(
    "href",
    "#evidence/5-6",
  );
  expect(within(card("Term loan")).getAllByText("No loan observation")).toHaveLength(2);
});

it("draws the fundamental value matrix in the shared table style, one trace per row", () => {
  const source = dataset("1 Oct 2026", [basis("2026-10-01")]);
  source.sections.push({
    heading: "T3.6 — Fundamental value matrix",
    line: 20,
    level: 3,
    blocks: [
      {
        type: "table",
        line: 22,
        headers: [
          "Security / Issuer",
          "Fundamental View",
          "Relative-Value View",
          "Structural / Recovery View",
          "Final Matrix Bucket",
          "Rationale",
          "Evidence ID",
          "Source",
        ],
        rows: [
          {
            line: 24,
            cells: [
              "Secured notes",
              "Stable",
              "Fair",
              "First lien",
              "Neutral",
              "Secondary quote only",
              "S1",
              "Filing p.1",
            ],
          },
        ],
      },
    ],
  });
  const view = securityView(source, "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  const matrix = screen.getByRole("region", { name: "Credit and recovery rationale table" });
  expect(within(matrix).getByRole("cell", { name: "Secondary quote only" })).toBeInTheDocument();
  expect(within(matrix).queryByText("S1")).toBeNull();
  expect(within(matrix).queryByText("Filing p.1")).toBeNull();
  expect(within(matrix).getByRole("link", { name: "Source for Secured notes" })).toHaveAttribute(
    "href",
    "#evidence/5-24",
  );
  // Review 4, Q8: below sm the rationale is one card per row, as the instrument table is.
  expect(matrix.parentElement).toHaveClass("hidden", "sm:block");
  const cards = screen.getByRole("list", { name: "Credit and recovery rationale" });
  expect(cards).toHaveClass("sm:hidden");
  const [secured] = within(cards).getAllByRole("listitem");
  if (!secured) throw new Error("missing rationale card");
  expect(within(secured).getByRole("heading", { name: "Secured notes" })).toBeInTheDocument();
  expect(within(secured).getByText("Rationale")).toBeInTheDocument();
  expect(within(secured).getByText("Secondary quote only")).toBeInTheDocument();
  expect(within(secured).queryByText("S1")).toBeNull();
  expect(within(secured).queryByText("Filing p.1")).toBeNull();
  expect(within(secured).getByRole("link", { name: "Source for Secured notes" })).toHaveAttribute(
    "href",
    "#evidence/5-24",
  );
});

it.each([
  ["1 Oct 2026", "2026-09-30", [basis("2026-10-01")]],
  ["1 Oct 2026", "2026-10-02", [basis("2026-10-01"), basis("2026-09-29")]],
  ["31 Feb 2026", "2026-10-02", [basis("2026-02-31")]],
])(
  "keeps the recommendation records and skips incompatible observation bases (%s)",
  (shown, asOf, bases) => {
    const view = securityView(dataset(shown, bases), asOf);
    expect(view?.chartable).toHaveLength(0);
    expect(view?.records).toHaveLength(3);
  },
);

it("keeps an unlocated price in its card without using it in the comparison", () => {
  const source = dataset("1 Oct 2026", [basis("2026-10-01")]);
  const observations = source.sections[0]?.blocks[0];
  const row = observations?.type === "table" ? observations.rows[0] : undefined;
  if (!row) throw new Error("missing fixture observation");
  row.cells[5] = "Not supplied: no locator";
  const view = securityView(source, "2026-10-02");
  expect(view?.chartable.map(({ name }) => name)).toEqual(["Unsecured notes"]);
  expect(view?.records[0]?.market).toContain("$99.00");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  expect(within(instrumentRow("Secured notes")).getByText(/\$99\.00/)).toBeInTheDocument();
  // The unlocated quote's stated yield is shown as written, with no bar; a stated yield is never
  // labelled Not supplied.
  expect(within(instrumentRow("Secured notes")).getByText("7.005000%")).toBeInTheDocument();
  expect(within(instrumentRow("Secured notes")).queryByText("Not supplied")).toBeNull();
  expect(bars()).toEqual([]);
  expect(document.querySelectorAll("[data-price]")).toHaveLength(0);
});

it("says only what it checked about a spread: the summary has no spread column", () => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  expect(screen.getByText("This page could not read a spread.")).toBeVisible();
  expect(screen.queryByRole("columnheader", { name: "Spread" })).toBeNull();
  expect(screen.queryByText(/No spread column/)).toBeNull();
  // Ruling vii: no note on what the method would need.
  expect(screen.queryByText(/A spread needs/)).toBeNull();
  expect(screen.queryByText(/A yield bar is drawn only/)).toBeNull();
});

// docs/rulings/2026-11-16-reporting-currency-from-sources.md: the quotes stay US market quotes.
it.each([
  ["GBPm", "Market levels are US market quotes in US dollars; this run reports in GBPm."],
  ["CHFm", "Market levels are US market quotes in US dollars; this run reports in CHFm."],
])("notes on a %s run that its market levels are US market quotes", (runUnit, text) => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(
    <Securities data={view} href={(line) => `#evidence/5-${String(line)}`} runUnit={runUnit} />,
  );
  expect(screen.getByText(text)).toHaveAttribute("role", "note");
  expect(bars()).toEqual(["Secured notes", "Unsecured notes"]);
});

it.each([["US$m"], [undefined]])("adds no quote note on a run in %s", (runUnit) => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(
    <Securities data={view} href={(line) => `#evidence/5-${String(line)}`} runUnit={runUnit} />,
  );
  expect(screen.queryByText(/US market quotes/)).toBeNull();
  expect(screen.queryAllByRole("note")).toEqual([]);
});

// docs/rulings/2026-11-16-reporting-currency-from-sources.md: CP-3 states its amounts in the run's
// currency; its last trades are still US market quotes in US dollars.
it.each(["GBP millions", "CHF millions", "EUR millions"])(
  "draws the price chart from a market basis whose amounts are in %s",
  (amounts) => {
    const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01", amounts)]), "2026-10-02");
    if (!view) throw new Error("missing security review");
    expect(
      view.chartable.map(({ name, priceText, yieldText }) => [name, priceText, yieldText]),
    ).toEqual([
      ["Secured notes", "$99.00", "7.005000%"],
      ["Unsecured notes", "$89.00", "9.12%"],
    ]);
    render(
      <Securities data={view} href={(line) => `#evidence/5-${String(line)}`} runUnit="GBPm" />,
    );
    expect(bars()).toEqual(["Secured notes", "Unsecured notes"]);
    expect(
      screen.queryByText("No pair of comparable last trades is supplied for this run."),
    ).toBeNull();
  },
);

it("says in the reader's words that no pair of comparable last trades is supplied", () => {
  const view = securityView(
    dataset("1 Oct 2026", [basis("2026-10-01", "GBP thousands")]),
    "2026-10-02",
  );
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  const note = screen.getByText("No pair of comparable last trades is supplied for this run.");
  expect(note).toHaveAttribute("role", "note");
  // The note speaks of the run; only the ruling-iv gap line names the handoff.
  expect(note.textContent).not.toMatch(/handoff/i);
  // The yields stay as written in the table, with no bar.
  expect(within(instrumentRow("Secured notes")).getByText("7.005000%")).toBeInTheDocument();
  expect(bars()).toEqual([]);
});

it.each(["GBP thousands", "£ millions", "GBPm", "gbp millions", "GBP millions and EUR millions"])(
  "withholds the price chart when the amounts are stated as %s",
  (amounts) => {
    const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01", amounts)]), "2026-10-02");
    expect(view?.chartable).toEqual([]);
    expect(view?.records).toHaveLength(3);
  },
);

// Review 4, Q8: the card's columns are the system's two-column key-value list.
it("lists each card's columns as the two-column key-value list", () => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  const list = within(card("Secured notes")).getByText("Rank").closest("dl");
  expect(list).toHaveClass("grid-cols-[fit-content(55%)_minmax(0,1fr)]");
  expect(list).not.toHaveClass("grid-cols-1");
});

// Review 6, V4: a last trade the market level states as missing carries the module's reason.
it("gives a last trade the market level states as missing the module's stated reason", () => {
  const view = securityView(dataset("1 Oct 2026", [basis("2026-10-01")]), "2026-10-02");
  if (!view) throw new Error("missing security review");
  render(<Securities data={view} href={(line) => `#evidence/5-${String(line)}`} />);
  const loan = instrumentRow("Term loan");
  expect(within(loan).queryByText("This page could not read a last trade.")).toBeNull();
  // Once in the market level, once in the last trade.
  expect(within(loan).getAllByText("No loan observation")).toHaveLength(2);
});
