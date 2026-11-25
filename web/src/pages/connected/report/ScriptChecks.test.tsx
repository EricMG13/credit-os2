import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type {
  PublishedRun,
  ScriptCheckOutcome,
  ScriptCheckRecord,
  Snapshot,
} from "../publishedReport";
import { ReportEvidence } from "./Evidence";
import { ScriptChecks } from "./ScriptChecks";

const outcome: ScriptCheckOutcome = {
  figure: "Net debt",
  register: "T2.1",
  row: "R1",
  status: "disagreed",
  reason: "Net debt = gross debt - cash",
  script: "scripts/check.py",
  stated: "0.00",
  recomputed: 0,
  recomputedLabel: "exact",
  tolerance: 0,
  unit: "US$m",
};
const record: ScriptCheckRecord = {
  module: "CP-1",
  attempt: 2,
  response: "a".repeat(64),
  counts: [{ status: "disagreed", n: 1 }],
  scripts: [{ name: "scripts/check.py", sha256: "b".repeat(64) }],
  outcomes: [outcome],
};

/** A bare check: no register, figure, reason or values. */
function bare(status: string, register: string | null = null): ScriptCheckOutcome {
  return {
    figure: null,
    register,
    row: null,
    status,
    reason: null,
    script: null,
    stated: null,
    recomputed: null,
    recomputedLabel: null,
    tolerance: null,
    unit: null,
  };
}

/** A check card is named by its heading (C5-015: a card is not a landmark). */
function cardOf(name: string) {
  const card = screen.getByRole("heading", { name }).closest("section");
  if (!card) throw new Error(`no card headed ${name}`);
  return card;
}

/** Opens every outcome group, as a reader would by choosing each summary. */
function openAll() {
  for (const details of document.querySelectorAll("details")) details.open = true;
}

/** The outcome group headed by `status`, as its <details>. */
function groupOf(status: string) {
  const heading = screen.getByRole("heading", { level: 4, name: new RegExp(`^${status} · `) });
  const details = heading.closest("details");
  if (!details) throw new Error(`no group ${status}`);
  return details;
}

/** The count in the outcomes-by-module table at a module's row and a status word's column. */
function countCell(module: string, status: string) {
  const table = screen.getByRole("table", { name: /Outcomes by module/ });
  const headers = within(table)
    .getAllByRole("columnheader")
    .map((header) => header.textContent);
  const index = headers.indexOf(status);
  if (index < 1) throw new Error(`no column ${status}`);
  const row = within(table)
    .getByRole("rowheader", { name: new RegExp(`^${module}`) })
    .closest("tr");
  if (!row) throw new Error(`no row ${module}`);
  return within(row).getAllByRole("cell")[index - 1];
}

function show(records?: ScriptCheckRecord[], target = "checks/CP-1") {
  const run = {
    folder: "run",
    evidence: {
      scriptChecks: records,
      sources: [],
      unused: [],
      unrecorded: [],
      handoffs: [],
      downloads: [],
      zip: null,
    },
  } as unknown as PublishedRun;
  const snapshot = { workspace: { runs: {} }, chips: {} } as unknown as Snapshot;
  return render(
    <ReportEvidence snapshot={snapshot} run={run} entries={[]} target={target} mode="synthetic" />,
  );
}
afterEach(cleanup);

it.each([undefined, []])(
  "has no tab or panel for missing records and falls back from checks to Summary",
  (records) => {
    show(records);
    expect(screen.queryByText("Script checks")).toBeNull();
    expect(screen.getByRole("heading", { name: "Run evidence" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  },
);

it("renders accepted record identity, exact figures, zero tolerance and status without rounding", () => {
  show([record]);
  const group = cardOf("T2.1 · Net debt");
  expect(within(group).getByText("disagreed")).toBeVisible();
  expect(within(group).getByText("0.00")).toBeVisible();
  expect(within(group).getByText("0 exact US$m")).toBeVisible();
  expect(within(group).getByText("0")).toBeVisible();
  expect(within(group).getByText("Net debt = gross debt - cash")).toBeVisible();
  expect(screen.getByText("a".repeat(64))).toBeVisible();
  expect(screen.getByText("b".repeat(64))).toBeVisible();
  const strip = screen.getByLabelText("Script check outcomes");
  expect(within(strip).getByText("disagreed")).toBeVisible();
  expect(within(strip).getByText("1")).toBeVisible();
  expect(countCell("Financial foundation", "disagreed")).toHaveTextContent(/^1$/);
  expect(screen.getByRole("link", { name: /Script checks/ })).toHaveAttribute(
    "href",
    "#evidence/checks/CP-1",
  );
  expect(screen.getByRole("option", { name: "Financial foundation" })).toBeInTheDocument();
});

it("groups repeated register checks but keeps different numeric and missing values separate", () => {
  const common = {
    ...outcome,
    figure: "all",
    row: "all",
    status: "not checked",
    stated: null,
    recomputed: null,
    recomputedLabel: null,
    tolerance: null,
  };
  show([
    {
      ...record,
      outcomes: [
        { ...common, register: "T1" },
        { ...common, register: "T2" },
        { ...outcome, recomputed: null },
        outcome,
        { ...outcome, recomputed: 0.125 },
      ],
    },
  ]);
  openAll();
  const group = cardOf("2 registers");
  expect(within(group).getByText("not checked")).toBeVisible();
  expect(within(group).getByText("T1")).toBeVisible();
  expect(within(group).getByText("T2")).toBeVisible();
  expect(within(group).queryByText("Recomputed")).toBeNull();
  expect(screen.getAllByRole("heading", { name: "T2.1 · Net debt" })).toHaveLength(3);
  expect(screen.getByText("0.125 exact US$m")).toBeVisible();
});

it("keeps unknown statuses and hostile text literal, and filters modules without leaking outcomes", () => {
  const other = {
    ...record,
    module: "CP-2",
    outcomes: [{ ...outcome, status: "unrecognised", reason: "<img src=x onerror=alert(1)>" }],
    scripts: [{ name: "other.py", sha256: null }],
  };
  const shown = show([record, other], "checks/CP-2");
  // The strip, the table's column and the module's card each draw the status word as recorded.
  expect(screen.getAllByText("unrecognised")).toHaveLength(3);
  for (const node of screen.getAllByText("unrecognised")) expect(node).toBeVisible();
  expect(screen.getByRole("heading", { level: 4, name: "unrecognised · 1" })).toBeVisible();
  expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByText("Net debt = gross debt - cash")).toBeNull();
  expect(screen.queryByText("disagreed")).toBeNull();
  expect(screen.getByText("Not recorded")).toBeVisible();
  shown.unmount();
  show([record], "checks/CP-6");
  expect(
    screen.getByText("No script-check record is held for Committee decision."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /Net debt/ })).toBeNull();
});

it("heads a check by its register and the figure checked, not by the figure alone", () => {
  show([
    {
      ...record,
      outcomes: [
        { ...outcome, figure: "columns", row: "all", register: "T4.10", status: "not checked" },
        { ...outcome, figure: "Headroom: all", register: "T4C.4", status: "not checked" },
        { ...outcome, figure: "all", row: "all", register: "T4.11", status: "not checked" },
      ],
    },
  ]);
  openAll();
  const titles = screen.getAllByRole("heading", { level: 6 }).map((node) => node.textContent);
  expect(titles).toEqual(["T4.10 · columns", "T4C.4 · Headroom: all", "T4.11"]);
});

it("draws no markdown marks in a register or a reason", () => {
  show([
    {
      ...record,
      outcomes: [
        {
          ...outcome,
          figure: "all",
          row: "all",
          register: "`### Recovery waterfall`",
          reason: "CP-3 states no value for Low: `Not supplied: not stated`",
          status: "not checked",
        },
      ],
    },
  ]);
  openAll();
  const card = cardOf("Recovery waterfall");
  // The module is named; its code is not drawn, here or anywhere on the page.
  expect(
    within(card).getByText("Security selection states no value for Low: Not supplied: not stated"),
  ).toBeVisible();
  expect(document.body.textContent).not.toMatch(/CP-\d/);
  expect(document.body.textContent).not.toMatch(/[`#]/);
});

it("makes no landmark of a check card", () => {
  show([
    {
      ...record,
      outcomes: [
        outcome,
        { ...outcome, figure: "columns", register: "T4.10", status: "not checked" },
      ],
    },
  ]);
  expect(screen.queryByRole("region", { name: /not checked|disagreed/ })).toBeNull();
});

const mixed: ScriptCheckRecord[] = [
  {
    ...record,
    module: "CP-1",
    outcomes: [
      bare("agreed", "A1"),
      bare("not checked", "N1"),
      bare("noted", "O1"),
      bare("disagreed", "D1"),
      bare("zany", "Z1"),
      bare("missing", "M1"),
      bare("contradicted", "C1"),
      bare("agreed", "A2"),
      bare("aardvark", "Y1"),
    ],
  },
];

it("counts each recorded status word exactly, in the fixed order then alphabetically", () => {
  render(<ScriptChecks records={mixed} />);
  const strip = screen.getByLabelText("Script check outcomes");
  const labels = [...strip.querySelectorAll("dt")].map((node) => node.textContent);
  const values = [...strip.querySelectorAll("dd")].map((node) => node.textContent);
  expect(labels).toEqual([
    "agreed",
    "disagreed",
    "contradicted",
    "missing",
    "not checked",
    "aardvark",
    "noted",
    "zany",
  ]);
  expect(values).toEqual(["2", "1", "1", "1", "1", "1", "1", "1"]);
});

it("orders outcome groups by the attention they need, with not checked last", () => {
  render(<ScriptChecks records={mixed} />);
  const groups = screen.getAllByRole("heading", { level: 4 }).map((node) => node.textContent);
  expect(groups).toEqual([
    "disagreed · 1",
    "contradicted · 1",
    "missing · 1",
    "aardvark · 1",
    "zany · 1",
    "noted · 1",
    "agreed · 2",
    "not checked · 1",
  ]);
});

it("opens the groups needing attention and closes not checked, stating its count", () => {
  render(<ScriptChecks records={mixed} />);
  for (const status of ["disagreed", "contradicted", "missing", "aardvark", "zany", "agreed"])
    expect(groupOf(status)).toHaveAttribute("open");
  const closed = groupOf("not checked");
  expect(closed).not.toHaveAttribute("open");
  const summary = closed.querySelector("summary");
  expect(summary).toHaveTextContent("not checked · 1");
  expect(summary).toHaveTextContent(/reason/);
  expect(summary).toHaveClass("min-h-8", "max-[480px]:min-h-11");
  expect(within(closed).getByRole("heading", { level: 6, name: "N1" })).not.toBeVisible();
});

it("closes the agreed group when it holds more than twenty checks", () => {
  const many = Array.from({ length: 21 }, (_, index) => bare("agreed", `R${String(index)}`));
  const shown = render(<ScriptChecks records={[{ ...record, outcomes: many }]} />);
  expect(groupOf("agreed")).not.toHaveAttribute("open");
  shown.unmount();
  render(<ScriptChecks records={[{ ...record, outcomes: many.slice(0, 20) }]} />);
  expect(groupOf("agreed")).toHaveAttribute("open");
});

it("keeps the same unnamed check in two modules as two cards under their modules", () => {
  render(
    <ScriptChecks
      records={[
        { ...record, module: "CP-1", outcomes: [bare("agreed")] },
        { ...record, module: "CP-2", outcomes: [bare("agreed")] },
      ]}
    />,
  );
  const group = groupOf("agreed");
  expect(within(group).getAllByRole("heading", { level: 6, name: "Check" })).toHaveLength(2);
  const modules = within(group)
    .getAllByRole("heading", { level: 5 })
    .map((node) => node.textContent);
  expect(modules).toEqual(["Financial foundation", "Fundamental credit"]);
});

it("tabulates outcomes by module with exact counts, a true zero, and links to each module", () => {
  render(
    <ScriptChecks
      records={[
        { ...record, module: "CP-1", outcomes: [bare("agreed"), bare("disagreed")] },
        { ...record, module: "CP-2", outcomes: [bare("agreed"), bare("agreed", "X")] },
      ]}
    />,
  );
  expect(countCell("Financial foundation", "agreed")).toHaveTextContent(/^1$/);
  expect(countCell("Financial foundation", "disagreed")).toHaveTextContent(/^1$/);
  expect(countCell("Fundamental credit", "agreed")).toHaveTextContent(/^2$/);
  expect(countCell("Fundamental credit", "disagreed")).toHaveTextContent(/^0$/);
  const link = screen.getByRole("link", { name: /Fundamental credit/ });
  expect(link).toHaveAttribute("href", "#evidence/checks/CP-2");
  // The module is named; its code is the link's address only.
  expect(link).toHaveTextContent(/^Fundamental credit$/);
  const scroller = screen.getByRole("region", { name: "Outcomes by module" });
  expect(scroller).toHaveClass("relative", "overflow-x-auto");
  expect(scroller).toHaveAttribute("tabindex", "0");
});

it("shows only the selected module in every part", () => {
  render(
    <ScriptChecks
      records={[
        { ...record, module: "CP-1", outcomes: [bare("disagreed", "D1")] },
        { ...record, module: "CP-2", response: null, outcomes: [bare("agreed", "A1")] },
      ]}
      module="CP-2"
    />,
  );
  const table = screen.getByRole("table", { name: /Outcomes by module/ });
  expect(within(table).getAllByRole("rowheader")).toHaveLength(1);
  expect(screen.queryByText("disagreed")).toBeNull();
  expect(screen.queryByRole("heading", { name: "D1" })).toBeNull();
  const checking = screen.getByRole("table", { name: /Checking record/ });
  expect(within(checking).getAllByRole("rowheader")).toHaveLength(1);
  expect(within(checking).getByText("Not recorded")).toBeVisible();
  expect(within(checking).queryByText("a".repeat(64))).toBeNull();
});

it("draws the checking record with full hashes in code and unrecorded hashes in words", () => {
  render(
    <ScriptChecks
      records={[
        {
          ...record,
          scripts: [
            { name: "scripts/check.py", sha256: "b".repeat(64) },
            { name: "other.py", sha256: null },
          ],
        },
      ]}
    />,
  );
  const checking = screen.getByRole("table", { name: /Checking record/ });
  const row = within(checking).getByRole("rowheader", { name: /Financial foundation/ });
  expect(row.closest("tr")).toHaveTextContent("2");
  const response = within(checking).getByText("a".repeat(64));
  expect(response.tagName).toBe("CODE");
  // 64 characters as two even lines of 32, the hash whole in one node.
  expect(response).toHaveClass("w-[32ch]", "break-all", "font-mono");
  expect(within(checking).getByText("b".repeat(64)).tagName).toBe("CODE");
  expect(within(checking).getByText("other.py")).toBeVisible();
  expect(within(checking).getByText("Not recorded")).toBeVisible();
  const scroller = screen.getByRole("region", { name: "Checking record" });
  expect(scroller).toHaveClass("relative");
});

it("draws a record without outcomes as a gap, never as zero counts", () => {
  render(<ScriptChecks records={[{ ...record, outcomes: [] }]} />);
  expect(screen.getByText("No check outcome is recorded for this selection.")).toBeVisible();
  expect(screen.queryByLabelText("Script check outcomes")).toBeNull();
  expect(screen.queryByRole("table", { name: /Outcomes by module/ })).toBeNull();
  expect(screen.getByRole("table", { name: /Checking record/ })).toBeVisible();
});
