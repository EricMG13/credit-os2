import { afterEach, expect, it, vi } from "vitest";
import { feedLines } from "./runFigures";
import type { ConnectedRun as Run } from "./api";

const run = {
  id: "run-1",
  status: "running",
  reason: "",
  issuer_name: "Example",
  as_of: "2026-11-16",
  pathway: "credit_snapshot",
  modules: [],
  observed_at: "2026-11-16T12:00:00Z",
  cap: "20",
  spent: "1",
  settled_spent: "1",
  held: "0",
  events: [
    { kind: "module_started", module: "CP-1", at: "2026-11-16T11:00:00Z" },
    { kind: "future_kind", module: "CP-1", at: "2026-11-16T11:01:00Z" },
    { kind: "future_kind", module: "CP-1", at: "2026-11-16T11:02:00Z" },
  ],
} as unknown as Run;

afterEach(() => {
  vi.restoreAllMocks();
});

it("skips an event kind this build does not list and warns once per kind", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const lines = feedLines(run);
  expect(lines.map((line) => line.text)).toEqual(["Module started."]);
  expect(warn).toHaveBeenCalledTimes(1);
});
