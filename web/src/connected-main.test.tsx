// How the page the application server writes switches Signal on: `<meta name="credit-os-signal"
// content="on">`, written exactly when the server hosts Signal. Nothing else does.
import { afterEach, describe, expect, it, vi } from "vitest";

const drawn = vi.hoisted(() => ({
  app: [] as { signal: boolean }[],
  preload: [] as boolean[],
}));

vi.mock("./pages/connected/ConnectedApp", () => ({
  ConnectedApp: ({ signal }: { signal: boolean }) => {
    drawn.app.push({ signal });
    return <p>Application drawn</p>;
  },
  preloadPage: (_path: string, _readOnly: boolean, signal: boolean) => {
    drawn.preload.push(signal);
    return Promise.resolve();
  },
}));

/** Starts the entry on a page whose head holds `metas`, and gives back what it drew with. */
async function start(metas: string): Promise<{ app: boolean[]; preload: boolean[] }> {
  vi.resetModules();
  drawn.app.length = 0;
  drawn.preload.length = 0;
  document.head.innerHTML = metas;
  document.body.innerHTML = '<div id="root"></div>';
  await import("./connected-main");
  await vi.waitFor(() => {
    expect(document.getElementById("root")).toHaveTextContent("Application drawn");
  });
  return { app: drawn.app.map(({ signal }) => signal), preload: drawn.preload };
}

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("the Signal switch the server writes into the page", () => {
  it("is on when the page carries the meta with content on", async () => {
    const got = await start('<meta name="credit-os-signal" content="on">');
    expect(got.preload).toEqual([true]);
    expect(new Set(got.app)).toEqual(new Set([true]));
  });

  it.each([
    ["no meta", ""],
    ["another content", '<meta name="credit-os-signal" content="off">'],
    ["an empty content", '<meta name="credit-os-signal" content="">'],
    ["the content in capitals", '<meta name="credit-os-signal" content="ON">'],
    ["the old address meta", '<meta name="credit-os-signal-url" content="http://127.0.0.1:8765">'],
  ])("is off with %s", async (_, metas) => {
    const got = await start(metas);
    expect(got.preload).toEqual([false]);
    expect(new Set(got.app)).toEqual(new Set([false]));
  });

  it("is on when the meta is written twice", async () => {
    const on = '<meta name="credit-os-signal" content="on">';
    const got = await start(on + on);
    expect(got.preload).toEqual([true]);
    expect(new Set(got.app)).toEqual(new Set([true]));
  });
});
