import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * The measured pixel width of the element `ref` is put on, kept current with a ResizeObserver.
 * Where there is none (jsdom, very old browsers) or before the first measure, it is `fallback`.
 * A figure draws its SVG with `viewBox="0 0 {width} {height}"`, so one unit is one pixel and its
 * text is drawn at its real size at every width.
 */
export function useFigureWidth(fallback: number): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const take = (measured: number) => {
      const whole = Math.floor(measured);
      if (whole > 0) setWidth(whole);
    };
    take(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([found]) => {
      if (found) take(found.contentRect.width);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return [ref, width];
}

/**
 * Whether the element `ref` is put on is narrower than its content (`scrollWidth > clientWidth`),
 * kept current with a ResizeObserver on the box and its first child. Without one (jsdom) it is
 * false: a box that cannot be measured is not made a tab stop.
 */
export function useOverflows(): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const check = () => {
      setOverflows(element.scrollWidth > element.clientWidth + 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => {
      observer.disconnect();
    };
  }, []);
  return [ref, overflows];
}
