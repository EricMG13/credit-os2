import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { PublishedRun } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";

type View = ReturnType<typeof buildReportView>;
const run = { folder: "current", issuer: "Northbridge" } as PublishedRun;
const value = (exact: string, display = exact) => ({ status: "value", exact, display });

const periods = ["FY2025E", "FY2026E", "FY2027E"];
const columns = ["Base case", "Downside case"].flatMap((group) =>
  periods.map((label, at) => ({
    label,
    group,
    start: `${String(2025 + at)}-04-01`,
    end: `${String(2026 + at)}-03-31`,
  })),
);
const row = (label: string, cells: unknown[]) => ({
  label,
  band: "",
  kind: "",
  total: false,
  cells,
});
const model = {
  id: "d".repeat(64),
  issuerKey: "issuer",
  runId: "current",
  runFolder: "current",
  href: "",
  download: "",
  sources: [],
  cashflow: {
    units: "USD millions",
    limits: [],
    notes: ["Downside case is the stress case: a shock applied to the base-case drivers."],
    columns,
    rows: [
      row(
        "Adj EBITDA (EBITDA As Defined)",
        ["315", "339", "360", "252", "271", "288"].map((v) => value(v)),
      ),
      row(
        "Net leverage (net debt / Adj EBITDA)",
        ["1.23", "0.75", "0.29", "1.80", "1.45", "1.10"].map((v) => value(v, `${v}x`)),
      ),
      row(
        "Interest coverage (Adj EBITDA / interest)",
        ["8.75", "10.26", "12.00", "6.36", "7.46", "8.73"].map((v) => value(v, `${v}x`)),
      ),
      row(
        "Cash proxy (not issuer free cash flow)",
        ["132", "153", "172", "65", "82", "97"].map((v) => value(v)),
      ),
      row(
        "Distributions",
        Array.from({ length: 6 }, () => value("20")),
      ),
      row(
        "Debt repayment",
        Array.from({ length: 6 }, () => value("50")),
      ),
    ],
  },
};
const view = (models: unknown[]) =>
  ({ catalogue: undefined, lead: undefined, entries: [], modules: [], models }) as unknown as View;

it("lays the tiles in the screen map's order, the lead first after the figures", () => {
  render(<Forecast view={view([model])} run={run} />);
  const names = screen
    .getAllByRole("region")
    .map((region) => region.getAttribute("aria-label"))
    .filter((name) =>
      [
        "Forecast",
        "Net leverage path",
        "What breaks, and when",
        "Assumptions by case",
        "Forecast grid",
        "Uses of cash",
        "Scope and limits",
        "Published model",
      ].includes(name ?? ""),
    );
  // Scope and the published model sit above the grid, not under it.
  expect(names).toEqual([
    "Forecast",
    "Net leverage path",
    "What breaks, and when",
    "Uses of cash",
    "Assumptions by case",
    "Scope and limits",
    "Published model",
    "Forecast grid",
  ]);
  // The case list and its cash proxy tile are gone: the figure is the header's.
  expect(screen.queryByRole("region", { name: "Cash proxy by case" })).toBeNull();
  const figures = screen.getByLabelText("Forecast figures");
  const lead = screen.getByRole("region", { name: "Net leverage path" });
  expect(figures.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // The chart labels the selected case's highest published year as that selection.
  expect(screen.getByText("1.23x · FY2025E")).toBeInTheDocument();
});

const handoff = (module: string, sha: string, sections: unknown[]) => ({
  selected: true,
  output: {
    id: module,
    sha256: sha,
    module,
    label: "",
    href: "",
    state: { established: true, declared: null },
  },
  sections,
});
const findings = { heading: "Findings", level: 2, line: 1, blocks: [] };
const text = (heading: string, line: number, body: string) => ({
  heading,
  level: 3,
  line,
  blocks: [{ type: "text", line: line + 2, end: line + 2, text: body }],
});
const table = (heading: string, line: number, headers: string[], rows: string[][]) => ({
  heading,
  level: 3,
  line,
  blocks: [
    {
      type: "table",
      line: line + 2,
      headers,
      rows: rows.map((cells, at) => ({ line: line + 4 + at, cells })),
    },
  ],
});

it("draws no source reference, hash, register id or module code, even where the handoffs carry them", () => {
  const sha = "f".repeat(64);
  const coded = {
    ...model,
    sources: [{ role: "handoff", sha256: sha }],
    cashflow: {
      ...model.cashflow,
      notes: ["Downside case is CP-2G's own downside drivers; no CP-2A shock was supplied."],
    },
  };
  const entries = [
    handoff("CP-2G", sha, [
      findings,
      text("Bottom line", 10, "Net leverage falls under the CP-2A downside to 1.1x."),
      text(
        "Limitations",
        20,
        "- The break tests reuse CP-2A's levels, not covenant tests; covenant compliance belongs to CP-4.\n- Debt maturities are not modelled; the funding gap belongs to CP-2D and CP-3C.",
      ),
    ]),
    handoff("CP-2D", "a".repeat(64), [
      findings,
      text("Bottom line", 10, "Liquidity lasts."),
      table(
        "T2E.5 Funding gap",
        30,
        ["Line", "Value"],
        [
          ["CP-2D horizon (analyst judgment)", "CP-2D horizon of 24 months (T2E.3.r03)"],
          ["Funding gap", "120"],
        ],
      ),
    ]),
    handoff("CP-3C", "b".repeat(64), [
      findings,
      text("Bottom line", 10, "Refinancing is needed."),
      table(
        "T3D.2 Refinancing burden",
        30,
        ["Line", "Value"],
        [["CP-2D funding gap at its horizon end", "120"]],
      ),
    ]),
  ];
  const { container } = render(
    <Forecast view={{ ...view([coded]), entries, modules: [] } as unknown as View} run={run} />,
  );
  // The handoffs' figures and words are drawn, named by module.
  expect(screen.getAllByText("120").length).toBeGreaterThan(0);
  expect(
    screen.getByText(/the funding gap belongs to Liquidity and Refinancing & LME/),
  ).toBeInTheDocument();
  const page = container.textContent;
  expect(page).not.toMatch(/[0-9a-f]{64}/u);
  expect(page).not.toMatch(/\bCP-[A-Z0-9]+\b/u);
  expect(page).not.toMatch(/\bT\d+[A-Z]*\.\d+(?:\.r\d+)?\b/u);
  expect(page).not.toMatch(/\.(?:md|json|txt|pdf|xlsx)\b/u);
});

it("draws the header's gap and the run charts only when no forecast model was published", () => {
  render(<Forecast view={view([])} run={run} />);
  expect(screen.getByRole("region", { name: "Forecast" })).toHaveTextContent(
    "No forecast model was published for this run.",
  );
  expect(screen.queryByRole("region", { name: "Net leverage path" })).toBeNull();
  expect(screen.queryByLabelText("Forecast figures")).toBeNull();
  expect(document.getElementById("forecast-run-charts")).not.toBeNull();
});
