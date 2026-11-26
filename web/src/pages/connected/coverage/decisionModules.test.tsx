import { afterEach, expect, it } from "vitest";
// Regression test (from the confidence-loop probe).
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import type { Coverage } from "../coverageData";
import { IssuerDetail } from "./IssuerDetail";
import { FindView } from "./Find";

afterEach(cleanup);

const SHA = "a".repeat(64);
const COMMITTEE = "Final Action Bias: Add Exposure; size at 2 percent of the portfolio.";
const CREDIT = "Leverage is moderate and covenants have headroom.";
const issuer = {
  key: "a",
  name: "Alpha plc",
  sector: null,
  runs: [
    {
      key: "a1",
      folder: "a-run",
      asOf: "2026-03-31",
      pathway: "credit_snapshot",
      pathwayTitle: "Full credit assessment",
      cells: { "CP-2": { state: "assessed" as const }, "CP-6": { state: "assessed" as const } },
      other: [],
    },
  ],
};
const bottom = (module: string, text: string, line: number) => ({
  field: `${module.toLowerCase()}/reader-summary/bottomline`,
  issuer: "a",
  run: "a1",
  period: null,
  row: null,
  text,
  at: null,
  line,
  output: `a-run/${module}.md`,
  sha256: SHA,
});
const data: Coverage = {
  columns: [
    { code: "CP-2", title: "Fundamental credit synthesizer" },
    { code: "CP-6", title: "Committee decision" },
  ],
  issuers: [issuer],
  fields: ["CP-2", "CP-6"].map((module) => ({
    id: `${module.toLowerCase()}/reader-summary/bottomline`,
    module,
    group: "Findings",
    label: "Bottom line",
    kind: "text" as const,
  })),
  facts: [bottom("CP-2", CREDIT, 5), bottom("CP-6", COMMITTEE, 6)],
};

it("draws the credit module's bottom line and withholds the committee module's", () => {
  render(createElement(IssuerDetail, { data, issuer }));
  expect(screen.getByText(CREDIT)).toBeTruthy();
  expect(screen.queryByText(COMMITTEE)).toBeNull();
});

it("Find draws the credit module's passage and withholds the committee module's", () => {
  const texts = {
    ...data,
    fields: data.fields.map((item) => ({ ...item, id: item.id.replace("bottomline", "finding"), label: "Finding" })),
    facts: data.facts.map((item) => ({ ...item, field: item.field.replace("bottomline", "finding") })),
  };
  render(createElement(FindView, { data: texts, issuers: [issuer], query: "", titles: new Map() }));
  expect(screen.getByText(CREDIT)).toBeTruthy();
  expect(screen.queryByText(COMMITTEE)).toBeNull();
});
