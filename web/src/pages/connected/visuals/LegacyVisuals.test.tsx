import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegacyForecast, LegacyVisuals } from ".";

function fixture(headers: string[], rows: string[][]) {
  return [
    { blocks: [{ type: "table", line: 20, headers, rows: rows.map((cells) => ({ cells })) }] },
  ];
}

it("draws only classified source tables and switches to the exact published values and gap reasons", () => {
  const sections = fixture(
    ["Period", "Refinancing need", "Reporting unit", "Basis and limitation"],
    [
      ["FY2028", "250.00", "US$m", "Issuer statement"],
      ["FY2029", "Not supplied: No estimate", "US$m", "No estimate"],
    ],
  );
  const output = {
    charts: [
      { title: "Refinancing need", table: 20, unit: "US$m", columns: [1] },
      { title: "Wrong line", table: 99, columns: [1] },
    ],
  };
  render(
    <LegacyVisuals
      output={output}
      sections={sections}
      evidenceHref={(line) => `#line-${String(line)}`}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "Refinancing need" }));
  expect(figure.getByText("$m")).toBeInTheDocument();
  expect(figure.getByRole("link", { name: "Source table" })).toHaveAttribute("href", "#line-20");
  expect(screen.queryByText("Wrong line")).toBeNull();
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  expect(figure.getByRole("table", { name: "Refinancing need" })).toHaveTextContent("250.00");
  expect(figure.getByRole("table")).toHaveTextContent("Not supplied: No estimate");
});

it("keeps unhandled chart contracts visible as source tables and published gaps as reasons", () => {
  const output = {
    charts: [{ title: "Unsupported", table: 20, kind: "unknown" }],
    chartGaps: [{ title: "Debt stack", table: 21, gap: "Ranking was withheld" }],
  };
  render(<LegacyVisuals output={output} sections={fixture(["Line", "Value"], [["Debt", "10"]])} />);
  expect(screen.getByRole("table", { name: "Unsupported" })).toHaveTextContent("Debt10");
  expect(screen.queryByRole("button", { name: "Figure" })).toBeNull();
  expect(screen.getByText("Ranking was withheld")).toBeInTheDocument();
});

it("keeps source names in Evidence when a published gap names a source file", () => {
  render(
    <LegacyVisuals
      output={{ chartGaps: [{ title: "Liquidity", table: 20, gap: "Not in funding.xlsx" }] }}
      evidenceHref={() => "#evidence/0-20"}
    />,
  );
  expect(screen.getByRole("note")).toHaveTextContent("See Evidence");
  expect(screen.getAllByText(/Not established for this run/)).toHaveLength(1);
  expect(screen.queryByText(/funding\.xlsx/)).toBeNull();
  expect(screen.getByRole("link", { name: "Source table" })).toHaveAttribute(
    "href",
    "#evidence/0-20",
  );
});

it("draws a chart gap reason in the reader's words, a module code as the module's name", () => {
  render(
    <LegacyVisuals
      output={{
        chartGaps: [
          { title: "Triggers", table: 20, gap: "Not established: CP-4 gives no trigger text" },
          { title: "Cover", table: 21, gap: "Not established: see Filing p.12 (CP-4)" },
        ],
      }}
      evidenceHref={(line) => `#evidence/0-${String(line)}`}
    />,
  );
  const notes = screen.getAllByRole("note");
  expect(notes[0]).toHaveTextContent("Not established: Legal & covenants gives no trigger text");
  expect(notes[1]).toHaveTextContent("Not established. See Evidence.");
  expect(document.body.textContent).not.toMatch(/CP-\d/);
});

it("renders the published model cell displays, cases, dates and reasons", () => {
  const model = {
    cashflow: {
      units: "US$m",
      columns: [{ group: "Base case", label: "FY2028E" }],
      rows: [
        {
          band: "Cash flow",
          label: "Closing cash",
          total: true,
          cells: [{ display: "250.00", exact: "250.004", status: "value" }],
        },
      ],
      other: {
        columns: [{ group: "Stress case", label: "FY2028E" }],
        rows: [
          {
            band: "Cash flow",
            label: "Closing cash",
            cells: [{ display: "n.a.", status: "na", reason: "Opening cash absent" }],
          },
        ],
      },
      notes: ["Model forecast"],
      limits: ["Conditional illustration"],
    },
  };
  render(<LegacyForecast model={model} />);
  expect(screen.getByRole("table", { name: "Cash flow model" })).toHaveTextContent("250.00");
  expect(screen.getByRole("table", { name: "Other forecast cases" })).toHaveTextContent(
    "Stress case",
  );
  expect(screen.getByRole("cell", { name: "n.a. Opening cash absent" })).toHaveTextContent("n.a.");
  expect(screen.getByText("Conditional illustration")).toBeInTheDocument();
});

const basis = ["Reporting unit", "Basis and limitation"];

it("plots the quoted note and retains the unquoted note, spread and quote date in the table", () => {
  render(
    <LegacyVisuals
      output={{
        charts: [
          {
            title: "Yield against maturity",
            table: 20,
            kind: "scatter",
            label: 0,
            date: 1,
            yield: 2,
            unit: "%",
          },
        ],
      }}
      sections={fixture(
        ["Instrument", "Maturity date", "Yield", "Spread", "Quote date", "Source class", ...basis],
        [
          [
            "Synthetic 2028 note",
            "2028-06-15",
            "6.4",
            "+310 bp",
            "2024-12-31",
            "Dealer quote",
            "%",
            "Synthetic.",
          ],
          [
            "Synthetic 2031 note",
            "2031-03-01",
            "Not supplied: no quote",
            "Not supplied: no quote",
            "2024-12-31",
            "Dealer quote",
            "%",
            "Synthetic.",
          ],
        ],
      )}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "Yield against maturity" }));
  expect(figure.getByText(/Not plotted: Synthetic 2031 note/)).toBeInTheDocument();
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  expect(figure.getByRole("cell", { name: "+310 bp" })).toBeInTheDocument();
  expect(figure.getAllByRole("cell", { name: "2024-12-31" })).toHaveLength(2);
  expect(figure.getAllByRole("cell", { name: "Not supplied: no quote" })).toHaveLength(2);
});

it("preserves native claim size, recovery percent, zero and an explicit recovery gap", () => {
  render(
    <LegacyVisuals
      output={{
        charts: [
          {
            title: "Recovery by class",
            table: 20,
            kind: "recovery",
            label: 0,
            scenario: 1,
            claim: 2,
            recovery: 3,
            percent: 4,
            unit: "US$m",
          },
        ],
      }}
      sections={fixture(
        ["Class", "Scenario", "Claim", "Recovery", "Recovery %", ...basis],
        [
          ["Secured", "Base", "1,200", "1,080", "90", "US$m", "Synthetic."],
          [
            "Secured",
            "Downside",
            "1,200",
            "Not supplied: no downside value",
            "Not supplied: no downside value",
            "US$m",
            "Synthetic.",
          ],
          ["Unsecured", "Base", "800", "0.00", "0", "US$m", "Synthetic."],
        ],
      )}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "Recovery by class" }));
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  expect(figure.getByRole("columnheader", { name: "Claim" })).toBeInTheDocument();
  expect(figure.getByRole("columnheader", { name: "Recovery %" })).toBeInTheDocument();
  expect(figure.getAllByRole("cell", { name: "1,200" })).toHaveLength(2);
  expect(figure.getByRole("cell", { name: "0.00" })).toBeInTheDocument();
  expect(figure.getAllByRole("cell", { name: "Not supplied: no downside value" })).toHaveLength(2);
});

it("keeps compatible earnings comparisons plotted when one value is missing", () => {
  render(
    <LegacyVisuals
      output={{
        charts: [
          {
            title: "Prior and current results",
            table: 20,
            kind: "grouped",
            label: 0,
            periods: [1, 3],
            prior: 2,
            current: 4,
            unit: "US$m",
          },
        ],
      }}
      sections={fixture(
        ["Measure", "Prior period", "Prior", "Current period", "Current", ...basis],
        [
          ["Revenue", "FY2023", "2,100", "FY2024", "2,250", "US$m", "Synthetic."],
          [
            "Adjusted EBITDA",
            "FY2023",
            "410",
            "FY2024",
            "Not supplied: not stated",
            "US$m",
            "Synthetic.",
          ],
        ],
      )}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "Prior and current results" }));
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  expect(figure.getByRole("columnheader", { name: "Prior period" })).toBeInTheDocument();
  expect(figure.getByRole("cell", { name: "2,250" })).toBeInTheDocument();
  expect(figure.getByRole("cell", { name: "Not supplied: not stated" })).toBeInTheDocument();
});

it("keeps portfolio limits as records when the descriptor supplies no validated portfolio basis", () => {
  const rows = [
    ["New issuer", "0.00", "Not supplied: no proposal", "5.0", "% NAV", "Synthetic."],
    ["Sector", "12.50", "13.25", "15.0", "% NAV", "Synthetic."],
  ];
  render(
    <LegacyVisuals
      output={{
        charts: [
          {
            title: "Portfolio limits",
            table: 20,
            kind: "limits",
            label: 0,
            current: 1,
            proposed: 2,
            limit: 3,
            unit: "% NAV",
          },
        ],
      }}
      sections={fixture(
        ["Limit", "Current exposure", "Proposed exposure", "Limit value", ...basis],
        rows,
      )}
      evidenceHref={(line) => `#line-${String(line)}`}
    />,
  );
  expect(screen.queryByRole("figure", { name: "Portfolio limits" })).toBeNull();
  expect(screen.getByRole("note")).toHaveTextContent(
    "The portfolio limits could not be checked against the mandate for this run.",
  );
  expect(screen.getByText("Not established for this run")).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/Source table available|portfolio basis/);
  const table = within(screen.getByRole("table", { name: "Portfolio limits" }));
  expect(table.getByRole("cell", { name: "0.00" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "Not supplied: no proposal" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "13.25" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Source table" })).toHaveAttribute("href", "#line-20");
});

it.each([
  [
    "Bridge",
    { kind: "waterfall", amount: 1, unit: "US$m" },
    ["Step", "Amount"],
    [
      ["Opening", "100", "US$m", "Evidence"],
      ["Change", "-20", "US$m", "Evidence"],
      ["Closing", "80", "US$m", "Evidence"],
    ],
    "-20",
  ],
  [
    "Prior and current results",
    { kind: "grouped", label: 0, periods: [1, 3], prior: 2, current: 4, unit: "US$m" },
    ["Measure", "Prior period", "Prior", "Current period", "Current"],
    [["Revenue", "FY2024", "100", "FY2025", "120", "US$m", "Evidence"]],
    "FY2025",
  ],
  [
    "Peer ratios",
    { kind: "range", label: 0, issuer: 1, low: 2, median: 3, high: 4 },
    ["Metric", "Issuer", "Peer low", "Peer median", "Peer high", "Peer count"],
    [["Leverage", "4.5", "2.0", "3.0", "6.0", "20", "x", "Evidence"]],
    "20",
  ],
  [
    "Market quotes",
    { kind: "scatter", label: 0, date: 1, yield: 2, unit: "%" },
    ["Instrument", "Maturity date", "Yield", "Spread", "Quote date", "Source class"],
    [["Senior notes", "2029-08-02", "4.25", "100", "2026-06-17", "Issuer", "%", "Evidence"]],
    "2029-08-02",
  ],
] satisfies [string, Record<string, unknown>, string[], string[][], string][])(
  "draws %s from its published column roles and keeps the source figures in the table",
  (title, roles, headers, rows, expected) => {
    render(
      <LegacyVisuals
        output={{ charts: [{ title, table: 20, ...roles }] }}
        sections={fixture([...headers, ...basis], rows)}
      />,
    );
    const figure = within(screen.getByRole("figure", { name: title }));
    fireEvent.click(figure.getByRole("button", { name: "Table" }));
    expect(figure.getByRole("table", { name: title })).toHaveTextContent(expected);
  },
);

it("renders a published time lane and relationship without inferring exact dates or ownership", () => {
  const sections = [
    ...fixture(
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
        [
          "2028-Q2",
          "quarter",
          "Not supplied: no publication date",
          "Notes due",
          "Scheduled — Contract",
          "Source A",
          "Refinancing",
        ],
      ],
    ),
    {
      blocks: [
        {
          type: "table",
          line: 30,
          headers: ["From", "Relationship", "Edge type", "To", "Evidence"],
          rows: [
            { cells: ["Company A", "guarantees debt for", "Guarantee", "Company B", "Source B"] },
          ],
        },
      ],
    },
  ];
  render(
    <LegacyVisuals
      output={{
        events: [{ lane: "Maturities", table: 20 }],
        maps: [{ name: "legal entities", table: 30 }],
      }}
      sections={sections}
    />,
  );
  const event = within(screen.getByRole("figure", { name: "Maturities" }));
  expect(event.getByText(/2028-Q2 · quarter/)).toBeInTheDocument();
  const map = within(screen.getByRole("figure", { name: "legal entities" }));
  expect(map.getByRole("list", { name: "Connection key" })).toHaveTextContent(
    "guarantees debt for",
  );
  fireEvent.click(map.getByRole("button", { name: "Table" }));
  expect(map.getByRole("table")).toHaveTextContent("Source B");
});

it("charts published forecast series and renders the separately formatted figures", () => {
  const columns = ["FY2025E", "FY2026E", "FY2027E"].map((label) => ({ label, group: "Base case" }));
  const cells = [
    { display: "1,050", exact: "1050.004", status: "value" },
    { display: "n.a.", status: "na", reason: "Source absent" },
    { display: "1,125", exact: "1124.76", status: "value" },
  ];
  render(
    <LegacyForecast
      model={{ cashflow: { units: "US$m", columns, rows: [{ label: "Revenue", cells }] } }}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "Revenue" }));
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  const table = figure.getByRole("table", { name: "Revenue" });
  expect(table).toHaveTextContent("1,050");
  expect(table).toHaveTextContent("n.a. Source absent");
  expect(table).toHaveTextContent("1,125");
  expect(table).not.toHaveTextContent("1050.004");
});

it("keeps unstated stack balances out of the plot while retaining their stated reasons", () => {
  const output = {
    charts: [{ title: "Debt stack", table: 20, kind: "stack", label: 0, amount: 3, unit: "US$m" }],
  };
  const sections = fixture(
    ["Facility", "Ranking", "Secured", "Amount", "Cumulative leverage", ...basis],
    [
      ["Senior secured", "1", "Yes", "1,200", "2.4", "US$m", "Evidence"],
      ["Senior notes", "2", "No", "0", "2.4", "US$m", "Evidence"],
      [
        "Subordinated notes",
        "3",
        "No",
        "Not supplied: balance not stated",
        "Not supplied: no balance",
        "US$m",
        "Evidence",
      ],
    ],
  );
  render(<LegacyVisuals output={output} sections={sections} />);
  const element = screen.getByRole("figure", { name: "Debt stack" });
  const figure = within(element);
  // One segment is drawn; C4-004: every facility is named in a ranked legend, and only the drawn
  // one carries the swatch that ties its colour to its name.
  expect(
    [...element.querySelectorAll("[data-segment]")].map((s) => s.getAttribute("data-part")),
  ).toEqual(["Senior secured"]);
  const rows = figure.getAllByRole("listitem");
  expect(
    rows.map((li) => [...li.children].map((c) => c.textContent).filter((t) => t !== "")),
  ).toEqual([
    ["Senior secured", "1,200"],
    ["Senior notes", "0"],
    ["Subordinated notes", "Not supplied: balance not stated"],
  ]);
  expect(rows.map((li) => li.querySelector("svg") !== null)).toEqual([true, false, false]);
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  expect(figure.getByRole("row", { name: /Senior notes/ })).toHaveTextContent("0");
  expect(figure.getByRole("table")).toHaveTextContent("Not supplied: no balance");
});

it("draws dated points and coarse intervals as year markers and dated rows with their precision", () => {
  const sections = fixture(
    ["Event date", "Date precision", "Published", "Event", "Status", "Source", "Credit relevance"],
    [
      [
        "2028-Q2",
        "quarter",
        "—",
        "Refinancing scenario",
        "Scenario — Conditional",
        "Source B",
        "Debt",
      ],
      [
        "2028-03-31",
        "day",
        "2028-04-01",
        "Bond retired",
        "Historical — Reported",
        "Source A",
        "Debt",
      ],
    ],
  );
  render(
    <LegacyVisuals
      output={{ events: [{ lane: "Debt calendar", table: 20 }] }}
      sections={sections}
    />,
  );
  const markers = within(screen.getByRole("group", { name: "Events by year" }));
  const rows = within(screen.getByRole("group", { name: "Events in date order" }));
  const point = markers.getByRole("button", { name: /Bond retired.*2028-03-31.*day/ });
  const range = markers.getByRole("button", { name: /Refinancing scenario.*2028-Q2.*quarter/ });
  expect(point).toHaveAttribute("data-event-category", "Historical");
  expect(range).toHaveAttribute("data-event-category", "Scenario");
  expect(rows.getByText("2028-03-31 · day")).toBeInTheDocument();
  expect(rows.getByText("2028-Q2 · quarter")).toBeInTheDocument();
});

it("draws each named node once and connects published parallel, return and self edges", () => {
  const sections = fixture(
    ["From", "Relationship", "Edge type", "To", "Evidence"],
    [
      ["A", "Owns first", "Ownership", "B", "Source 1"],
      ["A", "Guarantees second", "Guarantee", "B", "Source 2"],
      ["B", "Owns parent stake", "Ownership", "A", "Source 3"],
      ["B", "Own security", "Security", "B", "Source 4"],
    ],
  );
  render(
    <LegacyVisuals
      output={{ maps: [{ name: "legal entities", table: 20 }] }}
      sections={sections}
    />,
  );
  const figure = within(screen.getByRole("figure", { name: "legal entities" }));
  const graph = figure.getByRole("img", { name: /Directed relationship graph/ });
  expect(
    Array.from(graph.querySelectorAll("[data-map-node]"), (node) =>
      node.getAttribute("data-map-node"),
    ),
  ).toEqual(["A", "B"]);
  const paths = Array.from(graph.querySelectorAll("[data-map-edge] path"), (path) =>
    path.getAttribute("d"),
  );
  expect(paths).toHaveLength(4);
  expect(new Set(paths).size).toBe(4);
  expect(graph.querySelector('[data-map-edge="3"] title')).toHaveTextContent(
    "B → A · Ownership · Owns parent stake",
  );
  fireEvent.click(figure.getByRole("button", { name: "Table" }));
  expect(figure.getByRole("table")).toHaveTextContent("Own security");
  expect(figure.getByRole("table")).toHaveTextContent("Source 4");
});

it("leaves invalid event dates and missing map endpoints in their source tables", () => {
  const sections = [
    ...fixture(
      [
        "Event date",
        "Date precision",
        "Published",
        "Event",
        "Status",
        "Source",
        "Credit relevance",
      ],
      [["2027-02-29", "day", "—", "Wrong date", "Historical — Reported", "Source A", "Debt"]],
    ),
    {
      blocks: [
        {
          type: "table",
          line: 30,
          headers: ["From", "Relationship", "Edge type", "To", "Evidence"],
          rows: [
            {
              cells: [
                "A",
                "Guarantees",
                "Guarantee",
                "Not supplied: issuer undisclosed",
                "Source B",
              ],
            },
          ],
        },
      ],
    },
  ];
  render(
    <LegacyVisuals
      output={{
        events: [{ lane: "Debt calendar", table: 20 }],
        maps: [{ name: "legal entities", table: 30 }],
      }}
      sections={sections}
    />,
  );
  expect(screen.queryByRole("figure")).toBeNull();
  expect(screen.getByRole("table", { name: "Debt calendar" })).toHaveTextContent("2027-02-29");
  expect(screen.getByRole("table", { name: "legal entities" })).toHaveTextContent(
    "Not supplied: issuer undisclosed",
  );
});

it("draws a chart gap in the gap treatment with its title and the recorded reason", () => {
  const reason = "no mandate, constraint or limit data in the run settings";
  render(<LegacyVisuals output={{ chartGaps: [{ title: "Limits", table: 20, gap: reason }] }} />);
  expect(screen.getByRole("heading", { name: "Limits" })).toBeInTheDocument();
  const note = screen.getByRole("note");
  expect(note.textContent).toBe(reason);
  expect(note.className).toContain("first-letter:uppercase");
  expect(note.parentElement?.className).toContain("gap-hatch");
});

function twoCharts() {
  const table = (line: number) => ({
    type: "table",
    line,
    headers: ["Period", "Amount", "Reporting unit", "Basis and limitation"],
    rows: [
      { cells: ["FY2027", "10", "US$m", "Stated"] },
      { cells: ["FY2028", "12", "US$m", "Stated"] },
    ],
  });
  return {
    output: {
      charts: [
        { title: "Interest", table: 20, unit: "US$m", columns: [1] },
        { title: "Debt maturities", table: 30, unit: "US$m", columns: [1] },
      ],
    },
    sections: [{ blocks: [table(20), table(30)] }],
  };
}

it("lays chart cards in two columns from lg and spans the primary chart across both", () => {
  const { output, sections } = twoCharts();
  render(<LegacyVisuals output={output} sections={sections} primary="Debt maturities" cards />);
  const card = (name: string) => {
    const found = screen.getByRole("figure", { name }).closest("div.rounded-xl");
    if (!(found instanceof HTMLElement)) throw new Error(`no card for ${name}`);
    return found;
  };
  expect(card("Debt maturities").parentElement).toHaveClass("lg:grid-cols-2");
  expect(card("Debt maturities")).toHaveClass("lg:col-span-2");
  // The card left alone in the second row also spans both columns.
  expect(card("Interest")).toHaveClass("lg:col-span-2");
});

it("keeps charts in one column when they are not cards", () => {
  const { output, sections } = twoCharts();
  render(<LegacyVisuals output={output} sections={sections} />);
  const figure = screen.getByRole("figure", { name: "Interest" });
  expect(figure.closest(".lg\\:grid-cols-2")).toBeNull();
});

it("spans a lone card and the last card of an odd count across both columns", () => {
  const { output, sections } = twoCharts();
  const cardOf = (name: string) => screen.getByRole("figure", { name }).closest("div.rounded-xl");
  const { unmount } = render(
    <LegacyVisuals output={{ charts: [output.charts[0]] }} sections={sections} cards />,
  );
  expect(cardOf("Interest")).toHaveClass("lg:col-span-2");
  unmount();
  render(<LegacyVisuals output={output} sections={sections} cards />);
  expect(cardOf("Interest")).not.toHaveClass("lg:col-span-2");
  expect(cardOf("Debt maturities")).not.toHaveClass("lg:col-span-2");
});

it("keeps the heading level on a period chart with a negative value", () => {
  const sections = fixture(
    ["Period", "Free cash flow", "Reporting unit", "Basis and limitation"],
    [
      ["FY2028", "250.00", "US$m", "Issuer statement"],
      ["FY2029", "-40.00", "US$m", "Issuer statement"],
    ],
  );
  render(
    <LegacyVisuals
      headingLevel="h3"
      output={{ charts: [{ title: "Free cash flow", table: 20, unit: "US$m", columns: [1] }] }}
      sections={sections}
    />,
  );
  expect(screen.getByRole("heading", { name: "Free cash flow", level: 3 })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
});
