import { describe, expect, it } from "vitest";
import { drawnAmount, drawnReason, EVIDENCE_AMOUNT, EVIDENCE_REASON } from "./drawnQualifications";

describe("drawnAmount keeps what follows a citation clause", () => {
  it.each([
    ["12.5 per p. 45 (unaudited)", "12.5 (unaudited)"],
    ["EUR 12.5m per Annual Report 2024.pdf; unaudited", "EUR 12.5m; unaudited"],
    ["12.5 see p. 4, restated", "12.5, restated"],
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

  it.each([
    ["—", "—"],
    ["-", "-"],
    ["250 - see p. 45", "250"],
    ["-250 per p. 4", "-250"],
    ["EUR 250m–300m per p. 4", "EUR 250m–300m"],
    ["12.5% per p. 4", "12.5%"],
    ["5.2 per cent from Annual Report 2024.pdf", "5.2 per cent"],
    ["500 from 2027 per Annual Report.pdf", "500 from 2027"],
    ["250 per share per Annual Report.pdf", "250 per share"],
    ["250 per pp. 12, 14", "250"],
    ["250 see pp. 12 and 14", "250"],
    ["250 (per p. 4, unaudited)", "250 (unaudited)"],
    ["250 (see p. 4; restated)", "250 (restated)"],
    ["250 (T4.18 and T4.19)", "250"],
    ["250 (E3; E4)", "250"],
    ["250 per [E3]", "250"],
    ["250 per E3", "250"],
    ["250 per Annual Report.pdf (unaudited)", "250 (unaudited)"],
  ])("round 2: %s -> %s", (input, expected) => {
    expect(drawnAmount(input)).toBe(expected);
  });

  it.each([
    "250 see p. 45 and 300 see p. 60",
    "250 per p. 4. Restated for IFRS 16.",
    "250 per p. 4 and later",
    "250 per Annual Report FY25.pdf and more",
    "250 (see p. 4 and 300)",
    "250 (see p. 4 (restated))",
    "250 see p. 4, 300",
  ])("round 2: %s is never drawn as a wrong or partial figure", (input) => {
    expect(drawnAmount(input)).toBeNull();
  });

  it("answers a long run of spaces quickly", () => {
    const started = performance.now();
    expect(drawnAmount(`250${" ".repeat(4000)}x`)).toBe(`250${" ".repeat(4000)}x`);
    expect(performance.now() - started).toBeLessThan(50);
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
    expect(drawnReason("Not disclosed (T4.18 and T4.19)")).toBe(EVIDENCE_REASON);
  });
});
