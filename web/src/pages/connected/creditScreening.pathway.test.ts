import { describe, expect, it } from "vitest";
import { moduleName, PATHWAYS, pathwayName, serviceText } from "./api";
import { PATHWAY_QUESTIONS } from "./start/pathways";

describe("the credit screening pathway", () => {
  it("is offered last, with its label, modules and question, and no module code in the question", () => {
    expect(Object.keys(PATHWAYS).at(-1)).toBe("credit_screening");
    expect(PATHWAYS.credit_screening).toEqual({
      label: "Credit screening",
      modules: ["CP-0", "CP-1", "CP-DR", "CP-L10"],
    });
    expect(pathwayName("credit_screening")).toBe("Credit screening");
    expect(Object.keys(PATHWAY_QUESTIONS).at(-1)).toBe("credit_screening");
    expect(PATHWAY_QUESTIONS.credit_screening).toBe(
      "Which financial, credit, liquidity, market and legal points matter most, and where is a full assessment needed?",
    );
    expect(PATHWAY_QUESTIONS.credit_screening).not.toMatch(/CP-/);
  });

  it("names CP-L10 'Credit screening' in a credit screening run and 'Short credit snapshot' elsewhere", () => {
    expect(moduleName("CP-L10", "credit_screening")).toBe("Credit screening");
    expect(moduleName("CP-L10")).toBe("Short credit snapshot");
    expect(moduleName("CP-L10", "short_snapshot")).toBe("Short credit snapshot");
    expect(moduleName("CP-L10", null)).toBe("Short credit snapshot");
    expect(moduleName("CP-1", "credit_screening")).toBe("Financial foundation");
    expect(moduleName("CP-NOPE", "credit_screening")).toBe("CP-NOPE");
    expect(serviceText("CP-L10 and CP-1 ran", "credit_screening")).toBe(
      "Credit screening and Financial foundation ran",
    );
    expect(serviceText("CP-L10 ran")).toBe("Short credit snapshot ran");
  });
});
