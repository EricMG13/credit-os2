import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { PublishedRun } from "../publishedReport";
import type { buildReportView } from "../reportView";
import { Forecast } from "./Forecast";

type View = ReturnType<typeof buildReportView>;
const run = { folder: "current" } as PublishedRun;

function viewWith(limit: string): View {
  const model = {
    id: "model",
    issuerKey: "issuer",
    runId: "current",
    runFolder: "current",
    href: "",
    download: "",
    sources: [],
    cashflow: {
      units: "USD millions",
      limits: [limit],
      columns: [{ label: "FY2025E", group: "Base case" }],
      rows: [
        {
          label: "Cash proxy (not issuer free cash flow)",
          band: "Cash",
          total: true,
          cells: [{ status: "value", exact: "10", display: "10" }],
        },
      ],
    },
  };
  return { catalogue: undefined, lead: undefined, entries: [], modules: [], models: [model] };
}

it("C1b-1 draws no file name, page or marker from a limitation that cites", () => {
  const cited =
    "A machine input is set to zero; the inflow is in TDG_2024-10K.htm.jsonl, page 45 [E3].";
  const { container } = render(<Forecast view={viewWith(cited)} run={run} />);
  expect(container.textContent).not.toContain("TDG_2024-10K");
  expect(container.textContent).not.toContain("page 45");
  expect(container.textContent).not.toContain("[E3]");
  expect(screen.getAllByText(/read it in Evidence/u).length).toBeGreaterThan(0);
});

it("C1b-1 draws a limitation that cites nothing as written", () => {
  const plain = "A machine input is set to zero; the inflow is recorded elsewhere.";
  render(<Forecast view={viewWith(plain)} run={run} />);
  expect(screen.getAllByText(plain).length).toBeGreaterThan(0);
});
