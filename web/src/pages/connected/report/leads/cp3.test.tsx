import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun } from "../../publishedReport";
import { SecurityLead } from "./cp3";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

function handoff(markdown: string): OutputEntry {
  return {
    output: { module: "CP-3", id: "run/CP-3", label: "CP-3", sha256: "h", href: "CP-3.md" },
    sections: sectionsOf(markdown),
    selected: true,
  };
}

const props = (made: OutputEntry, asOf = "2025-03-31") => ({
  ...leadProps(made),
  run: { folder: "run", asOf } as PublishedRun,
});

const row = (name: string) => {
  const found = screen.getByRole("rowheader", { name }).closest("tr");
  if (!found) throw new Error(`missing row ${name}`);
  return found;
};

// The real run's section chain and Recommendation table, copied from the TransDigm FY2024 reference
// run (outdated evidence, shape only: apps/issuer-library/fixtures/shape-key.json and the review).
const REAL = `## Findings

### Bottom line

Requires more work: the secured paper is fairly priced against the subordinated notes.

### Recommendation

| Security group | Market level at 2024-09-30 (fair value, % of par) | Structural position | Recovery sensitivity | Relative value | Recommendation |
|---|---|---|---|---|---|
| Term loans (Tranches I, J, K, L) | 99.91% | Senior secured, pari passu with secured notes per filing labels | Moderate | Unclear | Requires More Work |
| Secured notes 2028–2033 (six series) | 101.40% to 105.80%; 103.50% aggregate | Senior secured | Moderate | Unclear | Requires More Work |
| 5.50% 2027 subordinated notes | 99.51% | Senior subordinated | High | Unclear | Requires More Work |
| 2029 subordinated notes (two series) | 96.67% and 97.20% | Senior subordinated | High | Unclear | Requires More Work |

### Relative value

The secured notes trade above par while the subordinated notes trade below it.

### Portfolio Fit

No mandate was supplied, so fit cannot be tested.

## Calculations

None.
`;

// The synthetic proof handoff's summary (proof/handoffs/CP-3.md).
const SYNTHETIC = `## Findings

### Bottom line

Neutral on the secured notes.

### Security decision summary

| Instrument | Market level (31 Mar 2025) | Rank | Relative value | Recommendation | Source |
| --- | --- | --- | --- | --- | --- |
| Synthetic secured notes | $93.80; yield 7.0100%, 7.01% rounded | First lien | Fair | Neutral | Filing p.1 |
| Synthetic unsecured notes | $88.10; yield 9.40% | Unsecured | Cheap | Preferred | Filing p.2 |
| Synthetic term loan | Not supplied: no loan observation | First lien | Unclear | Requires More Work | Filing p.3 |

## Calculations

All amounts USD millions unless stated; yields are percentages from last trades on 2025-03-31; differences in yield are percentage points, shown in bp.
`;

it("draws the real run's recommendation table as text: prices, not yields, so no bar", () => {
  render(<SecurityLead {...props(handoff(REAL))} />);
  const tile = screen.getByRole("region", { name: "Instrument decisions" });
  // F3: every column the module wrote, in its order, Recovery sensitivity included.
  expect(
    within(within(tile).getByRole("table"))
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent),
  ).toEqual([
    "Security group",
    "Market level at 2024-09-30 (fair value, % of par)",
    "Structural position",
    "Recovery sensitivity",
    "Relative value",
    "Recommendation",
    "Source",
  ]);
  const secured = row("Secured notes 2028–2033 (six series)");
  expect(within(secured).getByText("101.40% to 105.80%; 103.50% aggregate")).toBeInTheDocument();
  expect(within(secured).getByText("Senior secured")).toBeInTheDocument();
  expect(within(secured).getByText("Moderate")).toBeInTheDocument();
  expect(within(row("5.50% 2027 subordinated notes")).getByText("High")).toBeInTheDocument();
  expect(within(secured).getByText("Requires More Work")).toBeInTheDocument();
  // Stated values are never labelled Not supplied; no column the module did not write is added.
  expect(within(secured).queryByText("Not supplied")).toBeNull();
  expect(within(tile).getByText("This page could not read a spread.")).toBeVisible();
  expect(within(row("Term loans (Tranches I, J, K, L)")).getByText("99.91%")).toBeInTheDocument();
  expect(tile.querySelectorAll("[data-bar]")).toHaveLength(0);
  expect(within(secured).getByRole("link", { name: /Source for Secured notes/ })).toHaveAttribute(
    "href",
    expect.stringContaining("#evidence/"),
  );
  expect(within(tile).queryByRole("note")).toBeNull();
});

it("draws a stated yield-to-worst and spread as written, and no spread gap", () => {
  const stated = REAL.replace(
    "| Recovery sensitivity | Relative value | Recommendation |\n|---|---|---|---|---|---|",
    "| Recovery sensitivity | Yield to worst | Spread | Relative value | Recommendation |\n|---|---|---|---|---|---|---|---|",
  )
    .replace(
      "| Moderate | Unclear | Requires More Work |\n| Secured",
      "| Moderate | 6.4% | 250 bp | Unclear | Requires More Work |\n| Secured",
    )
    .replaceAll("| Moderate | Unclear |", "| Moderate | 6.1% | 220 bp | Unclear |")
    .replaceAll("| High | Unclear |", "| High | 8.2% | 410 bp | Unclear |");
  render(<SecurityLead {...props(handoff(stated))} />);
  const tile = screen.getByRole("region", { name: "Instrument decisions" });
  const loans = row("Term loans (Tranches I, J, K, L)");
  expect(within(loans).getByText("6.4%")).toBeInTheDocument();
  expect(within(loans).getByText("250 bp")).toBeInTheDocument();
  expect(
    within(row("Secured notes 2028–2033 (six series)")).getByText("220 bp"),
  ).toBeInTheDocument();
  expect(within(tile).getByRole("columnheader", { name: "Yield to worst" })).toBeInTheDocument();
  expect(within(tile).getByRole("columnheader", { name: "Spread" })).toBeInTheDocument();
  expect(within(tile).queryByText("Not supplied")).toBeNull();
  expect(within(tile).queryByText(/could not read a spread/)).toBeNull();
  // The card on a phone draws them too.
  const card = within(within(tile).getByRole("list", { name: "Instruments" }))
    .getAllByRole("listitem")
    .find((item) =>
      within(item).queryByRole("heading", { name: "Term loans (Tranches I, J, K, L)" }),
    );
  if (!card) throw new Error("missing card");
  expect(within(card).getByText("6.4%")).toBeInTheDocument();
  expect(within(card).getByText("250 bp")).toBeInTheDocument();
});

it("draws the yield bars where a last-trade yield reads, each against the largest", () => {
  render(<SecurityLead {...props(handoff(SYNTHETIC))} />);
  const secured = row("Synthetic secured notes");
  expect(within(secured).getByText("7.0100%")).toBeInTheDocument();
  expect(within(secured).getByText("Neutral")).toBeInTheDocument();
  expect(within(row("Synthetic unsecured notes")).getByText("Preferred")).toBeInTheDocument();
  const tile = screen.getByRole("region", { name: "Instrument decisions" });
  expect(tile.querySelectorAll("[data-bar]")).toHaveLength(2);
  const loan = row("Synthetic term loan");
  expect(loan.querySelector("[data-bar]")).toBeNull();
  expect(within(loan).getAllByText("No loan observation")).toHaveLength(2);
  expect(within(loan).queryByText(/Not supplied: /)).toBeNull();
  // A source cell is for the trace only.
  expect(within(tile).queryByText("Filing p.1")).toBeNull();
});

it("withholds the bars when the run's date is before the last trades", () => {
  render(<SecurityLead {...props(handoff(SYNTHETIC), "2025-03-30")} />);
  const tile = screen.getByRole("region", { name: "Instrument decisions" });
  expect(tile.querySelectorAll("[data-bar]")).toHaveLength(0);
  expect(within(row("Synthetic secured notes")).getByText("7.0100%")).toBeInTheDocument();
  expect(
    within(tile).getByText("No pair of comparable last trades is supplied for this run."),
  ).toBeInTheDocument();
});

it("draws the peer gap and not the relative value or portfolio fit passages", () => {
  render(<SecurityLead {...props(handoff(REAL))} />);
  // The module page frame draws those sections; the lead does not repeat them.
  expect(document.body.textContent).not.toMatch(/trade above par while the subordinated/);
  expect(document.body.textContent).not.toMatch(/No mandate was supplied/);
  expect(screen.queryByRole("region", { name: "Relative value" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Portfolio fit" })).toBeNull();
  const peers = screen.getByRole("region", { name: "Relative value against peers" });
  // F1: the page says only what it checked.
  expect(within(peers).getByText("This page could not read peer levels.")).toBeVisible();
  expect(peers.textContent).not.toMatch(/has no peer levels/);
  expect(peers.textContent).not.toMatch(/supplied at run start/);
});

it("states each gap when the module wrote neither table nor passage", () => {
  render(<SecurityLead {...props(handoff("## Findings\n\n### Bottom line\n\nNeutral.\n"))} />);
  const tile = screen.getByRole("region", { name: "Instrument decisions" });
  // Review 4, Q8: the gap names the thing in the reader's words.
  expect(
    within(tile).getByText("This page could not read the instrument decisions."),
  ).toBeVisible();
  expect(document.body.textContent).not.toMatch(/passage|register|table\./);
  expect(document.body.textContent).not.toMatch(/The module wrote no/);
});

it("draws nothing for a blocked module", () => {
  const { container } = render(
    <SecurityLead
      {...props(
        handoff(
          "## Findings\n\n### Bottom line\n\nNot assessable: no market quotes were supplied. More.\n",
        ),
      )}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("gives the lone peer gap the full row", () => {
  render(<SecurityLead {...props(handoff(REAL))} />);
  const peers = screen.getByRole("region", { name: "Relative value against peers" });
  expect(peers).toHaveClass("lg:col-span-12");
});

// Review 6, V4: a last trade the market level states as missing carries the module's reason.
it("gives a last-trade gap the market level's stated reason, never a bare chip", () => {
  render(<SecurityLead {...props(handoff(SYNTHETIC))} />);
  const loan = row("Synthetic term loan");
  expect(within(loan).queryByText("This page could not read a last trade.")).toBeNull();
  // The market level's reason, and the last trade's.
  expect(within(loan).getAllByText("No loan observation")).toHaveLength(2);
});

// Verbatim excerpt of the replayed TDG handoff: the matrix heading has no em dash, there is no
// decision summary or Recommendation table, and the peer levels sit under their own heading.
const REPLAY = `## Findings

### Bottom line

Requires more work.

### T3.6 Fundamental value matrix

All note amounts are carrying values; loan principal is a separately labelled identity check, never substituted for allocated carrying debt. All securities have Requires More Work selection status. Secured and subordinated classes are not pooled for spread comparison.

| Security / Issuer | Fundamental View | Relative-Value View | Structural / Recovery View | Final Matrix Bucket | Rationale | Evidence ID | Source |
|---|---|---|---|---|---|---|---|
| TransDigm Inc. Tranche I, USD, 2028-08-24 | Cash generation supportive; leverage/policy constrain | Unclear; quote not supplied | Senior secured; recovery unquantified | Requires More Work | Principal USD 1,871 million; SOFR +275 bp; do not infer missing price from J | F1–F7 | Financial foundation (CP-1); TDG_2024-09-30_10-K_0001260221-24-000083_tdg-20240930.htm.jsonl, page 59 |
| Revolver; securitization; finance leases; government advances | Relevant funding and competing claims, not quoted investment candidates | Unclear; investment market values not supplied | Separate receivables collateral; other relative priorities incomplete | No trade ranking | Facilities and asset-specific claims cannot be assumed freely purchasable; claim amounts remain in recovery table | F5–F7 | Financial foundation (CP-1); Legal & covenants (CP-4) |

### Descriptive peer and benchmark evidence

The comparisons retain the source's three-year discount-margin basis, not contractual margin or yield to worst. No loan-level average is calculated, and index observations are not individual peers.
Basis: TDG market quotes 2024-09-30.md, page 1

| Comparator and exact row identity | Terms and metric | Observation basis | J minus comparator | Interpretation and limitation | Source |
|---|---|---|---|---|---|
| StandardAero B1 / BL4793859 | 1L senior secured; Ba3/BB-; maturity 2031-10-31; YTM 5.6%; 3Y DM 193 bp | Assigned 2024-09-30; size USD 1,630 million | +54 bp | Closest indicated ratings; guarantee, covenants, reset/call basis and currency denomination not independently established | TDG market quotes 2024-09-30.md, page 1 |
| Sector Ratings Average | Not supplied: no such block in the transcription | No observation | Not calculable: aggregate absent | No substitute aggregate or additional peer count invented | TDG market quotes 2024-09-30.md, page 1 |
`;

it("draws the matrix whatever its heading's dash and the peer levels the module wrote", () => {
  render(<SecurityLead {...props(handoff(REPLAY))} />);
  expect(document.body.textContent).not.toMatch(/could not read the instrument decisions/);
  expect(document.body.textContent).not.toMatch(/could not read peer levels/);
  const matrix = screen.getByRole("region", { name: "Credit and recovery rationale" });
  expect(within(matrix).getAllByText("Requires More Work").length).toBeGreaterThan(0);
  expect(within(matrix).getAllByText("No trade ranking").length).toBeGreaterThan(0);
  const peers = screen.getByRole("region", { name: "Relative value against peers" });
  expect(within(peers).getAllByText("+54 bp").length).toBeGreaterThan(0);
  expect(within(peers).getAllByText(/3Y DM 193 bp/).length).toBeGreaterThan(0);
  expect(within(peers).getAllByText("Aggregate absent").length).toBeGreaterThan(0);
  expect(within(peers).getAllByText(/No loan-level average is calculated/).length).toBeGreaterThan(
    0,
  );
  expect(peers.textContent).not.toMatch(/TDG market quotes|\.md/);
});
