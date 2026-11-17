import { readSlice } from "./read";
import { edited, fixtureSlice, readRuns } from "./test-fixture";

// S5-001, ruling L8: a run may publish no forecast (a lite run, a short snapshot). The reader reads
// the absent key as null and the run's other five pages stay readable. A one-case run is also
// readable (R3-001), but the rest of its supplied data must still agree with that case count.
const FORECAST = ["runs", 0, "forecast"] as const;
const noForecast = () => edited(FORECAST, undefined);

describe("readSlice: a run with no forecast", () => {
  it("reads a run whose forecast key is absent, holding the forecast as null", () => {
    const result = readSlice(noForecast());
    if (result.kind !== "ok") throw new Error(`${result.kind}: ${JSON.stringify(result)}`);
    expect(result.data.unreadable).toEqual([]);
    expect(result.data.runs).toHaveLength(1);
    expect(result.data.runs[0]?.forecast).toBeNull();
    expect(result.data.runs[0]?.header.issuerName).toBe("TransDigm Group");
    expect(result.data.runs[0]?.limitations.items).toHaveLength(6);
  });

  it("reads a forecast written as null the same way", () => {
    const result = readSlice(edited(FORECAST, null));
    if (result.kind !== "ok") throw new Error(result.kind);
    expect(result.data.unreadable).toEqual([]);
    expect(result.data.runs[0]?.forecast).toBeNull();
  });

  it("still reads the fixture's forecast as a page", () => {
    const result = readSlice(fixtureSlice());
    if (result.kind !== "ok") throw new Error(result.kind);
    expect(result.data.runs[0]?.forecast?.periods).toHaveLength(7);
  });

  it("leaves the data file's own object as it was when it reads an absent forecast", () => {
    const source = noForecast() as { runs: Record<string, unknown>[] };
    readSlice(source);
    expect(Object.hasOwn(source.runs[0] ?? {}, "forecast")).toBe(false);
  });

  it("still refuses a forecast that is neither null nor a forecast page, naming its path", () => {
    const reason = "runs[0].forecast: expected null or an object with tabs and periods";
    expect(readRuns(edited(FORECAST, {}))).toEqual({ kind: "invalid", reason });
    expect(readRuns(edited(FORECAST, "none"))).toEqual({ kind: "invalid", reason });
  });

  it("still refuses a forecast page that lacks one of its parts", () => {
    expect(readRuns(edited([...FORECAST, "walk"], undefined))).toEqual({
      kind: "invalid",
      reason: "runs[0].forecast.walk: missing",
    });
  });

  it("still refuses a one-case run whose forecast statement notes name two cases", () => {
    const source = noForecast() as { runs: { cases: unknown[] }[] };
    source.runs[0]?.cases.splice(1);
    expect(readRuns(source)).toEqual({
      kind: "invalid",
      reason: "runs[0].statements.columns[4].notes: expected 1 note, one per case",
    });
  });

  it("still refuses a run with no forecast whose other parts fail their rules", () => {
    const source = noForecast() as { runs: { front: Record<string, unknown> }[] };
    Reflect.deleteProperty(source.runs[0]?.front ?? {}, "headline");
    expect(readRuns(source)).toEqual({
      kind: "invalid",
      reason: "runs[0].front.headline: missing",
    });
  });
});
