import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FORECAST_INPUTS, type OutputEntry, type PublishedRun } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";

type View = ReturnType<typeof buildReportView>;
const limitation = "A machine input is set to zero; the retained handoff records the inflow.";

function basisView({
  units = "USD millions",
  original = "15",
  difference = "5",
  value = "10",
  duplicate = false,
  omit = false,
} = {}): View {
  const handoff: OutputEntry = {
    output: {
      id: "forward",
      sha256: "a".repeat(64),
      module: "CP-2G",
      label: "Forward model",
      href: "",
    },
    selected: true,
    sections: [
      {
        heading: "Calculations",
        level: 2,
        line: 60,
        blocks: [
          {
            type: "table",
            line: 62,
            headers: ["ID", "Calculation", "Inputs", "Result", "Source"],
            rows: [
              {
                line: 65,
                cells: ["FCF", "Base FCF FY2025", "Retained inputs", original, "Filing"],
              },
              ...(omit
                ? []
                : [
                    {
                      line: 66,
                      cells: [
                        "Inflow",
                        "Base taxes and working-capital inflow FY2025",
                        "Retained inputs",
                        difference,
                        "Filing",
                      ],
                    },
                  ]),
              ...(duplicate
                ? [
                    {
                      line: 67,
                      cells: [
                        "Duplicate",
                        "Base FCF FY2025",
                        "Retained inputs",
                        original,
                        "Filing",
                      ],
                    },
                  ]
                : []),
            ],
          },
        ],
      },
    ],
  };
  const model = {
    id: "model",
    issuerKey: "issuer",
    runId: "current",
    runFolder: "current",
    href: "",
    download: "",
    sources: [{ output: "forward", sha256: "a".repeat(64), role: "forecast" }],
    cashflow: {
      units,
      limits: [limitation],
      columns: [
        { label: "FY2025E", group: "Base case" },
        { label: "FY2026E", group: "Base case" },
      ],
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          band: "Cash",
          total: true,
          cells: [
            { status: "value", exact: value, display: value },
            { status: "value", exact: "10", display: "10" },
          ],
        },
      ],
    },
  };
  return {
    catalogue: undefined,
    lead: undefined,
    entries: [handoff],
    modules: [],
    models: [model],
  };
}

const run = { folder: "current" } as PublishedRun;

it("preserves the recorded bridge and its exact source lines", () => {
  render(<Forecast view={basisView()} run={run} />);
  expect(screen.getByText(/The calculation gives/)).toHaveTextContent(
    "The calculation gives 10.00 cash proxy. The Forward credit model gives 15.00 free cash flow. The displayed difference is US$5.00m.",
  );
  expect(screen.getByRole("link", { name: "Free cash flow basis" })).toHaveAttribute(
    "href",
    `/report/current#evidence/forward~${"a".repeat(64)}-65`,
  );
  expect(screen.getByRole("link", { name: "Difference basis" })).toHaveAttribute(
    "href",
    `/report/current#evidence/forward~${"a".repeat(64)}-66`,
  );
});

it("preserves a zero-valued bridge", () => {
  render(<Forecast view={basisView({ original: "0", difference: "0", value: "0" })} run={run} />);
  expect(screen.getByText(/The calculation gives/)).toHaveTextContent(
    "The calculation gives 0.00 cash proxy.",
  );
  expect(screen.getByRole("link", { name: "Difference basis" })).toBeInTheDocument();
});

it.each([
  // docs/rulings/2026-11-16-reporting-currency-from-sources.md: "EUR millions" is now shown (below).
  { units: "EUR thousands" },
  { units: "" },
  { original: "Not supplied" },
  { difference: "6" },
  { value: "NaN" },
  { duplicate: true },
  { omit: true },
])("retains the limitation but withholds an unsupported bridge: %j", (options) => {
  render(<Forecast view={basisView(options)} run={run} />);
  expect(screen.getByRole("heading", { name: "FY2025 base case basis" })).toBeInTheDocument();
  expect(screen.queryByText(/The calculation gives/)).toBeNull();
  expect(screen.queryByRole("link", { name: "Difference basis" })).toBeNull();
  expect(screen.getAllByText(limitation).length).toBeGreaterThan(0);
});

it.each([
  { sections: 1, blocks: 1, linked: true },
  { sections: 0, blocks: 1, linked: false },
  { sections: 2, blocks: 1, linked: false },
  { sections: 1, blocks: 0, linked: false },
  { sections: 1, blocks: 2, linked: false },
])(
  "links forecast inputs only to an unambiguous JSON block: %j",
  ({ sections, blocks, linked }) => {
    const view = basisView();
    const handoff = view.entries[0];
    if (!handoff) throw new Error("Missing handoff fixture");
    handoff.sections.push(
      ...Array.from({ length: sections }, (_, section) => ({
        heading: FORECAST_INPUTS,
        level: 2,
        line: 80 + section * 10,
        blocks: Array.from({ length: blocks }, (_, block) => ({
          type: "text" as const,
          line: 82 + section * 10 + block * 3,
          end: 84 + section * 10 + block * 3,
          text: "```json\n{}\n```",
        })),
      })),
    );
    render(<Forecast view={view} run={run} />);
    const links = screen.queryAllByRole("link", { name: "Forecast inputs" });
    if (linked) {
      expect(links.length).toBeGreaterThan(0);
      for (const link of links)
        expect(link).toHaveAttribute(
          "href",
          `/report/current#evidence/forward~${"a".repeat(64)}-82`,
        );
    } else expect(links).toHaveLength(0);
  },
);

// docs/rulings/2026-11-16-reporting-currency-from-sources.md: the model records its own currency.
it.each([
  [
    "GBP millions",
    "The calculation gives 10.00 cash proxy. The Forward credit model gives 15.00 free cash flow. The displayed difference is GBP 5.00m.",
  ],
  [
    "CHF millions",
    "The calculation gives 10.00 cash proxy. The Forward credit model gives 15.00 free cash flow. The displayed difference is CHF 5.00m.",
  ],
  [
    "EUR millions",
    "The calculation gives 10.00 cash proxy. The Forward credit model gives 15.00 free cash flow. The displayed difference is EUR 5.00m.",
  ],
  [
    "USD millions",
    "The calculation gives 10.00 cash proxy. The Forward credit model gives 15.00 free cash flow. The displayed difference is US$5.00m.",
  ],
])("shows the bridge of a model recorded in %s with that unit", (units, text) => {
  render(<Forecast view={basisView({ units })} run={run} />);
  expect(screen.getByText(/The calculation gives/)).toHaveTextContent(text);
  expect(screen.getByRole("link", { name: "Difference basis" })).toHaveAttribute(
    "href",
    `/report/current#evidence/forward~${"a".repeat(64)}-66`,
  );
});
