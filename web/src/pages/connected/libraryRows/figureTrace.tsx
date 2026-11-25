import { useCallback, useEffect, useRef, useState } from "react";
import { FileSearch02 } from "@untitledui/icons";
import type { Trace } from "@/pages/library/slice";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import {
  evidenceHref,
  outputEntries,
  resolveEvidenceLocation,
  type CatalogueRun,
  type Snapshot,
} from "../publishedReport";
import { headlineSources } from "../reportView";
import { traceForLine } from "../ReportContent";
import type { LoadSnapshot } from "./rowSnapshot";

function metricIdentity(metric: CatalogueRun["metrics"][string] | undefined) {
  const { value = null, unit = null, period = null } = metric ?? {};
  return JSON.stringify([value, unit, period]);
}

function catalogueMetric(snapshot: Snapshot, id: string, key: string) {
  const matches = snapshot.catalogue.real.filter((item) => item.id === id);
  return matches.length === 1 ? matches[0]?.metrics[key] : undefined;
}

function resolveFigureSource(snapshot: Snapshot, catalogue: CatalogueRun, key: string) {
  const matches = Object.entries(snapshot.workspace.runs).filter(
    ([, run]) => run.folder === catalogue.id,
  );
  const [match] = matches;
  if (!match || matches.length !== 1) return null;
  const [routeKey, run] = match;
  const entries = outputEntries(snapshot, run, routeKey);
  const foundations = entries.filter((entry) => entry.selected && entry.output.module === "CP-1");
  if (foundations.length !== 1) return null;
  const source = headlineSources(foundations[0], catalogue, run.folder)[key];
  return source ? { entries, source, folder: run.folder } : null;
}

/** The handoff row a library figure is read from, in the run's own report (read once per row). */
async function figureSource(catalogue: CatalogueRun, key: string, load: LoadSnapshot) {
  const snapshot = await load(catalogue.id);
  if (!snapshot) return null;
  if (
    metricIdentity(catalogueMetric(snapshot, catalogue.id, key)) !==
    metricIdentity(catalogue.metrics[key])
  )
    return null;
  const result = resolveFigureSource(snapshot, catalogue, key);
  if (!result) return null;
  const { entries, source, folder } = result;
  const prefix = evidenceHref(folder, "");
  if (!source.href.startsWith(prefix)) return null;
  const location = resolveEvidenceLocation(entries, source.href.slice(prefix.length));
  if (!location || location.line === undefined) return null;
  const trace = traceForLine(snapshot, location.entry, location.index, location.line);
  return trace ? { trace, href: source.href } : null;
}

type Lookup = {
  scope: string;
  key?: string;
  name?: string;
  trace?: Trace;
  href?: string;
  error?: string;
};

const NO_ROW =
  "The original source row for this figure is not available in this run’s published record.";
const NOT_LOADED = "Sources for this figure could not be loaded. Try its source control again.";

/**
 * One trace lookup for a run's row figures. `button(key, name)` is the figure's single source
 * control; `notes` draws the loading or failure sentence and the drawer once for the row.
 */
export function useFigureTrace(catalogue: CatalogueRun, load: LoadSnapshot) {
  const scope = `${catalogue.id}:${JSON.stringify(catalogue.metrics)}`;
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [scope],
  );
  const request = useCallback(
    async (key: string, name: string) => {
      controller.current?.abort();
      const own = new AbortController();
      controller.current = own;
      setLookup({ scope, key, name });
      try {
        const found = await figureSource(catalogue, key, load);
        if (own.signal.aborted) return;
        setLookup(found ? { scope, ...found } : { scope, error: NO_ROW });
      } catch {
        if (!own.signal.aborted) setLookup({ scope, error: NOT_LOADED });
      }
    },
    [catalogue, scope, load],
  );
  const active = lookup?.scope === scope ? lookup : null;
  const button = (key: string, name: string, owner: string) => (
    <button
      type="button"
      aria-label={`Show sources for ${name}, ${owner}`}
      title="Show sources"
      onClick={() => {
        void request(key, name);
      }}
      className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-ds-sm border border-transparent text-text-tertiary outline-focus-ring hover:border-border-control hover:bg-action-subtle hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:size-11"
    >
      <FileSearch02 aria-hidden="true" className="size-4" />
    </button>
  );
  const notes = (
    <>
      {active?.key && !active.trace && !active.error && (
        <p role="status" className="text-caption text-text-secondary">
          Loading sources for {active.name}…
        </p>
      )}
      {active?.error && (
        <p role="status" className="text-caption text-text-secondary">
          {active.error}
        </p>
      )}
      {active?.trace && active.href && (
        <TraceDrawer
          trace={active.trace}
          evidenceHref={active.href}
          isOpen
          onClose={() => {
            setLookup({ scope });
          }}
        />
      )}
    </>
  );
  return { button, notes };
}
