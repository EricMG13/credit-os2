// Final batch N1 (C6): the run pages name CP-L10 by the run's pathway.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ConnectedRun, LiveRun } from "./api";
import { RunningRow } from "./runActivityParts";
import { feedLines, moduleSteps } from "./runFigures";

const names = (run: ConnectedRun) =>
  moduleSteps(run, true).flatMap((step) => (step.kind === "module" ? [step.name] : []));

afterEach(cleanup);

const run = (pathway: string) =>
  ({
    id: "run-1",
    status: "running",
    reason: "",
    issuer_name: "Example",
    as_of: "2026-11-16",
    pathway,
    modules: [
      ["CP-0", "done"],
      ["CP-L10", "running"],
    ],
    observed_at: "2026-11-16T12:00:00Z",
    cap: "10",
    spent: "1",
    settled_spent: "1",
    held: "0",
    events: [{ kind: "stopped", module: "CP-L10", at: "2026-11-16T12:00:00Z" }],
  }) as unknown as ConnectedRun;

describe("run page module names", () => {
  it("feed lines and module steps use the pathway's name for CP-L10", () => {
    expect(feedLines(run("credit_screening")).map((line) => line.who)).toContain(
      "Credit screening",
    );
    expect(names(run("credit_screening"))).toContain("Credit screening");
  });

  it("leave another pathway's name unchanged", () => {
    expect(feedLines(run("short_snapshot")).map((line) => line.who)).toContain(
      "Short credit snapshot",
    );
    expect(names(run("lite_credit_assessment"))).toContain("Short credit snapshot");
  });

  it("the running row says 'Credit screening' is running now", () => {
    const live = { ...run("credit_screening"), submitted_by: "", files: 1 } as unknown as LiveRun;
    render(<RunningRow run={live} />);
    expect(screen.getByText("Now: Credit screening")).toBeInTheDocument();
    expect(screen.queryByText(/Short credit snapshot/)).toBeNull();
  });
});
