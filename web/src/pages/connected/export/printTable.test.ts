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
