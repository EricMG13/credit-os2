import { describe, expect, it } from "vitest";
import { containsReference, readParagraph } from "./publishedReport";

describe("a bracketed period is read, a locator is a basis", () => {
  it("keeps period and scenario brackets in the body", () => {
    expect(readParagraph("Revenue rose 5% [Q3 2025 vs Q3 2024].")).toEqual({
      body: "Revenue rose 5% [Q3 2025 vs Q3 2024].",
      basis: null,
    });
    expect(readParagraph("Margin fell to 12%. [H1]")).toEqual({
      body: "Margin fell to 12%. [H1]",
      basis: null,
    });
    expect(readParagraph("Cover was 2.1x [FY24] and 1.9x [T4].")).toEqual({
      body: "Cover was 2.1x [FY24] and 1.9x [T4].",
      basis: null,
    });
  });

  it("moves evidence markers and register ids to the basis", () => {
    expect(readParagraph("Debt is stable [E3].")).toEqual({
      body: "Debt is stable.",
      basis: "[E3]",
    });
    expect(readParagraph("Debt is stable [S12; G4].")).toEqual({
      body: "Debt is stable.",
      basis: "[S12; G4]",
    });
    expect(readParagraph("Debt is stable [C07; T4.4].")).toEqual({
      body: "Debt is stable.",
      basis: "[C07; T4.4]",
    });
    expect(readParagraph("Debt is stable [T2E.3.r03].")).toEqual({
      body: "Debt is stable.",
      basis: "[T2E.3.r03]",
    });
    expect(readParagraph("Debt is stable [p. 4] [CP-1].")).toEqual({
      body: "Debt is stable.",
      basis: "[p. 4] [CP-1]",
    });
  });
});

describe("a bare letter and digits is not a page locator", () => {
  it.each(["P50 production covers debt service 1.4x", "P90", "P2", "PP5"])("%s", (text) => {
    expect(containsReference(text)).toBe(false);
  });
  it.each(["See p. 4", "p 4", "p: 4", "pp. 12", "page 4", "pg 4", "Revenue (p.4)"])(
    "%s",
    (text) => {
      expect(containsReference(text)).toBe(true);
    },
  );
});
