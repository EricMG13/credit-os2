import { expect, it } from "vitest";
import type { Block, OutputEntry, PublishedRun, Section } from "../publishedReport";
import type { ReportView } from "../reportView";
import { buildIssuerFrontPage } from "./frontPage";

const SHA = "d".repeat(64);
const section = (line: number, heading: string, blocks: Block[]): Section => ({
  heading,
  line,
  blocks,
  level: 3,
});
const owner = (module: string, sections: Section[]): OutputEntry => ({
  output: { id: module, module, sha256: SHA, href: "", label: module },
  sections,
  selected: true,
});

function page(entries: OutputEntry[], asOf: string) {
  const view: ReportView = {
    folder: "retail",
    entries,
    modules: [],
    models: [],
    lead: entries[0],
    catalogue: undefined,
  };
  const run = {
    folder: "retail",
    issuer: "Retail",
    title: "Full credit assessment",
    period: "FY2024",
    asOf,
    pathway: "credit_snapshot",
    modules: {},
    publicationVerified: true,
    assessmentScope: "standard",
  } as unknown as PublishedRun;
  return buildIssuerFrontPage(view, run);
}

const matrix = (headers: string[]): Section =>
  section(18, "Financials and credit metrics", [
    {
      type: "table",
      line: 19,
      headers,
      rows: [
        { line: 21, cells: ["NET SALES", "7,940", "6,585", "US$m", "Reported; annual page:121"] },
      ],
    },
  ]);

it("matches a fiscal-year label whose year differs from its end date, and its prior year", () => {
  const found = page(
    [
      owner("CP-1", [
        { heading: "Findings", line: 1, blocks: [], level: 2 },
        matrix([
          "Metric",
          "FY2024 / 2025-02-01",
          "FY2023 / 2024-02-03",
          "Unit",
          "Status, definition and evidence",
        ]),
      ]),
    ],
    "2025-02-01",
  );
  expect(found?.headline.map(({ value, period }) => [value, period])).toEqual([
    ["$7,940m", "FY2024 / 2025-02-01"],
  ]);
  expect(found?.headline[0]?.prior).toEqual({ value: "$6,585m", period: "FY2023 / 2024-02-03" });
});

it("still needs exactly one matching column", () => {
  const found = page(
    [
      owner("CP-1", [
        { heading: "Findings", line: 1, blocks: [], level: 2 },
        matrix([
          "Metric",
          "FY2024 / 2025-02-01",
          "FY2025 / 2025-02-01",
          "Unit",
          "Status, definition and evidence",
        ]),
      ]),
    ],
    "2025-02-01",
  );
  expect(found?.headline).toEqual([]);
});

function description(text: string) {
  const found = page(
    [
      owner("CP-1A", [
        { heading: "Findings", line: 1, blocks: [], level: 2 },
        section(2, "Company profile", [
          {
            type: "table",
            line: 3,
            headers: ["Area", "Category", "Located evidence / fact"],
            rows: [
              {
                line: 5,
                cells: ["Business description", "Documentary Fact", text, "Analyst note"],
              },
            ],
          },
        ]),
      ]),
    ],
    "2025-02-01",
  );
  const drawn = found?.company.description;
  return drawn ? drawn.body : undefined;
}

it("draws the whole earlier-format quotation when it holds inner quotation marks", () => {
  expect(description('Q page 12: “Acme operates "Brand X" stores across Canada.” See p.3')).toBe(
    'Acme operates "Brand X" stores across Canada.',
  );
  expect(description('Q page 12: "Acme operates “Brand X” stores across Canada." See p.3')).toBe(
    "Acme operates “Brand X” stores across Canada.",
  );
});

it("keeps a plain quotation and draws no description when it cannot be delimited", () => {
  expect(description("Q page 12: “Acme operates stores.” More")).toBe("Acme operates stores.");
  expect(description("Q page 12: “Acme operates stores across Canada")).toBeUndefined();
});
