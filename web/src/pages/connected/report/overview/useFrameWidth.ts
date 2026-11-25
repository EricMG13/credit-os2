import { useEffect, useState } from "react";

/** The frame's width in pixels once laid out; null before then. A callback ref, so a frame that
 * appears after the first render is measured too. */
export function useFrameWidth() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver(([item]) => {
      setMeasured(item?.contentRect.width ?? null);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [node]);
  return { frame: setNode, measured };
}

/** The attributes of a frame that scrolls sideways: a named region a keyboard can focus to scroll. */
export const scrollRegion = (scrolls: boolean, label: string) =>
  scrolls ? { role: "region", "aria-label": label, tabIndex: 0 } : {};
