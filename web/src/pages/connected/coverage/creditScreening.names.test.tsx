// Final batch item 7 (C6): the Coverage page names CP-L10 by the run's pathway.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Coverage, CoverageRun, Issuer } from "../coverageData";
import type { PublishedRun } from "../publishedReport";
import { ReportRecord } from "../report/Record";
import { FindView } from "./Find";
import { IssuerDetail } from "./IssuerDetail";
import { RunStates } from "./RunStates";
import { named } from "./shared";

afterEach(cleanup);

const column = { code: "CP-L10", title: "Service title" };
const runOf = (pathway: string): CoverageRun => ({
  key: "r1",
  folder: "r1-run",
  asOf: "2026-03-31",
  pathway,
  pathwayTitle: pathway,
  cells: { "CP-L10": { state: "assessed" } },
  other: [{ code: "CP-L10", title: "Service title", state: "assessed" }],
});
const data = { columns: [column], issuers: [], fields: [], facts: [] } as Coverage;
const issuerOf = (pathway: string): Issuer => ({
  key: "a",
  name: "Alpha plc",
  sector: "Industrial",
  runs: [runOf(pathway)],
});

it("named() takes the pathway and keeps the default without one", () => {
  expect(named(column, "credit_screening")).toBe("Credit screening");
  expect(named(column)).toBe("Short credit snapshot");
  expect(named({ code: "CP-ZZ", title: "Service title" }, "credit_screening")).toBe(
    "Service title",
  );
});

it("RunStates and the issuer detail name the module for a credit screening run", () => {
  render(<RunStates data={data} run={runOf("credit_screening")} />);
  expect(screen.getByRole("link", { name: "Credit screening" })).toBeInTheDocument();
  cleanup();
  render(<IssuerDetail data={data} issuer={issuerOf("credit_screening")} />);
  expect(screen.getAllByText(/Credit screening/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Short credit snapshot/)).toBeNull();
});

it("leave another pathway's name unchanged", () => {
  render(<IssuerDetail data={data} issuer={issuerOf("short_snapshot")} />);
  expect(screen.getAllByText(/Short credit snapshot/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Credit screening/)).toBeNull();
});

const findData = {
  columns: [{ code: "CP-2", title: "Fundamental credit" }],
  issuers: [],
  fields: [
    { id: "CP-L10/x", module: "CP-L10", group: "Summary", label: "Bottom line", kind: "text" },
  ],
  facts: [
    {
      field: "CP-L10/x",
      issuer: "a",
      run: "r1",
      at: null,
      text: "Liquidity is adequate.",
      output: "o1",
      sha256: "a".repeat(64),
      line: 12,
    },
  ],
} as unknown as Coverage;

it.each([
  ["credit_screening", "Credit screening", "Short credit snapshot"],
  ["short_snapshot", "Short credit snapshot", "Credit screening"],
])("FindView names a CP-L10 passage for a %s run", (pathway, shown, absent) => {
  const titles = new Map(findData.columns.map((item) => [item.code, item.title]));
  const { container } = render(
    <FindView data={findData} issuers={[issuerOf(pathway)]} query="" titles={titles} />,
  );
  expect(container.textContent).toContain(shown);
  expect(container.textContent).not.toContain(absent);
});

it.each([
  ["credit_screening", "Credit screening", "Short credit snapshot"],
  ["short_snapshot", "Short credit snapshot", "Credit screening"],
])("Record limits name CP-L10 for a %s run", async (pathway, shown, absent) => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(
      Response.json({
        id: "case",
        status: "finished",
        events: [],
        pathway,
        approved_summary_limits: [
          {
            id: "l1",
            scope: "CP-L10",
            outcome: "gap",
            reason: "CP-L10 has no sources.",
            fix: "Add sources for CP-L10.",
          },
        ],
      }),
    ),
  );
  const run = {
    folder: "case",
    issuer: "Issuer",
    title: "t",
    period: "2026",
    asOf: "2026-11-17",
    pathway,
    modules: {},
    record: { steps: [] },
    evidence: {
      sources: [],
      unused: [],
      unrecorded: [],
      noSourcesModules: [],
      handoffs: [],
      zip: null,
      downloads: [],
      record: { hashes: [], instructions: [], calls: [], cap: null },
    },
  } as unknown as PublishedRun;
  const { container } = render(<ReportRecord run={run} entries={[]} mode="live" />);
  expect(await screen.findByText(`${shown} has no sources.`)).toBeInTheDocument();
  expect(container.textContent).not.toContain(absent);
  expect(container.textContent).not.toMatch(/CP-L10/);
  vi.unstubAllGlobals();
});
