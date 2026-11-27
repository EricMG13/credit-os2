import { expect, it } from "vitest";
import { categoryAt } from "./category";

it("takes category slots 1, 3, 4, 5, 6, then 8, and never 2 or 7", () => {
  expect([0, 1, 2, 3, 4, 5, 6].map(categoryAt)).toEqual([
    "var(--color-category-1)",
    "var(--color-category-3)",
    "var(--color-category-4)",
    "var(--color-category-5)",
    "var(--color-category-6)",
    "var(--color-category-8)",
    "var(--color-category-8)",
  ]);
});
