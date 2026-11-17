import { cleanup, render, screen, within } from "@testing-library/react";
import { App } from "@/App";
import type { LoadResult } from "@/data";
import { readSlice } from "./slice/read";
import { fixtureSlice, must } from "./slice/test-fixture";
import type { Bridge, ModelRun } from "./slice/types";

/** Retain the authored first case and its data, without a replacement second case. */
function oneCase(forecast = true) {
  const source = fixtureSlice() as { runs: ModelRun[] };
  const run = must(source.runs[0]);
  run.cases.splice(1);
  run.statements.columns.forEach((column) => {
    if (column.kind === "forecast") column.notes.splice(1);
  });
  run.statements.statements.forEach((statement) => {
    statement.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (Array.isArray(cell)) cell.splice(1);
      });
    });
  });
  const retainFirst = (bridge: Bridge) => {
    bridge.caseSteps.splice(1);
    bridge.head.splice(2);
    bridge.rows.forEach((row) => row.cells.splice(1));
  };
  run.statements.bridges.forEach(retainFirst);
  if (run.forecast !== null) {
    run.forecast.drivers.head.pop();
    run.forecast.drivers.rows.forEach((row) => {
      row.markers.splice(1);
      row.cells.pop();
    });
    run.forecast.driverKeys.splice(1);
    run.forecast.interestCover.cases.splice(1);
    run.forecast.interestCover.rows.splice(1);
    run.forecast.ebitda.series.splice(1);
    run.forecast.ebitda.rows.splice(1);
    retainFirst(run.forecast.walk);
  }
  if (!forecast) run.forecast = null;
  return source;
}

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

function open(page: string, source = oneCase()) {
  window.location.hash = `#/model/transdigm/2025-06-30/${page}`;
  const result: LoadResult = {
    kind: "ok",
    data: { schema: "credit-os-data/1", issuers: [], model: source },
  };
  return render(<App result={result} />);
}

describe("R3-001: one published case", () => {
  it.each([true, false])("reads the run with forecast present: %s", (forecast) => {
    const source = oneCase(forecast);
    const before = structuredClone(source);
    const result = readSlice(source);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") throw new Error(result.kind);
    expect(result.data.unreadable).toEqual([]);
    expect(result.data.runs[0]?.cases.map((item) => item.name)).toEqual(["Base case"]);
    expect(source).toEqual(before);
  });

  it.each(["front", "analysis", "statements", "portfolio-fit", "limitations", "forecast"])(
    "keeps the %s page readable",
    (page) => {
      open(page);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("TransDigm Group");
      expect(screen.queryByText("This part of the library could not be read")).toBeNull();
      expect(screen.queryByText("Two cases")).toBeNull();
    },
  );

  it("states the absent second case beside the authored forecast", () => {
    open("forecast");
    expect(
      screen.getByText(
        "Only one case was published. A second case is not available for comparison.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("figure", { name: "Interest cover" })).toBeVisible();
    expect(
      within(screen.getByRole("radiogroup", { name: "Case" })).getAllByRole("radio"),
    ).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Base case" })).toBeChecked();
  });

  it("does not invent a second case for the side by side chart", () => {
    open("statements");
    expect(
      screen.getByText(
        "Only one case was published. A second case is not available for comparison.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("figure", { name: "The two cases side by side" })).toBeNull();
    expect(
      within(screen.getByRole("table")).getByRole("columnheader", { name: "Income statement" }),
    ).toBeVisible();
  });

  it.each([null, undefined])(
    "shows a one-case run without a delivered binary comparison: %s",
    (comparison) => {
      const source = oneCase();
      const statements = must(source.runs[0]).statements;
      if (comparison === undefined) Reflect.deleteProperty(statements, "comparison");
      else Object.assign(statements, { comparison });
      open("statements", source);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("TransDigm Group");
      expect(
        screen.getByText(
          "Only one case was published. A second case is not available for comparison.",
        ),
      ).toBeVisible();
    },
  );
});
