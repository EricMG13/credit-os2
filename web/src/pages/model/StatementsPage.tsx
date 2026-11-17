import { memo, useState } from "react";
import { CaseCards } from "./parts/CaseCards";
import { useCaseChoice } from "./parts/useCaseChoice";
import { RunPage, runKey } from "./parts/RunPage";
import { StatementTable, type StatementView } from "./parts/StatementTable";
import { Bridges } from "./sections/Bridges";
import { CaseComparison } from "./sections/CaseComparison";
import { DebtSection } from "./sections/DebtSection";
import { RecoverySection } from "./sections/RecoverySection";
import type { ModelRun } from "./slice/types";

// Only the statement table and the bridges follow the case; these sections take run data that does
// not change with it, so a case switch leaves them as they were instead of drawing every chart again.
const ComparisonSection = memo(CaseComparison);
const DebtCharts = memo(DebtSection);
const RecoveryCharts = memo(RecoverySection);

/** The case and the Figures or Bars choice are in-memory page state; the first case is default. */
function Body({ run }: { run: ModelRun }) {
  const [caseIndex, setCaseIndex] = useCaseChoice(run);
  const [view, setView] = useState<StatementView>("figures");
  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-h3 text-text-primary">
            {run.cases.length === 1 ? "Published case" : "Two cases"}
          </h2>
          <span className="text-small text-text-tertiary">
            {run.cases.length === 1
              ? "The model shows the published case."
              : "The forecast columns and cash flow bridges follow the chosen case. The other charts show both cases or the balance sheet date."}
          </span>
        </div>
        <CaseCards cases={run.cases} chosen={caseIndex} onChoose={setCaseIndex} />
      </section>
      <StatementTable page={run.statements} caseIndex={caseIndex} view={view} onView={setView} />
      <Bridges bridges={run.statements.bridges} caseIndex={caseIndex} />
      <ComparisonSection data={run.statements.comparison} cases={run.cases} />
      <DebtCharts stack={run.statements.debt.stack} maturities={run.statements.debt.maturities} />
      <RecoveryCharts
        recovery={run.statements.recovery}
        gap={run.statements.gap}
        checkFigure={run.statements.checkFigure}
        published={run.statements.published}
      />
    </>
  );
}

export function StatementsPage({ params }: { params: Record<string, string> }) {
  return (
    <RunPage params={params} current="statements">
      {(run) => <Body key={runKey(run)} run={run} />}
    </RunPage>
  );
}
