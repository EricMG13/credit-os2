// Fix round 1 (C6): the run start page names CP-L10 "Credit screening" wherever it knows the pathway.
import { describe, expect, it } from "vitest";
import type { Context } from "../api";
import { moduleNames, scopeText } from "./limitWords";
import { moduleReadiness } from "./moduleReadiness";
import { contextDetails } from "./reviewInputs";

const SHORT = "Short credit snapshot";

describe("start page names for credit screening", () => {
  it("scopeText and moduleNames take the pathway, and default as before", () => {
    expect(scopeText("CP-L10", "credit_screening")).toBe("Credit screening");
    expect(scopeText("CP-L10")).toBe(SHORT);
    expect(scopeText("run", "credit_screening")).toBe("Whole run");
    expect(moduleNames([{ scope: "CP-L10" }, { scope: "CP-1" }], "credit_screening")).toEqual([
      "Credit screening",
      "Financial foundation",
    ]);
  });

  it("the readiness rail names the module for the pathway", () => {
    const rail = moduleReadiness(
      ["CP-0", "CP-1", "CP-DR", "CP-L10"],
      undefined,
      "credit_screening",
    );
    const names = rail.groups.flatMap((group) => group.rows.map((row) => row.name));
    expect(names).toContain("Credit screening");
    expect(names).not.toContain(SHORT);
  });

  it("the review sheet's research question reads its focus module by the pathway's name", () => {
    const context = {
      run: { run_type: "primary", pathway: "credit_screening" },
      research_questions: [{ text: "Is the margin falling?", focus_module: "CP-L10" }],
    } as unknown as Context;
    const flat = JSON.stringify(contextDetails(context));
    expect(flat).toContain("Credit screening");
    expect(flat).not.toContain(SHORT);
  });
});
