import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, PublishedRun, Section, Snapshot, Table } from "../publishedReport";
import type { ReportView } from "../reportView";
import { CompanyProfile } from "./CompanyProfile";
import { moduleFrame } from "./moduleFrameModel";
import { Modules } from "./Modules";

afterEach(cleanup);

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

function entryOf(sections: Section[], extra: Partial<OutputEntry["output"]> = {}): OutputEntry {
  return {
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
}

function page(sections: Section[], extra: Partial<OutputEntry["output"]> = {}) {
  const entry = entryOf(sections, extra);
  const view = {
    entries: [entry],
    modules: [{ id: "CP-L10", name: "Credit screening", state: "Delivered", outputs: [entry] }],
    catalogue: undefined,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = {
    folder: "r",
    issuer: "Issuer",
    asOf: "2026-10-31",
    pathway: "credit_screening",
  } as PublishedRun;
  return render(
    <Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module="CP-L10" />,
  );
}

it("C6-R2: a typed table's cells name a module as the run's pathway does", () => {
  page([
    section("Findings", 2, 1),
    section("Risks", 3, 10, [
      table(11, ["Risk", "Probability", "Impact"], [["CP-L10 slips", "CP-L10 low", "CP-L10 high"]]),
    ]),
  ]);
  expect(screen.getByText("Credit screening slips")).toBeVisible();
  expect(screen.getByText("Credit screening low")).toBeVisible();
  expect(screen.getByText("Credit screening high")).toBeVisible();
  expect(screen.queryByText(/Short credit snapshot/)).toBeNull();
});

it("C6-R2: the basis line names a module as the run's pathway does", () => {
  const entry = entryOf([
    section("Findings", 2, 1),
    section("Period table", 3, 5, [
      table(6, ["Period", "Start", "End"], [["CP-L10 year", "2025-01-01", "2025-12-31"]]),
    ]),
  ]);
  expect(moduleFrame(entry, { pathway: "credit_screening" }).basis).toEqual({
    kind: "periods",
    periods: ["Credit screening year"],
  });
  expect(moduleFrame(entry).basis).toEqual({
    kind: "periods",
    periods: ["Short credit snapshot year"],
  });
});

it("C6-R2: the company profile names a module as the run's pathway does", () => {
  const entry = entryOf([
    section("Company profile", 3, 10, [
      table(12, ["Field", "Detail"], [["Business", "CP-L10 screens a lender."]]),
    ]),
  ]);
  render(<CompanyProfile entry={entry} folder="r" pathway="credit_screening" />);
  expect(screen.getByText("Credit screening screens a lender.")).toBeVisible();
});

it("C6-R3: a summary limitation drawn in the Limitations tile is in the page's navigator", () => {
  page([section("Findings", 2, 1)], {
    summary: {
      bottomLine: "Leverage is stable.",
      confidence: "",
      limitation: "Only FY2024 was audited.",
      line: 3,
    },
  });
  expect(screen.getByRole("region", { name: "Limitations of this module" })).toBeVisible();
  const sections = screen.getByRole("list", { name: "On this page" });
  expect(within(sections).getByRole("button", { name: "Limitations" })).toBeVisible();
});

it("C6-R4: a summary limitation is kept beside a different Limitations passage, last", () => {
  page(
    [section("Findings", 2, 1), section("Limitations", 3, 30, [text(31, "Peer data is absent.")])],
    {
      summary: {
        bottomLine: "Leverage is stable.",
        confidence: "",
        limitation: "Only FY2024 was audited.",
        line: 3,
      },
    },
  );
  const limits = screen.getByRole("region", { name: "Limitations of this module" });
  const drawn = within(limits)
    .getAllByRole("listitem")
    .map((item) => item.textContent);
  expect(drawn).toEqual([
    expect.stringContaining("Peer data is absent."),
    expect.stringContaining("Only FY2024 was audited."),
  ]);
});

it("C6-R4: the same limitation, spaced and cased differently, is drawn once", () => {
  page(
    [
      section("Findings", 2, 1),
      section("Limitations", 3, 30, [text(31, "Only  FY2024 was audited.")]),
    ],
    {
      summary: {
        bottomLine: "Leverage is stable.",
        confidence: "",
        limitation: "only FY2024 was   audited.",
        line: 3,
      },
    },
  );
  expect(screen.getAllByText(/only\s+FY2024 was\s+audited\./i)).toHaveLength(1);
});
