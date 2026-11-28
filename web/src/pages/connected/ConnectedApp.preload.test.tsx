import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConnectedLoadBoundary } from "../../ConnectedLoadBoundary";
import { askAhead, LIBRARY_ADDRESS, requestAhead, snapshotAddress } from "./ahead";
import { ConnectedApp, preloadPage } from "./ConnectedApp";

const INDEX = { catalogue: { real: [] }, workspace: { runs: {} } };

// The run activity page's file cannot be loaded; every other page loads.
vi.mock("./RunActivity", () => {
  throw new Error("page file unavailable");
});

function serve() {
  const fetch = vi.fn<(address: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(Response.json(INDEX)),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.title = "Credit OS";
});

it("asks for nothing a read-only preview does not draw, nor at an address with no page", async () => {
  const fetch = serve();
  await preloadPage("/start", true);
  await preloadPage("/runs/", true);
  await preloadPage("/run/abc", true);
  await preloadPage("/nowhere", false);
  await preloadPage("/report/..%2Fx", false);
  expect(fetch).not.toHaveBeenCalled();
  render(<ConnectedApp path="/start" mode="synthetic" readOnly />);
  expect(screen.getByRole("heading", { level: 1, name: "Start run" })).toBeVisible();
  expect(
    screen.getByText(
      "This preview has no Credit OS service behind it, so it cannot start or follow a run. Library and Coverage show the saved reports.",
    ),
  ).toBeVisible();
});

it("draws a page loaded ahead in the first drawing, with no loading state, and reads its index once", async () => {
  const fetch = serve();
  await preloadPage("/", false);
  expect(fetch.mock.calls).toEqual([[LIBRARY_ADDRESS, { cache: "no-store" }]]);
  render(<ConnectedApp path="/" mode="synthetic" />);
  expect(screen.queryByRole("status", { name: "Loading this page" })).toBeNull();
  expect(screen.getByRole("heading", { level: 1, name: "Library" })).toBeVisible();
  expect(await screen.findByText("No reports yet")).toBeVisible();
  expect(fetch).toHaveBeenCalledOnce();
});

it("asks ahead for a report's snapshot only once the report page has loaded", async () => {
  const fetch = serve();
  const loaded = preloadPage("/report/acme%202026", true);
  expect(fetch).not.toHaveBeenCalled();
  await loaded;
  expect(fetch.mock.calls.map(([address]) => address)).toEqual([
    "/connected/snapshot?run=acme%202026",
  ]);
  expect(snapshotAddress()).toBe("/connected/snapshot");
});

it("fails in the first drawing when the page asked for ahead could not be loaded, and reads nothing", async () => {
  const fetch = serve();
  const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
  try {
    await preloadPage("/runs", false);
    render(
      <ConnectedLoadBoundary>
        <ConnectedApp path="/runs" mode="synthetic" />
      </ConnectedLoadBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This page could not be loaded. Reload to try again.",
    );
    // The application was never drawn, so the address's title was never set.
    expect(document.title).toBe("Credit OS");
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    errors.mockRestore();
  }
});

it("gives an answer asked for ahead to the first request only", async () => {
  const fetch = serve();
  askAhead(LIBRARY_ADDRESS);
  const { signal } = new AbortController();
  const first = requestAhead(LIBRARY_ADDRESS, signal);
  expect(fetch).toHaveBeenCalledOnce();
  await expect(first.then((response) => response.json())).resolves.toEqual(INDEX);
  await requestAhead(LIBRARY_ADDRESS, signal);
  expect(fetch.mock.calls[1]).toEqual([LIBRARY_ADDRESS, { cache: "no-store", signal }]);
});

it("reports a failed read ahead to the page that takes it", async () => {
  vi.stubGlobal("fetch", () => Promise.reject(new TypeError("Failed to fetch")));
  askAhead(LIBRARY_ADDRESS);
  await expect(requestAhead(LIBRARY_ADDRESS, new AbortController().signal)).rejects.toThrow(
    "Failed to fetch",
  );
});
