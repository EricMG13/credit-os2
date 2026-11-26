// Owner ruling 2026-11-26: a structured money unit is drawn as the currency's symbol on the
// Modules page. Input is the retained TransDigm FY2024 CP-1 handoff (outdated evidence: shape and
// scope only), whose Unit cells and entity key say "USD millions". Module-written prose and row
// labels keep their words (DESIGN.md), so the check reads the structured unit surfaces only.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { PublishedRun, Snapshot } from "../publishedReport";
import type { ReportView } from "../reportView";
import { cp1Entry } from "./leads/fixtures/load";
import { Modules } from "./Modules";

afterEach(cleanup);

it("draws the CP-1 page's structured money units as $m, not USD millions or US$m", () => {
  const entry = cp1Entry();
  const view = {
    entries: [entry],
    modules: [{ id: "CP-1", name: "Financial foundation", state: "Delivered", outputs: [entry] }],
    catalogue: undefined,
    lead: undefined,
    models: [],
  } as unknown as ReportView;
  const run = {
    folder: "run",
    issuer: "TransDigm",
    asOf: "2024-09-30",
    modules: {},
  } as PublishedRun;
  render(<Modules snapshot={{ chips: {} } as Snapshot} run={run} view={view} module="CP-1" />);
  // The basis line joins Currency and Unit.
  const header = screen.getByRole("region", { name: "Financial foundation" });
  expect(header.textContent).toContain("Fiscal year end September 30 · $m · US GAAP");
  // The handoff's prose and row labels carry no money-unit words here, so the whole page is checked.
  expect(document.body.textContent).toContain("$m");
  expect(document.body.textContent).not.toMatch(/USD millions|US\$m/);
});
