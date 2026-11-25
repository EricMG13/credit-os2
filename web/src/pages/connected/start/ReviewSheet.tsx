import { useId, type ReactNode } from "react";
import { ChevronDown } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
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
  COMPARISON_PORTFOLIO,
  comparisonCaveat,
  comparisonLine,
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
import { Figure, GapNote, Tile, Well } from "../report/overview/Tile";
import { decided, groupLimits, leaveOut, type LimitGroup } from "./limits";
import { moduleNames, OUTCOME_STATE, scopeText } from "./limitWords";
import { moduleReadiness } from "./moduleReadiness";
import { StagePipeline } from "./StagePipeline";
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

/** At least 32 px tall everywhere, 44 px at phone width. */
const TARGET = "min-h-8 max-[480px]:min-h-11";
const CHECK_TARGET = "min-h-8 max-[480px]:min-h-11";
const SUMMARY = cx(
  "flex w-fit cursor-pointer list-none items-center gap-1 rounded-ds-xs text-small font-medium text-text-link outline-focus-ring hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden",
  TARGET,
);

/** A disclosure's summary drawn as the control it is: link colour and a chevron that turns. */
function Opener({ children }: { children: ReactNode }) {
  return (
    <summary className={SUMMARY}>
      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform group-open/opener:rotate-180"
      />
      {children}
    </summary>
  );
}

/** Each term and its value; a fact whose value is `undefined` is left out. */
function Facts({ rows }: { rows: readonly (readonly [string, string | number | undefined])[] }) {
  return (
    <dl className="grid gap-4 text-small sm:grid-cols-2">
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
  notGiven,
  children,
}: {
  title: string;
  edit?: EditStep;
  onEdit: (step: EditStep) => void;
  disabled: boolean;
  /** When every input the block holds is not given: their names, and the block is one line. */
  notGiven?: readonly string[];
  children?: ReactNode;
}) {
  const titleId = useId();
  const editButton = edit && (
    <Button
      color="secondary"
      size="sm"
      className={TARGET}
      isDisabled={disabled}
      onPress={() => {
        onEdit(edit);
      }}
    >
      {`Edit ${title.toLowerCase()}`}
    </Button>
  );
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className={cx("min-w-0", notGiven && "xl:col-span-2")}
    >
      {notGiven ? (
        <Well className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <h4 id={titleId} className="text-small font-medium text-text-primary">
              {title}
            </h4>
            <p className="min-w-0 text-small text-text-secondary">
              {notGiven.length ? `${NOT_GIVEN}: ${notGiven.join(", ")}` : NOT_GIVEN}
            </p>
          </div>
          {editButton}
        </Well>
      ) : (
        <Well className="grid h-full content-start gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 id={titleId} className="text-body font-medium text-text-primary">
              {title}
            </h4>
            {editButton}
          </div>
          {children}
        </Well>
      )}
    </div>
  );
}

/** A group's facts, then its inner groups; a group with neither reads as not given. */
function GroupBody({ group, depth }: { group: InputGroup; depth: number }) {
  if (!group.facts.length && !group.groups.length)
    return <p className="text-small text-text-secondary">{NOT_GIVEN}</p>;
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
      <Heading id={titleId} className="text-small font-medium text-text-primary">
        {group.title}
      </Heading>
      <GroupBody group={group} depth={depth + 1} />
    </div>
  );
}

function List({
  title,
  items,
  columns = false,
}: {
  title: string;
  items: readonly string[];
  /** A long list of short names, set in two columns where there is room. */
  columns?: boolean;
}) {
  if (!items.length) return null;
  return (
    <>
      <h5 className="text-small font-medium text-text-primary">{title}</h5>
      <ul
        className={cx(
          "list-disc space-y-1 pl-5 text-small text-text-secondary",
          columns && "sm:columns-2 sm:gap-6",
        )}
      >
        {items.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>
    </>
  );
}

/** The omitted report sections by title; an older service sends no titles, so only their count. */
function omittedSentence({ omitted, omitted_titles, prior, changes }: Summary) {
  if (omitted.length === 1 && omitted[0] === "what-changed" && !prior && /first run/i.test(changes))
    return "Changes: not compared (first run of this pathway).";
  if (omitted_titles?.length === omitted.length)
    return `Report sections omitted · ${omitted_titles.map((title) => (title === "What changed since the last Report" ? "Changes since the last run" : title)).join(", ")}`;
  return `${String(omitted.length)} report section${omitted.length === 1 ? " is" : "s are"} not produced`;
}

/** Both labels, or nothing: half of the pair would mislead. */
function modelAndEffort({ model, effort }: Summary) {
  const labels = [choiceLabel(MODELS, model), choiceLabel(EFFORTS, effort)];
  return labels.every(Boolean) ? labels.join(" · ") : undefined;
}

function acceptanceLabel(group: LimitGroup) {
  if (group.kind === "check") return "I have checked this";
  const limits = group.causes.length;
  const label = limits === 1 ? "I accept this limit" : `I accept these ${String(limits)} limits`;
  const consequences = group.consequences.length;
  return consequences === 0
    ? label
    : `${label} and ${limits === 1 ? "its" : "their"} ${String(consequences)} ${consequences === 1 ? "consequence" : "consequences"}`;
}

function nameList(names: readonly string[]): string {
  if (names.length < 3) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1) ?? ""}`;
}

type ModuleChoice = {
  requested: readonly string[];
  modules: readonly string[];
  onModules: (modules: string[]) => void;
  onEdit: (step: EditStep) => void;
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
        className={cx("max-w-full text-left whitespace-normal", TARGET)}
        isDisabled={disabled}
        onPress={() => {
          choice.onModules(kept);
        }}
      >
        {`Leave out ${nameList(left.map((code) => moduleName(code)))}`}
      </Button>
      <p>You will return to More context and review again; approval will be cleared.</p>
      <p>
        {plural
          ? "The report sections of the modules left out are not filled, and a run with modules left out is not used as the earlier run in a later Changes comparison."
          : "The report section of the module left out is not filled, and a run with modules left out is not used as the earlier run in a later Changes comparison."}
      </p>
    </div>
  );
}

/** How the limit can be lifted instead of accepted: the service's fixes and the leave-out choice. */
function HowToLift({
  group,
  fixes,
  choice,
  disabled,
}: {
  group: LimitGroup;
  fixes: readonly string[];
  choice: ModuleChoice;
  disabled: boolean;
}) {
  const canLeaveOut = leaveOut(group, choice.requested, choice.modules) !== null;
  if (!fixes.length && !canLeaveOut) return null;
  return (
    <details className="group/opener min-w-0">
      <Opener>How to lift it</Opener>
      <div className="mt-2 grid gap-2">
        {fixes.map((fix) => (
          <p key={fix}>{serviceText(fix)}</p>
        ))}
        {fixes.some((fix) => /portfolio workbook/i.test(fix)) && (
          <Button
            color="secondary"
            size="sm"
            className={cx("w-fit", TARGET)}
            isDisabled={disabled}
            onPress={() => {
              choice.onEdit("context");
            }}
          >
            Choose the Portfolio workbook
          </Button>
        )}
        <LeaveOut group={group} choice={choice} disabled={disabled} />
      </div>
    </details>
  );
}

/** One limit: its mark, what it limits and why, on one line; then the control that decides it. */
function LimitRow({
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
    <li className="grid gap-x-6 gap-y-1 py-2 text-small text-text-secondary first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1">
        <StatusBadge
          set="Run limits"
          state={OUTCOME_STATE[group.outcome]}
          // One size for the four: the gap badge's own colour set draws it smaller.
          className="shrink-0 text-small"
        />
        <div className="grid min-w-0 flex-1 gap-0.5">
          {group.causes.map((cause, index) => (
            <p key={cause.id}>
              <span className="font-medium text-text-primary">{scopeText(cause.scope)}</span>
              {" · "}
              <span id={index === 0 ? reasonId : undefined}>{serviceText(cause.reason)}</span>
            </p>
          ))}
          {refusing.length > 0 && (
            <p className="text-caption">Will also refuse: {refusing.join(", ")}</p>
          )}
          {affected.length > 0 && (
            <p className="text-caption">Also affects: {affected.join(", ")}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 md:flex-col md:items-end md:justify-start">
        <label
          className={cx("flex items-center gap-2 font-medium text-text-primary", CHECK_TARGET)}
        >
          <input
            className="size-4 shrink-0"
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
        <HowToLift group={group} fixes={fixes} choice={choice} disabled={disabled} />
      </div>
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
  const { groups, passive } = groupLimits(items);
  const decidedCount = groups.filter((group) => decided(group, accepted)).length;
  return (
    <section aria-label="Limits to decide" className="grid min-w-0 gap-2 wrap-anywhere">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="text-h4 font-medium text-text-primary">Limits to decide</h3>
          {groups.length > 0 && (
            <p className="font-mono text-small text-text-tertiary tabular-nums">
              {decidedCount} of {groups.length} decided
            </p>
          )}
        </div>
        {/* What needs no decision sits beside the heading; opened, it takes the full width. */}
        {passive.length > 0 && (
          <details className="group/opener text-small text-text-secondary open:basis-full">
            <Opener>{`No action needed (${String(passive.length)})`}</Opener>
            <ul className="mt-1 mb-2 list-disc space-y-1 pl-5">
              {passive.map((item) => (
                <li key={item.id}>
                  {serviceText(item.reason)
                    .replace("What changed since the last Report", "Changes since the last run")
                    .replace(
                      /^This pathway does not produce the (.+) report section\.$/,
                      'This pathway does not produce the "$1" section.',
                    )}
                  {item.fix ? ` ${serviceText(item.fix)}` : ""}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      {groups.length === 0 ? (
        <p className="text-small text-text-secondary">No limits found for this run.</p>
      ) : (
        <ul className="divide-y divide-border-hairline">
          {groups.map((group) => (
            <LimitRow
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
    </section>
  );
}

/**
 * What leaves the service for a run, in the service's own terms, stated before Submit: the
 * research module's search status, its web search and its Yahoo Finance lookups. When the summary
 * states none of these, the page says so as a gap; it never says that nothing leaves.
 */
function LeavesTheBuilding({ summary }: { summary: Summary }) {
  const status = summary.copilot_search && summary.modules.includes("CP-DR");
  const stated = Boolean(status) || summary.web_search === true || summary.web_lookup === true;
  return (
    <section aria-label="What leaves the building" className="grid min-w-0 gap-2 wrap-anywhere">
      <h3 className="text-small font-medium text-text-primary">What leaves the building</h3>
      {stated ? (
        <Well className="grid gap-2">
          {status && <p className="text-small text-text-secondary">{summary.copilot_search}</p>}
          {summary.web_search === true && (
            <p className="text-small text-text-secondary">
              The research module will search the web. The issuer&apos;s name and the questions it
              researches go to OpenAI&apos;s search.
            </p>
          )}
          {summary.web_lookup === true && (
            <p className="text-small text-text-secondary">
              The research module may read Yahoo Finance pages. Their addresses name what it looks
              up, such as the issuer&apos;s ticker, so Yahoo sees which issuer is researched; no
              document is sent.
            </p>
          )}
        </Well>
      ) : (
        <GapNote>The service does not say what leaves.</GapNote>
      )}
    </section>
  );
}

/** The run in one line from the reviewed answers and the summary. */
function RunLine({ answers, summary }: { answers: Answers; summary: Summary }) {
  const { run, identity } = answers.context;
  const view = chosen(PURPOSES, run.run_type);
  const documents = summary.documents.length;
  const modules = drawnModules(summary.modules).length;
  return (
    <p className="min-w-0 text-small text-text-secondary wrap-anywhere">
      <span className="font-medium text-text-primary">
        {`${pathwayName(run.pathway)} of ${identity.issuer_name}`}
      </span>
      {" · "}
      {[`As of ${given(run.as_of)}`, view === NOT_GIVEN ? undefined : view]
        .filter(Boolean)
        .join(" · ")}
      {" · "}
      <Figure>{documents}</Figure> {documents === 1 ? "document" : "documents"} read ·{" "}
      <Figure>{modules}</Figure> {modules === 1 ? "module" : "modules"}
    </p>
  );
}

/** Whether every input a group holds reads as not given. */
function allNotGiven(group: InputGroup): boolean {
  return group.facts.every(([, value]) => value === NOT_GIVEN) && group.groups.every(allNotGiven);
}

/** The names of a group's inputs; an inner group by its title, with its own inputs after it. */
function inputNames(group: InputGroup): string[] {
  return [
    ...group.facts.map(([label]) => label),
    ...group.groups.map((inner) => {
      const names = inputNames(inner);
      return names.length ? `${inner.title} (${names.join(", ")})` : inner.title;
    }),
  ];
}

/**
 * The parts of the decision the review step draws: its heading and mode, the cap, the notes that
 * qualify the run, and the consent with Submit.
 */
export type DecisionParts = {
  head: ReactNode;
  mode: ReactNode;
  cost: ReactNode;
  notes: ReactNode;
  submit: ReactNode;
};

/**
 * Review and start: one decision tile, then everything Submit sends behind one closed disclosure.
 * The tile leads with the run and its cap, then each limit with the control that decides it, then
 * what leaves the building beside the consent and Submit, and last the modules by stage (from xl
 * the rail beside the tile draws those, so the tile does not draw them twice).
 */
export function ReviewSheet({
  review,
  accepted,
  onAccept,
  onEdit,
  onModules,
  disabled,
  synthetic = false,
  decision,
}: {
  review: {
    answers: Answers;
    summary: Summary;
    attachmentNames?: Readonly<Record<string, string | undefined>>;
  };
  accepted: ReadonlySet<string>;
  onAccept: (ids: readonly string[], checked: boolean) => void;
  onEdit: (step: EditStep) => void;
  onModules: (modules: string[]) => void;
  disabled: boolean;
  synthetic?: boolean;
  decision?: DecisionParts;
}) {
  const { summary, answers } = review;
  const requested = pathwayModules(answers.context.run.pathway);
  const choice = { requested, modules: answers.modules, onModules, onEdit };
  return (
    <>
      <Tile span={12} label="Review and start" className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="grid min-w-0 flex-1 basis-72 gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {decision?.head}
              {decision?.mode}
            </div>
            <RunLine answers={answers} summary={summary} />
          </div>
          <section
            aria-label="What it will cost"
            className="grid min-w-0 content-start gap-0.5 wrap-anywhere sm:justify-items-end sm:text-right"
          >
            {decision?.cost}
          </section>
        </div>
        <LimitsToDecide
          items={summary.items}
          accepted={accepted}
          disabled={disabled}
          onAccept={onAccept}
          choice={choice}
        />
        <div className="grid min-w-0 grid-cols-1 gap-5 border-t border-border-hairline pt-4 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-x-8">
          <div className="flex min-w-0 flex-col gap-3">
            <LeavesTheBuilding summary={summary} />
            {decision?.notes}
          </div>
          <div className="flex min-w-0 flex-col gap-3">{decision?.submit}</div>
        </div>
        <section
          aria-label="Modules by stage"
          className="grid min-w-0 content-start gap-2 border-t border-border-hairline pt-4 xl:hidden"
        >
          <h3 className="text-small font-medium text-text-primary">Modules by stage</h3>
          <StagePipeline
            readiness={moduleReadiness([], { modules: summary.modules, items: summary.items })}
            label="Stages in this run"
            named={false}
            layout="matrix"
          />
        </section>
      </Tile>
      <EverythingSubmitSends
        review={review}
        disabled={disabled}
        synthetic={synthetic}
        onEdit={onEdit}
        onModules={onModules}
      />
    </>
  );
}

/** Every input Submit sends, grouped as the form asks for them, behind one closed disclosure. */
function EverythingSubmitSends({
  review,
  disabled,
  synthetic,
  onEdit,
  onModules,
}: {
  review: {
    answers: Answers;
    summary: Summary;
    attachmentNames?: Readonly<Record<string, string | undefined>>;
  };
  disabled: boolean;
  synthetic: boolean;
  onEdit: (step: EditStep) => void;
  onModules: (modules: string[]) => void;
}) {
  const { summary, answers } = review;
  const { run, identity } = answers.context;
  const changes = summary.prior
    ? `Compared with the ${pathwayName(summary.prior.pathway)} run as of ${summary.prior.as_of}${comparisonCaveat(summary.changes)}`
    : changesSentence(summary.changes);
  const block = { onEdit, disabled };
  const requested = pathwayModules(run.pathway);
  const leftOut = answers.modules.length
    ? requested
        .filter((code) => !answers.modules.includes(code))
        .map((code) => moduleName(code, run.pathway))
    : [];
  const advanced = answers.level === "advanced";
  // Valuation, Module options and Scenario assumptions are drawn only at the Advanced level.
  const inputBlocks = [
    { group: issuerDetails(answers.context), drawn: true },
    { group: contextDetails(answers.context), drawn: true },
    { group: valuationInputs(answers.context, advanced), drawn: advanced },
    { group: moduleOptionInputs(answers.context, requested, advanced), drawn: advanced },
    { group: assumptionInputs(answers.context, requested, advanced), drawn: advanced },
  ].flatMap(({ group, drawn }) => (group ? [{ group, drawn }] : []));
  const empty = inputBlocks.filter(({ group }) => allNotGiven(group)).length;
  const count = 4 + inputBlocks.length;
  return (
    <details className="group min-w-0">
      <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-ds-lg border border-border-subtle bg-surface-card px-5 py-3 outline-focus-ring hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-body font-medium text-text-primary">
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-text-tertiary transition-transform group-open:rotate-180"
          />
          Everything Submit sends
        </span>
        <span className="text-small text-text-secondary tabular-nums">
          {`${String(count)} groups of inputs${empty ? ` · ${String(empty)} not given` : ""}`}
        </span>
      </summary>
      <div className="mt-4">
        <Tile
          span={12}
          label="What will run"
          kicker="Every input Submit sends"
          title="What will run"
          className="wrap-anywhere"
        >
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <Block title="Issuer and documents" edit="documents" {...block}>
              <Facts
                rows={[
                  ["Issuer", identity.issuer_name],
                  [ISSUER_ID, identity.issuer_id],
                  ["As-of date", given(run.as_of)],
                  [ISSUE_CLASSIFICATION, chosen(ISSUE_CLASSES, identity.issue_classification)],
                  ["Submitted by", answers.submitted_by],
                  // Drawn only when the run has one; it is not one of the documents read.
                  [
                    COMPARISON_PORTFOLIO,
                    summary.reference_portfolio && comparisonLine(summary.reference_portfolio),
                  ],
                ]}
              />
              <List
                title="Documents read"
                items={summary.documents.map(
                  (doc) => `${storedName(doc)} · ${documentDescription(doc)}`,
                )}
              />
              {synthetic && summary.documents.some((doc) => doc.kind === "unrecognised") && (
                <p className="text-small text-text-secondary">
                  These are synthetic test documents; an unrecognised document type can still be a
                  supplied sample file.
                </p>
              )}
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
                  ["Market view", chosen(PURPOSES, run.run_type)],
                  ["Case kind", choiceLabel(CASE_KINDS, run.case_kind)],
                  ["Form level", choiceLabel(LEVELS, answers.level)],
                ]}
              />
              <List
                title={`Modules (${String(drawnModules(summary.modules).length)})`}
                items={drawnModules(summary.modules).map((code) => moduleName(code, run.pathway))}
                columns
              />
              {leftOut.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-small text-text-secondary">
                  <p>Left out: {leftOut.join(", ")}</p>
                  <Button
                    color="secondary"
                    size="sm"
                    className={TARGET}
                    isDisabled={disabled}
                    onPress={() => {
                      onModules([]);
                    }}
                  >
                    Put back
                  </Button>
                  <p>You will return to More context and review again; approval will be cleared.</p>
                </div>
              )}
              {summary.omitted.length > 0 && (
                <p className="text-small text-text-secondary">{omittedSentence(summary)}</p>
              )}
            </Block>
            <Block title="Context" edit="context" {...block}>
              <Facts
                rows={[
                  ["Current period", given(run.current_period)],
                  ["Prior period", given(run.prior_period)],
                  ["Research cutoff", given(run.cutoff)],
                  // Sent only when the analyst set it; drawn only then.
                  ["Date of your newest file", answers.newest_document_date],
                  // The service's own sentence, not an input: drawn only when it wrote one.
                  ["Changes", changes || undefined],
                  ...attachmentFacts(answers.context, review.attachmentNames),
                ]}
              />
              <List title="Source lookup" items={(summary.lookup ?? []).map(lookupSentence)} />
            </Block>
            {inputBlocks.map(({ group, drawn }) => (
              <Block
                key={group.title}
                title={group.title}
                edit={drawn ? "context" : undefined}
                {...(allNotGiven(group) ? { notGiven: inputNames(group) } : {})}
                {...block}
              >
                <GroupBody group={group} depth={0} />
              </Block>
            ))}
            <Block title="Advanced choices" {...block}>
              <Facts
                rows={[
                  ["Model and effort", modelAndEffort(summary)],
                  ["Turns per module", answers.max_turns],
                ]}
              />
              {!advanced && (
                <p className="text-small text-text-secondary">
                  Model and effort are set at the Advanced form level.
                </p>
              )}
            </Block>
          </div>
        </Tile>
      </div>
    </details>
  );
}
