import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun } from "../../publishedReport";
import { entry, table } from "../overview/rows.fixture";
import { LiquidityLead } from "./cp2d";
import { bottomLine, EVENT_HEADERS, leadProps, tableSection } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(cleanup);

const STEPS = ["Step", "Amount", "Reporting unit", "Basis and limitation"];

// The synthetic proof handoff's bridge (proof/handoffs/CP-2D.md); no real CP-2D handoff is retained.
function liquidity(rows: string[][], extra: OutputEntry["sections"] = []) {
  const made = entry(
    "CP-2D",
    [
      {
        title: "Liquidity bridge",
        table: 22,
        unit: "US$m",
        columns: [1],
        kind: "waterfall",
        amount: 1,
      },
    ],
    [tableSection("Chart data: liquidity bridge", table(22, STEPS, rows)), ...extra],
  );
  made.output.events = [{ lane: "Financing", table: 31, gap: null }];
  return made;
}

const BRIDGE = [
  ["Opening accessible liquidity", "900", "US$m", "Synthetic."],
  ["Free cash flow", "120", "US$m", "Synthetic."],
  ["Debt repayment", "-450", "US$m", "Synthetic."],
  ["Closing accessible liquidity", "570", "US$m", "Synthetic."],
];

const EVENTS = tableSection(
  "Events: Financing",
  table(31, EVENT_HEADERS, [
    [
      "2026",
      "year",
      "2024-11-07",
      "Synthetic maturity",
      "Scheduled — maturity",
      "Filing p.2",
      "Wall",
    ],
    [
      "2025-03-31",
      "day",
      "2024-11-07",
      "Synthetic note",
      "Scheduled — matures",
      "Filing p.1",
      "Wall",
    ],
  ]),
);

it("draws the bridge from opening to closing with each step as written, and its table", () => {
  render(<LiquidityLead {...leadProps(liquidity(BRIDGE, [EVENTS]))} />);
  const tile = screen.getByRole("region", { name: "Liquidity bridge" });
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(/900.*570/);
  // F14: each figure as the module wrote it; no "+" it did not write.
  for (const text of ["900", "120", "-450", "570"])
    expect(within(figure).getByText(text)).toBeInTheDocument();
  expect(within(figure).queryByText("+120")).toBeNull();
  expect(within(tile).getByText("US$m")).toBeVisible();
  for (const word of ["Opening and closing", "Adds", "Uses"])
    expect(within(tile).getByText(word)).toBeVisible();
  expect(within(tile).getByRole("heading")).toHaveTextContent(/^Liquidity bridge$/);
  // One basis on every row: one note under the figure, detached from no row.
  expect(within(tile).getByText("Synthetic.")).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "-450" })).toBeVisible();
  const head = within(tile)
    .getAllByRole("columnheader")
    .map((item) => item.textContent);
  expect(head.slice(0, 4)).toEqual(["Step", "Amount", "Reporting unit", "Basis and limitation"]);
  expect(
    within(tile)
      .getAllByRole("link", { name: /Source for/ })
      .at(-1),
  ).toHaveAttribute("href", expect.stringContaining("#evidence/"));
});

it("lists the funding dates earliest first and claims no runway the handoff does not state", () => {
  render(<LiquidityLead {...leadProps(liquidity(BRIDGE, [EVENTS]))} />);
  const dates = screen.getByRole("list", { name: "Funding dates" });
  expect(
    within(dates)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual([expect.stringContaining("2025-03-31"), expect.stringContaining("2026")]);
  expect(dates.closest("section, div[class*='col-span']")?.parentElement).toHaveClass(
    "lg:col-span-4",
    "self-start",
  );
  // F1: the page reads no runway, so it says nothing about one; and no methodology note.
  expect(screen.queryByRole("region", { name: "Runway" })).toBeNull();
  expect(document.body.textContent).not.toMatch(/runway|methodology|Needs/i);
});

it("says why when the module wrote no bridge, and draws nothing for a blocked module", () => {
  const none = entry("CP-2D", [], []);
  render(<LiquidityLead {...leadProps(none)} />);
  expect(
    within(screen.getByRole("region", { name: "Liquidity bridge" })).getByText(
      "This page could not read the liquidity bridge.",
    ),
  ).toBeVisible();
  cleanup();
  const stopped = entry(
    "CP-2D",
    [],
    bottomLine("Not assessable: no cash flow statement was supplied."),
  );
  const { container } = render(<LiquidityLead {...leadProps(stopped)} />);
  expect(container).toBeEmptyDOMElement();
});

it("draws no source reference or module code in a bridge step's label or a gap's reason", () => {
  const named = BRIDGE.map((row) => [...row]);
  (named[1] as string[])[0] = "Free cash flow (CP-2G)";
  (named[2] as string[])[0] = "Repayment per indenture.pdf p. 7";
  render(<LiquidityLead {...leadProps(liquidity(named))} />);
  const tile = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(within(tile).getByRole("img")).toHaveAccessibleName(/Repayment -450/);
  expect(tile.textContent).not.toMatch(/indenture|CP-2G/);
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(tile.textContent).not.toMatch(/indenture|CP-2G/);
  cleanup();
  const gap = BRIDGE.map((row) => [...row]);
  (gap[1] as string[])[1] = "Not supplied: see cash_flow.xlsx tab 2";
  render(<LiquidityLead {...leadProps(liquidity(gap))} />);
  const again = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(again.textContent).not.toMatch(/cash_flow\.xlsx/);
});

it("keeps every step's figure in its own column, on screen whatever the bar's length", () => {
  const full = [
    ["Opening accessible liquidity", "1,000", "US$m", "Synthetic."],
    ["Debt repayment", "-400", "US$m", "Synthetic."],
    ["Closing accessible liquidity", "600", "US$m", "Synthetic."],
  ];
  render(<LiquidityLead {...leadProps(liquidity(full))} />);
  const figure = within(screen.getByRole("region", { name: "Liquidity bridge" })).getByRole("img");
  expect([...figure.querySelectorAll("[data-figure]")].map((label) => label.textContent)).toEqual([
    "1,000",
    "-400",
    "600",
  ]);
});

const PROOF = path.resolve(import.meta.dirname, "../../../../../../proof/handoffs/CP-2D.md");

/** proof/handoffs/CP-2D.md as written, with one bridge cell changed; the store then withholds the chart. */
function withheld(row: number, amount: string) {
  const text = readFileSync(PROOF, "utf8").split("\n");
  const at = text.findIndex((line) => line.startsWith("| Opening accessible liquidity |")) + row;
  const cells = (text[at] ?? "").split("|");
  cells[2] = ` ${amount} `;
  text[at] = cells.join("|");
  const made = entry("CP-2D", [], sectionsOf(text.join("\n")));
  made.output.events = [{ lane: "Financing", table: 31, gap: null }];
  return made;
}

it("reads a bridge the store withheld from the handoff and says why it is not drawn", () => {
  render(<LiquidityLead {...leadProps(withheld(3, "600"))} />);
  const tile = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(within(tile).queryByRole("img")).toBeNull();
  expect(within(tile).getByText(/does not reconcile/)).toBeVisible();
  expect(tile.textContent).not.toMatch(/could not read a liquidity bridge/);
  expect(within(tile).getByRole("link", { name: "Source for Liquidity bridge" })).toHaveAttribute(
    "href",
    expect.stringContaining("#evidence/"),
  );
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "600" })).toBeVisible();
  cleanup();
  render(<LiquidityLead {...leadProps(withheld(1, "Not supplied: cash flow not stated"))} />);
  const gap = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(
    within(gap).getByText("Free cash flow is not supplied: cash flow not stated"),
  ).toBeVisible();
  expect(within(gap).queryByText("0")).toBeNull();
});

it("says only that it could not draw a withheld table whose own check passes", () => {
  // The handoff's bridge reconciles, yet no descriptor was published: the page says what it knows.
  render(<LiquidityLead {...leadProps(withheld(0, "900"))} />);
  const tile = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(within(tile).getByText("This page could not draw this table.")).toBeVisible();
  expect(within(tile).queryByRole("img")).toBeNull();
});

it("keeps each row's own basis in the table view, and lists no detached basis under the figure", () => {
  const mixed = BRIDGE.map((row) => [...row]);
  (mixed[1] as string[])[3] = "Moody's-adjusted.";
  render(<LiquidityLead {...leadProps(liquidity(mixed))} />);
  const tile = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(within(tile).queryByText("Moody's-adjusted.")).toBeNull();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  const row = within(tile).getByRole("row", { name: /^Free cash flow/ });
  expect(
    within(row)
      .getAllByRole("cell")
      .map((item) => item.textContent),
  ).toEqual(["120", "US$m", "Moody's-adjusted.", expect.any(String)]);
  expect(within(tile).getByRole("row", { name: /^Debt repayment/ })).toHaveTextContent(
    "Synthetic.",
  );
});

it("states a stated gap or a withheld table of another chart the module publishes", () => {
  const made = liquidity(BRIDGE, [EVENTS]);
  made.output.chartGaps = [
    { title: "Cash runway", table: 99, gap: "no monthly cash flow supplied" },
  ];
  render(<LiquidityLead {...leadProps(made)} />);
  const runway = screen.getByRole("region", { name: "Cash runway" });
  expect(within(runway).getByText("No monthly cash flow supplied")).toBeVisible();
  // Review 4, Q5: the dates and a short gap tile stack in the column beside the bridge.
  const bridge = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(bridge.className).toMatch(/lg:col-span-8/);
  const column = bridge.nextElementSibling as HTMLElement;
  expect(column).toHaveClass("lg:col-span-4", "flex-col");
  expect([...column.children].map((item) => item.getAttribute("aria-label"))).toEqual([
    "Funding dates",
    "Cash runway",
  ]);
});

it("makes a bridge that is only a gap one full row, and the dates the next", () => {
  render(<LiquidityLead {...leadProps(entry("CP-2D", [], []))} />);
  expect(screen.getByRole("region", { name: "Liquidity bridge" }).className).toMatch(
    /lg:col-span-12/,
  );
  expect(screen.getByRole("region", { name: "Funding dates" }).className).toMatch(/lg:col-span-12/);
});

it("draws a dated lane of three rows on an axis with the run's as-of date", () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ target, contentRect: { width: 1100 } } as unknown as ResizeObserverEntry],
          this,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
  const row = (date: string) => [
    date,
    "day",
    "2024-11-07",
    "Synthetic",
    "Scheduled",
    "p.1",
    "Wall",
  ];
  const made = liquidity(BRIDGE, [
    tableSection(
      "Events: Financing",
      table(31, EVENT_HEADERS, [row("2025-03-31"), row("2025-09-30"), row("2026-03-31")]),
    ),
  ]);
  const props = {
    ...leadProps(made),
    run: { folder: "run", asOf: "2025-06-30" } as PublishedRun,
  };
  const { container } = render(<LiquidityLead {...props} />);
  expect(container.querySelector("[data-as-of-rule='2025-06-30']")).not.toBeNull();
  vi.unstubAllGlobals();
});

// Review 6, V3: a chart or a lane the module wrote as prose only is the frame's to draw, in its words.
it("draws nothing for a bridge or a lane the module wrote as prose with no table", () => {
  const made = entry(
    "CP-2D",
    [],
    sectionsOf(`## Findings

### Chart data: Liquidity bridge

The module could not chart this: no cash flow statement is supplied.

### Events: Financing

No dated financing event is stated for this run.
`),
  );
  render(<LiquidityLead {...leadProps(made)} />);
  expect(screen.queryByRole("region", { name: "Liquidity bridge" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Funding dates" })).toBeNull();
  expect(screen.queryByText(/This page could not read/)).toBeNull();
});
