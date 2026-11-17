import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Run } from "../api";
import type { OutputEntry, PublishedRun } from "../publishedReport";
import { ReportRecord } from "./Record";

const record: Run = {
  id: "case",
  issuer_name: "Issuer",
  as_of: "2026-11-17",
  pathway: "credit_snapshot",
  status: "finished",
  reason: "",
  modules: [],
  observed_at: "2026-11-17T12:00:00Z",
  execution: "live-provider",
  cap: "25",
  spent: "5.10",
  events: [],
};
const run = {
  folder: "case",
  record: { steps: [] },
  evidence: {
    sources: [],
    unused: [],
    unrecorded: [],
    noSourcesModules: [],
    handoffs: [],
    downloads: [],
    zip: null,
    record: {
      hashes: [],
      instructions: [],
      calls: [
        {
          module: "CP-2D",
          attempt: 1,
          started: "2026-11-17T12:00:00Z",
          http_status: null,
          error_class: null,
          settled_usd: "5.10",
        },
      ],
      cap: "25",
    },
  },
} as PublishedRun;
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function response(value: unknown = record) {
  vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify(value))));
}

it("uses the run's own execution rather than the service mode and names empty call fields", async () => {
  response();
  render(<ReportRecord run={run} entries={[]} mode="synthetic" />);
  expect(await screen.findByText("Live provider")).toBeVisible();
  const module = screen.getByText("Liquidity", { exact: true }).closest("details");
  if (!module) throw new Error("Missing module record");
  module.open = true;
  expect(within(module).getByRole("heading", { name: "Model calls" })).toBeVisible();
  expect(within(module).getAllByLabelText("Not recorded for this call")).toHaveLength(2);
  expect(within(module).queryByLabelText("Empty in the handoff")).toBeNull();
});

it("shows the service's record failure as an explicit explanation", async () => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ error: "The record could not be read." }), { status: 500 }),
    ),
  );
  render(<ReportRecord run={run} entries={[]} mode="live" />);
  expect(await screen.findByText("The record could not be read.")).toBeVisible();
});

it("names handoff issues by the module and removes nested record borders", async () => {
  response();
  const entry: OutputEntry = {
    selected: true,
    output: {
      id: "case/CP-2D.md",
      module: "CP-2D",
      label: "CP-2D",
      href: "CP-2D.md",
      sha256: "a".repeat(64),
      issue: "A source date was not recorded.",
    },
    sections: [],
  };
  const { container } = render(<ReportRecord run={run} entries={[entry]} mode="live" />);
  await screen.findByText("Live provider");
  const title = screen.getByRole("heading", { name: "Liquidity · Handoff issues", hidden: true });
  expect(title).not.toHaveTextContent("CP-2D");
  expect(container.querySelector("section details.rounded-ds-md.border")).toBeNull();
});

it("states missing library admission and original execution rather than inferring either", async () => {
  response();
  render(<ReportRecord run={run} entries={[]} mode="live" />);
  await screen.findByText("Live provider");
  expect(screen.getByText("Library admission is not recorded in this run record.")).toBeVisible();
  expect(
    screen.getByText("Original execution provenance is not recorded in this run record."),
  ).toBeVisible();
});

it("shows exact approved-summary limit labels and distinguishes old records", async () => {
  response({
    ...record,
    approved_summary_limits: [
      {
        id: "quotes-none",
        scope: "CP-3",
        outcome: "gap",
        reason: "No quotes and no price talk were entered — €5.10.",
        fix: "Add dated quotes.",
      },
    ],
  });
  render(<ReportRecord run={run} entries={[]} mode="live" />);
  expect(
    await screen.findByText("No quotes and no price talk were entered — €5.10."),
  ).toBeVisible();
  expect(screen.getByRole("heading", { name: "Approved summary limits" })).toBeVisible();
  expect(screen.getByText("Security selection")).toBeVisible();
  expect(screen.getByText("Gap")).toBeVisible();
  expect(screen.getByText("Add dated quotes.")).toBeVisible();
  expect(screen.queryByText("Approved summary limits were not recorded for this run.")).toBeNull();
});

it.each([undefined, null])(
  "states historical missing approved-summary metadata (%s)",
  async (approved_summary_limits) => {
    response({ ...record, approved_summary_limits });
    render(<ReportRecord run={run} entries={[]} mode="live" />);
    expect(
      await screen.findByText("Approved summary limits were not recorded for this run."),
    ).toBeVisible();
  },
);

it("states a recorded empty approved-summary limit list separately from missing metadata", async () => {
  response({ ...record, approved_summary_limits: [] });
  render(<ReportRecord run={run} entries={[]} mode="live" />);
  expect(
    await screen.findByText("The approved summary recorded no limits requiring a decision."),
  ).toBeVisible();
  expect(screen.queryByText("Approved summary limits were not recorded for this run.")).toBeNull();
});
