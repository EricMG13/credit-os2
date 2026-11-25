import path from "node:path";
import type { OutputEntry } from "../../publishedReport";
import { fixtureEntry } from "./markdown.fixture";

type Fields = Pick<OutputEntry["output"], "charts" | "chartGaps" | "events" | "maps">;

// What the store's `reader_fields` (apps/issuer-library/credit_os/handoff_fields.py) publishes
// for these synthetic proof handoffs' bytes, as it emitted them on 2026-11-25.
const STORE: Record<string, Fields> = {
  "CP-1A": {
    events: [{ lane: "Issuer history", table: 38, gap: null }],
    maps: [
      { name: "ownership and control", table: 47, gap: null },
      { name: "operating model to credit", table: 53, gap: null },
    ],
  },
  "CP-2": { maps: [{ name: "credit-risk transmission", table: 26, gap: null }] },
  "CP-2A": { maps: [{ name: "stress scenario", table: 22, gap: null }] },
  "CP-2D": {
    charts: [
      {
        title: "Liquidity bridge",
        table: 22,
        unit: "US$m",
        columns: [1],
        kind: "waterfall",
        amount: 1,
      },
    ],
    events: [{ lane: "Financing", table: 31, gap: null }],
  },
  "CP-2E": { events: [{ lane: "Hedges", table: 22, gap: null }] },
  "CP-2G": {},
  "CP-3": { events: [{ lane: "Instruments", table: 38, gap: null }] },
  "CP-3C": {
    charts: [{ title: "Refinancing need", table: 22, unit: "US$m", columns: [1, 2] }],
    events: [{ lane: "Refinancing", table: 29, gap: null }],
  },
  "CP-4": {
    charts: [
      {
        title: "Covenant headroom",
        table: 28,
        kind: "bullet",
        direction: 4,
        label: [0],
        threshold: 1,
        current: 2,
        headroom: 3,
        unit: "",
        columns: [1, 2],
      },
    ],
    events: [{ lane: "Legal", table: 36, gap: null }],
    maps: [
      { name: "legal entities", table: 45, gap: null },
      { name: "intercreditor", table: 51, gap: null },
    ],
  },
  "CP-DR": { events: [{ lane: "Research catalysts", table: 22, gap: null }] },
};

/** For tests only: the repository's synthetic proof handoff of `module` (proof/handoffs), as published. */
export function proofHandoff(module: keyof typeof STORE, fields: Partial<Fields> = {}) {
  const file = path.resolve(
    import.meta.dirname,
    "../../../../../../proof/handoffs",
    `${module}.md`,
  );
  return fixtureEntry(module, file, { ...STORE[module], ...fields });
}
