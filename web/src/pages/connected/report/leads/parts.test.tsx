import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Bento } from "../overview/Tile";
import {
  caseStyle,
  CompactGap,
  DatedList,
  Disclosure,
  edgeTable,
  GapCell,
  KeyValues,
  LaneTile,
  LeadFigure,
  LeadGap,
  mapLayout,
  MapTile,
  NodeList,
  Prose,
  statedGap,
  TableRegion,
} from "./parts";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** The tile's measured width, as a laid-out browser would report it to a ResizeObserver. */
function measured(width: number) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        this.callback([{ target, contentRect: { width } } as unknown as ResizeObserverEntry], this);
      }
      unobserve() {}
      disconnect() {}
    },
  );
}

const edge = (from: string, to: string, line: number, relationship = "r", type = "t") => ({
  from,
  relationship,
  type,
  to,
  line,
});

it("draws the figure first and its table behind a pressed Figure / Table switch", () => {
  render(
    <Bento>
      <LeadFigure
        span={8}
        label="Liquidity bridge"
        title="Liquidity falls to 570 after the repayment"
        basis="US$m · twelve months"
        figure={<svg role="img" aria-label="Opening 900 to closing 570" />}
        table={{ head: ["Step", "Amount"], rows: [{ label: "Opening", cells: ["900"] }] }}
      />
    </Bento>,
  );
  const tile = screen.getByRole("region", { name: "Liquidity bridge" });
  expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(
    "Liquidity falls to 570 after the repayment",
  );
  expect(within(tile).getByText("US$m · twelve months")).toBeVisible();
  expect(within(tile).getByRole("img", { name: "Opening 900 to closing 570" })).toBeVisible();
  const figure = within(tile).getByRole("button", { name: "Figure" });
  expect(figure).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).queryByRole("img")).toBeNull();
  expect(within(tile).getByRole("cell", { name: "900" })).toBeVisible();
});

// Screen review F4: one tile-level gap for every lead, the screen map's: the titled tile holding
// the hatched gap note in the figure's place (the kit's `GapTile` draws the same).
it("draws a gap in place of the figure as the gap note, with the reason only", () => {
  render(
    <LeadGap
      span={4}
      label="Revenue mix"
      title="Revenue mix"
      reason="The handoff states the mix only in words."
    />,
  );
  const tile = screen.getByRole("region", { name: "Revenue mix" });
  const reason = within(tile).getByText("The handoff states the mix only in words.");
  expect(reason).toBeVisible();
  expect(reason.parentElement).toHaveClass("gap-hatch", "border-dashed");
  expect(within(tile).getByRole("heading", { level: 3, name: "Revenue mix" })).toBeVisible();
  // No way on is drawn where the page gives none (the module page provides it).
  expect(within(tile).queryByRole("link")).toBeNull();
  expect(tile).toHaveClass("self-start");
  expect(tile.textContent).not.toMatch(/Needs|methodology|contract/);
  expect(within(tile).queryByText("0")).toBeNull();
});

it("draws a node map as lists: each node once, its edges under it", () => {
  render(
    <NodeList
      label="Ownership and control"
      edges={[
        {
          from: "Parent",
          relationship: "Owns all shares",
          type: "Ownership",
          to: "Issuer",
          line: 4,
        },
        {
          from: "Parent",
          relationship: "Guarantees notes",
          type: "Guarantee",
          to: "Notes",
          line: 5,
        },
        { from: "Issuer", relationship: "Borrows", type: "Other stated", to: "Notes", line: 6 },
      ]}
    />,
  );
  const map = screen.getByRole("list", { name: "Ownership and control" });
  const nodes = within(map)
    .getAllByRole("listitem")
    .filter((item) => item.parentElement === map);
  expect(nodes.map((node) => within(node).getByRole("heading").textContent)).toEqual([
    "Parent",
    "Issuer",
  ]);
  expect(within(nodes[0] as HTMLElement).getAllByRole("listitem")).toHaveLength(2);
  expect(within(nodes[0] as HTMLElement).getByText("Owns all shares")).toBeVisible();
  expect(within(nodes[0] as HTMLElement).getByText("Guarantee")).toBeVisible();
});

it("lists dated events at their stated precision", () => {
  render(
    <DatedList
      label="Funding dates"
      events={[
        {
          date: "2025-Q3",
          precision: "quarter",
          event: "Review",
          status: "Scenario — modelled",
          line: 3,
        },
        {
          date: "2026",
          precision: "year",
          event: "Maturity",
          status: "Scheduled — maturity",
          line: 4,
        },
      ]}
    />,
  );
  const list = screen.getByRole("list", { name: "Funding dates" });
  expect(within(list).getByText("2025-Q3")).toHaveClass("font-mono");
  expect(within(list).getByText("Scenario")).toBeVisible();
  expect(within(list).getAllByRole("listitem")).toHaveLength(2);
});

it("draws a passage paragraph by paragraph and keeps one naming a source in Evidence", () => {
  render(
    <Prose
      label="Causal scenarios"
      paragraphs={[
        { line: 2, text: "A traffic shock cuts aftermarket sales." },
        { line: 4, text: null },
      ]}
    />,
  );
  expect(screen.getByText("A traffic shock cuts aftermarket sales.")).toBeVisible();
  expect(
    screen.getByText("This paragraph cites its sources by name; it is in Evidence."),
  ).toBeVisible();
});

it("splits an event's status at its first dash only and keeps the rest as the detail", () => {
  render(
    <DatedList
      label="Funding dates"
      events={[
        {
          date: "2026",
          precision: "year",
          event: "Maturity",
          status: "Scheduled — maturity — subject to extension",
          line: 4,
        },
      ]}
    />,
  );
  const list = screen.getByRole("list", { name: "Funding dates" });
  expect(within(list).getByText("Scheduled").parentElement).toHaveTextContent(
    "Scheduled · maturity — subject to extension",
  );
});

it("names each paragraph's trace by its place in the passage", () => {
  render(
    <Prose
      label="Causal scenarios"
      href={(line) => `#evidence/run/${String(line)}`}
      paragraphs={[
        { line: 2, text: "A traffic shock cuts aftermarket sales." },
        { line: 4, text: "Recovery takes two years." },
      ]}
    />,
  );
  expect(
    screen.getByRole("link", { name: "Source for Causal scenarios, paragraph 1" }),
  ).toHaveAttribute("href", "#evidence/run/2");
  expect(
    screen.getByRole("link", { name: "Source for Causal scenarios, paragraph 2" }),
  ).toHaveAttribute("href", "#evidence/run/4");
});

it("shows an empty edge cell in the table view as missing, not as a crash", () => {
  render(
    <Bento>
      <LeadFigure
        span={12}
        label="Ownership"
        title="Ownership"
        figure={<p>map</p>}
        table={edgeTable([
          { from: "Parent", relationship: "", type: "Ownership", to: "Issuer", line: 3 },
        ])}
      />
    </Bento>,
  );
  const tile = screen.getByRole("region", { name: "Ownership" });
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  expect(within(tile).getByRole("row", { name: /Parent/ })).toBeVisible();
});

it("keeps two nodes apart when both read In Evidence on the page", () => {
  render(
    <NodeList
      label="Map"
      edges={[
        {
          key: "Plan p.3",
          from: "In Evidence",
          relationship: "Funds",
          type: "Other stated",
          to: "Issuer",
          line: 4,
        },
        {
          key: "Memo p.9",
          from: "In Evidence",
          relationship: "Guarantees",
          type: "Guarantee",
          to: "Notes",
          line: 5,
        },
      ]}
    />,
  );
  const map = screen.getByRole("list", { name: "Map" });
  const nodes = within(map)
    .getAllByRole("listitem")
    .filter((item) => item.parentElement === map);
  expect(nodes).toHaveLength(2);
  expect(within(map).queryByText(/p\.3|p\.9/)).toBeNull();
});

it("puts the Figure / Table switch in the tile head and the table in a named, focusable region", () => {
  render(
    <Bento>
      <LeadFigure
        span={8}
        label="Liquidity bridge"
        title="Liquidity bridge"
        trace={<a href="#evidence/run/3">Source for Liquidity bridge</a>}
        figure={<p>figure</p>}
        table={{ head: ["Step", "Amount"], rows: [{ label: "Opening", cells: ["900"] }] }}
      />
    </Bento>,
  );
  const tile = screen.getByRole("region", { name: "Liquidity bridge" });
  const heading = within(tile).getByRole("heading", { level: 3 });
  const head = heading.parentElement?.parentElement;
  expect(head).toContainElement(within(tile).getByRole("button", { name: "Table" }));
  expect(head).toContainElement(within(tile).getByRole("link", { name: /Source for/ }));
  fireEvent.click(within(tile).getByRole("button", { name: "Table" }));
  const region = within(tile).getByRole("region", { name: "Liquidity bridge table" });
  expect(region).toHaveAttribute("tabindex", "0");
  expect(region).toHaveClass("relative", "overflow-x-auto");
  expect(within(region).getByRole("table")).toBeVisible();
});

it("keeps a disclosed table closed until asked, in the same named region", () => {
  const { container } = render(
    <Disclosure
      label="Hedge terms"
      table={{ head: ["Hedge", "Notional"], rows: [{ label: "Swap", cells: ["USD 300m"] }] }}
    />,
  );
  const details = container.querySelector("details");
  expect(details).not.toHaveAttribute("open");
  expect(details?.querySelector("summary")).toHaveTextContent("Hedge terms");
  expect(screen.getByRole("region", { name: "Hedge terms table", hidden: true })).toBeTruthy();
});

it("draws one gap chip with the reason, never a double colon", () => {
  expect(statedGap("Not supplied: no current")).toEqual({
    word: "Not supplied",
    reason: "No current",
  });
  expect(statedGap("4.2")).toBeNull();
  const gap = statedGap("Not calculable: no base");
  render(<GapCell word={gap?.word} reason={gap?.reason} />);
  expect(screen.getByText("Not calculable")).toHaveClass("border-dashed");
  expect(screen.getByText("No base")).toBeVisible();
  expect(document.body.textContent).not.toMatch(/: /);
});

it("lists named values as a two-column list", () => {
  render(<KeyValues items={[{ key: "Feasibility", value: "High" }]} />);
  const list = screen.getByRole("term").closest("dl");
  expect(list).toHaveClass("grid-cols-[fit-content(55%)_minmax(0,1fr)]");
  expect(screen.getByRole("definition")).toHaveTextContent("High");
});

// Review F1: with an `auto` label column a long label ("What the assumption leaves out") took the
// whole width of a narrow tile and the value, which may break anywhere, was set a letter a line.
it("bounds the label column so a long label never leaves the value no width", () => {
  render(
    <KeyValues items={[{ key: "What the assumption leaves out", value: "Working capital" }]} />,
  );
  const list = screen.getByRole("term").closest("dl");
  expect(list?.className).not.toMatch(/grid-cols-\[auto_/);
  expect(screen.getByRole("term")).toHaveClass("wrap-anywhere");
});

it("lays a map's nodes in columns by depth, a loop edge not moving them", () => {
  const columns = mapLayout([
    edge("Parent", "Issuer", 1),
    edge("Issuer", "Notes", 2),
    edge("Parent", "Notes", 3),
    edge("Notes", "Parent", 4),
  ]);
  expect(columns.map((nodes) => nodes.map((node) => node.name))).toEqual([
    ["Parent"],
    ["Issuer"],
    ["Notes"],
  ]);
  expect(mapLayout([edge("A", "B", 1)])).toHaveLength(2);
});

it("lists a map's gap rows after its edges, each with its reason and trace", () => {
  render(
    <NodeList
      label="Ownership"
      edges={[{ from: "Parent", relationship: "Owns", type: "Ownership", to: "Issuer", line: 4 }]}
      gaps={[{ line: 5, reason: "Guarantor exhibit absent" }]}
      href={(line) => `#evidence/run/${String(line)}`}
    />,
  );
  const gaps = screen.getByRole("list", { name: "Ownership: rows not drawn" });
  expect(within(gaps).getByText("Row not drawn: Guarantor exhibit absent")).toBeVisible();
  expect(within(gaps).getByRole("link")).toHaveAttribute("href", "#evidence/run/5");
  expect(within(screen.getByRole("list", { name: "Ownership" })).getByText("Issuer")).toBeVisible();
});

it("shows each event's publication date and credit relevance, and the rows it could not place", () => {
  render(
    <DatedList
      label="Funding dates"
      unplaced={[{ date: "TBD", event: "Unplaced row event", line: 9 }]}
      events={[
        {
          date: "2026",
          precision: "year",
          published: "2024-11-07",
          event: "Maturity",
          status: "Scheduled — maturity",
          relevance: "Refinancing wall",
          line: 4,
        },
      ]}
    />,
  );
  const list = screen.getByRole("list", { name: "Funding dates" });
  expect(within(list).getByText(/Published 2024-11-07/)).toBeVisible();
  expect(within(list).getByText("Refinancing wall")).toBeVisible();
  expect(screen.getByText("This page could not place 1 of the 2 dated rows:")).toBeVisible();
  const unplaced = screen.getByRole("list", { name: "Funding dates, rows not placed by date" });
  expect(within(unplaced).getByText("TBD")).toBeVisible();
  expect(within(unplaced).getByText("Unplaced row event")).toBeVisible();
});

it("puts a table in a named, focusable region whose long cells wrap", () => {
  render(
    <TableRegion
      label="Hedge terms"
      table={{ head: ["Hedge", "Terms"], rows: [{ label: "Swap", cells: ["Long words"] }] }}
    />,
  );
  const region = screen.getByRole("region", { name: "Hedge terms table" });
  expect(region).toHaveAttribute("tabindex", "0");
  expect(region.className).toMatch(/\[&_td\]:max-w-\[28ch\]/);
});

it("draws a compact gap: dashed, sized to its words, no hatch", () => {
  render(<CompactGap>The handoff states no runway figure.</CompactGap>);
  const gap = screen.getByText("The handoff states no runway figure.");
  expect(gap).toHaveClass("border-dashed", "w-fit");
  expect(gap).not.toHaveClass("gap-hatch");
});

// Review 4, Q1: the layout follows the tile's measured width, never the viewport's.
it("draws a one-edge map as a compact inline figure in a narrow tile, both nodes whole", () => {
  measured(200);
  const { container } = render(
    <NodeList
      label="Legal entities"
      edges={[edge("Synthetic A", "Synthetic B", 4, "Synthetic link", "Ownership")]}
    />,
  );
  // The map's one list is the figure: drawn in a line, at its content's width.
  const list = screen.getByRole("list", { name: "Legal entities" });
  expect(list).toHaveAttribute("data-map", "inline");
  expect(list).not.toHaveClass("sr-only");
  expect(list).toHaveTextContent("Synthetic A→Synthetic link·Ownership→Synthetic B");
  const [node] = within(list).getAllByRole("listitem");
  expect(node).toHaveClass("w-fit", "flex-wrap");
  expect(within(list).getByRole("heading", { name: "Synthetic A" })).toBeInTheDocument();
  expect(within(list).getAllByText(/Synthetic (B|link)|Ownership/)).toHaveLength(3);
  expect(container.querySelector("[data-map-columns]")).toBeNull();
  expect(container.querySelector(".overflow-x-auto, .w-max")).toBeNull();
});

it("draws a two-node map in a tile too narrow for columns as the vertical flow, never sideways", () => {
  measured(300);
  const { container } = render(
    <NodeList
      label="Intercreditor"
      edges={[
        edge("Lenders", "Issuer", 4, "Lend to", "Debt"),
        edge("Lenders", "Issuer", 5, "Hold security over", "Security"),
      ]}
    />,
  );
  expect(container.querySelector("[data-map-columns]")).toBeNull();
  expect(container.querySelector(".overflow-x-auto, .w-max")).toBeNull();
  const list = screen.getByRole("list", { name: "Intercreditor" });
  expect(list).not.toHaveClass("sr-only");
  expect(within(list).getByText("Hold security over")).toBeInTheDocument();
  expect(within(list).getByText("Security")).toBeInTheDocument();
});

// Real output (TransDigm, operating model to credit): relationships are clauses, not one word. On
// a connector they wrapped to three lines and ran over the next connector's words and edge type.
it("draws a map whose relationships are clauses as the flow, even in a tile wide enough for columns", () => {
  measured(1200);
  const { container } = render(
    <NodeList
      label="Operating model to credit"
      edges={[
        edge(
          "Customized proprietary products",
          "Pricing and margin resilience",
          1,
          "Supports product differentiation",
          "Management Language",
        ),
        edge(
          "Flight-hour exposure",
          "Aftermarket revenue sensitivity",
          2,
          "Lower utilization reduces replacement demand",
          "Analyst Interpretation",
        ),
      ]}
    />,
  );
  expect(container.querySelector("[data-map-columns]")).toBeNull();
  const list = screen.getByRole("list", { name: "Operating model to credit" });
  expect(list).not.toHaveClass("sr-only");
  expect(within(list).getByText("Lower utilization reduces replacement demand")).toBeVisible();
  // Two nodes are a short flow: one column.
  expect(list).not.toHaveClass("columns-2");
});

it("reads a long flow in two columns in a wide tile, and in one in a narrow tile", () => {
  const long = Array.from({ length: 7 }, (_, at) =>
    edge(
      `Cause ${String(at)}`,
      `Effect ${String(at)}`,
      at + 1,
      "Reduces internally generated funds",
      "Analyst Interpretation",
    ),
  );
  measured(1100);
  const { unmount } = render(<NodeList label="Transmission" edges={long} />);
  expect(screen.getByRole("list", { name: "Transmission" })).toHaveClass("columns-2");
  unmount();
  measured(620);
  render(<NodeList label="Transmission" edges={long} />);
  expect(screen.getByRole("list", { name: "Transmission" })).not.toHaveClass("columns-2");
});

it("lays a deep map in columns only when they fit the tile, each connector with its relationship and type", () => {
  const deep = [
    edge("Parent", "Holdco", 1, "Owns", "Ownership"),
    edge("Holdco", "Issuer", 2, "Owns", "Ownership"),
    edge("Issuer", "Notes", 3, "Issues", "Debt"),
    edge("Parent", "Notes", 4, "Guarantees", "Guarantee"),
  ];
  measured(600);
  const { container, unmount } = render(<NodeList label="Ownership" edges={deep} />);
  expect(container.querySelector("[data-map-columns]")).toBeNull();
  expect(screen.getByRole("list", { name: "Ownership" })).not.toHaveClass("sr-only");
  unmount();
  measured(1200);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1200,
    bottom: 300,
    width: 1200,
    height: 300,
    toJSON: () => ({}),
  });
  const wide = render(<NodeList label="Ownership" edges={deep} />);
  const drawing = wide.container.querySelector("[data-map-columns]");
  expect(drawing).toHaveAttribute("data-map-columns", "4");
  // Columns by a class, sized to the tile: never wider than it.
  expect(drawing).toHaveClass("auto-cols-[minmax(8rem,1fr)]", "w-full");
  expect(drawing).not.toHaveClass("w-max");
  expect((drawing as HTMLElement).style.gridTemplateColumns).toBe("");
  expect(screen.getByRole("list", { name: "Ownership" })).toHaveClass("sr-only");
  const labels = [...wide.container.querySelectorAll("[data-route]")].map(
    (item) => item.textContent,
  );
  expect(labels).toEqual(["OwnsOwnership", "OwnsOwnership", "IssuesDebt", "GuaranteesGuarantee"]);
});

it("shows a long lane's first three dated rows and keeps the rest behind a disclosure", () => {
  const events = ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05"].map((date, at) => ({
    date,
    precision: "month",
    published: "2024-11-07",
    event: `Event ${String(at + 1)}`,
    status: "Scheduled — maturity",
    relevance: "",
    line: 10 + at,
  }));
  const { container } = render(<DatedList label="Hedge dates" events={events} />);
  expect(
    within(screen.getByRole("list", { name: "Hedge dates" })).getAllByRole("listitem"),
  ).toHaveLength(3);
  const more = container.querySelector("details");
  expect(more).not.toHaveAttribute("open");
  expect(within(more as HTMLElement).getByText("Show the other 2 dated rows")).toBeInTheDocument();
  expect(within(more as HTMLElement).getByText("Event 5")).toBeInTheDocument();
});

it("keeps a lane of four rows whole", () => {
  const events = ["2025-01", "2025-02", "2025-03", "2025-04"].map((date, at) => ({
    date,
    precision: "month",
    published: "2024-11-07",
    event: `Event ${String(at + 1)}`,
    status: "Scheduled — maturity",
    relevance: "",
    line: 10 + at,
  }));
  const { container } = render(<DatedList label="Funding dates" events={events} />);
  expect(
    within(screen.getByRole("list", { name: "Funding dates" })).getAllByRole("listitem"),
  ).toHaveLength(4);
  expect(container.querySelector("details")).toBeNull();
});

// Review 4, Q6: a date never breaks, and the trace stays near its row's text.
it("keeps every date on one line, numbers the rows and caps the row measure", () => {
  const { container } = render(
    <DatedList
      label="Funding dates"
      events={[
        {
          date: "2025-03-31",
          precision: "day",
          published: "2024-11-07",
          event: "Notes mature",
          status: "Scheduled — maturity",
          line: 4,
        },
        { date: "2026", precision: "year", event: "Loan", status: "Scheduled — x", line: 5 },
      ]}
    />,
  );
  const list = screen.getByRole("list", { name: "Funding dates" });
  const date = within(list).getByText("2025-03-31");
  expect(date).toHaveClass("whitespace-nowrap");
  expect(date).not.toHaveClass("wrap-anywhere");
  expect(within(list).getByText("Published 2024-11-07")).toHaveClass("whitespace-nowrap");
  expect(
    within(list)
      .getAllByRole("listitem")
      .map((row) => row.querySelector("[data-number]")?.textContent),
  ).toEqual(["1", "2"]);
  expect(container.firstElementChild).toHaveClass("max-w-3xl");
});

const placed = (count: number) =>
  ["2025-03-31", "2025-06-30", "2025-09-30", "2026-03-31"].slice(0, count).map((date, at) => ({
    date,
    precision: "day",
    published: "",
    event: `Event ${String(at + 1)}`,
    status: "Scheduled — maturity",
    relevance: "",
    category: "Scheduled" as const,
    from: Date.parse(`${date}T00:00:00Z`),
    to: Date.parse(`${date}T00:00:00Z`),
    line: 10 + at,
  }));

const laneTile = (count: number, asOf?: string | null) => (
  <LaneTile
    lane={{ state: "ready", events: placed(count), unplaced: [], line: 9 }}
    span={12}
    label="Refinancing dates"
    title="Refinancing dates"
    href={(line) => `#evidence/run/${String(line)}`}
    asOf={asOf}
  />
);

// Review 4, Q4: the Calendar's own event axis above the numbered list, from three placed events.
it("draws the event axis above the numbered list for three events in a wide tile, linked to the rows", () => {
  measured(1100);
  const { container } = render(laneTile(3, "2025-05-01"));
  const tile = screen.getByRole("region", { name: "Refinancing dates" });
  const axis = within(tile).getByTestId("event-axis");
  const list = within(tile).getByRole("list", { name: "Refinancing dates" });
  expect(axis.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelector("[data-as-of-rule='2025-05-01']")).not.toBeNull();
  const rows = within(list).getAllByRole("listitem");
  const mark = within(axis).getByRole("button", { name: /^Event 2,/ });
  expect(mark).toHaveAttribute("aria-controls", rows[1]?.id);
  fireEvent.click(mark);
  expect(rows[1]).toHaveFocus();
});

it("draws the list only for two events, or in a tile too narrow for the axis", () => {
  measured(1100);
  render(laneTile(2));
  expect(screen.queryByTestId("event-axis")).toBeNull();
  expect(screen.getByRole("list", { name: "Refinancing dates" })).toBeInTheDocument();
  cleanup();
  measured(500);
  render(laneTile(4));
  expect(screen.queryByTestId("event-axis")).toBeNull();
  expect(
    within(screen.getByRole("list", { name: "Refinancing dates" })).getAllByRole("listitem"),
  ).toHaveLength(4);
});

it("opens the folded rows when an axis mark names one of them", () => {
  measured(1100);
  const events = [
    ...placed(4),
    ...placed(1).map((item) => ({
      ...item,
      date: "2026-09-30",
      event: "Event 5",
      line: 20,
      from: Date.parse("2026-09-30T00:00:00Z"),
      to: Date.parse("2026-09-30T00:00:00Z"),
    })),
  ];
  const { container } = render(
    <LaneTile
      lane={{ state: "ready", events, unplaced: [], line: 9 }}
      span={12}
      label="Refinancing dates"
      title="Refinancing dates"
      href={(line) => `#evidence/run/${String(line)}`}
    />,
  );
  const more = container.querySelector("details");
  expect(more).not.toHaveAttribute("open");
  fireEvent.click(
    within(screen.getByTestId("event-axis")).getByRole("button", { name: /^Event 5,/ }),
  );
  expect(more).toHaveAttribute("open");
  expect(
    within(more as HTMLElement)
      .getByText("Event 5")
      .closest("li"),
  ).toHaveFocus();
});

it("lays named values key above value when asked, for long keys", () => {
  render(
    <KeyValues stacked items={[{ key: "Implied annual default probability", value: "4.2%" }]} />,
  );
  const list = screen.getByRole("term").closest("dl");
  expect(list).toHaveClass("grid-cols-1");
  expect(list).not.toHaveClass("grid-cols-[fit-content(55%)_minmax(0,1fr)]");
});

// Colour-signal-build ruling R2/C6: edge types take category colours only where a caller opts in.
const TYPED = [
  edge("Parent", "Holdco", 1, "Owns", "Ownership"),
  edge("Holdco", "Issuer", 2, "Owns", "Ownership"),
  edge("Issuer", "Notes", 3, "Issues", "Debt"),
  edge("Parent", "Notes", 4, "Guarantees", "Guarantee"),
];
const BOX = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 1200,
  bottom: 300,
  width: 1200,
  height: 300,
  toJSON: () => ({}),
};
const mapTile = (edges: typeof TYPED, typeColours?: boolean) => (
  <MapTile
    map={{ state: "ready", edges, gaps: [], line: 1 }}
    span={12}
    label="Ownership"
    title="Ownership"
    href={() => "#x"}
    absent="none"
    {...(typeColours === undefined ? {} : { typeColours })}
  />
);

it("gives a case its colour and marker by register order: slots 3 to 6, then slot 8", () => {
  expect([0, 1, 2, 3, 4, 9].map((at) => caseStyle(at))).toEqual([
    { tone: "category-3", shape: "dot" },
    { tone: "category-4", shape: "square" },
    { tone: "category-5", shape: "diamond" },
    { tone: "category-6", shape: "ring" },
    { tone: "category-8", shape: "dot" },
    { tone: "category-8", shape: "dot" },
  ]);
});

it("keeps a map neutral unless the caller asks for type colours", () => {
  measured(1200);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(BOX);
  const { container } = render(mapTile(TYPED));
  expect(container.querySelector("[data-map-columns] path.stroke-connector")).not.toBeNull();
  expect(container.innerHTML).not.toMatch(/category-/);
  expect(container.querySelector('[data-part="legend"]')).toBeNull();
});

it("colours each edge type in columns: 2 px connector, its own arrowhead, a line swatch and a legend in words", () => {
  measured(1200);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(BOX);
  const { container } = render(mapTile(TYPED, true));
  const paths = [...container.querySelectorAll("[data-map-columns] svg > path")];
  // Debt, Guarantee, Ownership by name: slots 3, 4, 5.
  expect(paths.map((path) => path.getAttribute("class"))).toEqual([
    "stroke-category-5",
    "stroke-category-5",
    "stroke-category-3",
    "stroke-category-4",
  ]);
  expect(paths.every((path) => path.getAttribute("stroke-width") === "2")).toBe(true);
  expect(
    paths.map((path) => /-(category-\d)\)$/.exec(path.getAttribute("marker-end") ?? "")?.[1]),
  ).toEqual(["category-5", "category-5", "category-3", "category-4"]);
  const chips = [...container.querySelectorAll("[data-route] svg line")];
  expect(chips).toHaveLength(4);
  expect(container.querySelectorAll("marker")).toHaveLength(4);
  const legend = [...container.querySelectorAll('[data-part="legend"] li')];
  expect(legend.map((item) => item.textContent)).toEqual(["Debt", "Guarantee", "Ownership"]);
  expect(legend.every((item) => item.getAttribute("data-legend") === "line")).toBe(true);
});

it("orders the type colours by the type's name, not by the order the rows were written", () => {
  measured(1200);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(BOX);
  const first = render(mapTile(TYPED, true));
  const forward = [
    ...first.container.querySelectorAll('[data-part="legend"] li svg [data-swatch]'),
  ].map((item) => item.getAttribute("class"));
  first.unmount();
  const second = render(mapTile([...TYPED].reverse(), true));
  const backward = [...second.container.querySelectorAll('[data-part="legend"] li')].map((item) => [
    item.textContent,
    item.querySelector("[data-swatch]")?.getAttribute("class"),
  ]);
  expect(backward).toEqual([
    ["Debt", "stroke-category-3"],
    ["Guarantee", "stroke-category-4"],
    ["Ownership", "stroke-category-5"],
  ]);
  expect(forward).toEqual(["stroke-category-3", "stroke-category-4", "stroke-category-5"]);
});

it("colours the flow's left rule and the one-edge arrows by edge type", () => {
  measured(300);
  const flow = render(mapTile(TYPED.slice(0, 1).concat(TYPED.slice(2, 3)), true));
  const rules = [...flow.container.querySelectorAll("li li > span.border-l-2")];
  expect(rules.map((rule) => rule.className.match(/border-category-\d/)?.[0])).toEqual([
    "border-category-4",
    "border-category-3",
  ]);
  flow.unmount();
  const inline = render(mapTile(TYPED.slice(0, 1), true));
  const arrows = [...inline.container.querySelectorAll("ul[data-map] span.text-category-3")];
  expect(arrows.map((arrow) => arrow.textContent)).toEqual(["→", "→"]);
  // One type: its chip carries swatch and word, so no legend repeats it.
  expect(inline.container.querySelector('[data-part="legend"]')).toBeNull();
  expect(inline.container.querySelector("ul[data-map] svg [data-swatch=line]")).toHaveClass(
    "stroke-category-3",
  );
});
