import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hasRecordedGap, ReportEvidence } from "./Evidence";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";

const emptyEvidence = {
  sources: [],
  unused: [],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};

function evidenceEntry(
  module: string,
  id: string,
  selected: boolean,
  blocks: OutputEntry["sections"][number]["blocks"],
): OutputEntry {
  return {
    output: {
      id,
      sha256: "a".repeat(64),
      module,
      label: "Saved alternate",
      href: `${id}.md`,
    },
    selected,
    sections: [{ heading: "Gaps", level: 2, line: 4, blocks }],
  };
}

function renderGaps(entries: OutputEntry[], module = "CP-1") {
  return renderEvidence(entries, `gaps/${module}`);
}

function renderEvidence(
  entries: OutputEntry[],
  target: string,
  evidence: PublishedRun["evidence"] = emptyEvidence,
  chips: Snapshot["chips"] = {},
) {
  const run = { folder: "case", evidence } as unknown as PublishedRun;
  const snapshot = {
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips,
  } as unknown as Snapshot;
  return render(
    <ReportEvidence
      snapshot={snapshot}
      run={run}
      entries={entries}
      target={target}
      mode="synthetic"
    />,
  );
}

afterEach(cleanup);

describe("published evidence gaps", () => {
  it("does not count an explicit None handoff as a gap", () => {
    expect(hasRecordedGap([{ type: "text", line: 46, end: 46, text: "None." }])).toBe(false);
  });

  it("counts actual text and structured gap records", () => {
    expect(
      hasRecordedGap([
        { type: "text", line: 46, end: 46, text: "No current facility headroom was supplied." },
      ]),
    ).toBe(true);
    expect(
      hasRecordedGap([
        {
          type: "table",
          line: 47,
          headers: ["Item", "Reason"],
          rows: [{ line: 48, cells: ["Liquidity", "No dated forecast"] }],
        },
      ]),
    ).toBe(true);
    expect(hasRecordedGap([])).toBe(false);
  });

  it("excludes no-gap rows and the comparison ledger from gap counts", () => {
    expect(
      hasRecordedGap([
        {
          type: "table",
          line: 47,
          headers: ["Gap", "Severity"],
          rows: [{ line: 48, cells: ["None", ""] }],
        },
      ]),
    ).toBe(false);
    expect(
      hasRecordedGap([
        {
          type: "table",
          line: 47,
          headers: ["Earlier ref", "Current ref", "Limitation"],
          rows: [{ line: 48, cells: ["E1", "C1", "Different scope"] }],
        },
      ]),
    ).toBe(false);
  });

  it("renders each row from every module output, preserves effects, and links to the row line", () => {
    const saved = evidenceEntry("CP-1", "CP-1/alternate.md", false, [
      {
        type: "table",
        line: 5,
        headers: ["Gap", "Severity", "Effect"],
        rows: [
          { line: 6, cells: ["None.", "", "No effect"] },
          {
            line: 7,
            cells: ["Refinancing data unavailable", "High", "Could increase liquidity pressure"],
          },
        ],
      },
    ]);
    renderGaps([
      saved,
      evidenceEntry("CP-2G", "CP-2G/gaps.md", true, [
        { type: "text", line: 12, end: 12, text: "Different module gap." },
      ]),
    ]);

    expect(screen.getByRole("heading", { name: "Gaps 1" })).toBeVisible();
    expect(screen.getByText("Effect: Could increase liquidity pressure")).toBeVisible();
    expect(screen.getByText("Financial foundation · Saved alternate")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open handoff line" })).toHaveAttribute(
      "href",
      `/report/case#evidence/${encodeURIComponent(saved.output.id)}~${saved.output.sha256}-7`,
    );
    expect(screen.queryByText("Different module gap.")).toBeNull();
  });

  it("uses the gap text instead of a gap identifier and preserves unrecognized severity", () => {
    const entry = evidenceEntry("CP-1", "CP-1/gaps.md", true, [
      {
        type: "table",
        line: 5,
        headers: ["Gap ID", "Gap", "Severity", "Effect"],
        rows: [
          { line: 6, cells: ["G-01", "None.", "", "No effect"] },
          {
            line: 7,
            cells: ["G-02", "Missing covenant schedule", "Critical", "Could hide a breach"],
          },
        ],
      },
    ]);
    renderGaps([entry]);
    expect(screen.getByRole("heading", { name: "Gaps 1" })).toBeVisible();
    // The stated word is kept as written, as the heading of the group its row sits in.
    const group = screen.getByRole("row", { name: /Missing covenant schedule/ }).closest("tbody");
    expect(group?.querySelector('th[scope="rowgroup"]')?.textContent).toBe("Critical1");
    expect(screen.getByRole("row", { name: /Could hide a breach/ })).toHaveTextContent(
      "Effect: Could hide a breach",
    );
    expect(screen.queryByText("G-02")).toBeNull();
  });

  it("preserves fallback titles, zero details, row order and source lines with sparse cells", () => {
    const entry = evidenceEntry("CP-1", "CP-1/fallback.md", true, [
      {
        type: "table",
        line: 5,
        headers: ["ID", "Severity", "Description", "Amount", "Empty", "Reason"],
        rows: [
          { line: 6, cells: ["G-1", " Critical ", " Missing debt ", "0", "", " Last "] },
          { line: 7, cells: ["G-2", "", "Sparse trailing cells"] },
          { line: 8, cells: ["G-3", "High"] },
          { line: 9, cells: ["G-4", "High", " N/A "] },
        ],
      },
    ]);
    renderGaps([entry]);
    expect(screen.getByRole("heading", { name: "Gaps 2" })).toBeVisible();
    const row = screen.getByRole("row", { name: /Missing debt/ });
    expect(row.closest("tbody")?.querySelector('th[scope="rowgroup"]')?.textContent).toBe(
      "Critical1",
    );
    expect(row).toHaveTextContent("ID: G-1 Amount: 0 Reason: Last");
    expect(row).not.toHaveTextContent("Empty:");
    expect(screen.getByRole("row", { name: /Sparse trailing cells/ })).toBeVisible();
    const links = screen.getAllByRole("link", { name: "Open handoff line" });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      [6, 7].map(
        (line) =>
          `/report/case#evidence/${encodeURIComponent(entry.output.id)}~${entry.output.sha256}-${String(line)}`,
      ),
    );
  });

  it("keeps the first-column fallback and excludes only paired comparison ledgers", () => {
    expect(
      hasRecordedGap([
        {
          type: "table",
          line: 5,
          headers: ["ID", "Severity"],
          rows: [{ line: 6, cells: ["0", "Low"] }],
        },
      ]),
    ).toBe(true);
    expect(
      hasRecordedGap([
        {
          type: "table",
          line: 5,
          headers: ["Earlier ref", "Gap"],
          rows: [{ line: 6, cells: ["E1", "Missing current evidence"] }],
        },
      ]),
    ).toBe(true);
  });

  it("handles empty lists and an unknown module filter without showing another module's rows", () => {
    const empty = renderGaps([]);
    expect(screen.getByText("No module-written gaps for Financial foundation.")).toBeVisible();
    empty.unmount();
    renderGaps(
      [
        evidenceEntry("CP-2G", "CP-2G/gaps.md", true, [
          { type: "text", line: 12, end: 12, text: "Different module gap." },
        ]),
      ],
      "CP-unknown",
    );
    expect(screen.getByText("No module-written gaps for CP-unknown.")).toBeVisible();
    expect(screen.queryByText("Different module gap.")).toBeNull();
  });
});

it("does not repeat the retained-preview notice inside the Evidence page", () => {
  const run = { folder: "case", evidence: emptyEvidence } as unknown as PublishedRun;
  const snapshot = {
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips: {},
    preview: { reason: "Retained method check; listing withheld." },
  } as unknown as Snapshot;
  render(
    <ReportEvidence snapshot={snapshot} run={run} entries={[]} target="summary" mode="synthetic" />,
  );
  expect(screen.queryByRole("note")).toBeNull();
  expect(screen.getByRole("heading", { name: "Evidence" })).toBeInTheDocument();
});

it("keeps filtered summary counts, alternate handoffs and source identities across evidence tabs", () => {
  const entries = [
    evidenceEntry("CP-1", "selected", true, []),
    evidenceEntry("CP-1", "alternate", false, []),
    evidenceEntry("CP-2G", "other", true, []),
  ];
  const source = {
    name: "Issuer filing",
    type: "PDF",
    documentDate: "2026-10-31",
    readBy: ["CP-1"],
    sha256: "source-digest",
  };
  const evidence = {
    ...emptyEvidence,
    sources: [source],
    unused: [{ ...source, name: "Other module", readBy: ["CP-2G"] }],
    unrecorded: [{ ...source, name: "Use unknown", sha256: null }],
  };
  const summary = renderEvidence(entries, "summary/CP-1", evidence);
  const holds = within(screen.getByLabelText("What this run holds"));
  expect(holds.getByText("designated handoff").closest("div")).toHaveTextContent("1");
  expect(holds.getByText("source files").closest("div")).toHaveTextContent("2");
  expect(
    screen.getByRole("link", { name: "Financial foundation · Saved alternate" }),
  ).toHaveAttribute("href", `/report/case#evidence/alternate~${"a".repeat(64)}`);
  expect(screen.queryByRole("link", { name: /Forward credit model/ })).toBeNull();
  summary.unmount();
  const sources = renderEvidence(entries, "sources/CP-1", evidence);
  expect(screen.getByText("Issuer filing")).toBeVisible();
  expect(screen.getByText("source-digest")).toBeVisible();
  expect(screen.getByText("Use unknown")).toBeVisible();
  expect(screen.queryByText("Other module")).toBeNull();
  expect(screen.queryByText("Supplied but unnamed in handoffs")).toBeNull();
  sources.unmount();
  renderEvidence(entries, "sources/CP-unknown", evidence);
  expect(screen.getByText("No issuer files are listed for CP-unknown.")).toBeVisible();
  expect(screen.queryByText("Issuer filing")).toBeNull();
});

it("does not admit a stale evidence address or display the handoff list for it", () => {
  const entry = evidenceEntry("CP-1", "saved", true, []);
  renderEvidence([entry], `saved~${"b".repeat(64)}`);
  expect(screen.getByRole("alert")).toHaveTextContent("Evidence link unavailable");
  expect(screen.queryByRole("heading", { name: "Handoffs" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Run evidence" })).toBeNull();
});

// Decision 9 (OQ-04, C5-011): supplied source files are listed only, never opened from the report.
it("lists retained files from the source inventory without a link to open them", () => {
  const sha256 = "d".repeat(64);
  const href = `/connected/sources/case/${sha256}/Issuer.txt`;
  renderEvidence([], "sources", {
    ...emptyEvidence,
    sources: [
      { name: "Issuer.txt", type: "txt", documentDate: null, readBy: [], sha256, href },
      {
        name: "Missing.txt",
        type: "txt",
        documentDate: null,
        readBy: [],
        sha256,
        sourceWarning: "Retained source is unavailable",
      },
    ],
  });
  expect(screen.getByText("Issuer.txt")).toBeVisible();
  expect(screen.queryByRole("link", { name: "Open source file: Issuer.txt" })).toBeNull();
  expect(document.querySelector(`a[href="${href}"]`)).toBeNull();
  expect(screen.queryByRole("link", { name: "Open source file: Missing.txt" })).toBeNull();
  expect(screen.getByText("Retained source is unavailable")).toBeVisible();
});

it("preserves citation identity, warnings and cited pages without links or invented detail", () => {
  const entry = evidenceEntry("CP-1", "case/CP-1.md", true, [
    { type: "text", line: 5, end: 5, text: "A dated facility confirmation was not supplied." },
  ]);
  const hash = "c".repeat(64);
  const href = `/connected/sources/case/${hash}/filing.txt`;
  const missing = {
    label: "Source identity missing",
    quote: null,
    excerpt: null,
    file: null,
    source: null,
    sha256: null,
    reason: null,
  };
  renderEvidence(
    [entry],
    `${encodeURIComponent(entry.output.id)}~${entry.output.sha256}`,
    emptyEvidence,
    {
      [`${entry.output.id}:5`]: [
        {
          ...missing,
          label: "Filing citation",
          file: "filing.txt",
          source: "Fallback should not replace filename",
          sha256: hash,
          href,
          pageHref: `${href}?page=2&end=3`,
          excerpt: "Exact retained source passage.",
          reason: "Printed page numbering differs.",
          quote_found: false,
        },
        { ...missing, label: "Named source only", source: "Issuer presentation" },
        missing,
        { ...missing, label: "Empty filename", file: "", source: "Do not coerce empty to missing" },
      ],
    },
  );
  const item = (label: string) => {
    const li = screen.getByText(label, { exact: true }).closest("li");
    if (!li) throw new Error(`Missing citation list item: ${label}`);
    return within(li);
  };
  const citation = item("Filing citation");
  expect(citation.getByText("filing.txt", { exact: true })).toBeVisible();
  expect(citation.queryByText("Fallback should not replace filename")).toBeNull();
  expect(citation.getByText("Exact retained source passage.").tagName).toBe("BLOCKQUOTE");
  expect(
    citation.getByText(
      "Printed page numbering differs. The recorded quote or value was not located on the cited page.",
    ),
  ).toBeVisible();
  expect(citation.queryAllByRole("link")).toEqual([]);
  expect(citation.getByText("Cited pages 2–3")).toBeVisible();
  expect(citation.getByText(hash).tagName).toBe("CODE");
  expect(item("Named source only").getByText("Issuer presentation")).toBeVisible();
  expect(item("Named source only").queryByRole("link")).toBeNull();
  expect(item("Source identity missing").queryByRole("link")).toBeNull();
  expect(item("Source identity missing").queryByText(hash)).toBeNull();
  expect(item("Empty filename").queryByText("Do not coerce empty to missing")).toBeNull();
});

const CODE = /\(CP-[A-Za-z0-9]+\)/;

it("drops the code of a named module from a gap row's recorded detail", () => {
  const entry = evidenceEntry("CP-1", "out", true, [
    {
      type: "table",
      line: 5,
      headers: ["Gap", "Severity", "Effect"],
      rows: [{ line: 7, cells: ["No facility headroom", "High", "Limits Liquidity (CP-2D)"] }],
    },
  ]);
  renderGaps([entry]);
  expect(document.body.textContent).toContain("Limits Liquidity");
  expect(document.body.textContent).not.toMatch(CODE);
});

it("draws a handoff's Sources row with the file name as stored", () => {
  const entry = evidenceEntry("CP-1", "out", true, []);
  entry.sections = [
    {
      heading: "Sources",
      level: 2,
      line: 4,
      blocks: [
        {
          type: "table",
          line: 5,
          headers: ["Source document name", "Use"],
          rows: [{ line: 7, cells: ["Deck (CP-1) Q3.pdf", "Liquidity figures"] }],
        },
      ],
    },
  ];
  renderEvidence([entry], `out~${"a".repeat(64)}`);
  expect(screen.getByRole("cell", { name: "Deck (CP-1) Q3.pdf" })).toBeInTheDocument();
});

// Owner ruling 2026-11-26: the symbol notation is for reader pages; Evidence keeps the raw cell.
it("draws a handoff table's Unit cells as the module wrote them, not as a currency symbol", () => {
  const entry = evidenceEntry("CP-1", "out", true, []);
  entry.sections = [
    {
      heading: "T4.4 Income statement",
      level: 3,
      line: 4,
      blocks: [
        {
          type: "table",
          line: 5,
          headers: ["Line item", "FY2024", "Unit"],
          rows: [
            { line: 7, cells: ["Net sales", "7940", "USD millions"] },
            { line: 8, cells: ["Operating income", "3,463", "GBP millions"] },
          ],
        },
      ],
    },
  ];
  renderEvidence([entry], `out~${"a".repeat(64)}`);
  expect(screen.getByRole("cell", { name: "USD millions" })).toBeVisible();
  expect(screen.getByRole("cell", { name: "GBP millions" })).toBeVisible();
  expect(document.body.textContent).not.toMatch(/\$m|£m/);
});

it.each(["Deck Q3.pdf", "Deck (CP-1) Q3.pdf"])(
  "lists the source record of a figure whose Basis names %j",
  (name) => {
    const entry = evidenceEntry("CP-1", "out", true, []);
    entry.sections = [
      { heading: "Findings", level: 2, line: 1, blocks: [] },
      {
        heading: "Key findings",
        level: 3,
        line: 3,
        blocks: [
          { type: "text", line: 4, end: 5, text: `Cash covers the year.\nBasis: ${name}, page 3` },
        ],
      },
    ];
    const evidence = {
      ...emptyEvidence,
      sources: [
        {
          name,
          type: "PDF",
          documentDate: "2026-10-31",
          readBy: ["CP-1"],
          sha256: "source-digest",
        },
      ],
    } as unknown as PublishedRun["evidence"];
    renderEvidence([entry], `out~${"a".repeat(64)}-4`, evidence);
    expect(screen.getByRole("heading", { name: "How it was derived" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source records" })).toBeInTheDocument();
  },
);

it("shows the service's comparison note in full on the Record tab", () => {
  vi.stubGlobal("fetch", () => new Promise(() => {}));
  const note =
    "changes: not produced \u2014 cpos_live_not_accepted: CP-8 not accepted within bounds";
  const run = {
    folder: "case",
    evidence: emptyEvidence,
    changes: { note },
  } as unknown as PublishedRun;
  const snapshot = {
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips: {},
  } as unknown as Snapshot;
  render(
    <ReportEvidence snapshot={snapshot} run={run} entries={[]} target="record" mode="synthetic" />,
  );
  // A comparison note opens the run record, so the link that sends a reader to it lands on it.
  expect(
    screen.getByText("Show the run record", { selector: "summary" }).closest("details"),
  ).toHaveAttribute("open");
  expect(screen.getByText("Comparison note:")).toBeVisible();
  expect(screen.getByText(note)).toBeVisible();
  vi.unstubAllGlobals();
});
