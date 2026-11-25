import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Modules } from "./Modules";

type View = ReturnType<typeof buildReportView>;
function output(id: string, selected = false): OutputEntry {
  return {
    selected,
    output: { id, module: "CP-1", label: id, href: "", sha256: id.repeat(64) },
    sections: [],
  };
}
function fixture(outputs: OutputEntry[]) {
  const view: View = {
    entries: outputs,
    modules: [
      { id: "CP-2", name: "Credit analysis", state: "Delivered", outputs: [] },
      { id: "CP-1", name: "Financial foundation", state: "Delivered", outputs },
    ],
    catalogue: undefined,
    lead: undefined,
    models: [],
  };
  return {
    view,
    run: { folder: "retained case", issuer: "Issuer", asOf: "2026-10-31" } as PublishedRun,
    snapshot: { chips: {} } as Snapshot,
  };
}

it("defaults to financial foundation and the designated output, retaining alternate trace identity", () => {
  const props = fixture([output("a"), output("b", true)]);
  const { rerender } = render(<Modules {...props} />);
  expect(
    screen.getByRole("heading", { level: 2, name: "Financial foundation" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open Evidence" })).toHaveAttribute(
    "href",
    `/report/retained%20case#evidence/b~${"b".repeat(64)}`,
  );
  const saved = within(screen.getByRole("navigation", { name: "Saved outputs" }));
  expect(saved.getByRole("link", { name: "Output used in report" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  rerender(<Modules {...props} output="0" />);
  expect(screen.getByRole("link", { name: "Open Evidence" })).toHaveAttribute(
    "href",
    `/report/retained%20case#evidence/a~${"a".repeat(64)}`,
  );
  expect(saved.getByRole("link", { name: "Saved output 1" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(saved.getByRole("link", { name: "Output used in report" })).not.toHaveAttribute(
    "aria-current",
  );
});

it("allows the sole retained output without a designation but withholds ambiguous multiples", () => {
  const { rerender } = render(<Modules {...fixture([output("a")])} />);
  expect(screen.getByRole("link", { name: "Open Evidence" })).toBeInTheDocument();
  rerender(<Modules {...fixture([output("a"), output("b")])} />);
  expect(screen.getByRole("heading", { name: "Module output unavailable" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Open Evidence" })).toBeNull();
});

it.each(["", "00", "01", "-1", "+1", "1e0", "1.0", " 1", "2", "999999999999999999999999"])(
  "does not substitute the default for an invalid or absent output address: %j",
  (address) => {
    render(<Modules {...fixture([output("a"), output("b", true)])} output={address} />);
    expect(screen.getByRole("heading", { name: "Module output unavailable" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Evidence" })).toBeNull();
  },
);

it("respects explicit modules and does not substitute for an unknown module", () => {
  const props = fixture([output("a", true)]);
  const { rerender } = render(<Modules {...props} module="CP-2" />);
  expect(screen.getByRole("heading", { name: "Credit analysis" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Module output unavailable" })).toBeInTheDocument();
  rerender(<Modules {...props} module="missing" />);
  expect(screen.getByText("This module is unavailable in the published run.")).toBeInTheDocument();
  expect(screen.queryByLabelText("Module")).toBeNull();
});

it("leads CP-1 with the module's own bottom line, not a sentence the app wrote", () => {
  const lead = "Leverage is high but liquidity covers the next two years.";
  const entry = output("a", true);
  entry.sections = [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    {
      heading: "Bottom line",
      level: 3,
      line: 2,
      blocks: [{ type: "text", line: 3, end: 3, text: lead }],
    },
    {
      heading: "Period table",
      level: 3,
      line: 5,
      blocks: [
        {
          type: "table",
          headers: ["Period", "Start", "End"],
          line: 6,
          rows: [{ line: 7, cells: ["FY2026", "2026-01-01", "2026-12-31"] }],
        },
      ],
    },
    {
      heading: "Financials and credit metrics",
      level: 3,
      line: 10,
      blocks: [
        {
          type: "table",
          headers: ["Metric", "FY2026", "Unit"],
          line: 11,
          rows: [
            { line: 12, cells: ["(Total debt plus financing obligations) / EBITDA", "5.4", "x"] },
          ],
        },
      ],
    },
  ];
  const props = fixture([entry]);
  props.view.catalogue = {
    id: "first",
    issuer: "A",
    name: "A",
    title: "",
    date: "2027-01-01",
    period: "",
    sector: "",
    metrics: { cash: { value: 0, unit: "US$m", period: "2026-12-31" } },
  };
  render(<Modules {...props} />);
  expect(screen.queryByText(/Lease-adjusted gross leverage is/)).toBeNull();
  expect(screen.getByText(lead)).toBeVisible();
});

function renderModule(extra: Partial<OutputEntry["output"]>, withBottomLine = false) {
  const entry = output("c", true);
  entry.output = { ...entry.output, module: "CP-2", ...extra };
  entry.sections = [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    ...(withBottomLine
      ? [
          {
            heading: "Bottom line",
            level: 3,
            line: 2,
            blocks: [
              {
                type: "text" as const,
                line: 3,
                end: 3,
                text: "Reported liquidity covers the next payment.",
              },
            ],
          },
        ]
      : []),
    {
      heading: "Confidence inputs",
      level: 3,
      line: 4,
      blocks: [
        {
          type: "table",
          headers: ["Input", "Value"],
          line: 5,
          rows: [{ line: 6, cells: ["Coverage", "High"] }],
        },
      ],
    },
  ];
  const props = fixture([]);
  props.view.modules[0] = { ...props.view.modules[0], outputs: [entry] } as View["modules"][number];
  props.view.entries = [entry];
  return render(<Modules {...props} module="CP-2" />);
}

it("places a published zero and its confidence band in the module header with a separate trace", async () => {
  renderModule({ confidence: { value: 0, band: "Insufficient Information" } }, true);
  const header = within(screen.getByRole("region", { name: "Credit analysis" }));
  const score = within(header.getByRole("group", { name: "Confidence score" }));
  expect(header.getByRole("group", { name: "Confidence score" })).toHaveTextContent("0 / 100");
  expect(score.getByText("Insufficient Information")).toBeVisible();
  expect(screen.queryByText("Confidence score")).toBeNull();
  expect(header.getByText("Reported liquidity covers the next payment.")).toBeVisible();
  expect(header.getByRole("button", { name: "Show sources for the bottom line" })).toBeVisible();
  fireEvent.click(score.getByRole("button", { name: "Show sources for the confidence score" }));
  expect(await screen.findByRole("dialog")).toHaveTextContent("Coverage");
});

it("shows the published confidence score with its band", () => {
  renderModule({ confidence: { value: 72, band: "Medium" } });
  const score = screen.getByRole("group", { name: "Confidence score" });
  expect(score).toHaveTextContent("72");
  expect(score).toHaveTextContent("/ 100");
  expect(score).toHaveTextContent("Medium");
  expect(
    within(score).getByRole("button", { name: "Show sources for the confidence score" }),
  ).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Confidence inputs" })).toBeNull();
});

it("shows why there is no score", () => {
  renderModule({ confidence: { missing: "The confidence inputs could not be read." } });
  expect(screen.getByRole("group", { name: "Confidence score" })).toHaveTextContent(
    "Not scored: The confidence inputs could not be read.",
  );
});

it("draws nothing for a run that predates the score", () => {
  renderModule({});
  expect(screen.queryByText("Confidence score")).toBeNull();
  expect(screen.queryByRole("group", { name: "Confidence score" })).toBeNull();
});

it("skips no heading level on a module page that draws a relationship map", () => {
  const map = {
    type: "table" as const,
    line: 20,
    headers: ["From", "Relationship", "Edge type", "To", "Evidence"],
    rows: [{ line: 21, cells: ["A", "Owns", "Ownership", "B", "Source 1"] }],
  };
  const entry: OutputEntry = {
    selected: true,
    output: {
      id: "m",
      module: "CP-1",
      label: "m",
      href: "",
      sha256: "m".repeat(64),
      maps: [{ name: "credit-risk transmission", table: 20 }],
    },
    sections: [
      {
        heading: "Bottom line",
        level: 3,
        line: 10,
        blocks: [{ type: "text", line: 11, end: 11, text: "A verdict." }],
      },
      { heading: "Transmission", level: 3, line: 19, blocks: [map] },
    ],
  };
  const { container } = render(<Modules {...fixture([entry])} />);
  expect(screen.getByRole("heading", { name: "Credit-risk transmission" })).toBeInTheDocument();
  const levels = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6"), (node) =>
    Number(node.tagName.slice(1)),
  );
  levels.forEach((level, at) => {
    expect(level).toBeLessThanOrEqual((levels[at - 1] ?? 1) + 1);
  });
});

afterEach(cleanup);

const CODE = /\(CP-[A-Za-z0-9]+\)/;
type Sections = OutputEntry["sections"];

function renderSections(sections: Sections, extra: Partial<OutputEntry["output"]> = {}) {
  const entry = output("c", true);
  entry.output = { ...entry.output, module: "CP-2", ...extra };
  entry.sections = sections;
  const props = fixture([]);
  props.view.modules[0] = { ...props.view.modules[0], outputs: [entry] } as View["modules"][number];
  props.view.entries = [entry];
  return render(<Modules {...props} module="CP-2" />);
}

const FINDINGS: Sections[number] = { heading: "Findings", level: 2, line: 1, blocks: [] };

it("drops the code of a named module from a row's trace drawer statement", async () => {
  renderSections([
    FINDINGS,
    {
      heading: "Cash position",
      level: 3,
      line: 3,
      blocks: [
        {
          type: "table",
          line: 4,
          headers: ["Item", "Amount", "Source"],
          rows: [
            {
              line: 6,
              cells: [
                "Cash runway",
                "14 months",
                "Financial foundation (CP-1); filing.pdf, page 3",
              ],
            },
          ],
        },
      ],
    },
  ]);
  expect(document.body.textContent).not.toMatch(CODE);
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
  fireEvent.click(screen.getByRole("button", { name: "Show sources for Cash runway" }));
  const drawer = await screen.findByRole("dialog");
  expect(drawer.textContent).toContain("Financial foundation");
  expect(drawer.textContent).toContain("filing.pdf, page 3");
  expect(drawer.textContent).not.toMatch(CODE);
});

it("drops the code of a named module from a paragraph's trace drawer statement", async () => {
  renderSections([
    FINDINGS,
    {
      heading: "Credit implication",
      level: 3,
      line: 3,
      blocks: [
        {
          type: "text",
          line: 4,
          end: 5,
          text: "Cash covers the year, as Liquidity (CP-2D) sets out.\nBasis: Liquidity (CP-2D)",
        },
      ],
    },
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for this passage" }));
  const drawer = await screen.findByRole("dialog");
  expect(drawer.textContent).toContain("as Liquidity sets out");
  expect(drawer.textContent).not.toMatch(CODE);
});

it("drops the code from a calculation node's source in the trace drawer", async () => {
  renderSections([
    FINDINGS,
    {
      heading: "Key findings",
      level: 3,
      line: 3,
      blocks: [
        {
          type: "text",
          line: 4,
          end: 5,
          text: "Contractual principal is USD 25,068 million.\nBasis: calculation C05",
        },
      ],
    },
    {
      heading: "Calculations",
      level: 2,
      line: 20,
      blocks: [
        {
          type: "table",
          line: 21,
          headers: ["ID", "Calculation", "Inputs", "Result", "Source"],
          rows: [
            {
              line: 23,
              cells: [
                "C05",
                "Contractual principal",
                "24880 +188",
                "25068",
                "Financial foundation (CP-1); filing.pdf, pages 73-73",
              ],
            },
          ],
        },
      ],
    },
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for this passage" }));
  const drawer = await screen.findByRole("dialog");
  expect(drawer.textContent).toContain("Contractual principal");
  expect(drawer.textContent).toContain("filing.pdf, pages 73-73");
  expect(drawer.textContent).not.toMatch(CODE);
});

it("names a row's trace control without the code in the Module cell", () => {
  renderSections([
    FINDINGS,
    {
      heading: "What changed: the analysis",
      level: 3,
      line: 3,
      blocks: [
        {
          type: "table",
          line: 4,
          headers: ["Module", "Status", "Cause", "Why"],
          rows: [
            { line: 6, cells: ["Liquidity (CP-2D)", "Unchanged", "None", "Nothing differs."] },
          ],
        },
      ],
    },
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
  expect(screen.getByRole("button", { name: "Show sources for Liquidity" })).toBeInTheDocument();
  const coded = screen
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-label") ?? button.textContent)
    .filter((name) => CODE.test(name));
  expect(coded).toEqual([]);
});

it("opens the confidence score's trace on the inputs the score was computed from", async () => {
  renderModule({ confidence: { value: 72, band: "Medium" } });
  fireEvent.click(
    within(screen.getByRole("group", { name: "Confidence score" })).getByRole("button", {
      name: "Show sources for the confidence score",
    }),
  );
  const drawer = await screen.findByRole("dialog");
  expect(drawer.textContent).not.toContain("Basis was not recorded for this item");
  expect(drawer.textContent).toContain("Coverage");
  expect(drawer.textContent).toContain("High");
});

it("draws the reader passages in order and a gap for the missing one", () => {
  const CONTRARY = "Contrary evidence and what would change the view";
  const text = (heading: string, line: number): Sections[number] => ({
    heading,
    level: 3,
    line,
    blocks: [{ type: "text", line: line + 1, end: line + 1, text: `${heading} says so.` }],
  });
  renderSections([
    FINDINGS,
    text("Limitations", 2),
    text("Bottom line", 4),
    text("Key findings", 6),
  ]);
  // The header carries the bottom line under the module's name; the passages follow in the owed order.
  const header = screen.getByRole("region", { name: "Credit analysis" });
  expect(within(header).getByText("Bottom line says so.")).toBeVisible();
  const regions = ["Key findings", CONTRARY, "Limitations of this module"].map((name) =>
    screen.getByRole("region", { name }),
  );
  [header, ...regions].slice(1).forEach((region, at) => {
    const before = [header, ...regions][at] as HTMLElement;
    expect(before.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  expect(regions[1]).toHaveTextContent("Not established for this run");
  expect(within(regions[2] as HTMLElement).getByText("Limitations says so.")).toBeVisible();
});

it("draws no bottom-line gap beside the module's own summary", () => {
  renderSections(
    [
      FINDINGS,
      {
        heading: "Key findings",
        level: 3,
        line: 2,
        blocks: [{ type: "text", line: 3, end: 3, text: "Margins held." }],
      },
    ],
    { summary: { bottomLine: "Leverage is stable.", confidence: "", limitation: "", line: 3 } },
  );
  const header = within(screen.getByRole("region", { name: "Credit analysis" }));
  expect(header.getByText("Leverage is stable.")).toBeInTheDocument();
  expect(header.queryByText(/Not established for this run/)).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Bottom line" })).not.toBeInTheDocument();
  const limitations = screen.getByRole("region", { name: "Limitations of this module" });
  expect(limitations).toHaveTextContent("Not established for this run");
});

// A summary whose line the handoff does not hold has no trace; the header's control must not
// throw for it (the page before the frame drew the missing-trace marker instead).
it("draws a summary bottom line whose handoff line is not held, without a crash", () => {
  renderSections(
    [
      FINDINGS,
      {
        heading: "Key findings",
        level: 3,
        line: 2,
        blocks: [{ type: "text", line: 3, end: 3, text: "Margins held." }],
      },
    ],
    { summary: { bottomLine: "Leverage is stable.", confidence: "", limitation: "", line: 9 } },
  );
  expect(screen.getByText("Leverage is stable.")).toBeInTheDocument();
});

const CONTRARY_HEADING = "Contrary evidence and what would change the view";
const passage = (
  heading: string,
  line: number,
  text = `${heading} says so.`,
): Sections[number] => ({
  heading,
  level: 3,
  line,
  blocks: text ? [{ type: "text", line: line + 1, end: line + 1, text }] : [],
});
const gapOf = (name: string) => screen.getByRole("heading", { name }).closest("section");

it("gaps a passage whose section has no blocks", () => {
  renderSections([
    FINDINGS,
    passage("Bottom line", 2),
    passage("Key findings", 4),
    passage(CONTRARY_HEADING, 6, ""),
    passage("Limitations", 8),
  ]);
  expect(screen.getByText("Limitations says so.")).toBeInTheDocument();
  expect(gapOf(CONTRARY_HEADING)).toHaveTextContent("Not established for this run");
});

it("gaps a passage holding only a method note", () => {
  renderSections([
    FINDINGS,
    passage("Bottom line", 2),
    passage("Key findings", 4),
    passage(CONTRARY_HEADING, 6, "Module status: complete."),
    passage("Limitations", 8),
  ]);
  expect(screen.getByText("Limitations says so.")).toBeInTheDocument();
  expect(screen.queryByText("Module status: complete.")).not.toBeInTheDocument();
  expect(gapOf(CONTRARY_HEADING)).toHaveTextContent("Not established for this run");
});

it("shows the bottom-line gap when the summary band is dropped for a reference", () => {
  renderSections([FINDINGS, passage("Key findings", 2)], {
    summary: {
      bottomLine: "See report.pdf for the view.",
      confidence: "",
      limitation: "",
      line: 9,
    },
  });
  expect(screen.getByText("Key findings says so.")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Credit analysis" })).toHaveTextContent(
    "Not established for this run",
  );
});

it("draws a nested section named like a passage and keeps the real passage", () => {
  renderSections([
    FINDINGS,
    passage("Bottom line", 2),
    passage("Key findings", 4),
    passage(CONTRARY_HEADING, 6),
    {
      heading: "Cash",
      level: 3,
      line: 8,
      blocks: [{ type: "text", line: 9, end: 9, text: "Cash is ample." }],
    },
    {
      heading: "Limitations",
      level: 4,
      line: 10,
      blocks: [{ type: "text", line: 11, end: 11, text: "Nested caveat on cash." }],
    },
    passage("Limitations", 12),
  ]);
  expect(screen.getByText("Limitations says so.")).toBeInTheDocument();
  expect(screen.getByText("Cash is ample.")).toBeInTheDocument();
  expect(screen.getByText("Nested caveat on cash.")).toBeInTheDocument();
});

it("picks the passage slot by role and line when a nested section of the same name comes first", () => {
  renderSections([
    FINDINGS,
    passage("Bottom line", 2),
    passage("Key findings", 4),
    passage(CONTRARY_HEADING, 6),
    {
      heading: "Cash",
      level: 3,
      line: 8,
      blocks: [{ type: "text", line: 9, end: 9, text: "Cash is ample." }],
    },
    {
      heading: "Limitations",
      level: 4,
      line: 10,
      blocks: [{ type: "text", line: 11, end: 11, text: "Nested caveat on cash." }],
    },
    passage("Limitations", 12),
  ]);
  // The real passage fills the limitations tile; the nested section stays a section of its own.
  const slot = within(screen.getByRole("region", { name: "Limitations of this module" }));
  expect(slot.getByText("Limitations says so.")).toBeVisible();
  expect(slot.queryByText("Cash is ample.")).toBeNull();
  expect(slot.queryByText("Nested caveat on cash.")).toBeNull();
  const nested = within(screen.getByRole("region", { name: "Limitations" }));
  expect(nested.getByText("Nested caveat on cash.")).toBeVisible();
  const before = (first: string, second: string) =>
    Boolean(
      screen.getByText(first).compareDocumentPosition(screen.getByText(second)) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  expect(before("Cash is ample.", "Nested caveat on cash.")).toBe(true);
  expect(before("Nested caveat on cash.", "Limitations says so.")).toBe(true);
});

it("counts a passage drawn as a chart as present", () => {
  renderSections(
    [
      FINDINGS,
      passage("Bottom line", 2),
      passage("Key findings", 4),
      {
        heading: CONTRARY_HEADING,
        level: 3,
        line: 6,
        blocks: [
          {
            type: "table",
            line: 7,
            headers: ["Year", "Value"],
            rows: [{ line: 8, cells: ["2025", "4"] }],
          },
        ],
      },
      passage("Limitations", 10),
    ],
    { chartGaps: [{ title: "Chart", table: 7, unit: "x", columns: [1], gap: "no data" }] },
  );
  expect(screen.getByText("Limitations says so.")).toBeInTheDocument();
  expect(screen.queryByText(/The module wrote no such passage/)).not.toBeInTheDocument();
});

// docs/rulings/2026-11-16-reporting-currency-from-sources.md: the run's currency is CP-1's money
// unit, which the catalogue records with the run's cash figure.
it.each([
  ["GBPm", "Market levels are US market quotes in US dollars; this run reports in GBPm."],
  ["US$m", null],
])(
  "notes US market quotes on the security decisions of a %s run only when not USD",
  (unit, text) => {
    const entry = output("s", true);
    entry.output = { ...entry.output, module: "CP-3", label: "Security selection" };
    entry.sections = [
      FINDINGS,
      {
        heading: "Security decision summary",
        level: 3,
        line: 2,
        blocks: [
          {
            type: "table",
            line: 4,
            headers: [
              "Instrument",
              "Market level (1 Oct 2026)",
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
                  "$99.00; yield 7.00%",
                  "First lien",
                  "Fair",
                  "Neutral",
                  "p.1",
                ],
              },
            ],
          },
        ],
      },
    ];
    const props = fixture([]);
    props.view.modules = [
      { id: "CP-3", name: "Security selection", state: "Delivered", outputs: [entry] },
    ];
    props.view.entries = [entry];
    props.view.catalogue = {
      id: "first",
      issuer: "A",
      name: "A",
      title: "",
      date: "2026-11-01",
      period: "",
      sector: "",
      metrics: { cash: { value: "1250", unit, period: "2026-06-30" } },
    };
    render(<Modules {...props} module="CP-3" />);
    const decisions = screen.getByRole("region", { name: "Instrument decisions" });
    if (text) expect(within(decisions).getByText(text)).toHaveAttribute("role", "note");
    else expect(within(decisions).queryByText(/US market quotes/)).toBeNull();
  },
);
