import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot, Table } from "../publishedReport";
import type { ReportView } from "../reportView";
import type { LeadProps } from "./leads/types";
import { Modules } from "./Modules";

const lead = vi.hoisted(() => ({
  current: undefined as undefined | ((props: LeadProps) => unknown),
}));
vi.mock("./leads", () => ({ leadFor: () => lead.current }));

afterEach(cleanup);
beforeEach(() => {
  lead.current = undefined;
});

const table = (line: number, headers: string[], rows: string[][]): Table => ({
  type: "table",
  line,
  headers,
  rows: rows.map((cells, at) => ({ line: line + 2 + at, cells })),
});
const text = (line: number, value: string) => ({
  type: "text" as const,
  line,
  end: line,
  text: value,
});
const section = (heading: string, level: number, line: number, blocks: Section["blocks"] = []) => ({
  heading,
  level,
  line,
  blocks,
});

function page(
  sections: Section[],
  extra: Partial<OutputEntry["output"]> = {},
  pathway: string | null = "credit_screening",
) {
  const entry: OutputEntry = {
    selected: true,
    output: {
      id: "r/CP-L10.md",
      module: "CP-L10",
      label: "a",
      href: "",
      sha256: "a".repeat(64),
      ...extra,
    },
    sections,
  };
  const view = {
    entries: [entry],
    modules: [{ id: "CP-L10", name: "Credit screening", state: "Delivered", outputs: [entry] }],
    catalogue: undefined,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = { folder: "r", issuer: "Issuer", asOf: "2026-10-31", pathway } as PublishedRun;
  return render(
    <Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module="CP-L10" />,
  );
}

it("C6-1: the run's pathway names a module in the bottom line and the limitations", () => {
  page([
    section("Findings", 2, 1),
    section("Bottom line", 3, 2, [text(3, "CP-L10 found no gap.")]),
    section("Limitations", 3, 30, [text(31, "CP-L10 saw one period only.")]),
  ]);
  const header = screen.getByRole("region", { name: "Credit screening" });
  expect(within(header).getByText("Credit screening found no gap.")).toBeVisible();
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getByText("Credit screening saw one period only.")).toBeVisible();
  expect(screen.queryByText(/Short credit snapshot/)).toBeNull();
});

it("C6-1: the run's pathway names a module in a chart gap's reason", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Chart data: leverage", 3, 20, [table(21, ["P", "V"], [["a", "1"]])]),
    ],
    {
      summary: { bottomLine: "Leverage is stable.", confidence: "", limitation: "", line: 3 },
      chartGaps: [{ table: 21, title: "Leverage", gap: "Not supplied: CP-L10 has no series" }],
    },
  );
  expect(screen.getByText("Not supplied: Credit screening has no series")).toBeVisible();
});

it("C6-5: a summary's limitation is drawn last, as a limitation, not under the bottom line", () => {
  page(
    [section("Findings", 2, 1)],
    {
      summary: {
        bottomLine: "Leverage is stable.",
        confidence: "",
        limitation: "Only one period was supplied.",
        line: 3,
      },
    },
    null,
  );
  const header = screen.getByRole("region", { name: "Credit screening" });
  expect(within(header).getByText("Leverage is stable.")).toBeVisible();
  expect(within(header).queryByText("Only one period was supplied.")).toBeNull();
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  expect(within(limits).getByText("Only one period was supplied.")).toBeVisible();
  expect(within(limits).getByLabelText(/^Show sources for this limitation/)).toBeVisible();
  expect(within(limits).queryByText(/Not established for this run/)).toBeNull();
});

it("C6-5: a summary's limitation is not drawn twice beside a Limitations passage", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Limitations", 3, 30, [text(31, "One period was supplied.")]),
    ],
    {
      summary: {
        bottomLine: "Leverage is stable.",
        confidence: "",
        limitation: "One period was supplied.",
        line: 3,
      },
    },
    null,
  );
  expect(screen.getAllByText("One period was supplied.")).toHaveLength(1);
});

it("C6-7: a chart gap's title is drawn without the file and page it cites", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Chart data: maturity", 3, 20, [table(21, ["P", "V"], [["a", "1"]])]),
    ],
    {
      chartGaps: [
        {
          table: 21,
          title: "Maturity profile (credit_agreement.pdf p. 12)",
          gap: "Not supplied: no data",
        },
      ],
    },
  );
  expect(screen.getByText("Maturity profile: not drawn")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Maturity profile: source table in Evidence" }),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Show sources for Maturity profile" })).toBeVisible();
  expect(screen.queryByText(/credit_agreement/)).toBeNull();
});

it("C6-4: a gap reason cut to a dangling copula falls back to the Evidence wording", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Chart data: maturity", 3, 20, [table(21, ["P", "V"], [["a", "1"]])]),
    ],
    {
      chartGaps: [
        { table: 21, title: "Maturity profile", gap: "Not supplied; the figure is in T4.18." },
      ],
    },
  );
  expect(
    screen.getByText("Not supplied. The reason cites a source, shown in Evidence."),
  ).toBeVisible();
});

it("C6-7: a drawing's tile is named without the file and page it cites", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Events: maturity", 3, 20, [
        table(21, ["Date", "Event"], [["2028-01-01", "Maturity"]]),
      ]),
    ],
    { events: [{ table: 21, title: "Maturity profile (credit_agreement.pdf p. 12)" }] },
  );
  expect(screen.getByRole("region", { name: "Maturity profile" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Maturity profile" })).toBeVisible();
  expect(screen.queryByText(/credit_agreement/)).toBeNull();
  expect(screen.queryByRole("link", { name: /credit_agreement/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /credit_agreement/ })).toBeNull();
});
