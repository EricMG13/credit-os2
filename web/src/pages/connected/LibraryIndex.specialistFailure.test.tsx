import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ReportLibrary, resetCardFindings } from "./LibraryIndex";

const overview = vi.hoisted(() => ({ fail: true, read: 0 }));
vi.mock("./export/reportExport", () => ({
  reportSpecialistOverview: () => {
    overview.read += 1;
    if (overview.fail) throw new Error("chunk failed");
    return null;
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
  window.history.replaceState(null, "", "/?pathway=Relative+Value");
  resetCardFindings();
  overview.fail = true;
  overview.read = 0;
  const runs = { "relative-run": run };
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        Response.json(
          url === "/connected/library"
            ? { catalogue, workspace: { runs } }
            : {
                reportFolder: "relative-run",
                catalogue,
                workspace: { runs, outputs: {}, handoffs: {}, models: [] },
                chips: {},
              },
        ),
      ),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function openRow() {
  const view = render(<ReportLibrary />);
  fireEvent.click(await screen.findByRole("button", { name: "Show runs and detail for Acme" }));
  return view;
}

it("says the finding could not be loaded, and logs why, when reading it fails", async () => {
  const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  await openRow();
  expect(await screen.findByText("The finding could not be loaded.")).toBeVisible();
  expect(screen.queryByText("A verified finding is unavailable for this report.")).toBeNull();
  expect(logged).toHaveBeenCalledWith("The finding could not be loaded.", expect.any(Error));
});

it("keeps the unavailable wording for a real absence of a finding", async () => {
  overview.fail = false;
  const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  await openRow();
  expect(
    await screen.findByText("A verified finding is unavailable for this report."),
  ).toBeVisible();
  expect(screen.queryByText("The finding could not be loaded.")).toBeNull();
  expect(logged).not.toHaveBeenCalled();
});

it("asks again on a remount after a failure", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const first = await openRow();
  await screen.findByText("The finding could not be loaded.");
  first.unmount();
  await openRow();
  await screen.findByText("The finding could not be loaded.");
  expect(overview.read).toBe(2);
});
