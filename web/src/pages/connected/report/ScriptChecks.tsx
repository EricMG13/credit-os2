import { EmptyState } from "@/components/application/empty-state/empty-state";
import { StatsStrip } from "@/components/kit/StatsStrip";
import { ChevronDown, FileSearch02 } from "@untitledui/icons";
import { moduleName } from "../api";
import type { ScriptCheckOutcome, ScriptCheckRecord } from "../publishedReport";
import { CheckingRecord } from "./CheckingRecord";
import { ModuleOutcomeTable } from "./ModuleOutcomeTable";
import { GapNote, Tile } from "./overview/Tile";
import { byAttention, CheckCard, CheckStatusMark, groupOutcomes, tally } from "./scriptCheckParts";

type ModuleOutcomes = readonly [string, readonly ScriptCheckOutcome[]];

/** At most this many agreed checks are drawn open; more are a closed group. */
const OPEN_AGREED = 20;

/** Each module holding a record, in record order, with all its outcomes. */
function byModule(records: readonly ScriptCheckRecord[]): ModuleOutcomes[] {
  const modules = new Map<string, ScriptCheckOutcome[]>();
  for (const { module, outcomes } of records)
    modules.set(module, [...(modules.get(module) ?? []), ...outcomes]);
  return [...modules];
}

/** The checks that recorded one status word, under their modules; merged only within a module. */
function OutcomeGroup({
  status,
  modules,
  count,
  pathway,
}: {
  status: string;
  modules: readonly ModuleOutcomes[];
  count: number;
  pathway?: string | null;
}) {
  const open = status === "not checked" ? false : status === "agreed" ? count <= OPEN_AGREED : true;
  const held = modules.flatMap(([id, outcomes]) => {
    const own = outcomes.filter((outcome) => outcome.status === status);
    return own.length > 0 ? [[id, own] as const] : [];
  });
  return (
    <section className="min-w-0">
      <details className="group rounded-ds-md border border-border-hairline" open={open}>
        <summary className="flex min-h-8 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 max-[480px]:min-h-11">
          <CheckStatusMark status={status} glyphOnly />
          <h4 className="text-h4 font-medium text-text-primary">
            {status} · {count}
          </h4>
          {status === "not checked" && (
            <span className="text-small text-text-secondary">
              {count === 1 ? "1 item" : `${String(count)} items`} without a completed script check;
              the reason for each is inside
            </span>
          )}
          <ChevronDown
            className="ml-auto size-4 shrink-0 text-text-tertiary group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="grid gap-5 px-4 pb-4">
          {held.map(([id, own]) => (
            <div className="grid min-w-0 gap-1" key={id}>
              <h5 className="pt-2 text-small font-medium text-text-secondary">
                {moduleName(id, pathway)}
              </h5>
              {groupOutcomes(own).map((group, index) => (
                <CheckCard group={group} key={index} />
              ))}
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function Outcomes({
  modules,
  pathway,
}: {
  modules: readonly ModuleOutcomes[];
  pathway?: string | null;
}) {
  const counts = tally(modules.flatMap(([, outcomes]) => outcomes));
  const statuses = counts.map(([status]) => status);
  if (counts.length === 0)
    return <GapNote>No check outcome is recorded for this selection.</GapNote>;
  return (
    <>
      <StatsStrip
        label="Script check outcomes"
        stats={counts.map(([status, n]) => ({ label: status, value: String(n) }))}
      />
      <ModuleOutcomeTable modules={modules} statuses={statuses} pathway={pathway} />
      {[...counts]
        .sort(([a], [b]) => byAttention(a, b))
        .map(([status, n]) => (
          <OutcomeGroup
            key={status}
            status={status}
            modules={modules}
            count={n}
            pathway={pathway}
          />
        ))}
    </>
  );
}

export function ScriptChecks({
  records,
  module,
  pathway,
}: {
  records: ScriptCheckRecord[];
  module?: string;
  pathway?: string | null;
}) {
  const selected = records.filter((record) => !module || record.module === module);
  const modules = byModule(selected);
  return (
    <Tile
      span={12}
      label="Script checks"
      kicker="Recorded figures and registers against recorded checking scripts"
      title="Script checks"
    >
      <p className="text-small text-text-secondary">
        A script check compares a recorded figure or register with the result of a recorded checking
        script.
      </p>
      <p className="text-small text-text-secondary">
        “Not checked” means no completed script check is recorded for that item; its reason states
        whether a script was unavailable or was not run.
      </p>
      {selected.length ? (
        <>
          <Outcomes modules={modules} pathway={pathway} />
          <CheckingRecord records={selected} pathway={pathway} />
        </>
      ) : (
        <EmptyState className="py-5">
          <EmptyState.Header>
            <EmptyState.FeaturedIcon icon={FileSearch02} />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title as="h3">No script checks recorded</EmptyState.Title>
            <EmptyState.Description>
              {module
                ? `No script-check record is held for ${moduleName(module, pathway)}.`
                : "No script-check record is held for this run."}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState>
      )}
    </Tile>
  );
}
