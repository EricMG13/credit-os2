import { describe, expect, it } from "vitest";
import type { PublishedChanges, PublishedRun, Snapshot } from "../publishedReport";
import { maturityTraces } from "./comparisonTrace";

describe("maturityTraces", () => {
  it("gives no earlier trace when the earlier run is a summary run with no modules (C2-3)", () => {
    const snapshot = {
      chips: {},
      workspace: { runs: { old: { folder: "prior" } } },
    } as unknown as Snapshot;
    const change: PublishedChanges = { pack: { prior: { run: "prior" } } } as PublishedChanges;
    const traces = maturityTraces(snapshot, { folder: "current" } as PublishedRun, [], change);
    expect(traces.prior).toBeUndefined();
  });
});
