import { describe, expect, it } from "vitest";
import { refusalLines } from "./plain";

describe("the launcher's --modules refusal", () => {
  const error = "--modules CP-0 CP-L10: CP-L10 cannot run without CP-1";
  it("names CP-L10 by the run's pathway", () => {
    expect(refusalLines(error, "credit_screening")).toEqual([
      "The modules chosen (Source readiness, Credit screening): Credit screening cannot run without Financial foundation",
    ]);
  });
  it("keeps the default name with no pathway", () => {
    expect(refusalLines(error)[0]).toContain("Short credit snapshot");
  });
});
