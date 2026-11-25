import { describe, expect, it } from "vitest";
import { moduleSteps, moduleWord, spendFigure } from "./runFigures";
import type { ConnectedRun as Run } from "./api";

const run: Run = {
  id: "run-1",
  status: "running",
  reason: "",
  issuer_name: "Example",
  as_of: "2026-11-16",
  pathway: "credit_snapshot",
  modules: [],
  observed_at: "2026-11-16T12:00:00Z",
  cap: "20",
  spent: "8.25",
  settled_spent: "1.25",
  held: "7.00",
  events: [],
};

describe("moduleWord", () => {
  it("reads the module a failed run stopped at as Not assessable, not Interrupted", () => {
    expect(moduleWord("stopped", false, true)).toBe("Not assessable");
    expect(moduleWord("running", false, true)).toBe("Not assessable");
  });

  it("keeps Interrupted for a stop the run itself did not fail on", () => {
    expect(moduleWord("stopped", false)).toBe("Interrupted");
    expect(moduleWord("stopped", false, false)).toBe("Interrupted");
    expect(moduleWord("running", false)).toBe("Interrupted");
  });

  it("is unchanged for a module that finished, runs, waits or never ran", () => {
    expect(moduleWord("done", false, true)).toBe("Finished");
    expect(moduleWord("running", true)).toBe("Running");
    expect(moduleWord("waiting", true)).toBe("Queued");
    expect(moduleWord("waiting", false, true)).toBe("Not run");
  });
});

describe("spendFigure", () => {
  it("shows settled charges and unresolved holds as cap usage", () => {
    expect(spendFigure(run)).toEqual({
      value: "USD 8.25",
      bar: {
        value: 8.25,
        max: 20,
        label: "USD 8.25 of USD 20.00 cap usage; USD 1.25 settled, USD 7.00 reserved or unknown",
      },
    });
  });

  it("does not turn an unreadable journal into zero usage", () => {
    expect(
      spendFigure({ ...run, status: "queued", spent: null, settled_spent: null, held: null }),
    ).toEqual({
      value: null,
      bar: null,
      note: "Cap usage is unavailable; the budget journal could not be read",
    });
  });

  it("reports a zero configured cap without implying the run was free", () => {
    expect(spendFigure({ ...run, cap: "0", spent: "1", settled_spent: "1", held: "0" })).toEqual({
      value: "USD 1.00",
      bar: null,
      note: "Configured cap is USD 0.00; USD 1.00 settled, USD 0.00 reserved or unknown",
    });
  });
});

describe("the module the checks stopped at", () => {
  const stopped: Run = {
    ...run,
    status: "failed",
    stopped_by: "checker",
    modules: [
      ["CP-0", "done"],
      ["CP-1", "stopped"],
      ["CP-1A", "stopped"],
      ["Report", "waiting"],
    ],
  };
  const states = (events: Run["events"]) =>
    moduleSteps({ ...stopped, events }, false).map(({ state }) => state);

  it("is the earliest open module in plan order when starts interleave", () => {
    expect(
      states([
        { kind: "module_started", at: "2026-11-16T12:00:00Z", module: "CP-0" },
        { kind: "module_accepted", at: "2026-11-16T12:01:00Z", module: "CP-0" },
        { kind: "module_started", at: "2026-11-16T12:01:01Z", module: "CP-1" },
        { kind: "module_started", at: "2026-11-16T12:01:02Z", module: "CP-1A" },
        { kind: "draft_rejected", at: "2026-11-16T12:02:00Z", module: "CP-1" },
        { kind: "stopped", at: "2026-11-16T12:02:01Z" },
      ]),
    ).toEqual(["Finished", "Not assessable", "Interrupted", "Not run"]);
  });

  it("is the module the record says the checks rejected, even when an earlier one in plan order is still open", () => {
    // CP-1 and CP-1A are both open; only CP-1A's drafts were rejected, so the run stopped at CP-1A.
    expect(
      states([
        { kind: "module_started", at: "2026-11-16T12:01:01Z", module: "CP-1" },
        { kind: "module_started", at: "2026-11-16T12:01:02Z", module: "CP-1A" },
        { kind: "draft_rejected", at: "2026-11-16T12:01:40Z", module: "CP-1A" },
        { kind: "draft_rejected", at: "2026-11-16T12:01:50Z", module: "CP-1A" },
        { kind: "stopped", at: "2026-11-16T12:02:01Z" },
      ]),
    ).toEqual(["Finished", "Interrupted", "Not assessable", "Not run"]);
  });

  it("does not blame an earlier module that was accepted after its last start", () => {
    expect(
      states([
        { kind: "module_started", at: "2026-11-16T12:01:01Z", module: "CP-1" },
        { kind: "module_started", at: "2026-11-16T12:01:02Z", module: "CP-1A" },
        { kind: "module_accepted", at: "2026-11-16T12:01:30Z", module: "CP-1" },
        { kind: "stopped", at: "2026-11-16T12:02:01Z" },
      ]),
    ).toEqual(["Finished", "Interrupted", "Not assessable", "Not run"]);
  });

  it("gives the last started module when modules run one at a time", () => {
    expect(
      states([
        { kind: "module_started", at: "2026-11-16T12:00:00Z", module: "CP-0" },
        { kind: "module_accepted", at: "2026-11-16T12:01:00Z", module: "CP-0" },
        { kind: "module_started", at: "2026-11-16T12:01:01Z", module: "CP-1" },
        { kind: "module_accepted", at: "2026-11-16T12:01:30Z", module: "CP-1" },
        { kind: "module_started", at: "2026-11-16T12:01:31Z", module: "CP-1A" },
        { kind: "stopped", at: "2026-11-16T12:02:01Z" },
      ]),
    ).toEqual(["Finished", "Interrupted", "Not assessable", "Not run"]);
  });
});
