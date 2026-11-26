import { afterEach, expect, it } from "vitest";
// Probe S21-2-1: Coverage Trend's "Table view" draws an adjusted-EBITDA series' figures with no word
// of the heading they were stated under (the panel above got "Stated as ..." in the S21-1 fix; the
// table row did not). Answer key: docs/rulings/2026-11-24-coverage-page.md (the adjusted twin "is
// drawn with the heading the module wrote") and the Rank view's "Stated as <heading>" (Rank.tsx:125),
// worked by hand: Beta's two facts carry heading "Net debt / adjusted EBITDA", so Beta's table row
// must name it; Alpha's (reported) row need not.
import { createElement } from "react";
import { cleanup, render, within } from "@testing-library/react";
import type { Coverage } from "../coverageData";
import { TrendView } from "./Trend";

afterEach(cleanup);

const SHA = "a".repeat(64);
const issuer = (key: string, name: string) => ({
  key,
  name,
  sector: null,
  runs: [{ key: `${key}1`, folder: `${key}-run`, asOf: "2026-03-31", pathway: null, pathwayTitle: null, cells: {}, other: [] }],
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

it("the table view names the heading Beta's figures were stated under", () => {
  const { container } = render(createElement(TrendView, { data, issuers: [...data.issuers], field: data.fields[0] }));
  const table = container.querySelector("details table") as HTMLElement;
  const beta = within(table).getByRole("row", { name: /Beta/ });
  expect(beta.textContent).toContain("2.80x");
  expect(beta.textContent).toMatch(/adjusted/i);
});
