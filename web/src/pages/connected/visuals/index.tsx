import type { ReactNode } from "react";
import { GapPanel } from "@/components/gap/GapPanel";
import { ChartQualifications } from "./ChartQualifications";
import { chartsWithQualifications } from "./drawnQualifications";
import { ChartTable } from "@/components/chart/ChartTable";
import { ChartWithTable } from "@/components/chart/ChartWithTable";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { containsReference, readerText } from "../publishedReport";
import { PublishedSource } from "../report/PublishedTrace";
import { usePortfolioBasis, usePortfolioBasisLoading } from "../report/PortfolioBasis";
import { portfolioLimits } from "./PortfolioLimits";
import { publishedChart } from "./charts";
import { edgeMap } from "./EdgeMap";
import { eventLane } from "./EventLane";
import { chartTable, items, publishedTables, record, word } from "./visualData";

export { LegacyForecast } from "./LegacyForecast";

type Drawing = { descriptor: Record<string, unknown>; category: "chart" | "event" | "map" };

function byCategory(
  output: Record<string, unknown>,
  key: string,
  category: Drawing["category"],
): Drawing[] {
  return items(output[key]).map((raw) => ({ descriptor: record(raw), category }));
}

function compareLines(a: Drawing, b: Drawing) {
  return (
    (typeof a.descriptor.table === "number" ? a.descriptor.table : 0) -
    (typeof b.descriptor.table === "number" ? b.descriptor.table : 0)
  );
}

function drawingChart({
  category,
  descriptor,
  published,
  basis,
  link,
  table,
  frame,
}: {
  category: Drawing["category"];
  descriptor: Record<string, unknown>;
  published: Record<string, unknown>;
  basis: ReturnType<typeof usePortfolioBasis>;
  link: string | undefined;
  table: Parameters<typeof publishedChart>[0];
  frame: Parameters<typeof publishedChart>[2];
}) {
  let chart: ReactNode;
  if (category === "chart") {
    const attested =
      descriptor.kind === "limits" &&
      link &&
      basis &&
      basis.output === published.id &&
      basis.sha256 === published.sha256 &&
      basis.tableLines.includes(table.line);
    chart = attested
      ? portfolioLimits(table, basis, frame)
      : publishedChart(table, descriptor, frame);
  } else {
    const drawing = category === "event" ? eventLane(table) : edgeMap(table);
    chart =
      drawing === null ? null : (
        <ChartWithTable {...frame} chart={drawing} table={chartTable(table)} />
      );
  }
  return chart;
}

interface Entry {
  first: boolean;
  draw: (wide: string) => ReactNode;
}

/** Which cards span both columns: each primary card, and a card left alone in its row. */
function widths(firsts: boolean[]) {
  const wide: boolean[] = [];
  let column = 0;
  firsts.forEach((first, at) => {
    const alone = column === 0 && at === firsts.length - 1;
    wide.push(first || alone);
    column = first || alone ? 0 : 1 - column;
  });
  return wide;
}

function entry(first: boolean, draw: Entry["draw"]): Entry {
  return { first, draw };
}

interface LegacyVisualsProps {
  output: unknown;
  sections?: unknown;
  evidenceHref?: (line: number) => string;
  primary?: string;
  cards?: boolean;
  /** The figure titles' heading level; h4 unless the figures sit directly under an h2. */
  headingLevel?: "h3" | "h4";
}

export function LegacyVisuals({
  output,
  sections,
  evidenceHref,
  primary,
  cards,
  headingLevel: Heading = "h4",
}: LegacyVisualsProps) {
  const published = record(output);
  const basis = usePortfolioBasis();
  const loading = usePortfolioBasisLoading();
  const sourceSections = sections ?? published.sections;
  const tables = publishedTables(sourceSections);
  const qualified = new Set(chartsWithQualifications(published, sourceSections));
  const drawings = [
    ...byCategory(published, "charts", "chart"),
    ...byCategory(published, "chartGaps", "chart"),
    ...byCategory(published, "events", "event"),
    ...byCategory(published, "maps", "map"),
  ].sort((a, b) => {
    if (primary && a.descriptor.title === primary && b.descriptor.title !== primary) return -1;
    if (primary && b.descriptor.title === primary && a.descriptor.title !== primary) return 1;
    return compareLines(a, b);
  });
  const box = cards ? " rounded-xl border border-border-hairline bg-surface-card p-5" : "";
  const entries = drawings.flatMap(({ descriptor, category }): Entry[] => {
    const title = word(descriptor.title ?? descriptor.lane ?? descriptor.name);
    const line = descriptor.table;
    if (!title || typeof line !== "number" || !Number.isSafeInteger(line) || line <= 0) return [];
    const link = evidenceHref?.(line);
    const actions = link ? (
      <PublishedSource href={link} name={title}>
        Source table
      </PublishedSource>
    ) : undefined;
    const gap = word(descriptor.gap);
    const first = cards === true && primary !== undefined && title === primary;
    const key = `${category}-${title}-${String(line)}`;
    if (gap) {
      return [
        entry(first, (wide) => (
          <section key={key} className={`${TRACE_HOST} grid min-w-0 gap-2${box}${wide}`}>
            <Heading className="font-display text-h4 first-letter:uppercase">{title}</Heading>
            <GapPanel
              role="note"
              reason={
                link && containsReference(gap)
                  ? `${/^(Not supplied|Not calculated|Not assessable|Not established|Withheld)\b/i.exec(gap)?.[1] ?? "Not established"}. See Evidence.`
                  : readerText(gap)
              }
            />
            {actions}
          </section>
        )),
      ];
    }
    const publishedTable = tables.get(line);
    if (!publishedTable) return [];
    const table = {
      ...publishedTable,
      evidenceInDrawer: Boolean(link),
      rowSource:
        evidenceHref &&
        ((at: number, label: string) => (
          <PublishedSource
            href={evidenceHref(at)}
            name={label}
            linkLabel={`Show sources for ${label}`}
          >
            Source row
          </PublishedSource>
        )),
    };
    const note = word(descriptor.unit) || undefined;
    const frame = { title, note, actions, as: Heading };
    const chart = drawingChart({ category, descriptor, published, basis, link, table, frame });
    const limits = category === "chart" && descriptor.kind === "limits";
    return [
      entry(first, (wide) => (
        <div
          className={`${TRACE_HOST} grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2${box}${wide}`}
          key={key}
        >
          {chart ?? (
            <>
              <Heading className="font-display text-h4 first-letter:uppercase">{title}</Heading>
              {actions}
              {limits && loading ? (
                <p role="status" className="text-small text-text-secondary">
                  Loading the portfolio limits.
                </p>
              ) : (
                <>
                  <GapPanel
                    role="note"
                    reason={
                      limits
                        ? "The portfolio limits could not be checked against the mandate for this run."
                        : "The chart is not drawn because its figures are not on one comparable scale."
                    }
                  />
                  <ChartTable caption={title} {...chartTable(table)} />
                </>
              )}
            </>
          )}
          {qualified.has(descriptor) && (
            <ChartQualifications
              category={category}
              sections={sourceSections}
              line={line}
              evidenceHref={evidenceHref}
            />
          )}
        </div>
      )),
    ];
  });
  // At lg the cards sit two to a row: the primary card, and a card left alone in its row, take both.
  const wides = widths(entries.map((e) => e.first));
  const views = entries.map(({ draw }, at) => draw(cards && wides[at] ? " lg:col-span-2" : ""));
  return views.length === 0 ? null : (
    <div
      className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4${cards ? " lg:grid-cols-2" : ""}`}
    >
      {views}
    </div>
  );
}
