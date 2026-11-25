import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ReportLibrary, resetCardFindings } from "./LibraryIndex";

type Finding = { owner: { id: string; sha256: string }; line: number; body: string };
// `read` counts how often a finding is worked out from a fetched report: once per publication.
const overview = vi.hoisted(() => ({
  finding: ((): Finding | undefined => undefined)(),
  read: 0,
}));
vi.mock("./export/reportExport", () => ({
  reportSpecialistOverview: () => {
    overview.read += 1;
    return overview.finding ? { findings: [overview.finding] } : null;
  },
}));

const run = {
  folder: "relative-run",
  issuer: "Acme",
  issuerKey: "acme",
  title: "Relative value",
  period: "FY2025",
  asOf: "2026-03-31",
  pathway: "relative_value",
  publicationVerified: true,
  modules: {},
  evidence: {
    sources: [],
    unused: [],
    unrecorded: [],
    noSourcesModules: [],
    handoffs: [],
    downloads: [],
    zip: null,
    record: { hashes: [], instructions: [], calls: [], cap: null },
  },
};
const catalogue = {
  real: [
    {
      id: "relative-run",
      issuer: "Acme",
      name: "Acme",
      title: "Relative value",
      date: "2026-03-31",
      period: "FY2025",
      sector: "Industrial",
      metrics: {},
    },
  ],
};

beforeEach(() => {
  resetCardFindings();
  overview.read = 0;
  overview.finding = {
    owner: { id: "relative-run/cp7", sha256: "e".repeat(64) },
    line: 4,
    body: "Prefer the 2030s.",
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type Served = { publishedAt: string; reportFolder: string };

function serve(served: Served) {
  const fetch = vi.fn((url: string) => {
    const published = { ...run, publishedAt: served.publishedAt };
    const runs = { "relative-run": published };
    return Promise.resolve(
      Response.json(
        url === "/connected/library"
          ? { catalogue, workspace: { runs } }
          : {
              reportFolder: served.reportFolder,
              catalogue,
              workspace: { runs, outputs: {}, handoffs: {}, models: [] },
              chips: {},
            },
      ),
    );
  });
  vi.stubGlobal("fetch", fetch);
  const snapshots = () => fetch.mock.calls.filter(([url]) => url !== "/connected/library").length;
  return snapshots;
}

/** The Library with Acme's row opened: the credit view is in the opened row. */
async function openRow() {
  const view = render(<ReportLibrary />);
  fireEvent.click(await screen.findByRole("button", { name: "Show runs and detail for Acme" }));
  return view;
}

async function mountOnce() {
  const view = await openRow();
  await new Promise((resolve) => setTimeout(resolve, 50));
  view.unmount();
}

it("reads a specialist row's finding once per publication across remounts", async () => {
  const snapshots = serve({ publishedAt: "2026-04-01T00:00:00Z", reportFolder: "relative-run" });
  const first = await openRow();
  await screen.findByText("Prefer the 2030s.");
  // The finding and the row's next event share the row's one request.
  expect(snapshots()).toBe(1);
  first.unmount();
  await openRow();
  await screen.findByText("Prefer the 2030s.");
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(overview.read).toBe(1);
});

it("asks again when the same folder and date are republished", async () => {
  const served = { publishedAt: "2026-04-01T00:00:00Z", reportFolder: "relative-run" };
  const snapshots = serve(served);
  await mountOnce();
  expect(snapshots()).toBe(1);
  expect(overview.read).toBe(1);
  served.publishedAt = "2026-04-02T00:00:00Z";
  await mountOnce();
  expect(overview.read).toBe(2);
});

it("asks again after a first result with no finding", async () => {
  overview.finding = undefined;
  serve({ publishedAt: "2026-04-01T00:00:00Z", reportFolder: "relative-run" });
  await mountOnce();
  expect(overview.read).toBe(1);
  await mountOnce();
  expect(overview.read).toBe(2);
});

it("reads no finding from a report served for another folder", async () => {
  const snapshots = serve({ publishedAt: "2026-04-01T00:00:00Z", reportFolder: "other-run" });
  await mountOnce();
  expect(snapshots()).toBe(1);
  expect(overview.read).toBe(0);
});
