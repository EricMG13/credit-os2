export type Mode = "synthetic" | "live";

export type Context = {
  [key: string]: unknown;
  run: {
    as_of: string;
    run_type?: string;
    cutoff?: string;
    pathway: string;
    case_kind: string;
    reporting_currency?: string;
    current_period?: string;
    prior_period?: string;
  };
  identity: {
    issuer_name: string;
    issuer_id: string;
    issue_classification?: string;
    borrower_name?: string;
    parent_name?: string;
    guarantors?: string[];
    aliases?: string[];
    listed_equity?: boolean;
    ticker?: string;
    sector?: string;
    country?: string;
    sponsor?: string;
  };
  attachments?: {
    legal_documents: string;
    management_bridge: boolean;
    portfolio_workbook: boolean;
    prior_case: boolean;
  };
};

export type DocumentRecord = {
  source: string;
  kind: string;
  period_end?: string;
  executed?: boolean;
  signal?: string;
};
type Ignored = { source: string; reason: string } | string;
export type Reading = { error: string; documents: DocumentRecord[]; ignored: Ignored[] };
export type Answers = {
  context: Context;
  modules: string[];
  max_turns: number;
  level: string;
  model: string;
  effort: string;
  submitted_by: string;
  newest_document_date?: string;
};
export type PriorInputs = {
  issuer_id: string;
  issuer_name: string;
  context: Context | null;
  files: { name: string; size: number }[];
  level: string;
  modules: string[];
  max_turns: number;
  error?: string;
};
export type ReadinessItem = {
  id: string;
  scope: string;
  outcome: string;
  reason: string;
  fix?: string;
  counted?: boolean;
  inherited_from?: string[];
};
export type Summary = Reading & {
  digest: string;
  cap: string;
  modules: string[];
  items: ReadinessItem[];
  omitted: string[];
  /** The reader-facing title of each id in `omitted`; absent from an older service. */
  omitted_titles?: string[];
  changes: string;
  lookup?: string[];
  web_search?: boolean;
  /** The research module will have the lookup tools; absent from an older service. */
  web_lookup?: boolean;
  /** Reader-facing native Copilot search status; absent on older services. */
  copilot_search?: string;
  /** Seat support for the exact reviewed pair. */
  copilot_verified?: boolean;
  prior?: { id: string; as_of: string; pathway: string } | null;
  model: string;
  effort: string;
};

// Held to `deploy_workflow.inbox.runs.Status` and `deploy_workflow.run_events.ModuleState` by
// tests/test_react_frontend.py: the service sends these words and no others.
export type RunStatus =
  "queued" | "running" | "finished" | "failed" | "capped" | "rejected" | "interrupted";
/** A module's (or the Report's) state; "stopped": the run stopped while it ran. */
export type ConnectedModuleState = "waiting" | "running" | "done" | "stopped";
export type RunEvent = {
  at: string;
  kind:
    | "module_started"
    | "module_accepted"
    | "draft_rejected"
    | "delivery_started"
    | "delivered"
    | "stopped"
    | "changes_not_produced"
    | "model_not_published";
  module?: string;
};
export type ConnectedRun = {
  id: string;
  status: RunStatus;
  reason: string;
  issuer_name: string;
  as_of: string;
  pathway: string;
  modules: [string, ConnectedModuleState][];
  stalled?: boolean;
  started_at?: string;
  ended_at?: string;
  submitted_by?: string;
  claimed_at?: string;
  observed_at: string;
  execution?: "host-session" | "retained-response-replay" | "synthetic" | "live-provider" | null;
  cap: string | null;
  spent: string | null;
  settled_spent?: string | null;
  held?: string | null;
  /** Why the service holds this run (Run activity's `held` note): sent while it is queued, or
   * kept "running" after its log ended (a library that could not be rebuilt); else "". Absent
   * from an older service. */
  held_reason?: string;
  /** The recorded cause of the engine's last stop; absent from an older service. */
  stopped_by?: string;
  /** Exact non-ready items in the approved summary; null/absent for historical records. */
  approved_summary_limits?: ReadinessItem[] | null;
  /** Existing accepted-response records, not a claim about paid calls or analytical completion. */
  module_outputs?:
    | {
        module: string;
        assessment: "not-assessable" | "readable" | null;
        provenance: "retained-response" | "new-response" | null;
        response_sha256: string | null;
      }[]
    | null;
  /** Membership in the current admitted publication; no admission timestamp is inferred. */
  library_admission?: "listed" | "not-listed" | null;
  events: RunEvent[] | null;
};

export type LiveRun = Pick<
  ConnectedRun,
  "id" | "issuer_name" | "pathway" | "reason" | "modules"
> & {
  status: "running" | "queued";
  submitted_by: string;
  started_at: string;
  name_differs: boolean;
  stalled: boolean;
  /** How many source files the run lists; their names are audit material and are not sent. */
  files: number;
};
/** A run that stopped without a report; its spend, folder and file names are not sent. */
export type EndedRun = Pick<ConnectedRun, "id" | "issuer_name" | "pathway" | "reason"> & {
  status: "failed" | "capped" | "rejected" | "interrupted";
  ended_at: string;
  submitted_by: string;
};
export type Activity = {
  updated: string;
  held: string;
  runs: LiveRun[];
  ended?: EndedRun[];
  /** All runs that ended without a report; `ended` holds only the latest. */
  ended_total?: number;
  /** Run records the service could not read; they are not in `runs` or `ended`. */
  unreadable?: number;
};

type ReportEntry = {
  id: string;
  issuer: string;
  asOf: string;
  pathway: string;
  /** Designated published outputs explicitly marked not assessable; absent in older replies. */
  not_assessable?: string[];
};
export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit, allowWarning = false): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const body: unknown = await response.json().catch(() => null);
  if (
    body !== null &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error &&
    (!allowWarning || !response.ok)
  ) {
    throw new RequestError(body.error, response.status);
  }
  if (!response.ok || body === null) {
    throw new RequestError(
      `The service could not complete this request (${String(response.status)}).`,
      response.status,
    );
  }
  return body as T;
}

function postJson(payload: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

const submission = (id: string) => `/api/submissions/${encodeURIComponent(id)}`;

export async function getContext(signal: AbortSignal) {
  const {
    submission_caps_usd: amounts,
    copilot_models: copilotModels,
    ...template
  } = await request<
    Context & {
      submission_caps_usd?: Record<string, string>;
      copilot_models?: Record<string, string[]>;
    }
  >("/connected/context", { signal });
  const caps = Object.fromEntries(
    Object.entries(amounts ?? {}).filter(
      ([pathway, amount]) =>
        Object.hasOwn(PATHWAYS, pathway) &&
        typeof amount === "string" &&
        /^\d+(?:\.\d+)?$/.test(amount) &&
        Number.isFinite(Number(amount)) &&
        Number(amount) > 0,
    ),
  );
  return { template, copilotModels, caps };
}
export const createSubmission = () =>
  request<{ id: string }>("/api/submissions", { method: "POST" });
const filePath = (id: string, name: string) =>
  `${submission(id)}/files?name=${encodeURIComponent(name)}`;
export const upload = (id: string, file: File, name = file.name) =>
  request<{ name: string }>(filePath(id, name), {
    method: "POST",
    body: file,
  });
export const removeDocument = (id: string, name: string) =>
  request<{ name: string }>(filePath(id, name), { method: "DELETE" });
export const getPriorInputs = (run: string) =>
  request<PriorInputs>(`/api/runs/${encodeURIComponent(run)}/inputs`, undefined, true);
export const getLatestIssuerRun = (issuer: string) =>
  request<{ latest_run: string; runs: number; latest_as_of: string; issuer_name?: string }>(
    `/api/issuers/${encodeURIComponent(issuer)}`,
  );
export const carryDocuments = (id: string, run: string) =>
  request<{ carried: string[]; kept: string[] }>(`${submission(id)}/carry`, postJson({ run }));
export const getReading = (id: string) => request<Reading>(`${submission(id)}/reading`);
function postShownCap(payload: unknown, shownCap: string): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shown-Cap": shownCap },
    body: JSON.stringify(payload),
  };
}
export const getSummary = (id: string, answers: Answers, shownCap: string) =>
  request<Summary>(`${submission(id)}/summary`, postShownCap(answers, shownCap));
export const submit = (id: string, answers: Answers, digest: string, shownCap: string) =>
  request<{ run: string }>(`${submission(id)}/submit`, postShownCap({ answers, digest }, shownCap));
export const getActivity = (signal: AbortSignal) =>
  request<Activity>("/connected/activity", { signal });
export const getRun = (id: string, signal: AbortSignal) =>
  request<ConnectedRun>(`/connected/activity/${encodeURIComponent(id)}`, { signal });
export const getReport = (id: string, signal: AbortSignal) =>
  request<ReportEntry>(`/connected/report/${encodeURIComponent(id)}`, { signal });

export function issuerSlug(name: string) {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{Mark}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export const PATHWAYS: Readonly<Record<string, { label: string; modules: string[] }>> = {
  lite_credit_assessment: {
    label: "Lite credit assessment",
    // Owner, 2026-11-25: every credit assessment runs all of layer 1 (CP-1, 1A, 1B, 1C, 1D), and
    // Lite runs CP-DR too, so CP-1C has its public peers.
    modules: ["CP-0", "CP-1", "CP-1A", "CP-1B", "CP-DR", "CP-1C", "CP-1D", "CP-2", "CP-2A"],
  },
  credit_snapshot: {
    label: "Full credit assessment",
    modules: [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1A",
      "CP-1B",
      "CP-DR",
      "CP-1C",
      "CP-1D",
      "CP-2",
      "CP-2A",
      "CP-2D",
      "CP-2E",
      "CP-2G",
      "CP-4",
      "CP-3C",
      "CP-3",
      "CP-5",
      "CP-6",
    ],
  },
  deep_credit_assessment: {
    label: "Deep credit assessment",
    modules: [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1A",
      "CP-1B",
      "CP-DR",
      "CP-1C",
      "CP-1D",
      "CP-2",
      "CP-4",
      "CP-2A",
      "CP-2E",
      "CP-2D",
      "CP-2G",
      "CP-2H",
      "CP-3D",
      "CP-3C",
      "CP-4C",
      "CP-3",
      "CP-5",
      "CP-6",
    ],
  },
  earnings_update: {
    label: "Earnings Update",
    // Owner, 2026-11-16: CP-1A joins (docs/rulings/2026-11-16-earnings-update-cp1a.md).
    modules: ["CP-0", "CP-1", "CP-MODEL", "CP-1A", "CP-1B", "CP-1D", "CP-DR", "CP-2E", "CP-5"],
  },
  relative_value: {
    label: "Relative Value",
    modules: [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1C",
      "CP-DR",
      "CP-2",
      "CP-2D",
      "CP-2E",
      "CP-3",
      "CP-3C",
      "CP-3D",
      "CP-5",
    ],
  },
  covenant_refinancing: {
    label: "Covenant & Refinancing",
    modules: [
      "CP-0",
      "CP-1",
      "CP-MODEL",
      "CP-1A",
      "CP-DR",
      "CP-2",
      "CP-2A",
      "CP-2D",
      "CP-2E",
      "CP-2G",
      "CP-4",
      "CP-3C",
      "CP-5",
    ],
  },
  distressed_restructuring: {
    label: "Distressed & Restructuring",
    modules: [
      "CP-0",
      "CP-1",
      "CP-1A",
      "CP-1C",
      "CP-DR",
      "CP-2",
      "CP-2A",
      "CP-2E",
      "CP-2G",
      "CP-2H",
      "CP-4",
      "CP-4C",
      "CP-5",
    ],
  },
  portfolio_decision: {
    label: "Portfolio Decision",
    modules: ["CP-0", "CP-1", "CP-MODEL", "CP-DR", "CP-2", "CP-2E", "CP-3", "CP-5", "CP-6"],
  },
};
/** `CP-MODEL` publishes the forecast and makes no model call: it is sent, never drawn as a module. */
export const FORECAST_CODE = "CP-MODEL";

/** The modules a pathway draws and counts: its list without the forecast. */
export function drawnModules(modules: readonly string[]) {
  return modules.filter((code) => code !== FORECAST_CODE);
}

export function pathwayModules(pathway: string) {
  return Object.hasOwn(PATHWAYS, pathway) ? (PATHWAYS[pathway]?.modules ?? []) : [];
}

const MODULE_NAMES: Readonly<Record<string, string>> = {
  "CP-0": "Source readiness",
  "CP-1": "Financial foundation",
  "CP-1A": "Business & governance",
  "CP-DR": "Research questions",
  "CP-4": "Legal & covenants",
  "CP-2": "Fundamental credit",
  "CP-2A": "Downside",
  "CP-2E": "Rates, FX & hedging",
  "CP-2G": "Forward credit model",
  "CP-3": "Security selection",
  "CP-5": "Evidence validation",
  "CP-6": "Committee decision",
  "CP-8": "Changes since the last run",
  "CP-1B": "Earnings changes",
  "CP-1C": "Peer benchmark",
  "CP-1D": "Earnings quality",
  "CP-2D": "Liquidity",
  "CP-2H": "Ratings & triggers",
  "CP-3C": "Refinancing & LME",
  "CP-3D": "Market-implied risk",
  "CP-4C": "Recovery & fulcrum",
  "CP-L10": "Short credit snapshot",
  "CP-MODEL": "Cash flow model",
};

/** What a reader sees for a methodology module the page has no name for: never its code. */
export const UNNAMED_MODULE = "Unnamed module";

/**
 * The methodology's module ids and aliases that have no reader name here
 * (src/deploy_vii/methodology.json); with `MODULE_NAMES` they are every module code there is.
 */
const UNNAMED_CODES: ReadonlySet<string> = new Set([
  ...["CP-MEMO", "CP-OS", "CP-PARSE", "CP-1E", "CP-2B", "CP-2C", "CP-2F", "CP-3A", "CP-3B"],
  ...["CP-4A", "CP-4B", "CP-4D", "CP-5A", "CP-6A", "CP-L20", "CP-L23", "CP-L30", "CP-L40"],
]);

/**
 * A methodology module code's reader name, the unnamed wording for one that has none, or null for
 * anything that is not a methodology code (an issuer's "CP-10", commercial paper's "CP-BACKSTOP").
 */
export function moduleCodeName(code: string): string | null {
  if (Object.hasOwn(MODULE_NAMES, code)) return MODULE_NAMES[code] ?? null;
  return UNNAMED_CODES.has(code) ? UNNAMED_MODULE : null;
}

/**
 * The reader's name for a module id held in a module field (never for free text: `serviceText`).
 * A code is never returned: an id shaped as one that the page cannot name reads as unnamed. So does
 * an empty id. An id that is no code ("Report") stays as written.
 */
export function moduleName(id: string) {
  return moduleCodeName(id) ?? (/^(?:CP-[A-Z0-9]+|\s*)$/.test(id) ? UNNAMED_MODULE : id);
}

/**
 * Replaces each whole, exact methodology module code in written text with the module's name. Any
 * other "CP-…" word (commercial paper's "CP-backed", a case named "CP-10") is the writer's own and
 * stays as written.
 */
export function serviceText(text: string) {
  return text.replace(/(?<![\w-])CP-[A-Z0-9]+(?![\w-])/g, (code) => moduleCodeName(code) ?? code);
}

/** The changes line without the launcher's "changes:" label or the service's `(not used: <run>: <why>)` note, which names a run id. */
export function changesSentence(changes: string) {
  const text = serviceText(changes.replace(/^\s*changes:\s+/i, ""));
  const kept = text.replace(/\s*\(not used:[\s\S]*$/, "");
  return kept === text
    ? text
    : `${kept.replace(/\.$/, "")}. An earlier run exists but could not be used for comparison.`;
}

export function pathwayName(pathway: string) {
  if (Object.hasOwn(PATHWAYS, pathway)) return PATHWAYS[pathway]?.label ?? pathway;
  return pathway === "short_snapshot" ? "Short credit snapshot" : pathway.replaceAll("_", " ");
}

export function isPendingReport(error: unknown) {
  return error instanceof RequestError && error.status === 404;
}
