import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry } from "../../publishedReport";
import { MarketLead } from "./cp3d";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

function handoff(markdown: string, output: Record<string, unknown> = {}): OutputEntry {
  return {
    output: {
      module: "CP-3D",
      id: "run/CP-3D",
      label: "CP-3D",
      sha256: "h",
      href: "CP-3D.md",
      ...output,
    },
    sections: sectionsOf(markdown),
    selected: true,
  };
}

function lineOf(markdown: string, heading: string) {
  const section = sectionsOf(markdown).find((item) => item.heading === heading);
  const block = section?.blocks.find((item) => item.type === "table");
  if (!block) throw new Error(`no table under ${heading}`);
  return block.line;
}

// No CP-3D handoff exists, real or synthetic: built from the launcher's owner table
// (src/deploy_workflow/owners/cpos_launch_tables.py, `Chart data: yield against maturity`) and the
// CP-3D method's T3E.5 header (docs/reuse/selected-methods/skills/CP-3D). Synthetic values.
const MARKET = `## Findings

### Bottom line

Synthetic: the market prices the subordinated notes wider than the secured notes.

### Chart data: yield against maturity

| Instrument | Maturity date | Yield | Spread | Quote date | Source class | Reporting unit | Basis and limitation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Synthetic secured notes 2028 | 2028-08-15 | 6.12 | 185 bp | 2025-03-31 | Last trade | % | Yield to maturity from last trades. |
| Synthetic subordinated notes 2027 | 2027-11-15 | 6.80 | Not supplied: no benchmark stated | 2025-03-28 | Last trade | % | Yield to maturity from last trades. |
| Synthetic term loan 2030 | 2030-03-22 | Not supplied: no loan quote in the files | Not supplied: no loan quote | 2025-03-31 | Evaluated price | % | Yield to maturity from last trades. |
| Synthetic senior notes 2031 | 2031-06-30 | 7.40 | 260 bp | 2025-03-31 | Last trade | % | Yield to maturity from last trades. |

### T3E.5 — Implied risk calculations

| security_id | model | horizon | recovery | discount/benchmark | implied default/loss/break-even | formula ID | limitation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Synthetic subordinated notes 2027 | Credit triangle | 3 years | 40% | Treasury curve | 4.2% a year break-even default | F-7 | A model-dependent break-even, not a probability |
`;

function market() {
  return handoff(MARKET, {
    charts: [
      {
        title: "Yield against maturity",
        table: lineOf(MARKET, "Chart data: yield against maturity"),
        kind: "scatter",
        label: 0,
        date: 1,
        yield: 2,
        spread: 3,
        quoted: 4,
        source: 5,
        unit: "%",
        columns: [2],
      },
    ],
  });
}

/** The placed points, by instrument, with their positions as percent of the plot. */
const points = (figure: HTMLElement) =>
  [...figure.querySelectorAll<HTMLElement>("[data-point]")].map((point) => ({
    name: point.dataset.point,
    left: Number.parseFloat(point.style.left),
    bottom: Number.parseFloat(point.style.bottom),
  }));

it("draws each quoted instrument as a point on a true maturity-date axis, labelled as written", () => {
  render(<MarketLead {...leadProps(market())} />);
  const tile = screen.getByRole("region", { name: "Yield against maturity" });
  // Ruling (a): the title is the subject.
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(
    /^Yield against maturity$/,
  );
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(
    "Yield against maturity date, in %. Synthetic subordinated notes 2027 matures 2027-11-15 at 6.80%. Synthetic secured notes 2028 matures 2028-08-15 at 6.12%. Synthetic senior notes 2031 matures 2031-06-30 at 7.40%.",
  );
  const placed = points(figure);
  expect(placed.map((point) => point.name)).toEqual([
    "Synthetic subordinated notes 2027",
    "Synthetic secured notes 2028",
    "Synthetic senior notes 2031",
  ]);
  const [early, middle, late] = placed;
  // Later maturities sit further right; the 2028 and 2031 points are 2.9 years apart, the 2027 and
  // 2028 points 0.75 years, so the second gap is the wider one.
  expect(early?.left).toBeLessThan(middle?.left ?? 0);
  expect((late?.left ?? 0) - (middle?.left ?? 0)).toBeGreaterThan(
    2 * ((middle?.left ?? 0) - (early?.left ?? 0)),
  );
  // Higher yields sit higher: 7.40 above 6.80 above 6.12.
  expect(late?.bottom).toBeGreaterThan(early?.bottom ?? 0);
  expect(early?.bottom).toBeGreaterThan(middle?.bottom ?? 0);
  const key = within(tile).getByRole("list", { name: "Instruments by maturity" });
  expect(
    within(key)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual([
    "1Synthetic subordinated notes 20272027-11-156.80%",
    "2Synthetic secured notes 20282028-08-156.12%",
    "3Synthetic senior notes 20312031-06-307.40%",
  ]);
  expect(within(key).queryByText(/term loan/)).toBeNull();
  expect(within(figure).getByText("2028")).toBeInTheDocument();
  expect(within(figure).getByText("0")).toBeInTheDocument();
  expect(within(figure).queryByText(/term loan/)).toBeNull();
  // G13: every label is page text in CSS pixels, never SVG text a viewBox rescales.
  expect(tile.querySelector("svg text")).toBeNull();
  expect(figure.querySelector("path, polyline")).toBeNull();
});

it("lists two quoted instruments as figures, with no date axis under three points", () => {
  const two = market();
  two.sections = sectionsOf(MARKET.replace(/\| Synthetic senior notes 2031 .*\n/, ""));
  render(<MarketLead {...leadProps(two)} />);
  const tile = screen.getByRole("region", { name: "Yield against maturity" });
  expect(tile.querySelectorAll("[data-point]")).toHaveLength(0);
  expect(within(tile).queryByRole("img")).toBeNull();
  const list = within(tile).getByRole("list", { name: "Instruments by maturity" });
  expect(
    within(list)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual([
    "1Synthetic subordinated notes 20272027-11-156.80%",
    "2Synthetic secured notes 20282028-08-156.12%",
  ]);
  expect(within(tile).queryByText("2028")).toBeNull();
});

it("lists an unquoted instrument with its reason and draws the issuer curve gap in its place", () => {
  render(<MarketLead {...leadProps(market())} />);
  const tile = screen.getByRole("region", { name: "Yield against maturity" });
  const unplaced = within(tile).getByRole("list", { name: "Instruments not placed" });
  const [loan] = within(unplaced).getAllByRole("listitem");
  if (!loan) throw new Error("one unplaced row");
  expect(within(loan).getByText("Synthetic term loan 2030")).toBeVisible();
  expect(within(loan).getByText("Not supplied")).toBeVisible();
  expect(within(loan).getByText("No loan quote in the files")).toBeVisible();
  // G7: no raw "X: Not supplied: reason".
  expect(tile.textContent).not.toMatch(/: Not supplied: /);
  expect(within(tile).getByText("This page could not read the issuer curve.")).toBeVisible();
  // Ruling vii: no method notes on the reader's page.
  expect(tile.textContent).not.toMatch(/No curve is drawn|methodology/);
});

it("gives spread and quote date in the table view, as written", () => {
  render(<MarketLead {...leadProps(market())} />);
  const tile = screen.getByRole("region", { name: "Yield against maturity" });
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "185 bp" })).toBeVisible();
  expect(within(tile).getByRole("cell", { name: "2025-03-28" })).toBeVisible();
  expect(
    within(tile).getByRole("cell", { name: "Not supplied: no loan quote in the files" }),
  ).toBeVisible();
  // F15: the per-row unit and basis stay with their rows.
  expect(
    within(tile).getAllByRole("cell", { name: "Yield to maturity from last trades." }),
  ).toHaveLength(4);
  expect(within(tile).getByRole("columnheader", { name: "Reporting unit" })).toBeVisible();
  expect(
    within(tile)
      .getAllByRole("link", { name: /Source for/ })
      .at(-1),
  ).toHaveAttribute("href", expect.stringContaining("#evidence/"));
});

it("draws the market-implied default as written with its model and horizon", () => {
  render(<MarketLead {...leadProps(market())} />);
  const tile = screen.getByRole("region", { name: "Market-implied default" });
  expect(within(tile).getByText("Synthetic subordinated notes 2027")).toBeVisible();
  expect(within(tile).getByText("Credit triangle")).toBeVisible();
  expect(within(tile).getByText("3 years")).toBeVisible();
  expect(within(tile).getByText("4.2% a year break-even default")).toBeVisible();
  expect(within(tile).queryByText("F-7")).toBeNull();
});

it("states the gaps when the module wrote neither table, and draws nothing when blocked", () => {
  render(<MarketLead {...leadProps(handoff("## Findings\n\n### Bottom line\n\nThin.\n"))} />);
  const figure = screen.getByRole("region", { name: "Yield against maturity" });
  expect(
    within(figure).getByText("This page could not read the yields by maturity."),
  ).toBeVisible();
  const implied = screen.getByRole("region", { name: "Market-implied default" });
  expect(
    within(implied).getByText("This page could not read the market-implied default."),
  ).toBeVisible();
  expect(document.body.textContent).not.toMatch(/supplied at run start/);
  cleanup();
  const { container } = render(
    <MarketLead
      {...leadProps(
        handoff(
          "## Findings\n\n### Bottom line\n\nNot assessable: no market quotes were supplied.\n",
        ),
      )}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("labels the earliest and latest maturity dates when the points fall within one year", () => {
  const near = MARKET.replace("| 2028-08-15 |", "| 2027-06-01 |")
    .replace("| 2027-11-15 |", "| 2027-08-01 |")
    .replace("| 2031-06-30 |", "| 2027-07-01 |");
  const made = market();
  made.sections = sectionsOf(near);
  render(<MarketLead {...leadProps(made)} />);
  const figure = within(screen.getByRole("region", { name: "Yield against maturity" })).getByRole(
    "img",
  );
  expect(within(figure).getByText("2027-06-01")).toBeInTheDocument();
  expect(within(figure).getByText("2027-08-01")).toBeInTheDocument();
  expect(within(figure).queryByText("2027")).toBeNull();
});

it("places no point when the yields are in more than one unit, and says so", () => {
  const mixed = MARKET.replace(
    "| 6.80 | Not supplied: no benchmark stated | 2025-03-28 | Last trade | % |",
    "| 680 | Not supplied: no benchmark stated | 2025-03-28 | Last trade | bp |",
  );
  const made = market();
  made.sections = sectionsOf(mixed);
  render(<MarketLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Yield against maturity" });
  expect(tile.querySelectorAll("[data-point]")).toHaveLength(0);
  expect(within(tile).getByText("The yields are stated in more than one unit.")).toBeVisible();
  expect(within(tile).queryByText(/could not read the issuer curve/)).toBeNull();
  expect(within(tile).queryByText(/^Yield in/)).toBeNull();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "680" })).toBeVisible();
  expect(within(tile).getByRole("cell", { name: "6.12" })).toBeVisible();
});

it("gives a yield below zero its own reason, and draws no source reference in a reason line", () => {
  const made = market();
  made.sections = sectionsOf(
    MARKET.replace("| 6.80 |", "| -0.2 |").replace(
      "Not supplied: no loan quote in the files",
      "Not supplied: see loan_tape.xlsx row 4",
    ),
  );
  render(<MarketLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Yield against maturity" });
  const unplaced = within(tile).getByRole("list", { name: "Instruments not placed" });
  expect(within(unplaced).getByText("Synthetic subordinated notes 2027")).toBeVisible();
  expect(within(unplaced).getByText("Stated yield below zero; not placed.")).toBeVisible();
  expect(tile.textContent).not.toMatch(/loan_tape/);
});

it("names an implied-risk row without a security by its place", () => {
  const made = market();
  made.sections = sectionsOf(
    MARKET.replace(
      "| Synthetic subordinated notes 2027 | Credit triangle |",
      "|  | Credit triangle |",
    ),
  );
  render(<MarketLead {...leadProps(made)} />);
  const tile = screen.getByRole("region", { name: "Market-implied default" });
  expect(within(tile).getByText("Row 1")).toBeVisible();
  expect(within(tile).getByRole("link", { name: "Source for Row 1" })).toBeVisible();
});

// Review 4, Q6 and Q5: a long key above its value; the lone shorter tile takes the full row.
it("puts the implied default's long keys above their values, in a full row under the yields", () => {
  render(<MarketLead {...leadProps(market())} />);
  const tile = screen.getByRole("region", { name: "Market-implied default" });
  const key = within(tile).getByText("implied default/loss/break-even");
  expect(key.closest("dl")).toHaveClass("grid-cols-1");
  expect(tile).toHaveClass("lg:col-span-12");
  expect(screen.getByRole("region", { name: "Yield against maturity" })).toHaveClass(
    "lg:col-span-12",
  );
  // Rows side by side in the full row, each with its trace.
  expect(within(tile).getByRole("list", { name: "Market-implied default" })).toHaveClass(
    "sm:grid-cols-2",
  );
});
