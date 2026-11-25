import { expect, it } from "vitest";
import { leadFor } from "./index";

it("returns no lead for a module that has none, including an inherited object key", () => {
  expect(leadFor("CP-UNKNOWN")).toBeUndefined();
  expect(leadFor("toString")).toBeUndefined();
});
