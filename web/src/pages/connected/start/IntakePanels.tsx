import {
  useRef,
  type MouseEvent,
  type RefObject,
  type SubmitEvent,
  type SyntheticEvent,
} from "react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { Stepper } from "../../run/start/Stepper";
import { Bento, Tile } from "../report/overview/Tile";
import { pathwayName } from "../api";
import { ErrorNotice, heading } from "../layout";
import { moduleReadiness } from "./moduleReadiness";
import { ReadinessRail, type ReadinessSource } from "./ReadinessRail";
import { copilotPairVerified, refusalLines } from "./plain";
import {
  type FormStep,
  STEPPER_STEPS,
  STEP_TOTAL,
  FORM_STEP_KEYS,
  STEP_GUIDANCE,
  EARNINGS_CONTEXT_GUIDANCE,
  type Review,
  type IntakeView,
  type ReadinessRow,
} from "./intake";
import { DocumentFields } from "./DocumentsStep";
import { PurposeFields } from "./PurposeStep";
import { ContextFields } from "./ContextStep";
import { ReviewConfirmation } from "./ReviewStep";
import { HEADING_FOCUS, focusStep, invalidMessage, openHolders, type FieldKey } from "./fields";

function StepFields({
  view,
  folderInput,
}: {
  view: IntakeView;
  folderInput: RefObject<HTMLInputElement | null>;
}) {
  switch (view.step) {
    case "documents":
      return <DocumentFields view={view} folderInput={folderInput} />;
    case "purpose":
      return <PurposeFields view={view} />;
    case "context":
      return <ContextFields view={view} />;
  }
}

/** At least 32 px tall everywhere, 44 px at phone width. */
const TARGET = "min-h-8 max-[480px]:min-h-11";

type IntakePanelsProps = {
  step: FormStep;
  review?: Review;
  error: string;
  otherProblems: readonly string[];
  accepted: Set<string>;
  approved: boolean;
  checksComplete: boolean;
  busy?: "review" | "submit" | "documents" | "copy";
  submitUncertain: boolean;
  capText: string | null;
  cap: number | null;
  synthetic: boolean;
  view: IntakeView;
  folderInput: RefObject<HTMLInputElement | null>;
  title: string;
  previous: FormStep | null;
  next: string;
  readiness: ReadinessRow[];
  focusHeading: boolean;
  onAccept: (ids: readonly string[], checked: boolean) => void;
  onApprove: (value: boolean) => void;
  onEdit: (step: FormStep) => void;
  onModules: (modules: string[]) => void;
  onSubmit: () => void;
  onAdvance: (event: SubmitEvent<HTMLFormElement>) => void;
  onPrevious: () => void;
};

/** Refusal lines in the screen's own words: one as a sentence, several as a list. */
function RefusalNotice({ lines }: { lines: readonly string[] }) {
  const [only] = lines;
  return (
    <ErrorNotice>
      {lines.length === 1 ? (
        only
      ) : (
        <ul className="list-disc pl-5">
          {lines.map((line, position) => (
            <li key={position}>{line}</li>
          ))}
        </ul>
      )}
    </ErrorNotice>
  );
}

export function IntakePanels(props: IntakePanelsProps) {
  const {
    step,
    review,
    error,
    otherProblems,
    accepted,
    approved,
    checksComplete,
    busy,
    submitUncertain,
    capText,
    cap,
    synthetic,
    view,
    folderInput,
    title,
    previous,
    next,
    readiness,
    focusHeading,
    onAccept,
    onApprove,
    onEdit,
    onModules,
    onSubmit,
    onAdvance,
    onPrevious,
  } = props;
  const shownCap = cap && capText ? capText : null;
  const ready = `${String(readiness.filter((row) => row.met).length)} of ${String(readiness.length)} ready · ${shownCap ? `Cap ${shownCap}` : "Cap unavailable"}`;
  const planned = view.modules.length ? view.modules : view.requested;
  const checked = review?.summary ?? view.checked;
  const source: ReadinessSource = review ? "review" : view.checked ? "last" : "unchecked";
  return (
    <div className="mt-6">
      <Bento>
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-12 xl:col-span-8">
          <Tile span={12} label="Progress" className="@container gap-3 py-4 sm:py-4">
            <Stepper
              step={review ? "start" : step}
              steps={STEPPER_STEPS.map((item) =>
                item.key === "context" && view.earnings
                  ? { ...item, note: "Periods required" }
                  : item.key === "start" && synthetic
                    ? { ...item, note: "No-cost test" }
                    : item,
              )}
              onSelect={
                busy === undefined && !submitUncertain
                  ? (key) => {
                      onEdit(key as FormStep);
                    }
                  : undefined
              }
            />
            <p className="text-caption text-text-tertiary tabular-nums @[620px]:hidden">
              {review
                ? `Step ${String(STEP_TOTAL)} of ${String(STEP_TOTAL)} · Review and start`
                : `Step ${String(FORM_STEP_KEYS.indexOf(step) + 1)} of ${String(STEP_TOTAL)} · ${title}`}
            </p>
          </Tile>
          {error && !review && <RefusalNotice lines={refusalLines(error)} />}
          <p role="status" className="text-small text-text-secondary empty:hidden">
            {view.changeNotice}
          </p>
          {otherProblems.length > 0 && <RefusalNotice lines={otherProblems} />}
          {review ? (
            <ReviewConfirmation
              review={review}
              accepted={accepted}
              approved={approved}
              checksComplete={checksComplete}
              busy={busy}
              error={error}
              submitUncertain={submitUncertain}
              capText={capText}
              capAvailable={Boolean(cap)}
              synthetic={synthetic}
              modelVerified={
                synthetic ||
                (review.summary.copilot_verified !== false &&
                  copilotPairVerified(
                    view.copilotModels,
                    review.answers.model,
                    review.answers.effort,
                  ))
              }
              ready={ready}
              idNote={view.idNote}
              onAccept={onAccept}
              onApprove={onApprove}
              onEdit={onEdit}
              onModules={onModules}
              onSubmit={onSubmit}
            />
          ) : (
            <InputStepForm
              view={view}
              folderInput={folderInput}
              title={title}
              previous={previous}
              next={next}
              ready={ready}
              focusHeading={focusHeading}
              onAdvance={onAdvance}
              onPrevious={onPrevious}
            />
          )}
        </div>
        <ReadinessRail
          rows={readiness}
          cap={shownCap}
          capTitle={synthetic ? "Configured cap for paid runs" : "Spending cap for this run"}
          pathway={pathwayName(view.run.pathway)}
          modules={moduleReadiness(planned, checked, view.run.pathway)}
          source={source}
          stagesInReview={review !== undefined}
        />
      </Bento>
    </div>
  );
}

function InputStepForm({
  view,
  folderInput,
  title,
  previous,
  next,
  ready,
  focusHeading,
  onAdvance,
  onPrevious,
}: {
  view: IntakeView;
  folderInput: RefObject<HTMLInputElement | null>;
  title: string;
  previous: FormStep | null;
  next: string;
  ready: string;
  focusHeading: boolean;
  onAdvance: (event: SubmitEvent<HTMLFormElement>) => void;
  onPrevious: () => void;
}) {
  const blocked = view.step === "documents" && !view.canRead;
  const invalid = useInvalidControls(view.markInvalid);
  return (
    <Tile span={12} label={`${title} step`}>
      <form
        onInvalidCapture={invalid.onInvalid}
        onClickCapture={invalid.onClick}
        onMouseDownCapture={invalid.onMouseDown}
        onSubmit={(event) => {
          onAdvance(event);
        }}
        className="grid min-w-0 grid-cols-1 gap-5"
      >
        <div className="grid gap-1">
          <h2
            key={view.step}
            ref={focusHeading ? focusStep : undefined}
            tabIndex={-1}
            className={`${heading} ${HEADING_FOCUS}`}
          >
            {title}
          </h2>
          <p className="reading-copy text-body text-text-secondary">
            {view.step === "context" && view.earnings
              ? EARNINGS_CONTEXT_GUIDANCE
              : STEP_GUIDANCE[view.step]}
          </p>
        </div>
        <fieldset
          disabled={view.busy !== undefined}
          className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-2"
        >
          <StepFields view={view} folderInput={folderInput} />
        </fieldset>
        <p className="text-caption text-text-tertiary tabular-nums xl:hidden">{ready}</p>
        <div className="flex flex-wrap items-center gap-3">
          {previous && (
            <Button
              color="secondary"
              className={TARGET}
              isDisabled={view.busy !== undefined}
              onPress={onPrevious}
            >
              Previous
            </Button>
          )}
          {view.problem && (
            <Button
              color="link-destructive"
              size="sm"
              className={cx("max-w-full text-left whitespace-normal", TARGET)}
              onPress={view.focusProblem}
            >
              {`${String(1 + view.problem.also.size)} ${view.problem.also.size ? "problems" : "problem"} to fix: ${view.problem.message}`}
            </Button>
          )}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
            {blocked && (
              <p id="run-step-blocker" className="text-small text-text-secondary">
                Add at least one document to continue.
              </p>
            )}
            <Button
              type="submit"
              className={TARGET}
              aria-describedby={blocked ? "run-step-blocker" : undefined}
              isDisabled={view.busy !== undefined || blocked}
            >
              {view.busy === "review" ? "Preparing review…" : next}
            </Button>
          </div>
        </div>
      </form>
    </Tile>
  );
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Check = { first: Control; marks: [FieldKey, string][]; worded: boolean };

/**
 * The browser checks the step's controls when it is sent and fires `invalid` on each one that
 * fails, in document order, within one task (running microtasks between them). One check is
 * gathered until that task ends. When its first failing control is one the page has words for,
 * every failing control's bubble is cancelled and each one the page has words for is marked
 * with them; the first takes the focus, which opens its section (only its section: the sections
 * share one name, so opening another would close it). When the first is one the page has no
 * words for, its section is opened so the browser's own bubble can show there. The step is not
 * sent either way. A double click's second click, landing on a section's heading as the page
 * moves, is ignored for a moment after a check.
 */
function useInvalidControls(
  markInvalid: (marks: readonly (readonly [FieldKey, string])[]) => void,
) {
  const check = useRef<Check | undefined>(undefined);
  const checkedAt = useRef(0);
  const onInvalid = (event: SyntheticEvent<HTMLFormElement>) => {
    const control = event.target;
    if (!(
      control instanceof HTMLInputElement ||
      control instanceof HTMLSelectElement ||
      control instanceof HTMLTextAreaElement
    ))
      return;
    const field = control.dataset.field as FieldKey | undefined;
    const message = field && invalidMessage(field, control);
    if (!check.current) {
      const worded = Boolean(field && message);
      check.current = { first: control, marks: [], worded };
      checkedAt.current = Date.now();
      if (!worded) openHolders(control);
      setTimeout(() => {
        const done = check.current;
        check.current = undefined;
        if (done?.worded) markInvalid(done.marks);
      }, 0);
    }
    if (!check.current.worded) return;
    event.preventDefault();
    // One mark per field: a second check in the same task (a double click) adds no repeat.
    if (field && message && !check.current.marks.some(([marked]) => marked === field))
      check.current.marks.push([field, message]);
  };
  // The second press of a double click, landing on a section heading as the page moves: its
  // mousedown would move the focus there and its click would close the section.
  const onSecondPress = (event: MouseEvent<HTMLFormElement>) => {
    const recent = Date.now() - checkedAt.current < 600;
    if (recent && event.detail > 1 && (event.target as Element).closest("summary"))
      event.preventDefault();
  };
  return { onInvalid, onClick: onSecondPress, onMouseDown: onSecondPress };
}
