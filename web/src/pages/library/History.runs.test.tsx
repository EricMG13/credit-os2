// S2-001 (with J6-006): an issuer's history page draws every run its subtitle counts, also when
// the issuer has no readable report. Rendered on the real history route with the fixture's own
// data with explicit no-report states: the four carded issuers and the one whose only run failed.
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import type { LibraryData } from "@/data";
import { SourceContext } from "../source";
import { routes } from "./routes";

type Entry = {
  asOf: string;
  ran: string;
  state: string;
  pathway: string;
  text: string;
  report: string | null;
  changes: { label: string; run: string } | null;
};
type Slice = {
  issuers: {
    id: string;
    history: { entries: Entry[]; empty: string | null; latest: string | null };
    runs: unknown[];
  }[];
};

const fixture = JSON.parse(
  readFileSync(
    path.resolve(import.meta.dirname, "..", "..", "..", "fixtures", "library.json"),
    "utf8",
  ),
) as { issuers: LibraryData["issuers"]; slice: Slice };

// Batch b supplies reports for the four cards. Keep this regression's absent-report cases
// explicit, so it still exercises S2-001 without requiring the shipped fixture to be incomplete.
const noReportSlice = structuredClone(fixture.slice);
const noReportIds = new Set([
  "corvane-packaging",
  "tessaly-foods",
  "ardenne-cable",
  "lumora-health",
  "corvane-fasteners",
]);
for (const issuer of noReportSlice.issuers) {
  if (!noReportIds.has(issuer.id)) continue;
  issuer.history.latest = null;
  issuer.history.empty = "No report has been published for this issuer yet.";
  issuer.runs = [];
  for (const entry of issuer.history.entries) {
    entry.report = null;
    entry.changes = null;
  }
}

function renderHistory(issuer: string, library: unknown = noReportSlice) {
  const data: LibraryData = { schema: "credit-os-data/1", issuers: fixture.issuers, library };
  const route = routes.find((r) => r.path === "/library/:issuer/history");
  if (route === undefined) throw new Error("no history route");
  return render(
    <SourceContext.Provider value={data}>{route.render({ issuer })}</SourceContext.Provider>,
  );
}

const noReport = noReportSlice.issuers.filter((i) => i.history.empty !== null);

describe("Report history, an issuer with runs but no readable report", () => {
  it("covers the four carded issuers and the failed first run", () => {
    expect(noReport.map((i) => i.id)).toEqual([
      "corvane-packaging",
      "tessaly-foods",
      "ardenne-cable",
      "lumora-health",
      "corvane-fasteners",
    ]);
  });

  it.each(noReport.map((i) => [i.id, i] as const))(
    "%s draws one row per run, newest first, with its date, state, pathway and sentence",
    (id, issuer) => {
      renderHistory(id);
      const rows = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(rows).toHaveLength(issuer.history.entries.length);
      issuer.history.entries.forEach((entry, index) => {
        const row = within(rows[index] as HTMLElement);
        expect(row.getByText(`Run as of ${entry.asOf}`)).toBeVisible();
        expect(row.getByText(`Ran ${entry.ran}`)).toBeVisible();
        expect(row.getByText(entry.state)).toBeVisible();
        expect(row.getByText(entry.pathway)).toBeVisible();
        expect(row.getByText(entry.text)).toBeVisible();
        expect(row.queryByRole("link")).toBeNull();
      });
    },
  );

  it("keeps the no-report state and its two buttons above the runs, with no report link", () => {
    renderHistory("tessaly-foods");
    expect(screen.getByText("Report history: one run")).toBeVisible();
    const state = screen.getByRole("heading", { level: 2, name: "No report yet" });
    const list = screen.getByRole("list");
    expect(state.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to the library" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Start a run" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Open latest report" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Open report" })).toBeNull();
  });

  it("draws no empty list when the issuer has no runs at all", () => {
    const slice = structuredClone(noReportSlice);
    const bare = slice.issuers.find((i) => i.id === "tessaly-foods");
    if (bare === undefined) throw new Error("no issuer");
    bare.history.entries = [];
    renderHistory("tessaly-foods", slice);
    expect(screen.getByRole("heading", { level: 2, name: "No report yet" })).toBeVisible();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
