// How the page the application server writes switches Signal on: `<meta name="credit-os-signal"
// content="on">`, written exactly when the server hosts Signal. No other meta, content or old name switches it on.
import { act } from "react";
import type * as ReactDomClient from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const drawn = vi.hoisted(() => ({
  app: [] as { signal: boolean; signIn: boolean }[],
  preload: [] as boolean[],
  roots: [] as ReactDomClient.Root[],
}));

// Every root the entry makes is kept, so that each test can unmount what it started.
vi.mock("react-dom/client", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactDomClient>();
  return {
    ...actual,
    createRoot: (...args: Parameters<typeof actual.createRoot>) => {
      const root = actual.createRoot(...args);
      drawn.roots.push(root);
      return root;
    },
  };
});

vi.mock("./pages/connected/ConnectedApp", () => ({
  ConnectedApp: ({ signal, signIn }: { signal: boolean; signIn: boolean }) => {
    drawn.app.push({ signal, signIn });
    return <p>Application drawn</p>;
  },
  preloadPage: (_path: string, _readOnly: boolean, signal: boolean) => {
    drawn.preload.push(signal);
    return Promise.resolve();
  },
}));

/** Starts the entry on a page whose head holds `metas`, and gives back what it drew with. */
async function start(
  metas: string,
): Promise<{ app: { signal: boolean; signIn: boolean }[]; preload: boolean[] }> {
  vi.resetModules();
  drawn.app.length = 0;
  drawn.preload.length = 0;
  document.head.innerHTML = metas;
  document.body.innerHTML = '<div id="root"></div>';
  await import("./connected-main");
  await vi.waitFor(() => {
    expect(document.getElementById("root")).toHaveTextContent("Application drawn");
  });
  return { app: [...drawn.app], preload: drawn.preload };
}

// The entry holds the loading state for a timer; it is faked so none outlives its test.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  act(() => {
    for (const root of drawn.roots.splice(0)) root.unmount();
  });
  vi.clearAllTimers();
  vi.useRealTimers();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("the Signal switch the server writes into the page", () => {
  it("is on when the page carries the meta with content on", async () => {
    const got = await start('<meta name="credit-os-signal" content="on">');
    expect(got.preload).toEqual([true]);
    expect(new Set(got.app.map(({ signal }) => signal))).toEqual(new Set([true]));
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
    expect(new Set(got.app.map(({ signal }) => signal))).toEqual(new Set([false]));
  });

  it("enables account controls only for the exact sign-in meta", async () => {
    const enabled = await start('<meta name="credit-os-sign-in" content="on">');
    expect(enabled.app.every(({ signIn }) => signIn)).toBe(true);

    for (const metas of [
      "",
      '<meta name="credit-os-sign-in" content="off">',
      '<meta name="credit-os-sign-in" content="ON">',
    ]) {
      const disabled = await start(metas);
      expect(disabled.app.every(({ signIn }) => !signIn)).toBe(true);
    }
  });
});
