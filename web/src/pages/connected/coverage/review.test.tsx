import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { Coverage, Fact } from "../coverageData";
import { RankView } from "./Rank";

afterEach(cleanup);

const SHA = "e".repeat(64);
const issuer = {
  key: "a",
  name: "Alpha plc",
  sector: null,
  runs: [{ key: "a1", folder: "a-run", asOf: "2026-03-31", pathway: null, pathwayTitle: null, cells: {}, other: [] }],
};
const cash = (text: string, at: number | null, line: number): Fact => ({
  field: "cash",
  issuer: "a",
  run: "a1",
  period: "FY2025",
  row: null,
  text,
  at,
  basis: "Reported.",
  line,
  output: "a-run/CP-1.md",
  sha256: SHA,
});
const data: Coverage = {
  columns: [],
  issuers: [issuer],
  fields: [{ id: "cash", module: "CP-1", group: "Liquidity", label: "Cash", kind: "number", series: "period" }],
  facts: [
    cash("1,250", 1250, 3),
    cash("Not supplied: Cash only in annual-report-2025.pdf page 45", null, 4),
  ],
};

it("draws a gap row of a twice-stated period through the page's withheld wording, not raw", () => {
  const { container } = render(
    <RankView data={data} issuers={[issuer]} field={data.fields[0]} period="FY2025" order="high" by="none" boundUnit={null} />,
  );
  expect(screen.getByText(/its run states this period more than once/)).toHaveTextContent(
    "Alpha plc: its run states this period more than once (1,250; the module's reason is in Evidence), so none is ranked",
  );
  expect(container.textContent).not.toContain("annual-report-2025.pdf");
});
