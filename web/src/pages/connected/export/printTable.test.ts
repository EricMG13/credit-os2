import { expect, it } from "vitest";
import type { Table } from "../publishedReport";
import { printableBasis, printableTable, redactArchivedLocator } from "./printTable";
import { containsRunIdentifier } from "./reportExport";

it.each([
  [
    "Q pages 2 and 47; reported revolver availability only, already net of 61 letters of credit; fully drawn receivables facility adds no availability; legal draw conditions not verified",
    "reported revolver availability only, already net of 61 letters of credit; fully drawn receivables facility adds no availability; legal draw conditions not verified",
  ],
  [
    "Source-printed long-term-debt schedule as of 2024-09-30, A page:153; excludes finance leases and short-term receivables facility; not a complete current maturity total",
    "Source-printed long-term-debt schedule as of 2024-09-30; excludes finance leases and short-term receivables facility; not a complete current maturity total",
  ],
  [
    "Cash A page:120; reported revolver availability A page:59 after letters of credit; excludes separately drawable receivables capacity",
    "Cash; reported revolver availability after letters of credit; excludes separately drawable receivables capacity",
  ],
  [
    "Availability is permitted A page:59 and 61 letters of credit are deducted",
    "Availability is permitted and 61 letters of credit are deducted",
  ],
])("preserves authored basis after removing legacy locators", (source, expected) => {
  expect(printableBasis(source)).toBe(expected);
});

it("redacts chart prose in place without changing exact quantity words or dropping clauses", () => {
  expect(
    redactArchivedLocator(
      "Q page:47 confirms quarterly term principal payments of 22; annual payments in A page:172 are 20.",
    ),
  ).toBe(
    "[source locator omitted] confirms quarterly term principal payments of 22; annual payments in [source locator omitted] are 20.",
  );
});

it("preserves zero and missing balances with a safe basis, and withholds the whole affected row otherwise", () => {
  const table: Table = {
    type: "table",
    line: 10,
    headers: [
      "Period",
      "Cash",
      "Undrawn committed facilities",
      "Reporting unit",
      "Basis and limitation",
    ],
    rows: [
      {
        line: 12,
        cells: [
          "2024-12-27",
          "0",
          "Not supplied: missing evidence",
          "US$m",
          "Q page:2; legal draw conditions unverified",
        ],
      },
      {
        line: 13,
        cells: ["2024-12-28", "2459", "849", "US$m", "subject to https://internal.example/terms"],
      },
    ],
  };
  const projected = printableTable(table);
  expect(projected.withheld).toBe(true);
  expect(projected.table.rows.map(({ cells }) => cells)).toEqual([
    [
      "2024-12-27",
      "0",
      "Not supplied: missing evidence",
      "US$m",
      "legal draw conditions unverified",
    ],
    [
      "2024-12-28",
      "Withheld",
      "Withheld",
      "US$m",
      "The observation qualification is only available in Evidence.",
    ],
  ]);
  expect(printableTable(table, true).table.rows[0]?.cells).toEqual([
    "2024-12-27",
    "Withheld",
    "Withheld",
    "US$m",
    "legal draw conditions unverified",
  ]);
});

it("opens a sanitized mixed basis column while retaining the source column's analytical conditions", () => {
  const table: Table = {
    type: "table",
    line: 6,
    headers: ["Metric", "FY2024", "Basis and source"],
    rows: [
      {
        line: 8,
        cells: [
          "FCF: CFO less capex",
          "1,880",
          "Calculated C2; after cash interest/taxes, before acquisitions/distributions; no maintenance/growth split",
        ],
      },
      {
        line: 9,
        cells: [
          "EBITDA / cash interest",
          "3.293",
          "Calculated C4, x; cash-paid net interest, not coupon run rate",
        ],
      },
      {
        line: 10,
        cells: [
          "Net sales",
          "7,940",
          "USD millions; reported A page:121, Q page:3; rolling calculated C1; C1",
        ],
      },
      { line: 11, cells: ["Net debt / EBITDA", "4.932", "Legal basis in ~/private/convention"] },
    ],
  };
  const { table: printed } = printableTable(table);
  expect(printed.headers).toEqual(["Metric", "FY2024", "Basis and limitation"]);
  expect(printed.rows.map(({ cells }) => cells)).toEqual([
    [
      "FCF: CFO less capex",
      "1,880",
      "Calculated; after cash interest/taxes, before acquisitions/distributions; no maintenance/growth split",
    ],
    [
      "EBITDA / cash interest",
      "3.293",
      "Calculated, x; cash-paid net interest, not coupon run rate",
    ],
    ["Net sales", "7,940", "USD millions; reported; rolling calculated"],
    [
      "Net debt / EBITDA",
      "Withheld",
      "The observation qualification is only available in Evidence.",
    ],
  ]);
});

it("matches actual run identities across punctuation without matching a ticker substring", () => {
  const ids = ["swarm-czr-dated", "run.v2", "ABC"];
  expect(containsRunIdentifier("Report swarm-czr-dated.", ids)).toBe(true);
  expect(containsRunIdentifier("Report (run.v2).", ids)).toBe(true);
  expect(containsRunIdentifier("runXv2 accessed ABCCORP.", ids)).toBe(false);
  expect(containsRunIdentifier("See swamp-swarm-czr-dated-copy.", ids)).toBe(false);
});

// Rows as TransDigm's Financial foundation handoff wrote them (test run, as of 2024-09-30): the
// source is named in words with its pages, as the last clause of the basis.
const realStack: Table = {
  type: "table",
  line: 303,
  headers: [
    "Facility",
    "Ranking",
    "Secured",
    "Amount",
    "Reporting unit",
    "Basis and limitation",
    "Leverage note",
  ],
  rows: [
    {
      line: 305,
      cells: [
        "Term Loans Facility, tranches I/J/K",
        "1",
        "Yes",
        "7173",
        "US$m",
        "June carrying value; TransDigm Inc. borrower, guaranteed senior secured credit facilities; exact subsidiary scope requires operative agreement verification; June quarterly report pages 18–19, 63–66",
        "Not supplied: positive common LTM EBITDA",
      ],
    },
    {
      line: 312,
      cells: [
        "4.625% 2029 subordinated notes",
        "2",
        "No",
        "1194",
        "US$m",
        "Same disclosed subordinated note obligor and guarantor scope; June quarterly report pages 19, 65–66",
        "Not supplied: positive common LTM EBITDA",
      ],
    },
  ],
};

it("keeps a real row's figures and qualification when its basis ends in a named report's pages", () => {
  const { table, withheld } = printableTable(realStack);
  expect(withheld).toBe(false);
  expect(table.rows.map(({ cells }) => cells)).toEqual([
    [
      "Term Loans Facility, tranches I/J/K",
      "1",
      "Yes",
      "7173",
      "US$m",
      "June carrying value; TransDigm Inc. borrower, guaranteed senior secured credit facilities; exact subsidiary scope requires operative agreement verification",
      "Not supplied: positive common LTM EBITDA",
    ],
    [
      "4.625% 2029 subordinated notes",
      "2",
      "No",
      "1194",
      "US$m",
      "Same disclosed subordinated note obligor and guarantor scope",
      "Not supplied: positive common LTM EBITDA",
    ],
  ]);
});

it("drops only a clause that is nothing but the citation, and still withholds a mixed one", () => {
  expect(
    printableBasis(
      "Reported cash and revolving availability after USD 71m letters of credit against USD 910m commitments; securitization fully drawn; June quarterly report pages 21, 60 and 64",
    ),
  ).toBe(
    "Reported cash and revolving availability after USD 71m letters of credit against USD 910m commitments; securitization fully drawn",
  );
  // The page sits inside the qualification's own sentence: nothing is cut, and the row is gated.
  const mixed = printableTable({
    ...realStack,
    rows: [
      {
        line: 305,
        cells: [
          "Notes",
          "1",
          "Yes",
          "100",
          "US$m",
          "Carrying value as shown on page 19 of the June report",
        ],
      },
    ],
  });
  expect(mixed.withheld).toBe(true);
  expect(mixed.table.rows[0]?.cells[3]).toBe("Withheld");
});

it.each([
  ["Amount; USD 450m per report page 25"],
  ["Carrying value; not disclosed in annual report page 5"],
  ["Carrying value; unaudited interim financial statements pages 4–6"],
  ["Facility size; draft credit agreement page 12"],
])("keeps a clause that carries a value or qualifier beside its page: %s", (source) => {
  expect(printableBasis(source)).toBe(source);
});

it.each([
  ["Amount; June quarterly report pages 18–19, 63–66", "Amount"],
  ["Amount; June report page 21", "Amount"],
  ["Amount; 2023 annual report page 88", "Amount"],
  ["Amount; Annual report page 153", "Amount"],
])("drops a clause that is only a document name and pages: %s", (source, expected) => {
  expect(printableBasis(source)).toBe(expected);
});
