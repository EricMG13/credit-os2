import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportReader } from "./ReportLibrary";
import { buildReportView } from "./reportView";
import type { PublishedRun, Snapshot } from "./publishedReport";

const hash = (module: string) =>
  module
    .toLowerCase()
    .padStart(64, "a")
    .replaceAll(/[^a-f0-9]/g, "b");

function fixture(pathway = "earnings_update", modules = ["CP-1B"]) {
  const run = {
    folder: "earnings",
    issuer: "Issuer",
    asOf: "2026-11-16",
    pathway,
    modules: Object.fromEntries(
      modules.map((module) => [module, { outputs: [module], default: module }]),
    ),
    evidence: { sources: [], unused: [], unrecorded: [], handoffs: [], downloads: [], zip: null },
  } as unknown as PublishedRun;
  const snapshot = {
    catalogue: { real: [] },
    workspace: {
      runs: { originalKey: run },
      outputs: Object.fromEntries(
        modules.map((module) => [
          module,
          { id: module, run: "originalKey", module, sha256: hash(module), label: module, href: "" },
        ]),
      ),
      handoffs: Object.fromEntries(
        modules.map((module) => [
          hash(module),
          [
            { heading: "Findings", level: 2, line: 0, blocks: [] },
            {
              heading: "Bottom line",
              level: 3,
              line: 1,
              blocks: [{ type: "text", line: 2, end: 2, text: "Published earnings conclusion." }],
            },
          ],
        ]),
      ),
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
  return { snapshot, run };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

it("admits CP-1B as the final earnings fallback only, preserving higher-priority leads", () => {
  for (const higher of ["CP-6", "CP-2", "CP-L10"]) {
    const { snapshot, run } = fixture("earnings_update", ["CP-1B", higher]);
    expect(buildReportView(snapshot, "originalKey", run).lead?.output.module).toBe(higher);
  }
  const { snapshot, run } = fixture();
  expect(buildReportView(snapshot, "originalKey", run).lead?.output.module).toBe("CP-1B");
  run.pathway = "credit_snapshot";
  expect(buildReportView(snapshot, "originalKey", run).lead).toBeUndefined();
});

it("does not promote a blocked, unselected or missing-bottom-line earnings handoff", () => {
  const { snapshot, run } = fixture();
  const section = snapshot.workspace.handoffs[hash("CP-1B")]?.[1];
  const module = run.modules["CP-1B"];
  if (!section || !module) throw new Error("Missing earnings fixture");
  section.blocks = [{ type: "text", line: 2, end: 2, text: "Not assessable: missing evidence." }];
  expect(buildReportView(snapshot, "originalKey", run).lead).toBeUndefined();
  section.blocks = [{ type: "text", line: 2, end: 2, text: "Published earnings conclusion." }];
  module.default = null;
  expect(buildReportView(snapshot, "originalKey", run).lead).toBeUndefined();
  module.default = "CP-1B";
  section.heading = "Key findings";
  expect(buildReportView(snapshot, "originalKey", run).lead).toBeUndefined();
});

it("labels the published earnings lead and renders its conclusion once", async () => {
  const { run, snapshot } = fixture();
  run.publicationVerified = true;
  run.lead = {
    output: "CP-1B",
    module: "CP-1B",
    sha256: hash("CP-1B"),
    line: 2,
    text: "Published earnings conclusion.",
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(snapshot)));
  render(<ReportReader id="earnings" mode="synthetic" />);
  const call = await screen.findByRole("region", { name: "The call" });
  expect(
    within(call).getByRole("heading", { level: 3, name: "The call · Earnings changes" }),
  ).toBeVisible();
  // Attributed by the tile's heading; the module is reached through its pipeline node.
  expect(
    screen
      .getAllByRole("link", { name: /^Earnings changes/ })
      .map((link) => link.getAttribute("href")),
  ).toContain("#modules/CP-1B");
  expect(screen.getAllByText("Published earnings conclusion.")).toHaveLength(1);
  expect(within(call).getByText("Published earnings conclusion.")).toBeVisible();
});
