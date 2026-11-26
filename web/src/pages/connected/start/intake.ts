import {
  getLatestIssuerRun,
  getPriorInputs,
  PATHWAYS,
  pathwayModules,
  issuerSlug,
  RequestError,
  drawnModules,
  FORECAST_CODE,
  type Answers,
  type Context,
  type DocumentRecord,
  type PriorInputs,
  type ReadinessItem,
  type Reading,
  type Summary,
} from "../api";
import type { ComparisonView } from "./referencePortfolio";
import type { StandingView } from "./standingPortfoliosModel";
import { readAssumptions, type AssumptionsForm } from "./assumptions";
import { CONTEXT_ROW_KINDS, type Row, type RowKind } from "./rows";
import {
  readModuleOptions,
  readValuation,
  type ModuleOptionsForm,
  type ValuationForm,
} from "./valuation";
import { decided, groupLimits, needsCheck, type LimitGroup } from "./limits";
import {
  ATTACHMENTS,
  documentDescription,
  LEGAL_CHOICES,
  nameKey,
  PURPOSE_STEP,
  storedName,
} from "./plain";
import { asSentence, errorText, isUnreachable } from "../useResource";
import type { FieldKey, FieldProblem } from "./fields";

export const FORM_STEPS = {
  documents: { title: "Documents", next: "Continue to purpose", previous: null },
  purpose: { title: PURPOSE_STEP, next: "Continue to context", previous: "documents" },
  context: { title: "More context", next: "Review run", previous: "purpose" },
} as const;

export type FormStep = keyof typeof FORM_STEPS;

export const STEPPER_STEPS = [
  { key: "documents", title: "Documents", note: "Add files" },
  { key: "purpose", title: PURPOSE_STEP, note: "Choose one" },
  { key: "context", title: "More context", note: "Optional" },
  { key: "start", title: "Review and start", note: "Paid run" },
] as const;

export const STEP_TOTAL = STEPPER_STEPS.length;

export const FORM_STEP_KEYS = Object.keys(FORM_STEPS) as FormStep[];

/** Where the analyst is: one of the three form steps, or the review sheet after them. */
export type Place = FormStep | "review";

const PLACES: readonly Place[] = [...FORM_STEP_KEYS, "review"];

export const STEP_GUIDANCE: Record<FormStep, string> = {
  documents:
    "Add annual and interim reports, the credit agreement and any other material the analysis should read.",
  purpose: "The purpose determines which modules run.",
  context: "Optional. You can continue if the documents provide all the context.",
};

export const EARNINGS_CONTEXT_GUIDANCE =
  "Current period and Prior period are required for Earnings Update. Everything else here is optional: you can continue if the documents provide all the context.";

export const FILE_SIZE_LIMIT = 50 * 1024 * 1024;

export const SOURCE_TYPES = /\.(?:pdf|htm|html|docx|txt|md|xlsx|csv|json|jsonl)$/i;

export const SOURCE_TYPE_HINT = "PDF, HTML, DOCX, TXT, Markdown, XLSX, CSV, JSON and JSONL";

export const SYNTHETIC_LIMITS =
  "A no-cost test can complete only a first Full credit assessment, with no earlier run to compare. Use northbridge-filing.txt and, optionally, northbridge-portfolio.xlsx and northbridge-credit-agreement.txt; no other files are accepted.";

export type Review = {
  id: string;
  answers: Answers;
  summary: Summary;
  cap: string;
  attachmentNames: Partial<Record<Attachment, string>>;
};

export type Draft = { id: string; uploaded: Map<File, string>; copied: boolean };

export type Reviewed = {
  pathway: string;
  issuerId: string;
  items: ReadinessItem[];
  accepted: Set<string>;
};

export function capForPathway(caps: Record<string, string>, pathway: string) {
  const cap = caps[pathway];
  if (!cap) throw new Error("The cap for this pathway is unavailable. Reload the form.");
  return cap;
}

export function requireSummaryCap(summary: Summary, shownCap: string) {
  if (summary.cap !== shownCap)
    throw new Error("The pathway cap changed while preparing this summary. Review the run again.");
}

/** The row editors of the Context step: each carries a `data-field` a refusal can name. */
export const isFieldRow = (kind: RowKind): kind is (typeof CONTEXT_ROW_KINDS)[number] =>
  (CONTEXT_ROW_KINDS as readonly RowKind[]).includes(kind);

export type Forms = {
  valuation?: ValuationForm;
  module_options?: ModuleOptionsForm;
  assumptions?: AssumptionsForm;
};

type LatestIssuerInputs = { run: string; prior: PriorInputs };

/** The ID the review settled for a typed name, and the issuer that holds the name's usual ID. */
export type SettledSlug = { name: string; id: string; holder?: string };

/**
 * The name an ID is filed under (the latest run's), or undefined when no run holds it or the
 * lookup failed: the service refuses an ID filed under another issuer at the summary and at Submit,
 * so a failed lookup cannot merge two issuers.
 */
export async function holderOf(issuerId: string): Promise<string | undefined> {
  try {
    const latest: { latest_run: string; issuer_name?: string } = await getLatestIssuerRun(issuerId);
    return latest.latest_run ? (latest.issuer_name ?? "") : undefined;
  } catch {
    return undefined;
  }
}

export async function latestIssuerInputs(issuer: string): Promise<LatestIssuerInputs | null> {
  const latest = await getLatestIssuerRun(issuer);
  if (!latest.latest_run) return null;
  return { run: latest.latest_run, prior: await getPriorInputs(latest.latest_run) };
}

export type Attachment = keyof typeof ATTACHMENTS | "agreement";

export type DocumentRow = {
  name: string;
  stored?: string;
  file?: File;
  pendingCopy?: boolean;
  copied?: boolean;
  /** The upload with this earlier file's bytes: the carry did not copy the earlier file. */
  sameAs?: string;
};

/**
 * The last summary the form received, kept after the analyst leaves the review so every step can
 * draw what the service said then. It is drawn only for the same pathway and Issuer ID, and is
 * presentation only: nothing sent depends on it.
 */
export type LastReview = {
  pathway: string;
  issuerId: string;
  modules: readonly string[];
  items: readonly ReadinessItem[];
};

/** The last review's limit groups for the pathway and Issuer ID now shown; undefined when none. */
export function missingAtLastReview(
  last: LastReview | undefined,
  pathway: string,
  issuerId: string,
): LimitGroup[] | undefined {
  if (!last || last.pathway !== pathway || last.issuerId !== issuerId) return undefined;
  return groupLimits(last.items).groups;
}

export type IntakeView = {
  step: FormStep;
  /**
   * What the last review of this pathway and Issuer ID said would limit the run, as decision
   * groups (`groupLimits`); undefined before any such review. Drawn on Documents as what is
   * missing for the modules.
   */
  missing?: readonly LimitGroup[];
  /** Files refused when chosen (type, size, a name already chosen), said at the drop zone. */
  selectionProblem: string;
  /** The last review's modules and items for this pathway and Issuer ID; undefined when none. */
  checked?: Pick<LastReview, "modules" | "items">;
  busy?: "review" | "submit" | "documents" | "copy";
  canRead: boolean;
  copy?: { run: string; prior: PriorInputs };
  priorNote: string;
  issuerNotice: string;
  changeNotice: string;
  repeatedContent: ReadonlyMap<File, string>;
  copilotModels?: Record<string, string[]>;
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
  caps: Record<string, string>;
  synthetic: boolean;
  addFiles: (selected: Iterable<File> | null) => void;
  /** The optional comparison portfolio: not a document of the run, and not in the answers. */
  comparison: ComparisonView;
  /** The standing reference portfolios: kept by the service, never part of a run's requests. */
  standing: StandingView;
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
  /** The controls the browser found invalid when the step was sent, in order, with their words. */
  markInvalid: (marks: readonly (readonly [FieldKey, string])[]) => void;
  changeModel: (value: string) => void;
  changeEffort: (value: string) => void;
  changeTurns: (value: string) => void;
  toggleModule: (code: string, checked: boolean) => void;
};

export function intakeDocuments(
  reading: Reading | undefined,
  files: File[],
  uploaded: Map<File, string>,
  copy: { prior: PriorInputs } | undefined,
  ignoredCopies: string[],
  copied: boolean,
  sameContent: Record<string, string> = {},
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
  // The carry keeps an upload whose folded name matches an earlier file, so that file is not the
  // draft's. Before the carry a selected file counts too: it is uploaded before the carry runs.
  const localKeys = new Set(
    [...uploaded.values(), ...(copied ? [] : files.map(storedForm))].map(nameKey),
  );
  const documentRows: DocumentRow[] = [
    ...files.map((file) => ({ name: fileName(file), stored: uploaded.get(file), file })),
    ...[...new Set([...inspected.keys(), ...ignored.keys()])]
      .filter((name) => !localNames.has(name))
      .map((name) => ({ name, stored: name, file: undefined })),
    // A file the reading already names is drawn from the reading; every other earlier file is the
    // draft's (or will be), whatever the reading or the copy state (a refused reading lists only
    // the refused file; a carry that ran without being marked lists all).
    ...(!copy?.prior.error
      ? (copy?.prior.files ?? [])
          .filter(
            ({ name }) =>
              !ignoredCopies.includes(name) &&
              !localKeys.has(nameKey(name)) &&
              !inspected.has(name) &&
              !ignored.has(name),
          )
          .map(({ name }) =>
            name in sameContent
              ? { name, copied, sameAs: sameContent[name] }
              : { name, pendingCopy: !copied, copied },
          )
      : []),
  ];
  const fileChoices: Record<string, string> = Object.fromEntries([
    ["", "None"] as const,
    ...Array.from(inspected.keys(), (name) => [name, name] as const),
  ]);
  return { shownDocs, inspected, ignored, documentRows, fileChoices };
}

export type ReadinessRow = { label: string; met: boolean; detail?: string };

export function readinessRows(
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
export function accessibleText(node: HTMLElement) {
  return node.getAttribute("aria-label") ?? node.textContent.trim();
}

export function shownCapText(cap: number | null) {
  return cap === null || !Number.isFinite(cap) ? null : `USD ${cap.toFixed(2)}`;
}

export function intakeRunDetails({
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
export function placeOf(state: unknown): Place | undefined {
  if (typeof state !== "object" || state === null || !("startRun" in state)) return undefined;
  return PLACES.find((place) => place === state.startRun);
}

export function documentsRead(inspected: number, ignored: number) {
  const noun = inspected === 1 ? "document" : "documents";
  return `${String(inspected)} ${noun} inspected, ${String(ignored)} ignored.`;
}

/** One file's bytes, read on their own so no two reads overlap. */
async function documentBytes(file: File) {
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
  return new Uint8Array(bytes);
}

function sameBytes(left: Uint8Array, right: Uint8Array) {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

/**
 * Compare equal-size candidates one pair at a time (two files in memory at once, no Web Crypto,
 * which a page served over plain http does not have), stopping when a newer selection replaces them.
 */
export async function repeatedDocuments(files: readonly File[], current: () => boolean) {
  const counts = new Map<number, number>();
  for (const file of files) counts.set(file.size, (counts.get(file.size) ?? 0) + 1);
  const repeated = new Map<File, string>();
  const kept: File[] = [];
  for (const file of files) {
    if (!current()) return repeated;
    if ((counts.get(file.size) ?? 0) < 2) continue;
    let content: Uint8Array | undefined;
    for (const earlier of kept) {
      if (earlier.size !== file.size) continue;
      content ??= await documentBytes(file);
      if (!current()) return repeated;
      if (sameBytes(content, await documentBytes(earlier))) {
        repeated.set(
          file,
          `Same content as ${fileName(earlier)}. Remove one copy before inspection.`,
        );
        break;
      }
    }
    if (!repeated.has(file)) kept.push(file);
  }
  return repeated;
}

/**
 * The name the service stores an upload under, per path part: a mirror of `filing.safe_name`
 * (the source of truth: control characters and `\ / : * ? " < > |` become a space, runs of white
 * space collapse, trailing dots and spaces go). The 80-character limit is not mirrored.
 */
export function storedForm(file: File) {
  return fileName(file)
    .split(/[/\\]/u)
    .map((part) =>
      part
        .replace(/[\p{Cc}:*?"<>|]/gu, " ")
        .split(/\s+/u)
        .filter(Boolean)
        .join(" ")
        .replace(/[. ]+$/u, ""),
    )
    .join("/");
}

export function fileName(file: File) {
  return (file.webkitRelativePath || "").split("/").slice(1).join("/") || file.name;
}

export function isRecord(item: unknown): item is Row {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

export function issuerFieldsEdited(
  identity: Context["identity"],
  customSlug: string | undefined,
  prior: PriorInputs | undefined,
  initial: Context["identity"],
) {
  return (
    (customSlug !== undefined && customSlug !== (prior?.issuer_id ?? initial.issuer_id)) ||
    identity.issue_classification !==
      (prior?.context?.identity.issue_classification ?? initial.issue_classification) ||
    identity.issuer_name !== (prior?.issuer_name ?? initial.issuer_name)
  );
}

export function reviewIssuerNote(review: Review | undefined, settledSlug: SettledSlug | undefined) {
  return review &&
    settledSlug?.holder &&
    review.answers.context.identity.issuer_id === settledSlug.id
    ? `Issuer ID ${settledSlug.id} was used for this run because ${issuerSlug(settledSlug.name)} is filed under the name "${settledSlug.holder}". If that is this issuer under another name, type that name.`
    : "";
}

export function contextFormValues(forms: Forms, context: Context) {
  return {
    valuation: forms.valuation ?? readValuation(context.valuation),
    moduleOptions: forms.module_options ?? readModuleOptions(context.module_options),
    assumptions: forms.assumptions ?? readAssumptions(context.assumptions),
  };
}

export function draftErrorText(failure: unknown) {
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
export function lostSubmitText(failure: unknown) {
  const lead = isUnreachable(failure)
    ? "The page lost contact with the service, so it cannot tell whether the run started."
    : `${asSentence(errorText(failure))} The run may or may not have started.`;
  return `${lead} Submitting again is safe. The service starts one run for this approval and returns that run if it already exists.`;
}

function newestPeriod(reading?: Reading) {
  return (
    (reading?.documents ?? [])
      .flatMap(({ period_end }) => (period_end ? [period_end] : []))
      .sort()
      .at(-1) ?? ""
  );
}

export function startingContext(template: Context, prior?: PriorInputs): Context {
  const source = prior?.context ?? template;
  const safeSource = { ...source };
  delete safeSource.copilot_models;
  // The run's currency is the one CP-1's statements print, so a value the template or an earlier
  // run holds is neither shown nor sent (docs/rulings/2026-11-16-reporting-currency-from-sources.md).
  const heldRun = { ...safeSource.run };
  delete heldRun.reporting_currency;
  const pathway = Object.hasOwn(PATHWAYS, safeSource.run.pathway)
    ? safeSource.run.pathway
    : "credit_snapshot";
  return {
    ...safeSource,
    run: {
      ...heldRun,
      // The case date is the analyst's to enter: every entry path opens without one.
      as_of: "",
      pathway,
      ...(pathway === "earnings_update"
        ? { run_type: "earnings" }
        : safeSource.run.run_type === "earnings"
          ? { run_type: "research" }
          : {}),
    },
    identity: {
      ...safeSource.identity,
      issuer_name: prior?.issuer_name ?? safeSource.identity.issuer_name,
      issuer_id: prior?.issuer_id ?? safeSource.identity.issuer_id,
    },
  };
}

/** The Legal documents choice an earlier run recorded, when the page still offers it. */
export function carriedLegal(prior?: PriorInputs) {
  const recorded = prior?.context?.attachments?.legal_documents ?? "none";
  return Object.hasOwn(LEGAL_CHOICES, recorded) ? recorded : "none";
}

/**
 * The page's own line when it starts from an earlier run. The run recorded an agreement choice and
 * a yes for each other file box it used, but not which file filled them: that is said, not guessed.
 */
export function carriedIntro(prior: PriorInputs) {
  const intro =
    "Using an earlier run as a starting point. Review the answers, enter the new dates, and inspect any documents available to reuse.";
  const recorded = prior.context?.attachments;
  const roles = [
    ...(carriedLegal(prior) === "none" ? [] : ["agreement"]),
    ...Object.entries(ATTACHMENTS)
      .filter(([key]) => recorded?.[key as keyof typeof ATTACHMENTS] === true)
      .map(([, title]) => title.charAt(0).toLowerCase() + title.slice(1)),
  ].map((role) => `the ${role}`);
  if (!roles.length || prior.error || !prior.files.length) return intro;
  const list = new Intl.ListFormat("en", { type: "conjunction" }).format(roles);
  return `${intro} The earlier run didn’t record the files chosen for ${list}. Choose them again in More context.`;
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
export function noteIndex(details: Record<string, unknown>, note: string) {
  const sent = details.research_questions;
  return note.trim() && Array.isArray(sent) ? sent.length - 1 : Infinity;
}
