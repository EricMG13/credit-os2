import { field } from "../layout";
import type { SearchHit } from "./evidenceSearch";

const CAP = 50;

type Found = { lines: SearchHit[]; sources: SearchHit[]; gaps: SearchHit[] };

const echo = (text: string) => (text.length > 80 ? `${text.slice(0, 80)}…` : text);
const count = (n: number, one: string, many: string) => `${String(n)} ${n === 1 ? one : many}`;

/** The field that leads Evidence: a typed query replaces the page with its matches. */
export function EvidenceSearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-small">
      <span className="font-medium text-text-primary">Search evidence</span>
      <input
        type="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={`${field} min-h-8 max-[480px]:min-h-11`}
        autoComplete="off"
      />
    </label>
  );
}

/** The result counts, announced as they change; nothing while the field is empty. */
export function EvidenceSearchStatus({ query, found }: { query: string; found: Found }) {
  const text = !query.trim()
    ? ""
    : found.lines.length + found.sources.length + found.gaps.length === 0
      ? `No match for “${echo(query.trim())}”`
      : `${count(found.lines.length + found.sources.length + found.gaps.length, "match", "matches")}: ${count(found.lines.length, "handoff line", "handoff lines")}, ${count(found.sources.length, "source", "sources")}, ${count(found.gaps.length, "gap", "gaps")}`;
  return (
    <p role="status" className="text-small text-text-secondary">
      {text}
    </p>
  );
}

function Group({ label, hits }: { label: string; hits: SearchHit[] }) {
  if (hits.length === 0) return null;
  return (
    <section aria-label={label} className="grid min-w-0 gap-2">
      <h3 className="text-h4 font-medium text-text-primary">{`${label} (${String(hits.length)})`}</h3>
      <ul className="divide-y divide-border-hairline rounded-ds-md border border-border-hairline bg-surface-card">
        {hits.slice(0, CAP).map((hit) => (
          <li key={hit.key} className="grid min-w-0 gap-0.5 px-4 py-2">
            <a
              href={hit.href}
              className="inline-flex min-h-8 items-center font-medium wrap-anywhere text-text-link underline max-[480px]:min-h-11"
            >
              {hit.title}
            </a>
            <span className="text-small wrap-anywhere text-text-secondary">{hit.detail}</span>
          </li>
        ))}
      </ul>
      {hits.length > CAP && (
        <p className="text-small text-text-secondary">
          {`Showing the first ${String(CAP)} of ${String(hits.length)}, in document order.`}
        </p>
      )}
    </section>
  );
}

/** Matches grouped by kind, in document order, and what the search does not cover. */
export function EvidenceSearchResults({ found }: { found: Found }) {
  return (
    <div className="grid min-w-0 gap-4">
      <Group label="Handoff lines" hits={found.lines} />
      <Group label="Sources" hits={found.sources} />
      <Group label="Gaps" hits={found.gaps} />
      <p className="text-small text-text-tertiary">
        Not searched: script check outcomes, the run record, citation labels and cited passages, and
        the text of the source files. Alternate handoffs are searched for gaps only.
      </p>
    </div>
  );
}
