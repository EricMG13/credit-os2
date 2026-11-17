import { Missing } from "@/components/gap/Missing";
import { FileSearch02 } from "@untitledui/icons";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import type { Trace } from "@/pages/library/slice";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import type { CatalogueRun } from "./publishedReport";
import { containsReference, readerText, withUnit } from "./publishedReport";
import { PublishedSource } from "./report/PublishedTrace";
import { YearChange } from "./report/YearChange";
import { stated, type HeadlineSource } from "./reportView";

const metricLabels = [
  ["net_leverage", "Net leverage"],
  ["leverage", "Gross leverage"],
  ["coverage", "Interest coverage"],
  ["revenue", "Revenue"],
  ["adjusted_ebitda", "Adjusted EBITDA"],
  ["cash", "Cash"],
] as const;

const tile = `${TRACE_HOST} rounded-ds-md border border-border-hairline bg-surface-card p-4`;
/** The label leaves room for the control at the tile's top right. */
const label = (traceable: boolean) => `text-sm text-text-secondary${traceable ? " pr-9" : ""}`;

/** The one trace control of a tile, when the handoff row it is read from is known. */
function TileSource({
  name,
  source,
  onRequest,
  loading,
}: {
  name: string;
  source?: HeadlineSource;
  onRequest?: () => void;
  loading?: boolean;
}) {
  if (onRequest)
    return (
      <dd className="absolute top-3.5 right-3.5">
        <Button
          aria-label={`Show sources for ${name}`}
          iconLeading={FileSearch02}
          color="tertiary"
          size="sm"
          onPress={onRequest}
          isDisabled={loading}
        />
      </dd>
    );
  return source ? (
    <dd className="absolute top-3.5 right-3.5">
      <PublishedSource href={source.href} name={name}>
        Source
      </PublishedSource>
    </dd>
  ) : null;
}

/** Delivery's own words for a figure the tile does not quote: they say nothing of the module. */
const NOT_SHOWN = "Not shown here";

/**
 * What a gap tile says. The module's own reason only where the handoff row it was looked up in
 * says `Not supplied`; a reason that carries a source reference is left to the trace drawer. Any
 * other tile, the card that holds only the catalogue included, says only that it shows no figure:
 * the catalogue also lacks a figure the module supplied but it could not quote.
 */
function gapWords(source?: HeadlineSource) {
  if (source?.reason === undefined) return NOT_SHOWN;
  return containsReference(source.reason) ? "Not supplied" : readerText(source.reason);
}

/** A figure the tile does not quote: n.a. in its place, never a zero, with the trace to its row. */
function GapTile({
  name,
  source,
  onRequest,
  loading,
}: {
  name: string;
  source?: HeadlineSource;
  onRequest?: () => void;
  loading?: boolean;
}) {
  return (
    <div className={tile}>
      <dt className={label(Boolean(source || onRequest))}>{name}</dt>
      <dd className="mt-1 font-display text-h3 whitespace-nowrap">
        <Missing />
      </dd>
      <dd className="text-sm wrap-anywhere text-text-secondary">{gapWords(source)}</dd>
      {source && <dd className="text-sm text-text-secondary">{source.period}</dd>}
      <TileSource name={name} source={source} onRequest={onRequest} loading={loading} />
    </div>
  );
}

export function HeadlineFigures({
  catalogue,
  sources = {},
  requestSource,
}: {
  catalogue?: CatalogueRun;
  /** Where each figure is read from in the handoff, by metric key; none on a card that holds no handoff. */
  sources?: Partial<Record<string, HeadlineSource>>;
  /** A library card reads a scoped report only when its reader asks to trace a figure. */
  requestSource?: (
    key: string,
    signal: AbortSignal,
  ) => Promise<{ trace: Trace; href: string } | null>;
}) {
  const scope = `${catalogue?.id ?? ""}:${JSON.stringify(catalogue?.metrics ?? {})}`;
  const [lookup, setLookup] = useState<{
    scope: string;
    controller?: AbortController;
    metric?: string;
    name?: string;
    trace?: Trace;
    href?: string;
    error?: string;
  } | null>(null);
  const pending = lookup?.controller;
  useEffect(
    () => () => {
      pending?.abort();
    },
    [scope, pending],
  );
  const request = useCallback(
    async (key: string, name: string) => {
      if (!requestSource) return;
      pending?.abort();
      const controller = new AbortController();
      setLookup({ scope, metric: key, name, controller });
      try {
        const found = await requestSource(key, controller.signal);
        if (controller.signal.aborted) return;
        setLookup((previous) =>
          previous?.controller !== controller
            ? previous
            : found
              ? { scope, ...found }
              : {
                  scope,
                  error:
                    "The original source row for this figure is not available in this run’s published record.",
                },
        );
      } catch {
        if (controller.signal.aborted) return;
        setLookup((previous) =>
          previous?.controller !== controller
            ? previous
            : {
                scope,
                error: "Sources for this figure could not be loaded. Try its source control again.",
              },
        );
      }
    },
    [requestSource, scope, pending],
  );
  const active = lookup?.scope === scope ? lookup : null;
  if (!metricLabels.some(([key]) => stated(catalogue?.metrics[key]))) return null;
  return (
    <>
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
        {metricLabels.map(([key, name]) => {
          const figure = catalogue?.metrics[key];
          const source = sources[key];
          const load = requestSource
            ? () => {
                void request(key, name);
              }
            : undefined;
          if (!stated(figure))
            return (
              <GapTile
                key={name}
                name={name}
                source={source}
                onRequest={load}
                loading={active?.metric === key}
              />
            );
          return (
            <div className={tile} key={name}>
              <dt className={label(Boolean(source || load))}>{name}</dt>
              <dd className="mt-1 font-display text-h3 whitespace-nowrap tabular-nums">
                {withUnit(figure.value, figure.unit)}
              </dd>
              {figure.prior && figure.change != null && (
                <dd>
                  <YearChange
                    metricKey={key}
                    change={figure.change}
                    unit={figure.unit}
                    prior={figure.prior.period}
                  />
                </dd>
              )}
              {figure.period && <dd className="text-sm text-text-secondary">{figure.period}</dd>}
              <TileSource
                name={name}
                source={source}
                onRequest={load}
                loading={active?.metric === key}
              />
            </div>
          );
        })}
      </dl>
      {active?.metric && (
        <p role="status" className="text-sm text-text-secondary">
          Loading sources for {active.name}…
        </p>
      )}
      {active?.error && (
        <p role="status" className="text-sm text-text-secondary">
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
}
