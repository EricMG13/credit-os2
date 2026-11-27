import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useResource } from "../useResource";

export interface PortfolioBasis {
  folder: string;
  output: string;
  sha256: string;
  asOf: string;
  tableLines: number[];
}

type Answer = { basis: PortfolioBasis | null; loading: boolean; failed: boolean };

const NO_BASIS: Answer = { basis: null, loading: false, failed: false };
const LOADING: Answer = { basis: null, loading: true, failed: false };
const FAILED: Answer = { basis: null, loading: false, failed: true };

const Context = createContext<Answer>(NO_BASIS);

export function usePortfolioBasis() {
  return useContext(Context).basis;
}

/** True from the request for the basis until it answers; no basis is claimed or denied meanwhile. */
export function usePortfolioBasisLoading() {
  return useContext(Context).loading;
}

/** True when the request for the basis failed: the basis is unknown, not absent. */
export function usePortfolioBasisFailed() {
  return useContext(Context).failed;
}

/** What one request found; `asked` is false for the disabled load, which says nothing. */
type Result = { folder: string; asked: boolean; basis: PortfolioBasis | null; failed: boolean };

/** A failed request is logged and returned as a failed result, never read as "no basis". */
function failure(folder: string, detail: unknown): Result {
  console.error("The portfolio basis could not be loaded", { folder, detail });
  return { folder, asked: true, basis: null, failed: true };
}

export function PortfolioBasisProvider({
  folder,
  enabled,
  children,
}: {
  folder: string;
  enabled: boolean;
  children: ReactNode;
}) {
  const load = useCallback(
    async (signal: AbortSignal): Promise<Result> => {
      if (!enabled) return { folder, asked: false, basis: null, failed: false };
      try {
        const response = await fetch(`/connected/portfolio/${encodeURIComponent(folder)}`, {
          signal,
          cache: "no-store",
        });
        if (response.status === 404) return { folder, asked: true, basis: null, failed: false };
        if (!response.ok) return failure(folder, { status: response.status });
        const { basis } = (await response.json()) as { basis: PortfolioBasis | null };
        return { folder, asked: true, basis, failed: false };
      } catch (error) {
        if (signal.aborted) throw error;
        return failure(folder, error);
      }
    },
    [folder, enabled],
  );
  const { value } = useResource(load);
  const answer = useMemo<Answer>(() => {
    if (!enabled) return NO_BASIS;
    if (value?.folder !== folder || !value.asked) return LOADING;
    if (value.failed) return FAILED;
    return {
      basis: value.basis?.folder === folder ? value.basis : null,
      loading: false,
      failed: false,
    };
  }, [enabled, value, folder]);
  return <Context.Provider value={answer}>{children}</Context.Provider>;
}
