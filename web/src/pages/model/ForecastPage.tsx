import { GapPanel } from "@/components/gap/GapPanel";
import { CaseCards } from "./parts/CaseCards";
import { Item } from "./parts/Item";
import { Passage } from "./parts/Passage";
import { RunPage, runKey } from "./parts/RunPage";
import { TraceControl } from "./parts/TraceControl";
import { useCaseChoice } from "./parts/useCaseChoice";
import { CoverCard, PathsCard, WalkCard } from "./sections/ForecastCharts";
import { StripsCard } from "./sections/PortfolioCharts";
import { SectionHeading, gapReason, pairGrid } from "./sections/shared";
import type { ForecastPage as Forecast, ModelRun } from "./slice/types";

/** The case is in-memory page state; the first case is the default. */
function Body({ run, page }: { run: ModelRun; page: Forecast }) {
  const [chosen, setChosen] = useCaseChoice(run);
  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <SectionHeading>{run.cases.length === 1 ? "Published case" : "Two cases"}</SectionHeading>
          <span className="text-small text-text-tertiary">
            {run.cases.length === 1
              ? "The charts show the published case."
              : "Interest cover, the cash flow walk and the highlighted driver markers follow the chosen case. EBITDA by case shows both cases."}
          </span>
        </div>
        <CaseCards cases={run.cases} chosen={chosen} onChoose={setChosen} />
      </section>
      <StripsCard data={page.drivers} emphasised={chosen} />
      <div className={pairGrid(Math.max(page.interestCover.head.length, page.ebitda.head.length))}>
        <CoverCard
          data={page.interestCover}
          periods={page.periods}
          cases={run.cases}
          chosen={chosen}
        />
        <PathsCard data={page.ebitda} periods={page.periods} />
      </div>
      <section className="flex flex-col gap-4">
        <SectionHeading>{`Cash flow: ${page.walk.subtitle}`}</SectionHeading>
        <div className={pairGrid(page.walk.head.length)}>
          <WalkCard data={page.walk} chosen={chosen} />
          <div className="flex min-w-0 flex-col gap-6">
            <GapPanel reason={gapReason(page.gap)} />
            <Passage
              tone="info"
              title={page.watch.title}
              trace={
                page.watch.trace === null ? undefined : (
                  <TraceControl
                    href={page.watch.trace}
                    label={`Show the sources for ${page.watch.title}`}
                  />
                )
              }
            >
              {page.watch.text}
            </Passage>
            <Item
              title={page.limitations.title}
              text={page.limitations.text}
              href={page.limitations.href}
              trace={null}
            />
          </div>
        </div>
      </section>
    </>
  );
}

export function ForecastPage({ params }: { params: Record<string, string> }) {
  return (
    <RunPage params={params} current="forecast">
      {(run) => (
        <>
          {run.cases.length === 1 ? (
            <GapPanel reason="Only one case was published. A second case is not available for comparison." />
          ) : null}
          {run.forecast === null ? (
            <p className="max-w-[72ch] text-body text-text-secondary">
              No forecast was published for this run.
            </p>
          ) : (
            <Body key={runKey(run)} run={run} page={run.forecast} />
          )}
        </>
      )}
    </RunPage>
  );
}
