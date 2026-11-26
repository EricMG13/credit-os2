import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { CatalogueRun, LibraryIndex } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { groupIssuers } from "./group";
import { IssuerRow } from "./IssuerRow";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const SHA = "d".repeat(64);

class Seen {
  constructor(private readonly tell: (entries: { isIntersecting: boolean }[]) => void) {}
  observe() {
    this.tell([{ isIntersecting: true }]);
  }
  disconnect() {
    return undefined;
  }
}

const event = (date: string, kind: string, name: string) => [
  date,
  kind,
  "2026-01-01",
  name,
  "Scheduled — Contract",
  "Not a file",
  "Refinancing",
];

const snapshot = (rows: string[][]) => ({
  catalogue: { real: [] },
  workspace: {
    runs: {
      run: {
        folder: "acme-2026",
        asOf: "2026-03-31",
        modules: { "CP-2D": { outputs: ["acme-2026/liquidity"], default: "acme-2026/liquidity" } },
      },
    },
    outputs: {
      "acme-2026/liquidity": {
        id: "acme-2026/liquidity",
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
});

function drawWith(rows: string[][]) {
  vi.stubGlobal("IntersectionObserver", Seen);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json(snapshot(rows)))),
  );
  const entry: CatalogueRun = {
    id: "acme-2026",
    name: "Acme",
    issuer: "Acme",
    title: "Full credit assessment",
    date: "2026-03-31",
    sector: "Industrial",
    period: "FY2025",
    metrics: {},
  };
  const library: LibraryIndex = {
    catalogue: { real: [entry] },
    workspace: {
      runs: { "acme-2026": { folder: "acme-2026", issuerKey: "acme", pathway: "credit_snapshot" } },
    },
  };
  const [group] = groupIssuers(library);
  if (!group) throw new Error("no group");
  render(
    <ul>
      <IssuerRow group={group} />
    </ul>,
  );
  return screen.getByRole("listitem");
}

it("draws the recorded-period qualifier in the closed row beside a quarter-dated next event", async () => {
  const row = drawWith([event("2026-Q1", "quarter", "Quarter-end test")]);
  expect(await within(row).findByText("Quarter-end test")).toBeVisible();
  expect(
    within(row).getByText("Timing falls within the recorded period; the exact date is unresolved."),
  ).toBeVisible();
});

it("draws the unplaced qualifier in the closed row beside the event it does find", async () => {
  const row = drawWith([
    event("2029-06-30", "day", "Notes due"),
    event("mid-2027", "mid", "Refinancing window"),
  ]);
  expect(await within(row).findByText("Notes due")).toBeVisible();
  expect(
    within(row).getByText(
      "Some dated rows in this report could not be placed on the Calendar, so an earlier date may exist.",
    ),
  ).toBeVisible();
});

it("draws no qualifier when the next event carries neither flag", async () => {
  const row = drawWith([event("2026-09-15", "day", "Notes call date")]);
  expect(await within(row).findByText("Notes call date")).toBeVisible();
  expect(within(row).queryByText(/exact date is unresolved/)).toBeNull();
  expect(within(row).queryByText(/earlier date may exist/)).toBeNull();
});
