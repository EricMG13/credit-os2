import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ReportLibrary } from "./LibraryIndex";
import { HeadlineFigures } from "./HeadlineFigures";
import type { Trace } from "@/pages/library/slice";
import type { Snapshot } from "./publishedReport";

const SHA = "e".repeat(64);
function fixture(): Snapshot {
  return {
    catalogue: {
      real: [
        {
          id: "current",
          issuer: "Acme",
          name: "Acme",
          title: "Full credit assessment",
          date: "2026-03-31",
          period: "FY2025",
          sector: "Industrial",
          metrics: { revenue: { value: "1250.00", unit: "US$m", period: "FY2025" } },
        },
      ],
    },
    workspace: {
      runs: {
        current: {
          folder: "current",
          issuer: "Acme",
          issuerKey: "acme",
          title: "Full credit assessment",
          period: "FY2025",
          asOf: "2026-03-31",
          pathway: "credit_snapshot",
          modules: { "CP-1": { outputs: ["current/foundation"], default: "current/foundation" } },
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
        },
      },
      outputs: {
        "current/foundation": {
          id: "current/foundation",
          run: "current",
          module: "CP-1",
          label: "Financial foundation",
          href: "",
          sha256: SHA,
        },
      },
      handoffs: {
        [SHA]: [
          {
            heading: "Chart data: revenue and EBITDA",
            level: 3,
            line: 19,
            blocks: [
              {
                type: "table",
                line: 20,
                headers: [
                  "Period",
                  "Revenue",
                  "Adjusted EBITDA",
                  "Reporting unit",
                  "Basis and limitation",
                ],
                rows: [
                  {
                    line: 22,
                    cells: ["FY2025", "1250.00", "200.00", "US$m", "Original filing page 2"],
                  },
                ],
              },
            ],
          },
        ],
      },
      models: [],
    },
    chips: {},
  };
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
  vi.unstubAllGlobals();
});

function serve(snapshot: Snapshot, source: () => Response | Promise<Response>) {
  const index = {
    catalogue: structuredClone(snapshot.catalogue),
    workspace: {
      runs: { current: { folder: "current", issuerKey: "acme", pathway: "credit_snapshot" } },
    },
  };
  const fetch = vi.fn((url: string) =>
    url === "/connected/library"
      ? Promise.resolve(Response.json(index))
      : Promise.resolve().then(source),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

it("qualifies retained coverage and keeps the preview reason visible with the row open", async () => {
  const snapshot = fixture();
  const entry = snapshot.catalogue.real[0];
  if (!entry) throw new Error("Missing catalogue fixture");
  entry.metrics.coverage = {
    value: "4.19",
    unit: "x",
    basis: "LTM reported EBITDA over LTM cash interest for debt 776; calculation C34",
  };
  snapshot.preview = { reason: "Retained test record." };
  vi.stubGlobal("fetch", () => Promise.resolve(Response.json(snapshot)));
  render(<ReportLibrary readOnly />);
  // Every row that states the figure shares the qualified label, so the column header carries it.
  expect(
    (await screen.findAllByText("Reported EBITDA / cash interest on debt")).length,
  ).toBeGreaterThan(0);
  expect(screen.getAllByText("Liquidity (cash)").length).toBeGreaterThan(1);
  const issuers = within(screen.getByRole("list", { name: "Issuers" }));
  expect(issuers.queryByText("Delivered")).toBeNull();
  expect(issuers.getByText("Test preview")).toBeVisible();
  expect(screen.queryByRole("link", { name: "Start a run" })).toBeNull();
  expect(screen.getByText("Retained test record.")).toBeVisible();
});

it("J4-001 loads a scoped snapshot only when a row is opened or a figure is traced, reads it once, and opens its exact row", async () => {
  const snapshot = fixture();
  const fetch = serve(snapshot, () => Response.json(snapshot));
  render(<ReportLibrary />);
  await screen.findByRole("heading", { name: "Acme" });
  expect(fetch.mock.calls.map(([url]) => url)).toEqual(["/connected/library"]);
  fireEvent.click(screen.getByRole("button", { name: /Show runs and detail for Acme/ }));
  await screen.findByText(/The report states no upcoming dated event\./);
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    "/connected/library",
    "/connected/snapshot?run=current",
  ]);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for Revenue, Acme" }));
  const drawer = await screen.findByRole("dialog", {
    name: "Sources for Chart data: revenue and EBITDA",
  });
  // One scoped request served the dates and the trace.
  expect(fetch.mock.calls.map(([url]) => url)).toEqual([
    "/connected/library",
    "/connected/snapshot?run=current",
  ]);
  expect(drawer).toHaveTextContent("Original filing page 2");
  expect(within(drawer).getByRole("link", { name: "Open in Evidence" })).toHaveAttribute(
    "href",
    `/report/current#evidence/current%2Ffoundation~${SHA}-22`,
  );
});

it("J4-001 states a missing source instead of linking a same-valued figure in another currency", async () => {
  const snapshot = fixture();
  serve(snapshot, () => {
    const metric = snapshot.catalogue.real[0]?.metrics.revenue;
    if (!metric) throw new Error("Missing exact revenue fixture");
    metric.unit = "GBPm";
    return Response.json(snapshot);
  });
  render(<ReportLibrary />);
  await screen.findByRole("heading", { name: "Acme" });
  fireEvent.click(screen.getByRole("button", { name: /Show runs and detail for Acme/ }));
  fireEvent.click(screen.getByRole("button", { name: "Show sources for Revenue, Acme" }));
  expect(
    await screen.findByText(
      "The original source row for this figure is not available in this run’s published record.",
    ),
  ).toBeVisible();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("$1,250.00m")).toBeVisible();
});

it("J4-001 offers an honest source-load failure without drawing a trace", async () => {
  const snapshot = fixture();
  serve(snapshot, () => Promise.reject(new TypeError("Failed to fetch")));
  render(<ReportLibrary />);
  await screen.findByRole("heading", { name: "Acme" });
  fireEvent.click(screen.getByRole("button", { name: /Show runs and detail for Acme/ }));
  fireEvent.click(screen.getByRole("button", { name: "Show sources for Revenue, Acme" }));
  expect(
    await screen.findByText(
      "Sources for this figure could not be loaded. Try its source control again.",
    ),
  ).toBeVisible();
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("J4-001 ignores a completed source lookup after its displayed figure changes", async () => {
  const catalogue = fixture().catalogue.real[0];
  if (!catalogue) throw new Error("Missing exact catalogue fixture");
  let finish: ((result: { trace: Trace; href: string }) => void) | undefined;
  let signal: AbortSignal | undefined;
  const pending = new Promise<{ trace: Trace; href: string }>((resolve) => {
    finish = resolve;
  });
  const requestSource = (_key: string, token: AbortSignal) => {
    signal = token;
    return pending;
  };
  const shown = render(<HeadlineFigures catalogue={catalogue} requestSource={requestSource} />);
  fireEvent.click(screen.getByRole("button", { name: "Show sources for Revenue" }));
  shown.rerender(
    <HeadlineFigures
      catalogue={{
        ...catalogue,
        metrics: { revenue: { value: "1300.00", period: "FY2025", unit: "US$m" } },
      }}
      requestSource={requestSource}
    />,
  );
  expect(signal?.aborted).toBe(true);
  const trace: Trace = {
    title: "Old figure source",
    heading: "Old figure",
    subtitle: "Original run",
    statement: "Original amount",
    derivation: { label: "Original", value: null, note: null, children: [] },
    excerpt: null,
    qualification: null,
    evidenceItem: "old",
  };
  await act(async () => {
    if (!finish) throw new Error("Missing pending source fixture");
    finish({ trace, href: "/report/current#evidence/old" });
    await pending;
  });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("$1,300.00m")).toBeVisible();
});
