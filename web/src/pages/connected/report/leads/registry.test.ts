import { expect, it } from "vitest";
import { leadFor } from "./index";

it("registers a lead for each Sources, Financials and Validation and decision module this package owns", () => {
  for (const code of [
    "CP-0",
    "CP-1",
    "CP-1B",
    "CP-1C",
    "CP-1D",
    "CP-MODEL",
    "CP-L10",
    "CP-5",
    "CP-6",
  ])
    expect(leadFor(code), code).toBeTypeOf("function");
});
