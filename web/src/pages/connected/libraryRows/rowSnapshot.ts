import { useCallback, useEffect, useRef } from "react";
import { getSnapshot, type Snapshot } from "../publishedReport";

/**
 * A row's scoped reports, each read at most once for the row's life: the next-event lookup and a
 * figure's trace share one request. A failed read is forgotten so the next ask tries again.
 */
export function useScopedSnapshots() {
  const cache = useRef(new Map<string, Promise<Snapshot | null>>());
  const life = useRef<AbortController | null>(null);
  useEffect(() => {
    const own = new AbortController();
    life.current = own;
    return () => {
      own.abort();
    };
  }, []);
  return useCallback((folder: string) => {
    const known = cache.current.get(folder);
    if (known) return known;
    const read = getSnapshot((life.current ?? new AbortController()).signal, folder);
    cache.current.set(folder, read);
    read.catch(() => {
      cache.current.delete(folder);
    });
    return read;
  }, []);
}

export type LoadSnapshot = ReturnType<typeof useScopedSnapshots>;
