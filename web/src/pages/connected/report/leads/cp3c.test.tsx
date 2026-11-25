import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun } from "../../publishedReport";
import { RefinancingLead } from "./cp3c";
import { leadProps } from "./lead.fixture";
import { sectionsOf } from "./markdown.fixture";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** A handoff as the store publishes it: its owner tables' descriptors point at their table lines. */
function handoff(markdown: string, output: Partial<OutputEntry["output"]> = {}): OutputEntry {
  return {
    output: {
      module: "CP-3C",
      id: "run/CP-3C",
      label: "CP-3C",
      sha256: "h",
      href: "CP-3C.md",
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

// The synthetic proof handoff (proof/handoffs/CP-3C.md), rows copied; no real CP-3C has run.
const NEED = `### Chart data: refinancing need

| Period | Debt maturing | Committed resources | Reporting unit | Basis and limitation |
| --- | --- | --- | --- | --- |
| FY2026 | 500 | 300 | US$m | Synthetic. |
| FY2027 | 1,250 | Not supplied: no commitment is stated | US$m | Synthetic. |
`;

const EVENTS = `### Events: Refinancing

| Event date | Date precision | Published | Event | Status | Source | Credit relevance |
| --- | --- | --- | --- | --- | --- | --- |
| 2025-03-31 | day | 2024-11-07 | Synthetic note | Scheduled — matures | Filing p.1 | Wall |
| 2026 | year | 2024-11-07 | Synthetic maturity | Scheduled — maturity | Filing p.2 | Wall |
`;

// Built from the CP-3C method's T3D.6 header (docs/reuse/selected-methods/skills/CP-3C).
const PATHS = `### T3D.6 — Liability-management paths

| Path Type | Feasibility | Likelihood Direction | Evidence Supporting | Evidence Against | Legal Capacity Required | Creditor Impact | Source Trace |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Amend and extend | Feasible with consent | Rising | Lenders engaged | None | Majority lenders | Neutral | Filing p.4 |
| Drop-down financing | Insufficient Information | Unclear | None | Documents absent | Unrestricted subsidiary capacity | Priming risk | Filing p.5 |
`;

const MARKDOWN = `## Findings\n\n### Bottom line\n\nThe synthetic issuer shows one observed item.\n\n${NEED}\n${EVENTS}\n${PATHS}`;

function made(markdown = MARKDOWN) {
  return handoff(markdown, {
    charts: [
      {
        title: "Refinancing need",
        table: lineOf(markdown, "Chart data: refinancing need"),
        unit: "US$m",
        columns: [1, 2],
      },
    ],
    events: [{ lane: "Refinancing", table: lineOf(markdown, "Events: Refinancing"), gap: null }],
  });
}

/** The year slots of the need figure, each with its label and its bars' heights. */
function slots(figure: HTMLElement) {
  return [...figure.querySelectorAll<HTMLElement>("[data-slot]")].map((slot) => [
    slot.dataset.slot,
    [...slot.querySelectorAll<HTMLElement>("[data-bar]")].map((bar) => [
      bar.dataset.bar,
      bar.style.height,
    ]),
  ]);
}

it("draws debt maturing and committed resources as two marks per year, as written, on one scale", () => {
  render(<RefinancingLead {...leadProps(made())} />);
  const tile = screen.getByRole("region", { name: "Refinancing need" });
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(/^Refinancing need$/);
  const figure = within(tile).getByRole("img");
  expect(figure).toHaveAccessibleName(
    "Debt maturing against committed resources in US$m. FY2026: debt maturing 500, committed resources 300. FY2027: debt maturing 1,250, committed resources not supplied (no commitment is stated).",
  );
  // Each amount labelled as written under its year.
  expect([...figure.querySelectorAll("[data-figure]")].map((label) => label.textContent)).toEqual([
    "500",
    "300",
    "1,250",
  ]);
  // One scale from zero for both series, its top 1,250: 500 is 40%, 300 is 24%.
  expect(slots(figure)).toEqual([
    [
      "FY2026",
      [
        ["500", "40%"],
        ["300", "24%"],
      ],
    ],
    ["FY2027", [["1,250", "100%"]]],
  ]);
  expect(within(tile).getByText("US$m")).toBeVisible();
  expect(within(tile).getByText("Synthetic.")).toBeVisible();
});

it("keeps a slot for a year with no row and lists a row not labelled by a year as written", () => {
  const spaced = MARKDOWN.replace("| FY2027 | 1,250 |", "| FY2029 | 1,250 |").replace(
    "| Synthetic. |\n\n### Events",
    "| Synthetic. |\n| Thereafter | 900 | Not supplied: no facility beyond 2029 | US$m | Synthetic. |\n\n### Events",
  );
  render(<RefinancingLead {...leadProps(made(spaced))} />);
  const figure = within(screen.getByRole("region", { name: "Refinancing need" })).getByRole("img");
  expect(slots(figure).map(([year]) => year)).toEqual(["FY2026", "FY2027", "FY2028", "FY2029"]);
  expect(slots(figure)[1]).toEqual(["FY2027", []]);
  const unplaced = within(figure).getByRole("list", { name: "Rows not placed by year" });
  expect(within(unplaced).getByText("Thereafter")).toBeInTheDocument();
  expect(within(unplaced).getByText("900")).toBeInTheDocument();
  expect(within(unplaced).getByText("No facility beyond 2029")).toBeInTheDocument();
  expect(figure.querySelector('[data-slot="Thereafter"]')).toBeNull();
});

it("draws a stated gap in the figure's place with its reason, never zero, and no shortfall", () => {
  render(<RefinancingLead {...leadProps(made())} />);
  const figure = within(screen.getByRole("region", { name: "Refinancing need" })).getByRole("img");
  expect(figure.querySelectorAll("[data-gap]")).toHaveLength(1);
  const gaps = within(figure).getByRole("list", { name: "Amounts not supplied" });
  expect(within(gaps).getByText("Committed resources, FY2027")).toBeInTheDocument();
  expect(within(gaps).getByText("Not supplied")).toBeInTheDocument();
  expect(within(gaps).getByText("No commitment is stated")).toBeInTheDocument();
  // G7: the shared gap cell, no raw "Not supplied: reason" and no hatched swatch.
  expect(within(figure).queryByText(/Not supplied: /)).toBeNull();
  expect(figure.querySelector(".gap-hatch")).toBeNull();
  expect(
    [...figure.querySelectorAll("[data-figure]")].map((label) => label.textContent),
  ).not.toContain("0");
  expect(within(figure).queryByText(/950|200|shortfall/i)).toBeNull();
});

it("has a table view with each cell as written, its unit and basis per row, one trace per row", () => {
  render(<RefinancingLead {...leadProps(made())} />);
  const tile = screen.getByRole("region", { name: "Refinancing need" });
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "1,250" })).toBeVisible();
  expect(
    within(tile).getByRole("cell", { name: "Not supplied: no commitment is stated" }),
  ).toBeVisible();
  // F15: the per-row unit and basis stay with their rows.
  expect(within(tile).getByRole("columnheader", { name: "Reporting unit" })).toBeVisible();
  expect(within(tile).getByRole("columnheader", { name: "Basis and limitation" })).toBeVisible();
  expect(within(tile).getAllByRole("cell", { name: "US$m" })).toHaveLength(2);
  const links = within(tile).getAllByRole("link", { name: /Source for/ });
  expect(links.at(-1)).toHaveAttribute("href", expect.stringContaining("#evidence/"));
});

it("lists the liability-management paths as written and the refinancing dates", () => {
  render(<RefinancingLead {...leadProps(made())} />);
  const paths = screen.getByRole("list", { name: "Liability-management paths" });
  const [extend, drop] = within(paths).getAllByRole("listitem");
  if (!extend || !drop) throw new Error("two paths");
  expect(within(extend).getByText("Amend and extend")).toBeVisible();
  expect(within(extend).getByText("Feasible with consent")).toBeVisible();
  expect(within(extend).getByText("Rising")).toBeVisible();
  expect(within(drop).getByText("Insufficient Information")).toBeVisible();
  expect(within(paths).queryByText("Filing p.4")).toBeNull();
  const dates = screen.getByRole("list", { name: "Refinancing dates" });
  expect(
    within(dates)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual([expect.stringContaining("2025-03-31"), expect.stringContaining("2026")]);
});

it("states the gaps when the module wrote neither table, and draws nothing when blocked", () => {
  render(<RefinancingLead {...leadProps(handoff("## Findings\n\n### Bottom line\n\nThin.\n"))} />);
  expect(
    within(screen.getByRole("region", { name: "Refinancing need" })).getByText(
      "This page could not read the refinancing need.",
    ),
  ).toBeVisible();
  const paths = screen.getByRole("region", { name: "Liability-management paths" });
  expect(
    within(paths).getByText("This page could not read the liability-management paths."),
  ).toBeVisible();
  expect(paths.textContent).not.toMatch(/Built from the module's contract/);
  expect(screen.queryByRole("list", { name: "Refinancing dates" })).toBeNull();
  cleanup();
  const { container } = render(
    <RefinancingLead
      {...leadProps(
        handoff(
          "## Findings\n\n### Bottom line\n\nNot assessable: no debt schedule was supplied.\n",
        ),
      )}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});

it("draws the module's stated reason when the whole table is a gap", () => {
  const gap = handoff("## Findings\n\n### Bottom line\n\nThin.\n", {
    chartGaps: [{ title: "Refinancing need", table: 9, gap: "no maturity schedule in the files" }],
  });
  render(<RefinancingLead {...leadProps(gap)} />);
  expect(
    within(screen.getByRole("region", { name: "Refinancing need" })).getByText(
      "No maturity schedule in the files",
    ),
  ).toBeVisible();
});

it("says the store withheld the need table, traces it and opens the table as written", () => {
  const withheld = handoff(MARKDOWN, {
    events: [{ lane: "Refinancing", table: lineOf(MARKDOWN, "Events: Refinancing"), gap: null }],
  });
  render(<RefinancingLead {...leadProps(withheld)} />);
  const tile = screen.getByRole("region", { name: "Refinancing need" });
  expect(within(tile).getByText("This page could not draw this table.")).toBeVisible();
  expect(within(tile).getByRole("link", { name: "Source for Refinancing need" })).toHaveAttribute(
    "href",
    expect.stringContaining("#evidence/"),
  );
  expect(within(tile).getByText("The table as written")).toBeInTheDocument();
  const table = within(tile).getByRole("region", { name: "Refinancing need table" });
  expect(within(table).getByRole("cell", { name: "1,250" })).toBeInTheDocument();
});

it("puts amounts in more than one unit in the table view with the reason, not on one scale", () => {
  render(
    <RefinancingLead
      {...leadProps(
        made(MARKDOWN.replace("| FY2026 | 500 | 300 | US$m |", "| FY2026 | 500 | 300 | EUR m |")),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Refinancing need" });
  expect(tile.querySelectorAll("[data-bar]")).toHaveLength(0);
  expect(within(tile).getByText("The amounts are stated in more than one unit.")).toBeVisible();
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("cell", { name: "500" })).toBeVisible();
});

it("draws no source reference in a period or a cell of the need table", () => {
  render(
    <RefinancingLead
      {...leadProps(
        made(
          MARKDOWN.replace("| FY2026 | 500 |", "| FY2026 (CP-3C) | 500 |").replace(
            "Not supplied: no commitment is stated",
            "Not supplied: see facility_agreement.pdf p. 9",
          ),
        ),
      )}
    />,
  );
  const tile = screen.getByRole("region", { name: "Refinancing need" });
  expect(tile.textContent).not.toMatch(/facility_agreement|CP-3C/);
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(tile.textContent).not.toMatch(/facility_agreement|CP-3C/);
});

// Review 4, Q6: a year the module states no row for says so in its slot.
it("says No row stated in a year's slot that has no row", () => {
  const spaced = MARKDOWN.replace("| FY2027 | 1,250 |", "| FY2029 | 1,250 |");
  render(<RefinancingLead {...leadProps(made(spaced))} />);
  const tile = screen.getByRole("region", { name: "Refinancing need" });
  const empty = within(tile).getAllByText("No row stated");
  expect(empty).toHaveLength(2);
  // In the slot of its year, with no figure beside it.
  expect(empty[0]?.parentElement).toHaveTextContent(/^FY2027No row stated$/);
  expect(empty[0]?.parentElement?.querySelector("[data-figure]")).toBeNull();
});

const lanes = (count: number) => {
  const rows = ["2025-03-31", "2025-09-30", "2026-03-31"]
    .slice(0, count)
    .map(
      (date, at) =>
        `| ${date} | day | 2024-11-07 | Event ${String(at + 1)} | Scheduled — matures | Filing p.1 | Wall |`,
    )
    .join("\n");
  return MARKDOWN.replace(
    /### Events: Refinancing[\s\S]*?\n\n/,
    `### Events: Refinancing\n\n| Event date | Date precision | Published | Event | Status | Source | Credit relevance |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows}\n\n`,
  );
};

// Review 4, Q5: the shorter tiles stack beside the need; an axis lane takes the full row.
it("stacks the paths and a short lane in one column beside the need", () => {
  render(<RefinancingLead {...leadProps(made())} />);
  const need = screen.getByRole("region", { name: "Refinancing need" });
  const paths = screen.getByRole("region", { name: "Liability-management paths" });
  const dates = screen.getByRole("region", { name: "Refinancing dates" });
  expect(need).toHaveClass("lg:col-span-8");
  expect(paths.parentElement).toBe(dates.parentElement);
  expect(paths.parentElement).toHaveClass("lg:col-span-4", "self-start");
});

it("gives a lane of three dated rows the full row, its axis drawn with the run's as-of date", () => {
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
  const three = lanes(3);
  const props = {
    ...leadProps(made(three)),
    run: { folder: "run", asOf: "2025-06-30" } as PublishedRun,
  };
  const { container } = render(<RefinancingLead {...props} />);
  const dates = screen.getByRole("region", { name: "Refinancing dates" });
  expect(dates).toHaveClass("lg:col-span-12");
  expect(dates.parentElement).not.toBe(
    screen.getByRole("region", { name: "Liability-management paths" }).parentElement,
  );
  expect(within(dates).getByTestId("event-axis")).toBeInTheDocument();
  expect(container.querySelector("[data-as-of-rule='2025-06-30']")).not.toBeNull();
});

it("makes a need that is only a gap one full row, the paths and dates side by side under it", () => {
  render(
    <RefinancingLead
      {...leadProps(handoff(`## Findings\n\n### Bottom line\n\nThin.\n\n${EVENTS}\n${PATHS}`))}
    />,
  );
  expect(screen.getByRole("region", { name: "Refinancing need" })).toHaveClass("lg:col-span-12");
  expect(screen.getByRole("region", { name: "Liability-management paths" })).toHaveClass(
    "lg:col-span-6",
  );
  expect(screen.getByRole("region", { name: "Refinancing dates" })).toHaveClass("lg:col-span-6");
});
