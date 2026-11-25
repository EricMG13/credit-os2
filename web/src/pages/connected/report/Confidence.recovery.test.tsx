import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { OutputEntry, Snapshot } from "../publishedReport";
import { useState } from "react";
import { RunContext } from "@/pages/library/parts/RunContext";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import { evidenceHref } from "../publishedReport";
import { traceForConfidence, traceForLine } from "../ReportContent";
import { ModuleConfidence } from "./Confidence";

const inputs = [
  ["Directly Sourced", "8"],
  ["Calculated", "2"],
  ["Assumption-Based", "2"],
  ["Analyst Inference", "0"],
  ["Weak Lineage", "0"],
  ["Untraced", "0"],
  ["Conflicting", "0"],
  ["Insufficient Information", "0"],
  ["Fields present", "95"],
  ["Fields total", "100"],
  ["Source gate", "pass"],
  ["CRITICAL", "0"],
  ["MATERIAL", "0"],
  ["MINOR", "1"],
].map(([label = "", value = ""]) => ({ label, value }));
const method = [
  {
    label: "Formula",
    value:
      "(0.6 × evidence quality + 0.4 × field coverage) × source-gate factor − finding penalties",
  },
  { label: "Source-gate factors", value: "pass 1.0; partial 0.7; fail 0.0" },
  { label: "Caps and rounding", value: "CRITICAL cap 39; MATERIAL cap 59; half to even." },
];
function fixture(asText = false) {
  const entry = {
    selected: true,
    output: {
      id: "run-a/CP-1.md",
      module: "CP-1",
      label: "Retained output",
      href: "",
      sha256: "a".repeat(64),
      confidence: { value: 89, band: "High" },
      confidenceTrace: { inputs, method },
    },
    sections: [
      {
        heading: "Confidence inputs",
        level: 3,
        line: 10,
        blocks: asText
          ? [
              {
                type: "text",
                line: 11,
                end: 30,
                text: "| Input | Value |\n| Directly Sourced | 8 |",
              },
            ]
          : [
              {
                type: "table",
                line: 11,
                headers: ["Input", "Value"],
                rows: inputs.map(({ label, value }, i) => ({
                  line: 13 + i,
                  cells: [label, value],
                })),
              },
            ],
      },
    ],
  } as OutputEntry;
  const gap = {
    label: "no page",
    source: null,
    reason: "the row cites no page or register",
    file: null,
    sha256: null,
    quote: null,
    excerpt: null,
  };
  const snapshot = {
    chips: Object.fromEntries(
      inputs.map((_, i) => [`${entry.output.id}:${String(13 + i)}`, [{ ...gap }]]),
    ),
  } as Snapshot;
  return { entry, snapshot };
}
afterEach(cleanup);

/** The meter as the module page draws it: one trace for the score, opened in the drawer. */
function renderScore(entry: OutputEntry, snapshot: Snapshot) {
  function Page() {
    const [open, setOpen] = useState(false);
    const trace = traceForConfidence(snapshot, entry);
    return (
      <RunContext.Provider
        value={{
          traces: trace ? { score: trace } : {},
          open: () => {
            setOpen(true);
          },
        }}
      >
        <ModuleConfidence confidence={entry.output.confidence} trace={trace ? "score" : null} />
        {open && trace && (
          <TraceDrawer
            trace={trace}
            evidenceHref={evidenceHref("run-a", trace.evidenceItem)}
            isOpen
            onClose={() => {
              setOpen(false);
            }}
          />
        )}
      </RunContext.Provider>
    );
  }
  return render(<Page />);
}

it("replaces synthetic no-page placeholders with the exact scored inputs and existing method", async () => {
  const { entry, snapshot } = fixture();
  renderScore(entry, snapshot);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for the confidence score" }));
  const drawer = await screen.findByRole("dialog");
  for (const { label, value } of inputs) {
    const row = within(drawer).getByText(label, { exact: true }).parentElement;
    expect(row).toHaveTextContent(value);
  }
  expect(drawer).toHaveTextContent("0.6 × evidence quality + 0.4 × field coverage");
  expect(drawer).toHaveTextContent("89 out of 100 · High");
  expect(drawer).not.toHaveTextContent("the row cites no page or register");
  expect(within(drawer).getByRole("link", { name: "Open in Evidence" })).toHaveAttribute(
    "href",
    expect.stringContaining(`run-a%2FCP-1.md~${"a".repeat(64)}`),
  );
});

it("opens authoritative accepted inputs when the generic Markdown parser found no table", async () => {
  const { entry, snapshot } = fixture(true);
  renderScore(entry, snapshot);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for the confidence score" }));
  const drawer = await screen.findByRole("dialog");
  expect(drawer).toHaveTextContent("Fields present 95");
  expect(drawer).toHaveTextContent("MINOR 1");
  expect(drawer).toHaveTextContent("half to even");
});

it("keeps real source identity, excerpt and qualification while dropping only placeholder chips", () => {
  const { entry, snapshot } = fixture();
  (snapshot.chips[`${entry.output.id}:13`] ?? []).push({
    label: "annual.pdf p.7",
    source: "annual.pdf p.7",
    file: "annual.pdf",
    sha256: "b".repeat(64),
    href: `/connected/sources/run-a/${"b".repeat(64)}/annual.pdf`,
    pageHref: `/connected/sources/run-a/${"b".repeat(64)}/annual.pdf?page=7`,
    quote: "Exact source quotation.",
    excerpt: "Exact source quotation.",
    reason: "Recorded qualification for FY2025.",
  });
  const trace = traceForLine(snapshot, entry, 0, 11);
  expect(trace?.derivation.children).toEqual(
    expect.arrayContaining([expect.objectContaining({ label: "Recorded confidence inputs" })]),
  );
  expect(JSON.stringify(trace)).toContain("Recorded qualification for FY2025.");
  expect(trace?.excerpt?.quote).toBe("Exact source quotation.");
  expect(trace?.sourceLinks).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        href: `/connected/sources/run-a/${"b".repeat(64)}/annual.pdf?page=7`,
      }),
    ]),
  );
  expect(JSON.stringify(trace)).not.toContain("the row cites no page or register");
});

it("shows a published zero unchanged and never substitutes missing inputs for zero", async () => {
  const { entry, snapshot } = fixture();
  entry.output.confidence = { value: 0, band: "Insufficient Information" };
  renderScore(entry, snapshot);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for the confidence score" }));
  expect(await screen.findByRole("dialog")).toHaveTextContent(
    "0 out of 100 · Insufficient Information",
  );
});

it("keeps qualifications and citations from later blocks of a split accepted inputs section", async () => {
  const { entry, snapshot } = fixture();
  entry.sections[0]?.blocks.push(
    { type: "text", line: 40, end: 40, text: "Counts cover FY2025 audited evidence only." },
    {
      type: "table",
      line: 42,
      headers: ["Input", "Value"],
      rows: [{ line: 44, cells: ["MINOR", "1"] }],
    },
  );
  snapshot.chips[`${entry.output.id}:44`] = [
    {
      label: "audit.pdf p.9",
      source: "audit.pdf p.9",
      file: "audit.pdf",
      sha256: "c".repeat(64),
      quote: null,
      excerpt: null,
      reason: "Later input qualification.",
    },
  ];
  renderScore(entry, snapshot);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for the confidence score" }));
  const drawer = await screen.findByRole("dialog");
  expect(drawer).toHaveTextContent("Counts cover FY2025 audited evidence only.");
  expect(drawer).toHaveTextContent("audit.pdf p.9");
  expect(drawer).toHaveTextContent("Later input qualification.");
});

it("retains source qualification and exact citations when another table makes the handoff unstructured", async () => {
  const { entry, snapshot } = fixture();
  const qualification =
    "Counts cover FY2025 audited standalone evidence only; overseas subsidiaries are excluded.";
  Object.assign(entry.output.confidenceTrace ?? {}, {
    section: {
      heading: "Confidence inputs",
      level: 3,
      line: 8,
      blocks: [
        { type: "text", line: 9, end: 10, text: `${qualification}\nBasis: annual.pdf, page 7.` },
      ],
    },
  });
  entry.output.parseError = "Malformed table at line 7";
  entry.sections = [
    {
      heading: "Unstructured handoff",
      level: 1,
      line: 1,
      blocks: [
        {
          type: "text",
          line: 1,
          end: 30,
          text: `### Earlier supporting table\nUnrelated earlier passage.\n### Confidence inputs\n${qualification}`,
        },
      ],
    },
  ];
  snapshot.chips[`${entry.output.id}:9`] = [
    {
      label: "annual.pdf p.7",
      source: "annual.pdf p.7",
      file: "annual.pdf",
      sha256: "b".repeat(64),
      href: `/connected/sources/run-a/${"b".repeat(64)}/annual.pdf`,
      pageHref: `/connected/sources/run-a/${"b".repeat(64)}/annual.pdf?page=7`,
      quote: "Exact source quotation.",
      excerpt: "Exact source quotation.",
      reason: "Recorded qualification for FY2025.",
    },
  ];
  renderScore(entry, snapshot);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for the confidence score" }));
  const drawer = await screen.findByRole("dialog");
  expect(drawer).toHaveTextContent(qualification);
  expect(drawer).toHaveTextContent("annual.pdf, cited page 7");
  expect(drawer).toHaveTextContent("Exact source quotation.");
  expect(drawer).toHaveTextContent("Recorded qualification for FY2025.");
  expect(drawer).not.toHaveTextContent("Unrelated earlier passage.");
  expect(drawer).toHaveTextContent("89 out of 100 · High");
  expect(within(drawer).getByRole("link", { name: "Open in Evidence" })).toHaveAttribute(
    "href",
    expect.stringContaining(`run-a%2FCP-1.md~${"a".repeat(64)}`),
  );
});
