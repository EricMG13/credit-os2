// Expected values are the coordinator's hand-written answer key
// (tests/fixtures/cp1-instruction-pr/answer-key.json), not computed by the code under test.
// The synthetic tables are labelled synthetic; the retained handoff is outdated evidence (FY2024):
// shape and scope only. Mutated entries are test inputs, not real handoffs.
import { describe, expect, it } from "vitest";
import key from "../../../../../../../tests/fixtures/cp1-instruction-pr/answer-key.json";
import { cp1Entry, distressedCp1Entry } from "../fixtures/load";
import { edited } from "../fixtures/mutations";
import { ebitdaBridge, figureGap } from "./foundationData";

const BRIDGE = key.bridge.heading;
const NEW_HEADER = key.bridge.new_header;
const OLD_HEADER = key.bridge.old_header;

/** The cells of one Markdown table line. */
const cellsOf = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

/** A CP-1 entry whose bridge is the key's table `lines`; `drop` removes one column (0-based). */
function entryWith(lines: readonly string[], drop?: number) {
  const [header = "", , ...rows] = lines;
  const keep = <T>(cells: T[]) =>
    drop === undefined ? cells : cells.filter((_, at) => at !== drop);
  return edited(cp1Entry(), (table, heading) =>
    heading !== BRIDGE
      ? table
      : {
          ...table,
          headers: keep(cellsOf(header)),
          rows: rows.map((line, at) => ({ line: table.line + 2 + at, cells: keep(cellsOf(line)) })),
        },
  );
}

const stated = key.bridge.accepted.stated;
const reading = key.bridge.reading.synthetic_new_header;

/** Label, amount and kind of each step, and whether the bridge reconciles. */
const read = (entry: ReturnType<typeof cp1Entry>) => {
  const bridge = ebitdaBridge(entry);
  return {
    labels: bridge?.steps.map((step) => step.label),
    amounts: bridge?.steps.map((step) => step.cell.text),
    kinds: bridge?.steps.map((step) => step.kind),
    reconciles: bridge?.reconciles,
  };
};
const wanted = {
  labels: reading.labels,
  amounts: reading.amounts,
  kinds: reading.web_kinds,
  reconciles: reading.web_reconciles,
};

describe("the EBITDA bridge with and without the Add-Back ID column (answer key)", () => {
  it("the key's two headers are the ones tested", () => {
    expect(stated[0]).toBe(NEW_HEADER);
    expect(NEW_HEADER.replace(" Add-Back ID |", "")).toBe(OLD_HEADER);
  });
  it("reads the synthetic new-header bridge to the key's labels, amounts, kinds and reconciliation", () => {
    expect(read(entryWith(stated))).toEqual(wanted);
  });
  it("reads the same rows under the old header to the same figures", () => {
    expect(read(entryWith(stated, 2))).toEqual(wanted);
  });
  it("reads the retained web fixture (old header) to the key's figures", () => {
    const retained = key.bridge.reading.retained_web_fixture_old_header;
    expect(read(distressedCp1Entry())).toEqual({
      labels: retained.labels,
      amounts: retained.amounts,
      kinds: retained.web_kinds,
      reconciles: retained.web_reconciles,
    });
  });
  it("gives the gap words for the all-gap bridge, new header and old", () => {
    const gap = key.bridge.reading.synthetic_all_gap_new_header.gap;
    const allGap = key.bridge.accepted.all_gap;
    // The all-gap table has two rows; the reader needs three, so a middle row (Not applicable
    // holds there too) is added to a copy: the key's own rows stay as written.
    const withMiddle = [
      allGap[0] ?? "",
      allGap[1] ?? "",
      allGap[2] ?? "",
      allGap[2] ?? "",
      allGap[3] ?? "",
    ];
    // The web draws the module's own words: `Not supplied: <reason>` (the library keeps the reason).
    expect(figureGap(entryWith(withMiddle), "bridge")).toBe(`Not supplied: ${gap}`);
    expect(figureGap(entryWith(withMiddle, 2), "bridge")).toBe(`Not supplied: ${gap}`);
  });
});
