import { SearchLg } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { field } from "../layout";
import type { SearchHit } from "./evidenceSearchModel";

const CAP = 50;

type Found = { lines: SearchHit[]; sources: SearchHit[]; gaps: SearchHit[]; words: string[] };

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
      <span className="relative block min-w-0">
        <SearchLg
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary"
        />
        <input
          type="search"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder="A figure, a phrase, a file name or a hash"
          className={cx(field, "min-h-8 pl-9 placeholder:text-text-tertiary max-[480px]:min-h-11")}
          autoComplete="off"
        />
      </span>
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

/** The hit's own words with each typed word marked where it sits; the text itself is unchanged. */
function Marked({ text, words }: { text: string; words: string[] }) {
  const lower = text.toLowerCase();
  const spans: [number, number][] = [];
  for (const word of words) {
    for (let at = lower.indexOf(word); at !== -1; at = lower.indexOf(word, at + word.length))
      spans.push([at, at + word.length]);
  }
  spans.sort(([a], [b]) => a - b);
  const parts: (string | [string])[] = [];
  let done = 0;
  for (const [from, to] of spans) {
    if (to <= done) continue;
    const start = Math.max(from, done);
    if (start > done) parts.push(text.slice(done, start));
    parts.push([text.slice(start, to)]);
    done = to;
  }
  if (done < text.length) parts.push(text.slice(done));
  return (
    <>
      {parts.map((part, index) =>
        typeof part === "string" ? (
          part
        ) : (
          <mark key={index} className="rounded-ds-xs bg-action-subtle-hover text-text-primary">
            {part[0]}
          </mark>
        ),
      )}
    </>
  );
}

function Group({ label, hits, words }: { label: string; hits: SearchHit[]; words: string[] }) {
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
            <span className="text-small wrap-anywhere text-text-secondary">
              <Marked text={hit.detail} words={words} />
            </span>
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

/** What the search reads, then the matches grouped by kind in document order, then what it does not read. */
export function EvidenceSearchResults({ found }: { found: Found }) {
  return (
    <div className="grid min-w-0 gap-4">
      <p className="text-small text-text-secondary">
        Searched: the lines of the delivered handoffs, the supplied files by name, type, date and
        hash, and the recorded gaps. Every typed word must be present; a module is found by its
        name.
      </p>
      <Group label="Handoff lines" hits={found.lines} words={found.words} />
      <Group label="Sources" hits={found.sources} words={found.words} />
      <Group label="Gaps" hits={found.gaps} words={found.words} />
      <p className="text-small text-text-tertiary">
        Not searched: script check outcomes, the run record, citation labels and cited passages, and
        the text of the source files. Alternate handoffs are searched for gaps only.
      </p>
    </div>
  );
}
