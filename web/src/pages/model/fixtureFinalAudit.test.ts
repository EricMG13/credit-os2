import { readFileSync } from "node:fs";
import path from "node:path";

type Model = {
  statements: {
    bridges: {
      note: string;
      rows: { label: string }[];
      caseSteps: { label: string; value: number }[][];
    }[];
    intro: string;
  };
  front: {
    headline: { metrics: { label: string; value: { text?: string } }[] };
    covers: { facts: { label: string; value: string }[] };
  };
  forecast: { walk: { subtitle: string }; ebitda: { subtitle: string } };
};
const fixture = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../fixtures/model.json"), "utf8"),
) as { slice: { runs: Model[] } };

describe("final audit model fixture labels", () => {
  it("names negative free-cash-flow steps as effects on net debt (S5-009)", () => {
    const bridge = fixture.slice.runs[0]?.statements.bridges[1];
    if (bridge === undefined) throw new Error("no net debt bridge");
    expect(bridge.rows[1]?.label).toBe("Effect of free cash flow on net debt, FY26");
    expect(bridge.rows[2]?.label).toBe("Effect of free cash flow on net debt, FY27");
    for (const steps of bridge.caseSteps) {
      expect(steps[1]?.label).toBe("Effect of free cash flow on net debt, FY26");
      expect(steps[2]?.label).toBe("Effect of free cash flow on net debt, FY27");
    }
    expect(bridge.note).toContain("Free cash flow reduces net debt");
  });

  it("uses US$m for dollar amounts in millions on tiles and chart/table units (S5-018)", () => {
    const run = fixture.slice.runs[0];
    if (run === undefined) throw new Error("no run");
    expect(run.front.headline.metrics.find((m) => m.label === "Revenue")?.value.text).toBe(
      "US$m 8,580",
    );
    expect(
      run.front.headline.metrics.find((m) => m.label === "EBITDA as defined")?.value.text,
    ).toBe("US$m 4,560");
    expect(run.front.covers.facts.find((f) => f.label === "Currency and units")?.value).toBe(
      "US$m",
    );
    expect(run.statements.intro).toBe(
      "US$m unless a unit is shown. Fiscal years end 30 September.",
    );
    expect(run.forecast.walk.subtitle).toBe("FY26, US$m");
    expect(run.forecast.ebitda.subtitle).toBe("EBITDA as defined, US$m");
  });
});
