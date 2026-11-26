import { describe, expect, it } from "vitest";
import {
  isIssuerAssessment,
  issuerGroups,
  issuerPassageBody,
  leadIdentity,
  relatedIssuerReports,
  selectIssuerEntry,
} from "./issuerEntry";
import type { CatalogueRun, LibraryIndex, LibraryRun } from "./publishedReport";

const SHA = "a".repeat(64);
function caseRun(folder: string, date: string, fields: Partial<LibraryRun> = {}) {
  const catalogue: CatalogueRun = {
    id: folder,
    name: "Acme Credit",
    issuer: "Acme",
    title: "Full credit assessment",
    date,
    sector: "Industrials",
    period: "FY25",
    metrics: {},
  };
  const run: LibraryRun = {
    folder,
    issuerKey: "acme",
    pathway: "credit_snapshot",
    publicationVerified: true,
    assessmentScope: "standard",
    publishedAt: null,
    lead: {
      module: "CP-2",
      output: folder + "/credit",
      sha256: SHA,
      line: 24,
      text: "Debt service remains supported.",
    },
    ...fields,
  };
  return { catalogue, run };
}

describe("issuer entry", () => {
  it("retains the lead's confidence and conditions while removing the Evidence-only routing clause", () => {
    expect(
      issuerPassageBody(
        "Confidence is Medium; the specific evidence restrictions are recorded in the gaps ledger. Cash is limited to the parent.\nBasis: filing.pdf",
      ),
    ).toBe("Confidence is Medium. Cash is limited to the parent.");
  });

  it("keeps a market paragraph with a potential action out of the issuer lead", () => {
    const { run } = caseRun("market", "2026-01-01", {
      pathway: "relative_value",
      lead: {
        module: "CP-3D",
        output: "market/market-view",
        sha256: SHA,
        line: 24,
        text: "The 2029 note is our preferred instrument at 98.",
      },
    });
    expect(leadIdentity(run)).toBeUndefined();
  });

  it("prefers the newest standard Full or Deep and preserves an explicit specialist selection", () => {
    const full = caseRun("full", "2026-01-01");
    const deep = caseRun("deep", "2026-02-01", { pathway: "deep_credit_assessment" });
    const purpose = caseRun("earnings", "2026-04-01", { pathway: "earnings_update" });
    const partial = caseRun("partial", "2026-03-01", { assessmentScope: "partial" });
    const entries = [purpose, partial, deep, full];
    expect(selectIssuerEntry(entries, false)).toBe(deep);
    expect(selectIssuerEntry([purpose], true)).toBe(purpose);
    expect(
      relatedIssuerReports(entries, deep).map(({ catalogue, timing }) => [catalogue.id, timing]),
    ).toEqual([
      ["earnings", "Newer report"],
      ["partial", "Newer report"],
    ]);
  });

  it("prefers a verified standard Lite to a partial Full, then falls back to the latest admitted report", () => {
    const legacy = caseRun("legacy", "2026-04-01", { publicationVerified: undefined });
    const partial = caseRun("partial", "2026-03-01", { assessmentScope: "partial" });
    const lite = caseRun("lite", "2026-01-01", { pathway: "lite_credit_assessment" });
    const missing = caseRun("unknown", "2026-05-01", { lead: null });
    expect(selectIssuerEntry([legacy, lite, partial, missing], false)).toBe(lite);
    expect(selectIssuerEntry([legacy, partial, missing], false)).toBe(missing);
  });

  it("opens a credit screening when it is the only report, and never counts it as an issuer assessment", () => {
    const screen = caseRun("screen", "2026-05-01", {
      pathway: "credit_screening",
      lead: {
        module: "CP-L10",
        output: "screen/credit-screening",
        sha256: SHA,
        line: 24,
        text: "Liquidity is adequate; earnings and refinancing need a full assessment.",
      },
    });
    expect(isIssuerAssessment(screen.run)).toBe(false);
    expect(selectIssuerEntry([screen], false)).toBe(screen);
    expect(selectIssuerEntry([screen], true)).toBe(screen);
  });

  it("prefers a Full, then a Lite assessment to a newer credit screening", () => {
    const screen = caseRun("screen", "2026-05-01", { pathway: "credit_screening" });
    const lite = caseRun("lite", "2026-01-01", { pathway: "lite_credit_assessment" });
    const full = caseRun("full", "2026-02-01");
    expect(selectIssuerEntry([screen, lite], false)).toBe(lite);
    expect(selectIssuerEntry([screen, lite, full], false)).toBe(full);
    expect(selectIssuerEntry([screen, lite], true)).toBe(screen);
  });

  it("puts unknown analysis dates after valid dates and applies one tie rule to the whole date", () => {
    const invalid = caseRun("impossible", "2026-02-30");
    const first = caseRun("a-first-folder", "2026-02-20", {
      publishedAt: "2026-03-31T00:00:00.000001+00:00",
    });
    const latest = caseRun("b-latest", "2026-02-20", {
      publishedAt: "2026-03-31T00:00:00.000002Z",
    });
    const unknownTime = caseRun("c-unknown-time", "2026-02-20");
    expect(selectIssuerEntry([invalid, first, latest], false)).toBe(latest);
    expect(selectIssuerEntry([latest, unknownTime, invalid, first], false)).toBe(first);
    const related = relatedIssuerReports([first, invalid, latest, unknownTime], first);
    expect(related.map(({ catalogue, timing }) => [catalogue.id, timing])).toEqual([
      ["b-latest", "Newer report"],
      ["c-unknown-time", "Same as-of date"],
    ]);
  });

  it("groups only by canonical issuer and refuses ambiguous folder records", () => {
    const first = caseRun("first", "2026-01-01");
    const second = caseRun("second", "2026-01-02", { issuerKey: "different-issuer" });
    const unkeyed = caseRun("unkeyed", "2026-01-03", { issuerKey: null });
    const duplicate = caseRun("duplicate", "2026-01-04");
    const index: LibraryIndex = {
      catalogue: { real: [first, second, unkeyed, duplicate].map(({ catalogue }) => catalogue) },
      workspace: {
        runs: {
          a: first.run,
          b: second.run,
          c: unkeyed.run,
          d: duplicate.run,
          e: { ...duplicate.run },
        },
      },
    };
    expect(
      [...issuerGroups(index).values()].map((group) =>
        group.map(({ catalogue, run }) => [catalogue.id, run?.folder]),
      ),
    ).toEqual([
      [["first", "first"]],
      [["second", "second"]],
      [["unkeyed", "unkeyed"]],
      [["duplicate", undefined]],
    ]);
  });
});
