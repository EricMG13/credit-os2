import { describe, expect, it } from "vitest";
import { drawnAmount, drawnReason, EVIDENCE_AMOUNT, EVIDENCE_REASON } from "./drawnQualifications";

describe("drawnAmount keeps what follows a citation clause", () => {
  it.each([
    ["12.5 per p. 45 (unaudited)", "12.5 (unaudited)"],
    ["EUR 12.5m per Annual Report 2024.pdf; unaudited", "EUR 12.5m; unaudited"],
    ["12.5 see p. 4, restated", "12.5, restated"],
    ["250 see p. 45 and 300 see p. 60", "250 and 300"],
    ["250 (T2E.3.r03)", "250"],
    ["250 per Annual Report FY25.pdf", "250"],
    ["250 [E3]", "250"],
    ["250 (see p. 45)", "250"],
    ["1,250 (of which RCF 200; see p. 45)", "1,250 (of which RCF 200)"],
    ["approx. 500", "approx. 500"],
    ["- 250 (approx.)", "- 250 (approx.)"],
    ["1,250 (of which RCF 200)", "1,250 (of which RCF 200)"],
    ["250 per year", "250 per year"],
    ["250 from 2027 onwards", "250 from 2027 onwards"],
    ["5 pp over 3 years", "5 pp over 3 years"],
    ["(1,160) (see p. 4)", "(1,160)"],
    ["1,250 (of which RCF 200 [E3])", "1,250 (of which RCF 200)"],
    ["250 (of which T2E.3.r03 200)", "250 (of which 200)"],
    ["12.5 (T4.18; T4.19)", "12.5"],
  ])("%s -> %s", (input, expected) => {
    expect(drawnAmount(input)).toBe(expected);
  });

  it("returns null where the citation cannot be set aside safely", () => {
    expect(drawnAmount("per Annual Report 2024.pdf")).toBeNull();
    expect(EVIDENCE_AMOUNT).toBe("Amount recorded in model evidence.");
  });
});

describe("drawnReason", () => {
  it("judges the body, not the Basis line", () => {
    expect(drawnReason("Withheld by issuer.\nBasis: T2E.3.r03")).toBe("Withheld by issuer.");
  });
  it("treats a bracketed list of register ids as a citation", () => {
    expect(drawnReason("Not reported (T4.18; T4.19)")).toBe(EVIDENCE_REASON);
    expect(drawnReason("Not reported (T4.18, T4.19)")).toBe(EVIDENCE_REASON);
  });
});
