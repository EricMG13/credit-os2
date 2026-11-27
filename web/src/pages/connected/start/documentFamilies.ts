/** The slots of the category palette a document family may use: 1, 2 and 7 are left to status and chrome (C6). */
type Slot = 3 | 4 | 5 | 6 | 8;

const FAMILIES: readonly { name: string; slot: Slot; kinds: readonly string[] }[] = [
  {
    name: "Financial reporting",
    slot: 3,
    kinds: ["financial_report", "earnings_release", "management_bridge"],
  },
  {
    name: "Legal and covenants",
    slot: 4,
    kinds: [
      "credit_agreement",
      "indenture",
      "amendment",
      "intercreditor",
      "compliance_certificate",
      "covenant_review",
    ],
  },
  {
    name: "Offering and lending",
    slot: 5,
    kinds: [
      "offering_memorandum",
      "prospectus",
      "lender_presentation",
      "information_memorandum",
      "term_sheet",
      "commitment_letter",
    ],
  },
  { name: "Market data", slot: 6, kinds: ["ratings", "market_quotes", "peer_data"] },
];

const OTHER = { name: "Other", slot: 8 } as const;

/** The family of a service document kind, in the table's order; `unrecognised` has none (it stays a gap). */
export function documentFamily(kind: string): { name: string; slot: Slot } | null {
  if (kind === "unrecognised") return null;
  const found = FAMILIES.find((family) => family.kinds.includes(kind));
  return found ? { name: found.name, slot: found.slot } : OTHER;
}

/** The families in the table's order, for sorting a legend. */
export const FAMILY_ORDER: readonly string[] = [
  ...FAMILIES.map((family) => family.name),
  OTHER.name,
];
