import { TextLink } from "../../run/TextLink";
import { moduleName } from "../api";
import {
  evidenceLink,
  factsOf,
  latestRun,
  type Coverage as Data,
  type Issuer,
} from "../coverageData";
import { card, heading } from "../layout";
import { HIT, IN_EVIDENCE, prose, RunLine } from "./shared";

/**
 * Module passages of the issuers' newest runs, grouped by issuer, each with its sources link. An
 * issuer the search kept for its name, sector or another field shows all its passages.
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
          <ul className="grid gap-5">
            {facts.map((fact) => {
              const item = fields.get(fact.field);
              const impact = prose(fact.impact);
              return (
                <li
                  key={`${fact.output}-${String(fact.line)}-${fact.field}`}
                  className="grid gap-2 border-t border-border-hairline pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-small font-medium text-text-secondary">
                    {titles.get(item?.module ?? "") ?? moduleName(item?.module ?? "")}
                    {item?.label ? ` · ${item.label}` : ""}
                  </p>
                  <p className="reading-copy text-body text-text-primary wrap-anywhere">
                    {prose(fact.text) ?? IN_EVIDENCE}
                  </p>
                  {impact && (
                    <p className="text-small text-text-secondary wrap-anywhere">
                      <span className="text-text-tertiary">Creditor impact: </span>
                      <span>{impact}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
                    {fact.confidence && (
                      <span className="text-text-secondary">Confidence: {fact.confidence}</span>
                    )}
                    <TextLink href={evidenceLink(run, fact)} className={HIT}>
 View sources
 </TextLink>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
