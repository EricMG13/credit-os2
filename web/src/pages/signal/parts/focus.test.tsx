import { renderHook } from "@testing-library/react";
import { focusAgainIfLost, useOnGone, useOpener } from "./focus";

// Frames are queued by a test double for requestAnimationFrame and run by hand, one generation at
// a time, so a test can move focus between the first and the second frame.
let queue: FrameRequestCallback[] = [];
const nextFrame = () => {
  const now = queue;
  queue = [];
  now.forEach((cb) => {
    cb(0);
  });
};
function button(label: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = label;
  document.body.append(b);
  return b;
}

beforeEach(() => {
  queue = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => queue.push(cb));
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("focusAgainIfLost", () => {
  it("focuses the target at once, before any frame", () => {
    const target = button("target");
    focusAgainIfLost(() => target);
    expect(document.activeElement).toBe(target);
  });

  it("refocuses a target that fell to the page, only after the second frame", () => {
    const target = button("target");
    focusAgainIfLost(() => target);
    target.blur();
    expect(document.activeElement).toBe(document.body);
    nextFrame();
    expect(document.activeElement).toBe(document.body);
    nextFrame();
    expect(document.activeElement).toBe(target);
  });

  it("leaves focus alone when it has moved to another element", () => {
    const target = button("target");
    const other = button("other");
    focusAgainIfLost(() => target);
    other.focus();
    nextFrame();
    nextFrame();
    expect(document.activeElement).toBe(other);
  });

  it("looks the target up again at the second frame", () => {
    const first = button("first");
    const second = button("second");
    let current = first;
    focusAgainIfLost(() => current);
    first.blur();
    current = second;
    nextFrame();
    nextFrame();
    expect(document.activeElement).toBe(second);
  });

  it("with a home, takes focus back from an element outside it after the second frame", () => {
    const home = document.createElement("div");
    document.body.append(home);
    const target = document.createElement("button");
    home.append(target);
    const outside = button("outside");
    focusAgainIfLost(
      () => target,
      () => home,
    );
    outside.focus(); // as the dialog library's late restore can do
    nextFrame();
    expect(document.activeElement).toBe(outside);
    nextFrame();
    expect(document.activeElement).toBe(target);
  });

  it("with a home, takes focus back from an element taken off the page", () => {
    const home = document.createElement("div");
    document.body.append(home);
    const target = document.createElement("button");
    const gone = document.createElement("button");
    home.append(target, gone);
    focusAgainIfLost(
      () => target,
      () => home,
    );
    gone.focus();
    gone.remove(); // a removed comment's Remove goes while it holds focus
    nextFrame();
    nextFrame();
    expect(document.activeElement).toBe(target);
  });

  it("with a home, leaves focus on another element inside it", () => {
    const home = document.createElement("div");
    document.body.append(home);
    const target = document.createElement("button");
    const other = document.createElement("button");
    home.append(target, other);
    focusAgainIfLost(
      () => target,
      () => home,
    );
    other.focus();
    nextFrame();
    nextFrame();
    expect(document.activeElement).toBe(other);
  });

  it("does nothing, and does not throw, when there is no target", () => {
    focusAgainIfLost(() => null);
    nextFrame();
    nextFrame();
    expect(document.activeElement).toBe(document.body);
  });
});

describe("useOnGone", () => {
  it("runs the latest callback once on unmount, not the first one and not on mount or rerender", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ cb }) => {
        useOnGone(cb);
      },
      { initialProps: { cb: first } },
    );
    rerender({ cb: latest });
    expect(first).not.toHaveBeenCalled();
    expect(latest).not.toHaveBeenCalled();
    unmount();
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });
});

describe("useOpener", () => {
  it("gives focus back to the control that opened the dialog", () => {
    const opener = button("opener");
    const fallback = button("fallback");
    const { result } = renderHook(() => useOpener(() => fallback));
    opener.focus();
    result.current.remember();
    fallback.focus();
    result.current.restore();
    expect(document.activeElement).toBe(opener);
  });

  it("once told to forget, gives focus to the fallback even while the opener is on the page", () => {
    const opener = button("opener");
    const fallback = button("fallback");
    const { result } = renderHook(() => useOpener(() => fallback));
    opener.focus();
    result.current.remember();
    result.current.forget();
    result.current.restore();
    expect(document.activeElement).toBe(fallback);
  });
});
