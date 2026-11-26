// Fix round 1 (C6): trace drawer subtitles name CP-L10 by the run's pathway.
import { describe, expect, it } from "vitest";
import type { Snapshot } from "../publishedReport";
import { creditScreeningEntry } from "./leads/fixtures/load";
import { sectionTraces, traceForConfidence, traceForLine } from "../ReportContent";
import { readScreens } from "./leads/shortSnapshotData";

const entry = creditScreeningEntry();
const snapshot = { chips: {} } as unknown as Snapshot;
const screen = readScreens(entry)[0];
const line = screen?.state === "ready" ? screen.line : -1;

describe("trace subtitles", () => {
  it("name CP-L10 'Credit screening' in a credit screening run", () => {
    const pathway = "credit_screening";
    expect(traceForLine(snapshot, entry, 0, line, pathway)?.subtitle).toMatch(
      /^Credit screening · /,
    );
    const all = Object.values(sectionTraces(snapshot, entry, entry.sections, pathway));
    expect(all.length).toBeGreaterThan(0);
    for (const trace of all) expect(trace.subtitle).toMatch(/^Credit screening · /);
    const score = traceForConfidence(snapshot, entry, pathway);
    if (score) expect(score.subtitle).toMatch(/^Credit screening · /);
  });

  it("keep the short snapshot's name with no pathway or another pathway", () => {
    expect(traceForLine(snapshot, entry, 0, line)?.subtitle).toMatch(/^Short credit snapshot · /);
    expect(traceForLine(snapshot, entry, 0, line, "short_snapshot")?.subtitle).toMatch(
      /^Short credit snapshot · /,
    );
  });
});
