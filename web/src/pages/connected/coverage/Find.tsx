import { TextLink } from "../../run/TextLink";
import { ChevronRight } from "@untitledui/icons";
import {
  evidenceLink,
  factsOf,
  latestRun,
  type Coverage as Data,
  type CoverageRun,
  type Fact,
  type Issuer,
} from "../coverageData";
import { card, heading } from "../layout";
import { HIT, IN_EVIDENCE, moduleTitle, prose, RunLine } from "./shared";

/** Passages drawn per issuer before the rest fold under one disclosure. */
const FIRST = 5;

/**
 * The passage with each run of the searched words marked. The text is cut, never changed: the
 * pieces read in order are the passage as drawn.
 */
function Marked({ text, wanted }: { text: string; wanted: string }) {
  if (wanted === "") return text;
  const lower = text.toLowerCase();
  const pieces: { text: string; hit: boolean }[] = [];
  let from = 0;
  for (let at = lower.indexOf(wanted); at !== -1; at = lower.indexOf(wanted, from)) {
    if (at > from) pieces.push({ text: text.slice(from, at), hit: false });
    pieces.push({ text: text.slice(at, at + wanted.length), hit: true });
    from = at + wanted.length;
  }
  if (from === 0) return text;
  if (from < text.length) pieces.push({ text: text.slice(from), hit: false });
  return (
    <>
      {pieces.map((piece, index) =>
        piece.hit ? (
          <mark key={index} className="rounded-ds-xs bg-action-subtle-hover px-0.5 font-medium text-text-primary">
            {piece.text}
          </mark>
        ) : (
          piece.text
        ),
      )}
    </>
  );
}

/**
 * Module passages of the issuers' newest runs, grouped by issuer, each with its sources link. An
 * issuer the search kept for its name, sector or another field shows all its passages. The first
 * five of an issuer are drawn; the rest open under one disclosure. Searched words are marked.
 */
export function FindView({
  data,
  issuers,
  query,
  titles,
}: {
  data: Data;
  issuers: Issuer[];
  query: string;
  titles: ReadonlyMap<string, string>;
}) {
  const wanted = query.trim().toLowerCase();
  const fields = new Map(data.fields.map((item) => [item.id, item]));
  const found = issuers.flatMap((issuer) => {
    const run = latestRun(issuer);
    if (!run) return [];
    const passages = factsOf(data, run.key).filter(
      (fact) => fact.at === null && fields.get(fact.field)?.kind === "text",
    );
    const matching = passages.filter((fact) =>
      `${fact.text} ${fact.impact ?? ""}`.toLowerCase().includes(wanted),
    );
    const facts = matching.length > 0 ? matching : passages;
    return facts.length > 0 ? [{ issuer, run, facts }] : [];
  });
  const count = found.reduce((total, { facts }) => total + facts.length, 0);
  const passage = (run: CoverageRun) => (fact: Fact) => {
    const item = fields.get(fact.field);
    const impact = prose(fact.impact);
    return (
      <li
        key={`${fact.output}-${String(fact.line)}-${fact.field}`}
        className="grid gap-2 border-t border-border-hairline pt-4 first:border-t-0 first:pt-0"
      >
        <p className="text-small font-medium text-text-secondary">
          {moduleTitle(item?.module, titles, run.pathway)}
          {item?.label ? ` · ${item.label}` : ""}
        </p>
        <p className="reading-copy text-body wrap-anywhere text-text-primary">
          <Marked text={prose(fact.text) ?? IN_EVIDENCE} wanted={wanted} />
        </p>
        {impact && (
          <p className="text-small wrap-anywhere text-text-secondary">
            <span className="text-text-tertiary">Creditor impact: </span>
            <span>
              <Marked text={impact} wanted={wanted} />
            </span>
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          {fact.confidence && (
            <span className="text-text-secondary">Confidence: {fact.confidence}</span>
          )}
          <TextLink href={evidenceLink(run, fact)} className={`${HIT} text-small font-normal`}>
            Open in Evidence
          </TextLink>
        </div>
      </li>
    );
  };
  if (count === 0)
    return (
      <p role="status" className={card}>
        No module passage of these issuers’ newest runs matches.
      </p>
    );
  return (
    <div className="grid gap-4">
      <p className="text-small text-text-secondary">
        {String(count)} {count === 1 ? "passage" : "passages"} from the newest runs
        {wanted ? ` of issuers matching “${query.trim()}”` : ""}
      </p>
      {found.map(({ issuer, run, facts }) => (
        <section key={issuer.key} aria-label={issuer.name} className={`${card} gap-4 sm:p-6`}>
          <div className="grid gap-0.5">
            <h3 className={heading}>{issuer.name}</h3>
            <RunLine run={run} />
          </div>
          <ul className="grid gap-5">{facts.slice(0, FIRST).map(passage(run))}</ul>
          {facts.length > FIRST && (
            <details className="group border-t border-border-hairline pt-2">
              <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-ds-sm text-small font-medium text-text-secondary outline-focus-ring hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2">
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-text-tertiary group-open:rotate-90"
                />
                {`Show the other ${String(facts.length - FIRST)} passages of ${issuer.name}`}
              </summary>
              <ul className="grid gap-5 pt-4">{facts.slice(FIRST).map(passage(run))}</ul>
            </details>
          )}
        </section>
      ))}
    </div>
  );
}
