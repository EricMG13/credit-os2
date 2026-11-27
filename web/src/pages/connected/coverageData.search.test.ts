import { expect, it } from "vitest";
// Search matches the text the page draws, not the raw module text: a passage drawn as
// "Read this in Evidence." is not found by what is hidden, and Markdown marks and module codes
// are read as the page draws them.
import { matchIssuers, NO_FILTERS, type Coverage, type Fact } from "./coverageData";

const SHA = "d".repeat(64);
const issuer = (key: string) => ({
  key,
  name: key.toUpperCase(),
  sector: null,
  runs: [
    {
      key: `${key}1`,
      folder: `${key}-run`,
      asOf: "2026-03-31",
      pathway: null,
      pathwayTitle: null,
      cells: {},
      other: [],
    },
  ],
});
let line = 0;
const passage = (key: string, text: string): Fact => ({
  field: "cp-2/finding",
  issuer: key,
  run: `${key}1`,
  period: null,
  row: null,
  text,
  at: null,
  line: ++line,
  output: `${key}-run/CP-2.md`,
  sha256: SHA,
});
const data: Coverage = {
  columns: [],
  issuers: ["a", "b", "c"].map(issuer),
  fields: [
    { id: "cp-2/finding", module: "CP-2", group: "Findings", label: "Finding", kind: "text" },
  ],
  facts: [
    passage("a", "Cash is held only in annual-report-2025.pdf page 45."),
    passage("b", "As CP-2 states, leverage is high."),
    passage("c", "The foo **bar** covenant is tight."),
  ],
};
const found = (query: string) =>
  matchIssuers(data, { ...NO_FILTERS, query }, null).map((item) => item.key);

it("does not find a passage drawn as 'Read this in Evidence.' by its hidden file name", () => {
  expect(found("annual-report")).toEqual([]);
});

it("finds a passage by the module name the page draws in place of its code", () => {
  expect(found("states, leverage")).toEqual(["b"]);
  expect(found("Fundamental credit states")).toEqual(["b"]);
});

it("finds a passage across its Markdown marks", () => {
  expect(found("foo bar covenant")).toEqual(["c"]);
});
