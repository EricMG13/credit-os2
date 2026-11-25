import { expect, it } from "vitest";
import type { OutputEntry, Snapshot } from "./publishedReport";
import { traceForConfidence } from "./ReportContent";

const entry = (label: string) =>
  ({
    output: {
      id: "run-a/CP-2.md",
      module: "CP-2",
      label,
      sha256: "0".repeat(64),
      confidence: { value: 53, band: "Low" },
      confidenceTrace: { inputs: [], method: [] },
    },
    sections: [],
  }) as unknown as OutputEntry;

it("names the module, never its code, in the confidence trace's subtitle", () => {
  const trace = traceForConfidence({ chips: {} } as unknown as Snapshot, entry("CP-2"));
  expect(trace?.subtitle).toBe("Fundamental credit");
  expect(trace?.subtitle).not.toMatch(/CP-/);
});

it("keeps an output label that says more than the module's code", () => {
  const trace = traceForConfidence({ chips: {} } as unknown as Snapshot, entry("Second draft"));
  expect(trace?.subtitle).toBe("Fundamental credit · Second draft");
});
