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

describe("evidence ids in any written shape move to the basis", () => {
  it.each([
    "[E3 and E4]",
    "[S1, S2, and S3]",
    "[E3.2]",
    "[E3a]",
    "[E3/E4]",
    "[see E3]",
    "[E1234]",
    "[D14]",
    "[R9]",
    "[T4.4a]",
    "[S02]",
    "[E3]",
    "[S12; G4]",
    "[C07; T4.4]",
    "[T2E.3.r03]",
    "[T4.18]",
    "[K3]",
  ])("%s", (marker) => {
    expect(readParagraph(`Debt is stable ${marker}.`)).toEqual({
      body: "Debt is stable.",
      basis: marker,
    });
  });

  it.each([
    "[FY26E]",
    "[FY25A]",
    "[FY24A]",
    "[CY24]",
    "[FQ3]",
    "[Q3E]",
    "[T12M]",
    "[P99.9]",
    "[CET1]",
    "[AT1]",
  ])("keeps the period or capital token %s in the body", (marker) => {
    expect(readParagraph(`Leverage will fall ${marker}.`)).toEqual({
      body: `Leverage will fall ${marker}.`,
      basis: null,
    });
  });

  it.each(["[Q3 2025 vs Q3 2024]", "[H1]", "[H2 2025]", "[FY2024]", "[Q4]", "[P50]", "[S1 2025]"])(
    "keeps %s in the body",
    (marker) => {
      expect(readParagraph(`Revenue rose 5% ${marker}.`)).toEqual({
        body: `Revenue rose 5% ${marker}.`,
        basis: null,
      });
    },
  );

  it.each(["Covenant definition at P12.", "see P12", "Defined on P12 of the filing", "P: 12"])(
    "an explicit cue makes %s a page reference",
    (text) => {
      expect(containsReference(text)).toBe(true);
    },
  );
});

it("leaves a see-cited register id in the sentence for the reason reader to reject", () => {
  expect(readParagraph("Cover is thin [see T2DS.6].")).toEqual({
    body: "Cover is thin [see T2DS.6].",
    basis: null,
  });
});
