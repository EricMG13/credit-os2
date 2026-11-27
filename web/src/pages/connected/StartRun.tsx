import { useCallback, useEffect, useRef, useState, type SubmitEvent } from "react";
import { Badge } from "@/components/base/badges/badges";
import { Alert } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/gap/Skeleton";
import { Bento, Tile } from "./report/overview/Tile";
import {
  carryDocuments,
  getPriorInputs,
  removeDocument,
  createSubmission,
  getContext,
  getReading,
  getSummary,
  issuerSlug,
  RequestError,
  submit,
  upload,
  type Answers,
  type Context,
  type PriorInputs,
  type Reading,
  type Mode,
} from "./api";
import { fileRoles } from "./start/contextSummary";
import { sendableAssumptions } from "./start/assumptions";
import { checkQuestionFocus, runModules } from "./start/focus";
import { CONTEXT_ROW_KINDS, sendableRows, type Row, type RowKind } from "./start/rows";
import { sendableModuleOptions, sendableValuation } from "./start/valuation";
import { Breadcrumb } from "./layout";
import { carryAccepted } from "./start/limits";
import { CUSTOM, CUSTOM_EFFORTS, OFFERED } from "./start/customSelection";
import { ANALYST_NAME_RULE, isAnalystName } from "./start/analystName";
import {
  documentRefusal,
  issuerIdFor,
  filedElsewhere,
  issuerIdRefusal,
  LEVELS,
  copilotEfforts,
  nameKey,
  storedName,
} from "./start/plain";
import { asSentence, errorText, useResource } from "./useResource";
import { PageHeader } from "../../shell/PageHeader";
import {
  FORM_STEPS,
  type FormStep,
  type Place,
  FILE_SIZE_LIMIT,
  SOURCE_TYPES,
  type Review,
  type Draft,
  type Reviewed,
  capForPathway,
  requireSummaryCap,
  reviewCapStands,
  reviewedCap,
  isFieldRow,
  type Forms,
  type SettledSlug,
  holderOf,
  latestIssuerInputs,
  type Attachment,
  type IntakeView,
  type LastReview,
  missingAtLastReview,
  intakeDocuments,
  readinessRows,
  accessibleText,
  shownCapText,
  intakeRunDetails,
  repeatedDocuments,
  fileName,
  isRecord,
  issuerFieldsEdited,
  reviewIssuerNote,
  contextFormValues,
  draftErrorText,
  lostSubmitText,
  startingContext,
  carriedLegal,
  carriedModules,
  noteIndex,
} from "./start/intake";
import { type FieldKey, FieldProblem, refusedField, stepOfField, focusField } from "./start/fields";
import { IntakePanels } from "./start/IntakePanels";
import { useComparisonPortfolio } from "./start/referencePortfolio";
import { useStandingPortfolios } from "./start/standingPortfoliosModel";
import {
  useStepHistory,
  useLeaveWarning,
  useIssuerNotice,
  useIntakeFocus,
} from "./start/intakeHooks";

function useIntakeIdentityState(
  template: Context,
  initial?: { run: string; prior: PriorInputs },
  warning?: string,
) {
  const [copy, setCopy] = useState(initial);
  const [step, setStep] = useState<FormStep>("documents");
  const [purposeChosen, setPurposeChosen] = useState(false);
  const [priorNote, setPriorNote] = useState(initial?.prior.error || warning || "");
  const [context, setContext] = useState<Context>(() => startingContext(template, initial?.prior));
  const [purposeTouched, setPurposeTouched] = useState(Boolean(initial?.prior.context));
  const [customSlug, setCustomSlug] = useState(initial?.prior.issuer_id);
  // The ID the review settled for a typed name whose usual ID another issuer already holds.
  const [settledSlug, setSettledSlug] = useState<SettledSlug>();
  const [newestOverride, setNewestOverride] = useState<string>();
  return {
    copy,
    setCopy,
    step,
    setStep,
    purposeChosen,
    setPurposeChosen,
    priorNote,
    setPriorNote,
    context,
    setContext,
    purposeTouched,
    setPurposeTouched,
    customSlug,
    setCustomSlug,
    settledSlug,
    setSettledSlug,
    newestOverride,
    setNewestOverride,
  };
}

function useIntakeDocumentsState(initial?: { run: string; prior: PriorInputs }) {
  const [files, setFiles] = useState<File[]>([]);
  const [reading, setReading] = useState<Reading>();
  const [uploaded, setUploaded] = useState(new Map<File, string>());
  const [documentsCopied, setDocumentsCopied] = useState(false);
  const [ignoredCopies, setIgnoredCopies] = useState<string[]>([]);
  /** Earlier file -> the upload with its bytes: the carry did not copy it. */
  const [sameContent, setSameContent] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Partial<Record<Attachment, string>>>({});
  const [legal, setLegal] = useState(() => carriedLegal(initial?.prior));
  const [forms, setForms] = useState<Forms>({});
  const [rows, setRows] = useState<Partial<Record<RowKind, Row[]>>>({});
  const [analystNote, setAnalystNote] = useState("");
  return {
    files,
    setFiles,
    reading,
    setReading,
    uploaded,
    setUploaded,
    documentsCopied,
    setDocumentsCopied,
    ignoredCopies,
    setIgnoredCopies,
    sameContent,
    setSameContent,
    attachments,
    setAttachments,
    legal,
    setLegal,
    forms,
    setForms,
    rows,
    setRows,
    analystNote,
    setAnalystNote,
  };
}

function useIntakeRunOptions(initial?: { run: string; prior: PriorInputs }) {
  const [level, setLevel] = useState(() =>
    initial?.prior.level === "advanced" ? "advanced" : "basic",
  );
  const [model, setModel] = useState("gpt");
  const [effort, setEffort] = useState("balanced");
  const [turns, setTurns] = useState(() => String(initial?.prior.max_turns || 32));
  const [modules, setModules] = useState<string[]>(() => carriedModules(initial?.prior));
  const [submittedBy, setSubmittedBy] = useState("");
  return {
    level,
    setLevel,
    model,
    setModel,
    effort,
    setEffort,
    turns,
    setTurns,
    modules,
    setModules,
    submittedBy,
    setSubmittedBy,
  };
}

function useIntakeReviewState() {
  const [review, setReview] = useState<Review>();
  const [accepted, setAccepted] = useState(new Set<string>());
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState<"review" | "submit" | "documents" | "copy">();
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<FieldProblem>();
  const [otherProblems, setOtherProblems] = useState<readonly string[]>([]);
  const [submitUncertain, setSubmitUncertain] = useState(false);
  const [lastReview, setLastReview] = useState<LastReview>();
  const [selectionProblem, setSelectionProblem] = useState("");
  return {
    selectionProblem,
    setSelectionProblem,
    lastReview,
    setLastReview,
    review,
    setReview,
    accepted,
    setAccepted,
    approved,
    setApproved,
    busy,
    setBusy,
    error,
    setError,
    fieldError,
    setFieldError,
    otherProblems,
    setOtherProblems,
    submitUncertain,
    setSubmitUncertain,
  };
}

export function StartRun({
  mode,
  navigate,
  from,
}: {
  mode: Mode;
  navigate: (path: string) => void;
  from?: string;
}) {
  useEffect(() => {
    document.title = "Start a run — Credit OS";
  }, []);
  const load = useCallback(
    async (signal: AbortSignal) => {
      const runOptions = await getContext(signal);
      if (!from || signal.aborted) return runOptions;
      try {
        const prior = await getPriorInputs(from);
        return { ...runOptions, initial: { run: from, prior } };
      } catch (failure) {
        return { ...runOptions, warning: errorText(failure) };
      }
    },
    [from],
  );
  const { value, error, unreachable, retry } = useResource(load);

  return (
    <>
      <Breadcrumb>Start a run</Breadcrumb>
      <PageHeader
        title="Start a run"
        // The same name for the mode as the stepper and the review: "No-cost test".
        badges={mode === "synthetic" ? <Badge color="brand">No-cost test</Badge> : undefined}
      />
      {value ? (
        <IntakeForm mode={mode} navigate={navigate} {...value} />
      ) : error ? (
        <div className="mt-6">
          <Alert
            tone="error"
            title={
              unreachable ? "The service cannot be reached" : "The run options could not be loaded"
            }
            action={
              <Button size="sm" color="secondary" onPress={retry}>
                Try again
              </Button>
            }
          >
            {unreachable
              ? "Check that the Credit OS service is running, then try again."
              : "Try again. If the options still won’t load, ask the person running Credit OS to check it."}
          </Alert>
        </div>
      ) : (
        <LoadingLayout />
      )}
    </>
  );
}

/**
 * While the run options load: the page in its final layout (the stepper strip, the step's form
 * and the readiness rail beside it from xl), each as quiet blocks in the shape of what will come.
 */
function LoadingLayout() {
  return (
    <div role="status" aria-label="Loading run options" className="mt-6">
      {/* The blocks are shapes only: the status's name is what is said. */}
      <div aria-hidden="true">
        <Bento>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-12 xl:col-span-8">
            <Tile span={12} label="Steps loading" className="py-4 sm:py-4">
              <div className="grid grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="size-8 shrink-0 rounded-ds-full bg-surface-subtle" />
                    <span className="h-4 flex-1 rounded-ds-xs bg-surface-subtle max-md:hidden" />
                  </div>
                ))}
              </div>
            </Tile>
            <Tile span={12} label="Step loading">
              <span className="h-7 w-40 rounded-ds-xs bg-surface-subtle" />
              <span className="min-h-40 rounded-ds-md bg-surface-subtle" />
              <Skeleton lines={4} />
            </Tile>
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-12 xl:col-span-4">
            <Tile span={12} label="Readiness loading">
              <span className="h-10 w-44 rounded-ds-xs bg-surface-subtle" />
              <Skeleton lines={4} />
            </Tile>
          </div>
        </Bento>
      </div>
    </div>
  );
}

function useIntakeSession() {
  const draftRef = useRef<Draft | null>(null);
  // Snapshot of the last review, made when the analyst leaves it by a stepper or Edit button.
  // The next review uses it once, only for the same issuer id and pathway. "Carry over from
  // latest run" and "This is a different issuer" clear it.
  const reviewedRef = useRef<Reviewed | null>(null);
  const activeRef = useRef(false);
  // The control that had focus when a busy state began; busy fieldsets disable it and drop focus.
  const focusedBeforeRef = useRef<{ node: HTMLElement; text: string } | null>(null);
  // Set when Submit has started the run, so leaving the page for it is not warned about.
  const submittedRef = useRef(false);
  // Mirrors the submitUncertain state synchronously: a popstate can arrive after the reply is
  // known but before React has committed the state.
  const uncertainRef = useRef(false);
  return { draftRef, reviewedRef, activeRef, focusedBeforeRef, submittedRef, uncertainRef };
}

function useIntakeViewState() {
  const folderInput = useRef<HTMLInputElement>(null);
  // The step heading takes focus only after the step changes, never on first render.
  const [moved, setMoved] = useState(false);
  const [changeNotice, setChangeNotice] = useState("");
  return { folderInput, moved, setMoved, changeNotice, setChangeNotice };
}

function useDocumentSelectionState() {
  // Counts finished inspections, so a repeated result is announced again.
  const [inspections, setInspections] = useState(0);
  const [repeatedContent, setRepeatedContent] = useState<ReadonlyMap<File, string>>(new Map());
  const selectionRevisionRef = useRef(0);
  const contentQueueRef = useRef<Promise<void>>(Promise.resolve());
  useEffect(
    () => () => {
      selectionRevisionRef.current += 1;
    },
    [],
  );

  return {
    inspections,
    setInspections,
    repeatedContent,
    setRepeatedContent,
    selectionRevisionRef,
    contentQueueRef,
  };
}

function IntakeForm({
  template,
  copilotModels,
  caps,
  initial,
  warning,
  navigate,
  mode,
}: {
  template: Context;
  copilotModels?: Record<string, string[]>;
  caps: Record<string, string>;
  initial?: { run: string; prior: PriorInputs };
  warning?: string;
  navigate: (path: string) => void;
  mode: Mode;
}) {
  const identityState = useIntakeIdentityState(template, initial, warning);
  const documentState = useIntakeDocumentsState(initial);
  const runOptions = useIntakeRunOptions(initial);
  const reviewState = useIntakeReviewState();
  const {
    copy,
    setCopy,
    step,
    setStep,
    purposeChosen,
    setPurposeChosen,
    priorNote,
    setPriorNote,
    context,
    setContext,
    purposeTouched,
    setPurposeTouched,
    customSlug,
    setCustomSlug,
    settledSlug,
    setSettledSlug,
    newestOverride,
    setNewestOverride,
  } = identityState;
  const {
    files,
    setFiles,
    reading,
    setReading,
    uploaded,
    setUploaded,
    documentsCopied,
    setDocumentsCopied,
    ignoredCopies,
    setIgnoredCopies,
    sameContent,
    setSameContent,
    attachments,
    setAttachments,
    legal,
    setLegal,
    forms,
    setForms,
    rows,
    setRows,
    analystNote,
    setAnalystNote,
  } = documentState;
  const {
    level,
    setLevel,
    model,
    setModel,
    effort,
    setEffort,
    turns,
    setTurns,
    modules,
    setModules,
    submittedBy,
    setSubmittedBy,
  } = runOptions;
  const {
    review,
    setReview,
    accepted,
    setAccepted,
    approved,
    setApproved,
    busy,
    setBusy,
    error,
    setError,
    fieldError,
    setFieldError,
    otherProblems,
    setOtherProblems,
    submitUncertain,
    setSubmitUncertain,
    lastReview,
    setLastReview,
    selectionProblem,
    setSelectionProblem,
  } = reviewState;
  const { draftRef, reviewedRef, activeRef, focusedBeforeRef, submittedRef, uncertainRef } =
    useIntakeSession();
  const { folderInput, moved, setMoved, changeNotice, setChangeNotice } = useIntakeViewState();
  const {
    inspections,
    setInspections,
    repeatedContent,
    setRepeatedContent,
    selectionRevisionRef,
    contentQueueRef,
  } = useDocumentSelectionState();

  const { run, identity, issuerId, requested, cap, earnings, canRead, checksComplete, newest } =
    intakeRunDetails({
      context,
      customSlug,
      settledSlug,
      caps,
      files,
      copy,
      review,
      accepted,
      newestOverride,
      reading,
      ignoredCopies,
      chosen: modules,
      effort,
    });
  const issuerNotice = useIssuerNotice(issuerId, identity.issuer_name);
  const comparison = useComparisonPortfolio(() => {
    clearProblem("reference_portfolio");
  });
  const standing = useStandingPortfolios();

  function clearProblem(...fields: FieldKey[]) {
    setFieldError((previous) => previous?.without(fields));
  }

  function changeRun(key: keyof Context["run"], value: string) {
    if (key === "pathway") invalidateReview();
    if (key === "current_period" || key === "prior_period" || key === "as_of") clearProblem(key);
    setContext((previous) => ({ ...previous, run: { ...previous.run, [key]: value } }));
  }

  function invalidateReview() {
    setReview(undefined);
    setAccepted(new Set());
    setApproved(false);
    setSubmitUncertain(false);
    uncertainRef.current = false;
  }

  function changeIdentity<K extends keyof Context["identity"]>(
    key: K,
    value: Context["identity"][K],
  ) {
    if (key === "issuer_name") clearProblem("issuer_name", "issuer_id");
    setContext((previous) => ({ ...previous, identity: { ...previous.identity, [key]: value } }));
  }

  function changeListedEquity(checked: boolean) {
    setContext((previous) => ({
      ...previous,
      identity: {
        ...previous.identity,
        listed_equity: checked,
        ...(checked ? {} : { ticker: "" }),
      },
    }));
  }

  async function withDraft(
    action: "review" | "documents" | "copy" | "submit",
    work: () => Promise<void>,
  ) {
    if (activeRef.current) return;
    activeRef.current = true;
    focusedBeforeRef.current =
      document.activeElement instanceof HTMLElement
        ? { node: document.activeElement, text: accessibleText(document.activeElement) }
        : null;
    setBusy(action);
    setError("");
    setSelectionProblem("");
    setFieldError(undefined);
    setOtherProblems([]);
    try {
      await work();
    } catch (failure) {
      if (failure instanceof FieldProblem) {
        setFieldError(failure);
        setOtherProblems(failure.others ?? []);
        setStep(stepOfField(failure.field));
        return;
      }
      if (failure instanceof RequestError && failure.status === 404) {
        draftRef.current = null;
        setDocumentsCopied(false);
        setSameContent({});
        setUploaded(new Map());
        setReading(undefined);
      }
      setError(draftErrorText(failure));
    } finally {
      activeRef.current = false;
      setBusy(undefined);
    }
  }

  /** Selection and inspection share one queue, so at most one file buffer is being hashed. */
  function checkRepeatedDocuments(
    selected: readonly File[],
    revision = selectionRevisionRef.current,
  ) {
    const result = contentQueueRef.current.then(() =>
      repeatedDocuments(selected, () => revision === selectionRevisionRef.current),
    );
    // Each caller handles its own error; a failed read must not prevent a later selection's check.
    contentQueueRef.current = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function refreshDocuments() {
    const incoming = files.map((file) => ({ file, name: fileName(file) }));
    const names = incoming.map(({ name }) => nameKey(name));
    if (new Set(names).size !== names.length) {
      throw new Error("Choose documents with distinct file names.");
    }
    const repeated = await checkRepeatedDocuments(files);
    setRepeatedContent(repeated);
    if (repeated.size > 0) throw new Error([...repeated.values()].join(" "));
    const draft = await openDraft();
    for (const { file, name } of incoming) {
      if (draft.uploaded.has(file)) continue;
      const result = await upload(draft.id, file, name);
      const collisionKey = nameKey(result.name);
      if ([...draft.uploaded.values()].some((stored) => nameKey(stored) === collisionKey)) {
        draftRef.current = null;
        setDocumentsCopied(false);
        setSameContent({});
        setUploaded(new Map());
        setReading(undefined);
        throw new Error(
          "Two documents have the same stored name. Remove one or rename it before continuing.",
        );
      }
      draft.uploaded.set(file, result.name);
      setUploaded(new Map(draft.uploaded));
    }
    if (!draft.copied && copy?.prior.files.length && !copy.prior.error) {
      // The files the analyst left out are named in the carry, so they are neither copied nor
      // counted against the service's limits; nothing is deleted afterwards.
      const carried = await carryDocuments(draft.id, copy.run, ignoredCopies);
      setSameContent(carried.same_content ?? {});
      draft.copied = true;
      setDocumentsCopied(true);
    }
    return { draft, result: await readDocuments(draft) };
  }

  /** The draft the uploads go to, made on first need. */
  async function openDraft() {
    if (!draftRef.current) {
      const { id } = await createSubmission();
      draftRef.current = { id, uploaded: new Map(), copied: false };
    }
    return draftRef.current;
  }

  /**
   * What the service reads from the draft's documents. A refusal that names a file is shown as one
   * sentence with that file's row marked Ignored; every route that reads goes through here.
   */
  async function readDocuments(draft: Draft) {
    const known = [
      ...[...draft.uploaded].map(([file, stored]) => ({ name: stored, size: file.size })),
      ...(copy?.prior.files ?? []),
    ];
    const result = await getReading(draft.id).catch((failure: unknown) => {
      if (!(failure instanceof RequestError)) throw failure;
      const { file, sentence } = documentRefusal(failure.message, known);
      if (!file && sentence === failure.message) throw failure;
      setReading({
        documents: [],
        ignored: file ? [{ source: file, reason: sentence }] : [],
        error: "",
      });
      throw new Error(sentence);
    });
    setReading(result);
    return result;
  }

  async function discardDocument(name: string, file?: File) {
    await withDraft("documents", async () => {
      const draft = draftRef.current;
      const stored = file ? draft?.uploaded.get(file) : name;
      // A carried name is on the service only once the carry has run; before it, only skip it.
      // An earlier file the carry did not copy (same bytes as an upload) is not on the service.
      const onService = file
        ? stored !== undefined
        : draft?.copied === true && !(name in sameContent);
      if (draft && stored && onService) {
        await removeDocument(draft.id, stored);
        if (file) {
          draft.uploaded.delete(file);
          setUploaded(new Map(draft.uploaded));
        }
      }
      // Only a carried name is ignored; a removed upload was never on the earlier run.
      const carried = copy?.prior.files.find(
        (item) => nameKey(item.name) === nameKey(stored ?? ""),
      );
      if (stored && carried)
        setIgnoredCopies((previous) => [...new Set([...previous, carried.name])]);
      if (file) {
        const remaining = files.filter((item) => item !== file);
        setFiles(remaining);
        selectionRevisionRef.current += 1;
        setRepeatedContent(await checkRepeatedDocuments(remaining));
      }
      setAttachments((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(([, chosen]) => chosen !== (stored || name)),
        ),
      );
      if (draft && stored && onService) {
        const dropped = new Set(
          [...ignoredCopies, stored, ...Object.keys(sameContent)].map(nameKey),
        );
        const carriedLeft =
          !copy?.prior.error &&
          (copy?.prior.files ?? []).some((item) => !dropped.has(nameKey(item.name)));
        if (draft.uploaded.size > 0 || (draft.copied && carriedLeft)) await readDocuments(draft);
        else if (carriedLeft) setReading(undefined);
        else setReading({ documents: [], ignored: [], error: "" });
      }
    });
  }

  function addFiles(selected: Iterable<File> | null) {
    if (activeRef.current) return;
    const candidates = Array.from(selected ?? []).filter(
      (file) =>
        !fileName(file)
          .split("/")
          .some((part) => part.startsWith(".")),
    );
    const names = new Set(files.map((file) => nameKey(fileName(file))));
    const added: File[] = [];
    const problems: string[] = [];
    for (const file of candidates) {
      const name = fileName(file);
      const key = nameKey(name);
      if (file.size > FILE_SIZE_LIMIT) problems.push(`${name} exceeds the 50 MB limit.`);
      else if (!SOURCE_TYPES.test(name))
        problems.push(`${name} is not a document type the run reads.`);
      else if (names.has(key)) problems.push(`${name} is already selected.`);
      else {
        names.add(key);
        added.push(file);
      }
    }
    setFiles((previous) => [...previous, ...added]);
    const revision = ++selectionRevisionRef.current;
    void checkRepeatedDocuments([...files, ...added], revision).then(
      (repeated) => {
        if (revision === selectionRevisionRef.current) setRepeatedContent(repeated);
      },
      (failure: unknown) => {
        if (revision === selectionRevisionRef.current) setError(errorText(failure));
      },
    );
    if (added.length > 0) setReading(undefined);
    // The files refused at selection are said at the drop zone; any older notice is cleared.
    setError("");
    setSelectionProblem(problems.join(" "));
  }

  async function copyLatestWork() {
    // The ID is settled before the lookup: another issuer's run must not be carried, and the ID
    // locked by the carry is the one the review would use.
    const latest = await latestIssuerInputs(await settleIssuerId());
    if (!latest) {
      setPriorNote("No earlier run was found for this issuer.");
      return;
    }
    const { run: latestRun, prior } = latest;
    setCopy({ run: latestRun, prior });
    setPriorNote(prior.error || "");
    setContext(startingContext(prior.context ? template : context, prior));
    setPurposeTouched(Boolean(prior.context));
    setPurposeChosen(false);
    setCustomSlug(prior.issuer_id);
    reviewedRef.current = null;
    setLastReview(undefined);
    setLevel(Object.hasOwn(LEVELS, prior.level) ? prior.level : "basic");
    setTurns(String(prior.max_turns || 32));
    setModel("gpt");
    setEffort("balanced");
    setModules(carriedModules(prior));
    setForms({});
    setRows({});
    setAnalystNote("");
    setAttachments({});
    setLegal(carriedLegal(prior));
    setIgnoredCopies([]);
    setNewestOverride(undefined);
    setReading(undefined);
    draftRef.current = null;
    setDocumentsCopied(false);
    setSameContent({});
    setUploaded(new Map());
  }

  async function copyLatest() {
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(issuerId)) {
      setError("Enter an issuer ID before looking up its latest run.");
      return;
    }
    await withDraft("copy", copyLatestWork);
  }

  /**
   * The ID for the typed name: the usual one, unless a run of another issuer already holds it, for
   * any name of any length. A typed or carried ID is the analyst's own; the service checks it.
   */
  async function settleIssuerId() {
    const name = identity.issuer_name.trim();
    if (customSlug !== undefined) return issuerId;
    const usual = issuerSlug(name);
    const holder = await holderOf(usual);
    const id = issuerIdFor(name, holder);
    setSettledSlug({ name, id, ...(id === usual || !holder ? {} : { holder }) });
    return id;
  }

  /**
   * A refusal of an ID filed under another issuer, as a problem on the Issuer ID field. When the
   * refused ID is not the name's usual one, who holds the usual one decides what is offered.
   */
  async function idProblem(failure: unknown) {
    const found = failure instanceof RequestError ? filedElsewhere(failure.message) : undefined;
    if (!(failure instanceof RequestError) || !found) return undefined;
    const usual = issuerSlug(found.name);
    const usualHolder = usual && usual !== found.id ? await holderOf(usual) : undefined;
    const refusal = issuerIdRefusal(failure.message, usualHolder);
    return refusal && new FieldProblem("issuer_id", refusal.sentence, undefined, refusal.offer);
  }

  function checkResearchCutoff() {
    if (run.cutoff && run.cutoff > run.as_of)
      throw new FieldProblem("cutoff", "Research cutoff must be on or before the as-of date.");
  }

  function checkEarningsPeriods() {
    if (earnings) {
      for (const [key, title] of [
        ["current_period", "Current period"],
        ["prior_period", "Prior period"],
      ] as const)
        if (!run[key]) throw new FieldProblem(key, `${title} is required for Earnings Update.`);
    }
  }

  function makeAnswers(result: Reading, details: Record<string, unknown>, id: string): Answers {
    checkResearchCutoff();
    const available = new Set(result.documents.map(storedName));
    const held = (key: Attachment) => available.has(attachments[key] ?? "");
    // The three file boxes count only where the page draws them for this pathway and level; the
    // agreement is drawn with the Legal documents choice, which is on every pathway.
    const drawn = new Set<Attachment>(fileRoles({ earnings, level, run }));
    const chosen = (key: Attachment) => (key === "agreement" || drawn.has(key)) && held(key);
    if (legal !== "none" && !chosen("agreement"))
      throw new FieldProblem("agreement", "Choose the uploaded file that is the agreement.");
    checkEarningsPeriods();
    const runSettings =
      level === "advanced"
        ? { max_turns: Number(turns), model, effort }
        : { max_turns: 32, model: "gpt", effort: "balanced" };
    return {
      context: {
        ...context,
        ...details,
        run: { ...run, cutoff: run.cutoff || run.as_of },
        identity: { ...identity, issuer_name: identity.issuer_name.trim(), issuer_id: id },
        ...(context.attachments
          ? {
              attachments: {
                legal_documents: legal,
                management_bridge: chosen("management_bridge"),
                portfolio_workbook: chosen("portfolio_workbook"),
                prior_case: chosen("prior_case"),
              },
            }
          : {}),
      },
      modules,
      max_turns: runSettings.max_turns,
      level,
      model: runSettings.model,
      effort: runSettings.effort,
      submitted_by: submittedBy.trim(),
      ...(newestOverride ? { newest_document_date: newestOverride } : {}),
    };
  }

  function reviewDetails() {
    if (!identity.issuer_name.trim() || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(issuerId)) {
      throw new FieldProblem(
        "issuer_name",
        "Enter an issuer name and an issuer ID using letters a–z, digits or hyphens.",
      );
    }
    if (!isAnalystName(submittedBy.trim()))
      throw new FieldProblem("submitted_by", ANALYST_NAME_RULE);
    const details = reviewContextDetails();
    checkRunRequirements(details);
    return details;
  }

  function reviewContextDetails() {
    const details: Record<string, unknown> = {};
    if (forms.valuation) details.valuation = sendableValuation(forms.valuation);
    if (forms.module_options) {
      details.module_options = sendableModuleOptions(forms.module_options, {
        cp3: requested.includes("CP-3"),
        cp6: requested.includes("CP-6"),
      });
    }
    if (forms.assumptions)
      details.assumptions = sendableAssumptions(forms.assumptions, context.assumptions, requested);
    for (const kind of CONTEXT_ROW_KINDS) {
      const edited = rows[kind];
      if (edited) details[kind] = sendableRows(kind, edited, run.run_type === "primary");
    }
    const note = analystNote
      .split(/\r\n?|\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ");
    if (note) {
      const questions = details.research_questions ?? context.research_questions;
      const listed: unknown[] = Array.isArray(questions) ? questions : [];
      details.research_questions = [...listed, { text: note, focus_module: "" }];
    }
    checkQuestionFocus(
      details.research_questions ?? context.research_questions,
      runModules(run.pathway, requested, modules),
      run.pathway,
    );
    return details;
  }

  function checkRunRequirements(details: Record<string, unknown>) {
    if (run.run_type === "primary") {
      const deals = details.deal_terms ?? context.deal_terms;
      if (!Array.isArray(deals) || deals.length === 0)
        throw new FieldProblem(
          "deal_terms",
          "Add at least one facility in Facilities and deal terms.",
        );
    }
    if (level === "advanced" && (!/^\d+$/.test(turns) || Number(turns) < 1 || Number(turns) > 64)) {
      throw new FieldProblem("turns", "Turns per module must be a whole number from 1 to 64.");
    }
  }

  async function prepareReview() {
    const details = reviewDetails();
    const { draft, result } = await refreshDocuments();
    if (!result.documents.length)
      throw new Error(
        "None of the selected documents could be read. Check the file list in Documents and add a readable file.",
      );
    const answers = makeAnswers(result, details, await settleIssuerId());
    const noteAt = noteIndex(details, analystNote);
    const shownCap = capForPathway(caps, answers.context.run.pathway);
    // The comparison portfolio is settled on the draft first, so the summary's digest covers it.
    await comparison.settle(draft.id);
    const summary = await getSummary(draft.id, answers, shownCap).catch(
      async (failure: unknown) => {
        throw (await idProblem(failure)) ?? refusedField(failure, requested, noteAt) ?? failure;
      },
    );
    const custom = answers.context.run.pathway === CUSTOM;
    requireSummaryCap(summary, shownCap, custom);
    if (comparison.files.length > 0 && !summary.reference_portfolio)
      throw new Error(
        "This summary does not cover the comparison portfolio. Select Review run to request a new summary.",
      );
    if (!summary.digest)
      throw new Error(
        "This summary could not be approved. Select Review run to request a new summary.",
      );
    const reviewed = reviewedRef.current;
    reviewedRef.current = null;
    setAccepted(
      reviewed?.pathway === answers.context.run.pathway &&
        reviewed.issuerId === answers.context.identity.issuer_id
        ? carryAccepted(reviewed.items, reviewed.accepted, summary.items)
        : new Set(),
    );
    setApproved(false);
    setReview({
      id: draft.id,
      answers,
      summary,
      // A custom run is submitted at the cap its summary issued, not the table's ceiling.
      cap: reviewedCap(summary, shownCap, custom),
      // The file named in each box, for the review to show: shown only, never sent.
      attachmentNames: {
        management_bridge: attachments.management_bridge,
        portfolio_workbook: attachments.portfolio_workbook,
        prior_case: attachments.prior_case,
      },
    });
    setLastReview({
      pathway: answers.context.run.pathway,
      issuerId: answers.context.identity.issuer_id,
      modules: summary.modules,
      items: summary.items,
    });
  }

  async function makeReview() {
    if (!canRead || activeRef.current) return;
    invalidateReview();
    await withDraft("review", prepareReview);
  }

  function goTo(next: FormStep) {
    setMoved(true);
    setStep(next);
    setError("");
    setFieldError(undefined);
  }

  async function advance(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRef.current) return;
    switch (step) {
      case "documents":
        if (!canRead) return;
        await withDraft("documents", async () => {
          if (!isAnalystName(submittedBy.trim()))
            throw new FieldProblem("submitted_by", ANALYST_NAME_RULE);
          const { result } = await refreshDocuments();
          if (!result.documents.length)
            throw new Error(
              "None of the selected documents could be read. Check the file list in Documents and add a readable file.",
            );
          goTo("purpose");
        });
        break;
      case "purpose":
        setPurposeChosen(true);
        goTo("context");
        break;
      case "context":
        await makeReview();
        break;
    }
  }

  async function submitReviewed() {
    if (!review || !approved || !checksComplete || (mode === "live" && !cap)) return;
    if (!reviewCapStands(review, caps, run.pathway)) {
      setReview(undefined);
      setAccepted(new Set());
      setApproved(false);
      setError(
        "The pathway or spending cap changed after review. Review the run again before submitting.",
      );
      return;
    }
    await withDraft("submit", async () => {
      try {
        const { run: id } = await submit(
          review.id,
          review.answers,
          review.summary.digest,
          review.cap,
        );
        submittedRef.current = true;
        navigate(`/run/${encodeURIComponent(id)}`);
      } catch (failure) {
        if (failure instanceof RequestError && [400, 404].includes(failure.status)) {
          if (failure.status === 404) {
            draftRef.current = null;
            setDocumentsCopied(false);
            setSameContent({});
            setUploaded(new Map());
            setReading(undefined);
          }
          setReview(undefined);
          setAccepted(new Set());
          setApproved(false);
          setSubmitUncertain(false);
          uncertainRef.current = false;
          const taken = await idProblem(failure);
          if (taken) throw taken;
          setError(
            `${asSentence(draftErrorText(failure))} Review the run again before submitting.`,
          );
        } else {
          uncertainRef.current = true;
          setSubmitUncertain(true);
          setError(lostSubmitText(failure));
        }
      }
    });
  }

  function inspectDocuments() {
    void withDraft("documents", async () => {
      await refreshDocuments();
      setInspections((count) => count + 1);
    });
  }

  function changePathway(pathway: string) {
    if (modules.length > 0)
      setChangeNotice(
        "Module choice reset for the new pathway. Review the run again and decide its limits.",
      );
    else if (approved || accepted.size > 0 || reviewedRef.current)
      setChangeNotice(
        "You changed the pathway, so the approval and your decisions were cleared. Decide again.",
      );
    reviewedRef.current = null;
    invalidateReview();
    setContext((previous) => ({
      ...previous,
      run: {
        ...previous.run,
        pathway,
        run_type:
          pathway === "earnings_update"
            ? "earnings"
            : !purposeTouched || previous.run.run_type === "earnings"
              ? pathway === "relative_value"
                ? "secondary"
                : "research"
              : previous.run.run_type,
      },
    }));
    setModules([]);
    if (pathway === CUSTOM) keepToGpt();
  }

  /** A custom selection is estimated from GPT runs only: another model or effort is put back. */
  function keepToGpt() {
    const valid = copilotEfforts(copilotModels, "gpt").filter((item) =>
      CUSTOM_EFFORTS.some((allowed) => allowed === item),
    );
    setModel("gpt");
    if (!valid.includes(effort))
      setEffort(valid.includes("balanced") ? "balanced" : (valid[0] ?? "balanced"));
  }

  function changePurpose(value: string) {
    if (approved || accepted.size > 0 || reviewedRef.current) {
      setChangeNotice(
        "You changed the market view, so the approval and your decisions were cleared. Decide again.",
      );
      reviewedRef.current = null;
      invalidateReview();
    }
    setPurposeTouched(true);
    changeRun("run_type", value);
  }

  function changeAttachment(key: Attachment, value: string) {
    if (key === "agreement") clearProblem("agreement");
    setAttachments((previous) => ({ ...previous, [key]: value }));
  }

  function resetIssuer() {
    setLastReview(undefined);
    setCopy(undefined);
    reviewedRef.current = null;
    setContext(startingContext(template));
    setPurposeTouched(false);
    setPurposeChosen(false);
    setCustomSlug(undefined);
    setReading(undefined);
    setPriorNote("");
    setForms({});
    setRows({});
    setAnalystNote("");
    setAttachments({});
    setLegal("none");
    setModules([]);
    setLevel("basic");
    setModel("gpt");
    setEffort("balanced");
    setTurns("32");
    setIgnoredCopies([]);
    setChangeNotice("");
    selectionRevisionRef.current += 1;
    setRepeatedContent(new Map());
    setNewestOverride(undefined);
    draftRef.current = null;
    setDocumentsCopied(false);
    setSameContent({});
    setUploaded(new Map());
  }

  function toggleModule(code: string, checked: boolean) {
    if (run.pathway === CUSTOM) {
      // A custom run lists the analyst's own choice only (the rules complete it), in the page's order.
      chooseModules(
        OFFERED.map(({ id }) => id).filter((id) => (id === code ? checked : modules.includes(id))),
      );
      return;
    }
    const selected = modules.length ? modules : requested;
    const next = checked ? [...selected, code] : selected.filter((item) => item !== code);
    setModules(
      next.length === requested.length ? [] : requested.filter((item) => next.includes(item)),
    );
  }

  function chooseModules(next: string[]) {
    setModules(next);
  }

  function rowsOf(kind: RowKind): Row[] {
    const edited = rows[kind];
    if (edited) return edited;
    const carried = context[kind];
    return Array.isArray(carried) && carried.every(isRecord) ? carried : [];
  }

  function changeRows(kind: RowKind, next: Row[]) {
    if (isFieldRow(kind)) clearProblem(kind);
    setRows((previous) => ({ ...previous, [kind]: next }));
  }

  const { shownDocs, inspected, ignored, documentRows, fileChoices } = intakeDocuments(
    reading,
    files,
    uploaded,
    copy,
    ignoredCopies,
    documentsCopied,
    sameContent,
  );

  const { title, previous, next } = FORM_STEPS[step];
  const capText = shownCapText(cap);
  const synthetic = mode === "synthetic";
  // On the Purpose step a card is always selected, so the purpose is chosen from there on.
  const readiness = readinessRows(
    shownDocs,
    purposeChosen || step !== "documents",
    review,
    accepted,
    approved,
  );

  function acceptReviewItems(ids: readonly string[], checked: boolean) {
    setAccepted((previouslyAccepted) => {
      const nextAccepted = new Set(previouslyAccepted);
      for (const id of ids) {
        if (checked) nextAccepted.add(id);
        else nextAccepted.delete(id);
      }
      return nextAccepted;
    });
    setApproved(false);
  }

  function editReviewedInputs(target: FormStep) {
    if (review)
      reviewedRef.current = {
        pathway: review.answers.context.run.pathway,
        issuerId: review.answers.context.identity.issuer_id,
        items: review.summary.items,
        accepted,
      };
    setReview(undefined);
    goTo(target);
  }

  /**
   * Moves to a place the browser's Back or Forward named; false when the form cannot show it,
   * "stay" while a request is outstanding or a submit's outcome is unknown (the review, and the
   * Submit that is safe to repeat, must stay where they are).
   */
  function showPlace(target: Place): boolean | "stay" {
    if (activeRef.current || uncertainRef.current || submittedRef.current) return "stay";
    // A review is made by Review run and not kept once left, and a step past Documents needs
    // documents that were read: Forward to either is passed over.
    if (target === "review" || (target !== "documents" && reading === undefined)) return false;
    if (step === "documents" && target !== "documents" && !isAnalystName(submittedBy.trim())) {
      setFieldError(new FieldProblem("submitted_by", ANALYST_NAME_RULE));
      return false;
    }
    editReviewedInputs(target);
    return true;
  }

  function changeReviewedModules(next: string[]) {
    editReviewedInputs("context");
    setModules(next);
  }

  function submitReviewedRun() {
    void submitReviewed();
  }

  function advanceCurrentStep(event: SubmitEvent<HTMLFormElement>) {
    void advance(event);
  }

  function returnToPreviousStep() {
    if (previous !== null) goTo(previous);
  }

  const view: IntakeView = {
    step,
    busy,
    canRead,
    copy,
    priorNote,
    issuerNotice,
    changeNotice,
    repeatedContent,
    copilotModels,
    identity,
    issuerId,
    submittedBy,
    run,
    documentRows,
    inspected,
    ignored,
    shownDocs,
    read: reading !== undefined,
    inspections,
    attachments,
    fileChoices,
    legal,
    earnings,
    level,
    analystNote,
    newest,
    forms,
    ...contextFormValues(forms, context),
    changeAssumptions: (next) => {
      clearProblem("assumptions");
      setForms((previous) => ({ ...previous, assumptions: next }));
    },
    changeValuation: (next) => {
      clearProblem("valuation");
      setForms((previous) => ({ ...previous, valuation: next }));
    },
    changeModuleOptions: (next) => {
      clearProblem("module_options");
      setForms((previous) => ({ ...previous, module_options: next }));
    },
    modules,
    requested,
    turns,
    model,
    effort,
    caps,
    synthetic,
    addFiles,
    comparison: {
      ...comparison,
      read: () =>
        void withDraft("documents", async () => {
          await comparison.send((await openDraft()).id);
        }),
    },
    standing,
    inspectDocuments,
    discardDocument: (name, file) => void discardDocument(name, file),
    changeIdentity,
    changeListedEquity,
    changeRun: (key, value) => {
      if (key === "cutoff" || key === "as_of") clearProblem("cutoff");
      changeRun(key, value);
    },
    changeIssuerId: (value) => {
      clearProblem("issuer_name", "issuer_id");
      setCustomSlug(value);
    },
    changeSubmittedBy: (value) => {
      clearProblem("submitted_by");
      setSubmittedBy(value);
    },
    carryLatest: () => void copyLatest(),
    resetIssuer,
    changePathway,
    changePurpose,
    changeLevel: (value) => {
      if (value !== "advanced") {
        setModules([]);
        // A custom selection is offered at the Advanced level only: the pathway goes back.
        if (run.pathway === CUSTOM) {
          changePathway("credit_snapshot");
          setChangeNotice(
            "Custom selection is offered at the Advanced level, so the pathway is back to Full credit assessment. Review the run again and decide its limits.",
          );
        }
      }
      setLevel(value);
    },
    changeAnalystNote: (value) => {
      clearProblem("analyst_note");
      setAnalystNote(value);
    },
    changeNewestOverride: (value) => {
      setNewestOverride(value || undefined);
    },
    changeLegal: (value) => {
      clearProblem("agreement", "legal_documents");
      setLegal(value);
    },
    changeAttachment,
    rowsOf,
    changeRows,
    changeModel: (value) => {
      setModel(value);
      const valid = copilotEfforts(copilotModels, value);
      const preferred = value === "luna" ? "xhigh" : "balanced";
      setEffort(valid.includes(preferred) ? preferred : (valid[0] ?? preferred));
    },
    changeEffort: setEffort,
    changeTurns: (value) => {
      clearProblem("turns");
      setTurns(value);
    },
    toggleModule,
    chooseModules,
    problem: fieldError,
    idNote: reviewIssuerNote(review, settledSlug),
    missing: missingAtLastReview(lastReview, run.pathway, issuerId),
    selectionProblem,
    ...(lastReview?.pathway === run.pathway && lastReview.issuerId === issuerId
      ? { checked: lastReview }
      : {}),
    useIssuerId: (id) => {
      clearProblem("issuer_id");
      setCustomSlug(id);
    },
    markInvalid: (marks) => {
      const [first, ...rest] = marks;
      if (first)
        setFieldError(new FieldProblem(first[0], first[1], undefined, undefined, new Map(rest)));
    },
    focusProblem: () => {
      if (fieldError) focusField(fieldError.field);
    },
  };

  useIntakeFocus(fieldError, busy, focusedBeforeRef);

  // Documents carried from an earlier run count as much as chosen ones. A legal or module choice
  // is made on More context, which opens only once a purpose has been chosen.
  const holdsWork = [
    documentRows.some((row) => !row.pendingCopy),
    comparison.files.length > 0,
    ignoredCopies.length > 0,
    purposeChosen,
    review !== undefined,
    submittedBy.trim() !== "",
    analystNote.trim() !== "",
    run.as_of !== "",
    issuerFieldsEdited(identity, customSlug, copy?.prior, template.identity),
  ].some(Boolean);
  useLeaveWarning(holdsWork, submittedRef);
  useStepHistory(review ? "review" : step, showPlace);

  return (
    <IntakePanels
      step={step}
      review={review}
      error={error}
      otherProblems={otherProblems}
      accepted={accepted}
      approved={approved}
      checksComplete={checksComplete === true}
      busy={busy}
      submitUncertain={submitUncertain}
      capText={capText}
      cap={cap}
      synthetic={synthetic}
      view={view}
      folderInput={folderInput}
      title={title}
      previous={previous}
      next={next}
      readiness={readiness}
      focusHeading={moved}
      onAccept={acceptReviewItems}
      onApprove={setApproved}
      onEdit={editReviewedInputs}
      onModules={changeReviewedModules}
      onSubmit={submitReviewedRun}
      onAdvance={advanceCurrentStep}
      onPrevious={returnToPreviousStep}
    />
  );
}

// The tests read these from the page module; they live beside the step that draws them.
export { SelectField, stepOfField } from "./start/fields";
export { carriedModules } from "./start/intake";
