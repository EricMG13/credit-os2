import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Coverage } from "./Coverage";
import type { Coverage as Data } from "./coverageData";

const run = (key: string) => ({
  key: `${key}1`,
  folder: `${key}-run`,
  asOf: "2026-03-31",
  pathway: "credit_snapshot",
  pathwayTitle: "Full credit assessment",
  cells: { "CP-1": { state: "assessed" as const } },
  other: [],
});
const data: Data = {
  columns: [{ code: "CP-1", title: "Canonical data foundation" }],
  issuers: [
    { key: "alpha", name: "Alpha plc", sector: "Aerospace", runs: [run("alpha")] },
    { key: "beta", name: "Beta SA", sector: "Retail", runs: [run("beta")] },
  ],
  fields: [],
  facts: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/coverage");
  window.localStorage.clear();
});

function answer() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(data), { status: 200 }))),
  );
}

test("an issuer brought back by the search does not take focus from the search box", async () => {
  answer();
  render(<Coverage />);
  fireEvent.click(await screen.findByRole("button", { name: "Alpha plc" }));
  await waitFor(() => {
    expect(document.activeElement).toHaveTextContent("Alpha plc");
  });
  const search = screen.getByRole("searchbox");
  fireEvent.change(search, { target: { value: "beta" } });
  expect(screen.queryByRole("button", { name: "Alpha plc" })).toBeNull();
  search.focus();
  fireEvent.change(search, { target: { value: "" } });
  expect(await screen.findByRole("button", { name: "Alpha plc" })).toBeInTheDocument();
  expect(document.activeElement).toBe(search);
  expect(screen.queryByRole("region", { name: "Alpha plc" })).toBeNull();
});

test("opening another issuer while one is open moves focus to its heading", async () => {
  answer();
  render(<Coverage />);
  fireEvent.click(await screen.findByRole("button", { name: "Alpha plc" }));
  await waitFor(() => {
    expect(document.activeElement).toHaveTextContent("Alpha plc");
  });
  const beta = screen.getByRole("button", { name: "Beta SA" });
  beta.focus();
  fireEvent.click(beta);
  await waitFor(() => {
    expect(document.activeElement?.tagName).toBe("H3");
    expect(document.activeElement).toHaveTextContent("Beta SA");
  });
});
