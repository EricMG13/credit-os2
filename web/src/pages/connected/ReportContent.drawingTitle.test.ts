import { describe, expect, it } from "vitest";
import { drawingTitle } from "./ReportContent";

// C4 (coordinator, third review): a dotted register code is stripped with the colon or dash right
// after it, spaced or not; a name that only starts with a letter and digits keeps them.
describe("drawingTitle", () => {
  it.each([
    ["T4.18 Debt stack", "Debt stack"],
    ["T4.18: Debt stack", "Debt stack"],
    ["T4.18—Debt stack", "Debt stack"],
    ["T4.18–Debt stack", "Debt stack"],
    ["T4.18-Debt stack", "Debt stack"],
    ["T4.18 - Debt stack", "Debt stack"],
    ["Chart data: T4.18: Debt stack", "Debt stack"],
    ["T1 - Register", "Register"],
    ["T2 Heathrow expansion", "T2 Heathrow expansion"],
    ["Q4 2025 results", "Q4 2025 results"],
  ])("draws %j as %j", (heading, title) => {
    expect(drawingTitle(heading)).toBe(title);
  });
});
