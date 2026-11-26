import { afterEach, expect, it } from "vitest";
// Regression test (from the confidence-loop probe).
// "labelled as adjusted on every ratio, column and chart".
import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { Coverage } from "../coverageData";
import { TrendView } from "./Trend";

afterEach(cleanup);

const SHA = "a".repeat(64);
const issuer = (key: string, name: string) => ({
  key,
  name,
  sector: null,
  runs: [
    { key: `${key}1`, folder: `${key}-run`, asOf: "2026-03-31", pathway: null, pathwayTitle: null, cells: {}, other: [] },
  ],
});
const fact = (key: string, period: string, text: string, heading?: string) => ({
  field: "nl",
  issuer: key,
  run: `${key}1`,
  period,
  row: null,
  text,
  at: Number(text),
  unit: "x",
  ...(heading ? { heading } : {}),
  line: 7,
  output: `${key}-run/CP-1.md`,
  sha256: SHA,
});
const data: Coverage = {
  columns: [],
  issuers: [issuer("a", "Alpha"), issuer("b", "Beta")],
  fields: [{ id: "nl", module: "CP-1", group: "Leverage", label: "Net debt / EBITDA", kind: "number", series: "period" }],
  facts: [
    fact("a", "FY2024", "3.00"),
    fact("a", "FY2025", "2.80"),
    fact("b", "FY2024", "3.00", "Net debt / adjusted EBITDA"),
    fact("b", "FY2025", "2.80", "Net debt / adjusted EBITDA"),
  ],
};

it("Beta's panel says its figures are stated on adjusted EBITDA", () => {
  render(createElement(TrendView, { data, issuers: [...data.issuers], field: data.fields[0] }));
  const beta = screen.getByRole("article", { name: "Beta" });
  expect(within(beta).getAllByText(/2\.80/).length).toBeGreaterThan(0);
  expect(beta.textContent).toMatch(/adjusted/i);
});
