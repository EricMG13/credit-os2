import { useEffect, useRef } from "react";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { TextLink } from "../../run/TextLink";
import { moduleName } from "../api";
import { evidenceLink, factsOf, latestRun, type Coverage as Data, type Issuer } from "../coverageData";
import { card, heading } from "../layout";
import { RunStates } from "./RunStates";
import { stateWord } from "./StateMark";
import { HIT, IN_EVIDENCE, named, prose, reportPath, RunLine } from "./shared";

/** One issuer: every run's states by stage and what its newest run says. */
export function IssuerDetail({ data, issuer }: { data: Data; issuer: Issuer }) {
  const newest = latestRun(issuer);
  const titles = new Map(data.columns.map((column) => [column.code, named(column)]));
  const fields = new Map(data.fields.map((item) => [item.id, item]));
  const said = newest
    ? factsOf(data, newest.key).filter((fact) => fact.field.endsWith("/bottomline"))
    : [];
  const title = useRef<HTMLHeadingElement>(null);
  // Opened below the matrix, the detail comes into view and takes focus at its heading.
  useEffect(() => {
    title.current?.focus();
    // jsdom has no scrollIntoView.
    if (typeof title.current?.scrollIntoView === "function")
      title.current.scrollIntoView({ block: "start" });
  }, []);
  return (
    <section className={card} aria-label={issuer.name}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 ref={title} tabIndex={-1} className={cx(heading, "outline-none")}>
          {issuer.name}
        </h3>
        {newest && <Button href={reportPath(newest.folder)}>Open newest report</Button>}
      </div>
      <ol aria-label={`Every run of ${issuer.name}, newest first`} className="grid gap-6">
        {issuer.runs.map((run) => (
          <li key={run.key} className="grid gap-3 border-t border-border-hairline pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <RunLine run={run} />
              <TextLink href={reportPath(run.folder)} className={HIT}>
 Open report
 </TextLink>
            </div>
            <RunStates data={data} run={run} />
            <p className="text-caption text-text-secondary">
              Other modules:{" "}
              {run.other.length === 0
                ? "None"
                : run.other
                    .map((item) => `${named(item)} (${stateWord(item).toLowerCase()})`)
                    .join("; ")}
            </p>
          </li>
        ))}
      </ol>
      {newest && said.length > 0 && (
        <div className="grid gap-3">
          <h4 className="font-semibold text-text-primary">Bottom lines of the newest run</h4>
          <ul className="grid gap-4">
            {said.map((fact) => (
              <li key={`${fact.output}-${String(fact.line)}`} className="grid gap-1">
                <span className="text-small font-medium text-text-secondary">
                  {titles.get(fields.get(fact.field)?.module ?? "") ??
                    moduleName(fields.get(fact.field)?.module ?? "")}
                </span>
                <p className="reading-copy text-body text-text-primary">
                  {prose(fact.text) ?? IN_EVIDENCE}
                </p>
                <TextLink href={evidenceLink(newest, fact)} className={HIT}>
 View sources
 </TextLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
