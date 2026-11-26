import type { Coverage as Data, CoverageRun } from "../coverageData";
import { byStage } from "../report/stages";
import { named, reportPath } from "./shared";
import { hasHandoff, StateMark } from "./StateMark";
import { TextLink } from "../../run/TextLink";

/** The fixed columns grouped under the five stages, in stage order. */
export function stageColumns(data: Data) {
  return byStage(data.columns.map((column) => ({ ...column, id: column.code }))).map((group) => ({
    name: group.name,
    columns: group.rows,
  }));
}

/**
 * One run's states, the five stages as rows and each module as a shape and its word, with a link
 * to the module's own page where the run holds a handoff. The phone's matrix and the issuer
 * detail both draw it.
 */
export function RunStates({
  data,
  run,
}: {
  data: Data;
  run: CoverageRun;
}) {
  return (
    <dl className="grid gap-3">
      {stageColumns(data).map((group) => (
        <div key={group.name} className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <dt className="text-caption font-medium text-text-tertiary">{group.name}</dt>
          <dd>
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
              {group.columns.map((column) => {
                const cell = run.cells[column.code];
                return (
                  <li key={column.code} className="flex min-w-0 flex-wrap items-center gap-x-2 text-small">
                    {hasHandoff(cell) ? (
                      <TextLink
                        href={`${reportPath(run.folder)}#modules/${column.code}`}
                        className="inline-flex min-h-8 items-center text-small font-normal max-[480px]:min-h-11"
                      >
                        {named(column, run.pathway)}
                      </TextLink>
                    ) : (
                      <span className="text-text-secondary">{named(column, run.pathway)}</span>
                    )}
                    <StateMark cell={cell} />
                  </li>
                );
              })}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}
