import { useId, type ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import {
  changesSentence,
  drawnModules,
  moduleName,
  pathwayModules,
  pathwayName,
  serviceText,
  type Answers,
  type Summary,
} from "../api";
import {
  CASE_KINDS,
  choiceLabel,
  comparisonCaveat,
  documentDescription,
  EFFORTS,
  ISSUE_CLASSES,
  ISSUE_CLASSIFICATION,
  ISSUER_ID,
  LEVELS,
  lookupSentence,
  MODELS,
  PURPOSES,
  storedName,
} from "./plain";
import { StatusBadge } from "@/components/status/StatusBadge";
import { decided, groupLimits, leaveOut, type LimitGroup } from "./limits";
import {
  assumptionInputs,
  attachmentFacts,
  chosen,
  contextDetails,
  given,
  issuerDetails,
  moduleOptionInputs,
  NOT_GIVEN,
  valuationInputs,
  type InputGroup,
} from "./reviewInputs";

type EditStep = "documents" | "purpose" | "context";

/** Each term and its value; a fact whose value is `undefined` is left out. */
function Facts({ rows }: { rows: readonly (readonly [string, string | number | undefined])[] }) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      {rows
        .filter(([, value]) => value !== undefined)
        .map(([term, value]) => (
          <div key={term}>
            <dt className="text-text-tertiary">{term}</dt>
            <dd className="mt-1 font-medium text-text-primary">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function Block({
  title,
  edit,
  onEdit,
  disabled,
  children,
}: {
  title: string;
  edit?: EditStep;
  onEdit: (step: EditStep) => void;
  disabled: boolean;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="grid gap-3 rounded-lg bg-surface-subtle p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h4 id={titleId} className="font-semibold text-text-primary">
          {title}
        </h4>
        {edit && (
          <Button
            color="secondary"
            size="sm"
            isDisabled={disabled}
            onPress={() => {
              onEdit(edit);
            }}
          >
            {`Edit ${title.toLowerCase()}`}
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

/** A group's facts, then its inner groups; a group with neither reads as not given. */
function GroupBody({ group, depth }: { group: InputGroup; depth: number }) {
  if (!group.facts.length && !group.groups.length)
    return <p className="text-sm text-text-secondary">{NOT_GIVEN}</p>;
  return (
    <>
      {group.facts.length > 0 && <Facts rows={group.facts} />}
      {group.groups.map((inner) => (
        <Inputs key={inner.title} group={inner} depth={depth} />
      ))}
    </>
  );
}

/** An inner group: a section, a row or a module's pin, under its own heading. */
function Inputs({ group, depth }: { group: InputGroup; depth: number }) {
  const titleId = useId();
  const Heading = depth === 0 ? "h5" : "h6";
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="grid gap-2 border-l border-border-hairline pl-3"
    >
      <Heading id={titleId} className="text-sm font-semibold text-text-primary">
        {group.title}
      </Heading>
      <GroupBody group={group} depth={depth + 1} />
    </div>
  );
}

function List({ title, items }: { title: string; items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <>
      <h5 className="text-sm font-semibold text-text-primary">{title}</h5>
      <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
        {items.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>
    </>
  );
}

const OUTCOME_STATE = {
  will_refuse: "Will refuse",
  gap: "Gap",
  limited: "Limited",
  check: "Check",
} as const;

/** The omitted report sections by title; an older service sends no titles, so only their count. */
function omittedSentence({ omitted, omitted_titles }: Summary) {
  if (omitted_titles?.length === omitted.length)
    return `Report sections omitted · ${omitted_titles.join(", ")}`;
  return `${String(omitted.length)} report section${omitted.length === 1 ? " is" : "s are"} not produced`;
}

/** Both labels, or nothing: half of the pair would mislead. */
function modelAndEffort({ model, effort }: Summary) {
  const labels = [choiceLabel(MODELS, model), choiceLabel(EFFORTS, effort)];
  return labels.every(Boolean) ? labels.join(" · ") : undefined;
}

function scopeText(scope: string) {
  return scope === "run" ? "Whole run" : moduleName(scope);
}

function acceptanceLabel(group: LimitGroup) {
  if (group.kind === "check") return "I have checked this";
  return group.ids.length === 1
    ? "I accept this limit"
    : `I accept these ${String(group.ids.length)} limits`;
}

function moduleNames(items: readonly { scope: string }[]): string[] {
  return [...new Set(items.map((item) => scopeText(item.scope)))];
}

function nameList(names: readonly string[]): string {
  if (names.length < 3) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1) ?? ""}`;
}

type ModuleChoice = {
  requested: readonly string[];
  modules: readonly string[];
  onModules: (modules: string[]) => void;
};

function LeaveOut({
  group,
  choice,
  disabled,
}: {
  group: LimitGroup;
  choice: ModuleChoice;
  disabled: boolean;
}) {
  const kept = leaveOut(group, choice.requested, choice.modules);
  if (!kept) return null;
  const selected = choice.modules.length ? choice.modules : choice.requested;
  const left = selected.filter((code) => !kept.includes(code));
  const plural = left.length > 1;
  return (
    <div className="grid justify-items-start gap-1">
      <Button
        color="secondary"
        size="sm"
        isDisabled={disabled}
        onPress={() => {
          choice.onModules(kept);
        }}
      >
        {`Leave out ${nameList(left.map(moduleName))}`}
      </Button>
      <p>
        {plural
          ? "The report sections of the modules left out are not filled, and a run with modules left out is not used as the earlier run in a later Changes comparison."
          : "The report section of the module left out is not filled, and a run with modules left out is not used as the earlier run in a later Changes comparison."}
      </p>
    </div>
  );
}

function LimitCard({
  group,
  accepted,
  disabled,
  onAccept,
  choice,
}: {
  group: LimitGroup;
  accepted: ReadonlySet<string>;
  disabled: boolean;
  onAccept: (ids: readonly string[], checked: boolean) => void;
  choice: ModuleChoice;
}) {
  const fixes = [...new Set(group.causes.map((cause) => cause.fix ?? "").filter(Boolean))];
  const refusing = moduleNames(group.consequences.filter((item) => item.outcome === "will_refuse"));
  const affected = moduleNames(group.consequences).filter((name) => !refusing.includes(name));
  const reasonId = useId();
  return (
    <li className="grid gap-2 rounded-lg border border-border-hairline p-3 text-sm text-text-secondary">
      <StatusBadge set="Run limits" state={OUTCOME_STATE[group.outcome]} />
      {group.causes.map((cause, index) => (
        <div key={cause.id}>
          <p className="font-semibold text-text-primary">{scopeText(cause.scope)}</p>
          <p id={index === 0 ? reasonId : undefined}>{serviceText(cause.reason)}</p>
        </div>
      ))}
      {fixes.map((fix) => (
        <p key={fix}>{serviceText(fix)}</p>
      ))}
      {refusing.length > 0 && <p>Will also refuse: {refusing.join(", ")}</p>}
      {affected.length > 0 && <p>Also affects: {affected.join(", ")}</p>}
      <LeaveOut group={group} choice={choice} disabled={disabled} />
      <label className="flex items-center gap-2 font-semibold text-text-primary">
        <input
          type="checkbox"
          aria-describedby={reasonId}
          checked={decided(group, accepted)}
          disabled={disabled}
          onChange={(event) => {
            onAccept(group.ids, event.target.checked);
          }}
        />
        {acceptanceLabel(group)}
      </label>
    </li>
  );
}

function LimitsToDecide({
  items,
  accepted,
  disabled,
  onAccept,
  choice,
}: {
  items: Summary["items"];
  accepted: ReadonlySet<string>;
  disabled: boolean;
  onAccept: (ids: readonly string[], checked: boolean) => void;
  choice: ModuleChoice;
}) {
  const titleId = useId();
  const { groups, passive } = groupLimits(items);
  const decidedCount = groups.filter((group) => decided(group, accepted)).length;
  return (
    <section aria-labelledby={titleId} className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={titleId} className="font-semibold text-text-primary">
          Limits to decide
        </h3>
        {groups.length > 0 && (
          <span className="text-sm text-text-tertiary">
            {decidedCount} of {groups.length} decided
          </span>
        )}
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-text-secondary">No limits found for this run.</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => (
            <LimitCard
              key={group.key}
              group={group}
              accepted={accepted}
              disabled={disabled}
              onAccept={onAccept}
              choice={choice}
            />
          ))}
        </ul>
      )}
      {passive.length > 0 && (
        <details className="text-sm text-text-secondary">
          <summary className="cursor-pointer">{`No action needed (${String(passive.length)})`}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {passive.map((item) => (
              <li key={item.id}>
                {serviceText(item.reason)}
                {item.fix ? ` ${serviceText(item.fix)}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function ReviewSheet({
  review,
  accepted,
  onAccept,
  onEdit,
  onModules,
  disabled,
}: {
  review: { answers: Answers; summary: Summary };
  accepted: ReadonlySet<string>;
  onAccept: (ids: readonly string[], checked: boolean) => void;
  onEdit: (step: EditStep) => void;
  onModules: (modules: string[]) => void;
  disabled: boolean;
}) {
  const titleId = useId();
  const { summary, answers } = review;
  const { run, identity } = answers.context;
  const changes = summary.prior
    ? `Compared with the ${pathwayName(summary.prior.pathway)} run as of ${summary.prior.as_of}${comparisonCaveat(summary.changes)}`
    : changesSentence(summary.changes);
  const block = { onEdit, disabled };
  const requested = pathwayModules(run.pathway);
  const choice = { requested, modules: answers.modules, onModules };
  const leftOut = answers.modules.length
    ? requested.filter((code) => !answers.modules.includes(code)).map(moduleName)
    : [];
  const advanced = answers.level === "advanced";
  // Valuation, Module options and Scenario assumptions are drawn only at the Advanced level.
  const inputBlocks = [
    { group: issuerDetails(answers.context), drawn: true },
    { group: contextDetails(answers.context), drawn: true },
    { group: valuationInputs(answers.context, advanced), drawn: advanced },
    { group: moduleOptionInputs(answers.context, requested, advanced), drawn: advanced },
    { group: assumptionInputs(answers.context, requested, advanced), drawn: advanced },
  ];
  return (
    <>
      <section aria-labelledby={titleId} className="grid gap-4">
        <h3 id={titleId} className="font-semibold text-text-primary">
          What will run
        </h3>
        <Block title="Issuer and documents" edit="documents" {...block}>
          <Facts
            rows={[
              ["Issuer", identity.issuer_name],
              [ISSUER_ID, identity.issuer_id],
              ["As-of date", given(run.as_of)],
              [ISSUE_CLASSIFICATION, chosen(ISSUE_CLASSES, identity.issue_classification)],
              ["Submitted by", answers.submitted_by],
            ]}
          />
          <List
            title="Documents read"
            items={summary.documents.map(
              (doc) => `${storedName(doc)} · ${documentDescription(doc)}`,
            )}
          />
          <List
            title="Documents ignored"
            items={summary.ignored.map((doc) =>
              typeof doc === "string" ? doc : `${doc.source} · ${doc.reason}`,
            )}
          />
        </Block>
        <Block title="Purpose and modules" edit="purpose" {...block}>
          <Facts
            rows={[
              ["Pathway", pathwayName(run.pathway)],
              ["Purpose", chosen(PURPOSES, run.run_type)],
              ["Case kind", choiceLabel(CASE_KINDS, run.case_kind)],
              ["Form level", choiceLabel(LEVELS, answers.level)],
            ]}
          />
          <List
            title={`Modules (${String(drawnModules(summary.modules).length)})`}
            items={drawnModules(summary.modules).map(moduleName)}
          />
          {leftOut.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
              <p>Left out: {leftOut.join(", ")}</p>
              <Button
                color="secondary"
                size="sm"
                isDisabled={disabled}
                onPress={() => {
                  onModules([]);
                }}
              >
                Put back
              </Button>
            </div>
          )}
          {summary.omitted.length > 0 && (
            <p className="text-sm text-text-secondary">{omittedSentence(summary)}</p>
          )}
        </Block>
        <Block title="Context" edit="context" {...block}>
          <Facts
            rows={[
              ["Current period", given(run.current_period)],
              ["Prior period", given(run.prior_period)],
              ["Research cutoff", given(run.cutoff)],
              // The service's own sentence, not an input: drawn only when it wrote one.
              ["Changes", changes || undefined],
              ...attachmentFacts(answers.context),
            ]}
          />
          <List title="Source lookup" items={(summary.lookup ?? []).map(lookupSentence)} />
          {summary.web_search === true && (
            <p className="text-sm text-text-secondary">
              The research module will search the web. The issuer&apos;s name and the questions it
              researches go to OpenAI&apos;s search.
            </p>
          )}
          {summary.web_lookup === true && (
            <p className="text-sm text-text-secondary">
              The research module may read Yahoo Finance pages. Their addresses name what it looks
              up, such as the issuer&apos;s ticker, so Yahoo sees which issuer is researched; no
              document is sent.
            </p>
          )}
        </Block>
        {inputBlocks.map(
          ({ group, drawn }) =>
            group && (
              <Block
                key={group.title}
                title={group.title}
                edit={drawn ? "context" : undefined}
                {...block}
              >
                <GroupBody group={group} depth={0} />
              </Block>
            ),
        )}
        <Block title="Advanced choices" {...block}>
          <Facts
            rows={[
              ["Model and effort", modelAndEffort(summary)],
              ["Turns per module", answers.max_turns],
            ]}
          />
          {!advanced && (
            <p className="text-sm text-text-secondary">Fixed below the Advanced form level.</p>
          )}
        </Block>
      </section>
      <LimitsToDecide
        items={summary.items}
        accepted={accepted}
        disabled={disabled}
        onAccept={onAccept}
        choice={choice}
      />
    </>
  );
}
