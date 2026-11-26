// Regression for S17-1-3 (probe S17-1-3): the Changes page's "Table" view draws the same signed differences as the list but
// drops the paragraph CP-8 wrote above its issuer table to qualify them: `lead(ISSUER_REGISTER)` is
// passed to `Measures`, which draws it only in the list view (Changes.tsx), and `rest` excludes it.
// Answer key: the qualification is the module's own words about those figures; switching the
// presentation of the same figures must not remove it (the page is "nothing a handoff carries is dropped",
// changes/model.ts `leftovers`).
import { afterEach, expect, it } from "vitest";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { OutputEntry, PublishedChanges, PublishedRun, Snapshot } from "../publishedReport";
import { ReportChanges } from "./Changes";

afterEach(cleanup);

const LEAD =
  "The signed differences below are copied comparisons of different observation dates, not evidence of developments after the earlier review.";
const run = { folder: "current" } as PublishedRun;
const snapshot = { chips: {} } as unknown as Snapshot;
const side = (value: string, period: string) => ({ value, unit: "US$m", period });

const entry: OutputEntry = {
  selected: true,
  output: { id: "a", module: "CP-8", label: "a", href: "", sha256: "a".repeat(64) },
  sections: [
    { heading: "Findings", level: 2, line: 1, blocks: [] },
    {
      heading: "What changed: the issuer",
      level: 3,
      line: 64,
      blocks: [
        { type: "text", line: 66, end: 66, text: LEAD },
        {
          type: "table",
          line: 69,
          headers: ["Measure or fact", "Earlier", "Current", "Cause", "Effect on the credit view"],
          rows: [
            {
              line: 76,
              cells: ["Undrawn committed facilities", "843 US$m", "839 US$m", "Unresolved", "—"],
            },
          ],
        },
      ],
    },
  ],
};

const change: PublishedChanges = {
  pack: {
    measures: [
      {
        key: "undrawn",
        label: "Undrawn committed facilities",
        unit: "US$m",
        prior: side("843", "FY2024 / 2024-09-30"),
        current: side("839", "2024-06-29"),
        difference: "-4",
      },
    ],
  },
  verdicts: { measures: { undrawn: { kind: "comparable", label: "Same definition" } } },
};

it("keeps the module's qualification of the differences when the table view is chosen", () => {
  render(createElement(ReportChanges, { snapshot, run, entries: [entry], change }));
  expect(screen.queryAllByText(LEAD)).toHaveLength(1); // the list view draws it
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(screen.queryAllByText(LEAD)).toHaveLength(1); // table view: the same figures, the same qualification
});
