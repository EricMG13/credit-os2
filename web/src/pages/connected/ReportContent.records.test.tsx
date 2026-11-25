import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot, Table } from "./publishedReport";
import { FORECAST_INPUTS, evidencePath } from "./publishedReport";
import type { buildReportView } from "./reportView";
import {
  PublishedTable,
  ReportFindings,
  findingBlocks,
  recordSections,
  traceForLine,
} from "./ReportContent";
import { Modules } from "./report/Modules";

type View = ReturnType<typeof buildReportView>;
const text = (heading: string, line: number): Section => ({
  heading,
  level: 3,
  line,
  blocks: [{ type: "text", line: line + 1, text: `${heading} prose.`, end: line + 1 }],
});
const tableSection = (heading: string, line: number): Section => ({
  heading,
  level: 3,
  line,
  blocks: [
    {
      type: "table",
      headers: ["Item", "Value"],
      line: line + 1,
      rows: [{ line: line + 2, cells: ["Row", "1"] }],
    },
  ],
});
const openRecords = () => {
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
};
const FINDINGS: Section = { heading: "Findings", level: 2, line: 1, blocks: [] };
const CP1 = [
  ["Bottom line", "text"],
  ["Leverage and coverage: what the numbers say", "text"],
  ["Limitations", "text"],
  ["T4.2 Entity period key", "table"],
  ["T4.4 Income statement", "table"],
  ["Segment schedule", "table"],
  ["T4.5 Cash flow statement", "table"],
  ["T4.6 Balance sheet", "table"],
  ["T4.18 Debt instruments", "table"],
  ["Net debt data", "table"],
  ["Financials and credit metrics", "table"],
  ["T4.10 KPI dashboard", "table"],
  ["T4.13 Readiness", "table"],
  ["Confidence inputs", "table"],
] as const;
function entryOf(module: string, sections: Section[]): OutputEntry {
  return {
    selected: true,
    output: { id: "a", module, label: "a", href: "", sha256: "a".repeat(64) },
    sections: [FINDINGS, ...sections],
  };
}
const cp1 = () =>
  entryOf(
    "CP-1",
    CP1.map(([heading, kind], index) =>
      kind === "text" ? text(heading, 10 + index * 10) : tableSection(heading, 10 + index * 10),
    ),
  );
function page(entry: OutputEntry) {
  const view: View = {
    entries: [entry],
    modules: [{ id: entry.output.module, name: "Module", state: "Delivered", outputs: [entry] }],
    catalogue: undefined,
    lead: undefined,
    models: [],
  };
  const run = { folder: "retained case", issuer: "Issuer", asOf: "2026-10-31" } as PublishedRun;
  return render(
    <Modules
      snapshot={{ chips: {} } as Snapshot}
      run={run}
      view={view}
      module={entry.output.module}
    />,
  );
}

describe("coded registers leave the module page", () => {
  it("keeps readable sections and removes coded and audit sections", () => {
    const entry = cp1();
    expect(findingBlocks(entry.sections, entry).map((s) => s.heading)).toEqual([
      "Bottom line",
      "Leverage and coverage: what the numbers say",
      "Limitations",
      "Segment schedule",
      "Net debt data",
      "Financials and credit metrics",
    ]);
    expect(recordSections(entry.sections, entry).map((s) => s.heading)).toEqual([
      "T4.2 Entity period key",
      "T4.4 Income statement",
      "T4.5 Cash flow statement",
      "T4.6 Balance sheet",
      "T4.18 Debt instruments",
      "T4.10 KPI dashboard",
      "T4.13 Readiness",
      "Confidence inputs",
    ]);
  });

  it("draws Statements and records closed, then its tables by name and links into Evidence, with no register code", () => {
    const entry = cp1();
    const { container } = page(entry);
    expect(screen.getByRole("heading", { name: "Statements and records" })).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Show records" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "Income statement" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Confidence inputs" })).toBeNull();
    openRecords();
    expect(screen.getByRole("button", { name: "Hide records" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Every statement is a table of its own, chosen by name under its record kind: one row of
    // tabs, however many tables the kind holds.
    expect(screen.queryByRole("option")).toBeNull();
    const tables = within(screen.getByRole("group", { name: "Table" }));
    for (const label of [
      "Income statement",
      "Cash flow statement",
      "Balance sheet",
      "Debt instruments",
      "KPI dashboard",
      "Readiness",
    ]) {
      fireEvent.click(tables.getByRole("button", { name: label }));
      expect(tables.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("heading", { name: label, level: 4 })).toBeInTheDocument();
    }
    // The registers kept in Evidence are listed by name and link to their place there.
    const held = within(screen.getByRole("list", { name: "Held in Evidence" }));
    for (const [label, heading] of [
      ["Entity period key", "T4.2 Entity period key"],
      ["Confidence inputs", "Confidence inputs"],
    ] as const) {
      const line = entry.sections.find((s) => s.heading === heading)?.line ?? -1;
      expect(held.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        evidencePath("retained case", entry, line),
      );
    }
    expect(screen.getByRole("link", { name: "Open this module in Evidence" })).toHaveAttribute(
      "href",
      evidencePath("retained case", entry),
    );
    expect(container.textContent).not.toContain("T4.4");
    expect(container.textContent).not.toContain("T4.2");
  });

  it("draws no Statements and records heading in the overview", () => {
    const entry = cp1();
    render(
      <ReportFindings
        snapshot={{ chips: {} } as Snapshot}
        run={{ folder: "retained case", issuer: "Issuer", asOf: "2026-10-31" } as PublishedRun}
        entry={entry}
        entryIndex={0}
        overview
      />,
    );
    expect(screen.queryByRole("heading", { name: "Statements and records" })).toBeNull();
  });

  it("draws the records region when every section is a record, and lists it on the page", () => {
    const entry = entryOf("CP-1", [
      tableSection("T4.4 Income statement", 20),
      tableSection("Confidence inputs", 30),
    ]);
    page(entry);
    expect(screen.getByRole("heading", { name: "Statements and records" })).toBeInTheDocument();
    const sections = within(screen.getByRole("list", { name: "On this page" }));
    expect(sections.getByRole("button", { name: "Statements and records" })).toBeInTheDocument();
    openRecords();
    expect(screen.getByRole("heading", { name: "Income statement", level: 4 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Confidence inputs" })).toHaveAttribute(
      "href",
      evidencePath("retained case", entry, 30),
    );
  });

  it("lists nothing as held in Evidence for a module without coded registers", () => {
    page(entryOf("CP-1", [text("Bottom line", 10), tableSection("Segment schedule", 20)]));
    openRecords();
    expect(screen.getByRole("heading", { name: "Segment schedule", level: 4 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Held in Evidence" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Open this module in Evidence" })).toBeNull();
  });

  it("still promotes a monitoring register in CP-2A", () => {
    const monitoring: Section = {
      heading: "T2B.7 Monitoring sensitivity flags",
      level: 3,
      line: 20,
      blocks: [
        {
          type: "table",
          headers: [
            "Indicator",
            "Leading / Lagging",
            "Threshold or Qualitative Signal",
            "Limitation",
          ],
          line: 21,
          rows: [
            { line: 22, cells: ["Cover", "Leading", "Below 3x", "Indicative"] },
            { line: 23, cells: ["Rating", "Lagging", "Downgrade", "Indicative"] },
          ],
        },
      ],
    };
    const entry = entryOf("CP-2A", [monitoring]);
    expect(findingBlocks(entry.sections, entry).map((s) => s.heading)).toEqual([
      monitoring.heading,
    ]);
    expect(recordSections(entry.sections, entry)).toEqual([]);
  });
});

// Sentences copied from tests/fixtures/esg/CP-2E-h4.md lines 132-136 and 223-234 (retained TDG handoff).
const DEBT_SENTENCE =
  "All debt amounts below retain the annual filing's reporting precision. Credit-spread exposure remains even where the base rate is hedged; instrument-specific allocation of portfolio derivatives is not supplied.";
const MACRO_SENTENCE =
  "Macro Risk Level is Moderate. Current fixed coupons and effective derivatives limit a defined rate shock relative to historical FCF, but inflation recovery and future hedge replacement are not assured. Rates, FX & hedging is completed with limitations; numerical FX/input-cost shocks and a single reconciled forward interest result remain restricted.";
const codedWith = (heading: string, line: number, body: string, headers: string[]): Section => ({
  heading,
  level: 4,
  line,
  blocks: [
    { type: "text", line: line + 2, end: line + 3, text: `${body}\nBasis: calculation C07` },
    {
      type: "table",
      headers,
      line: line + 5,
      rows: [{ line: line + 7, cells: headers.map(() => "cell") }],
    },
  ],
});
const monitoringTable = (line: number): Section["blocks"][number] => ({
  type: "table",
  headers: ["Indicator", "Leading / Lagging", "Threshold or Qualitative Signal", "Limitation"],
  line,
  rows: [{ line: line + 1, cells: ["Cover", "Leading", "Below 3x", "Indicative"] }],
});

describe("prose in a coded section goes with its table", () => {
  const coded = () =>
    entryOf("CP-2E", [
      text("Bottom line", 10),
      codedWith("T2F.2 \u2014 debt and rate exposure", 132, DEBT_SENTENCE, [
        "Debt Instrument",
        "Amount",
        "Fixed / Floating",
      ]),
      codedWith("T2F.8 \u2014 macro sensitivity summary", 223, MACRO_SENTENCE, [
        "Macro Driver",
        "Evidence",
        "Risk Mechanic",
      ]),
    ]);

  it("draws a table's note with its table, once, under the title without the code and its dash", () => {
    page(coded());
    // Closed, the page draws neither the tables nor their notes: a note belongs to its table.
    expect(screen.queryByText(DEBT_SENTENCE)).toBeNull();
    expect(screen.queryByRole("region", { name: "Debt and rate exposure" })).toBeNull();
    openRecords();
    expect(screen.getAllByText(DEBT_SENTENCE)).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Debt and rate exposure" })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("T2F.2");
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeInTheDocument();
  });

  it("keeps the table of a coded section in the closed records, named without the code or dash", () => {
    page(coded());
    expect(screen.queryByRole("columnheader", { name: "Amount" })).toBeNull();
    openRecords();
    const tables = within(screen.getByRole("group", { name: "Table" }));
    expect(tables.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Debt and rate exposure",
      "Macro sensitivity summary",
    ]);
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Statements and records" }).textContent).not.toMatch(
      /T2F|\u2014/,
    );
    // The note is drawn once, with its table.
    expect(screen.getAllByText(DEBT_SENTENCE)).toHaveLength(1);
  });

  it("keeps a promoted section whole in the records when the module's lead draws its figures", () => {
    const section: Section = {
      heading: "T2B.7 Monitoring sensitivity flags",
      level: 3,
      line: 20,
      blocks: [
        monitoringTable(21),
        { type: "text", line: 25, end: 25, text: "Thresholds are indicative only." },
      ],
    };
    const entry = entryOf("CP-2A", [section]);
    page(entry);
    // Downside's lead draws the module's figures, so the frame promotes no table into the flow: the
    // section, its words and its table, waits in the records, drawn once when they are opened.
    expect(screen.queryByText("Thresholds are indicative only.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show records" }));
    expect(screen.getAllByText("Thresholds are indicative only.")).toHaveLength(1);
    expect(recordSections(entry.sections, entry)).toEqual([]);
  });

  it("lists a partly promoted section that has another table not drawn", () => {
    const other: Section["blocks"][number] = {
      type: "table",
      headers: ["Item", "Value"],
      line: 30,
      rows: [{ line: 31, cells: ["Row", "1"] }],
    };
    const section: Section = {
      heading: "T2B.7 Monitoring sensitivity flags",
      level: 3,
      line: 20,
      blocks: [monitoringTable(21), other],
    };
    const entry = entryOf("CP-2A", [section]);
    expect(recordSections(entry.sections, entry).map((s) => s.line)).toEqual([20]);
    expect(findingBlocks(entry.sections, entry)[0]?.blocks.map((b) => b.line)).toEqual([21]);
  });

  it("does not list a coded section that holds text only", () => {
    const entry = entryOf("CP-1", [text("T4.9 Reading note", 20)]);
    expect(recordSections(entry.sections, entry)).toEqual([]);
    expect(findingBlocks(entry.sections, entry).map((s) => s.blocks.length)).toEqual([1]);
  });

  it("keeps handoff order between the sentence and a promoted table", () => {
    const section: Section = {
      heading: "T2B.7 Monitoring sensitivity flags",
      level: 3,
      line: 20,
      blocks: [
        { type: "text", line: 21, end: 21, text: "First prose." },
        monitoringTable(23),
        { type: "text", line: 26, end: 26, text: "Last prose." },
      ],
    };
    const entry = entryOf("CP-2A", [section]);
    expect(findingBlocks(entry.sections, entry)[0]?.blocks.map((b) => b.line)).toEqual([
      21, 23, 26,
    ]);
  });

  it("strips the dash after a code from record labels, hyphen or em dash", () => {
    page(
      entryOf("CP-2E", [
        tableSection("T2F.3 - Hedge schedule", 20),
        tableSection("T3.6 \u2014 Fundamental value matrix", 30),
      ]),
    );
    openRecords();
    const tables = within(screen.getByRole("group", { name: "Table" }));
    expect(tables.getByRole("button", { name: "Hedge schedule" })).toBeInTheDocument();
    expect(tables.getByRole("button", { name: "Fundamental value matrix" })).toBeInTheDocument();
  });
});

describe("wide tables pin their first column", () => {
  const wide = (count: number): Table => ({
    type: "table",
    headers: Array.from({ length: count }, (_, i) => `H${String(i)}`),
    line: 1,
    rows: [{ line: 2, cells: Array.from({ length: count }, (_, i) => `v${String(i)}`) }],
  });
  it("sticks the first column at five columns", () => {
    render(<PublishedTable table={wide(5)} />);
    // From sm up only: below it the table scrolls whole, so the first column never pins.
    expect(screen.getByRole("columnheader", { name: "H0" })).toHaveClass(
      "sm:sticky",
      "sm:min-w-56",
    );
    expect(screen.getByRole("columnheader", { name: "H0" })).not.toHaveClass("sticky");
    expect(screen.getByRole("columnheader", { name: "H0" })).not.toHaveClass("min-w-56");
    expect(screen.getByRole("cell", { name: "v0" })).toHaveClass("sm:sticky");
    expect(screen.getByRole("cell", { name: "v0" })).not.toHaveClass("sticky");
    expect(screen.getByRole("columnheader", { name: "H1" })).not.toHaveClass("sm:sticky");
  });
  it("leaves four columns unchanged", () => {
    render(<PublishedTable table={wide(4)} />);
    expect(screen.getByRole("columnheader", { name: "H0" })).not.toHaveClass("sticky");
    expect(screen.getByRole("columnheader", { name: "H0" })).not.toHaveClass("sm:sticky");
    expect(screen.getByRole("cell", { name: "v0" })).not.toHaveClass("sticky");
  });
});

describe("scrollable table wrappers", () => {
  const columns = (count: number): Table => ({
    type: "table",
    headers: Array.from({ length: count }, (_, i) => `H${String(i)}`),
    line: 1,
    rows: [{ line: 2, cells: Array.from({ length: count }, (_, i) => `v${String(i)}`) }],
  });
  it("is a focusable region named by the section heading at five columns", () => {
    render(<PublishedTable table={columns(5)} heading="Net debt data" />);
    expect(screen.getByRole("region", { name: "Net debt data" })).toHaveAttribute("tabindex", "0");
  });
  it("is named Table when the caller passes no heading", () => {
    render(<PublishedTable table={columns(5)} />);
    expect(screen.getByRole("region", { name: "Table" })).toHaveAttribute("tabindex", "0");
  });
  it("gives a narrow table no role, no tab stop and no label", () => {
    const { container } = render(<PublishedTable table={columns(4)} heading="Net debt data" />);
    expect(screen.queryByRole("region")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(container.querySelector("[aria-label]")).toBeNull();
  });
  it("labels the region with the heading as drawn, without Markdown marks", () => {
    const section: Section = {
      heading: "Chart data: **Net** `debt`",
      level: 3,
      line: 40,
      blocks: [columns(5)],
    };
    const entry: OutputEntry = {
      selected: true,
      output: { id: "o", module: "CP-1", label: "o", href: "", sha256: "o".repeat(64) },
      sections: [FINDINGS, section],
    };
    render(
      <ReportFindings
        snapshot={{ chips: {} } as Snapshot}
        run={{ folder: "f", issuer: "I", asOf: "2026-10-31" } as PublishedRun}
        entry={entry}
        entryIndex={0}
      />,
    );
    expect(screen.getByRole("region", { name: "Net debt" })).toBeInTheDocument();
  });
});

describe("section headings drawn from handoff text", () => {
  it("start with a capital by CSS and keep the DOM text", () => {
    const section = text("stress scenario", 40);
    const entry: OutputEntry = {
      selected: true,
      output: { id: "o", module: "CP-1", label: "o", href: "", sha256: "o".repeat(64) },
      sections: [FINDINGS, section],
    };
    render(
      <ReportFindings
        snapshot={{ chips: {} } as Snapshot}
        run={{ folder: "f", issuer: "I", asOf: "2026-10-31" } as PublishedRun}
        entry={entry}
        entryIndex={0}
      />,
    );
    const heading = screen.getByRole("heading", { name: "stress scenario" });
    expect(heading.textContent).toBe("stress scenario");
    expect(heading).toHaveClass("first-letter:uppercase");
  });
});

describe("module page continuation paragraphs", () => {
  it("sit inside one card after the verdict band", () => {
    const entry: OutputEntry = {
      selected: true,
      output: { id: "o", module: "CP-1", label: "o", href: "", sha256: "o".repeat(64) },
      sections: [
        FINDINGS,
        {
          heading: "Bottom line",
          level: 3,
          line: 10,
          blocks: [
            { type: "text", line: 11, end: 11, text: "The verdict." },
            { type: "text", line: 12, end: 12, text: "First continuation." },
            { type: "text", line: 13, end: 13, text: "Second continuation." },
          ],
        },
      ],
    };
    render(
      <ReportFindings
        snapshot={{ chips: {} } as Snapshot}
        run={{ folder: "f", issuer: "I", asOf: "2026-10-31" } as PublishedRun}
        entry={entry}
        entryIndex={0}
      />,
    );
    const card = screen.getByText("First continuation.").closest("div.bg-surface-card");
    expect(card).not.toBeNull();
    expect(card).toContainElement(screen.getByText("Second continuation."));
    expect(card).not.toContainElement(screen.getByRole("region", { name: "Bottom line" }));
  });
});

describe("the trace of the forecast inputs", () => {
  it("names the recorded inputs with a value, so the drawer does not hatch it as a gap", () => {
    const entry = entryOf("CP-2G", [text(FORECAST_INPUTS, 10)]);
    const trace = traceForLine({ chips: {} } as Snapshot, entry, 0, 11);
    const recorded = trace?.derivation.children.find(
      (child) => child.label === "Recorded forecast inputs",
    );
    expect(recorded).toBeDefined();
    expect(recorded?.value).not.toBeNull();
  });
});
