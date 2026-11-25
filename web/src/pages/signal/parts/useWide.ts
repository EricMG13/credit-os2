// Whether the Signal frame has room for the channel list as a column beside the page.
import { useSyncExternalStore } from "react";

/**
 * 960px: the page gutter (32px), the channel list (256px), the gap to the page (16px), a page of
 * 624px and the gutter again (32px). 624px is the least the pages' wide layout needs: the feed's
 * kind tabs and its search on one row, and the sources table (600px) with no sideways scroll. The
 * shell has no side rail, so nothing else stands beside the list. Below 960px the page takes the
 * whole region and the list opens from the Channels button.
 */
const QUERY = "(min-width: 960px)";

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
