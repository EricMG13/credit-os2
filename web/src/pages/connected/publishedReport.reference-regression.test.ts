import { expect, it } from "vitest";
import { containsReference, displayColumns, readParagraph } from "./publishedReport";
import { chartTable } from "./visuals/visualData";

// Independent reader examples: these are quantities, ratings, years or group labels, not locators.
const ordinary = [
  "Coverage fell 2 pp. 3 quarters in a row, so no trend is drawn.",
  "Margin rose 150bp, 1.5 pp. 2 years running; leverage of 3.2x at FY2025 is the only point.",
  "Coverage fell 2 p.p. 3 quarters in a row; two pp. 3 quarters before that.",
  "Rated by S&P. 2025 outlook stable; cut by S&P. 3 notches since.",
  "The front page 2025 headline and the one-page 2026 outlook give no series.",
  "Coverage rose 0.5 pp. 12 months after the refinancing.",
  "Coverage rose three pp. 4 quarters running.",
  "The one-page 12 month outlook remains stable.",
  "Group of Seven (G7) demand is weak.",
  "The G20 economies (G20) slowed.",
  "Let leverage (G1) equal 3.2x and cover (G2) equal 4.1x.",
  "A gap remains. Group of Seven (G7) demand is weak.",
];

const references = [
  "Threshold missing (G12)",
  "Lease detail not disclosed (G12).",
  "See (G3) and (G31)",
  "Gap (G12) remains open.",
  "Missing threshold at leverage 3.20x (G12).",
  "Lease detail not disclosed (including finance leases) (G12).",
  "(G12)",
  "∅ G12 n.m.",
  "See ∅ [G31].",
  "CP-2A-GAP-12 remains open.",
  "Basis as run 20261117-094923-01.",
  "See p.12 for the covenant.",
  "See pp. 12–14 for the covenant.",
  "See page 12 for the covenant.",
  "Q page:47 from the annual report.",
  "A page: 172 sets the threshold.",
  "See pages 12 to 14 for the covenant.",
  "The accounts at 31 December 2025 p. 12 contain the covenant.",
  "The annual report 2025 page 83 contains the covenant.",
  "See p 12 for the covenant.",
  "See pp 12 for the covenant.",
  "See pg. 12 for the covenant.",
  "The covenant appears only in the summary (p12).",
  "Page 7 of the Filing gives the trigger text.",
  "See annual-report.pdf for the covenant.",
  "See CP-4.md for the covenant.",
  "The source hash is abcdef0123456789abcdef0123456789.",
  "Coverage fell 2 pp. 3 quarters running; see p. 12.",
  "Group of Seven (G7) demand is weak; threshold missing (G12).",
];

it.each(ordinary)("keeps ordinary reader text out of the reference gate: %s", (text) => {
  expect(containsReference(text)).toBe(false);
});

it.each(references)("keeps an authentic reference behind the reference gate: %s", (text) => {
  expect(containsReference(text)).toBe(true);
});

function basisTable(basis: string) {
  return {
    line: 20,
    headers: ["Period", "Coverage", "Basis and limitation", "Source"],
    rows: [["FY2025", "3.20", basis, "annual-report.pdf"]],
    evidenceInDrawer: true,
  };
}

it.each(ordinary)("retains the actual chart Basis and limitation cell: %s", (basis) => {
  const table = basisTable(basis);
  expect(chartTable(table).rows[0]?.cells).toEqual(["3.20", basis]);
  expect(chartTable({ ...table, evidenceInDrawer: false }).rows[0]?.cells).toEqual([
    "3.20",
    basis,
    "annual-report.pdf",
  ]);
});

it.each(references)("holds only the referencing Basis cell in Evidence: %s", (basis) => {
  const table = basisTable(basis);
  expect(chartTable(table).rows[0]?.cells).toEqual(["3.20", "Qualification recorded in Evidence."]);
  expect(chartTable({ ...table, evidenceInDrawer: false }).rows[0]?.cells).toContain(basis);
});

it("separates a real Basis line without dropping the ordinary reader sentence", () => {
  expect(
    readParagraph(
      "Coverage fell 2 pp. 3 quarters in a row.\nBasis: annual-report.pdf, pages 12–14.",
    ),
  ).toEqual({
    body: "Coverage fell 2 pp. 3 quarters in a row.",
    basis: "annual-report.pdf, pages 12–14.",
  });
});

it("keeps ordinary values in an ambiguous Code column and excludes real citations", () => {
  expect(displayColumns(["Code"], false, [{ line: 1, cells: ["S&P. 3 notches lower."] }])).toEqual([
    0,
  ]);
  expect(displayColumns(["Code"], false, [{ line: 1, cells: ["See p. 12."] }])).toEqual([]);
});

it.each(["net debt /EBITDA", "Leverage (/share) is flat.", "cash and /or debt", "ratio / EBITDA"])(
  "does not read a slash after a space as a path: %s",
  (text) => {
    expect(containsReference(text)).toBe(false);
  },
);

it.each([
  "See /Users/x/report for detail.",
  "Output in ./out/a",
  "Output in ../out/a",
  "Output in ~/a",
  "Saved to C:\\a",
  "Saved to \\\\server\\share",
  "Read https://x",
  "Read www.example.com",
])("still reads an address as a reference: %s", (text) => {
  expect(containsReference(text)).toBe(true);
});

it.each([
  "Copied to s3://bucket/run",
  "Copied to gs://b/a",
  "Fetched from sftp://h/d",
  "Fetched from smb://s/x",
  "Read git+ssh://host/repo",
  "Read S3://Bucket/Run",
])("reads an address with any URI scheme as a reference: %s", (text) => {
  expect(containsReference(text)).toBe(true);
});

it.each(["Leverage rose to 3:1 by year end.", "Ratio 2:1 // compared with prior"])(
  "does not read a ratio or a bare double slash as an address: %s",
  (text) => {
    expect(containsReference(text)).toBe(false);
  },
);

it.each([
  "Saved to //server/share/file",
  "Saved to (//a/b)",
  "Saved to C:/Users/x",
  "Saved to C:/x",
  "Read file:/x",
  "Read onedrive:/x",
])(
  "reads a forward-slash share, drive or single-slash scheme address as a reference: %s",
  (text) => {
    expect(containsReference(text)).toBe(true);
  },
);

it.each([
  "Leverage is 3:1 at year end.",
  "Ratio 2.5x:1",
  "The call is at 10:30 on Tuesday.",
  "Total: //",
  "See note: /a",
  "Either // or neither",
  "S&P: B/Stable",
  "Moody's: B2 / S&P: B",
  "USD/JPY: /spot/ 150",
  "EBITDA/interest: /cash/ 3.2x",
  "debt/EBITDA of 4.5x/3.2x",
  "on 12/31/2025",
  "net debt /EBITDA",
  "(/share)",
])("does not read a ratio, a time or a spaced slash as an address: %s", (text) => {
  expect(containsReference(text)).toBe(false);
});
