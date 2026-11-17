import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Run } from "../api";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { ReportEvidence } from "./Evidence";

const evidence = {
  sources: [],
  unused: [],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};

const call = {
  module: "CP-1",
  attempt: 1,
  started: "2026-11-17T07:00:00Z",
  http_status: 200,
  error_class: null,
  settled_usd: "0.10",
};
const broken: OutputEntry = {
  output: {
    id: "out",
    module: "CP-1",
    label: "Saved alternate",
    href: "out.md",
    sha256: "a".repeat(64),
    parseError: "The handoff could not be read.",
  },
  sections: [],
  selected: true,
};
const recorded: Partial<PublishedRun> = {
  record: {
    steps: [{ module: "CP-1", started: "2026-11-17T07:00:00Z", accepted: "2026-11-17T07:02:00Z" }],
  },
  evidence: {
    ...evidence,
    record: { ...evidence.record, calls: [call, { ...call, module: "CP-2" }] },
  },
};

/** The service's run record, answered to the Record tab's request. */
function serve(run: Partial<Run> | null) {
  vi.stubGlobal("fetch", () =>
    run === null
      ? new Promise(() => {})
      : Promise.resolve(Response.json({ id: "case", status: "finished", events: [], ...run })),
  );
}

function showRecord(run: Partial<PublishedRun>, entries: OutputEntry[] = [], target = "record") {
  const snapshot = {
    workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
    chips: {},
  } as unknown as Snapshot;
  return render(
    <ReportEvidence
      snapshot={snapshot}
      run={{ folder: "case", evidence, ...run } as unknown as PublishedRun}
      entries={entries}
      target={target}
      mode="synthetic"
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows why an unreadable comparison could not be read, where Changes sends the reader", () => {
  serve(null);
  const problem = "Unreadable: changes/pack.json is not valid JSON";
  showRecord({ changes: { problem } });
  expect(screen.getByText("Comparison problem:")).toBeVisible();
  expect(screen.getByText(problem)).toBeVisible();
});

describe("a module's record", () => {
  it("draws its headings one level below Module records, skipping none", () => {
    serve(null);
    const { container } = showRecord(recorded, [broken], "record/CP-1");
    const levels = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6"), (node) =>
      Number(node.tagName.slice(1)),
    );
    expect(levels).not.toContain(5);
    levels.forEach((level, at) => {
      expect(level).toBeLessThanOrEqual((levels[at - 1] ?? 1) + 1);
    });
    expect(screen.getByRole("heading", { level: 3, name: "Module records" })).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 4, name: "Synthetic adapter responses" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { level: 4, name: /Handoff issues/ })).toBeVisible();
  });

  it("names the started and accepted times, and names each call table by its module", () => {
    serve(null);
    showRecord(recorded, [], "record/CP-1");
    expect(screen.getByRole("heading", { name: "Started and accepted" })).toBeVisible();
    const calls = screen.getByRole("region", {
      name: "Financial foundation: Synthetic adapter responses",
    });
    expect(within(calls).getByRole("columnheader", { name: "Adapter status" })).toBeVisible();
  });

  it("gives two modules' call tables two names, not two regions called Table", () => {
    serve(null);
    showRecord(recorded);
    expect(screen.queryByRole("region", { name: "Table" })).toBeNull();
    expect(screen.getAllByRole("region").map((node) => node.getAttribute("aria-label"))).toEqual([
      "Response provenance",
      "Financial foundation: Synthetic adapter responses",
      "Fundamental credit: Synthetic adapter responses",
    ]);
  });
});

describe("the delivery line", () => {
  it.each([
    [
      "delivered",
      [
        { at: "2026-11-17T07:05:00Z", kind: "delivery_started" },
        { at: "2026-11-17T07:06:00Z", kind: "delivered" },
      ],
      "Report delivered 17 Nov 2026, 07:06 UTC",
    ],
    [
      "started and not finished",
      [{ at: "2026-11-17T07:05:00Z", kind: "delivery_started" }],
      "Report delivery started 17 Nov 2026, 07:05 UTC; not finished",
    ],
    ["never started", [], "No delivery recorded"],
  ] as const)("says %s from the run record's events", async (_state, events, words) => {
    serve({ events: [...events] });
    showRecord({});
    expect(await screen.findByText(words)).toBeVisible();
    expect(screen.getByText("Delivery")).toBeVisible();
    expect(screen.queryByText("The run's event log could not be read.")).toBeNull();
  });

  it("says the event log could not be read, not that no delivery was recorded, when it is null", async () => {
    serve({ events: null });
    showRecord({});
    expect(await screen.findByText("The run's event log could not be read.")).toBeVisible();
    expect(screen.getByText("Delivery")).toBeVisible();
    expect(screen.queryByText("No delivery recorded")).toBeNull();
  });

  it("does not say no delivery is recorded before the run record has answered", () => {
    serve(null);
    showRecord({});
    expect(screen.getByText("Delivery")).toBeVisible();
    expect(screen.queryByText("No delivery recorded")).toBeNull();
  });
});
