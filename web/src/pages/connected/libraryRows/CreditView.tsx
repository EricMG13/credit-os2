import { useEffect, useRef, useState, type ReactNode } from "react";
import { FileSearch02 } from "@untitledui/icons";
import { TextLink } from "../../run/TextLink";
import {
  containsReference,
  evidenceHref,
  evidenceToken,
  publishedRunForFolder,
  readerText,
  reportPath,
  type LibraryRun,
} from "../publishedReport";
import { buildReportView } from "../reportView";
import { plainText, richParts } from "../richText";
import { issuerPassageBody, leadIdentity, publishedLead } from "../issuerEntry";
import type { LoadSnapshot } from "./rowSnapshot";

type CardFinding = { body: string; href: string };

/** The trace control as the row's figures draw it: one icon, the same everywhere. */
const TRACE_LINK =
  "flex size-8 flex-none items-center justify-center rounded-ds-sm border border-transparent text-text-tertiary outline-focus-ring hover:border-border-control hover:bg-action-subtle hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:size-11";

/** A finding as written, with its one sources control. */
function LinkedFinding({ body, href }: CardFinding) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="reading-copy min-w-0 text-body text-text-secondary">
        {richParts(body, readerText)}
      </p>
      <a
        href={href}
        aria-label="Sources for this credit view"
        title="Show sources"
        className={TRACE_LINK}
      >
        <FileSearch02 aria-hidden="true" className="size-4" />
      </a>
    </div>
  );
}

const cardFindings = new Map<string, Promise<CardFinding | null>>();

/** One publication of one run: a republished folder or date is a different card. */
const cardKey = (run: LibraryRun, date: string) =>
  JSON.stringify([
    run.folder,
    date,
    run.pathway,
    run.issuerKey,
    run.publishedAt ?? null,
    run.lead?.sha256 ?? null,
  ]);

/** Test seam: the cache is module state. */
export function resetCardFindings() {
  cardFindings.clear();
}

/**
 * One reading per publication while it is in flight or has a finding; no finding is asked again.
 * The row's own loader is used, so the finding and the row's next event share one request.
 */
function cachedCardFinding(run: LibraryRun, date: string, load: LoadSnapshot) {
  const key = cardKey(run, date);
  const cached = cardFindings.get(key);
  if (cached) return cached;
  const pending = specialistCardFinding(run, date, load);
  cardFindings.set(key, pending);
  const evict = () => {
    if (cardFindings.get(key) === pending) cardFindings.delete(key);
  };
  pending.then((finding) => {
    if (!finding) evict();
  }, evict);
  return pending;
}

async function specialistCardFinding(
  run: LibraryRun,
  date: string,
  load: LoadSnapshot,
): Promise<CardFinding | null> {
  const snapshot = await load(run.folder);
  if (snapshot?.reportFolder !== run.folder) return null;
  const admitted = publishedRunForFolder(snapshot.workspace.runs, run.folder);
  if (!admitted) return null;
  const [key, selected] = admitted;
  if (
    selected.asOf !== date ||
    selected.pathway !== run.pathway ||
    selected.issuerKey !== run.issuerKey
  )
    return null;
  const { reportSpecialistOverview } = await import("../export/reportExport");
  const finding = reportSpecialistOverview(buildReportView(snapshot, key, selected), selected, key)
    ?.findings[0];
  return finding
    ? {
        body: finding.body,
        href: evidenceHref(run.folder, evidenceToken({ output: finding.owner }, finding.line)),
      }
    : null;
}

/** A relative value or portfolio run's first purpose finding, read when the row comes into view. */
function SpecialistCardFinding({
  run,
  date,
  unavailable,
  load,
}: {
  run: LibraryRun;
  date: string;
  unavailable: ReactNode;
  load: LoadSnapshot;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [finding, setFinding] = useState<CardFinding | null>();
  useEffect(() => {
    const target = root.current;
    if (!target) return;
    const controller = new AbortController();
    const read = async () => {
      const result = await cachedCardFinding(run, date, load).catch(() => null);
      if (!controller.signal.aborted) setFinding(result);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
            observer?.disconnect();
            void read();
          });
    if (observer) observer.observe(target);
    else void read();
    return () => {
      observer?.disconnect();
      controller.abort();
    };
  }, [date, run, load]);
  return (
    <div ref={root} className="min-h-px">
      {finding === null ? unavailable : finding && <LinkedFinding {...finding} />}
    </div>
  );
}

/**
 * The run's published credit view with its one sources control: only the lead of a verified
 * publication, never a committee or relative value passage; a paragraph that carries a source
 * reference is left to Evidence, and the page says so. A relative value or portfolio run shows
 * its first purpose finding instead.
 */
export function CreditView({
  run,
  date,
  showUnavailableFinding,
  load,
}: {
  run: LibraryRun | undefined;
  date: string;
  showUnavailableFinding: boolean;
  load: LoadSnapshot;
}) {
  const unavailable = showUnavailableFinding ? (
    <p className="text-small text-text-secondary">
      A verified finding is unavailable for this report.
    </p>
  ) : null;
  if (
    run?.publicationVerified === true &&
    (run.pathway === "relative_value" || run.pathway === "portfolio_decision")
  )
    return (
      <SpecialistCardFinding
        key={cardKey(run, date)}
        run={run}
        date={date}
        unavailable={unavailable}
        load={load}
      />
    );
  const lead = leadIdentity(run);
  if (!run || !lead) return unavailable;
  const href = `${reportPath(run.folder)}#evidence/${encodeURIComponent(lead.output)}~${lead.sha256}-${String(lead.line)}`;
  const body = issuerPassageBody(lead.text);
  if (containsReference(plainText(body)))
    return <TextLink href={href}>Read this credit view in Evidence</TextLink>;
  if (!publishedLead(run)) return unavailable;
  return <LinkedFinding body={body} href={href} />;
}
