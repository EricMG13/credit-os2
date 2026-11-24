// Whether the Signal frame has room for the channel list as a column beside the page.
import { useSyncExternalStore } from "react";

/**
 * 1024px: the shell's side rail (68px, there from 768px), the channel list (256px) and a page
 * region of 700px, the least the pages' wide layout needs. So the page region is at least 700px
 * wide at every width from 768px, whichever side of this the window is on; below 768px the shell's
 * rail is a bar along the bottom and the page region is the window's width.
 */
const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => undefined;
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => {
    list.removeEventListener("change", onChange);
  };
}

/** Where the width cannot be asked (a test's document), the wide layout is drawn. */
const isWide = () => typeof window.matchMedia !== "function" || window.matchMedia(QUERY).matches;

export function useWide(): boolean {
  return useSyncExternalStore(subscribe, isWide);
}
