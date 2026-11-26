import { expect, it } from "vitest";
import type { OutputEntry } from "../publishedReport";
import { chartGaps } from "./ModuleFrame";

// The reason the store joins from the replayed TDG CP-6 "Events: Decision and watch" row, each cell's
// reason in order: its "no dated decision event" clause is written by two cells.
const JOINED =
  "no sourced decision or assigned review date; no dated decision publication; no unique dated decision event; no dated decision event; no dated decision source; no dated decision event; issuer financing and maturity events remain in their originating analyses";

it("states each clause of a joined gap reason once", () => {
  const entry = {
    output: {
      module: "CP-6",
      events: [{ lane: "Decision and watch", table: 128, gap: JOINED }],
    },
    sections: [],
  } as unknown as OutputEntry;
  const [gap] = chartGaps(entry);
  expect(gap?.reason).toBe(
    "no sourced decision or assigned review date; no dated decision publication; no unique dated decision event; no dated decision event; no dated decision source; issuer financing and maturity events remain in their originating analyses",
  );
});
