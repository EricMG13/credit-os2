// A source's logo, where the page has one to draw in place of the source's letters. The image is
// never an address of the source's own: it is a `data:` URL the page builds from bytes the service
// stored (live/logos.ts) or the design fixture carries, so nothing is loaded from any other site
// and the app's content policy (images from its own origin or `data:` only) holds.
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

/** What a tile needs to know of its source: which one it is, and whether the service holds a logo for it. */
export type LogoOf = { id: string | null; logo: boolean };

/**
 * Where logos come from. `read` gives a source's logo as a `data:` URL, or null while it is not
 * known or there is none; `want` says a tile is drawing that source (the store may then ask for
 * it, once); `subscribe` tells one tile when its own source's logo arrives or goes; `broken` says
 * the browser could not draw the image, so no other tile of that source tries it.
 */
export type LogoStore = {
  read: (id: string) => string | null;
  want: (id: string) => void;
  subscribe: (id: string, listener: () => void) => () => void;
  broken: (id: string) => void;
};

/** Null where there are no logos at all: every tile draws its letters. */
export const SignalLogosContext = createContext<LogoStore | null>(null);

/** Logos held from the start (the design fixture's): nothing is asked of anyone. */
export function heldLogos(urls: Readonly<Record<string, string>>): LogoStore {
  return {
    read: (id) => (Object.hasOwn(urls, id) ? (urls[id] ?? null) : null),
    want: () => undefined,
    subscribe: () => () => undefined,
    // Nothing is kept: the tile that could not draw it goes back to its letters by itself.
    broken: () => undefined,
  };
}

const NEVER = () => () => undefined;

/**
 * The logo to draw for a source (`url`), or null for its letters: while the logo is on its way,
 * when the service holds none, and where the source is not said to have one. Only the tiles of
 * that source are drawn again when its logo arrives. `broken` is for the image's own error.
 */
export function useLogo(source: LogoOf | null | undefined): {
  url: string | null;
  broken: () => void;
} {
  const store = useContext(SignalLogosContext);
  const id = store !== null && source?.logo === true ? source.id : null;
  useEffect(() => {
    if (id !== null) store?.want(id);
  }, [store, id]);
  const url = useSyncExternalStore(
    id === null || store === null ? NEVER : (listener) => store.subscribe(id, listener),
    () => (id === null || store === null ? null : store.read(id)),
  );
  return {
    url,
    broken: () => {
      if (id !== null) store?.broken(id);
    },
  };
}
