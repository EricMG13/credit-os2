import { useEffect, useState } from "react";

/** The least on-screen size of any text in a figure, in pixels (the ramp's caption step). */
export const LEAST_TEXT = 12;

/**
 * A figure drawn in a fixed viewBox scales with its frame, and so does its text. This measures the
 * rendered width against `viewWidth` and gives font sizes in user units that draw at the asked
 * size on screen (never under 12 px): `font(12)` is 12 px whether the figure is drawn at two-thirds
 * or twice its viewBox. Before layout the size is as asked.
 */
export function useSvgScale(viewWidth: number) {
  const [node, setNode] = useState<SVGSVGElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver(([item]) => {
      const width = item?.contentRect.width;
      if (width) setScale(width / viewWidth);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [node, viewWidth]);
  const font = (px: number = LEAST_TEXT) => Math.max(px, LEAST_TEXT) / scale;
  return { ref: setNode, font, scale };
}
