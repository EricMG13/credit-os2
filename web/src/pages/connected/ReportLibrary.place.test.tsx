import {
  act,
  cleanup,
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";
import type { Snapshot } from "./publishedReport";
import type * as Identity from "./report/IdentityBand";
import { reportIdentity } from "./report/IdentityBand";
import type * as ReportView from "./reportView";
import { buildReportView } from "./reportView";

// Both are counted, unchanged: the view built from a report, and a part drawn on every tab.
vi.mock("./reportView", async (original) => {
  const real = await original<typeof ReportView>();
  return { ...real, buildReportView: vi.fn(real.buildReportView) };
});
vi.mock("./report/IdentityBand", async (original) => {
  const real = await original<typeof Identity>();
  return { ...real, reportIdentity: vi.fn(real.reportIdentity) };
});

// The first render of the whole reader can pass the 1 s default on a busy machine.
configure({ asyncUtilTimeout: 5000 });
// Shorter than the test's own limit, so a missing effect fails on its assertion.
const SETTLE = { timeout: 2000 };

const EVIDENCE = {
  sources: [],
  unused: [],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};

function snapshot(extra: readonly object[] = []): Snapshot {
  const id = "northbridge-2026/outputs/CP-1.md";
  const text = (line: number) => ({
    type: "text",
    line,
    end: line,
    text: `Sentence ${String(line)}.`,
  });
  return {
    catalogue: {
      real: [
        {
          id: "northbridge-2026",
          name: "Northbridge",
          issuer: "Northbridge",
          title: "Full credit assessment",
          date: "2026-10-31",
          sector: "Industrials",
          period: "FY2026",
          metrics: {},
        },
      ],
    },
    workspace: {
      runs: {
        north: {
          folder: "northbridge-2026",
          issuer: "Northbridge",
          issuerKey: "northbridge-2026",
          title: "Full credit assessment",
          period: "FY2026",
          asOf: "2026-10-31",
          pathway: "credit_snapshot",
          modules: { "CP-1": { outputs: [id], default: id } },
          changes: { first_run: true },
          evidence: EVIDENCE,
        },
      },
      outputs: {
        [id]: {
          id,
          run: "north",
          module: "CP-1",
          label: "Financial foundation",
          href: id,
          sha256: "digest",
          state: { established: true, declared: null },
        },
      },
      handoffs: {
        digest: [
          { heading: "Findings", level: 2, line: 5, blocks: [] },
          { heading: "Bottom line", level: 3, line: 10, blocks: [text(11)] },
          { heading: "Key findings", level: 3, line: 20, blocks: [text(21)] },
          { heading: "Limitations", level: 3, line: 30, blocks: [text(31)] },
          ...extra,
        ],
      },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
}

function open(hash: string, extra: readonly object[] = []) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json(snapshot(extra)))),
  );
  window.history.replaceState(null, "", `/report/northbridge-2026${hash}`);
  render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

describe("report redrawing", () => {
  it("does not redraw the open tab when the source icons are highlighted", async () => {
    open("#modules/CP-1");
    await screen.findByRole("heading", { level: 2, name: "Financial foundation" });
    const built = vi.mocked(buildReportView).mock.calls.length;
    const drawn = vi.mocked(reportIdentity).mock.calls.length;
    fireEvent.click(screen.getByRole("switch", { name: "Highlight source icons" }));
    await waitFor(() => {
      expect(document.querySelector('[data-sources="on"]')).not.toBeNull();
    }, SETTLE);
    expect(vi.mocked(reportIdentity).mock.calls).toHaveLength(drawn);
    expect(vi.mocked(buildReportView).mock.calls).toHaveLength(built);
    fireEvent.click(screen.getByRole("switch", { name: "Highlight source icons" }));
  });

  it("draws a newly opened tab from the view already built for the report", async () => {
    open("#modules/CP-1");
    await screen.findByRole("heading", { level: 2, name: "Financial foundation" });
    const built = vi.mocked(buildReportView).mock.calls.length;
    const drawn = vi.mocked(reportIdentity).mock.calls.length;
    act(() => {
      window.location.hash = "#changes";
    });
    await waitFor(() => {
      expect(vi.mocked(reportIdentity).mock.calls.length).toBeGreaterThan(drawn);
    }, SETTLE);
    expect(vi.mocked(buildReportView).mock.calls).toHaveLength(built);
  });
});

// The shell's `main` is what scrolls, so each page of the report starts at its top and Back
// returns to the place the reader left.
describe("report page changes", () => {
  it("opens the page for a new address at its top", async () => {
    open("#modules/CP-1");
    await screen.findByRole("heading", { level: 2, name: "Financial foundation" });
    const main = screen.getByRole("main");
    main.scrollTop = 1500;
    fireEvent.scroll(main);
    act(() => {
      window.location.hash = "#changes";
    });
    await waitFor(() => {
      expect(main.scrollTop).toBe(0);
    }, SETTLE);
    expect(window.location.hash).toBe("#changes");
  });

  it("returns to the place the reader left when they go Back", async () => {
    open("#modules/CP-1");
    await screen.findByRole("heading", { level: 2, name: "Financial foundation" });
    const main = screen.getByRole("main");
    main.scrollTop = 1500;
    fireEvent.scroll(main);
    act(() => {
      window.location.hash = "#changes";
    });
    await waitFor(() => {
      expect(main.scrollTop).toBe(0);
    }, SETTLE);
    act(() => {
      window.history.back();
    });
    await waitFor(() => {
      expect(window.location.hash).toBe("#modules/CP-1");
    }, SETTLE);
    await waitFor(() => {
      expect(main.scrollTop).toBe(1500);
    }, SETTLE);
  });
});

const STATEMENT = {
  heading: "Financials and credit metrics",
  level: 3,
  line: 40,
  blocks: [
    {
      type: "table",
      headers: ["Metric", "FY2026"],
      line: 41,
      rows: [{ line: 42, cells: ["Net debt", "1400"] }],
    },
  ],
};

describe("module records address", () => {
  it("opens the records at their title when the address names them", async () => {
    open("#modules/CP-1/records", [STATEMENT]);
    await screen.findByRole("button", { name: "Hide records" });
    await waitFor(() => {
      expect(document.activeElement?.id).toBe("module-records");
    }, SETTLE);
  });

  it("opens the records when the address moves to them within the module", async () => {
    open("#modules/CP-1", [STATEMENT]);
    await screen.findByRole("button", { name: "Show records" });
    act(() => {
      window.location.hash = "#modules/CP-1/records";
    });
    await screen.findByRole("button", { name: "Hide records" }, SETTLE);
  });

  it("draws the module when the address names a table with an escape that is not UTF-8", async () => {
    open("#modules/CP-1/records/%E0");
    expect(
      await screen.findByRole("heading", { level: 2, name: "Financial foundation" }),
    ).toBeInTheDocument();
  });
});
