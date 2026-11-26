import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { CatalogueRun, LibraryIndex } from "../publishedReport";
import { EVENT_HEADERS } from "../visuals/EventLane";
import { groupIssuers } from "./group";
import { IssuerRow } from "./IssuerRow";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const run = (id: string, date: string, extra: Partial<CatalogueRun> = {}): CatalogueRun => ({
  id,
  name: "Acme",
  issuer: "Acme",
  title: "Full credit assessment",
  date,
  sector: "Industrial",
  period: "FY2025",
  metrics: {},
  ...extra,
});

function index(entries: CatalogueRun[], published: string[]): LibraryIndex {
  return {
    catalogue: { real: entries },
    workspace: {
      runs: Object.fromEntries(
        published.map((id) => [id, { folder: id, issuerKey: "acme", pathway: "credit_snapshot" }]),
      ),
    },
  };
}

const METRICS: CatalogueRun["metrics"] = {
  net_leverage: {
    value: "2.25",
    unit: "x",
    period: "FY2025",
    prior: { value: "3.00", period: "FY2024" },
    change: "-0.75",
  },
  coverage: { value: "4.19", unit: "x", period: "FY2025" },
  cash: { value: "100", unit: "US$m", period: "FY2025" },
  undrawn: { value: "250", unit: "US$m", period: "FY2025" },
};

function draw(entries: CatalogueRun[], published: string[]) {
  const [group] = groupIssuers(index(entries, published));
  if (!group) throw new Error("no group");
  return render(
    <ul>
      <IssuerRow group={group} />
    </ul>,
  );
}

it("draws one row for an issuer with the three figures, the decision not shown, chips and report links", () => {
  draw([run("acme-2026", "2026-03-31", { metrics: METRICS })], ["acme-2026"]);
  const row = screen.getByRole("listitem");
  expect(within(row).getByRole("heading", { name: "Acme" })).toBeVisible();
  expect(within(row).getByText("Not shown in the Library")).toBeVisible();
  expect(within(row).getAllByText("2.25x")[0]).toHaveClass("font-mono");
  expect(within(row).getByText("better")).toBeVisible();
  expect(within(row).getByText("4.19x")).toBeVisible();
  expect(within(row).getAllByText("No prior period stated")).toHaveLength(2);
  expect(within(row).getByText("$100m")).toBeVisible();
  expect(within(row).getAllByText("FY2025").length).toBeGreaterThanOrEqual(3);
  expect(within(row).queryByText(/Undrawn/)).toBeNull();
  expect(within(row).getByText("Full credit assessment")).toBeVisible();
  expect(within(row).getByText("31 March 2026")).toBeVisible();
  expect(within(row).getByText("Delivered")).toBeVisible();
  expect(within(row).getByRole("link", { name: "Open report" })).toHaveAttribute(
    "href",
    "/report/acme-2026",
  );
  expect(within(row).getByRole("link", { name: "Open Calendar" })).toHaveAttribute(
    "href",
    "/report/acme-2026#calendar",
  );
});

it("draws a figure the catalogue does not quote as n.a. and 'Not shown here'", () => {
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  expect(screen.getAllByText("n.a.")).toHaveLength(3);
  expect(screen.getAllByText("Not shown here")).toHaveLength(3);
});

it("opens to every run newest first, each with its report", () => {
  draw(
    [
      run("acme-2025", "2025-03-31"),
      run("acme-2026", "2026-03-31"),
      run("acme-2024", "2024-03-31"),
    ],
    ["acme-2026", "acme-2025", "acme-2024"],
  );
  expect(screen.getByRole("link", { name: "3 runs" })).toHaveAttribute(
    "href",
    "/report/acme-2026#history",
  );
  const toggle = screen.getByRole("button", { name: "Show runs and detail for Acme" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).not.toHaveAttribute("aria-controls");
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const runs = within(screen.getByRole("region", { name: "Runs, Acme" })).getAllByRole("listitem");
  expect(runs.map((item) => item.textContent)).toEqual([
    expect.stringContaining("31 March 2026"),
    expect.stringContaining("31 March 2025"),
    expect.stringContaining("31 March 2024"),
  ]);
  expect(within(runs[0] as HTMLElement).getByText("Latest")).toBeVisible();
  expect(
    within(runs[1] as HTMLElement).getByRole("link", { name: "Open report of 31 March 2025" }),
  ).toHaveAttribute("href", "/report/acme-2025");
  expect(
    within(runs[2] as HTMLElement).getByRole("link", { name: "Open report of 31 March 2024" }),
  ).toHaveAttribute("href", "/report/acme-2024");
});

it("says a run without a report has none, and offers no report or Calendar link", () => {
  draw([run("acme-2026", "2026-03-31")], []);
  expect(screen.getByText("No report published")).toBeVisible();
  expect(screen.queryByRole("link", { name: "Acme" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Open report" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Open Calendar" })).toBeNull();
  expect(screen.getByText("Needs a published report")).toBeVisible();
});

it("says once in the row that the decision is not shown, and leaves the reason to the page", () => {
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  fireEvent.click(screen.getByRole("button", { name: /Show runs and detail/ }));
  expect(screen.getAllByText("Not shown in the Library")).toHaveLength(1);
  expect(screen.queryByText(/recorded clearance/)).toBeNull();
  expect(screen.queryByRole("region", { name: "Decision, Acme" })).toBeNull();
});

/** A browser that reports every watched row as in view at once. */
function seeEverything() {
  class Seen {
    constructor(private readonly tell: (entries: { isIntersecting: boolean }[]) => void) {}
    observe() {
      this.tell([{ isIntersecting: true }]);
    }
    disconnect() {
      return undefined;
    }
  }
  vi.stubGlobal("IntersectionObserver", Seen);
}

const SHA = "d".repeat(64);
const dated = (rows: string[][]) => ({
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
const event = (date: string, name: string, status = "Scheduled — Contract") => [
  date,
  date.length === 4 ? "year" : "day",
  "2026-01-01",
  name,
  status,
  "Not a file",
  "Refinancing",
];

it("shows the next dated event in the closed row once the row is in view, reading the report once", async () => {
  seeEverything();
  const fetch = vi.fn(() =>
    Promise.resolve(
      Response.json(
        dated([event("2028-06-30", "Term loan due"), event("2026-09-15", "Notes call date")]),
      ),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  const row = screen.getByRole("listitem");
  const date = await within(row).findByText("15 September 2026");
  expect(date).toHaveAttribute("datetime", "2026-09-15");
  expect(date).toHaveClass("font-mono");
  expect(within(row).getByText("Notes call date")).toBeVisible();
  expect(within(row).queryByText("Term loan due")).toBeNull();
  expect(within(row).getByRole("link", { name: "Open Calendar" })).toBeVisible();
  expect(screen.getByRole("button", { name: /Show runs and detail/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("draws a year-only event date as the module wrote it, with no machine date", async () => {
  seeEverything();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json(dated([event("2028", "Term loan due")])))),
  );
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  const date = await screen.findByText("2028");
  expect(date).not.toHaveAttribute("datetime");
});

it("says a report with no upcoming event states none, and never a date", async () => {
  seeEverything();
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        Response.json(dated([event("2025-01-01", "Notes issued", "Historical — Published")])),
      ),
    ),
  );
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  expect(await screen.findByText("No upcoming date stated")).toBeVisible();
});

it("does not read a report for its dates before the row is in view or opened", () => {
  const fetch = vi.fn(() => Promise.resolve(Response.json({})));
  vi.stubGlobal("fetch", fetch);
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  expect(fetch).not.toHaveBeenCalled();
});

it("draws better in the accent and worse in the signal colour, each with its word", () => {
  draw(
    [
      run("acme-2026", "2026-03-31", {
        metrics: {
          ...METRICS,
          coverage: {
            value: "3.00",
            unit: "x",
            period: "FY2025",
            prior: { value: "4.00", period: "FY2024" },
            change: "-1.00",
          },
        },
      }),
    ],
    ["acme-2026"],
  );
  expect(screen.getByText("better").parentElement).toHaveClass("text-success-text");
  expect(screen.getByText("worse").parentElement).toHaveClass("text-warning-text");
});

it("opens to the figures the row does not show, as one stats strip with its own trace controls", () => {
  draw(
    [
      run("acme-2026", "2026-03-31", {
        metrics: { ...METRICS, revenue: { value: "1250.00", unit: "US$m", period: "FY2025" } },
      }),
    ],
    ["acme-2026"],
  );
  fireEvent.click(screen.getByRole("button", { name: /Show runs and detail/ }));
  const strip = within(screen.getByLabelText("More figures, Acme", { selector: "dl" }));
  expect(strip.getByText("$1,250.00m")).toBeVisible();
  expect(strip.getAllByText("Not shown here")).toHaveLength(2);
  expect(strip.getByRole("button", { name: "Show sources for Revenue, Acme" })).toBeVisible();
  expect(strip.queryByText("2.25x")).toBeNull();
});

it("reads the report once for its dates, keeps the answer when the row closes and names the report read", async () => {
  const fetch = vi.fn(() =>
    Promise.resolve(
      Response.json({
        catalogue: { real: [] },
        workspace: { runs: {}, outputs: {}, handoffs: {}, models: [] },
        chips: {},
      }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  const toggle = screen.getByRole("button", { name: /Show runs and detail/ });
  fireEvent.click(toggle);
  await waitFor(() => {
    expect(screen.getByText(/could not be read against its as-of date/)).toBeVisible();
  });
  expect(screen.getByText(/From the report as of 31 March 2026/)).toBeVisible();
  fireEvent.click(toggle);
  fireEvent.click(toggle);
  expect(screen.getByText(/could not be read against its as-of date/)).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
});
