import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { entry, table } from "../overview/rows.fixture";
import { MacroLead } from "./cp2e";
import { bottomLine, leadProps, tableSection } from "./lead.fixture";
import { fixtureEntry, retained } from "./markdown.fixture";

afterEach(cleanup);

/** A retained handoff with its `Events: Hedges` table published as the store publishes it. */
function withHedgeEvents(made: OutputEntry) {
  const events = made.sections.find((section) => section.heading === "Events: Hedges");
  const at = events?.blocks.find((block) => block.type === "table");
  made.output.events = at ? [{ lane: "Hedges", table: at.line, gap: null }] : [];
  return made;
}

// Outdated evidence: two real CP-2E handoffs, TransDigm FY2024 (as of 2024-09-30), one run.
const h3 = () => withHedgeEvents(fixtureEntry("CP-2E", retained("esg", "CP-2E-h3.md")));
const h4 = () => withHedgeEvents(fixtureEntry("CP-2E", retained("esg", "CP-2E-h4.md")));
// The synthetic proof handoff, written to the Deploy VII rate-shock grid.
const proof = () => fixtureEntry("CP-2E", retained("..", "..", "proof", "handoffs", "CP-2E.md"));

it("heads the rate sensitivity with the first stated row as written, every row with its qualifier (h3)", () => {
  render(<MacroLead {...leadProps(h3())} />);
  const tile = screen.getByRole("region", { name: "Rate sensitivity" });
  expect(tile.className).toMatch(/lg:col-span-8/);
  expect(within(tile).getByRole("heading")).toHaveTextContent(/^Rate sensitivity$/);
  // Fewer than three placed steps: a figure in words, never a bar.
  expect(within(tile).queryByRole("img")).toBeNull();
  expect(tile.querySelectorAll("[data-bar]")).toHaveLength(0);
  const steps = within(tile).getByRole("list", { name: "Rate sensitivity" });
  const rows = within(steps).getAllByRole("listitem");
  // Every row of the table, in its order, the first stated one as the headline.
  expect(rows).toHaveLength(5);
  const [head, comparison, issuer, , stress] = rows;
  if (!head || !comparison || !issuer || !stress) throw new Error("rows missing");
  expect(head).toHaveAttribute("data-headline");
  expect(within(head).getByText("+100 bp static annual borrowing-interest shock")).toBeVisible();
  expect(within(head).getByText("+USD 57.89 million")).toHaveClass("text-h3");
  expect(within(head).getByText("annual cash interest")).toBeVisible();
  expect(
    within(head).getByText(
      "Mechanical FCF change −USD 57.89 million before tax and cash-income offsets",
    ),
  ).toBeVisible();
  expect(within(comparison).getByText("Historical FCF comparison")).toBeVisible();
  expect(
    within(issuer).getByText("Approximately +USD 30 million annual interest costs"),
  ).toBeVisible();
  expect(
    within(issuer).getByText(
      "Smaller issuer case retained separately; not substituted for reconstructed borrowing sensitivity",
    ),
  ).toBeVisible();
  // A stated gap is the one gap chip with its reason, its qualifier kept beside it.
  expect(within(stress).getByText("Not calculable")).toHaveClass("border-dashed");
  expect(within(stress).getByText("No supported cash-flow exposure base")).toBeVisible();
  expect(
    within(stress).getByText(
      "No invented conversion of geography, net income or gross cost into cash sensitivity",
    ),
  ).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(
    within(tile).getByRole("cell", { name: "+USD 57.89 million annual cash interest" }),
  ).toBeVisible();
  expect(
    within(tile)
      .getAllByRole("link", { name: /^Source for / })
      .at(-1),
  ).toHaveAttribute("href", expect.stringContaining("#evidence/"));
});

it("heads h4 with its closing-portfolio cell in full and keeps the component's qualifier beside it", () => {
  render(<MacroLead {...leadProps(h4())} />);
  const ladder = screen.getByRole("region", { name: "Rate sensitivity" });
  const rows = within(within(ladder).getByRole("list", { name: "Rate sensitivity" })).getAllByRole(
    "listitem",
  );
  expect(rows).toHaveLength(5);
  const [head, , component] = rows;
  if (!head || !component) throw new Error("rows missing");
  // Review 4, Q2: the first stated row heads the tile; its cell states two amounts, so it is the
  // cell in full, never the component that happens to state one.
  expect(head).toHaveAttribute("data-headline");
  expect(within(head).getByText("+100 bp, closing portfolio")).toBeVisible();
  expect(
    within(head).getByText(
      "USD +57.89 million annual cash-interest outflow; FCF USD -57.89 million before tax/interest-income effects",
    ),
  ).toHaveClass("text-h4");
  expect(
    within(head).getByText(
      "3.08% of FY2024 FCF; static FCF USD 1,822.11 million versus USD 1,880 million",
    ),
  ).toBeVisible();
  expect(component).not.toHaveAttribute("data-headline");
  expect(within(component).getByText("+100 bp, identified receivables component")).toBeVisible();
  expect(within(component).getByText("USD +4.87 million annual interest outflow")).toBeVisible();
  expect(
    within(component).getByText("Included in, not additional to, USD 57.89 million"),
  ).toBeVisible();
  expect(ladder.querySelectorAll("[data-headline]")).toHaveLength(1);
});

it("draws hedged against unhedged floating-rate debt as one bar of the two stated amounts (h3)", () => {
  render(<MacroLead {...leadProps(h3())} />);
  const tile = screen.getByRole("region", { name: "Hedged against unhedged" });
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(
    /Hedged floating-rate debt USD 3,400 million.*Unhedged floating-rate debt USD 5,789 million/,
  );
  expect(within(figure).getByText("USD 3,400 million")).toBeInTheDocument();
  expect(within(figure).getByText("USD 5,789 million")).toBeInTheDocument();
  const hedged = figure.querySelector('[data-segment="hedged"]');
  // 3,400 of 9,189, worked by hand: 37.0008% of the bar.
  expect(parseFloat((hedged as HTMLElement).style.width)).toBeCloseTo(37.0008, 3);
  expect(within(tile).getByRole("heading")).toHaveTextContent(
    /^Hedged and unhedged floating-rate debt$/,
  );
  expect(within(tile).getByText("Gross floating-rate debt: USD 9,189 million")).toBeVisible();
});

it("keeps h4's compound gross cell and unread impact cells as text, never a number", () => {
  render(<MacroLead {...leadProps(h4())} />);
  const hedge = screen.getByRole("region", { name: "Hedged against unhedged" });
  const figure = within(hedge).getByRole("img");
  expect(within(figure).getByText("USD 3,400 million")).toBeInTheDocument();
  expect(within(hedge).queryByText(/9,189/)).toBeNull();
  fireEvent.click(within(hedge).getByRole("button", { name: "Table" }));
  expect(
    within(hedge).getByRole("cell", {
      name: "USD 9,189 million principal; USD 9,128 million carrying",
    }),
  ).toBeVisible();
  // Two amounts in one cell are never placed as a bar.
  const ladder = screen.getByRole("region", { name: "Rate sensitivity" });
  expect(ladder.querySelectorAll("[data-bar]")).toHaveLength(0);
});

it("states the foreign-share gap, lists the hedge terms without sources and the hedge dates", () => {
  render(<MacroLead {...leadProps(h3())} />);
  const share = screen.getByRole("region", { name: "Foreign share" });
  expect(
    within(share).getByText("This page could not read a foreign-currency share."),
  ).toBeVisible();
  // Ruling vii: no note on what a run would need.
  expect(share.textContent).not.toMatch(/supplied at run start/);
  const terms = screen.getByRole("region", { name: "Hedge terms" });
  // The terms sit behind a closed disclosure, in a named scroll region the keyboard can reach.
  const disclosure = terms.querySelector("details");
  expect(disclosure).not.toHaveAttribute("open");
  fireEvent.click(within(terms).getByText("Show the hedge terms"));
  const region = within(terms).getByRole("region", { name: "Hedge terms table" });
  expect(region).toHaveAttribute("tabindex", "0");
  expect(
    within(region).getAllByRole("cell", { name: "Three-month SOFR floor 2.00%; ceiling 3.50%" }),
  ).toHaveLength(2);
  expect(within(terms).queryByText(/tdg-20240930/)).toBeNull();
  // Review 4, Q7: the hedge dates sit in the column beside the rate figure, under the hedged split.
  const column = screen.getByRole("region", { name: "Hedge dates" }).parentElement as HTMLElement;
  expect(column).toHaveClass("lg:col-span-4");
  expect(within(column).getByRole("region", { name: "Hedged against unhedged" })).toBeVisible();
  const dates = screen.getByRole("list", { name: "Hedge dates" });
  const rows = within(dates).getAllByRole("listitem");
  // All five dated rows are drawn: the first three in the lane, the other two behind its disclosure.
  expect(rows).toHaveLength(3);
  expect(rows[0]).toHaveTextContent("2023-03-31");
  const more = screen.getByRole("list", { name: "Hedge dates, the other dated rows" });
  expect(within(more).getAllByRole("listitem")).toHaveLength(2);
});

it("reads the hedge register by id where the canonical title does not match (h4)", () => {
  render(<MacroLead {...leadProps(h4())} />);
  const terms = screen.getByRole("region", { name: "Hedge terms" });
  fireEvent.click(within(terms).getByText("Show the hedge terms"));
  expect(
    within(terms).getByRole("cell", { name: "Three-month Term SOFR cap 1.25%" }),
  ).toBeVisible();
});

it("draws the rate-shock grid first when the handoff carries it, its two steps as stated figures", () => {
  render(<MacroLead {...leadProps(proof())} />);
  const tile = screen.getByRole("region", { name: "Added annual interest" });
  expect(tile.className).toMatch(/lg:col-span-8/);
  // Review 3, P9: two steps are a figure in words, not a two-bar chart.
  expect(within(tile).queryByRole("img")).toBeNull();
  const figure = within(tile).getByRole("list", { name: "Added annual interest by rate shock" });
  const [first, second] = within(figure).getAllByRole("listitem");
  if (!first || !second) throw new Error("rate steps missing");
  expect(within(first).getByText("+100 bp")).toBeVisible();
  expect(within(first).getByText("8.00")).toBeVisible();
  expect(within(first).getByText("5.00")).toBeVisible();
  expect(within(second).getByText("+200 bp")).toBeVisible();
  expect(within(second).getByText("16.00")).toBeVisible();
  expect(within(tile).getByRole("heading")).toHaveTextContent(/^Added annual interest$/);
  // The after-hedges gap is the one gap chip: its word and its reason, never "after Not supplied:".
  expect(within(figure).getByText("Not supplied")).toHaveClass("border-dashed");
  expect(within(figure).getByText("No hedge sensitivity retained")).toBeInTheDocument();
  expect(figure.textContent).not.toMatch(/Not supplied:/);
  expect(screen.queryByRole("region", { name: "Rate sensitivity" })).toBeNull();
  // proof T2F.4 writes "USD 300m" / "USD 500m": read as written, one bar of the two.
  const hedge = screen.getByRole("region", { name: "Hedged against unhedged" });
  const bar = within(hedge).getByRole("img");
  expect(within(bar).getByText("USD 300m")).toBeInTheDocument();
  expect(within(bar).getByText("USD 500m")).toBeInTheDocument();
  // Review 4, Q5: the currency grid has the hedge terms stacked beside it, not a hole.
  const fx = screen.getByRole("region", { name: "Foreign-currency strengthening" });
  expect(fx.className).toMatch(/lg:col-span-8/);
  const beside = fx.nextElementSibling as HTMLElement;
  expect(beside).toHaveClass("lg:col-span-4");
  expect(within(beside).getByRole("region", { name: "Hedge terms" })).toBeVisible();
});

it("gives the module's own FX limitation as the foreign-share gap", () => {
  const made = entry(
    "CP-2E",
    [],
    [
      tableSection(
        "Gaps",
        table(
          10,
          ["Gap", "Severity", "Affected analysis", "Effect", "Remediation", "Source"],
          [
            [
              "G1",
              "High",
              "FX register",
              "Currency split by entity was not disclosed.",
              "Ask",
              "Memo",
            ],
          ],
        ),
      ),
      tableSection(
        "T2F.3 — Hedging register",
        table(
          20,
          [
            "Hedge Type",
            "Notional",
            "Instrument Covered",
            "Rate / Strike",
            "Maturity",
            "Coverage Status",
            "Limitation",
            "Source",
          ],
          [["Swap", "USD 100 million", "Loan", "3%", "2026", "Effective", "None", "Memo"]],
        ),
      ),
    ],
  );
  render(<MacroLead {...leadProps(made)} />);
  const share = screen.getByRole("region", { name: "Foreign share" });
  expect(within(share).getByText("Currency split by entity was not disclosed.")).toBeVisible();
  const ladder = screen.getByRole("region", { name: "Rate sensitivity" });
  expect(
    within(ladder).getByText("This page could not read the cash cost of each rate shock."),
  ).toBeVisible();
});

it("draws nothing for a blocked module", () => {
  const stopped = entry("CP-2E", [], bottomLine("Not assessable: no debt schedule was supplied."));
  const { container } = render(<MacroLead {...leadProps(stopped)} />);
  expect(container).toBeEmptyDOMElement();
});

it("places a bar only for a cash impact that states one amount; a range or a qualified one is listed as written", () => {
  const made = entry(
    "CP-2E",
    [],
    [
      {
        heading: "T2F.5 — Sensitivity register",
        level: 4,
        line: 9,
        blocks: [
          table(
            10,
            ["Sensitivity", "Estimated Cash Impact", "Source"],
            [
              ["+100 bp SOFR", "USD 5 million to USD 8 million a year, before hedges", "S1"],
              ["+150 bp SOFR", "USD 9 million, about USD 7 million after hedges", "S1"],
              ["+175 bp SOFR", "USD 10 million – 12 million a year", "S1"],
              ["+200 bp SOFR", "USD 16 million a year", "S1"],
            ],
          ),
        ],
      },
    ],
  );
  render(<MacroLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Rate sensitivity" });
  // One step states one amount: no ladder, and no row is promoted for parsing.
  expect(within(tile).queryByRole("img")).toBeNull();
  expect(tile.querySelectorAll("[data-bar]")).toHaveLength(0);
  const steps = within(tile).getByRole("list", { name: "Rate sensitivity" });
  const rows = within(steps).getAllByRole("listitem");
  expect(rows.map((item) => item.textContent)).toEqual([
    "+100 bp SOFRUSD 5 million to USD 8 million a year, before hedges",
    "+150 bp SOFRUSD 9 million, about USD 7 million after hedges",
    "+175 bp SOFRUSD 10 million – 12 million a year",
    "+200 bp SOFRUSD 16 million a year",
  ]);
  expect(rows[0]).toHaveAttribute("data-headline");
  // A range heads the tile whole, never its first amount alone in large type.
  expect(
    within(rows[0] as HTMLElement).getByText(
      "USD 5 million to USD 8 million a year, before hedges",
    ),
  ).toHaveClass("text-h4");
});

it("draws three or more stated steps as a ladder on one axis", () => {
  const made = entry(
    "CP-2E",
    [],
    [
      {
        heading: "T2F.5 — Sensitivity register",
        level: 4,
        line: 9,
        blocks: [
          table(
            10,
            ["Sensitivity", "Estimated Cash Impact", "Source"],
            [
              ["+100 bp SOFR", "USD 8 million", "S1"],
              ["+200 bp SOFR", "USD 16 million", "S1"],
              ["+300 bp SOFR", "USD 24 million", "S1"],
            ],
          ),
        ],
      },
    ],
  );
  render(<MacroLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Rate sensitivity" });
  expect(within(tile).getByRole("img")).toHaveAccessibleName(
    "Rate sensitivity: +100 bp SOFR: USD 8 million; +200 bp SOFR: USD 16 million; +300 bp SOFR: USD 24 million.",
  );
  expect(
    [...tile.querySelectorAll("[data-bar]")].map((bar) => bar.getAttribute("data-bar")),
  ).toEqual(["USD 8 million", "USD 16 million", "USD 24 million"]);
});

it("keeps register ids and source names off the page on the real h4 handoff", () => {
  render(<MacroLead {...leadProps(h4())} />);
  const page = document.body.textContent;
  expect(page).not.toMatch(/\bT2F\.\d|tdg-20240930|CP-2E/);
});

it("draws a chart the store withheld or stated as a gap, since the frame draws none", () => {
  const made = h3();
  made.output.chartGaps = [
    { title: "Hedge coverage", table: 99, gap: "no hedge notional by year" },
  ];
  render(<MacroLead {...leadProps(made)} />);
  expect(
    within(screen.getByRole("region", { name: "Hedge coverage" })).getByText(
      "No hedge notional by year",
    ),
  ).toBeVisible();
});

it("heads the tile with the first row that states a result, a stated gap before it kept as its chip", () => {
  const made = entry(
    "CP-2E",
    [],
    [
      {
        heading: "T2F.5 — Sensitivity register",
        level: 4,
        line: 9,
        blocks: [
          table(
            10,
            ["Sensitivity", "Estimated Cash Impact", "FCF / Liquidity Implication", "Source"],
            [
              ["+100 bp SOFR", "Not calculable: no floating base stated", "None", "S1"],
              ["+200 bp SOFR", "Approximately USD 16 million a year", "Before hedges", "S1"],
            ],
          ),
        ],
      },
    ],
  );
  render(<MacroLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Rate sensitivity" });
  const [first, second] = within(
    within(tile).getByRole("list", { name: "Rate sensitivity" }),
  ).getAllByRole("listitem");
  if (!first || !second) throw new Error("rows missing");
  expect(first).toHaveAttribute("data-headline");
  expect(within(first).getByText("Approximately USD 16 million a year")).toHaveClass("text-h4");
  expect(within(first).getByText("Before hedges")).toBeVisible();
  expect(within(second).getByText("Not calculable")).toHaveClass("border-dashed");
  expect(within(second).getByText("No floating base stated")).toBeVisible();
  expect(tile.textContent).not.toMatch(/Not calculable:/);
});

// Review 6: no currency register and no stated FX limitation is no foreign-share tile.
it("draws no foreign-share tile when the module writes no currency register or FX limitation", () => {
  render(<MacroLead {...leadProps(proof())} />);
  expect(screen.queryByRole("region", { name: "Foreign share" })).toBeNull();
  expect(screen.queryByText("This page could not read a foreign-currency share.")).toBeNull();
});
