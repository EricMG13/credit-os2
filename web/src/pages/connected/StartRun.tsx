import {
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type RefObject,
  type SubmitEvent,
} from "react";
import { File05, Folder } from "@untitledui/icons";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import { Badge } from "@/components/base/badges/badges";
import { Alert } from "@/components/alert/Alert";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/gap/Skeleton";
import { PurposeCards } from "../run/start/Purpose";
import { SubmitConfirmation } from "../run/start/Start";
import { Stepper } from "../run/start/Stepper";
import {
  carryDocuments,
  getLatestIssuerRun,
  getPriorInputs,
  PATHWAYS,
  pathwayModules,
  removeDocument,
  createSubmission,
  getContext,
  getReading,
  getSummary,
  issuerSlug,
  moduleName,
  RequestError,
  submit,
  upload,
  drawnModules,
  FORECAST_CODE,
  type Answers,
  type Context,
  type DocumentRecord,
  type PriorInputs,
  type ReadinessItem,
  type Reading,
  type Mode,
  type Summary,
} from "./api";
import { AssumptionFields } from "./start/AssumptionFields";
import {
  ASSUMPTIONS_TITLE,
  readAssumptions,
  sendableAssumptions,
  type AssumptionsForm,
} from "./start/assumptions";
import { RowEditor } from "./start/RowEditor";
import { ModuleOptionsFields } from "./start/ModuleOptionsFields";
import { CONTEXT_ROW_KINDS, ROW_SPECS, sendableRows, type Row, type RowKind } from "./start/rows";
import {
  MODULE_OPTIONS_TITLE,
  readModuleOptions,
  readValuation,
  sendableModuleOptions,
  sendableValuation,
  VALUATION_TITLE,
  type ModuleOptionsForm,
  type ValuationForm,
} from "./start/valuation";
import { ValuationFields } from "./start/ValuationFields";
import { Breadcrumb, card, ErrorNotice, field, heading, label } from "./layout";
import { carryAccepted, decided, groupLimits, needsCheck } from "./start/limits";
import { ANALYST_NAME_RULE, isAnalystName } from "./start/analystName";
import { ReviewSheet } from "./start/ReviewSheet";
import { StartReadiness } from "./start/StartReadiness";
import {
  ANY_FOCUS,
  ATTACHMENTS,
  CASE_KIND_LABEL,
  CASE_KINDS,
  CONTEXT_DETAILS,
  documentDescription,
  documentRefusal,
  EFFORTS,
  ISSUE_CLASSES,
  ISSUE_CLASSIFICATION,
  ISSUER_DETAILS,
  ISSUER_ID,
  issuerIdFor,
  filedElsewhere,
  issuerIdRefusal,
  ISSUER_LIST_BOXES,
  ISSUER_TEXT_BOXES,
  LEGAL_CHOICES,
  LEGAL_DOCUMENTS,
  LEVELS,
  LISTED_EQUITY,
  MODELS,
  PATHWAY_LABEL,
  PURPOSES,
  PURPOSE_STEP,
  refusalLines,
  refusalProblems,
  RUN_PURPOSE_LABEL,
  storedName,
  TICKER,
} from "./start/plain";
import { asSentence, errorText, isUnreachable, useResource } from "./useResource";
import { PageHeader } from "../../shell/PageHeader";

const FORM_STEPS = {
  documents: { title: "Documents", next: "Continue to purpose", previous: null },
  purpose: { title: PURPOSE_STEP, next: "Continue to context", previous: "documents" },
  context: { title: "More context", next: "Review run", previous: "purpose" },
} as const;
type FormStep = keyof typeof FORM_STEPS;
const STEPPER_STEPS = [
  { key: "documents", title: "Documents", note: "Add files" },
  { key: "purpose", title: PURPOSE_STEP, note: "Choose one" },
  { key: "context", title: "More context", note: "Optional" },
  { key: "start", title: "Review and start", note: "Paid step" },
] as const;
const STEP_TOTAL = STEPPER_STEPS.length;
const FORM_STEP_KEYS = Object.keys(FORM_STEPS) as FormStep[];
/** Where the analyst is: one of the three form steps, or the review sheet after them. */
type Place = FormStep | "review";
const PLACES: readonly Place[] = [...FORM_STEP_KEYS, "review"];
const STEP_GUIDANCE: Record<FormStep, string> = {
  documents:
    "Add annual and interim reports, the credit agreement and any other material the analysis should read.",
  purpose: "The purpose determines which modules run.",
  context: "Optional. You can continue if the documents provide all the context.",
};

const EARNINGS_CONTEXT_GUIDANCE =
  "Current period and Prior period are required for Earnings Update. Everything else here is optional: you can continue if the documents provide all the context.";

const PATHWAY_DESCRIPTIONS: Record<string, string> = {
  lite_credit_assessment: "Review the issuer's fundamentals, credit drivers and downside.",
  credit_snapshot: "Assess the issuer, downside, covenants, refinancing and forward cash flow.",
  deep_credit_assessment: "Full credit assessment plus every specialist module.",
  earnings_update: "Compare the latest results with an earlier period.",
  relative_value: "Compare instruments, pricing and compensation for risk.",
  covenant_refinancing: "Assess legal protections, funding needs and refinancing options.",
  distressed_restructuring: "Assess stressed liquidity, covenants and recoveries.",
  portfolio_decision: "Assess instruments and portfolio fit for a decision.",
};
const PATHWAY_CARDS = Object.entries(PATHWAYS).map(([id, pathway]) => ({
  id,
  title: pathway.label,
  description: PATHWAY_DESCRIPTIONS[id] ?? "",
  modules: `${String(drawnModules(pathway.modules).length)} base modules`,
}));
const FILE_SIZE_LIMIT = 50 * 1024 * 1024;
const SOURCE_TYPES = /\.(?:pdf|htm|html|docx|txt|md|xlsx|csv|json|jsonl)$/i;
const SOURCE_TYPE_HINT = "PDF, HTML, DOCX, TXT, Markdown, XLSX, CSV, JSON and JSONL";
const SYNTHETIC_LIMITS =
  "The synthetic test can complete only a first Full credit assessment, with no earlier run to compare. Use northbridge-filing.txt and, optionally, northbridge-portfolio.xlsx and northbridge-credit-agreement.txt from the proof folder; no other files are accepted.";

type FieldKey =
  | "issuer_name"
  | "issuer_id"
  | "submitted_by"
  | "cutoff"
  | "current_period"
  | "prior_period"
  | "legal_documents"
  | "agreement"
  | "deal_terms"
  | "quotes"
  | "ratings"
  | "research_questions"
  | "analyst_note"
  | "turns"
  | "valuation"
  | "assumptions"
  | "module_options";

/**
 * A problem that belongs to one control: shown on it, not in the general notice. A service refusal
 * that names several problems carries the others, in their labelled lines, as `others`.
 */
class FieldProblem extends Error {
  constructor(
    readonly field: FieldKey,
    message: string,
    readonly others?: readonly string[],
    /** For `issuer_id`: the free Issuer ID the page offers in its place. */
    readonly offer?: string,
  ) {
    super(message);
  }
}

/**
 * The first problem of a summary refusal whose control is drawn becomes a FieldProblem and the rest
 * its `others`; a failure that is not a refusal, or names no drawn control, is `undefined` (the
 * general notice shows it as it is).
 */
function refusedField(
  failure: unknown,
  requested: readonly string[],
  noteAt: number,
): FieldProblem | undefined {
  if (!(failure instanceof RequestError) || failure.status === 404) return undefined;
  const problems = refusalProblems(failure.message, requested, noteAt);
  const at = problems.findIndex(({ field }) => field !== undefined);
  const first = problems[at];
  if (!first?.field) return undefined;
  return new FieldProblem(
    first.field,
    first.line,
    problems.filter((_, position) => position !== at).map(({ line }) => line),
  );
}

/** The step a control is drawn on: the issuer name and analyst name on Documents, the rest on Context. */
export function stepOfField(field: FieldKey): FormStep {
  return field === "issuer_name" || field === "issuer_id" || field === "submitted_by"
    ? "documents"
    : "context";
}

function problemAttrs(problem: FieldProblem | undefined, field: FieldKey) {
  return problem?.field === field
    ? { "data-field": field, "aria-invalid": "true" as const, "aria-describedby": `error-${field}` }
    : { "data-field": field };
}

function FieldMessage({ problem, field }: { problem?: FieldProblem; field: FieldKey }) {
  if (problem?.field !== field) return null;
  return (
    <p id={`error-${field}`} role="alert" className="text-sm text-error-primary">
      {problem.message}
    </p>
  );
}

/** Opens what holds the control, then focuses and scrolls to it. */
function focusField(field: FieldKey) {
  const control = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
  const holder = control?.closest("details");
  if (holder) holder.open = true;
  control?.focus();
  control?.scrollIntoView({ block: "center" });
}

type Review = {
  id: string;
  answers: Answers;
  summary: Summary;
  cap: string;
  attachmentNames: Partial<Record<Attachment, string>>;
};
type Draft = { id: string; uploaded: Map<File, string>; copied: boolean };
type Reviewed = {
  pathway: string;
  issuerId: string;
  items: ReadinessItem[];
  accepted: Set<string>;
};

function capForPathway(caps: Record<string, string>, pathway: string) {
  const cap = caps[pathway];
  if (!cap) throw new Error("The cap for this pathway is unavailable. Reload the form.");
  return cap;
}

function requireSummaryCap(summary: Summary, shownCap: string) {
  if (summary.cap !== shownCap)
    throw new Error("The pathway cap changed while preparing this summary. Review the run again.");
}

/** The row editors of the Context step: each carries a `data-field` a refusal can name. */
const isFieldRow = (kind: RowKind): kind is (typeof CONTEXT_ROW_KINDS)[number] =>
  (CONTEXT_ROW_KINDS as readonly RowKind[]).includes(kind);
type Forms = {
  valuation?: ValuationForm;
  module_options?: ModuleOptionsForm;
  assumptions?: AssumptionsForm;
};
type LatestIssuerInputs = { run: string; prior: PriorInputs };
/** The ID the review settled for a typed name, and the issuer that holds the name's usual ID. */
type SettledSlug = { name: string; id: string; holder?: string };

/**
 * The name an ID is filed under (the latest run's), or undefined when no run holds it or the
 * lookup failed: the service refuses an ID filed under another issuer at the summary and at Submit,
 * so a failed lookup cannot merge two issuers.
 */
async function holderOf(issuerId: string): Promise<string | undefined> {
  try {
    const latest: { latest_run: string; issuer_name?: string } = await getLatestIssuerRun(issuerId);
    return latest.latest_run ? (latest.issuer_name ?? "") : undefined;
  } catch {
    return undefined;
  }
}

async function latestIssuerInputs(issuer: string): Promise<LatestIssuerInputs | null> {
  const latest = await getLatestIssuerRun(issuer);
  if (!latest.latest_run) return null;
  return { run: latest.latest_run, prior: await getPriorInputs(latest.latest_run) };
}

type Attachment = keyof typeof ATTACHMENTS | "agreement";
type DocumentRow = {
  name: string;
  stored?: string;
  file?: File;
  pendingCopy?: boolean;
  copied?: boolean;
};
type IntakeView = {
  step: FormStep;
  busy?: "review" | "submit" | "documents" | "copy";
  canRead: boolean;
  copy?: { run: string; prior: PriorInputs };
  priorNote: string;
  issuerNotice: string;
  changeNotice: string;
  repeatedContent: ReadonlyMap<File, string>;
  identity: Context["identity"];
  issuerId: string;
  submittedBy: string;
  run: Context["run"];
  documentRows: DocumentRow[];
  inspected: Map<string, string>;
  ignored: Map<string, string>;
  shownDocs: DocumentRecord[];
  read: boolean;
  inspections: number;
  attachments: Partial<Record<Attachment, string>>;
  fileChoices: Record<string, string>;
  legal: string;
  earnings: boolean;
  level: string;
  analystNote: string;
  newest: string;
  forms: Forms;
  valuation: ValuationForm;
  moduleOptions: ModuleOptionsForm;
  assumptions: AssumptionsForm;
  changeAssumptions: (next: AssumptionsForm) => void;
  changeValuation: (next: ValuationForm) => void;
  changeModuleOptions: (next: ModuleOptionsForm) => void;
  modules: string[];
  requested: string[];
  turns: string;
  model: string;
  effort: string;
  capText: string | null;
  caps: Record<string, string>;
  synthetic: boolean;
  addFiles: (selected: Iterable<File> | null) => void;
  inspectDocuments: () => void;
  discardDocument: (name: string, file?: File) => void;
  changeIdentity: (
    key: keyof Context["identity"],
    value: Context["identity"][keyof Context["identity"]],
  ) => void;
  changeListedEquity: (checked: boolean) => void;
  changeRun: (key: keyof Context["run"], value: string) => void;
  changeIssuerId: (value: string) => void;
  changeSubmittedBy: (value: string) => void;
  carryLatest: () => void;
  resetIssuer: () => void;
  changePathway: (value: string) => void;
  changePurpose: (value: string) => void;
  changeLevel: (value: string) => void;
  changeAnalystNote: (value: string) => void;
  changeNewestOverride: (value: string) => void;
  changeLegal: (value: string) => void;
  changeAttachment: (key: Attachment, value: string) => void;
  rowsOf: (kind: RowKind) => Row[];
  changeRows: (kind: RowKind, rows: Row[]) => void;
  problem?: FieldProblem;
  /** On the review sheet: why the Issuer ID is not the usual one for the name; "" when it is. */
  idNote: string;
  useIssuerId: (id: string) => void;
  focusProblem: () => void;
  changeModel: (value: string) => void;
  changeEffort: (value: string) => void;
  changeTurns: (value: string) => void;
  toggleModule: (code: string, checked: boolean) => void;
};

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
  return {
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

function intakeDocuments(
  reading: Reading | undefined,
  files: File[],
  uploaded: Map<File, string>,
  copy: { prior: PriorInputs } | undefined,
  ignoredCopies: string[],
  copied: boolean,
) {
  const shownDocs = reading?.documents ?? [];
  const inspected = new Map(shownDocs.map((doc) => [storedName(doc), documentDescription(doc)]));
  const ignored = new Map(
    (reading?.ignored ?? []).map((item) =>
      typeof item === "string"
        ? [
            item,
            SOURCE_TYPES.test(item)
              ? "Not read; reason not recorded."
              : "Not a document type the run reads.",
          ]
        : [item.source, item.reason],
    ),
  );
  const localNames = new Set(uploaded.values());
  const documentRows: DocumentRow[] = [
    ...files.map((file) => ({ name: fileName(file), stored: uploaded.get(file), file })),
    ...[...new Set([...inspected.keys(), ...ignored.keys()])]
      .filter((name) => !localNames.has(name))
      .map((name) => ({ name, stored: name, file: undefined })),
    ...(reading === undefined && !copy?.prior.error
      ? (copy?.prior.files ?? [])
          .filter(({ name }) => !ignoredCopies.includes(name) && !localNames.has(name))
          .map(({ name }) => ({ name, pendingCopy: !copied, copied }))
      : []),
  ];
  const fileChoices: Record<string, string> = Object.fromEntries([
    ["", "None"] as const,
    ...Array.from(inspected.keys(), (name) => [name, name] as const),
  ]);
  return { shownDocs, inspected, ignored, documentRows, fileChoices };
}

type ReadinessRow = { label: string; met: boolean; detail?: string };

function readinessRows(
  shownDocs: DocumentRecord[],
  purposeChosen: boolean,
  review: Review | undefined,
  accepted: Set<string>,
  approved: boolean,
): ReadinessRow[] {
  const groups = review ? groupLimits(review.summary.items).groups : [];
  const decidedCount = groups.filter((group) => decided(group, accepted)).length;
  return [
    { label: "Documents inspected", met: shownDocs.length > 0 },
    { label: "Purpose chosen", met: purposeChosen },
    {
      label: "Decisions made",
      met: review !== undefined && decidedCount === groups.length,
      ...(review
        ? {
            detail: groups.length
              ? `${String(decidedCount)} of ${String(groups.length)}`
              : "None needed",
          }
        : {}),
    },
    { label: "Summary approved", met: review !== undefined && approved },
  ];
}

/** What the analyst reads or hears for a control, to tell whether it is still the same one. */
function accessibleText(node: HTMLElement) {
  return node.getAttribute("aria-label") ?? node.textContent.trim();
}

function shownCapText(cap: number | null) {
  return cap === null || !Number.isFinite(cap) ? null : `USD ${cap.toFixed(2)}`;
}

function intakeRunDetails({
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
}: {
  context: Context;
  customSlug?: string;
  settledSlug?: SettledSlug;
  caps: Record<string, string>;
  files: File[];
  copy?: { prior: PriorInputs };
  review?: Review;
  accepted: Set<string>;
  newestOverride?: string;
  reading?: Reading;
  ignoredCopies: readonly string[];
}) {
  const { run, identity } = context;
  const selectedCap = caps[run.pathway];
  return {
    run,
    identity,
    issuerId:
      customSlug ??
      (settledSlug?.name === identity.issuer_name.trim() ? settledSlug.id : undefined) ??
      issuerSlug(identity.issuer_name),
    requested: pathwayModules(run.pathway),
    cap: selectedCap ? Number(selectedCap) : null,
    earnings: run.pathway === "earnings_update",
    canRead:
      files.length > 0 ||
      (copy?.prior.files.some(({ name }) => !ignoredCopies.includes(name)) === true &&
        !copy.prior.error),
    checksComplete: review?.summary.items.every(
      (item) => !needsCheck(item) || accepted.has(item.id),
    ),
    newest: newestOverride ?? newestPeriod(reading),
  };
}

/** The place a history entry of this form stands for; `undefined` for any other entry. */
function placeOf(state: unknown): Place | undefined {
  if (typeof state !== "object" || state === null || !("startRun" in state)) return undefined;
  return PLACES.find((place) => place === state.startRun);
}

/**
 * Each step and the review sheet is a history entry, so the browser's Back and Forward move
 * between them with everything typed kept. `show` moves the form to a place and says whether it
 * could; an entry the form cannot show, such as a review it no longer holds, is passed over.
 */
function useStepHistory(place: Place, show: (target: Place) => boolean) {
  const entry = useRef(place);
  const arrive = useEffectEvent((target: Place) => {
    if (target !== place && !show(target)) {
      window.history.back();
      return;
    }
    entry.current = target;
  });
  useEffect(() => {
    window.history.replaceState({ startRun: entry.current }, "");
    const listen = (event: PopStateEvent) => {
      const target = placeOf(event.state);
      if (target) arrive(target);
    };
    window.addEventListener("popstate", listen);
    return () => {
      window.removeEventListener("popstate", listen);
    };
  }, []);
  useEffect(() => {
    if (entry.current === place) return;
    entry.current = place;
    window.history.pushState({ startRun: place }, "");
  }, [place]);
}

/**
 * While the form holds work, leaving the page (a link, Reload, closing the tab) asks the browser
 * to confirm. Once Submit has started the run the page moves on without asking.
 */
function useLeaveWarning(holdsWork: boolean, submitted: RefObject<boolean>) {
  useEffect(() => {
    if (!holdsWork) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!submitted.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [holdsWork, submitted]);
}

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

function documentsRead(inspected: number, ignored: number) {
  const noun = inspected === 1 ? "document" : "documents";
  return `${String(inspected)} ${noun} inspected, ${String(ignored)} ignored.`;
}

/** One file's bytes are released after hashing; the comparison map retains only compact digests. */
async function documentDigest(file: File) {
  const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result !== null && typeof reader.result !== "string") resolve(reader.result);
      else reject(new Error(`${fileName(file)} could not be compared with the other documents.`));
    };
    reader.onerror = () => {
      reject(new Error(`${fileName(file)} could not be compared with the other documents.`));
    };
    reader.readAsArrayBuffer(file);
  });
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Hash equal-size candidates sequentially, stopping when a newer selection replaces them. */
async function repeatedDocuments(files: readonly File[], current: () => boolean) {
  const counts = new Map<number, number>();
  for (const file of files) counts.set(file.size, (counts.get(file.size) ?? 0) + 1);
  const firstName = new Map<string, string>();
  const repeated = new Map<File, string>();
  for (const file of files) {
    if (!current()) return repeated;
    if ((counts.get(file.size) ?? 0) < 2) continue;
    const content = await documentDigest(file);
    const first = firstName.get(content);
    if (first !== undefined)
      repeated.set(file, `Same content as ${first}. Remove one copy before inspection.`);
    else firstName.set(content, fileName(file));
  }
  return repeated;
}

/** A notice is for the ID still in the field; a late reply for a previous ID is ignored. */
function useIssuerNotice(issuerId: string, typedName: string) {
  const [notice, setNotice] = useState<{ issuerId: string; text: string }>();
  useEffect(() => {
    if (!issuerId) return;
    let current = true;
    const timer = window.setTimeout(() => {
      void getLatestIssuerRun(issuerId).then(
        (latest) => {
          const named: typeof latest & { issuer_name?: string } = latest;
          const filed =
            named.issuer_name && named.issuer_name !== typedName.trim()
              ? ` Filed name: ${named.issuer_name}.`
              : "";
          if (current)
            setNotice(
              latest.runs > 0
                ? {
                    issuerId,
                    text: `This issuer has ${String(latest.runs)} ${latest.runs === 1 ? "run" : "runs"}; the latest is as of ${latest.latest_as_of}.${filed}`,
                  }
                : undefined,
            );
        },
        () => {
          if (current) setNotice(undefined);
        },
      );
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [issuerId, typedName]);
  return notice?.issuerId === issuerId ? notice.text : "";
}

function DocumentFields({
  view,
  folderInput,
}: {
  view: IntakeView;
  folderInput: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <FileUpload.Root className="sm:col-span-2">
        <FileUpload.DropZone
          inputLabel="Documents"
          chooseFiles
          hint={`Add ${SOURCE_TYPE_HINT}. Up to 50 MB per file.`}
          isDisabled={view.busy !== undefined}
          onDropFiles={view.addFiles}
        />
        <input
          ref={folderInput}
          className="sr-only"
          aria-label="Document folder"
          tabIndex={-1}
          type="file"
          multiple
          {...{ webkitdirectory: "" }}
          onChange={(event) => {
            view.addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            color="secondary"
            iconLeading={Folder}
            onPress={() => folderInput.current?.click()}
          >
            Choose a folder
          </Button>
          <Button
            color="secondary"
            isDisabled={!view.canRead || view.busy !== undefined}
            onPress={view.inspectDocuments}
          >
            {view.busy === "documents" ? "Reading documents…" : "Inspect documents"}
          </Button>
        </div>
        <p role="status" className="text-sm text-text-secondary empty:hidden">
          {view.read && view.documentRows.length > 0 ? (
            <span key={view.inspections}>
              {documentsRead(view.shownDocs.length, view.ignored.size)}
            </span>
          ) : null}
        </p>
        {view.documentRows.length > 0 ? (
          <FileUpload.List aria-label="Documents added">
            {view.documentRows.map(({ name, stored, file, pendingCopy, copied }, index) => {
              const repeat = file ? view.repeatedContent.get(file) : undefined;
              const reason = repeat ?? (stored ? view.ignored.get(stored) : undefined);
              const description = stored ? view.inspected.get(stored) : undefined;
              return (
                <li
                  key={`${name}-${String(index)}`}
                  className="flex min-w-0 items-start gap-3 rounded-xl p-3 text-sm ring-1 ring-secondary ring-inset"
                >
                  <File05 aria-hidden="true" className="mt-1 size-5 shrink-0 text-text-tertiary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium wrap-anywhere">{name}</p>
                    <Badge size="sm" color={reason ? "error" : description ? "success" : "gray"}>
                      {repeat
                        ? "Repeated content"
                        : reason
                          ? "Ignored"
                          : description
                            ? "Inspected"
                            : pendingCopy
                              ? "Will be copied"
                              : copied
                                ? "Copied"
                                : "Selected"}
                    </Badge>
                    {(reason || description) && (
                      <p className="mt-1 wrap-anywhere text-text-secondary">
                        {reason || description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    color="secondary"
                    aria-label={`Remove ${name}`}
                    isDisabled={view.busy !== undefined}
                    onPress={() => {
                      view.discardDocument(name, file);
                    }}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </FileUpload.List>
        ) : (
          <p className="text-sm text-text-secondary">No documents yet.</p>
        )}
      </FileUpload.Root>
      <div className="grid gap-2 sm:col-span-2">
        <h3 className="font-semibold">Issuer and case date</h3>
        {view.copy && <p className="text-sm text-text-secondary">{carriedIntro(view.copy)}</p>}
        {view.priorNote && (
          <p role="status" className="text-sm text-text-secondary">
            {view.priorNote}
          </p>
        )}
      </div>
      <div className="grid content-start gap-1">
        <label className={label}>
          Issuer name
          <input
            className={field}
            required
            placeholder="e.g. Northbridge Group plc"
            {...problemAttrs(view.problem, "issuer_name")}
            value={view.identity.issuer_name}
            onChange={(event) => {
              view.changeIdentity("issuer_name", event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="issuer_name" />
      </div>
      <div className="grid content-start gap-1">
        <label className={label}>
          {ISSUER_ID}
          <input
            className={field}
            required
            pattern="[a-z0-9][a-z0-9\-]{0,39}"
            maxLength={40}
            placeholder="e.g. northbridge-group-plc"
            {...problemAttrs(view.problem, "issuer_id")}
            value={view.issuerId}
            readOnly={!!view.copy}
            onChange={(event) => {
              view.changeIssuerId(event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="issuer_id" />
        {view.problem?.field === "issuer_id" && view.problem.offer && (
          <div>
            <Button
              color="secondary"
              size="sm"
              onPress={() => {
                view.useIssuerId(view.problem?.offer ?? "");
              }}
            >
              {`Use ${view.problem.offer}`}
            </Button>
          </div>
        )}
        <p className="text-sm text-text-secondary">
          Letters a–z, digits and hyphens, up to 40 characters.
        </p>
        {view.issuerNotice && <p className="text-sm text-text-secondary">{view.issuerNotice}</p>}
      </div>
      <div className="grid content-start gap-1">
        <label className={label}>
          As-of date
          <input
            className={field}
            type="date"
            required
            value={view.run.as_of}
            onChange={(event) => {
              view.changeRun("as_of", event.target.value);
            }}
          />
        </label>
      </div>
      <SelectField
        title={ISSUE_CLASSIFICATION}
        value={view.identity.issue_classification ?? ""}
        choices={{ "": "Choose classification", ...ISSUE_CLASSES }}
        onChange={(value) => {
          view.changeIdentity("issue_classification", value);
        }}
      />
      <div className="grid gap-2">
        <label className={label}>
          Your name <span aria-hidden="true">*</span>
          <input
            className={field}
            required
            aria-label="Your name"
            maxLength={80}
            autoComplete="off"
            placeholder="Eric G"
            {...problemAttrs(view.problem, "submitted_by")}
            aria-describedby={
              view.problem?.field === "submitted_by"
                ? "error-submitted_by run-analyst-name"
                : "run-analyst-name"
            }
            value={view.submittedBy}
            onChange={(event) => {
              view.changeSubmittedBy(event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="submitted_by" />
        <p id="run-analyst-name" className="text-sm text-text-tertiary">
          First name and initial, such as Eric G. Use two initials, such as Eric MG, if a colleague
          has a similar name. Shown on Run activity and in Teams.
        </p>
      </div>
      {view.copy ? (
        <Button color="secondary" onPress={view.resetIssuer}>
          This is a different issuer
        </Button>
      ) : (
        <Button color="secondary" onPress={view.carryLatest}>
          Carry over from latest run
        </Button>
      )}
    </>
  );
}

function PurposeFields({ view }: { view: IntakeView }) {
  return (
    <>
      <div className="sm:col-span-2">
        <PurposeCards
          label={PATHWAY_LABEL}
          value={view.run.pathway}
          purposes={PATHWAY_CARDS.map((pathway) => {
            const cap = view.caps[pathway.id];
            const capText = cap && shownCapText(Number(cap));
            return {
              ...pathway,
              description: `${pathway.description} ${capText ? `Cap ${capText}.` : "Cap unavailable."}`,
            };
          })}
          onChange={view.changePathway}
        />
      </div>
      {view.synthetic && (
        <p className="text-sm text-text-secondary sm:col-span-2">{SYNTHETIC_LIMITS}</p>
      )}
      <SelectField
        title={RUN_PURPOSE_LABEL}
        value={view.run.run_type ?? "research"}
        choices={
          view.earnings
            ? { earnings: PURPOSES.earnings }
            : {
                research: PURPOSES.research,
                primary: PURPOSES.primary,
                secondary: PURPOSES.secondary,
              }
        }
        onChange={view.changePurpose}
      />
      <SelectField
        title={CASE_KIND_LABEL}
        value={view.run.case_kind}
        help="Web research runs for public and private cases, never for a synthetic test case."
        choices={CASE_KINDS}
        onChange={(value) => {
          view.changeRun("case_kind", value);
        }}
      />
      <SelectField
        title="Run form level"
        value={view.level}
        help="Advanced adds model, effort, turns per module, module selection and valuation and assumption fields."
        choices={LEVELS}
        onChange={view.changeLevel}
      />
    </>
  );
}

function ContextFields({ view }: { view: IntakeView }) {
  return (
    <>
      <ContextInputFields view={view} />
      <IssuerDetailsFields view={view} />
      <StructuredContextFields view={view} />
      <ValuationSection view={view} />
      <AssumptionsSection view={view} />
      <AdvancedOptionsFields view={view} />
    </>
  );
}

/** A reporting period: required, and marked so, only when the pathway compares two periods. */
function PeriodField({
  view,
  field: key,
  title,
  placeholder,
}: {
  view: IntakeView;
  field: "current_period" | "prior_period";
  title: string;
  placeholder: string;
}) {
  return (
    <div className="grid content-start gap-1">
      <label className={label}>
        {view.earnings ? (
          <>
            {title} <span className="font-normal text-text-tertiary">(required)</span>
          </>
        ) : (
          title
        )}
        <input
          className={field}
          aria-required={view.earnings || undefined}
          {...problemAttrs(view.problem, key)}
          placeholder={placeholder}
          value={view.run[key] ?? ""}
          onChange={(event) => {
            view.changeRun(key, event.target.value.trim().toLowerCase());
          }}
        />
      </label>
      <FieldMessage problem={view.problem} field={key} />
    </div>
  );
}

function ContextInputFields({ view }: { view: IntakeView }) {
  return (
    <>
      <div className="grid gap-1 sm:col-span-2">
        <label className={label}>
          Anything the analysis should know
          <textarea
            aria-describedby="run-analyst-questions"
            {...problemAttrs(view.problem, "analyst_note")}
            className={field}
            rows={3}
            placeholder="For example, the committee wants a view on the 2028 maturities."
            value={view.analystNote}
            onChange={(event) => {
              view.changeAnalystNote(event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="analyst_note" />
        <p id="run-analyst-questions" className="text-sm text-text-tertiary">
          Your note is included in the run’s research questions.
        </p>
      </div>
      <label className={label}>
        Date of your newest file
        <input
          className={field}
          type="date"
          value={view.newest}
          onChange={(event) => {
            view.changeNewestOverride(event.target.value);
          }}
        />
      </label>
      <div className="grid content-start gap-1">
        <label className={label}>
          Research cutoff
          <input
            className={field}
            type="date"
            {...problemAttrs(view.problem, "cutoff")}
            value={view.run.cutoff || view.run.as_of}
            max={view.run.as_of || undefined}
            onChange={(event) => {
              view.changeRun("cutoff", event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="cutoff" />
      </div>
      <PeriodField
        view={view}
        field="current_period"
        title="Current period"
        placeholder="q3-2026"
      />
      <PeriodField view={view} field="prior_period" title="Prior period" placeholder="q2-2026" />
      <SelectField
        title={LEGAL_DOCUMENTS}
        value={view.legal}
        choices={LEGAL_CHOICES}
        problem={view.problem}
        problemField="legal_documents"
        onChange={view.changeLegal}
      />
      {view.legal !== "none" && (
        <SelectField
          title="The agreement"
          value={view.attachments.agreement ?? ""}
          choices={view.fileChoices}
          problem={view.problem}
          problemField="agreement"
          onChange={(value) => {
            view.changeAttachment("agreement", value);
          }}
        />
      )}
      {(view.earnings || view.level === "advanced") && (
        <SelectField
          title={ATTACHMENTS.management_bridge}
          value={view.attachments.management_bridge ?? ""}
          choices={view.fileChoices}
          onChange={(value) => {
            view.changeAttachment("management_bridge", value);
          }}
        />
      )}
      {(["portfolio_workbook", "prior_case"] as const)
        .filter(
          (key) =>
            view.level === "advanced" ||
            view.run.pathway === "portfolio_decision" ||
            (key === "portfolio_workbook" &&
              ["credit_snapshot", "deep_credit_assessment"].includes(view.run.pathway)),
        )
        .map((key) => (
          <SelectField
            key={key}
            title={ATTACHMENTS[key]}
            value={view.attachments[key] ?? ""}
            choices={view.fileChoices}
            onChange={(value) => {
              view.changeAttachment(key, value);
            }}
          />
        ))}
    </>
  );
}

function IssuerDetailsFields({ view }: { view: IntakeView }) {
  return (
    <details className="rounded-lg border border-border-hairline p-3 sm:col-span-2">
      <summary className="cursor-pointer font-semibold">{ISSUER_DETAILS}</summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {ISSUER_TEXT_BOXES.map(([key, title, example]) => (
          <label key={key} className={label}>
            {title}
            <input
              className={field}
              placeholder={`e.g. ${example}`}
              value={view.identity[key] ?? ""}
              onChange={(event) => {
                view.changeIdentity(key, event.target.value);
              }}
            />
          </label>
        ))}
        {ISSUER_LIST_BOXES.map(([key, title]) => (
          <label key={key} className={label}>
            {title}
            <textarea
              className={field}
              placeholder="One per line"
              defaultValue={(view.identity[key] ?? []).join("\n")}
              key={view.copy?.run ?? "new"}
              onChange={(event) => {
                view.changeIdentity(
                  key,
                  event.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                );
              }}
            />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={view.identity.listed_equity ?? false}
            onChange={(event) => {
              view.changeListedEquity(event.target.checked);
            }}
          />{" "}
          {LISTED_EQUITY}
        </label>
        {view.identity.listed_equity && (
          <label className={label}>
            {TICKER}
            <input
              className={field}
              value={view.identity.ticker ?? ""}
              onChange={(event) => {
                view.changeIdentity("ticker", event.target.value);
              }}
            />
          </label>
        )}
      </div>
    </details>
  );
}

function StructuredContextFields({ view }: { view: IntakeView }) {
  const focusChoices = [
    ["", ANY_FOCUS] as const,
    ...drawnModules(pathwayModules(view.run.pathway)).map((id) => [id, moduleName(id)] as const),
  ];
  return (
    <div className="grid gap-4 sm:col-span-2">
      <h3 className="font-semibold">{CONTEXT_DETAILS}</h3>
      {CONTEXT_ROW_KINDS.map((kind) => (
        <section key={kind} aria-labelledby={`rows-${kind}`} className="grid gap-2">
          <h4 id={`rows-${kind}`} className="text-sm font-semibold">
            {ROW_SPECS[kind].section}
          </h4>
          <RowEditor
            kind={kind}
            rows={view.rowsOf(kind)}
            onChange={(next) => {
              view.changeRows(kind, next);
            }}
            primary={view.run.run_type === "primary"}
            required={kind === "deal_terms" && view.run.run_type === "primary"}
            focusChoices={focusChoices}
            error={view.problem?.field === kind ? view.problem.message : undefined}
          />
        </section>
      ))}
    </div>
  );
}

function ValuationSection({ view }: { view: IntakeView }) {
  const wanted = view.requested;
  const runs = { cp3: wanted.includes("CP-3"), cp6: wanted.includes("CP-6") };
  const named = view.problem?.field === "valuation" || view.problem?.field === "module_options";
  if (view.level !== "advanced" && !view.forms.valuation && !view.forms.module_options && !named)
    return null;
  return (
    <div className="grid gap-3 sm:col-span-2">
      <details className="rounded-lg border border-border-hairline p-3">
        <summary className="cursor-pointer text-sm font-semibold">{VALUATION_TITLE}</summary>
        <div className="mt-3">
          <ValuationFields
            form={view.valuation}
            onChange={view.changeValuation}
            marker={problemAttrs(view.problem, "valuation")}
            message={<FieldMessage problem={view.problem} field="valuation" />}
          />
        </div>
      </details>
      {(runs.cp3 || runs.cp6) && (
        <details className="rounded-lg border border-border-hairline p-3">
          <summary className="cursor-pointer text-sm font-semibold">{MODULE_OPTIONS_TITLE}</summary>
          <div className="mt-3">
            <ModuleOptionsFields
              form={view.moduleOptions}
              runs={runs}
              onChange={view.changeModuleOptions}
              marker={problemAttrs(view.problem, "module_options")}
              message={<FieldMessage problem={view.problem} field="module_options" />}
            />
          </div>
        </details>
      )}
    </div>
  );
}

function AssumptionsSection({ view }: { view: IntakeView }) {
  if (view.level !== "advanced" && !view.forms.assumptions && view.problem?.field !== "assumptions")
    return null;
  return (
    <details className="rounded-lg border border-border-hairline p-3 sm:col-span-2">
      <summary className="cursor-pointer text-sm font-semibold">{ASSUMPTIONS_TITLE}</summary>
      <div className="mt-3 grid gap-3">
        <p className="text-sm text-text-secondary">
          Optional. Pin a value only where you hold a house view; otherwise the module chooses.
        </p>
        <AssumptionFields
          form={view.assumptions}
          modules={view.requested}
          onChange={view.changeAssumptions}
          marker={problemAttrs(view.problem, "assumptions")}
          message={<FieldMessage problem={view.problem} field="assumptions" />}
        />
      </div>
    </details>
  );
}

function AdvancedOptionsFields({ view }: { view: IntakeView }) {
  if (view.level !== "advanced") return null;
  return (
    <>
      <SelectField title="Model" value={view.model} choices={MODELS} onChange={view.changeModel} />
      <SelectField
        title="Reasoning effort"
        value={view.effort}
        choices={EFFORTS}
        onChange={view.changeEffort}
      />
      <div className="grid content-start gap-1">
        <label className={label}>
          Turns per module
          <input
            className={field}
            type="number"
            required
            min={1}
            max={64}
            step={1}
            {...problemAttrs(view.problem, "turns")}
            value={view.turns}
            onChange={(event) => {
              view.changeTurns(event.target.value);
            }}
          />
        </label>
        <FieldMessage problem={view.problem} field="turns" />
      </div>
      <fieldset className="min-w-0 rounded-lg border border-border-hairline p-3 sm:col-span-2">
        <legend className="px-1 text-sm font-semibold">Requested modules</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {drawnModules(view.requested).map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!view.modules.length || view.modules.includes(code)}
                disabled={drawnModules(view.modules).length === 1 && view.modules.includes(code)}
                onChange={(event) => {
                  view.toggleModule(code, event.target.checked);
                }}
              />{" "}
              {moduleName(code)}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

const HEADING_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function focusStep(node: HTMLElement | null) {
  node?.focus();
}

function fileName(file: File) {
  return (file.webkitRelativePath || "").split("/").slice(1).join("/") || file.name;
}

export function SelectField({
  title,
  value,
  choices,
  onChange,
  problem,
  problemField,
  help,
}: {
  title: string;
  value: string;
  choices: Readonly<Record<string, string>>;
  onChange: (value: string) => void;
  problem?: FieldProblem;
  problemField?: FieldKey;
  help?: string;
}) {
  const helpId = useId();
  const failing = problemField !== undefined && problem?.field === problemField;
  const describedBy =
    [help ? helpId : "", failing ? `error-${problemField}` : ""].filter(Boolean).join(" ") ||
    undefined;
  const select = (
    <label className={label}>
      {title}
      <select
        className={field}
        {...(problemField ? problemAttrs(problem, problemField) : {})}
        aria-describedby={describedBy}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {Object.entries(choices).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  if (!help && !problemField) return select;
  return (
    <div className="grid content-start gap-1">
      {select}
      {help && (
        <p id={helpId} className="text-sm text-text-tertiary">
          {help}
        </p>
      )}
      {problemField && <FieldMessage problem={problem} field={problemField} />}
    </div>
  );
}

function isRecord(item: unknown): item is Row {
  return item !== null && typeof item === "object" && !Array.isArray(item);
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
        badges={mode === "synthetic" ? <Badge color="brand">Synthetic test</Badge> : undefined}
      />
      {value ? (
        <>
          <p className="mt-3 text-sm text-text-secondary">
            Choose the documents and purpose, then review what will run.
          </p>
          <IntakeForm mode={mode} navigate={navigate} {...value} />
        </>
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
            The run options could not be loaded. Try again, or ask whoever runs the service to check
            it.
          </Alert>
        </div>
      ) : (
        <div role="status" aria-label="Loading run options" className="mt-6">
          <Skeleton lines={4} />
        </div>
      )}
    </>
  );
}

function IntakeForm({
  template,
  caps,
  initial,
  warning,
  navigate,
  mode,
}: {
  template: Context;
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
  } = reviewState;
  const draftRef = useRef<Draft | null>(null);
  // Snapshot of the last review, made when the analyst leaves it by a stepper or Edit button.
  // The next review uses it once, only for the same issuer id and pathway. "Carry over from
  // latest run" and "This is a different issuer" clear it.
  const reviewedRef = useRef<Reviewed | null>(null);
  const active = useRef(false);
  const folderInput = useRef<HTMLInputElement>(null);
  // The control that had focus when a busy state began; busy fieldsets disable it and drop focus.
  const focusedBefore = useRef<{ node: HTMLElement; text: string } | null>(null);
  // Set when Submit has started the run, so leaving the page for it is not warned about.
  const submitted = useRef(false);
  // The step heading takes focus only after the step changes, never on first render.
  const [moved, setMoved] = useState(false);
  // Counts finished inspections, so a repeated result is announced again.
  const [inspections, setInspections] = useState(0);
  const [changeNotice, setChangeNotice] = useState("");
  const [repeatedContent, setRepeatedContent] = useState<ReadonlyMap<File, string>>(new Map());
  const selectionRevision = useRef(0);
  const contentQueue = useRef<Promise<void>>(Promise.resolve());
  useEffect(
    () => () => {
      selectionRevision.current += 1;
    },
    [],
  );

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
    });
  const issuerNotice = useIssuerNotice(issuerId, identity.issuer_name);

  function clearProblem(...fields: FieldKey[]) {
    setFieldError((previous) =>
      previous && fields.includes(previous.field) ? undefined : previous,
    );
  }

  function changeRun(key: keyof Context["run"], value: string) {
    if (key === "pathway") invalidateReview();
    if (key === "current_period" || key === "prior_period") clearProblem(key);
    setContext((previous) => ({ ...previous, run: { ...previous.run, [key]: value } }));
  }

  function invalidateReview() {
    setReview(undefined);
    setAccepted(new Set());
    setApproved(false);
    setSubmitUncertain(false);
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
    if (active.current) return;
    active.current = true;
    focusedBefore.current =
      document.activeElement instanceof HTMLElement
        ? { node: document.activeElement, text: accessibleText(document.activeElement) }
        : null;
    setBusy(action);
    setError("");
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
        setUploaded(new Map());
        setReading(undefined);
      }
      setError(draftErrorText(failure));
    } finally {
      active.current = false;
      setBusy(undefined);
    }
  }

  /** Selection and inspection share one queue, so at most one file buffer is being hashed. */
  function checkRepeatedDocuments(selected: readonly File[], revision = selectionRevision.current) {
    const result = contentQueue.current.then(() =>
      repeatedDocuments(selected, () => revision === selectionRevision.current),
    );
    // Each caller handles its own error; a failed read must not prevent a later selection's check.
    contentQueue.current = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function refreshDocuments() {
    const incoming = files.map((file) => ({ file, name: fileName(file) }));
    const names = incoming.map(({ name }) => name.normalize("NFC").toLowerCase());
    if (new Set(names).size !== names.length) {
      throw new Error("Choose documents with distinct file names.");
    }
    const repeated = await checkRepeatedDocuments(files);
    setRepeatedContent(repeated);
    if (repeated.size > 0) throw new Error([...repeated.values()].join(" "));
    if (!draftRef.current) {
      const { id } = await createSubmission();
      draftRef.current = { id, uploaded: new Map(), copied: false };
    }
    const draft = draftRef.current;
    for (const { file, name } of incoming) {
      if (draft.uploaded.has(file)) continue;
      const result = await upload(draft.id, file, name);
      const collisionKey = result.name.normalize("NFC").toLowerCase();
      if (
        [...draft.uploaded.values()].some(
          (stored) => stored.normalize("NFC").toLowerCase() === collisionKey,
        )
      ) {
        draftRef.current = null;
        setDocumentsCopied(false);
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
      await carryDocuments(draft.id, copy.run);
      for (const name of ignoredCopies) {
        if (![...draft.uploaded.values()].includes(name)) await removeDocument(draft.id, name);
      }
      draft.copied = true;
      setDocumentsCopied(true);
    }
    return { draft, result: await readDocuments(draft) };
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
      if (draft && stored) {
        await removeDocument(draft.id, stored);
        if (file) {
          draft.uploaded.delete(file);
          setUploaded(new Map(draft.uploaded));
        }
      }
      if (copy && stored) setIgnoredCopies((previous) => [...new Set([...previous, stored])]);
      if (file) {
        const remaining = files.filter((item) => item !== file);
        setFiles(remaining);
        selectionRevision.current += 1;
        setRepeatedContent(await checkRepeatedDocuments(remaining));
      }
      setAttachments((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(([, chosen]) => chosen !== (stored || name)),
        ),
      );
      if (draft && stored) await readDocuments(draft);
    });
  }

  function addFiles(selected: Iterable<File> | null) {
    if (active.current) return;
    const candidates = Array.from(selected ?? []).filter(
      (file) =>
        !fileName(file)
          .split("/")
          .some((part) => part.startsWith(".")),
    );
    const names = new Set(files.map((file) => fileName(file).normalize("NFC").toLowerCase()));
    const added: File[] = [];
    const problems: string[] = [];
    for (const file of candidates) {
      const name = fileName(file);
      const key = name.normalize("NFC").toLowerCase();
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
    const revision = ++selectionRevision.current;
    void checkRepeatedDocuments([...files, ...added], revision).then(
      (repeated) => {
        if (revision === selectionRevision.current) setRepeatedContent(repeated);
      },
      (failure: unknown) => {
        if (revision === selectionRevision.current) setError(errorText(failure));
      },
    );
    if (added.length > 0) setReading(undefined);
    setError(problems.join(" "));
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

  function makeAnswers(result: Reading, details: Record<string, unknown>, id: string): Answers {
    if (run.cutoff && run.cutoff > run.as_of)
      throw new FieldProblem("cutoff", "Research cutoff must be on or before the as-of date.");
    const available = new Set(result.documents.map(storedName));
    const chosen = (key: Attachment) => available.has(attachments[key] ?? "");
    if (legal !== "none" && !chosen("agreement"))
      throw new FieldProblem("agreement", "Choose the uploaded file that is the agreement.");
    if (earnings) {
      for (const [key, title] of [
        ["current_period", "Current period"],
        ["prior_period", "Prior period"],
      ] as const)
        if (!run[key]) throw new FieldProblem(key, `${title} is required for Earnings Update.`);
    }
    const advanced = level === "advanced";
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
      max_turns: advanced ? Number(turns) : 32,
      level,
      model: advanced ? model : "gpt",
      effort: advanced ? effort : "balanced",
      submitted_by: submittedBy.trim(),
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
    const details: Record<string, unknown> = {};
    if (forms.valuation) details.valuation = sendableValuation(forms.valuation);
    if (forms.module_options) {
      const wanted = pathwayModules(run.pathway);
      details.module_options = sendableModuleOptions(forms.module_options, {
        cp3: wanted.includes("CP-3"),
        cp6: wanted.includes("CP-6"),
      });
    }
    if (forms.assumptions)
      details.assumptions = sendableAssumptions(
        forms.assumptions,
        context.assumptions,
        pathwayModules(run.pathway),
      );
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
    return details;
  }

  async function prepareReview() {
    const details = reviewDetails();
    const { draft, result } = await refreshDocuments();
    if (!result.documents.length)
      throw new Error("The service could not read any of the selected documents.");
    const answers = makeAnswers(result, details, await settleIssuerId());
    const noteAt = noteIndex(details, analystNote);
    const shownCap = capForPathway(caps, answers.context.run.pathway);
    const summary = await getSummary(draft.id, answers, shownCap).catch(
      async (failure: unknown) => {
        throw (await idProblem(failure)) ?? refusedField(failure, requested, noteAt) ?? failure;
      },
    );
    requireSummaryCap(summary, shownCap);
    if (!summary.digest) throw new Error("The service did not issue an approval for this run.");
    const newestDate = newestOverride ?? newestPeriod(result);
    const dateLimitation =
      newestDate && run.as_of < newestDate
        ? [
            {
              id: "form:newest-document-date",
              scope: "run",
              outcome: "limited",
              reason: `The as-of date (${run.as_of}) is before your newest document (${newestDate}). Modules may set this document aside.`,
              fix: "Use an as-of date on or after the newest document date.",
            },
          ]
        : [];
    const items = [...summary.items, ...dateLimitation];
    const reviewed = reviewedRef.current;
    reviewedRef.current = null;
    setAccepted(
      reviewed?.pathway === answers.context.run.pathway &&
        reviewed.issuerId === answers.context.identity.issuer_id
        ? carryAccepted(reviewed.items, reviewed.accepted, items)
        : new Set(),
    );
    setApproved(false);
    setReview({
      id: draft.id,
      answers,
      summary: { ...summary, items },
      cap: shownCap,
      attachmentNames: { portfolio_workbook: attachments.portfolio_workbook },
    });
  }

  async function makeReview() {
    if (!canRead || active.current) return;
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
    if (active.current) return;
    switch (step) {
      case "documents":
        if (!canRead) return;
        await withDraft("documents", async () => {
          if (!isAnalystName(submittedBy.trim()))
            throw new FieldProblem("submitted_by", ANALYST_NAME_RULE);
          const { result } = await refreshDocuments();
          if (!result.documents.length)
            throw new Error("The service could not read any of the selected documents.");
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
    if (
      review.answers.context.run.pathway !== run.pathway ||
      review.cap !== caps[run.pathway] ||
      review.summary.cap !== review.cap
    ) {
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
        submitted.current = true;
        navigate(`/run/${encodeURIComponent(id)}`);
      } catch (failure) {
        if (failure instanceof RequestError && [400, 404].includes(failure.status)) {
          if (failure.status === 404) {
            draftRef.current = null;
            setDocumentsCopied(false);
            setUploaded(new Map());
            setReading(undefined);
          }
          setReview(undefined);
          setAccepted(new Set());
          setApproved(false);
          setSubmitUncertain(false);
          const taken = await idProblem(failure);
          if (taken) throw taken;
          setError(
            `${asSentence(draftErrorText(failure))} Review the run again before submitting.`,
          );
        } else {
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
    selectionRevision.current += 1;
    setRepeatedContent(new Map());
    setNewestOverride(undefined);
    draftRef.current = null;
    setDocumentsCopied(false);
    setUploaded(new Map());
  }

  function toggleModule(code: string, checked: boolean) {
    const selected = modules.length ? modules : requested;
    const next = checked ? [...selected, code] : selected.filter((item) => item !== code);
    setModules(
      next.length === requested.length ? [] : requested.filter((item) => next.includes(item)),
    );
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
  );

  const { title, previous, next } = FORM_STEPS[step];
  const capText = shownCapText(cap);
  const synthetic = mode === "synthetic";
  const readiness = readinessRows(shownDocs, purposeChosen, review, accepted, approved);

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

  /** Moves to a place the browser's Back or Forward named; false when the form cannot show it. */
  function showPlace(target: Place) {
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
    valuation: forms.valuation ?? readValuation(context.valuation),
    moduleOptions: forms.module_options ?? readModuleOptions(context.module_options),
    assumptions: forms.assumptions ?? readAssumptions(context.assumptions),
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
    capText,
    caps,
    synthetic,
    addFiles,
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
      if (value !== "advanced") setModules([]);
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
    changeModel: setModel,
    changeEffort: setEffort,
    changeTurns: (value) => {
      clearProblem("turns");
      setTurns(value);
    },
    toggleModule,
    problem: fieldError,
    idNote:
      review && settledSlug?.holder && review.answers.context.identity.issuer_id === settledSlug.id
        ? `Issuer ID ${settledSlug.id} was used for this run because ${issuerSlug(settledSlug.name)} is filed under the name "${settledSlug.holder}". If that is this issuer under another name, type that name.`
        : "",
    useIssuerId: (id) => {
      clearProblem("issuer_id");
      setCustomSlug(id);
    },
    focusProblem: () => {
      if (fieldError) focusField(fieldError.field);
    },
  };

  useEffect(() => {
    if (fieldError && busy === undefined) focusField(fieldError.field);
  }, [fieldError, busy]);

  useEffect(() => {
    if (busy !== undefined) return;
    const remembered = focusedBefore.current;
    focusedBefore.current = null;
    if (
      remembered?.node.isConnected &&
      document.activeElement === document.body &&
      !remembered.node.matches(":disabled") &&
      accessibleText(remembered.node) === remembered.text
    )
      remembered.node.focus();
  }, [busy]);

  // Documents carried from an earlier run count as much as chosen ones. A legal or module choice
  // is made on More context, which opens only once a purpose has been chosen.
  const holdsWork =
    documentRows.some((row) => !row.pendingCopy) ||
    ignoredCopies.length > 0 ||
    purposeChosen ||
    review !== undefined ||
    submittedBy.trim() !== "" ||
    analystNote.trim() !== "" ||
    run.as_of !== "" ||
    (customSlug !== undefined &&
      customSlug !== (copy?.prior.issuer_id ?? template.identity.issuer_id)) ||
    identity.issue_classification !==
      (copy?.prior.context?.identity.issue_classification ??
        template.identity.issue_classification) ||
    identity.issuer_name !== (copy?.prior.issuer_name ?? template.identity.issuer_name);
  useLeaveWarning(holdsWork, submitted);
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

function IntakePanels(props: IntakePanelsProps) {
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
  const capBar = cap && capText ? { value: 0, max: cap, label: `USD 0.00 of ${capText}` } : null;
  const ready = `${String(readiness.filter((row) => row.met).length)} of ${String(readiness.length)} ready · ${capBar ? capBar.label : "Cap unavailable"}`;
  return (
    <div className="mt-6 grid min-w-0 items-start gap-6 min-[1041px]:grid-cols-[minmax(0,1fr)_320px]">
      <div className={`min-w-0 ${card}`}>
        <div className="@container grid gap-5">
          <Stepper
            step={review ? "start" : step}
            steps={STEPPER_STEPS.map((item) =>
              item.key === "context" && view.earnings
                ? { ...item, note: "Periods required" }
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
          <p className="text-sm text-text-secondary @[620px]:hidden">
            {review
              ? `Step ${String(STEP_TOTAL)} of ${String(STEP_TOTAL)} · Review and start`
              : `Step ${String(FORM_STEP_KEYS.indexOf(step) + 1)} of ${String(STEP_TOTAL)} · ${title}`}
          </p>
        </div>
        {error && !review && <RefusalNotice lines={refusalLines(error)} />}
        {view.changeNotice && <p className="text-sm text-text-secondary">{view.changeNotice}</p>}
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
      <StartReadiness
        rows={readiness}
        cap={capBar}
        capTitle={synthetic ? "Configured cap for paid runs" : "Spending cap for this run"}
      />
    </div>
  );
}

function ReviewConfirmation({
  review,
  accepted,
  approved,
  checksComplete,
  busy,
  error,
  submitUncertain,
  capText,
  capAvailable,
  synthetic,
  ready,
  idNote,
  onAccept,
  onApprove,
  onEdit,
  onModules,
  onSubmit,
}: {
  idNote: string;
  review: Review;
  accepted: Set<string>;
  approved: boolean;
  checksComplete: boolean;
  busy?: "review" | "submit" | "documents" | "copy";
  error: string;
  submitUncertain: boolean;
  capText: string | null;
  capAvailable: boolean;
  synthetic: boolean;
  ready: string;
  onAccept: (ids: readonly string[], checked: boolean) => void;
  onApprove: (approved: boolean) => void;
  onEdit: (step: FormStep) => void;
  onModules: (modules: string[]) => void;
  onSubmit: () => void;
}) {
  const submitLabel = submitLabelFor({ busy, synthetic, capText });
  const confirmation = confirmationFor(synthetic, capText);
  const submitDisabled =
    !checksComplete || !approved || busy !== undefined || (!synthetic && !capAvailable);
  const { groups } = groupLimits(review.summary.items);
  const undecided = groups.filter((group) => !decided(group, accepted)).length;
  const blocker = submitBlocker(undecided, approved);
  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        <h2 ref={focusStep} tabIndex={-1} className={`${heading} ${HEADING_FOCUS}`}>
          Review and start
        </h2>
        <p className="text-sm text-text-secondary">
          Review the final run details and confirm to start.
        </p>
      </div>
      <ReviewSheet
        review={review}
        accepted={accepted}
        disabled={busy !== undefined || submitUncertain}
        onEdit={onEdit}
        onModules={onModules}
        onAccept={onAccept}
        synthetic={synthetic}
      />
      {synthetic && <p className="text-sm text-text-secondary">{SYNTHETIC_LIMITS}</p>}
      {idNote && <p className="text-sm text-text-secondary">{idNote}</p>}
      {blocker && (
        <p id="run-submit-blocker" className="text-sm text-text-secondary">
          {blocker}
        </p>
      )}
      <label className="flex items-start gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          aria-describedby={blocker ? "run-submit-blocker" : undefined}
          checked={approved}
          disabled={!checksComplete || busy !== undefined || submitUncertain}
          onChange={(event) => {
            onApprove(event.target.checked);
          }}
        />
        Approve: I have read this summary and want this run started
      </label>
      <div className="grid gap-1 border-t border-border-hairline pt-4">
        <h3 className="text-md font-semibold text-text-primary">
          {synthetic ? "Submit starts a synthetic test" : "Submit starts a paid run"}
        </h3>
        <p id="run-submit-cost" className="text-sm text-text-secondary">
          <SubmissionCost synthetic={synthetic} capText={capText} />
        </p>
      </div>
      <p className="text-sm text-text-secondary min-[1041px]:hidden">{ready}</p>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="text-sm text-text-tertiary">
          Step {STEP_TOTAL} of {STEP_TOTAL}
        </span>
        <SubmitConfirmation
          className="w-full sm:w-auto"
          label={submitLabel}
          confirm={confirmation}
          isDisabled={submitDisabled}
          describedBy="run-submit-cost"
          onConfirm={onSubmit}
        />
      </div>
    </div>
  );
}

function draftErrorText(failure: unknown) {
  if (
    failure instanceof RequestError &&
    failure.status === 404 &&
    failure.message === "unknown submission"
  )
    return "This draft is unavailable and may have expired. Your answers and selected documents are still here. Continue the form or review the run again to create a new draft and re-upload the documents.";
  return errorText(failure);
}

/**
 * What the analyst reads when the Submit request got no answer. The service starts one run for a
 * submission and returns that run when the same submission arrives again (`scheduler.submit`), so a
 * repeat is safe; the page cannot know whether the first one arrived, and says so.
 */
function lostSubmitText(failure: unknown) {
  const lead = isUnreachable(failure)
    ? "The page lost contact with the service, so it cannot tell whether the run started."
    : `${asSentence(errorText(failure))} The run may or may not have started.`;
  return `${lead} Submitting again is safe. The service starts one run for this approval and returns that run if it already exists.`;
}

function submitBlocker(undecided: number, approved: boolean) {
  if (undecided > 0)
    return `${String(undecided)} ${undecided === 1 ? "decision" : "decisions"} left before you can approve.`;
  return approved ? "" : "Approve the summary to enable Submit.";
}

function SubmissionCost({ synthetic, capText }: { synthetic: boolean; capText: string | null }) {
  if (synthetic)
    return <>The synthetic test uses the supplied documents and makes no paid provider calls.</>;
  if (capText === null)
    return <>The spending cap is unavailable. Reopen the form to load it before submitting.</>;
  return (
    <>
      It can spend up to <strong className="tabular-nums">{capText}</strong>. You confirm once more
      before anything is spent.
    </>
  );
}

function submitLabelFor({
  busy,
  synthetic,
  capText,
}: {
  busy?: "review" | "submit" | "documents" | "copy";
  synthetic: boolean;
  capText: string | null;
}) {
  if (busy === "submit") return "Submitting…";
  if (synthetic) return "Submit run";
  return `Submit, spend up to ${capText ?? "the cap"}`;
}

function confirmationFor(synthetic: boolean, capText: string | null) {
  if (synthetic)
    return {
      title: "Start a synthetic test?",
      text: "This test runs the workflow with the supplied documents and spends USD 0.00.",
      action: "Start synthetic run",
    };
  return {
    title: "Start a paid run?",
    text: `This run can spend up to ${capText ?? "the configured cap"} and stops when it reaches that cap. Once it starts, what it has spent cannot be taken back.`,
    action: `Start run, up to ${capText ?? "the cap"}`,
  };
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
  return (
    <form
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
        <p className="text-sm text-text-secondary">
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
      <p className="text-sm text-text-secondary min-[1041px]:hidden">{ready}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          color="secondary"
          isDisabled={previous === null || view.busy !== undefined}
          onPress={onPrevious}
        >
          Previous
        </Button>
        <div className="grid justify-items-center gap-1">
          <span className="text-sm text-text-tertiary">
            Step {FORM_STEP_KEYS.indexOf(view.step) + 1} of {STEP_TOTAL}
          </span>
          {view.problem && (
            <Button
              color="link-destructive"
              size="sm"
              className="max-w-full text-left whitespace-normal"
              onPress={view.focusProblem}
            >
              {`1 problem to fix: ${view.problem.message}`}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {blocked && (
            <p id="run-step-blocker" className="text-sm text-text-secondary">
              Add at least one document to continue.
            </p>
          )}
          <Button
            type="submit"
            aria-describedby={blocked ? "run-step-blocker" : undefined}
            isDisabled={view.busy !== undefined || blocked}
          >
            {view.busy === "review" ? "Preparing review…" : next}
          </Button>
        </div>
      </div>
    </form>
  );
}

function newestPeriod(reading?: Reading) {
  return (
    (reading?.documents ?? [])
      .flatMap(({ period_end }) => (period_end ? [period_end] : []))
      .sort()
      .at(-1) ?? ""
  );
}

function startingContext(template: Context, prior?: PriorInputs): Context {
  const source = prior?.context ?? template;
  // The run's currency is the one CP-1's statements print, so a value the template or an earlier
  // run holds is neither shown nor sent (docs/rulings/2026-11-16-reporting-currency-from-sources.md).
  const heldRun = { ...source.run };
  delete heldRun.reporting_currency;
  const pathway = Object.hasOwn(PATHWAYS, source.run.pathway)
    ? source.run.pathway
    : "credit_snapshot";
  return {
    ...source,
    run: {
      ...heldRun,
      // The case date is the analyst's to enter: every entry path opens without one.
      as_of: "",
      pathway,
      ...(pathway === "earnings_update"
        ? { run_type: "earnings" }
        : source.run.run_type === "earnings"
          ? { run_type: "research" }
          : {}),
    },
    identity: {
      ...source.identity,
      issuer_name: prior?.issuer_name ?? source.identity.issuer_name,
      issuer_id: prior?.issuer_id ?? source.identity.issuer_id,
    },
  };
}

/** The Legal documents choice an earlier run recorded, when the page still offers it. */
function carriedLegal(prior?: PriorInputs) {
  const recorded = prior?.context?.attachments?.legal_documents ?? "none";
  return Object.hasOwn(LEGAL_CHOICES, recorded) ? recorded : "none";
}

/**
 * The page's own line when it starts from an earlier run. The run recorded an agreement choice and
 * a yes for each other file box it used, but not which file filled them: that is said, not guessed.
 */
function carriedIntro({ run, prior }: { run: string; prior: PriorInputs }) {
  const intro = `Starting from run ${run}. Review the copied answers, add dates, and inspect its available documents.`;
  const recorded = prior.context?.attachments;
  const roles = [
    ...(carriedLegal(prior) === "none" ? [] : ["agreement"]),
    ...Object.entries(ATTACHMENTS)
      .filter(([key]) => recorded?.[key as keyof typeof ATTACHMENTS] === true)
      .map(([, title]) => title.charAt(0).toLowerCase() + title.slice(1)),
  ].map((role) => `the ${role}`);
  if (!roles.length || prior.error || !prior.files.length) return intro;
  const list = new Intl.ListFormat("en", { type: "conjunction" }).format(roles);
  return `${intro} It did not record which files you chose for ${list}: choose them again on More context.`;
}

export function carriedModules(prior?: PriorInputs) {
  const available = pathwayModules(prior?.context?.run.pathway ?? "");
  const chosen = prior?.modules ?? [];
  if (!drawnModules(chosen).length || !chosen.every((code) => available.includes(code))) return [];
  // Runs recorded before the page listed the forecast kept none; the page offers no way to drop it.
  return chosen.length && available.includes(FORECAST_CODE) && !chosen.includes(FORECAST_CODE)
    ? available.filter((code) => chosen.includes(code) || code === FORECAST_CODE)
    : chosen;
}

/** How many question rows were sent before the note, which goes last (none when no note). */
function noteIndex(details: Record<string, unknown>, note: string) {
  const sent = details.research_questions;
  return note.trim() && Array.isArray(sent) ? sent.length - 1 : Infinity;
}
