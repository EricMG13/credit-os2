import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";

const entry = (id: string, name: string, sector: string, metrics: object = {}) => ({
  id,
  name,
  issuer: name,
  title: "Lite credit assessment",
  date: "2026-10-31",
  sector,
  period: "FY2026",
  metrics,
});
const BETTER_LEVERAGE = {
  net_leverage: {
    value: "2.25",
    unit: "x",
    period: "FY2026",
    prior: { value: "3.00", period: "FY2025" },
    change: "-0.75",
  },
};
const runs = (ids: string[]) =>
  Object.fromEntries(
    ids.map((id) => [id, { folder: id, issuerKey: id, pathway: "lite_credit_assessment" }]),
  );

function serve(real: object[], ids: string[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(Response.json({ catalogue: { real }, workspace: { runs: runs(ids) } })),
    ),
  );
}

beforeAll(async () => {
  await import("./LibraryIndex");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

it("draws one sector legend and one tint legend, in words, above the list", async () => {
  serve(
    [
      entry("a", "Alpha", "Food", BETTER_LEVERAGE),
      entry("b", "Beta", "Tech"),
      entry("c", "Gamma", ""),
    ],
    ["a", "b", "c"],
  );
  render(<ConnectedApp path="/" mode="synthetic" />);
  const sectors = await screen.findByLabelText("Sector colours");
  const entries = within(sectors).getAllByRole("listitem");
  expect(entries.map((item) => item.textContent)).toEqual(["Food", "Tech"]);
  expect(entries[0]?.querySelector("circle")).toHaveClass("fill-category-3");
  expect(entries[1]?.querySelector("circle")).toHaveClass("fill-category-4");
  // The filter chips are the one group named Sector.
  expect(screen.getAllByRole("group", { name: "Sector" })).toHaveLength(1);
  const tint = screen.getByLabelText("Tint colours");
  for (const words of ["Green: better", "Orange: worse", "Grey arrow: no better or worse is drawn"])
    expect(within(tint).getByText(words)).toBeVisible();
  const dots = document.querySelectorAll<HTMLElement>("[data-sector-dot]");
  expect([...dots].map((dot) => dot.style.backgroundColor)).toEqual([
    "var(--color-category-3)",
    "var(--color-category-4)",
  ]);
});

it("keeps a sector's colour under a filter and lists only the shown rows' sectors", async () => {
  serve([entry("a", "Alpha", "Food"), entry("b", "Beta", "Tech")], ["a", "b"]);
  window.history.replaceState(null, "", "/?sector=Tech");
  render(<ConnectedApp path="/" mode="synthetic" />);
  const sectors = await screen.findByLabelText("Sector colours");
  expect(
    within(sectors)
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  ).toEqual(["Tech"]);
  expect(sectors.querySelector("circle")).toHaveClass("fill-category-4");
});

it("draws neither legend when no row has a sector or a change", async () => {
  serve([entry("a", "Alpha", "")], ["a"]);
  render(<ConnectedApp path="/" mode="synthetic" />);
  await screen.findByRole("heading", { name: "Alpha" });
  expect(screen.queryByLabelText("Sector colours")).toBeNull();
  expect(screen.queryByLabelText("Tint colours")).toBeNull();
});

it("draws no tint legend for a row whose only change is not a number", async () => {
  serve(
    [
      entry("a", "Alpha", "", {
        net_leverage: {
          value: "2.25",
          unit: "x",
          period: "FY2026",
          prior: { value: "3.00", period: "FY2025" },
          change: "n/a",
        },
      }),
    ],
    ["a"],
  );
  render(<ConnectedApp path="/" mode="synthetic" />);
  await screen.findByRole("heading", { name: "Alpha" });
  expect(screen.queryByLabelText("Tint colours")).toBeNull();
});
