import { citedSourceNames } from "@/pages/connected/sourceFiles";
import { GapNote } from "@/pages/connected/report/overview/Tile";
import { GapText } from "./GapText";
import type { TreeNode, Trace } from "../slice";

export const CAPTION = "text-caption font-medium text-text-tertiary";

const MISSING_BASIS = "Basis was not recorded for this item";

/** One citation a handoff line carries: where it points and what could be read there. */
export type TraceCitation = {
  label: string;
  file: string | null;
  pages: string | null;
  quote: string | null;
  /** The citation's own note, for example that the page text could not be read. */
  reason: string | null;
  sha256: string | null;
};

/** A trace that also knows its citations: an array, empty when none were recorded; absent when unknown. */
export type SourcedTrace = Trace & { citations?: readonly TraceCitation[] };

/** The derivation without its Basis row, for a page that draws the basis line itself. */
export function withoutBasis(node: TreeNode): TreeNode {
  return {
    ...node,
    children: node.children.filter(({ label }) => label !== "Basis" && label !== MISSING_BASIS),
  };
}

/** The basis line of a trace: what the derivation recorded under "Basis", or that none was recorded. */
export function basisOf(trace: Trace) {
  for (const { label, value } of trace.derivation.children) {
    if (label === "Basis" && value) return { kind: "recorded", text: value } as const;
    if (label === MISSING_BASIS) return { kind: "missing" } as const;
  }
  return null;
}

/** The claim a trace supports, with the qualification the handoff attached to it. */
export function TraceClaim({ trace }: { trace: Trace }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className={CAPTION}>The claim</span>
        <p className="reading-copy text-body wrap-anywhere text-text-primary">{trace.statement}</p>
      </div>
      {trace.qualification === null ? null : (
        <div className="flex flex-col gap-1.5">
          <span className={CAPTION}>Qualification</span>
          <p className="reading-copy text-small wrap-anywhere text-text-secondary">
            {trace.qualification}
          </p>
        </div>
      )}
    </div>
  );
}

function Citation({ citation }: { citation: TraceCitation }) {
  return (
    <li className="flex min-w-0 flex-col gap-1.5 border-t border-border-hairline pt-3 first:border-t-0 first:pt-0">
      <span className="text-small font-medium wrap-anywhere text-text-primary">
        {citation.label}
      </span>
      {citation.file !== null && (
        <span className="font-mono text-mono wrap-anywhere text-text-tertiary">
          {citation.file}
        </span>
      )}
      {citation.pages !== null && (
        <span className="text-small text-text-secondary">{citation.pages}</span>
      )}
      {citation.quote === null ? (
        <GapText>No passage text was recorded for this citation.</GapText>
      ) : (
        <blockquote
          role="region"
          aria-label={`Passage from ${citation.label}`}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="reading-copy max-h-60 overflow-y-auto rounded-ds-sm bg-surface-subtle px-4 py-3 text-small wrap-anywhere text-text-primary"
        >
          {citation.quote}
        </blockquote>
      )}
      {citation.reason !== null && (
        <span className="text-small wrap-anywhere text-text-secondary">{citation.reason}</span>
      )}
      {citation.sha256 !== null && (
        <code className="font-mono text-mono wrap-anywhere text-text-tertiary">
          {citation.sha256}
        </code>
      )}
    </li>
  );
}

/**
 * The passage the claim rests on and where it was read. A trace that lists its citations says what
 * each holds, and says none were recorded when the list is empty; a trace that does not know its
 * citations draws the excerpt it carries, capped, and otherwise nothing.
 */
export function TraceSourcePassage({ trace }: { trace: SourcedTrace }) {
  if (trace.citations !== undefined) {
    if (trace.citations.length === 0)
      return (
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={CAPTION}>Source</span>
          <GapNote>No source passage was recorded for this item.</GapNote>
        </div>
      );
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className={CAPTION}>Source excerpt</span>
        <ul className="flex flex-col gap-3">
          {trace.citations.map((citation, index) => (
            <Citation key={`${String(index)}-${citation.label}`} citation={citation} />
          ))}
        </ul>
      </div>
    );
  }
  if (trace.excerpt === null) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={CAPTION}>Source excerpt</span>
      <blockquote
        role="region"
        aria-label="Source excerpt"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="reading-copy max-h-60 overflow-y-auto rounded-ds-sm bg-surface-subtle px-4 py-3 text-small wrap-anywhere text-text-primary"
      >
        {trace.excerpt.quote}
      </blockquote>
      <span className="font-mono text-mono wrap-anywhere text-text-tertiary">
        {trace.excerpt.source}
      </span>
    </div>
  );
}

/** The basis line in words; a missing one in the gap treatment; nothing where the trace carries no basis node. */
export function TraceBasis({ trace }: { trace: Trace }) {
  const basis = basisOf(trace);
  if (basis === null) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={CAPTION}>Basis</span>
      {basis.kind === "recorded" ? (
        <p className="reading-copy text-small wrap-anywhere whitespace-pre-line text-text-secondary">
          {basis.text}
        </p>
      ) : (
        <GapText>{MISSING_BASIS}</GapText>
      )}
    </div>
  );
}

/** The supplied files a trace cites, named with their cited pages as plain text: never a link (decision 9). */
export function CitedSources({ links }: { links: readonly { href: string }[] }) {
  const names = citedSourceNames(links);
  if (names.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className={CAPTION}>Cited sources</span>
      <ul className="grid gap-1 text-small text-text-secondary">
        {names.map(({ path, text }) => (
          <li key={path} className="wrap-anywhere">
            {text}
          </li>
        ))}
      </ul>
      {links.some(({ href }) => href.includes("?page=")) && (
        <p className="text-caption text-text-tertiary">
          Pages follow the source supplied to this run and may differ from the filing’s printed
          pages.
        </p>
      )}
    </div>
  );
}
