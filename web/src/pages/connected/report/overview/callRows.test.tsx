import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { CallRow } from "./CallRow";
import { FigureRow } from "./FigureRow";
import { JudgementRow } from "./JudgementRow";

afterEach(cleanup);

/** A line by its whole text, where part of it (the change) sits in its own no-wrap span. */
const wholeLine = (content: string) => (_: string, element: Element | null) =>
  element?.tagName === "P" && element.textContent === content;

let line = 0;
const text = (heading: string, ...paragraphs: string[]): Section => ({
  heading,
  level: 3,
  line: (line += 1),
  blocks: paragraphs.map((paragraph) => ({
    type: "text" as const,
    line: (line += 1),
    end: line,
    text: paragraph,
  })),
});
const table = (heading: string, headers: string[], ...rows: string[][]): Section => ({
  heading,
  level: 3,
  line: (line += 1),
  blocks: [
    {
      type: "table" as const,
      line: (line += 1),
      headers,
      rows: rows.map((cells) => ({ line: (line += 1), cells })),
    },
  ],
});

function entry(
  module: string,
  sections: Section[],
  confidence?: { value: number; band: string },
): OutputEntry {
  return {
    output: {
      id: `${module}-1`,
      module,
      label: module,
      href: `${module}.md`,
      sha256: "a".repeat(64),
      ...(confidence && { confidence }),
    },
    sections: [
      { heading: module, level: 1, line: (line += 1), blocks: [] },
      { heading: "Findings", level: 2, line: (line += 1), blocks: [] },
      ...sections,
    ],
    selected: true,
  };
}

const run = {
  folder: "run-1",
  issuer: "Northbridge",
  title: "Full credit assessment",
  period: "As of 2025-03-31",
  asOf: "2025-03-31",
  pathway: null,
  modules: {},
  changes: { first_run: true },
} as unknown as PublishedRun;
const snapshot = { workspace: { runs: {} } } as unknown as Snapshot;

function view(entries: OutputEntry[], lead?: OutputEntry): ReportView {
  return {
    folder: run.folder,
    entries,
    lead,
    modules: entries.map(({ output }) => ({
      id: output.module,
      name: output.module,
      state: "Delivered",
      outputs: [],
    })),
    models: [],
    catalogue: undefined,
  } as unknown as ReportView;
}

/** The run as a verified publication whose published lead is the entry's first bottom-line paragraph. */
function published(base: PublishedRun, lead: OutputEntry, heading = "Bottom line"): PublishedRun {
  const block = lead.sections
    .find((section) => section.heading === heading)
    ?.blocks.find((item) => item.type === "text");
  if (block?.type !== "text") throw new Error("fixture");
  return {
    ...base,
    publicationVerified: true,
    lead: {
      module: lead.output.module,
      output: lead.output.id,
      sha256: lead.output.sha256,
      line: block.line,
      text: block.text,
    },
  };
}

const credit = () =>
  entry(
    "CP-2",
    [
      text("Bottom line", "Gross leverage rose to 6.53x despite stronger earnings."),
      text(
        "Key findings",
        "Distributions exceed free cash flow.",
        "The view follows annual_report.pdf.",
      ),
      text("Contrary evidence and what would change the view", "Cash generation improved."),
    ],
    { value: 53, band: "Low" },
  );

const committee = () =>
  entry(
    "CP-6",
    [
      text("Bottom line", "Gross leverage rose to 6.53x despite stronger earnings."),
      text(
        "Key findings",
        "Distributions exceed free cash flow.",
        "The view follows annual_report.pdf.",
      ),
      text("Contrary evidence and what would change the view", "Cash generation improved."),
      text("Decision", "Final Action Bias: Watchlist. The secured layer is watched."),
    ],
    { value: 53, band: "Low" },
  );

const foundation = () =>
  entry("CP-1", [
    table(
      "Period table",
      ["Period", "Start", "End"],
      ["FY2023", "2023-01-01", "2023-12-31"],
      ["FY2024", "2024-01-01", "2024-12-31"],
    ),
    table(
      "Chart data: leverage",
      ["Period", "Total debt / EBITDA", "Net debt / EBITDA", "Reporting unit", "Basis"],
      ["FY2023", "3.75", "3.00", "x", "Stated."],
      ["FY2024", "2.80", "2.25", "x", "Stated."],
    ),
    table(
      "Chart data: interest cover",
      ["Period", "EBITDA / cash interest", "Reporting unit", "Basis"],
      ["FY2023", "3.20", "x", "Stated."],
      ["FY2024", "4.00", "x", "Stated."],
    ),
    table(
      "Chart data: liquidity",
      ["Period", "Cash", "Undrawn committed facilities", "Reporting unit", "Basis"],
      ["FY2023", "300", "450", "US$m", "Stated."],
      ["FY2024", "275", "400", "US$m", "Stated."],
    ),
    table(
      "Chart data: revenue and EBITDA",
      ["Period", "Revenue", "Adjusted EBITDA", "Reporting unit", "Basis"],
      ["FY2023", "2,100", "410", "US$m", "Stated."],
      ["FY2024", "2,250", "Not supplied: the measure is not stated", "US$m", "Stated."],
    ),
  ]);

it("draws the call: the published credit view, the decisions not shown, confidence, clearance and the changes sentence", () => {
  const lead = credit();
  const decision = committee();
  const validation = entry("CP-5", [text("Bottom line", "Pass with Remediation.")]);
  const selection = entry("CP-3", [text("Bottom line", "Requires more work.")], {
    value: 56,
    band: "Low",
  });
  const ran = (id: string) => ({ outputs: [`${id}-1`], default: `${id}-1` });
  const ranAll = published(
    {
      ...run,
      modules: {
        "CP-2": ran("CP-2"),
        "CP-3": ran("CP-3"),
        "CP-5": ran("CP-5"),
        "CP-6": ran("CP-6"),
      },
    },
    lead,
  );
  render(
    <CallRow
      snapshot={snapshot}
      run={ranAll}
      view={view([lead, decision, validation, selection], lead)}
    />,
  );
  const call = screen.getByRole("region", { name: "The call" });
  expect(
    within(call).getByRole("heading", { name: "The call · Fundamental credit" }),
  ).toBeVisible();
  expect(
    within(call).getByText("Gross leverage rose to 6.53x despite stronger earnings."),
  ).toHaveClass("lg:text-display");
  // No decision is drawn: no run records a clearance for one, so each says why.
  expect(screen.queryByText(/Watchlist|Requires more work|Pass with Remediation/)).toBeNull();
  const decisions = within(call).getByLabelText("Decisions");
  expect(within(decisions).getByText("Committee action and size")).toBeVisible();
  expect(within(decisions).getByText("Instrument preference")).toBeVisible();
  expect(
    within(decisions).getByText(/does not show a bottom line for the Committee decision module/),
  ).toBeVisible();
  expect(within(call).getByText("4 · all delivered")).toBeVisible();
  const confidence = screen.getByRole("region", { name: "Confidence" });
  expect(within(confidence).getByText("53")).toBeVisible();
  expect(within(confidence).getByText("Low").className).not.toMatch(/warning|success|error/);
  expect(within(confidence).getByText("Fundamental credit 53")).toBeInTheDocument();
  expect(within(confidence).getByText("Security selection 56 · Low")).toBeInTheDocument();
  const clearance = screen.getByRole("region", { name: "Evidence clearance" });
  expect(
    within(clearance).getByText(
      "This page does not show Evidence validation's bottom line: no clearance for it is recorded.",
    ),
  ).toBeVisible();
  expect(within(clearance).getByRole("link", { name: "Open Evidence validation" })).toHaveAttribute(
    "href",
    "#modules/CP-5",
  );
  expect(
    within(screen.getByRole("region", { name: "Since the earlier run" })).getByText(
      "No earlier run to compare.",
    ),
  ).toBeVisible();
});

it("draws each missing part of the call as a gap, with no score or stance invented", () => {
  render(<CallRow snapshot={snapshot} run={{ ...run, changes: null }} view={view([])} />);
  expect(
    screen.getByText(
      "A verified credit view is unavailable for this run. Each module's findings are under Modules.",
    ),
  ).toBeVisible();
  expect(screen.getByText("No confidence score was recorded for this credit view.")).toBeVisible();
  expect(screen.getByText("Evidence validation is not part of this run.")).toBeVisible();
  expect(
    screen.getByText("No comparison with an earlier run is shown for this run."),
  ).toBeVisible();
  expect(screen.queryByText("Watchlist")).toBeNull();
  expect(screen.queryByText(/^\d+$/)).toBeNull();
});

it("draws the published credit view and no stance", () => {
  const lead = entry("CP-2", [text("Bottom line", "Credit is stable.")]);
  render(<CallRow snapshot={snapshot} run={published(run, lead)} view={view([lead], lead)} />);
  expect(screen.getByText("Credit is stable.")).toBeVisible();
  expect(screen.queryByText(/Watchlist|Avoid|Starter Position|Requires More Work/)).toBeNull();
});

it("draws no credit view the publication does not name, even from the lead module", () => {
  const lead = entry("CP-2", [text("Bottom line", "Credit is stable.")]);
  render(<CallRow snapshot={snapshot} run={run} view={view([lead], lead)} />);
  expect(screen.queryByText("Credit is stable.")).toBeNull();
  expect(screen.getByText(/A verified credit view is unavailable for this run/)).toBeVisible();
});

it("starts the call at the published paragraph and names the passage it is from", () => {
  const lead = entry("CP-2", [text("Credit view", "Leverage is the risk.", "Cover holds.")]);
  render(
    <CallRow
      snapshot={snapshot}
      run={published(run, lead, "Credit view")}
      view={view([lead], lead)}
    />,
  );
  const call = screen.getByRole("region", { name: "The call" });
  expect(within(call).getByText("Credit view")).toBeVisible();
  expect(within(call).getByText("Leverage is the risk.")).toBeVisible();
});

it("draws the headline figures from the foundation's chart tables, each with its own mark", () => {
  const cp1 = foundation();
  render(<FigureRow snapshot={snapshot} run={run} view={view([cp1])} />);
  const gross = screen.getByRole("region", { name: "Total debt / EBITDA" });
  expect(within(gross).getByText("2.80x", { selector: "span" })).toBeVisible();
  expect(within(gross).getByText(wholeLine("from 3.75x in FY2023 (-0.95x)"))).toBeVisible();
  expect(within(gross).getByText("Better")).toBeVisible();
  expect(
    within(gross).getByRole("img", {
      name: "Total debt / EBITDA: 3.75x in FY2023, 2.80x in FY2024.",
    }),
  ).toBeVisible();
  const net = screen.getByRole("region", { name: "Net debt / EBITDA" });
  expect(within(net).getByText("2.25x", { selector: "span" })).toBeVisible();
  expect(
    within(screen.getByRole("region", { name: "Revenue" })).getByText("US$2,250m"),
  ).toBeVisible();
  const cash = screen.getByRole("region", { name: "Cash" });
  expect(
    within(cash).getByRole("img", {
      name: "Cash US$275m beside Undrawn committed facilities US$400m in FY2024.",
    }),
  ).toBeVisible();
  const marks = screen.getAllByRole("img").map((mark) => mark.getAttribute("viewBox"));
  expect(marks).toHaveLength(5);
});

it("draws a figure the module did not supply as a gap in its own words, never as a number", () => {
  render(<FigureRow snapshot={snapshot} run={run} view={view([foundation()])} />);
  const ebitda = screen.getByRole("region", { name: "Adjusted EBITDA" });
  expect(within(ebitda).getByText("Not supplied", { selector: "span" })).toBeVisible();
  expect(within(ebitda).queryByText("n.a.")).toBeNull();
  expect(within(ebitda).getByText("FY2024: the measure is not stated")).toBeVisible();
  expect(within(ebitda).getByText("US$410m in FY2023")).toBeVisible();
  expect(within(ebitda).queryByRole("img")).toBeNull();
  expect(within(ebitda).queryByText(/Better|Worse/)).toBeNull();
  expect(within(ebitda).queryByText(/US\$0m|NaN/)).toBeNull();
});

it("draws one gap for the whole row when the foundation did not run", () => {
  render(<FigureRow snapshot={snapshot} run={run} view={view([])} />);
  expect(
    screen.getByText(
      "Not established for this run: the financial foundation has no figures to draw.",
    ),
  ).toBeVisible();
  expect(screen.queryByRole("img")).toBeNull();
});

it("draws a missing chart table as that tile's gap and keeps the others", () => {
  const cp1 = foundation();
  cp1.sections = cp1.sections.filter(({ heading }) => heading !== "Chart data: interest cover");
  render(<FigureRow snapshot={snapshot} run={run} view={view([cp1])} />);
  const cover = screen.getByRole("region", { name: "Interest cover" });
  expect(
    within(cover).getByText("The financial foundation has no 'interest cover' chart table."),
  ).toBeVisible();
  expect(cover).not.toHaveTextContent(/Not supplied/);
  expect(screen.getByRole("region", { name: "Total debt / EBITDA" })).toBeVisible();
});

it("numbers the lead's findings in its own words and links a paragraph that cites a source", () => {
  const lead = committee();
  render(<JudgementRow snapshot={snapshot} run={run} view={view([lead], lead)} />);
  const findings = screen.getByRole("region", { name: "Key findings" });
  const items = within(findings).getAllByRole("listitem");
  expect(items).toHaveLength(2);
  expect(items[0]).toHaveTextContent("01Distributions exceed free cash flow.");
  expect(within(findings).queryByText(/annual_report\.pdf/)).toBeNull();
  expect(
    within(findings).getByRole("link", { name: "Read this passage in Evidence" }),
  ).toBeVisible();
  const counter = screen.getByRole("region", {
    name: "Contrary evidence and what would change the view",
  });
  expect(counter).toHaveClass("bg-info-fill");
  expect(within(counter).getByText("Cash generation improved.")).toBeVisible();
  expect(screen.queryByRole("region", { name: "What would change the view" })).toBeNull();
  expect(
    within(counter).getByText(
      "The module does not separate the outcome resolved favourably from the one resolved adversely.",
    ),
  ).toBeVisible();
});

it("draws a passage the lead did not write as a gap, and nothing without a credit view", () => {
  const lead = entry("CP-2", [text("Bottom line", "Credit is stable.")]);
  const { unmount } = render(
    <JudgementRow snapshot={snapshot} run={run} view={view([lead], lead)} />,
  );
  expect(
    screen.getAllByText("Not established for this run. The module wrote no such passage."),
  ).toHaveLength(2);
  expect(screen.getByText(/does not separate the outcome resolved favourably/)).toBeVisible();
  unmount();
  const { container } = render(<JudgementRow snapshot={snapshot} run={run} view={view([])} />);
  expect(container).toBeEmptyDOMElement();
});

it("keeps the counter passage whole under its own heading, one trace per paragraph, and never splits it by position", () => {
  const lead = entry("CP-6", [
    text(
      "Contrary evidence and what would change the view",
      "Cash generation improved.",
      "Liquidity is thin.",
      "A refinancing of the 2028 notes would soften the view.",
    ),
  ]);
  render(<JudgementRow snapshot={snapshot} run={run} view={view([lead], lead)} />);
  const counter = screen.getByRole("region", {
    name: "Contrary evidence and what would change the view",
  });
  expect(within(counter).getByText("Cash generation improved.")).toBeVisible();
  expect(within(counter).getByText("Liquidity is thin.")).toBeVisible();
  expect(
    within(counter).getByText("A refinancing of the 2028 notes would soften the view."),
  ).toBeVisible();
  expect(within(counter).getAllByRole("link", { name: /^Source for / })).toHaveLength(3);
  expect(screen.queryByRole("region", { name: "What would change the view" })).toBeNull();
  expect(within(counter).getAllByText(/Liquidity is thin/)).toHaveLength(1);
  expect(
    within(counter).getByText(/does not separate the outcome resolved favourably/),
  ).toBeVisible();
});

function compared(currentBias: string | null, priorBias: string | null, bottom: string) {
  const prior = { ...run, folder: "run-0", asOf: "2024-03-31", issuerKey: "nb" } as PublishedRun;
  const current = {
    ...run,
    issuerKey: "nb",
    pathway: "full",
    changes: {
      pack: {
        prior: { run: "run-0", as_of: "2024-03-31", pathway: "full" },
        current: { as_of: "2025-03-31", pathway: "full" },
      },
    },
  } as unknown as PublishedRun;
  prior.pathway = "full";
  prior.modules = priorBias ? { "CP-6": { outputs: ["run-0/cp6"], default: "run-0/cp6" } } : {};
  const snap = {
    catalogue: { real: [] },
    workspace: {
      runs: { k0: prior, k1: current },
      outputs: {
        "run-0/cp6": {
          id: "run-0/cp6",
          run: "k0",
          module: "CP-6",
          sha256: "p".repeat(64),
          label: "CP-6",
          href: "",
        },
      },
      handoffs: {
        ["p".repeat(64)]: [
          {
            heading: "Decision",
            level: 3,
            line: 2,
            blocks: [
              {
                type: "text",
                line: 3,
                end: 3,
                text: `Final Action Bias: ${String(priorBias)}. R.`,
              },
            ],
          },
        ],
      },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
  const lead = entry(
    "CP-6",
    currentBias ? [text("Decision", `Final Action Bias: ${currentBias}. Watched.`)] : [],
  );
  const changes = entry("CP-8", [text("Bottom line", bottom)]);
  return { snap, current, lead, changes };
}

it("draws no changes sentence and no stance move, only the way to Changes", () => {
  const { snap, current, lead, changes } = compared(
    "Watchlist",
    "Requires More Work",
    "About the same: the credit picture has not changed.",
  );
  render(<CallRow snapshot={snap} run={current} view={view([lead, changes], lead)} />);
  const tile = screen.getByRole("region", { name: "Since the earlier run" });
  expect(within(tile).queryByText(/Watchlist|Requires More Work|stance/i)).toBeNull();
  expect(within(tile).queryByText(/About the same/)).toBeNull();
  expect(
    within(tile).getByText("A comparison with the earlier run is on the Changes page."),
  ).toBeVisible();
});

it("gives the reason in place when the comparison does not stand", () => {
  const mismatched = {
    ...run,
    changes: {
      pack: null,
      problem: "The comparison does not match the listed issuer, dates and pathway.",
    },
  } as unknown as PublishedRun;
  render(<CallRow snapshot={snapshot} run={mismatched} view={view([])} />);
  const tile = screen.getByRole("region", { name: "Since the earlier run" });
  expect(
    within(tile).getByText("The comparison does not match the listed issuer, dates and pathway."),
  ).toBeVisible();
});

it("heads the confidence, clearance and since-earlier tiles with real headings", () => {
  const lead = committee();
  render(<CallRow snapshot={snapshot} run={run} view={view([lead], lead)} />);
  for (const name of ["Confidence", "Evidence clearance", "Since the earlier run"])
    expect(
      within(screen.getByRole("region", { name })).getByRole("heading", { level: 3, name }),
    ).toBeVisible();
});

it("never prints a gap reason that cites a source, and never calls words the module wrote a missing figure", () => {
  const cp1 = foundation();
  const revenue = cp1.sections.find(({ heading }) => heading === "Chart data: revenue and EBITDA");
  const block = revenue?.blocks[0];
  if (block?.type !== "table") throw new Error("fixture");
  const reference =
    "Not supplied: not stated in northbridge-filing.txt page 4 [E3] CP-1-GAP-12 0123456789abcdef";
  (block.rows[1] as { cells: string[] }).cells[2] = reference;
  const { unmount } = render(<FigureRow snapshot={snapshot} run={run} view={view([cp1])} />);
  const ebitda = screen.getByRole("region", { name: "Adjusted EBITDA" });
  expect(within(ebitda).getByText("FY2024: not supplied")).toBeVisible();
  expect(ebitda).not.toHaveTextContent(/northbridge-filing|CP-1|GAP-12|0123456789abcdef/);
  unmount();
  (block.rows[1] as { cells: string[] }).cells[2] = "approximately 410";
  render(<FigureRow snapshot={snapshot} run={run} view={view([cp1])} />);
  const words = screen.getByRole("region", { name: "Adjusted EBITDA" });
  expect(within(words).getByText("No figure", { selector: "span" })).toBeVisible();
  expect(within(words).queryByText("n.a.")).toBeNull();
  expect(
    within(words).getByText("FY2024: not shown here, the cell is not one figure"),
  ).toBeVisible();
  expect(words).not.toHaveTextContent(/not supplied/i);
});
