// A relative value or portfolio run publishes no credit view: the call leads with the run's
// purpose findings and the restriction on its decision, as the report's export composes them.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import type { SpecialistOverview } from "../frontPage";
import { CallRow } from "./CallRow";

const overview = vi.hoisted(() => ({ value: null as SpecialistOverview | null }));
vi.mock("../../export/reportExport", () => ({
  reportSpecialistOverview: () => overview.value,
}));

afterEach(cleanup);

const run = {
  folder: "run-1",
  issuer: "Northbridge",
  title: "Relative value",
  period: "FY2025",
  asOf: "2026-03-31",
  pathway: "relative_value",
  publicationVerified: true,
  modules: {},
  changes: { first_run: true },
} as unknown as PublishedRun;
const snapshot = { workspace: { runs: { key: run } } } as unknown as Snapshot;
const view = {
  folder: "run-1",
  entries: [],
  lead: undefined,
  modules: [],
  models: [],
  catalogue: undefined,
} as unknown as ReportView;
const owner = { id: "run-1/cp3d", sha256: "d".repeat(64), module: "CP-3D" };

it("leads a specialist run's call with its purpose findings, each traced, and the restriction", () => {
  overview.value = {
    title: "Market-implied view",
    findings: [
      { owner, line: 12, body: "The 2030 notes trade 40 bp wide of the curve." },
      { owner, line: 14, body: "The loan is quoted at 98.5." },
    ],
    restriction: {
      label: "Instrument preference",
      reason: "Printed reason.",
      screenReason: "This page does not show a preference: no clearance for it is recorded.",
    },
  };
  render(<CallRow snapshot={snapshot} run={run} view={view} />);
  const call = screen.getByRole("region", { name: "The call" });
  expect(
    within(call).getByRole("heading", { name: "The call · Market-implied view" }),
  ).toBeVisible();
  expect(within(call).getByText("The 2030 notes trade 40 bp wide of the curve.")).toHaveClass(
    "font-medium",
  );
  expect(within(call).getByText("The loan is quoted at 98.5.")).toBeVisible();
  const sources = within(call).getAllByRole("link", {
    name: /^Source for the market-implied view/,
  });
  expect(sources.map((link) => link.getAttribute("href"))).toEqual([
    `/report/run-1#evidence/run-1%2Fcp3d~${"d".repeat(64)}-12`,
    `/report/run-1#evidence/run-1%2Fcp3d~${"d".repeat(64)}-14`,
  ]);
  // The screen's reason is drawn, not the one written for the PDF.
  expect(within(call).getByText("Instrument preference")).toBeVisible();
  expect(within(call).getByText(/does not show a preference/)).toBeVisible();
  expect(within(call).queryByText("Printed reason.")).toBeNull();
  expect(within(call).queryByText(/A verified credit view is unavailable/)).toBeNull();
});

it("says the credit view is unavailable when the run has no purpose findings either", () => {
  overview.value = null;
  render(<CallRow snapshot={snapshot} run={run} view={view} />);
  expect(screen.getByText(/A verified credit view is unavailable for this run/)).toBeVisible();
});
