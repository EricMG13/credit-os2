import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ConnectedRun as Run } from "./api";
import type { PublishedRun } from "./publishedReport";
import { ReportRecord } from "./report/Record";
import { RunProgress } from "./RunProgress";

const record: Run = {
  id: "case",
  issuer_name: "Issuer",
  as_of: "2026-11-17",
  pathway: "credit_snapshot",
  status: "running",
  reason: "",
  modules: [
    ["CP-0", "done"],
    ["CP-1", "running"],
    ["Report", "waiting"],
  ],
  observed_at: "2026-11-17T12:00:00Z",
  execution: "synthetic",
  cap: "25",
  spent: "0",
  events: [],
};
const publication = {
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
} as PublishedRun;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function respond(value: unknown) {
  const fetch = vi.fn((input: string) => {
    if (!input.startsWith("/connected/")) throw new Error("unexpected test request");
    return Promise.resolve(new Response(JSON.stringify(value)));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

it("C1-028 labels an accepted blocked output while downstream modules are still running", async () => {
  const fetch = respond({
    ...record,
    module_outputs: [
      {
        module: "CP-0",
        assessment: "not-assessable",
        provenance: "new-response",
        response_sha256: "a".repeat(64),
      },
    ],
  });
  render(<RunProgress id="case" mode="synthetic" />);
  const pipeline = await screen.findByRole("list", { name: "Modules in this run" });
  expect(within(pipeline).getByText("Not assessable")).toBeVisible();
  expect(screen.getByRole("progressbar", { name: "Modules finished" })).toHaveAttribute(
    "aria-valuetext",
    "1 of 2 modules",
  );
  expect(screen.getByText("1 of 2")).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0]?.[0]).toBe("/connected/activity/case");
});

it("C1-028 says which completed output lacks assessment metadata instead of guessing", async () => {
  respond({
    ...record,
    module_outputs: [{ module: "CP-0", assessment: null, provenance: null, response_sha256: null }],
  });
  render(<RunProgress id="case" mode="synthetic" />);
  expect(
    await screen.findByText("No assessment status is recorded for Source readiness."),
  ).toBeVisible();
  expect(screen.getByRole("progressbar", { name: "Modules finished" })).toHaveAttribute(
    "aria-valuetext",
    "1 of 2 modules",
  );
  expect(screen.getByText("1 of 2")).toBeVisible();
});

it("C1-028 keeps current recorded assessment when older report metadata omits its optional field", async () => {
  vi.stubGlobal("fetch", (input: string) =>
    Promise.resolve(
      new Response(
        JSON.stringify(
          input.includes("/connected/report/")
            ? { id: "case", issuer: "Issuer", asOf: "2026-11-17", pathway: "credit_snapshot" }
            : {
                ...record,
                status: "finished",
                module_outputs: [
                  {
                    module: "CP-0",
                    assessment: "not-assessable",
                    provenance: "new-response",
                    response_sha256: "a".repeat(64),
                  },
                ],
              },
        ),
      ),
    ),
  );
  render(<RunProgress id="case" mode="synthetic" />);
  await screen.findByRole("link", { name: "Open report" });
  const pipeline = screen.getByRole("list", { name: "Modules in this run" });
  expect(within(pipeline).getByText("Not assessable")).toBeVisible();
});

it.each([
  ["listed", "This run is listed in the current library."],
  ["not-listed", "This run is not listed in the current library."],
  [null, "Library admission is not recorded in this run record."],
])("C5-033 draws the actual %s admission state", async (admission, text) => {
  respond({ ...record, library_admission: admission });
  render(<ReportRecord run={publication} entries={[]} mode="synthetic" />);
  expect(await screen.findByText(text)).toBeVisible();
});

it("C5-033 lists exact retained and new-response provenance without claiming paid execution", async () => {
  respond({
    ...record,
    module_outputs: [
      {
        module: "CP-0",
        assessment: "not-assessable",
        provenance: "retained-response",
        response_sha256: "a".repeat(64),
      },
      {
        module: "CP-1",
        assessment: "readable",
        provenance: "new-response",
        response_sha256: "b".repeat(64),
      },
    ],
  });
  render(<ReportRecord run={publication} entries={[]} mode="synthetic" />);
  const section = await screen.findByRole("region", { name: "Response provenance" });
  expect(within(section).getByText("Reused retained response")).toBeVisible();
  expect(within(section).getByText("Response recorded for this run")).toBeVisible();
  expect(within(section).getByText("a".repeat(64))).toBeVisible();
  expect(within(section).getByText("b".repeat(64))).toBeVisible();
  expect(section.textContent).not.toMatch(/paid|provider call|analytical success/i);
});

it.each([
  [null, "Original execution provenance is not recorded in this run record."],
  [[], "No current accepted module responses are recorded."],
  [
    [{ module: "CP-0", assessment: null, provenance: null, response_sha256: null }],
    "Response provenance unavailable",
  ],
])(
  "C5-033 keeps absent, recorded-empty and unavailable provenance distinct",
  async (outputs, text) => {
    respond({ ...record, module_outputs: outputs });
    render(<ReportRecord run={publication} entries={[]} mode="synthetic" />);
    expect(await screen.findByText(text)).toBeVisible();
  },
);
