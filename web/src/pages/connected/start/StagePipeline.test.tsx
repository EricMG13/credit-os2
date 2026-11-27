import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { moduleReadiness } from "./moduleReadiness";
import { StagePipeline } from "./StagePipeline";

afterEach(cleanup);

const draw = (readiness: ReturnType<typeof moduleReadiness>) => {
  render(<StagePipeline readiness={readiness} label="Stages" />);
  return screen.getByRole("list", { name: "Stages" });
};

const checked = () =>
  moduleReadiness([], {
    modules: ["CP-0", "CP-1", "CP-4", "CP-6"],
    items: [
      { id: "CP-1:report", scope: "CP-1", outcome: "gap", reason: "x" },
      { id: "CP-4:agreement", scope: "CP-4", outcome: "will_refuse", reason: "y" },
    ],
  });

// report/stages.ts: CP-0 is in Sources, CP-1 in Financials, CP-4 in Structure and market, CP-6 in
// Validation and decision.
const stage = (stages: HTMLElement, name: string) =>
  within(stages).getByText(name).closest("li") as HTMLElement;

describe("stage counts", () => {
  it("after a review gives each stage its modules counted by mark, in the page's words", () => {
    const stages = draw(checked());
    const words = (name: string) =>
      Array.from(stage(stages, name).querySelectorAll(":scope > span .sr-only")).map(
        (el) => el.textContent,
      );
    expect(words("Sources")).toEqual(["1 no limit in this review"]);
    expect(words("Financials")).toEqual(["1 gap"]);
    expect(words("Structure and market")).toEqual(["1 will refuse"]);
    expect(words("Validation and decision")).toEqual(["1 no limit in this review"]);
    expect(stages.textContent).not.toMatch(/Ready|Conditional|Blocked|Not assessable/);
  });

  it("draws no count line before a review", () => {
    const stages = draw(moduleReadiness(["CP-0", "CP-1"]));
    expect(stages.querySelectorAll(".sr-only")).toHaveLength(0);
  });
});
