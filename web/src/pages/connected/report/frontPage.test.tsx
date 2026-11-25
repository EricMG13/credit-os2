import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { Block, OutputEntry, PublishedRun, Section, Table } from "../publishedReport";
import { buildIssuerFrontPage } from "./frontPage";
import { IssuerFrontPage } from "./IssuerFrontPage";
import type { ReportView } from "../reportView";

const SHA = "c".repeat(64);
const credit = "Creditors have a cash buffer, with downside tied to distributions.";
const paragraph = (line: number, text: string): Block => ({ type: "text", line, end: line, text });
const section = (line: number, heading: string, blocks: Block[]): Section => ({
  heading,
  line,
  blocks,
  level: heading === "Findings" ? 2 : 3,
});

const leverage: Table = {
  type: "table",
  line: 11,
  headers: ["Period", "Net debt / EBITDA", "Reporting unit", "Basis and limitation"],
  rows: [
    { line: 13, cells: ["FY 2025", "0.00", "x", "Basis is in issuer.pdf, Q page:2."] },
    {
      line: 14,
      cells: ["FY 2026", "Not supplied: denominator not measured", "x", "No observed ratio."],
    },
  ],
};
const financials: Table = {
  type: "table",
  line: 18,
  headers: ["Metric", "Period", "Amount / ratio", "Basis and limitation", "Source"],
  rows: [
    {
      line: 20,
      cells: [
        "Net revenues",
        "2025-12-31",
        "USD 1,250 million",
        "Reported and consolidated",
        "issuer.pdf",
      ],
    },
    {
      line: 21,
      cells: [
        "Free cash flow",
        "2025-12-31",
        "USD 0 million",
        "Operating cash flow less capex",
        "issuer.pdf",
      ],
    },
  ],
};

function owner(module: string, sections: Section[], id = module): OutputEntry {
  return { output: { id, module, sha256: SHA, href: "", label: module }, sections, selected: true };
}

function inputs() {
  const foundation = owner("CP-1", [
    section(1, "Findings", []),
    section(10, "Chart data: leverage", [
      leverage,
      paragraph(15, "A page:172 excludes the restricted funding."),
    ]),
    section(17, "Financials and credit metrics", [financials]),
  ]);
  foundation.output.charts = [{ title: "Leverage", table: 11, columns: [1], unit: "x" }];
  const entries = [
    owner("CP-2", [
      section(1, "Findings", []),
      section(2, "Bottom line", [paragraph(3, credit + "\nBasis: issuer.pdf")]),
      section(5, "Key findings", [paragraph(6, "Cash generated after capex was zero.")]),
      section(8, "Contrary evidence and what would change the view", [
        paragraph(9, "Refinancing extensions support financial flexibility."),
      ]),
      section(11, "Limitations", [paragraph(12, "Legal covenant scope was not established.")]),
    ]),
    foundation,
    owner("CP-6", [
      section(1, "Findings", []),
      section(2, "Bottom line", [paragraph(3, "Add 1.00% NAV.")]),
    ]),
    owner("CP-8", [
      section(1, "Findings", []),
      section(2, "Bottom line", [paragraph(3, "Another run states 9.99x.")]),
    ]),
  ];
  const view: ReportView = {
    folder: "selected-report",
    entries,
    modules: [],
    models: [],
    lead: entries[2],
    catalogue: undefined,
  };
  const run: PublishedRun = {
    folder: "selected-report",
    issuer: "Ridge",
    title: "Full credit assessment",
    period: "FY2025",
    asOf: "2026-01-31",
    pathway: "credit_snapshot",
    modules: {},
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
    publicationVerified: true,
    assessmentScope: "standard",
    lead: {
      module: "CP-2",
      output: "CP-2",
      sha256: SHA,
      line: 3,
      text: credit + "\nBasis: issuer.pdf",
    },
    actionTreatment: {
      "CP-6": {
        output: "CP-6",
        sha256: SHA,
        state: "withheld",
        scope: "committee",
        reason: "The owner marked this output blocked.",
      },
    },
  };
  return { view, run };
}
afterEach(cleanup);

it("draws the verified lead, scoped hold and exact zero before figures and tables", () => {
  const { view, run } = inputs();
  const page = buildIssuerFrontPage(view, run);
  expect(page?.lead).toMatchObject({ owner: { id: "CP-2", sha256: SHA }, line: 3 });
  expect(page?.scope).toBe("Standard pathway scope");
  expect(page?.actions[0]?.reason).toBe("The owner marked this output blocked.");
  if (!page) throw new Error("Expected a front page");
  const { container } = render(<IssuerFrontPage page={page} />);
  expect(screen.getByText(credit)).toBeVisible();
  expect(screen.getByRole("link", { name: "Show sources for Credit view" })).toHaveAttribute(
    "href",
    `/report/selected-report#evidence/CP-2~${SHA}-3`,
  );
  expect(screen.getAllByText("USD 0 million")).toHaveLength(2);
  expect(screen.getByText("Refinancing extensions support financial flexibility.")).toBeVisible();
  expect(container).not.toHaveTextContent(/Add 1.00|9.99x|issuer\.pdf|page:/);
  expect(screen.getAllByText("This run does not supply a chart for this figure.")).toHaveLength(2);
});

it("shows a supported specialist finding and its hold with exact independent traces", () => {
  const { view, run } = inputs();
  const page = buildIssuerFrontPage(view, { ...run, pathway: "relative_value" });
  if (!page) throw new Error("Expected a front page");
  const owner = { id: "market", sha256: SHA, module: "CP-3D" };
  render(
    <IssuerFrontPage
      page={page}
      specialist={{
        title: "Market-implied view",
        findings: [{ owner, line: 24, body: "Yield to maturity was 5.200%." }],
        restriction: {
          label: "Instrument preference withheld",
          reason: "Comparable executable quotes are unavailable.",
          source: { owner, line: 25 },
        },
      }}
    />,
  );
  expect(screen.queryByText("A verified finding is unavailable for this run.")).toBeNull();
  expect(screen.getByText("Yield to maturity was 5.200%.")).toBeVisible();
  expect(screen.getByText("Comparable executable quotes are unavailable.")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Show sources for Market-implied view" }),
  ).toHaveAttribute("href", `/report/selected-report#evidence/market~${SHA}-24`);
  expect(
    screen.getByRole("link", { name: "Show sources for Instrument preference withheld" }),
  ).toHaveAttribute("href", `/report/selected-report#evidence/market~${SHA}-25`);
});

it("fails closed for absent verification, stale lead or hold, and ambiguous chart ownership", () => {
  const { view, run } = inputs();
  expect(buildIssuerFrontPage(view, { ...run, publicationVerified: undefined })).toBeNull();
  expect(buildIssuerFrontPage(view, { ...run, folder: "another-run" })).toBeNull();
  const stale = { ...run, lead: run.lead && { ...run.lead, line: 4 }, actionTreatment: {} };
  const page = buildIssuerFrontPage(view, stale);
  expect(page?.lead).toBeUndefined();
  expect(page?.actions[0]?.reason).toBe(
    "This decision is not shown in this report because no clearance for it is recorded.",
  );
  expect(
    buildIssuerFrontPage(
      { ...view, entries: view.entries.filter(({ output }) => output.module !== "CP-6") },
      { ...run, pathway: "portfolio_decision" },
    )?.actions[0]?.reason,
  ).toBe("A published decision is unavailable for this run.");
  const foundation = view.entries[1];
  foundation?.sections.push(section(55, "Superseded chart table", [leverage]));
  expect(buildIssuerFrontPage(view, run)?.figures[0]).toMatchObject({ title: "Leverage" });
  expect(buildIssuerFrontPage(view, run)?.figures[0]?.descriptor).toBeUndefined();
});

it("prints the same text without source navigation or evidence-only table cells", () => {
  const { view, run } = inputs();
  const page = buildIssuerFrontPage(view, run);
  if (!page) throw new Error("Expected a front page");
  const { container } = render(<IssuerFrontPage page={page} print />);
  expect(screen.getByText(credit)).toBeVisible();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(container).not.toHaveTextContent(/issuer\.pdf|page:/);
  expect(screen.queryByText("Chart")).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "The chart is withheld because some observation qualifications are only available in Evidence.",
    ),
  ).toBeVisible();
  expect(screen.queryByText("0.00")).not.toBeInTheDocument();
  expect(
    screen.getByText("The observation qualification is only available in Evidence."),
  ).toBeVisible();
  expect(screen.getByText("Not supplied: denominator not measured")).toBeVisible();
  const finance = screen.getByRole("heading", { name: "Financial period grid" }).parentElement;
  if (!finance) throw new Error("Expected a financial table");
  expect(within(finance).getByText("USD 0 million")).toBeVisible();
});

it("keeps clean chart notes visible and gates the entire exhibit when another note is unresolved", () => {
  const { view, run } = inputs();
  const foundation = view.entries.find(({ output }) => output.module === "CP-1");
  const chart = foundation?.sections.find(({ heading }) => heading === "Chart data: leverage");
  if (!chart) throw new Error("Expected the chart owner");
  chart.blocks = [
    { ...leverage, rows: [{ line: 13, cells: ["FY 2025", "7.1239", "x", "Published balance"] }] },
    paragraph(15, "The ratio uses ordinary issuer EBITDA."),
    paragraph(16, "See https://internal.example/qualification for the adjustment restriction."),
  ];
  const page = buildIssuerFrontPage(view, run);
  if (!page) throw new Error("Expected a front page");
  render(<IssuerFrontPage page={page} print />);
  expect(screen.getByText("The ratio uses ordinary issuer EBITDA.")).toBeVisible();
  expect(screen.getByText(/The chart is withheld/)).toBeVisible();
  expect(screen.queryByText("7.1239")).not.toBeInTheDocument();
  expect(screen.queryByText(/internal.example/)).not.toBeInTheDocument();
});

it("keeps the validated earlier-format limitation and withholds debt amounts without a reporting unit", () => {
  const { view, run } = inputs();
  const [creditOwner, foundation] = view.entries;
  if (!creditOwner || !foundation) throw new Error("Expected credit and foundation fixtures");
  const limitation = "Cash availability and legal covenant headroom remain unverified.";
  creditOwner.sections = creditOwner.sections.filter(({ heading }) => heading !== "Limitations");
  creditOwner.sections.push(
    section(13, "Reader summary", [
      {
        type: "table",
        line: 14,
        headers: ["Bottom line", "Confidence", "Main limitation"],
        rows: [{ line: 16, cells: [credit, "Medium", limitation] }],
      },
    ]),
  );
  creditOwner.output.summary = { bottomLine: credit, confidence: "Medium", limitation, line: 16 };
  foundation.sections.push(
    section(24, "Debt, financing and liquidity foundation", [
      {
        type: "table",
        line: 25,
        headers: [
          "Debt instrument / component",
          "Gross amount 2025-12-31",
          "Maturity / rate reported",
        ],
        rows: [
          {
            line: 27,
            cells: ["Senior secured note", "2,650", "July 2028, 5.25% contractual coupon"],
          },
        ],
      },
    ]),
  );
  const page = buildIssuerFrontPage(view, run);
  if (!page) throw new Error("Expected a front page");
  expect(page.limitations).toEqual([
    { owner: { id: "CP-2", module: "CP-2", sha256: SHA }, line: 16, body: limitation },
  ]);
  render(<IssuerFrontPage page={page} />);
  expect(screen.getByText(limitation)).toBeVisible();
  expect(screen.getByText("July 2028, 5.25% contractual coupon")).toBeVisible();
  expect(screen.queryByText("2,650")).not.toBeInTheDocument();
});

it("keeps the accepted issuer profile and dated gross debt stack together, with no overlapping debt rows", () => {
  const { view, run } = inputs();
  const foundation = view.entries.find(({ output }) => output.module === "CP-1");
  if (!foundation) throw new Error("Expected foundation fixture");
  view.entries.push({
    output: { id: "operating", module: "CP-1A", sha256: SHA, label: "Operating profile", href: "" },
    selected: true,
    sections: [
      section(1, "Findings", []),
      section(29, "company_description — issuer profile", [
        {
          type: "table",
          line: 30,
          headers: ["Business description", "Sector", "Country"],
          rows: [{ line: 32, cells: ["Makes aircraft components", "Aerospace", "United States"] }],
        },
      ]),
    ],
  });
  foundation.sections.push(
    section(50, "Debt, financing and liquidity foundation", [
      {
        type: "table",
        line: 51,
        headers: [
          "Debt instrument / component",
          "Gross amount 2025-12-31",
          "Net amount 2025-12-31",
          "Maturity / rate reported",
          "Evidence",
        ],
        rows: [
          {
            line: 53,
            cells: [
              "Short-term borrowings—trade receivable securitization facility",
              "650",
              "649",
              "July 11, 2026; Term SOFR + 1.45%",
              "Q page:52; fully drawn confirmed",
            ],
          },
          {
            line: 52,
            cells: ["Term loans", "1,000", "990", "Two tranches", "Q page:46"],
          },
          {
            line: 54,
            cells: [
              "5.50% 2027 Notes",
              "2,650",
              "2,641",
              "November 15, 2027; 5.50%",
              "Q page:47; senior subordinated",
            ],
          },
          {
            line: 55,
            cells: ["Less: current portion", "99", "98", "Classification only", "Q page:19"],
          },
          {
            line: 56,
            cells: [
              "Total funded debt including receivables facility",
              "4,300",
              "4,280",
              "Calculated",
              "Includes receivables",
            ],
          },
        ],
      },
      {
        type: "table",
        line: 70,
        headers: [
          "Term-loan tranche",
          "Gross principal, USD millions",
          "Contractual maturity",
          "Reported floating rate",
          "Source",
        ],
        rows: [
          { line: 72, cells: ["I", "600", "August 24, 2028", "Term SOFR + 2.75%", "Q page:46"] },
          { line: 73, cells: ["J", "400", "February 28, 2031", "Term SOFR + 2.50%", "Q page:46"] },
        ],
      },
    ]),
    { heading: "Calculations", level: 2, line: 58, blocks: [] },
    section(60, "Calculation conventions and trace", [
      paragraph(
        61,
        "Monetary operands/results are USD millions for Ridge and its consolidated subsidiaries; values are exact.",
      ),
      {
        type: "table",
        line: 62,
        headers: ["Register", "Calculated result"],
        rows: [{ line: 64, cells: ["C3 current gross debt", "4,300"] }],
      },
    ]),
  );
  const page = buildIssuerFrontPage(view, run);
  if (!page) throw new Error("Expected a front page");
  const { container } = render(<IssuerFrontPage page={page} />);
  const brief = container.querySelector<HTMLElement>(".issuer-brief");
  if (!brief) throw new Error("Expected a first page");
  expect(within(brief).getByText("Makes aircraft components")).toBeVisible();
  expect(
    within(brief).getByRole("link", { name: "Show sources for Business description" }),
  ).toHaveAttribute("href", `/report/selected-report#evidence/operating~${SHA}-32`);
  expect(within(brief).getByText("Gross principal · USD millions · 2025-12-31")).toBeVisible();
  expect(page.capital?.table.rows.map(({ cells }) => cells)).toEqual([
    ["Receivables facility", "Fully drawn", "650", "Term SOFR + 1.45%", "11 Jul 2026"],
    ["Term loan I", "", "600", "Term SOFR + 2.75%", "24 Aug 2028"],
    ["Term loan J", "", "400", "Term SOFR + 2.50%", "28 Feb 2031"],
    ["5.50% 2027 Notes", "Senior subordinated", "2,650", "5.50%", "15 Nov 2027"],
    ["Total funded debt", "", "4,300", "", ""],
  ]);
  expect(within(brief).getByRole("link", { name: "Show sources for Term loan I" })).toHaveAttribute(
    "href",
    `/report/selected-report#evidence/CP-1~${SHA}-72`,
  );
  expect(brief).not.toHaveTextContent(/2,641|Less: current portion|Q page/);
  const debtSection = foundation.sections.find(
    ({ heading }) => heading === "Debt, financing and liquidity foundation",
  );
  const [debt, detail] = debtSection?.blocks ?? [];
  if (
    !debtSection ||
    debt?.type !== "table" ||
    detail?.type !== "table" ||
    !detail.rows[0] ||
    !detail.rows[1]
  )
    throw new Error("Expected dated gross debt and tranche detail");
  const termLoanRows = () =>
    buildIssuerFrontPage(view, run)
      ?.capital?.table.rows.filter(({ cells }) => cells[0]?.startsWith("Term loan"))
      .map(({ cells }) => cells[0]);
  const tranche = detail.rows[1];
  tranche.cells[1] = "399";
  expect(termLoanRows()).toEqual(["Term loans"]);
  tranche.cells[1] = "400";
  tranche.cells[0] = "I";
  expect(termLoanRows()).toEqual(["Term loans"]);
  tranche.cells[0] = "J";
  tranche.cells[2] = "February 29, 2031";
  expect(termLoanRows()).toEqual(["Term loans"]);
  tranche.cells[2] = "February 28, 2031";
  tranche.cells[3] = "Executable at 98";
  expect(termLoanRows()).toEqual(["Term loans"]);
  tranche.cells[3] = "Term SOFR + 2.50%";
  tranche.cells[4] = "  Not supplied";
  expect(termLoanRows()).toEqual(["Term loans"]);
  tranche.cells[4] = "Q page:46";
  detail.rows.pop();
  detail.rows[0].cells[1] = "1,000";
  expect(termLoanRows()).toEqual(["Term loans"]);
  detail.rows[0].cells[1] = "600";
  detail.rows.push(tranche);
  const index = foundation.sections.indexOf(debtSection) + 1;
  debtSection.blocks.pop();
  foundation.sections.splice(index, 0, section(69, debtSection.heading, [detail]));
  expect(termLoanRows()).toEqual(["Term loans"]);
  foundation.sections.splice(index, 1);
  debtSection.blocks.push(detail);
  expect(termLoanRows()).toEqual(["Term loan I", "Term loan J"]);
  const finance = foundation.sections.find(
    ({ heading }) => heading === "Financials and credit metrics",
  );
  const financeTable = finance?.blocks[0];
  if (financeTable?.type !== "table") throw new Error("Expected the financial table");
  financeTable.rows.push({
    line: 22,
    cells: [
      "Net debt / EBITDA",
      "2025-12-31",
      "2.00x",
      "Consolidated; cash netting unrestrictedness not certified",
      "issuer.pdf",
    ],
  });
  expect(
    buildIssuerFrontPage(view, run)?.headline.find(({ category }) => category === "Net leverage")
      ?.label,
  ).toBe("Net debt / EBITDA");
  const notes = debt.rows.find(({ cells }) => cells[0] === "5.50% 2027 Notes");
  if (!notes) throw new Error("Expected the notes row");
  const noteCells = () =>
    buildIssuerFrontPage(view, run)?.capital?.table.rows.find(
      ({ cells }) => cells[0] === "5.50% 2027 Notes",
    )?.cells;
  notes.cells[3] = "four tranches; Term SOFR + 2.50%; 2028-2032";
  expect(noteCells()?.slice(3)).toEqual(["four tranches; Term SOFR + 2.50%; 2028-2032", ""]);
  notes.cells[3] = "July 1, 2027; 5.50%; callable";
  expect(noteCells()?.slice(3)).toEqual(["5.50%; callable", "1 Jul 2027"]);
  notes.cells[3] = "November 15, 2027; 5.50%";
  const total = debt.rows.find(({ cells }) => cells[0]?.startsWith("Total funded debt"));
  if (!total) throw new Error("Expected the total row");
  const totalCells = () => buildIssuerFrontPage(view, run)?.capital?.table.rows.at(-1)?.cells;
  total.cells[3] = "Excludes finance leases";
  expect(totalCells()).toEqual(["Total funded debt", "", "4,300", "Excludes finance leases", ""]);
  total.cells[3] = "Calculated";
  expect(totalCells()).toEqual(["Total funded debt", "", "4,300", "", ""]);
  debt.rows.push({ line: 57, cells: ["Total secured notes", "0", "0", "Subtotal", "Source"] });
  expect(buildIssuerFrontPage(view, run)?.capitalBasis).toBeUndefined();
  debt.rows.pop();
  expect(buildIssuerFrontPage(view, { ...run, asOf: "2025-12-30" })?.capitalBasis).toBeUndefined();
  const calculations = foundation.sections.find(
    ({ heading }) => heading === "Calculation conventions and trace",
  );
  if (!calculations) throw new Error("Expected calculation conventions");
  const bridge = calculations.blocks[1];
  if (bridge?.type !== "table" || !bridge.rows[0]) throw new Error("Expected calculation bridge");
  bridge.rows[0].cells[1] = "4,301";
  expect(buildIssuerFrontPage(view, run)?.capitalBasis).toBeUndefined();
});

it("does not promote tables with familiar headings from Sources or downstream instructions", () => {
  const { view, run } = inputs();
  const foundation = view.entries.find(({ output }) => output.module === "CP-1");
  if (!foundation) throw new Error("Expected foundation fixture");
  foundation.sections.splice(2, 0, { heading: "Next module", level: 2, line: 16, blocks: [] });
  foundation.sections.push({ heading: "Sources", level: 2, line: 24, blocks: [] });
  foundation.sections.push(
    section(25, "Chart data: debt stack", [
      {
        type: "table",
        line: 26,
        headers: ["Facility", "Ranking", "Amount", "Reporting unit"],
        rows: [{ line: 27, cells: ["Private forwarding instruction", "Senior", "666", "US$m"] }],
      },
    ]),
  );
  const page = buildIssuerFrontPage(view, run);
  expect(page?.headline).toEqual([]);
  expect(page?.financials).toBeUndefined();
  expect(page?.instruments).toBeUndefined();
});

it("uses the report date and explicit row units for a fiscal-period financial matrix", () => {
  const { view, run } = inputs();
  const foundation = view.entries.find(({ output }) => output.module === "CP-1");
  if (!foundation) throw new Error("Expected foundation fixture");
  foundation.sections = foundation.sections.filter(
    ({ heading }) => heading !== "Financials and credit metrics",
  );
  foundation.sections.push(
    section(18, "Financials and credit metrics", [
      {
        type: "table",
        line: 19,
        headers: [
          "Metric",
          "FY2025 / 2025-12-31",
          "FY2024 / 2024-12-31",
          "Unit",
          "Status, definition and evidence",
        ],
        rows: [
          { line: 21, cells: ["NET SALES", "7,940", "6,585", "US$m", "Reported; annual page:121"] },
          {
            line: 22,
            cells: [
              "EBITDA As Defined",
              "4,173",
              "3,395",
              "US$m",
              "Issuer-reported adjusted measure",
            ],
          },
          {
            line: 23,
            cells: [
              "Net debt / reported EBITDA",
              "4.93",
              "5.22",
              "x",
              "Consolidated cash netting only",
            ],
          },
        ],
      },
    ]),
  );
  const page = buildIssuerFrontPage(view, { ...run, asOf: "2025-12-31" });
  expect(page?.headline.map(({ value, period }) => [value, period])).toEqual([
    ["US$7,940m", "FY2025 / 2025-12-31"],
    ["US$4,173m", "FY2025 / 2025-12-31"],
    ["4.93x", "FY2025 / 2025-12-31"],
  ]);
  expect(page?.headline.map(({ prior }) => prior)).toEqual([
    { value: "US$6,585m", period: "FY2024 / 2024-12-31" },
    { value: "US$3,395m", period: "FY2024 / 2024-12-31" },
    { value: "5.22x", period: "FY2024 / 2024-12-31" },
  ]);
  const unbound = buildIssuerFrontPage(view, { ...run, asOf: "2026-12-31" });
  expect(unbound?.headline).toEqual([]);
  expect(unbound?.financials?.table.rows).toHaveLength(3);
});

it("requires the published unit for naked figures and for each instrument amount", () => {
  const { view, run } = inputs();
  const foundation = view.entries.find(({ output }) => output.module === "CP-1");
  if (!foundation) throw new Error("Expected foundation fixture");
  foundation.sections = foundation.sections.filter(
    ({ heading }) => heading !== "Financials and credit metrics",
  );
  foundation.sections.push(
    section(18, "Financials and credit metrics", [
      {
        type: "table",
        line: 19,
        headers: ["Metric", "Period", "Amount / ratio", "Unit"],
        rows: [
          { line: 21, cells: ["Net revenues", "FY2025", "25", "x"] },
          { line: 22, cells: ["Adjusted EBITDA", "FY2025", "50", ""] },
          { line: 23, cells: ["Free cash flow", "FY2025", "0", "US$m"] },
        ],
      },
    ]),
  );
  foundation.sections.push(
    section(28, "Chart data: debt stack", [
      {
        type: "table",
        line: 29,
        headers: ["Facility", "Ranking", "Amount", "Reporting unit"],
        rows: [
          { line: 31, cells: ["Note A", "Senior", "900", ""] },
          { line: 32, cells: ["Note B", "Junior", "800", "x"] },
          { line: 33, cells: ["Note C", "Senior", "0", "EURm"] },
        ],
      },
    ]),
  );
  const page = buildIssuerFrontPage(view, run);
  expect(page?.headline.map(({ value }) => value)).toEqual(["US$0m"]);
  expect(page?.instruments?.table.rows.map(({ cells }) => cells[2])).toEqual([
    "Reporting unit unavailable",
    "Reporting unit unavailable",
    "0",
  ]);
});

it("keeps the differing-rating notice on the front page, on screen only", () => {
  const { view, run } = inputs();
  view.catalogue = {
    metrics: {},
    ratings: [
      { agency: "Moody's", label: "B2", scope: "issuer", outlook: "Stable", date: "2025-06-01" },
    ],
  } as unknown as ReportView["catalogue"];
  view.entries.push(
    owner("CP-2H", [
      section(1, "Findings", []),
      section(30, "T2R.1 Rating evidence register", [
        {
          type: "table",
          line: 32,
          headers: ["Agency", "Issuer/instrument", "Rating", "Outlook/watch", "Effective date"],
          rows: [{ line: 34, cells: ["Moody's", "Issuer", "B3", "Stable", "2025-06-10"] }],
        },
      ]),
    ]),
  );
  const page = buildIssuerFrontPage(view, run);
  if (!page) throw new Error("Expected a front page");
  const { unmount } = render(<IssuerFrontPage page={page} />);
  const link = screen.getByRole("link", { name: /shows a different rating for Moody's/ });
  expect(link.getAttribute("href")).toMatch(/#modules\/CP-2H$/);
  expect(screen.getByText(/Entered rating/)).toHaveTextContent("Moody's B2 Stable 2025-06-01");
  unmount();
  render(<IssuerFrontPage page={page} print />);
  expect(screen.queryByText(/shows a different rating/)).toBeNull();
});

it.each(["Basis is in issuer.pdf, section 4.", "page:12"])(
  "still shows cash and undrawn amounts when their basis is a reference or empty after redaction (%s)",
  (basis) => {
    const { view, run } = inputs();
    const page = buildIssuerFrontPage(view, run);
    if (!page) throw new Error("Expected a front page");
    const owner = { id: "CP-1", module: "CP-1", sha256: SHA };
    const { container } = render(
      <IssuerFrontPage
        page={{
          ...page,
          liquidity: { owner, line: 5, cash: "USD 120m", undrawn: "USD 300m", basis },
        }}
      />,
    );
    expect(container).toHaveTextContent("Cash USD 120m");
    expect(container).toHaveTextContent("Undrawn committed facilities USD 300m");
    expect(screen.getByText("The basis for these amounts is available in Evidence.")).toBeVisible();
    expect(container).not.toHaveTextContent(/issuer\.pdf|page:12/);
  },
);

const NOT_SHOWN =
  "This decision is not shown in this report because no clearance for it is recorded.";
const NOT_SHOWN_ON_SCREEN =
  "This page does not show a bottom line for the Committee decision module, because no clearance for it is recorded. Its other passages, such as its limitations, may be shown here; the Committee decision page shows its findings.";
const UNAVAILABLE = "A published decision is unavailable for this run.";

it("calls a readable decision with no recorded hold not shown in the report when printed and not shown on the page on screen, and keeps unavailable otherwise", () => {
  const { view, run } = inputs();
  const free = buildIssuerFrontPage(view, { ...run, actionTreatment: {} });
  if (!free) throw new Error("Expected a front page");
  expect(free.actions).toEqual([
    {
      module: "CP-6",
      label: "Committee action and size",
      status: "not shown",
      reason: NOT_SHOWN,
      screenReason: NOT_SHOWN_ON_SCREEN,
      held: false,
    },
  ]);
  const { container, unmount } = render(<IssuerFrontPage page={free} print />);
  expect(screen.getByText(NOT_SHOWN)).toBeVisible();
  expect(container).not.toHaveTextContent(
    /Overview|holds|clearance is not recorded|on this page|under Modules/,
  );
  const compact = container.querySelector<HTMLElement>(".issuer-brief-actions");
  if (!compact) throw new Error("Expected the compact decision line");
  expect(compact).toHaveTextContent("Committee action and sizeNot shown");
  unmount();
  const onScreen = render(<IssuerFrontPage page={free} />);
  expect(screen.getByText(NOT_SHOWN_ON_SCREEN)).toBeVisible();
  expect(onScreen.container).not.toHaveTextContent(
    /in this report|holds|clearance is not recorded/,
  );
  onScreen.unmount();

  const committee = view.entries[2];
  if (!committee) throw new Error("Expected the committee output");
  const decision = committee.sections[1];
  if (!decision) throw new Error("Expected the committee bottom line");
  const blockedView = {
    ...view,
    entries: view.entries.map((entry) =>
      entry === committee
        ? {
            ...committee,
            sections: [
              committee.sections[0],
              { ...decision, blocks: [paragraph(3, "Not assessable: no mandate inputs.")] },
            ].filter((item): item is Section => Boolean(item)),
          }
        : entry,
    ),
  };
  expect(buildIssuerFrontPage(blockedView, { ...run, actionTreatment: {} })?.actions).toEqual([
    {
      module: "CP-6",
      label: "Committee action and size",
      status: "unavailable",
      reason: UNAVAILABLE,
      held: false,
    },
  ]);
  const emptyView = {
    ...view,
    entries: view.entries.map((entry) =>
      entry === committee ? { ...committee, sections: [] } : entry,
    ),
  };
  expect(
    buildIssuerFrontPage(emptyView, { ...run, actionTreatment: {} })?.actions[0],
  ).toMatchObject({
    status: "unavailable",
    reason: UNAVAILABLE,
  });
  const hold = run.actionTreatment?.["CP-6"];
  if (!hold) throw new Error("Expected the committee hold");
  const unprintable = {
    ...run,
    actionTreatment: { "CP-6": { ...hold, reason: "The hold is set out in committee.pdf." } },
  };
  expect(buildIssuerFrontPage(view, unprintable)?.actions).toEqual([
    {
      module: "CP-6",
      label: "Committee action and size",
      status: "unavailable",
      reason: UNAVAILABLE,
      held: true,
    },
  ]);
});

it("says in print that the cash and undrawn basis is not shown, and points to Evidence on screen", () => {
  const { view, run } = inputs();
  const page = buildIssuerFrontPage(view, run);
  if (!page) throw new Error("Expected a front page");
  const owner = { id: "CP-1", module: "CP-1", sha256: SHA };
  const liquidity = { owner, line: 5, cash: "USD 120m", undrawn: "USD 300m", basis: "page:12" };
  const { container, unmount } = render(<IssuerFrontPage page={{ ...page, liquidity }} print />);
  expect(container).toHaveTextContent("Cash USD 120m");
  expect(
    screen.getByText("The basis for these amounts is not shown in this report."),
  ).toBeVisible();
  expect(container).not.toHaveTextContent(/amounts is available in Evidence|page:12/);
  unmount();
  render(<IssuerFrontPage page={{ ...page, liquidity }} />);
  expect(screen.getByText("The basis for these amounts is available in Evidence.")).toBeVisible();
});
