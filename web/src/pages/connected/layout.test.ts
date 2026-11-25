import { expect, it } from "vitest";
import { field } from "./layout";

// WCAG 1.4.11: an input's edge is what shows where it is, so it takes the control edge (3:1 or
// better on the card), never the hairline that only divides content.
it("draws a field's edge with the control token on the radius scale", () => {
  const classes = field.split(" ");
  expect(classes).toContain("border-border-control");
  expect(classes).not.toContain("border-border-hairline");
  expect(classes).toContain("rounded-ds-sm");
});
