import {
  act,
  configure,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectedApp } from "./ConnectedApp";
import type { Snapshot } from "./publishedReport";

// The first render of the whole reader can pass the 1 s default on a busy machine.
configure({ asyncUtilTimeout: 5000 });

const EVIDENCE = {
  sources: [],
  unused: [],
  unrecorded: [],
  noSourcesModules: [],
  handoffs: [],
  zip: null,
  downloads: [],
  record: { hashes: [], instructions: [], calls: [], cap: null },
};

function snapshot(name = "Northbridge", withFigures = false): Snapshot {
  const id = "northbridge-2026/outputs/CP-1.md";
  const text = (line: number) => ({
    type: "text",
    line,
    end: line,
    text: `Sentence ${String(line)}.`,
  });
  return {
    catalogue: {
      real: [
        {
          id: "northbridge-2026",
          name,
          issuer: "Northbridge",
          title: "Full credit assessment",
          date: "2026-10-31",
          sector: "Industrials",
          period: "FY2026",
          metrics: {},
        },
      ],
    },
    workspace: {
      runs: {
        north: {
          folder: "northbridge-2026",
          issuer: "Northbridge",
          issuerKey: "northbridge-2026",
          title: "Full credit assessment",
          period: "FY2026",
          asOf: "2026-10-31",
          pathway: "credit_snapshot",
          modules: { "CP-1": { outputs: [id], default: id } },
          changes: { first_run: true },
          evidence: EVIDENCE,
        },
      },
      outputs: {
        [id]: {
          id,
          run: "north",
          module: "CP-1",
          label: "Financial foundation",
          href: id,
          sha256: "digest",
          state: { established: true, declared: null },
          ...(withFigures ? { charts: [{ title: "Leverage", table: 99, kind: "periods" }] } : {}),
        },
      },
      handoffs: {
        digest: [
          { heading: "Findings", level: 2, line: 5, blocks: [] },
          { heading: "Bottom line", level: 3, line: 10, blocks: [text(11)] },
          { heading: "Key findings", level: 3, line: 20, blocks: [text(21)] },
          { heading: "Limitations", level: 3, line: 30, blocks: [text(31)] },
        ],
      },
      models: [],
    },
    chips: {},
  } as unknown as Snapshot;
}

function useSnapshot(name?: string, withFigures?: boolean) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(Response.json(snapshot(name, withFigures)))),
  );
}

function open(hash: string) {
  window.history.replaceState(null, "", `/report/northbridge-2026${hash}`);
  render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
}

type Callback = (entries: { target: Element; isIntersecting: boolean }[]) => void;
const observers: { callback: Callback; observed: Element[]; options?: IntersectionObserverInit }[] =
  [];

class FakeObserver {
  private readonly record: (typeof observers)[number];
  constructor(callback: Callback, options?: IntersectionObserverInit) {
    this.record = { callback, observed: [], options };
    observers.push(this.record);
  }
  observe(target: Element) {
    this.record.observed.push(target);
  }
  disconnect() {
    this.record.observed = [];
  }
  unobserve() {}
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  observers.length = 0;
  window.history.replaceState(null, "", "/");
});

const sectionButtons = () =>
  within(screen.getByRole("list", { name: "On this page" })).getAllByRole("button");

function scrollSizes(main: HTMLElement, top: number, client: number, height: number) {
  Object.defineProperty(main, "scrollTop", { value: top, configurable: true });
  Object.defineProperty(main, "clientHeight", { value: client, configurable: true });
  Object.defineProperty(main, "scrollHeight", { value: height, configurable: true });
}

const marks = () => sectionButtons().map((button) => button.getAttribute("aria-current"));

describe("report wayfinding", () => {
  it("marks the section in the top third of the scroll container, and no other", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const live = observers.filter((item) => item.observed.length > 0);
    expect(live).toHaveLength(1);
    const [spy] = live;
    if (!spy) throw new Error("no observer");
    expect(spy.observed.map((node) => node.id)).toEqual(["finding-10", "finding-20", "finding-30"]);
    expect(spy.options?.root).toBe(screen.getByRole("main"));
    expect(spy.options?.rootMargin).toBe("0px 0px -66% 0px");
    const third = spy.observed[2];
    if (!third) throw new Error("no third section");
    act(() => {
      spy.callback([{ target: third, isIntersecting: true }]);
    });
    expect(sectionButtons().map((button) => button.getAttribute("aria-current"))).toEqual([
      null,
      null,
      "location",
    ]);
  });

  it("marks an entry nested in another when both cross the top third: the deepest wins", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot(undefined, true);
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const spy = observers.find((item) => item.observed.length > 0);
    if (!spy) throw new Error("no observer");
    const bottom = document.getElementById("finding-10");
    const figures = document.getElementById("module-figures");
    if (!bottom || !figures) throw new Error("targets missing");
    // The figures follow the prose passages and no longer sit inside the Bottom line section, so
    // nest them by hand to keep covering the rule for an entry that holds another.
    expect(bottom.contains(figures)).toBe(false);
    bottom.append(figures);
    act(() => {
      spy.callback([
        { target: bottom, isIntersecting: true },
        { target: figures, isIntersecting: true },
      ]);
    });
    expect(marks()).toEqual([null, null, "location", null]);
    act(() => {
      spy.callback([{ target: figures, isIntersecting: false }]);
    });
    expect(marks()).toEqual(["location", null, null, null]);
  });

  it("keeps a clicked entry until the reader scrolls, then lets the observer take over", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const spy = observers.find((item) => item.observed.length > 0);
    if (!spy) throw new Error("no observer");
    const [, second, third] = spy.observed;
    if (!second || !third) throw new Error("sections missing");
    third.scrollIntoView = vi.fn();
    fireEvent.click(sectionButtons()[2] as HTMLElement);
    act(() => {
      spy.callback([{ target: second, isIntersecting: true }]);
    });
    expect(marks()).toEqual([null, null, "location"]);
    act(() => {
      fireEvent.wheel(screen.getByRole("main"));
    });
    act(() => {
      spy.callback([{ target: second, isIntersecting: true }]);
    });
    expect(marks()).toEqual([null, "location", null]);
  });

  it("marks the last entry when the scroll container is at its bottom", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const spy = observers.find((item) => item.observed.length > 0);
    const first = spy?.observed[0];
    if (!spy || !first) throw new Error("no observer");
    const main = screen.getByRole("main");
    Object.defineProperty(main, "scrollTop", { value: 600, configurable: true });
    Object.defineProperty(main, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(main, "scrollHeight", { value: 1000, configurable: true });
    act(() => {
      spy.callback([{ target: first, isIntersecting: true }]);
    });
    act(() => {
      fireEvent.scroll(main);
    });
    expect(marks()).toEqual([null, null, "location"]);
  });

  it("selects the last entry when an observer notice follows the bottom scroll", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const spy = observers.find((item) => item.observed.length > 0);
    const first = spy?.observed[0];
    if (!spy || !first) throw new Error("no observer");
    const main = screen.getByRole("main");
    scrollSizes(main, 600, 400, 1000);
    act(() => {
      fireEvent.scroll(main);
    });
    act(() => {
      spy.callback([{ target: first, isIntersecting: true }]);
    });
    expect(marks()).toEqual([null, null, "location"]);
  });

  it("follows the observer when the container cannot scroll", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const spy = observers.find((item) => item.observed.length > 0);
    const first = spy?.observed[0];
    if (!spy || !first) throw new Error("no observer");
    scrollSizes(screen.getByRole("main"), 0, 800, 800);
    act(() => {
      spy.callback([{ target: first, isIntersecting: true }]);
    });
    expect(marks()).toEqual(["location", null, null]);
  });

  it("releases a clicked entry on a scrolling key pressed in the navigator", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const spy = observers.find((item) => item.observed.length > 0);
    const [, second, third] = spy?.observed ?? [];
    if (!spy || !second || !third) throw new Error("sections missing");
    third.scrollIntoView = vi.fn();
    const button = sectionButtons()[2] as HTMLElement;
    fireEvent.click(button);
    act(() => {
      fireEvent.keyDown(button, { key: "ArrowDown" });
    });
    act(() => {
      spy.callback([{ target: second, isIntersecting: true }]);
    });
    expect(marks()).toEqual([null, "location", null]);
  });

  it("releases a clicked entry when the reader presses the scrollbar", async () => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const spy = observers.find((item) => item.observed.length > 0);
    const [, second, third] = spy?.observed ?? [];
    if (!spy || !second || !third) throw new Error("sections missing");
    third.scrollIntoView = vi.fn();
    fireEvent.click(sectionButtons()[2] as HTMLElement);
    act(() => {
      fireEvent.pointerDown(screen.getByRole("main"));
    });
    act(() => {
      spy.callback([{ target: second, isIntersecting: true }]);
    });
    expect(marks()).toEqual([null, "location", null]);
  });

  it("renders the navigator and still activates an entry on click without IntersectionObserver", async () => {
    expect("IntersectionObserver" in globalThis).toBe(false);
    useSnapshot();
    open("#modules/CP-1");
    await screen.findByLabelText("Module");
    const second = sectionButtons()[1];
    if (!second) throw new Error("no second entry");
    for (const id of ["finding-10", "finding-20", "finding-30"]) {
      const target = document.getElementById(id);
      if (target) target.scrollIntoView = vi.fn();
    }
    fireEvent.click(second);
    expect(sectionButtons().map((button) => button.getAttribute("aria-current"))).toEqual([
      null,
      "location",
      null,
    ]);
  });

  it("marks Overview as the current tab on the calendar", async () => {
    useSnapshot();
    open("#calendar");
    const nav = await screen.findByRole("navigation", { name: "Report sections" });
    const current = within(nav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(current.map((link) => link.textContent)).toEqual(["Overview"]);
  });

  it("keeps the reader on Forecast when the skip link is activated", async () => {
    useSnapshot();
    open("#forecast");
    await screen.findByRole("navigation", { name: "Report sections" });
    // jsdom does not navigate to a fragment, so a hash or tab assertion cannot fail here. A
    // cancelled click is what stops a browser from changing the hash and so the tab.
    expect(fireEvent.click(screen.getByRole("link", { name: "Skip to content" }))).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  it("keeps the six report tabs at least 44px tall on a phone", async () => {
    useSnapshot();
    open("");
    const nav = await screen.findByRole("navigation", { name: "Report sections" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(6);
    for (const link of links) expect(link).toHaveClass("max-[480px]:min-h-11");
  });

  it("offers the History tab and no Report history link", async () => {
    useSnapshot();
    open("");
    const nav = await screen.findByRole("navigation", { name: "Report sections" });
    expect(within(nav).getByRole("link", { name: "History" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Report history" })).toBeNull();
  });

  it("titles the document by page and issuer, and restores it on unmount", async () => {
    useSnapshot("Caesars Entertainment");
    window.history.replaceState(null, "", "/report/northbridge-2026#forecast");
    const view = render(<ConnectedApp path="/report/northbridge-2026" mode="synthetic" />);
    await screen.findByRole("navigation", { name: "Report sections" });
    expect(document.title).toBe("Forecast — Caesars Entertainment — Credit OS");
    act(() => {
      window.location.hash = "#calendar";
    });
    await waitFor(() => {
      expect(document.title).toBe("Issuer calendar — Caesars Entertainment — Credit OS");
    });
    view.unmount();
    expect(document.title).toBe("Credit OS");
  });
});
