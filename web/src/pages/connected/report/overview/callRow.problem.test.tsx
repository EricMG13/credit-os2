// Regression for S17-1-1 (probe S17-1-1): the Overview's "Since the earlier run" tile draws the store's raw `changes.problem`
// (it names the pack file's path: apps/issuer-library/update_library.py `pack_of` writes
// "<path> is not valid JSON" / "<path> could not be read (...)"), where the Changes page replaces
// any problem that cites a file with "The comparison could not be read."
import { afterEach, expect, it } from "vitest";
import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { PublishedRun, Snapshot } from "../../publishedReport";
import type { ReportView } from "../../reportView";
import { CallRow } from "./CallRow";

afterEach(cleanup);

const run = {
  folder: "run-1",
  issuer: "Northbridge",
  title: "Full credit assessment",
  period: "As of 2025-03-31",
  asOf: "2025-03-31",
  pathway: null,
  modules: {},
  changes: { first_run: false, pack: null, problem: "changes/pack.json is not valid JSON" },
} as unknown as PublishedRun;
const snapshot = { workspace: { runs: {} } } as unknown as Snapshot;
const view = { folder: "run-1", entries: [], lead: undefined } as unknown as ReportView;

it("the Overview does not draw the pack file's name", () => {
  render(createElement(CallRow, { snapshot, run, view }));
  const tile = screen.getByRole("region", { name: "Since the earlier run" });
  expect(within(tile).queryByText(/pack\.json/)).toBeNull();
});
