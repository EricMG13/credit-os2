// Signal in the connected app: the rail item and the page at /signal exist only where the server
// was started with a Signal service, and never in a read-only preview.
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import sample from "../signal/live/snapshot.sample.json";
import { ConnectedApp, preloadPage } from "./ConnectedApp";

function serve() {
  const fetch = vi.fn<(address: string, init?: RequestInit) => Promise<Response>>((address) =>
    Promise.resolve(
      Response.json(
        address === "/signal/api/snapshot" ? sample : { catalogue: { real: [] }, workspace: {} },
      ),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const rail = () => within(screen.getByRole("navigation", { name: "Areas" }));
const areas = () =>
  rail()
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.location.hash = "";
  document.title = "Credit OS";
});

describe("with a Signal service", () => {
  it.each(["/signal", "/signal/"])("draws the Signal screens at %s, edge to edge", async (path) => {
    const fetch = serve();
    // As connected-main starts the app: the page's file is asked for before the app is drawn.
    await preloadPage(path, false, true);
    render(<ConnectedApp path={path} mode="live" signal />);
    expect(await screen.findByRole("heading", { level: 1, name: "For you" })).toBeVisible();
    expect(document.title).toBe("Signal — Credit OS");
    expect(areas()).toEqual([
      ["Library", "/"],
      ["Coverage", "/coverage"],
      ["Run activity", "/runs"],
      ["Signal", "/signal"],
    ]);
    expect(rail().getByRole("link", { name: "Signal" })).toHaveAttribute("aria-current", "page");
    expect(rail().getByRole("link", { name: "Library" })).not.toHaveAttribute("aria-current");
    // The frame fills the page region: the shell leaves its padding out, as in the design reference.
    expect(screen.getByRole("main").className).not.toMatch(/\bp-\d/);
    expect(fetch.mock.calls.map(([address]) => address)).toEqual(["/signal/api/snapshot"]);
  });

  it("lists Signal on the other pages, where it is not the current area", async () => {
    serve();
    render(<ConnectedApp path="/" mode="live" signal />);
    await screen.findByText("No reports yet");
    expect(rail().getByRole("link", { name: "Signal" })).toHaveAttribute("href", "/signal");
    expect(rail().getByRole("link", { name: "Signal" })).not.toHaveAttribute("aria-current");
    expect(rail().getByRole("link", { name: "Library" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("main").className).toMatch(/\bp-4\b/);
  });

  it("asks ahead for the page's file only: the snapshot is read by the page", async () => {
    const fetch = serve();
    await preloadPage("/signal", false, true);
    expect(fetch).not.toHaveBeenCalled();
    render(<ConnectedApp path="/signal" mode="live" signal />);
    expect(screen.queryByRole("status", { name: "Loading this page" })).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Signal" })).toBeVisible();
  });
});

describe("without one", () => {
  it.each([
    ["no service is set", { signal: false, readOnly: false }],
    ["the app is a read-only preview", { signal: true, readOnly: true }],
  ])("has no rail item and no page at /signal when %s", async (_, flags) => {
    const fetch = serve();
    await preloadPage("/signal", flags.readOnly, flags.signal);
    render(<ConnectedApp path="/signal" mode="live" {...flags} />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    expect(rail().queryByRole("link", { name: "Signal" })).toBeNull();
    expect(screen.getByRole("main").className).toMatch(/\bp-4\b/);
    expect(fetch).not.toHaveBeenCalled();
  });
});
