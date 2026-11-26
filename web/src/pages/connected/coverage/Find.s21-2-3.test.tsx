import { afterEach, expect, it } from "vitest";
// Probe S21-2-3: Find's highlight is offset by one character after "İ" (U+0130), whose lower case is
// two UTF-16 units ("i" + U+0307): `Marked` finds the hit in text.toLowerCase() and slices the
// original at the same offsets. Answer key by hand: in "İş Bankası funds ..." the searched word
// "bank" matches the four characters "Bank" (original indices 3-6); the mark must read "Bank".
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import type { Coverage } from "../coverageData";
import { FindView } from "./Find";

afterEach(cleanup);

const issuer = {
  key: "a",
  name: "Alpha",
  sector: null,
  runs: [{ key: "a1", folder: "a-run", asOf: "2026-03-31", pathway: null, pathwayTitle: null, cells: {}, other: [] }],
};
const data: Coverage = {
  columns: [],
  issuers: [issuer],
  fields: [{ id: "cp-2/reader-summary/finding", module: "CP-2", group: "Findings", label: "Finding", kind: "text" }],
  facts: [
    {
      field: "cp-2/reader-summary/finding",
      issuer: "a",
      run: "a1",
      period: null,
      row: null,
      text: "İş Bankası funds the group's term loan.",
      at: null,
      line: 3,
      output: "a-run/CP-2.md",
      sha256: "a".repeat(64),
    },
  ],
};

it("marks the searched word, not the characters one place to its right", () => {
  const { container } = render(createElement(FindView, { data, issuers: [issuer], query: "bank", titles: new Map() }));
  expect([...container.querySelectorAll("mark")].map((mark) => mark.textContent)).toEqual(["Bank"]);
});
