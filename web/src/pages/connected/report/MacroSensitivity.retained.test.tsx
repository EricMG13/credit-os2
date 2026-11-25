import { render, screen, within } from "@testing-library/react";
import type { OutputEntry, Section } from "../publishedReport";
import { MacroSensitivity, macroView } from "./MacroSensitivity";

const EXPOSURE_HEADERS = [
  "Exposure",
  "Measure",
  "Hedge or offset",
  "Cash effect",
  "Creditor consequence",
  "Source",
];
const CALCULATION_HEADERS = ["ID", "Calculation", "Inputs", "Result", "Source"];

type RetainedOptions = {
  currency?: string;
  cashEffect?: string;
  calculationMoney?: string;
  shock?: string;
  coverAfter?: string;
  coverBefore?: string;
  hedge?: string;
  coverStatement?: string;
  impactCalculation?: string;
  coverCalculation?: string;
  coverResult?: string;
  headers?: string[];
  omitFloating?: boolean;
  omitImpact?: boolean;
  omitCover?: boolean;
};

function section(heading: string, headers: string[], rows: string[][], line: number): Section {
  return {
    heading,
    level: 3,
    line,
    blocks: [
      {
        type: "table",
        line: line + 1,
        headers,
        rows: rows.map((cells, index) => ({ line: line + 2 + index, cells })),
      },
    ],
  };
}

function retainedEntry(options: RetainedOptions = {}): OutputEntry {
  const currency = options.currency ?? "USD";
  const money = options.cashEffect ?? "USD 5.00 million a year per 100 bp";
  const calculationMoney = options.calculationMoney ?? "5.00";
  const bp = options.shock ?? "100";
  const before = options.coverBefore ?? "3.0";
  const after = options.coverAfter ?? "2.5";
  const exposureHeaders = options.headers ?? EXPOSURE_HEADERS;
  return {
    output: {
      module: "CP-2E",
      id: "retained-rate",
      label: "Macro exposure",
      sha256: "a".repeat(64),
      href: "macro.md",
    },
    selected: true,
    sections: [
      section(
        "Calculations",
        CALCULATION_HEADERS,
        [
          ...(!options.omitImpact
            ? [
                [
                  "R4",
                  options.impactCalculation ??
                    `${bp} bp cash-interest impact on unhedged floating debt`,
                  "",
                  calculationMoney,
                  "Calculation basis",
                ],
              ]
            : []),
          ...(!options.omitCover
            ? [
                [
                  "R9",
                  options.coverCalculation ??
                    "All-in cover after the shock (reported EBITDA over debt interest plus rent)",
                  "",
                  options.coverResult ?? `${after}x; ratio ${after}; ${before}x before the shock`,
                  "Calculation basis",
                ],
              ]
            : []),
        ],
        1,
      ),
      section(
        "Macro-exposure summary",
        exposureHeaders,
        options.omitFloating
          ? []
          : [
              [
                "Floating-rate debt (Term SOFR)",
                "USD 200m",
                options.hedge ?? "None disclosed",
                money,
                options.coverStatement ?? `All-in cover ${before}x to ${after}x`,
                "Exposure basis",
              ],
            ],
        10,
      ),
      section(
        "Sourced operands",
        ["Operand", "Value", "Basis"],
        [["Reporting currency", currency, "Filing p. 1"]],
        20,
      ),
    ],
  };
}

it("retains the checked reporting currency, shock tenor, money and cover values", () => {
  const data = macroView(retainedEntry());
  expect(data?.retained).toMatchObject({
    currency: "USD",
    money: "5.00",
    bp: "100",
    before: "3.0",
    after: "2.5",
    cashLine: 3,
    coverLine: 4,
    basis: undefined,
  });
  if (!data) throw new Error("retained scenario was rejected");
  render(<MacroSensitivity data={data} href={(line) => `#evidence/${String(line)}`} />);
  const tile = screen.getByRole("region", { name: "All-in cover" });
  expect(within(tile).getByRole("img")).toHaveAccessibleName(
    /Before the shock 3\.0x.*\+100 bp 2\.5x/,
  );
  expect(within(tile).getByText("USD 5.00 million")).toBeInTheDocument();
  expect(within(tile).getByRole("link", { name: "Source for All-in cover" })).toHaveAttribute(
    "href",
    "#evidence/4",
  );
  expect(screen.getByText("No separate after-hedges result was established.")).toBeInTheDocument();
});

it("retains a different three-letter currency when it is recorded consistently", () => {
  const data = macroView(
    retainedEntry({
      cashEffect: "EUR 5.00 million a year per 100 bp",
      calculationMoney: "5.00",
    }),
  );
  expect(data?.retained).toMatchObject({ currency: "EUR", money: "5.00", bp: "100" });
});

it.each([
  ["unsupported cash currency format", { cashEffect: "US$ 5.00 million a year per 100 bp" }],
  ["wrong shock tenor", { shock: "250" }],
  ["wrong calculation amount", { calculationMoney: "5.01" }],
  ["unparseable cash amount", { cashEffect: "USD 5..0 million a year per 100 bp" }],
  ["unparseable cover ratio", { coverResult: "n.a." }],
  ["missing floating debt row", { omitFloating: true }],
  ["missing cash impact row", { omitImpact: true }],
  ["missing cover row", { omitCover: true }],
  ["mismatched cover statement", { coverStatement: "All-in cover 3.0x to 2.4x" }],
  ["mismatched impact calculation", { impactCalculation: "250 bp cash-interest impact" }],
  ["mismatched cover calculation", { coverCalculation: "Cover after shock" }],
  ["disclosed hedge", { hedge: "Partially hedged" }],
  ["mismatched cover transition", { coverStatement: "All-in cover 3.0x to 2.4x" }],
  ["wrong table headings", { headers: ["Exposure", "Value", "Source"] }],
])("does not infer the retained sensitivity when %s", (_reason, options) => {
  expect(macroView(retainedEntry(options))).toBeNull();
});
