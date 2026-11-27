import { useId, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { StatusBadge } from "@/components/status/StatusBadge";
import { StatsStrip, type Stat } from "@/components/kit/StatsStrip";
import { TextLink } from "../../run/TextLink";
import { reportPath, runPathway, withUnit, type CatalogueRun } from "../publishedReport";
import { reportDate } from "../issuerEntry";
import { PublishedSource } from "../report/PublishedTrace";
import { asOfDate } from "../runFigures";
import { changeText, tone } from "../signal";
import { stated } from "../reportView";
import { CreditView } from "./CreditView";
import { FigureMark, figureName } from "./FigureMark";
import { useFigureTrace } from "./figureTrace";
import type { IssuerGroup } from "./group";
import { useNextEvent, useSeen } from "./nextEvent";
import { useScopedSnapshots } from "./rowSnapshot";

/** The columns of a row on a wide screen; below it a row stacks and each cell names itself. */
export const ROW_COLUMNS =
  "xl:grid-cols-[minmax(15rem,1.6fr)_6.5rem_repeat(3,minmax(8rem,1fr))_minmax(10rem,1.1fr)_minmax(11rem,1.2fr)]";

const CELL_LABEL = "text-caption text-text-tertiary xl:sr-only";
const QUIET_LINK =
  "inline-flex min-h-8 min-w-8 items-center text-left text-small font-normal whitespace-normal max-[480px]:min-h-11 max-[480px]:min-w-11";

/** A machine date only for a full calendar day; any other module-written date is text alone. */
const isoDay = (date: string) => (/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined);

function StateChip({ group }: { group: IssuerGroup }) {
  if (group.state === "Test preview") return <Badge color="brand">Test preview</Badge>;
  if (group.state === "Delivered") return <StatusBadge set="Module state" state="Delivered" />;
  return <Badge color="gray">No report published</Badge>;
}

function Runs({ group }: { group: IssuerGroup }) {
  return (
    <ol className="grid gap-2">
      {group.entries.map((entry, index) => (
        <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
          <time className="font-mono text-text-primary tabular-nums" dateTime={entry.date}>
            {asOfDate(entry.date)}
          </time>
          <span className="text-text-secondary">{entry.title}</span>
          {index === 0 && group.entries[1]?.date !== entry.date && (
            <Badge color="gray">Latest</Badge>
          )}
          {group.entries.some((other) => other !== entry && other.date === entry.date) && (
            <Badge color="gray">Same as-of date</Badge>
          )}
          {group.openable.has(entry.id) ? (
            <TextLink href={reportPath(entry.id)} className={QUIET_LINK}>
              {`Open report of ${asOfDate(entry.date)}`}
            </TextLink>
          ) : (
            <span className="text-text-tertiary">Not published</span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The two qualifications on a next event, worded once for the closed row and the opened panel. */
const WITHIN_PERIOD = "Timing falls within the recorded period; the exact date is unresolved.";
const UNPLACED =
  "Some dated rows in this report could not be placed on the Calendar, so an earlier date may exist.";

function NextEventDetail({
  group,
  next,
}: {
  group: IssuerGroup;
  next: ReturnType<typeof useNextEvent>;
}) {
  const { linked } = group;
  if (!linked)
    return <p className="text-small text-gap-text">No report is published to read dates from.</p>;
  const from = `From the report as of ${asOfDate(linked.date)}.`;
  if (next.status === "idle" || next.status === "loading")
    return (
      <p role="status" className="text-small text-text-secondary">
        Loading dates…
      </p>
    );
  if (next.status === "failed")
    return (
      <p className="text-small text-gap-text">
        Dates could not be loaded.{" "}
        <TextLink href={`${reportPath(linked.id)}#calendar`} className={QUIET_LINK}>
          Open the Calendar
        </TextLink>
      </p>
    );
  if (next.status === "unknown")
    return (
      <p className="text-small text-gap-text">
        This report’s dates could not be read against its as-of date.{" "}
        <TextLink href={`${reportPath(linked.id)}#calendar`} className={QUIET_LINK}>
          Open its Calendar
        </TextLink>
        . {from}
      </p>
    );
  if (next.status === "none")
    return (
      <p className="text-small text-gap-text">The report states no upcoming dated event. {from}</p>
    );
  if (!("event" in next)) return null;
  const { event } = next;
  return (
    <div className="grid gap-1 text-small">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <time dateTime={isoDay(event.date)} className="font-mono text-text-primary tabular-nums">
          {asOfDate(event.date)}
        </time>
        <span className="text-text-secondary">{event.name}</span>
        <PublishedSource href={event.href} name={event.name} linkLabel={`Source for ${event.name}`}>
          View source
        </PublishedSource>
      </p>
      {event.status && <p className="text-caption text-text-secondary">{event.status}</p>}
      {event.withinRecordedPeriod && (
        <p className="text-caption text-text-secondary">{WITHIN_PERIOD}</p>
      )}
      {event.unplaced && (
        <p className="text-caption text-gap-text">
          {UNPLACED}{" "}
          <TextLink href={`${reportPath(linked.id)}#calendar`} className={QUIET_LINK}>
            Open its Calendar
          </TextLink>
        </p>
      )}
      <p className="text-caption text-text-tertiary">{from}</p>
    </div>
  );
}

/** The figures the opened row adds to the three in the collapsed row. */
const MORE = [
  ["leverage", "Gross leverage"],
  ["revenue", "Revenue"],
  ["adjusted_ebitda", "Adjusted EBITDA"],
] as const;

function moreStats(catalogue: CatalogueRun, trace: ReturnType<typeof useFigureTrace>): Stat[] {
  return MORE.map(([key, name]) => {
    const figure = catalogue.metrics[key];
    if (!stated(figure)) return { label: name, value: null, gap: "Not shown here" };
    const named = figureName(key, name, figure);
    const change = figure.prior && figure.change != null ? figure.change : undefined;
    const kind = change === undefined ? "none" : tone(key, change);
    return {
      label: figure.period ? `${named}, ${figure.period}` : named,
      value: withUnit(figure.value, figure.unit),
      prior: figure.prior
        ? `${withUnit(figure.prior.value, figure.unit)} in ${figure.prior.period}`
        : undefined,
      delta: change === undefined ? undefined : changeText(change, figure.unit),
      tone: kind === "better" || kind === "worse" ? kind : undefined,
      trace: trace.button(key, named, catalogue.name),
    };
  });
}

/**
 * One issuer: its newest run's three headline figures, decision slot, run chips, next dated event
 * (read when the row comes into view) and report links in one row; the row opens to the credit
 * view, every run, the event's detail and the figures the row does not show.
 */
export function IssuerRow({
  group,
  coverageInHeader = false,
}: {
  group: IssuerGroup;
  /** The Interest cover column header already carries the qualified label. */
  coverageInHeader?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const panel = useId();
  const { newest, linked, published, pathway, entries, related } = group;
  const load = useScopedSnapshots();
  const trace = useFigureTrace(newest, load);
  const row = useRef<HTMLLIElement>(null);
  const next = useNextEvent(linked?.id, useSeen(row) || opened, load);
  const { metrics } = newest;
  // Published runs, as the run list the link opens counts them.
  const count = group.openable.size || entries.length;
  const runs = `${String(count)} ${count === 1 ? "run" : "runs"}`;
  const figure = (key: string, name: string, order: string) => {
    const shown = figureName(key, name, metrics[key]);
    const qualified = shown !== name;
    return (
      <FigureMark
        name={name}
        metricKey={key}
        figure={metrics[key]}
        className={order}
        showLabel={qualified && !(key === "coverage" && coverageInHeader)}
        trace={stated(metrics[key]) ? trace.button(key, shown, newest.name) : undefined}
      />
    );
  };
  return (
    <li ref={row} className="rounded-ds-lg border border-border-subtle bg-surface-card">
      <div className={`grid gap-x-4 gap-y-4 p-4 sm:p-5 xl:items-start ${ROW_COLUMNS}`}>
        <div className="flex min-w-0 items-start gap-2 xl:order-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? panel : undefined}
            aria-label={`${open ? "Hide" : "Show"} runs and detail for ${newest.name}`}
            onClick={() => {
              setOpen((was) => !was);
              setOpened(true);
            }}
            className="-ml-1 flex min-h-8 min-w-8 flex-none cursor-pointer items-center justify-center rounded-ds-sm text-text-tertiary outline-focus-ring hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11 max-[480px]:min-w-11"
          >
            {open ? (
              <ChevronDown aria-hidden className="size-4" />
            ) : (
              <ChevronRight aria-hidden className="size-4" />
            )}
          </button>
          <div className="grid min-w-0 gap-1 wrap-anywhere">
            <h3 className="font-display text-h4 text-text-primary">
              {published ? (
                <TextLink
                  href={reportPath(newest.id)}
                  className="inline-flex min-h-8 items-center text-left whitespace-normal max-[480px]:min-h-11"
                >
                  {newest.name}
                </TextLink>
              ) : (
                newest.name
              )}
            </h3>
            {(newest.ticker || newest.sector) && (
              <p className="text-small text-text-secondary">
                {[newest.ticker, newest.sector].filter(Boolean).join(" · ")}
              </p>
            )}
            {newest.period && newest.period !== newest.date && (
              <p className="text-small text-text-secondary">Financial period {newest.period}</p>
            )}
            {group.scope && <p className="text-small text-text-secondary">{group.scope}</p>}
            {group.assessmentUnavailable && (
              <p className="text-small text-gap-text">
                A verified issuer assessment is unavailable.
              </p>
            )}
            {!published && (
              <p className="text-small text-gap-text">
                Run not published, as of {asOfDate(newest.date)}
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {published && (
                <TextLink href={reportPath(newest.id)} grey className={QUIET_LINK}>
                  Open report
                </TextLink>
              )}
              {linked ? (
                <TextLink href={`${reportPath(linked.id)}#history`} grey className={QUIET_LINK}>
                  {runs}
                </TextLink>
              ) : (
                <span className="text-small text-text-tertiary">{runs}</span>
              )}
            </p>
            {related.length > 0 && (
              <ul aria-label={`Other reports, ${newest.name}`} className="grid gap-1 text-small">
                {related.map(({ catalogue, run, timing }) => (
                  <li key={catalogue.id}>
                    <span className="text-text-secondary">{timing} · </span>
                    <TextLink href={reportPath(run.folder)} className={QUIET_LINK}>
                      {`${runPathway(run, catalogue) || "Credit report"} · ${
                        reportDate(catalogue.date)
                          ? asOfDate(catalogue.date)
                          : "As-of date unavailable"
                      }`}
                    </TextLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3 xl:contents">
          <div className="flex min-w-0 flex-col gap-1 xl:order-2">
            <span className={CELL_LABEL}>Decision</span>
            <span className="text-caption text-gap-text">Not shown in the Library</span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 xl:order-6">
            <span className={`${CELL_LABEL} w-full`}>Run</span>
            <Badge color="gray">{pathway || "Pathway not recorded"}</Badge>
            <Badge color="gray">
              <time className="font-mono tabular-nums" dateTime={newest.date}>
                {asOfDate(newest.date)}
              </time>
            </Badge>
            <StateChip group={group} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 xl:contents">
          {figure("net_leverage", "Net leverage", "xl:order-3")}
          {figure("coverage", "Interest cover", "xl:order-4")}
          {figure("cash", "Liquidity (cash)", "xl:order-5")}
        </div>
        <div className="flex min-w-0 flex-col gap-1 xl:order-7">
          <span className={CELL_LABEL}>Next event</span>
          {published ? (
            <>
              {"event" in next && (
                <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-small wrap-anywhere">
                  <time
                    dateTime={isoDay(next.event.date)}
                    className="font-mono text-text-primary tabular-nums"
                  >
                    {asOfDate(next.event.date)}
                  </time>
                  <span className="text-text-secondary">{next.event.name}</span>
                </p>
              )}
              {"event" in next && next.event.withinRecordedPeriod && (
                <span className="text-caption text-text-secondary">{WITHIN_PERIOD}</span>
              )}
              {"event" in next && next.event.unplaced && (
                <span className="text-caption text-gap-text">{UNPLACED}</span>
              )}
              {next.status === "none" && (
                <span className="text-small text-gap-text">No upcoming date stated</span>
              )}
              <TextLink href={`${reportPath(newest.id)}#calendar`} grey className={QUIET_LINK}>
                Open Calendar
              </TextLink>
            </>
          ) : (
            <span className="text-small text-gap-text">Needs a published report</span>
          )}
        </div>
      </div>
      {trace.notes}
      {open && (
        <div
          id={panel}
          className="grid gap-6 border-t border-border-hairline p-4 sm:p-5 lg:grid-cols-2"
        >
          <section
            aria-label={`Credit view, ${newest.name}`}
            className="grid min-w-0 content-start gap-2"
          >
            <h4 className="text-small font-medium text-text-primary">Credit view</h4>
            <CreditView
              run={published}
              date={newest.date}
              showUnavailableFinding={!group.assessmentUnavailable}
              load={load}
            />
          </section>
          <section aria-label={`Runs, ${newest.name}`} className="grid min-w-0 content-start gap-2">
            <h4 className="text-small font-medium text-text-primary">Runs, newest first</h4>
            <Runs group={group} />
          </section>
          <section
            aria-label={`Next dated event, ${newest.name}`}
            className="grid min-w-0 content-start gap-2"
          >
            <h4 className="text-small font-medium text-text-primary">Next dated event</h4>
            <NextEventDetail group={group} next={next} />
          </section>
          <section
            aria-label={`More figures, ${newest.name}`}
            className="grid min-w-0 gap-2 lg:col-span-2"
          >
            <h4 className="text-small font-medium text-text-primary">More figures</h4>
            <StatsStrip label={`More figures, ${newest.name}`} stats={moreStats(newest, trace)} />
          </section>
        </div>
      )}
    </li>
  );
}
