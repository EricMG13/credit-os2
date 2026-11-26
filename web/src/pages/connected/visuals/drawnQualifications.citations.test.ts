import { describe, expect, it } from "vitest";
import { drawnAmount, drawnReason, EVIDENCE_AMOUNT, EVIDENCE_REASON } from "./drawnQualifications";

describe("drawnAmount draws a bracketed citation set aside and keeps the rest", () => {
  it.each([
    ["12.5 per p. 45 (unaudited)", null],
    ["EUR 12.5m per Annual Report 2024.pdf; unaudited", null],
    ["12.5 see p. 4, restated", null],
    ["250 (T2E.3.r03)", "250"],
    ["250 per Annual Report FY25.pdf", null],
    ["250 [E3]", "250"],
    ["250 (see p. 45)", "250"],
    ["1,250 (of which RCF 200; see p. 45)", null],
    ["approx. 500", "approx. 500"],
    ["- 250 (approx.)", "- 250 (approx.)"],
    ["1,250 (of which RCF 200)", "1,250 (of which RCF 200)"],
    ["250 per year", "250 per year"],
    ["250 from 2027 onwards", "250 from 2027 onwards"],
    ["5 pp over 3 years", "5 pp over 3 years"],
    ["(1,160) (see p. 4)", "(1,160)"],
    ["1,250 (of which RCF 200 [E3])", "1,250 (of which RCF 200)"],
    ["250 (of which T2E.3.r03 200)", null],
    ["12.5 (T4.18; T4.19)", "12.5"],
  ])("%s -> %s", (input, expected) => {
    expect(drawnAmount(input)).toBe(expected);
  });

  it.each([
    ["—", "—"],
    ["-", "-"],
    ["250 - see p. 45", null],
    ["-250 per p. 4", null],
    ["EUR 250m–300m per p. 4", null],
    ["12.5% per p. 4", null],
    ["5.2 per cent from Annual Report 2024.pdf", null],
    ["500 from 2027 per Annual Report.pdf", null],
    ["250 per share per Annual Report.pdf", null],
    ["250 per pp. 12, 14", null],
    ["250 see pp. 12 and 14", null],
    ["250 (per p. 4, unaudited)", null],
    ["250 (see p. 4; restated)", null],
    ["250 (T4.18 and T4.19)", "250"],
    ["250 (E3; E4)", "250"],
    ["250 per [E3]", null],
    ["250 per E3", null],
    ["250 per Annual Report.pdf (unaudited)", null],
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

  it.each([
    ["spaces", `250${" ".repeat(20000)}x`],
    ["per", "per ".repeat(5000)],
    ["T1.", "T1.".repeat(6667)],
    ["a.", "a.".repeat(10000)],
    ["a-", "a-".repeat(10000)],
    ["[", "[".repeat(20000)],
    ["【", "【".repeat(20000)],
    ["(p. 4)", "250 (p. 4)".repeat(2000)],
    ["CP-", "CP-".repeat(6667)],
  ])("answers pathological input %s with null in linear time", (_name, input) => {
    const started = performance.now();
    expect(drawnAmount(input)).toBeNull();
    expect(performance.now() - started).toBeLessThan(50);
  });

  it("returns null where the citation cannot be set aside safely", () => {
    expect(drawnAmount("per Annual Report 2024.pdf")).toBeNull();
    expect(EVIDENCE_AMOUNT).toBe("Amount recorded in model evidence.");
  });
});

describe("drawnAmount draws text exactly or not at all", () => {
  it.each([
    ["Net debt EUR 300m (from 1,250m)", "Net debt EUR 300m (from 1,250m)"],
    ["250 (per 1,000 shares)", "250 (per 1,000 shares)"],
    ["250 (from FY26)", "250 (from FY26)"],
    ["250 (from 2027)", "250 (from 2027)"],
    ["250 (pp. 12, 14)", "250"],
    ["250 (unaudited) [E3]", "250 (unaudited)"],
  ])("%s -> %s", (input, expected) => {
    expect(drawnAmount(input)).toBe(expected);
  });

  it.each([
    "250 (see p. 4, 5)",
    "see p. 4",
    "Source: Annual Report p. 4",
    "250 on p. 4",
    "250 T4.18",
    "250 E3",
    "2(T4.18)50",
    "250(p. 4).5",
    "250 (p. 4) 300",
    "250 (p. 4) unaudited",
    "250 (CP-2A estimate)",
    "250 [S3]",
    "250 (see Note 12)",
    "250 (see 【4†source】)",
    "250 (from p. 4)",
    "T1.5 billion",
  ])("%s is not drawn", (input) => {
    expect(drawnAmount(input)).toBeNull();
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
