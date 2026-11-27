import { Button } from "@/components/base/buttons/button";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { ChartPrintContext } from "@/components/chart/ChartPrintContext";
import { printableBasis, printableTable, redactArchivedLocator } from "../export/printTable";
import { moduleName } from "../api";
import { heading } from "../layout";
import { PublishedTable } from "../ReportContent";
import { unitCells } from "../moneyUnits";
import {
  containsReference,
  evidenceHref,
  evidenceToken,
  readParagraph,
  readerText,
} from "../publishedReport";
import { richParts } from "../richText";
import { LegacyVisuals } from "../visuals";
import { chartDrawsVerbatim, qualificationBlocks } from "../visuals/drawnQualifications";
import type { IssuerFrontPageData, SpecialistOverview } from "./frontPage";
import { PublishedSource } from "./PublishedTrace";

type Owner = NonNullable<IssuerFrontPageData["lead"]>["owner"];
type Passage = NonNullable<IssuerFrontPageData["lead"]>;
type Figure = IssuerFrontPageData["figures"][number];
type OwnedTable = NonNullable<IssuerFrontPageData["financials"]>;
type TraceContext = { folder: string; print: boolean };

function traceHref(folder: string, owner: Owner, line?: number) {
  return evidenceHref(folder, evidenceToken({ output: owner }, line));
}

function Source({
  context,
  owner,
  line,
  label,
}: {
  context: TraceContext;
  owner: Owner;
  line?: number;
  label: string;
}) {
  if (context.print) return null;
  return (
    <PublishedSource
      href={traceHref(context.folder, owner, line)}
      name={label}
      linkLabel={`Show sources for ${label}`}
    >
      Source
    </PublishedSource>
  );
}

function FrontPassage({
  context,
  item,
  label,
  lead = false,
}: {
  context: TraceContext;
  item: Passage;
  label: string;
  lead?: boolean;
}) {
  return (
    <div className={`${TRACE_HOST} flex min-w-0 items-start gap-2`}>
      <p
        className={`max-w-prose wrap-anywhere ${lead ? "text-body font-medium sm:text-lg" : "text-body text-text-secondary"}`}
      >
        {item.body ? richParts(item.body, readerText) : "This passage is available in Evidence."}
      </p>
      <Source context={context} owner={item.owner} line={item.line} label={label} />
    </div>
  );
}

function PassageGroup({
  title,
  items,
  context,
  fallback,
  className = "",
}: {
  title: string;
  items: Passage[];
  context: TraceContext;
  fallback?: string;
  className?: string;
}) {
  if (!items.length && !fallback) return null;
  return (
    <section className={`issuer-front-page-passages grid content-start gap-2 ${className}`}>
      <h3 className={heading}>{title}</h3>
      {items.map((item) => (
        <FrontPassage key={item.line} context={context} label={title} item={item} />
      ))}
      {!items.length && <p className="text-sm text-text-secondary">{fallback}</p>}
    </section>
  );
}

function FrontTable({
  data,
  context,
  showTitle = true,
  observations = false,
  unresolvedNote,
  notes,
  className = "",
}: {
  data: OwnedTable;
  context: TraceContext;
  showTitle?: boolean;
  observations?: boolean;
  unresolvedNote?: boolean;
  notes?: string[];
  className?: string;
}) {
  const { table, owner, title, qualification } = data;
  const displayed = context.print ? printableTable(table, unresolvedNote).table : table;
  return (
    <section
      className={`grid min-w-0 gap-2${observations ? " issuer-front-page-observations" : ""} ${className}`}
    >
      {showTitle && <h3 className={heading}>{title}</h3>}
      <PublishedTable
        table={displayed}
        heading={title}
        drawCell={unitCells(displayed)}
        rowSource={
          context.print
            ? undefined
            : (line, label) => <Source context={context} owner={owner} line={line} label={label} />
        }
      />
      {notes?.map((note) => (
        <p key={note}>{richParts(note, readerText)}</p>
      ))}
      {qualification && <FrontPassage context={context} item={qualification} label={title} />}
    </section>
  );
}

function printFigureNotes(figure: Figure) {
  const blocks = figure.table ? qualificationBlocks(figure.sections, figure.table.line) : [];
  const bodies = blocks
    .map(({ text }) => readParagraph(typeof text === "string" ? text : "").body)
    .filter(Boolean);
  const redacted = bodies.map(redactArchivedLocator);
  const notes = redacted.filter(chartDrawsVerbatim);
  return {
    notes,
    unresolved: notes.length !== bodies.length,
    requiredRedaction: bodies.some((body, at) => body !== redacted[at]),
  };
}

function FrontFigure({ figure, context }: { figure: Figure; context: TraceContext }) {
  const { owner, sections, descriptor, gap, table, title } = figure;
  const withheldObservation = context.print && table && printableTable(table).withheld;
  const printNotes = context.print ? printFigureNotes(figure) : undefined;
  const withheld = withheldObservation || printNotes?.unresolved;
  if (owner && sections && descriptor && !gap && !withheld && !printNotes?.requiredRedaction) {
    return (
      <LegacyVisuals
        output={{ ...owner, charts: [descriptor] }}
        sections={sections}
        evidenceHref={(line) => traceHref(context.folder, owner, line)}
        headingLevel="h4"
        print={context.print}
      />
    );
  }
  return (
    <div
      className={`${TRACE_HOST} grid min-w-0 content-start gap-2 rounded-ds-md border border-border-hairline p-3`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-h4">{title}</h4>
        {owner && table && (
          <Source context={context} owner={owner} line={table.line} label={title} />
        )}
      </div>
      <p className="text-sm text-text-secondary">
        {withheld
          ? "The chart is withheld because some observation qualifications are only available in Evidence."
          : printNotes?.requiredRedaction
            ? "The published observations and their qualifications appear in the table below."
            : gap && !containsReference(gap)
              ? readerText(gap)
              : table
                ? "This run supplies a table for this figure."
                : "This run does not supply a chart for this figure."}
      </p>
      {!context.print && owner && table && (
        <FrontTable data={{ owner, table, title }} context={context} showTitle={false} />
      )}
    </div>
  );
}

function Headline({
  items,
  context,
}: {
  items: IssuerFrontPageData["headline"];
  context: TraceContext;
}) {
  if (!items.length) return null;
  const commonPeriod = items.every(({ period }) => period === items[0]?.period)
    ? items[0]?.period
    : undefined;
  const previous = items.find(({ prior }) => prior)?.prior?.period;
  const pairedPeriod =
    commonPeriod && items.every(({ prior }) => !prior || prior.period === previous)
      ? previous
      : undefined;
  return (
    <section className="issuer-brief-metrics grid min-w-0 gap-1">
      <h3 className={heading}>Credit metrics</h3>
      {commonPeriod && !pairedPeriod && (
        <p className="text-sm text-text-secondary">{commonPeriod}</p>
      )}
      <table aria-label="Headline figures" className="w-full text-sm tabular-nums">
        <thead className={pairedPeriod ? "text-right text-text-secondary" : "sr-only"}>
          <tr>
            <th scope="col" className="text-left">
              Metric
            </th>
            <th scope="col">{pairedPeriod ? commonPeriod : "Value"}</th>
            {pairedPeriod && <th scope="col">{pairedPeriod}</th>}
            {!commonPeriod && <th scope="col">Period</th>}
          </tr>
        </thead>
        <tbody>
          {items.map(({ owner, line, label, value, period, prior }) => (
            <tr key={line} className={`${TRACE_HOST} border-b border-border-hairline`}>
              <th scope="row" className="py-1 pr-2 text-left font-medium">
                {label}
                <Source context={context} owner={owner} line={line} label={label} />
              </th>
              <td className="text-right font-semibold">{value}</td>
              {pairedPeriod && <td className="text-right">{prior?.value ?? "—"}</td>}
              {!commonPeriod && <td className="pl-2 text-right text-text-secondary">{period}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Company({ page, context }: { page: IssuerFrontPageData; context: TraceContext }) {
  const {
    description,
    ownership,
    country,
    countrySource,
    sector,
    sectorSource,
    ratings,
    differing,
  } = page.company;
  const identity = [sector, country].filter(Boolean).join(" · ");
  if (!description && !ownership && !identity && !ratings.length) return null;
  return (
    <section className="issuer-brief-company grid min-w-0 gap-1 border-b border-border-hairline pb-2">
      <h3 className={heading}>Issuer profile</h3>
      <div className="issuer-brief-company-fields grid min-w-0 gap-2 lg:grid-cols-2">
        <div className="grid min-w-0 gap-0.5">
          {description && (
            <FrontPassage item={description} label="Business description" context={context} />
          )}
          {identity && (
            <div
              className={`${TRACE_HOST} flex flex-wrap items-baseline gap-x-1 text-sm text-text-secondary`}
            >
              {sector && (
                <span>
                  {sector}
                  {sectorSource && <Source {...sectorSource} context={context} label="Sector" />}
                </span>
              )}
              {sector && country && <span aria-hidden="true">·</span>}
              {country && (
                <span>
                  {country}
                  {countrySource && <Source {...countrySource} context={context} label="Country" />}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="grid min-w-0 content-start gap-0.5">
          {ownership && <FrontPassage item={ownership} label="Ownership" context={context} />}
          {ratings.length > 0 && (
            <p className="text-sm text-text-secondary">
              Entered rating ·{" "}
              {ratings
                .map(({ agency, label, outlook, date }) =>
                  [agency, label, outlook, date].filter(Boolean).join(" "),
                )
                .join(" · ")}
              {!context.print && differing.length > 0 && (
                <>
                  {" · "}
                  <Button href="#modules/CP-2H" color="link-gray" size="sm">
                    {`${moduleName("CP-2H")} shows a different rating for ${differing.join(", ")}`}
                  </Button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function SpecialistDecision({
  assessment,
  context,
}: {
  assessment: SpecialistOverview;
  context: TraceContext;
}) {
  const { title, findings, restriction } = assessment;
  return (
    <>
      {findings.map((item, index) => (
        <FrontPassage
          key={`${item.owner.id}:${String(item.line)}`}
          item={item}
          context={context}
          label={index === 0 ? title : `${title}, finding ${String(index + 1)}`}
          lead={index === 0}
        />
      ))}
      {restriction && (
        <div className={`${TRACE_HOST} flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm`}>
          <p className="font-semibold">{restriction.label}</p>
          <p className="text-text-secondary">
            {richParts(placedReason(restriction, context), readerText)}
          </p>
          {restriction.source && (
            <Source context={context} {...restriction.source} label={restriction.label} />
          )}
        </div>
      )}
    </>
  );
}

/** A reason is drawn in the wording that is true where it is read: the PDF's or the screen page's. */
function placedReason(
  { reason, screenReason }: { reason: string; screenReason?: string },
  context: TraceContext,
) {
  return context.print ? reason : (screenReason ?? reason);
}

function ActionRows({
  actions,
  context,
  compact = false,
}: {
  actions: IssuerFrontPageData["actions"];
  context: TraceContext;
  compact?: boolean;
}) {
  if (!actions.length) return null;
  return (
    <dl className={compact ? "issuer-brief-actions flex flex-wrap gap-x-3 gap-y-1" : "grid gap-2"}>
      {actions.map(({ label, status, owner, ...reasons }) => (
        <div
          key={label}
          className={`${TRACE_HOST} flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm`}
        >
          <dt className="font-semibold">{label}</dt>
          <dd className="text-text-secondary">
            {compact
              ? status === "withheld"
                ? "Withheld"
                : "Not shown"
              : placedReason(reasons, context)}
          </dd>
          {owner && (
            <dd>
              <Source context={context} owner={owner} label={label} />
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

function Decision({
  page,
  context,
  specialist,
  compact = false,
}: {
  page: IssuerFrontPageData;
  context: TraceContext;
  specialist?: SpecialistOverview | null;
  compact?: boolean;
}) {
  const lead = compact ? (page.compactLead ?? page.lead) : page.lead;
  const actions = compact
    ? page.actions.filter(({ status }) => status !== "unavailable")
    : page.actions;
  return (
    <section className="issuer-front-page-decision grid gap-3 border-b border-border-hairline pb-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-h2">{specialist?.title ?? page.leadLabel}</h3>
        {!context.print && <span className="text-sm text-text-secondary">{page.scope}</span>}
      </div>
      {specialist ? (
        <SpecialistDecision assessment={specialist} context={context} />
      ) : lead ? (
        <FrontPassage context={context} item={lead} label={page.leadLabel} lead />
      ) : (
        <p className="text-sm text-text-secondary">
          A verified finding is unavailable for this run.
        </p>
      )}
      {!specialist && <ActionRows actions={actions} context={context} compact={compact} />}
      <PassageGroup
        title={
          (compact || context.print) && page.limitations.length > 1
            ? "Main limitation"
            : "Limitations of the view"
        }
        items={compact || context.print ? page.limitations.slice(0, 1) : page.limitations}
        context={context}
        className="issuer-front-page-limitations"
      />
    </section>
  );
}

function canDraw(figure: Figure) {
  if (!figure.descriptor || figure.gap || !figure.table) return false;
  const notes = printFigureNotes(figure);
  return !notes.unresolved && !notes.requiredRedaction && !printableTable(figure.table).withheld;
}

function CashAndRevolver({
  liquidity,
  context,
}: {
  liquidity: IssuerFrontPageData["liquidity"];
  context: TraceContext;
}) {
  if (!liquidity) return null;
  const printable = printableBasis(liquidity.basis);
  const basis =
    printable && !containsReference(printable)
      ? printable
      : context.print
        ? "The basis for these amounts is not shown in this report."
        : "The basis for these amounts is available in Evidence.";
  return (
    <div className={`${TRACE_HOST} grid gap-1 border-t border-border-hairline pt-2 text-sm`}>
      <p>
        <strong>Cash</strong> {liquidity.cash} · <strong>Undrawn committed facilities</strong>{" "}
        {liquidity.undrawn}{" "}
        <Source
          context={context}
          owner={liquidity.owner}
          line={liquidity.line}
          label="Cash and facility availability"
        />
      </p>
      <p className="text-text-secondary">{basis}</p>
    </div>
  );
}

function IssuerBrief({
  page,
  context,
  figure,
}: {
  page: IssuerFrontPageData;
  context: TraceContext;
  figure?: Figure;
}) {
  return (
    <div className="issuer-brief grid min-w-0 gap-4">
      <Company page={page} context={context} />
      <div className="issuer-brief-columns grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="issuer-brief-credit grid min-w-0 gap-4">
          <Decision page={page} context={context} compact />
          <Headline items={page.headline} context={context} />
          {figure && (
            <div className="issuer-brief-figure min-w-0">
              <ChartPrintContext value={context.print && 96}>
                <FrontFigure figure={figure} context={context} />
              </ChartPrintContext>
            </div>
          )}
        </div>
        <section className="issuer-brief-capital grid min-w-0 gap-1">
          <h3 className={heading}>Capital structure</h3>
          {page.capitalBasis && <p className="text-sm text-text-secondary">{page.capitalBasis}</p>}
          {page.capital ? (
            <FrontTable data={page.capital} context={context} showTitle={false} />
          ) : (
            <p className="text-sm text-text-secondary">Facility-level debt stack unavailable.</p>
          )}
          <CashAndRevolver liquidity={page.liquidity} context={context} />
        </section>
      </div>
    </div>
  );
}

export function IssuerFrontPage({
  page,
  print = false,
  specialist,
}: {
  page: IssuerFrontPageData;
  print?: boolean;
  specialist?: SpecialistOverview | null;
}) {
  const context = { folder: page.folder, print };
  const brief = page.figures.length > 0;
  const leadFigure = ["Debt maturities", "Leverage", "Liquidity", "Interest coverage"]
    .map((title) => page.figures.find((figure) => figure.title === title))
    .find((figure) => figure && canDraw(figure));
  const supportingFigures = page.figures.filter((figure) => figure !== leadFigure);
  return (
    <div className="issuer-front-page grid min-w-0 gap-5">
      {brief ? (
        <IssuerBrief page={page} context={context} figure={leadFigure} />
      ) : (
        <Decision page={page} context={context} specialist={specialist} />
      )}
      {!brief && <Headline items={page.headline} context={context} />}
      {brief && print && <div className="issuer-brief-continuation" aria-hidden="true" />}
      {brief && <ActionRows actions={page.actions} context={context} />}
      {page.missingHeadline.length > 0 && (
        <p className="text-sm text-text-secondary">
          No comparable headline figure is selected for {page.missingHeadline.join(", ")}.
        </p>
      )}
      {supportingFigures.length > 0 && (
        <section className="grid min-w-0 gap-3">
          <h3
            id={print ? undefined : "overview-key-charts"}
            tabIndex={print ? undefined : -1}
            className={heading}
          >
            Key charts
          </h3>
          <div className="issuer-front-page-charts grid min-w-0 gap-3 xl:grid-cols-3">
            {supportingFigures.map((figure) => (
              <FrontFigure key={figure.title} figure={figure} context={context} />
            ))}
          </div>
        </section>
      )}
      {(brief || print) && (
        <PassageGroup
          title="Further limitations"
          items={page.limitations.slice(1)}
          context={context}
          className="issuer-front-page-limitations"
        />
      )}
      {page.compactLead && page.lead && page.compactLead.body !== page.lead.body && (
        <PassageGroup title="Full credit view" items={[page.lead]} context={context} />
      )}
      {print &&
        page.figures.map((figure) => {
          const { owner, table, title } = figure;
          if (!owner || !table) return null;
          const { notes, unresolved } = printFigureNotes(figure);
          return (
            <FrontTable
              key={title}
              data={{ owner, table, title: `${title} observations` }}
              context={context}
              observations
              notes={notes}
              unresolvedNote={unresolved}
            />
          );
        })}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <PassageGroup
          title={page.figures.length ? "Credit case" : "Key findings"}
          items={page.findings}
          context={context}
          fallback={
            page.lead ? "This handoff does not supply a separate findings passage." : undefined
          }
        />
        <PassageGroup
          title={
            page.hasCombinedChallenge
              ? "Contrary evidence and change triggers"
              : "Contrary evidence"
          }
          items={page.challenge}
          context={context}
          fallback={
            page.lead ? "This handoff does not supply a separate challenge passage." : undefined
          }
        />
        {!page.hasCombinedChallenge && (
          <PassageGroup
            title="What would change the view"
            items={page.triggers}
            context={context}
            fallback={
              page.lead ? "This handoff does not supply a separate trigger passage." : undefined
            }
          />
        )}
      </div>
      {page.financials && (
        <FrontTable
          data={page.financials}
          context={context}
          className="issuer-front-page-financials"
        />
      )}
      {page.tranches && <FrontTable data={page.tranches} context={context} />}
      {page.instruments && (!brief || page.capitalBasis) && (
        <FrontTable data={page.instruments} context={context} />
      )}
    </div>
  );
}
