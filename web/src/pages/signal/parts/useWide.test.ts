// The width the channel list returns beside the page at, asked of the window (parts/useWide.ts).
import { act, renderHook } from "@testing-library/react";
import { useWide } from "./useWide";

describe("useWide", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is true where the width cannot be asked", () => {
    expect(renderHook(() => useWide()).result.current).toBe(true);
  });

  it("asks for 960px: the gutter, the 256px list, the gap, a 624px page and the gutter", () => {
    // Kept apart from the hook's own constant: 32 + 256 + 16 + 624 + 32.
    const least = 32 + 256 + 16 + 624 + 32;
    const asked: string[] = [];
    vi.stubGlobal("matchMedia", (query: string) => {
      asked.push(query);
      return {
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      };
    });
    const { result } = renderHook(() => useWide());
    expect(result.current).toBe(false);
    expect(new Set(asked)).toEqual(new Set([`(min-width: ${String(least)}px)`]));
    expect(least).toBe(960);
  });

  it("follows the window across the breakpoint and stops listening when it is gone", () => {
    const listeners = new Set<() => void>();
    const list = {
      matches: false,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    };
    vi.stubGlobal("matchMedia", () => list);
    const { result, unmount } = renderHook(() => useWide());
    expect(result.current).toBe(false);
    act(() => {
      list.matches = true;
      for (const listener of listeners) listener();
    });
    expect(result.current).toBe(true);
    unmount();
    expect(listeners.size).toBe(0);
  });
});
