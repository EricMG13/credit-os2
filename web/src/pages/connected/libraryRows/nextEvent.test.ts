import { expect, it } from "vitest";
import type { Snapshot } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { nextDatedEvent } from "./nextEvent";

const SHA = "d".repeat(64);

function snapshot(rows: string[][], asOf: string | null = "2026-03-31"): Snapshot {
  return {
    catalogue: { real: [] },
    workspace: {
      runs: {
        run: {
          folder: "acme-run",
          asOf,
          modules: { "CP-2D": { outputs: ["acme-run/liquidity"], default: "acme-run/liquidity" } },
        },
      },
      outputs: {
        "acme-run/liquidity": {
          id: "acme-run/liquidity",
          run: "run",
          module: "CP-2D",
          label: "Liquidity",
          href: "",
          sha256: SHA,
          events: [{ table: 20, lane: "Dated events" }],
        },
      },
      handoffs: {
        [SHA]: [
          {
            heading: "Events: Dated events",
            line: 19,
            level: 3,
            blocks: [
              {
                type: "table",
                line: 20,
                headers: EVENT_HEADERS,
                rows: rows.map((cells, index) => ({ line: 22 + index, cells })),
              },
            ],
          },
        ],
      },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
}

const row = (date: string, event: string, status = "Scheduled — Contract") => [
  date,
  date.length === 4 ? "year" : "day",
  "2026-01-01",
  event,
  status,
  "Not a file",
  "Refinancing",
];

it("is the earliest upcoming dated event with its date as written and its evidence line", () => {
  const found = nextDatedEvent(
    snapshot([row("2028-06-30", "Term loan due"), row("2026-09-15", "Notes call date")]),
    "acme-run",
  );
  expect(found).toEqual({
    date: "2026-09-15",
    name: "Notes call date",
    status: "Scheduled — Contract",
    withinRecordedPeriod: false,
    unplaced: false,
    href: `/report/acme-run#evidence/acme-run%2Fliquidity~${SHA}-23`,
  });
});

it("skips historical events and says nothing when none is upcoming", () => {
  const past = snapshot([row("2025-01-01", "Notes issued", "Historical — Published")]);
  expect(nextDatedEvent(past, "acme-run")).toBe("none");
});

it("is unknown, not none, for a run with no as-of date", () => {
  expect(nextDatedEvent(snapshot([row("2028-06-30", "Term loan due")], null), "acme-run")).toBe(
    "unknown",
  );
});

it("is unknown when the report is not in the snapshot", () => {
  expect(nextDatedEvent(snapshot([row("2028-06-30", "Term loan due")]), "other")).toBe("unknown");
});

it("keeps the event's status and says when its recorded period holds the as-of date", () => {
  const found = nextDatedEvent(
    snapshot([
      [
        "2026-Q1",
        "quarter",
        "2026-01-01",
        "Quarter-end test",
        "Scheduled — Contract",
        "x",
        "Refinancing",
      ],
    ]),
    "acme-run",
  );
  expect(found).toMatchObject({
    date: "2026-Q1",
    status: "Scheduled — Contract",
    withinRecordedPeriod: true,
  });
});

it("is unknown, not none, when an event row could not be placed on the calendar", () => {
  expect(nextDatedEvent(snapshot([row("mid-2027", "Refinancing window")]), "acme-run")).toBe(
    "unknown",
  );
});

it("says an earlier-looking row could not be placed beside the event it does find", () => {
  const found = nextDatedEvent(
    snapshot([row("2029-06-30", "Notes due"), row("mid-2027", "Refinancing window")]),
    "acme-run",
  );
  expect(found).toMatchObject({ date: "2029-06-30", unplaced: true });
});

it("names a module code in an event's words, never drawing the code", () => {
  const found = nextDatedEvent(
    snapshot([row("2026-09-15", "CP-4 covenant test", "Scheduled — CP-2D")]),
    "acme-run",
  );
  expect(found).toMatchObject({
    name: "Legal & covenants covenant test",
    status: "Scheduled — Liquidity",
  });
});
