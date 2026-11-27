import { describe, expect, it } from "vitest";
import { documentFamily } from "./documentFamilies";

const KEY: readonly [string, string, 3 | 4 | 5 | 6 | 8][] = [
  ["financial_report", "Financial reporting", 3],
  ["earnings_release", "Financial reporting", 3],
  ["management_bridge", "Financial reporting", 3],
  ["credit_agreement", "Legal and covenants", 4],
  ["indenture", "Legal and covenants", 4],
  ["amendment", "Legal and covenants", 4],
  ["intercreditor", "Legal and covenants", 4],
  ["compliance_certificate", "Legal and covenants", 4],
  ["covenant_review", "Legal and covenants", 4],
  ["offering_memorandum", "Offering and lending", 5],
  ["prospectus", "Offering and lending", 5],
  ["lender_presentation", "Offering and lending", 5],
  ["information_memorandum", "Offering and lending", 5],
  ["term_sheet", "Offering and lending", 5],
  ["commitment_letter", "Offering and lending", 5],
  ["ratings", "Market data", 6],
  ["market_quotes", "Market data", 6],
  ["peer_data", "Market data", 6],
  ["portfolio", "Other", 8],
  ["prior_decision", "Other", 8],
  ["a_kind_not_listed", "Other", 8],
];

describe("documentFamily", () => {
  it.each(KEY)("%s is %s, slot %i", (kind, name, slot) => {
    expect(documentFamily(kind)).toEqual({ name, slot });
  });
  it("gives an unrecognised file no family", () => {
    expect(documentFamily("unrecognised")).toBeNull();
  });
});
