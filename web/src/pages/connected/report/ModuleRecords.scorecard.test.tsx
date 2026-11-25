/**
 * CP-2's credit scorecard registers (T2.13 Credit scorecard, T2.14 Credit assessment) on the
 * Fundamental credit module page. Scope: synthetic sections in the shape the issuer library's
 * parser gives a handoff (tests/test_cp2_scorecard.py checks that shape); no model wrote them.
 * Nothing here is built for the scorecard: the page's generic records region draws both tables.
 */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RunContext } from "@/pages/library/parts/RunContext";
import {
  evidencePath,
  type OutputEntry,
  type Section,
  type Snapshot,
  type Table,
} from "../publishedReport";
import { sectionTraces } from "../ReportContent";
import { ModuleRecords } from "./ModuleRecords";
import { moduleRecords } from "./moduleRecords";

afterEach(cleanup);

const table = (line: number, headers: string[], rows: string[][]): Table => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const section = (heading: string, level: number, line: number, blocks: Section["blocks"] = []) => ({
  heading,
  level,
  line,
  blocks,
});

// The ruling's 17 factors (owner, 2026-11-25, R9), typed by hand.
const FACTORS = [
  "Scale",
  "Market position",
  "Regulatory exposure",
  "Technology",
  "Barriers to entry",
  "Leverage",
  "Free cash flow",
  "Liquidity",
  "Rating trend",
  "Geographic diversification",
  "Product diversification",
  "Market share",
  "Customer concentration",
  "Market access",
  "Maturity profile",
  "Interest cover",
  "Financial policy",
];
const REFERENCE = "annual-report-2024.pdf, page 41";
const PLAIN_BASIS = "Net debt to EBITDA rose in each of the three periods";

/** Synthetic rows: Leverage states its evidence in words, Technology is not scored, the rest cite. */
function scorecardRows(basisOf: (factor: string) => string) {
  return FACTORS.map((factor) => {
    if (factor === "Technology") return [factor, "Not scored", "No evidence in this run"];
    return [factor, factor === "Leverage" ? "4" : "3", basisOf(factor)];
  });
}
const mixedBasis = (factor: string) => (factor === "Leverage" ? PLAIN_BASIS : REFERENCE);

const assessment = table(
  61,
  ["Assessment", "View", "Basis"],
  [
    ["Management", "Positive", "Guidance met in each of three years"],
    ["Sector Outlook", "Neutral", REFERENCE],
    ["Sponsor Quality", "Not assessed", "No sponsor: the issuer is listed and widely held"],
    ["Credit Direction", "Deteriorating", PLAIN_BASIS],
  ],
);

function sectionsOf(scorecard: Table, level = 3, parent: Section[] = []): Section[] {
  return [
    section("Findings", 2, 1),
    section("Bottom line", 3, 2, [{ type: "text", line: 3, end: 3, text: "Leverage rose." }]),
    section("Limitations", 3, 5, [{ type: "text", line: 6, end: 6, text: "- Synthetic only." }]),
    ...parent,
    section("T2.13 - Credit scorecard", level, 30, [scorecard]),
    section("T2.14 - Credit assessment", level, 59, [assessment]),
    section("Calculations", 2, 80),
    section("Gaps", 2, 85, [{ type: "text", line: 86, end: 86, text: "- Technology." }]),
  ];
}

const entryOf = (sections: Section[]): OutputEntry => ({
  selected: true,
  output: { id: "a", module: "CP-2", label: "a", href: "", sha256: "a".repeat(64) },
  sections,
});
const FOLDER = "synthetic-2025";

function draw(sections: Section[]) {
  const entry = entryOf(sections);
  const traces = sectionTraces({ chips: {} } as Snapshot, entry, entry.sections);
  const view = render(
    <RunContext.Provider value={{ traces, open: vi.fn() }}>
      <ModuleRecords run={{ folder: FOLDER }} entry={entry} />
    </RunContext.Provider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show records" }));
  return { entry, ...view };
}

const rowOf = (region: HTMLElement, label: string) => {
  const row = within(region)
    .getAllByRole("row")
    .find((item) => item.textContent.includes(label));
  if (!row) throw new Error(`no row for ${label}`);
  return row;
};

it("lists both registers as tables of the module page, by their names without the codes", () => {
  const scorecard = table(32, ["Factor", "Level", "Basis"], scorecardRows(mixedBasis));
  const records = moduleRecords(entryOf(sectionsOf(scorecard)));
  expect(records.tables.map(({ kind, title }) => [kind, title])).toEqual([
    ["statements", "Credit scorecard"],
    ["statements", "Credit assessment"],
  ]);
  expect(records.evidence).toEqual([]);
});

it("draws the scorecard: every factor, its level as written, and Basis only as the page allows", () => {
  const scorecard = table(32, ["Factor", "Level", "Basis"], scorecardRows(mixedBasis));
  const { entry, container } = draw(sectionsOf(scorecard));
  expect(
    within(screen.getByRole("group", { name: "Record kind" })).getByRole("button", {
      name: "Statements 2",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  const region = screen.getByRole("region", { name: "Credit scorecard" });
  expect(
    within(region)
      .getAllByRole("columnheader")
      .map((header) => header.textContent)
      .filter(Boolean),
  ).toEqual(["Factor", "Level", "Basis", "Sources"]); // "Sources": the page's trace control
  for (const factor of FACTORS) expect(within(region).getByText(factor)).toBeInTheDocument();
  expect(within(region).getAllByRole("row")).toHaveLength(FACTORS.length + 1);

  // A basis in words is the finding's evidence and is drawn as written.
  const leverage = rowOf(region, "Leverage");
  expect(within(leverage).getByText("4")).toBeInTheDocument();
  expect(within(leverage).getByText(PLAIN_BASIS)).toBeInTheDocument();
  // A basis that names a source is drawn as a link to that row in Evidence, never as its text.
  const scale = rowOf(region, "Scale");
  expect(within(scale).getByText("3")).toBeInTheDocument();
  const scaleLine = scorecard.rows[0]?.line;
  expect(within(scale).getByRole("link", { name: "In Evidence" })).toHaveAttribute(
    "href",
    evidencePath(FOLDER, entry, scaleLine),
  );
  expect(region.textContent).not.toContain("annual-report-2024.pdf");
  expect(region.textContent).not.toContain("page 41");
  // A factor left unscored reads as written; it is not a zero and not a blank.
  const technology = rowOf(region, "Technology");
  expect(within(technology).getByText("Not scored")).toBeInTheDocument();
  expect(within(technology).getByText("No evidence in this run")).toBeInTheDocument();
  // Levels are a scale, not amounts: no bar is drawn; the register code is not shown.
  expect(container.querySelector('[style*="width"]')).toBeNull();
  expect(document.body.textContent).not.toContain("T2.13");
  expect(document.body.textContent).not.toContain("T2.14");
  // One trace control per row.
  for (const factor of FACTORS)
    expect(
      within(rowOf(region, factor)).getAllByRole("button", {
        name: `Show sources for ${factor}`,
      }),
    ).toHaveLength(1);
});

it("leaves out a Basis column that holds only source references and says where it is", () => {
  const scorecard = table(
    32,
    ["Factor", "Level", "Basis"],
    FACTORS.map((factor) => [factor, "3", REFERENCE]),
  );
  draw(sectionsOf(scorecard));
  const region = screen.getByRole("region", { name: "Credit scorecard" });
  expect(
    within(region)
      .getAllByRole("columnheader")
      .map((header) => header.textContent)
      .filter(Boolean),
  ).toEqual(["Factor", "Level", "Sources"]);
  expect(screen.getByText("Basis: in Evidence, by row.")).toBeInTheDocument();
  expect(document.body.textContent).not.toContain("annual-report-2024.pdf");
});

it("draws the four assessment cells with their views as written", () => {
  const scorecard = table(32, ["Factor", "Level", "Basis"], scorecardRows(mixedBasis));
  draw(sectionsOf(scorecard));
  fireEvent.click(
    within(screen.getByRole("group", { name: "Table" })).getByRole("button", {
      name: "Credit assessment",
    }),
  );
  const region = screen.getByRole("region", { name: "Credit assessment" });
  const views = [
    ["Management", "Positive"],
    ["Sector Outlook", "Neutral"],
    ["Sponsor Quality", "Not assessed"],
    ["Credit Direction", "Deteriorating"],
  ] as const;
  for (const [name, view] of views)
    expect(within(rowOf(region, name)).getByText(view)).toBeInTheDocument();
  expect(
    within(rowOf(region, "Management")).getByText("Guidance met in each of three years"),
  ).toBeInTheDocument();
  expect(
    within(rowOf(region, "Sector Outlook")).getByRole("link", { name: "In Evidence" }),
  ).toBeInTheDocument();
  expect(region.textContent).not.toContain("annual-report-2024.pdf");
});

it("holds the registers in Evidence when they are nested under the appendix heading", () => {
  // Why CP-2 is told to write each as its own `###` heading in Findings, and why the launcher
  // refuses the nested form (deploy_workflow.cp2_scorecard `_misplaced`).
  const scorecard = table(32, ["Factor", "Level", "Basis"], scorecardRows(mixedBasis));
  const appendix = section("Analytical appendix — complete canonical registers", 3, 20);
  const records = moduleRecords(entryOf(sectionsOf(scorecard, 4, [appendix])));
  expect(records.tables).toEqual([]);
  expect(records.evidence.map(({ title }) => title)).toEqual([
    "Credit scorecard",
    "Credit assessment",
  ]);
});
