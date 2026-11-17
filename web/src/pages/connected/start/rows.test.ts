import { expect, it } from "vitest";
import { FIGURES, ROW_SPECS } from "./rows";

// docs/rulings/2026-11-16-reporting-currency-from-sources.md
it("words the money-figure hint for the currency the statements are printed in", () => {
  expect(FIGURES).toBe("Millions of the currency the issuer's statements are printed in");
});

it("does not warn that a facility in another currency is not calculable", () => {
  const hint = ROW_SPECS.deal_terms.fields.find(({ key }) => key === "currency")?.hint;
  expect(hint).toBe("Three uppercase letters.");
  const hints = Object.values(ROW_SPECS).flatMap(({ fields }) => fields.map((f) => f.hint ?? ""));
  expect(hints.join(" ")).not.toMatch(/not calculable|FX conversion|reporting currency/i);
});
