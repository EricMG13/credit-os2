import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportReader } from "./ReportLibrary";
import { ReportFindings, traceForLine } from "./ReportContent";
import {
  comparisonRows,
  outputEntries,
  runTiming,
  unitLabel,
  withUnit,
  type OutputEntry,
  type PublishedRun,
  type Section,
  type Snapshot,
} from "./publishedReport";
import { buildReportView } from "./reportView";
import { ModuleConfidence } from "./report/Confidence";
import { Changes } from "./report/Changes";

const names = ["CP-2", "CP-6", "CP-8"];
const hashes = ["a".repeat(64), "b".repeat(64), "c".repeat(64)];
const section = (heading: string, line: number, texts: string[]): Section => ({
  heading,
  line,
  level: heading === "Findings" ? 2 : 3,
  blocks: texts.map((text, index) => ({
    type: "text",
    line: line + index + 1,
    end: line + index + 1,
    text,
  })),
});

function fixture(): { run: PublishedRun; snapshot: Snapshot } {
  const run: PublishedRun = {
    folder: "current",
    issuer: "Acme",
    issuerKey: "acme",
    title: "Full credit assessment",
    period: "FY2025",
    asOf: "2026-03-31",
    pathway: "credit_snapshot",
    modules: Object.fromEntries(
      names.map((id) => [id, { outputs: [`current/${id}`], default: `current/${id}` }]),
    ),
    record: { steps: ["CP-6", "CP-2", "CP-8"].map((module) => ({ module })) },
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
  };
  const snapshot: Snapshot = {
    catalogue: {
      real: [
        {
          id: "current",
          name: "Acme",
          issuer: "Acme",
          title: "Full credit assessment",
          date: "2026-03-31",
          period: "FY2025",
          sector: "Industrial",
          metrics: { revenue: { value: "1250.00", unit: "US$m", period: "FY2025" } },
        },
      ],
    },
    workspace: {
      runs: { current: run },
      models: [],
      outputs: Object.fromEntries(
        names.map((module, index) => [
          `current/${module}`,
          {
            id: `current/${module}`,
            run: "current",
            module,
            label: module,
            href: "",
            sha256: hashes[index] ?? "",
          },
        ]),
      ),
      handoffs: Object.fromEntries(
        names.map((module, index) => [
          hashes[index] ?? "",
          [
            section("Findings", 1, []),
            section("Bottom line", 3, [
              module === "CP-6" ? "The credit view is stable." : `${module} view retained.`,
              "The second paragraph remains qualified.",
            ]),
            section("Key findings", 8, ["Cash covers the next maturity."]),
            section("Limitations", 11, ["The estimate relies on the published period."]),
          ],
        ]),
      ),
    },
    chips: {},
  };
  return { run, snapshot };
}

function reader(snapshot: Snapshot, hash: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json(snapshot))),
  );
  window.history.replaceState(null, "", `/${hash}`);
  return render(<ReportReader id="current" mode="synthetic" />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

it("C3-012 J1-009 orders the modules and Evidence by the recorded plan, keeping comparison on Changes", () => {
  const { run, snapshot } = fixture();
  const view = buildReportView(snapshot, "current", run);
  expect(view.modules.map(({ id }) => id)).toEqual(["CP-6", "CP-2"]);
  expect(view.entries.map(({ output }) => output.module)).toEqual(["CP-6", "CP-2", "CP-8"]);
});

it("C1-014 names the chosen module in the browser title", async () => {
  const { snapshot } = fixture();
  reader(snapshot, "#modules/CP-2");
  await screen.findByRole("heading", { name: "Fundamental credit" });
  expect(document.title).toBe("Fundamental credit — Acme — Credit OS");
});

it("C1-014 C5-005 names the Evidence page and hides its ineffective source switch", async () => {
  const { snapshot } = fixture();
  reader(snapshot, "#evidence/sources");
  await screen.findByRole("heading", { name: "Sources" });
  expect(document.title).toBe("Evidence: Sources — Acme — Credit OS");
  expect(screen.queryByRole("switch")).toBeNull();
});

it("J3-017 uses History for the history tab and names the issuer in its breadcrumb", async () => {
  const { snapshot } = fixture();
  reader(snapshot, "#history");
  await screen.findByRole("heading", { name: "Report history" });
  expect(
    within(screen.getByRole("navigation", { name: "Report sections" })).getByRole("link", {
      name: "History",
    }),
  ).toHaveAttribute("href", "#history");
  expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(
    "Library / Acme",
  );
  expect(screen.getByRole("link", { name: "Run progress" })).toHaveAttribute(
    "href",
    "/run/current",
  );
});

it("C1-032 keeps a visible loading sentence in a page-shaped report skeleton", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>(() => {})),
  );
  render(<ReportReader id="current" mode="synthetic" />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading report…");
  expect(screen.getByRole("status").querySelector('[aria-hidden="true"]')).not.toBeNull();
});

it("T17 residual identifies an unpublished report's known issuer in its page title", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url.startsWith("/connected/snapshot")
          ? Response.json({ error: "unknown" }, { status: 404 })
          : Response.json({ id: "current", issuer_name: "Known issuer", status: "failed" }),
      ),
    ),
  );
  render(<ReportReader id="current" mode="synthetic" />);
  await screen.findByText("This run ended without a report");
  expect(document.title).toBe("Credit report — Known issuer — Credit OS");
});

it("C3-015 C3-027 J1-009 names and attributes the lead view and its continuation", async () => {
  const { snapshot } = fixture();
  reader(snapshot, "#overview");
  const band = await screen.findByRole("region", { name: "Credit view" });
  expect(band).toHaveTextContent("The credit view is stable.");
  expect(screen.getByRole("link", { name: "Credit view from Committee decision" })).toHaveAttribute(
    "href",
    "#modules/CP-6",
  );
  expect(screen.getByText("Credit view, continued")).toBeInTheDocument();
  expect(screen.queryByText("Decision rationale")).toBeNull();
});

it("J3-019 labels the source toggle by the highlight it actually controls", async () => {
  const { snapshot } = fixture();
  reader(snapshot, "#overview");
  const toggle = await screen.findByRole("switch", { name: "Highlight source icons" });
  fireEvent.click(toggle);
  expect(document.querySelector('[data-sources="on"]')).not.toBeNull();
});

it("C3-016 C3-021 keeps a referenced lead in its band with figures outside it", () => {
  const { run, snapshot } = fixture();
  const entry = outputEntries(snapshot, run, "current").find(
    ({ output }) => output.module === "CP-6",
  );
  if (!entry) throw new Error("Missing exact lead fixture");
  const first = entry.sections[1]?.blocks[0];
  if (first?.type !== "text") throw new Error("Missing first paragraph");
  first.text = "The view follows annual_report.pdf.";
  render(
    <ReportFindings
      snapshot={snapshot}
      run={run}
      entry={entry}
      entryIndex={0}
      overview
      overviewLabel="Credit view"
      afterBottomLine={
        <dl aria-label="Published figures">
          <dt>Cash</dt>
          <dd>US$0m</dd>
        </dl>
      }
    />,
  );
  const band = screen.getByRole("region", { name: "Credit view" });
  expect(band).toHaveClass("bg-surface-inverse");
  expect(within(band).getByRole("link", { name: "Read this passage in Evidence" })).toHaveAttribute(
    "href",
    `/report/current#evidence/current%2FCP-6~${hashes[1]}-4`,
  );
  expect(band.contains(screen.getByRole("definition"))).toBe(false);
  expect(screen.queryByText(/annual_report\.pdf/)).toBeNull();
});

it("C5-025 groups real row citations and omits no-page boilerplate from source-free tables", () => {
  const { snapshot } = fixture();
  const entry: OutputEntry = {
    selected: true,
    output: { id: "current/CP-1", module: "CP-1", label: "", href: "", sha256: hashes[0] ?? "" },
    sections: [
      section("Findings", 1, []),
      {
        heading: "Confidence inputs",
        level: 3,
        line: 10,
        blocks: [
          {
            type: "table",
            line: 11,
            headers: ["Input", "Value"],
            rows: [
              { line: 12, cells: ["Coverage", "0.75"] },
              { line: 13, cells: ["Timeliness", "0.80"] },
            ],
          },
        ],
      },
    ],
  };
  const noPage = {
    label: "no page",
    source: "no page",
    reason: "the row cites no page or register",
    quote: null,
    excerpt: null,
    file: null,
    sha256: null,
  };
  snapshot.chips = { "current/CP-1:12": [noPage], "current/CP-1:13": [noPage] };
  const trace = traceForLine(snapshot, entry, 0, 11);
  expect(trace?.derivation.children.map(({ label, value }) => [label, value])).toEqual([
    ["Coverage", "0.75"],
    ["Timeliness", "0.80"],
  ]);
});

it("J3-015 states the confidence score denominator without changing its value", () => {
  const { run, snapshot } = fixture();
  const entry = outputEntries(snapshot, run, "current")[0];
  if (!entry) throw new Error("Missing confidence fixture");
  entry.output.confidence = { value: 73.25, band: "Medium" };
  render(<ModuleConfidence snapshot={snapshot} run={run} entry={entry} entryIndex={0} />);
  expect(screen.getByText("73.25")).toBeInTheDocument();
  expect(screen.getByText("Medium · out of 100")).toBeInTheDocument();
});

it("C5-025 ties each real table citation to its exact row", () => {
  const { snapshot } = fixture();
  const entry: OutputEntry = {
    selected: true,
    output: { id: "current/CP-1", module: "CP-1", label: "", href: "", sha256: hashes[0] ?? "" },
    sections: [
      {
        heading: "Debt measures",
        level: 3,
        line: 10,
        blocks: [
          {
            type: "table",
            line: 11,
            headers: ["Measure", "Value", "Source"],
            rows: [
              { line: 12, cells: ["Net leverage", "2.80x", "filing.txt p.2"] },
              { line: 13, cells: ["Cash", "US$10m", "filing.txt p.7"] },
            ],
          },
        ],
      },
    ],
  };
  const chip = (reason: string) => ({
    label: "filing.txt",
    source: "filing.txt",
    reason,
    quote: null,
    excerpt: null,
    file: "filing.txt",
    sha256: null,
  });
  snapshot.chips = { "current/CP-1:12": [chip("page 2")], "current/CP-1:13": [chip("page 7")] };
  const trace = traceForLine(snapshot, entry, 0, 11);
  expect(
    trace?.derivation.children.find(({ label }) => label === "Net leverage")?.children,
  ).toEqual([{ label: "filing.txt", value: "", note: "page 2", children: [] }]);
  expect(trace?.derivation.children.find(({ label }) => label === "Cash")?.children).toEqual([
    { label: "filing.txt", value: "", note: "page 7", children: [] },
  ]);
});

it("J5-005 preserves the ruled first-run sentence and explains its decision time", () => {
  const { run, snapshot } = fixture();
  render(<Changes snapshot={snapshot} run={run} entries={[]} change={{ first_run: true }} />);
  expect(
    screen.getByText("This is the first listed run for this issuer on this pathway."),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "This describes the library when this run was made; runs listed afterwards do not change this comparison.",
    ),
  ).toBeInTheDocument();
});

it("C1-023 uses the long as-of date on the report", () => {
  expect(runTiming({ asOf: "2025-03-31", period: "FY2024" })).toBe("As of 31 March 2025 · FY2024");
});

it("C4-013 uses canonical money units without altering digits or signs", () => {
  expect(unitLabel("USD millions")).toBe("US$m");
  expect(unitLabel("GBP millions")).toBe("GBPm");
  expect(withUnit("1234.50", "USD millions")).toBe("US$1,234.50m");
  expect(withUnit("-1234.50", "GBPm")).toBe("-GBP 1,234.50m");
});

it("C3-011 gives positive comparison movements their sign", () => {
  const rows = comparisonRows({
    pack: {
      measures: [
        {
          key: "leverage",
          label: "Net leverage",
          prior: { value: "2.00", unit: "x", period: "FY2024" },
          current: { value: "2.80", unit: "x", period: "FY2025" },
          difference: "0.80",
          unit: "x",
        },
      ],
    },
    verdicts: { measures: { leverage: { kind: "comparable", label: "Same basis" } } },
  });
  expect(rows[0]?.[3]).toBe("+0.80x");
});
