import { expect, it } from "vitest";
import { chartTable, type SourceTable } from "./visualData";

const headers = [
  "Period",
  "Total debt / EBITDA",
  "Net debt / EBITDA",
  "Reporting unit",
  "Basis and limitation",
  "Source",
];
const rows = [
  ["FY2023", "3.75", "3.00", "x", "Gross debt includes finance leases.", "annual.txt"],
  ["FY2024", "2.80", "2.25", "x", "", "annual.txt"],
];
const table: SourceTable = { line: 20, headers, rows, evidenceInDrawer: true };

it("keeps the Basis and limitation column beside the figures when the sources are in the drawer", () => {
  const { head, rows: shown } = chartTable(table);
  expect(head).toEqual([
    "Period",
    "Total debt / EBITDA",
    "Net debt / EBITDA",
    "Reporting unit",
    "Basis and limitation",
  ]);
  expect(shown.map((row) => row.cells.at(-1))).toEqual([
    "Gross debt includes finance leases.",
    null,
  ]);
});

it("keeps the Basis and limitation column when the caller names its columns", () => {
  const { head, rows: shown } = chartTable(table, [0, 1, 4]);
  expect(head).toEqual(["Period", "Total debt / EBITDA", "Basis and limitation"]);
  expect(shown[0]?.cells).toEqual(["3.75", "Gross debt includes finance leases."]);
});

it.each(["Gross debt per annual.txt p.12"])(
  "keeps a limitation that names %s out of the table form while the sources are in the drawer",
  (limitation) => {
    const named: SourceTable = {
      ...table,
      rows: [["FY2023", "3.75", "3.00", "x", limitation, "annual.txt"]],
    };
    expect(chartTable(named).rows[0]?.cells.at(-1)).toBe("Qualification recorded in Evidence.");
    expect(chartTable({ ...named, evidenceInDrawer: false }).rows[0]?.cells).toContain(limitation);
  },
);

it.each([
  "Lease detail not disclosed (G12).",
  "Basis as run 20261117-094923-01.",
  "See (G3) and (G31)",
])(
  "keeps a limitation that names a gap id or run code, %s, out of the table form",
  (limitation) => {
    const named: SourceTable = {
      ...table,
      rows: [["FY2023", "3.75", "3.00", "x", limitation, "annual.txt"]],
    };
    expect(chartTable(named).rows[0]?.cells.at(-1)).toBe("Qualification recorded in Evidence.");
    expect(chartTable({ ...named, evidenceInDrawer: false }).rows[0]?.cells).toContain(limitation);
  },
);

it.each([
  "Gross debt at 2024 year end includes finance leases.",
  "Covenant headroom of 12.5x on a net basis.",
  "Run-rate EBITDA, cash-flow-based, pre-IFRS 16.",
  "Rated A (stable) at 31 December 2024; 20241231 balance.",
  "Tier-2 capital, 2026-12-31 maturity, USD 1,250 million.",
  "Group G7 comparison, 12-34-56 reference-free.",
])("keeps ordinary text beside the figures: %s", (limitation) => {
  const plain: SourceTable = {
    ...table,
    rows: [["FY2023", "3.75", "3.00", "x", limitation, "annual.txt"]],
  };
  expect(chartTable(plain).rows[0]?.cells.at(-1)).toBe(limitation);
});

it("still leaves the Source and Evidence columns to the drawer", () => {
  const { head } = chartTable({ ...table, headers: [...headers.slice(0, 5), "Evidence"] });
  expect(head).not.toContain("Evidence");
  expect(head).not.toContain("Source");
});

it("shows every column when the sources are not in the drawer", () => {
  expect(chartTable({ ...table, evidenceInDrawer: false }).head).toEqual(headers);
});

const bridge: SourceTable = {
  line: 30,
  headers: ["Step", "Amount", "Add-Back ID", "Reporting unit", "Basis and limitation"],
  rows: [
    ["Opening EBITDA", "100", "Not applicable", "US$m", ""],
    ["Add-back", "5", "AB-1", "US$m", "Run-rate."],
    ["Closing EBITDA", "105", "Not applicable", "US$m", ""],
  ],
  evidenceInDrawer: true,
};

it("leaves the EBITDA bridge's Add-Back ID column to the drawer, as the library hides an id column", () => {
  const { head, rows: shown } = chartTable(bridge);
  expect(head).toEqual(["Step", "Amount", "Reporting unit", "Basis and limitation"]);
  expect(shown.map((row) => [row.label, ...row.cells])).toEqual([
    ["Opening EBITDA", "100", "US$m", null],
    ["Add-back", "5", "US$m", "Run-rate."],
    ["Closing EBITDA", "105", "US$m", null],
  ]);
});

it("shows the Add-Back ID column where the sources are not in the drawer", () => {
  expect(chartTable({ ...bridge, evidenceInDrawer: false }).head).toEqual(bridge.headers);
});
