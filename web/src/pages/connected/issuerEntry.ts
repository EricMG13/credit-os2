import {
  containsReference,
  methodNote,
  readParagraph,
  type CatalogueRun,
  type LibraryIndex,
  type LibraryRun,
  type PublishedLead,
} from "./publishedReport";
import { plainText } from "./richText";

/** Coordinate identity for the lead projected from the verified publication. */
export function leadIdentity(run?: LibraryRun): PublishedLead | undefined {
  // Relative Value can carry an instrument preference in prose without a settled action.
  const lead =
    run?.publicationVerified === true && run.pathway !== "relative_value" ? run.lead : null;
  if (
    !lead ||
    !Number.isSafeInteger(lead.line) ||
    lead.line < 1 ||
    !/^[a-f0-9]{64}$/.test(lead.sha256) ||
    !lead.output ||
    ["CP-3", "CP-6", "CP-8"].includes(lead.module)
  )
    return undefined;
  return lead;
}

/** Only reader-visible prose can qualify the run as an issuer assessment. */
export function publishedLead(run?: LibraryRun): PublishedLead | undefined {
  const lead = leadIdentity(run);
  if (!lead) return undefined;
  const body = plainText(issuerPassageBody(lead.text));
  return body.trim() && !methodNote(body) && !containsReference(body) ? lead : undefined;
}

export function issuerPassageBody(text: string) {
  return readParagraph(text).body.replaceAll(
    /; the specific evidence restrictions are recorded in the gaps ledger\./gi,
    ".",
  );
}

export function scopeLabel(run: LibraryRun) {
  if (run.publicationVerified === true) {
    if (run.assessmentScope === "standard") return "Standard pathway scope";
    if (run.assessmentScope === "partial") return "Partial assessment";
  }
  return "Assessment scope unverified";
}

type IssuerRun = { catalogue: CatalogueRun; run?: LibraryRun };

export function issuerGroups(index: LibraryIndex) {
  const runs = new Map<string, LibraryRun | undefined>();
  for (const run of Object.values(index.workspace.runs)) {
    runs.set(run.folder, runs.has(run.folder) ? undefined : run);
  }
  const groups = new Map<string, IssuerRun[]>();
  const catalogueCounts = new Map<string, number>();
  for (const { id } of index.catalogue.real) {
    catalogueCounts.set(id, (catalogueCounts.get(id) ?? 0) + 1);
  }
  for (const catalogue of index.catalogue.real) {
    if (catalogueCounts.get(catalogue.id) !== 1) continue;
    const run = runs.get(catalogue.id);
    const key = run?.issuerKey ? `issuer:${run.issuerKey}` : `folder:${catalogue.id}`;
    const entries = groups.get(key) ?? [];
    entries.push({ catalogue, run });
    groups.set(key, entries);
  }
  return groups;
}

export function reportDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith("0000")) return "";
  const at = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(at.getTime()) && at.toISOString().slice(0, 10) === date ? date : "";
}

function publicationTime(run?: LibraryRun) {
  const value = run?.publicationVerified === true ? run.publishedAt : null;
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|\+00:00)$/.test(
      value,
    ) ||
    !reportDate(value.slice(0, 10))
  )
    return "";
  // The endpoint supplies UTC. Preserve sub-millisecond precision and normalize trailing zeros.
  const whole = value.slice(0, 19);
  const fraction = /\.([0-9]+)/.exec(value)?.[1] ?? "";
  return Number.isFinite(Date.parse(value)) ? `${whole}.${fraction.padEnd(6, "0")}` : "";
}

function ordered(entries: IssuerRun[]) {
  const withoutTimes = new Set(
    entries
      .filter(({ run }) => !publicationTime(run))
      .map(({ catalogue }) => reportDate(catalogue.date)),
  );
  return [...entries].sort((a, b) => {
    const date = reportDate(a.catalogue.date);
    return (
      reportDate(b.catalogue.date).localeCompare(date) ||
      (withoutTimes.has(date) ? 0 : publicationTime(b.run).localeCompare(publicationTime(a.run))) ||
      a.catalogue.id.localeCompare(b.catalogue.id)
    );
  });
}

function standardView(run?: LibraryRun) {
  return run?.assessmentScope === "standard" && Boolean(publishedLead(run));
}

/**
 * A custom run is an issuer assessment only when its scope is standard and it delivered
 * Fundamental credit, the credit view every assessment carries (ruling C21); one without it ranks
 * as the purpose reports do.
 */
function customAssessment(run?: LibraryRun) {
  return run?.pathway === "custom" && standardView(run) && Boolean(run.delivered?.includes("CP-2"));
}

export function isIssuerAssessment(run?: LibraryRun) {
  return (
    (["credit_snapshot", "deep_credit_assessment", "lite_credit_assessment"].includes(
      run?.pathway ?? "",
    ) &&
      standardView(run)) ||
    customAssessment(run)
  );
}

/**
 * Filtered results open the selected pathway. The unfiltered entry prefers a standard assessment:
 * Full or Deep, then Lite, then a custom selection that delivered Fundamental credit (it never
 * displaces a whole assessment; ruling C21), then the latest admitted report.
 */
export function selectIssuerEntry(entries: IssuerRun[], explicitPathway: boolean) {
  const admitted = entries.filter(({ run }) => run);
  if (explicitPathway || admitted.length <= 1)
    return ordered(admitted.length ? admitted : entries)[0];
  const full = admitted.filter(
    ({ run }) =>
      (run?.pathway === "credit_snapshot" || run?.pathway === "deep_credit_assessment") &&
      standardView(run),
  );
  const lite = admitted.filter(
    ({ run }) => run?.pathway === "lite_credit_assessment" && standardView(run),
  );
  const chosen = admitted.filter(({ run }) => customAssessment(run));
  return ordered(full.length ? full : lite.length ? lite : chosen.length ? chosen : admitted)[0];
}

export function relatedIssuerReports(entries: IssuerRun[], selected: IssuerRun) {
  const date = reportDate(selected.catalogue.date);
  if (!date) return [];
  const time = publicationTime(selected.run);
  return ordered(entries.filter(({ run }) => run && run !== selected.run)).flatMap((entry) => {
    const { catalogue, run } = entry;
    const other = reportDate(catalogue.date);
    const otherTime = publicationTime(run);
    if (other > date || (other === date && time && otherTime > time))
      return [{ ...entry, timing: "Newer report" }];
    if (other === date && (!time || !otherTime || time === otherTime))
      return [{ ...entry, timing: "Same as-of date" }];
    return [];
  });
}
