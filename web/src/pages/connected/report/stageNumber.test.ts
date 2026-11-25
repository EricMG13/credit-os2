import { expect, it } from "vitest";
import { stageLabel, stageOf } from "./stageNumber";

it("numbers each stage by its fixed place, whatever the run holds", () => {
  expect(stageOf("CP-0")).toEqual({ name: "Sources", number: 1, of: 5 });
  expect(stageOf("CP-2G")).toEqual({ name: "Credit", number: 3, of: 5 });
  expect(stageOf("CP-6")).toEqual({ name: "Validation and decision", number: 5, of: 5 });
  expect(stageOf("CP-X")).toEqual({ name: "Other", number: 0, of: 5 });
  expect(stageLabel("Structure and market")).toBe("04");
  expect(stageLabel("Other")).toBe("");
});
