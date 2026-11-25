import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { CatalogueRun, LibraryIndex } from "../publishedReport";
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
  expect(within(row).getByText("US$100m")).toBeVisible();
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

it("says in the opened row why the decision is not shown, and shows none", () => {
  draw([run("acme-2026", "2026-03-31")], ["acme-2026"]);
  fireEvent.click(screen.getByRole("button", { name: /Show runs and detail/ }));
  expect(
    screen.getByText(/shows a committee decision only with a recorded clearance/),
  ).toBeVisible();
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
  expect(strip.getByText("US$1,250.00m")).toBeVisible();
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
