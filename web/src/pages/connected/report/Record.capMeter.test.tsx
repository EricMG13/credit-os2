import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ConnectedRun as Run } from "../api";
import type { PublishedRun } from "../publishedReport";
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
  spent: "17.75",
  events: [],
};
const run = {
  folder: "case",
  issuer: "Issuer",
  title: "Issuer credit view",
  period: "2026",
  asOf: "2026-11-17",
  pathway: "credit_snapshot",
  modules: {},
  record: { steps: [] },
  evidence: {
    sources: [],
    unused: [],
    unrecorded: [],
    noSourcesModules: [],
    handoffs: [],
    downloads: [],
    zip: null,
    record: { hashes: [], instructions: [], calls: [], cap: "25" },
  },
} as unknown as PublishedRun;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function showSpent(spent: string) {
  vi.stubGlobal("fetch", () => Promise.resolve(new Response(JSON.stringify({ ...record, spent }))));
  render(<ReportRecord run={run} entries={[]} mode="live" />);
  return screen.findByRole("progressbar", { name: /cap usage/ });
}

it("draws cap usage at 71% of the cap in band 3, with the percent and the label in words", async () => {
  const bar = await showSpent("17.75");
  expect(bar.firstElementChild).toHaveClass("bg-cap-band-3");
  expect(screen.getByText("71%")).toBeVisible();
  // The accessible name is the visible label, which keeps the settled and reserved breakdown.
  const label = bar.getAttribute("aria-label");
  expect(label).toMatch(/^USD 17\.75 of USD 25\.00 cap usage/);
  expect(screen.getByText(label ?? "")).toBeVisible();
});

it("draws cap usage at the cap in band 5 with the words At the cap", async () => {
  const bar = await showSpent("25.00");
  expect(bar.firstElementChild).toHaveClass("bg-cap-band-5");
  expect(screen.getByText(/At the cap/)).toBeVisible();
});
