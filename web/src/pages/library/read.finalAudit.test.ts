import { readFileSync } from "node:fs";
import path from "node:path";
import { readSlice } from "./read";
import type { LibrarySlice } from "./slice";

const fixture = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../fixtures/library.json"), "utf8"),
) as { slice: LibrarySlice };
const fresh = () => structuredClone(fixture.slice);

describe("final audit Evidence consistency gates", () => {
  it("refuses a Summary calculation total that disagrees with the actual derivations (S4-001)", () => {
    const slice = fresh();
    const run = slice.issuers[0]?.runs[0];
    if (run === undefined || run.loading) throw new Error("no full run");
    const metric = run.evidence.summary.counts.find((c) => c.label === "Calculations");
    if (metric === undefined) throw new Error("no count");
    Object.assign(metric, { value: { kind: "value", text: "999", at: 999 } });
    const result = readSlice(slice);
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.reason).toContain("summary.counts");
  });

  it("refuses a positive source count with neither source details nor a stated gap (S4-002)", () => {
    const slice = fresh();
    const run = slice.issuers[0]?.runs[0];
    if (run === undefined || run.loading) throw new Error("no full run");
    const trace = run.traces["revenue"];
    if (trace === undefined) throw new Error("no revenue trace");
    Object.assign(trace, {
      excerpt: null,
      qualification: null,
      derivation: { label: "Result", value: "Revenue 2,105", note: null, children: [] },
    });
    const result = readSlice(slice);
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.reason).toContain("sources");
  });
});

describe("source-detail validation, empty records", () => {
  it.each(["empty source node", "empty excerpt"])(
    "does not treat %s as source evidence",
    (kind) => {
      const slice = fresh();
      const run = slice.issuers[0]?.runs[0];
      if (run === undefined || run.loading) throw new Error("no full run");
      const trace = run.traces["revenue"];
      if (trace === undefined) throw new Error("no revenue trace");
      Object.assign(trace, {
        qualification: null,
        excerpt: kind === "empty excerpt" ? { quote: "", source: "" } : null,
        derivation: {
          label: "Result",
          value: "Revenue 2,105",
          note: null,
          children:
            kind === "empty source node"
              ? [{ label: "Source", value: null, note: null, children: [] }]
              : [],
        },
      });
      expect(readSlice(slice).kind).toBe("invalid");
    },
  );
});
