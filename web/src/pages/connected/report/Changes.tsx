import { ArrowRight } from "@untitledui/icons";
import { useState } from "react";
import { ClockRewind } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Badge } from "@/components/base/badges/badges";
import { ColumnsChart } from "@/components/chart/ColumnsChart";
import { ChangeCard } from "@/pages/library/parts/ChangeCard";
import type { Cell } from "@/pages/library/slice";
import { changesSentence } from "../api";
import { card, heading } from "../layout";
import {
  comparisonRows,
  containsReference,
  readerText,
  readParagraph,
  type Changes as PublishedChanges,
  type MaturityProfile,
  type OutputEntry,
  type PublishedRun,
  type Snapshot,
} from "../publishedReport";
import { PublishedTable, ReportFindings } from "../ReportContent";
import { tone } from "../signal";
import { amount, distinct, ticks } from "../visuals/visualData";
import { PublishedSource } from "./PublishedTrace";
import { comparisonTrace, maturityTraces } from "./comparisonTrace";

/** The owner's tone for a comparable measure's difference as sent; none where the table has no direction. */
function cardTone(measure: { key: string; difference?: number | string | null } | undefined) {
  if (measure?.difference == null) return undefined;
  const result = tone(measure.key, String(measure.difference));
  return result === "none" ? undefined : result;
}

const cell = (value: string): Cell =>
  value === "Not stated" ? null : { kind: "value", at: null, text: value };

export function ComparisonTable({
  rows,
  source,
}: {
  rows: string[][];
  source?: (label: string) => string | undefined;
}) {
  return (
    <PublishedTable
      evidence
      rowSource={
        source &&
        ((_line, label) => {
          const href = source(label);
          return (
            href && (
              <PublishedSource href={href} name={label}>
                Comparison row
              </PublishedSource>
            )
          );
        })
      }
      table={{
        type: "table",
        line: 0,
        headers: [
          "Measure",
          "Earlier",
          "Current",
          "Difference",
          "Comparability",
          "Analysis change",
        ],
        rows: rows.map((cells, line) => ({ cells, line })),
      }}
    />
  );
}

/** The fixed sentence for a run with no comparison pack; the service's own reason is drawn only with the evidence. */
function noComparisonSentence(raw: string | null | undefined) {
  const text = (raw ?? "").replace(/^\s*changes:\s*/i, "").trim();
  const form = text.toLowerCase();
  if (form.startsWith("not produced"))
    return "The comparison was planned but not produced for this run.";
  if (form.startsWith("not compared")) return "This run was not compared with an earlier run.";
  if (form.startsWith("first run of this pathway")) {
    const sentence = changesSentence(text);
    if (!containsReference(sentence))
      return sentence.replace(/^./, (c) => c.toUpperCase()).replace(/\.?$/, ".");
  }
  return "No comparison was recorded for this run.";
}

export function Changes({
  snapshot,
  run,
  entries,
  change,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entries: OutputEntry[];
  change: PublishedChanges | null | undefined;
}) {
  const entryIndex = entries.findIndex((entry) => entry.output.module === "CP-8" && entry.selected);
  const entry = change?.problem ? undefined : entries[entryIndex];
  const trace = comparisonTrace(run.folder, change?.problem ? [] : entries);
  const rows = change?.pack && !change.problem ? comparisonRows(change, "reader") : [];
  const note = noComparisonSentence(change?.note);
  const [presentation, setPresentation] = useState<"cards" | "table">("cards");
  if (change?.first_run === true && !change.pack && !change.problem && !change.note)
    return (
      <section className={`${card} min-h-76 justify-center py-14`}>
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.FeaturedIcon icon={ClockRewind} />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title as="h2">No earlier run to compare.</EmptyState.Title>
            <EmptyState.Description>
              This is the first listed run for this issuer on this pathway.
            </EmptyState.Description>
            <p className="max-w-[55ch] text-sm text-text-secondary">
              This describes the library when this run was made; runs listed afterwards do not
              change this comparison.
            </p>
          </EmptyState.Content>
          <EmptyState.Footer>
            <Button href="#overview" color="secondary">
              Open the Overview
            </Button>
          </EmptyState.Footer>
        </EmptyState>
      </section>
    );
  return (
    <>
      <section className={card}>
        <h2 className={heading}>Changes since the last run</h2>
        {change?.problem ? (
          <p>
            {containsReference(change.problem)
              ? "The comparison could not be read."
              : change.problem}
          </p>
        ) : !change?.pack ? (
          <p>{note}</p>
        ) : null}
        {rows.length > 0 && (
          <>
            <div className="flex justify-end">
              <ButtonGroup
                aria-label="Presentation"
                size="sm"
                disallowEmptySelection
                selectedKeys={[presentation]}
                onSelectionChange={(keys) => {
                  const [key] = keys;
                  if (key === "cards" || key === "table") setPresentation(key);
                }}
              >
                <ButtonGroupItem id="cards">Cards</ButtonGroupItem>
                <ButtonGroupItem id="table">Table</ButtonGroupItem>
              </ButtonGroup>
            </div>
            {presentation === "cards" ? (
              <ul className="grid gap-4 lg:grid-cols-3">
                {rows.map(
                  (
                    [label = "", before = "", after = "", delta, reason = "", analysis = ""],
                    index,
                  ) => {
                    const href = trace.measure(label);
                    const kind = reason.endsWith("Same-period analysis change")
                      ? "Same-period analysis change"
                      : delta && delta !== "—"
                        ? "Comparable"
                        : "Not assessable";
                    return (
                      <ChangeCard
                        key={index}
                        source={
                          href && (
                            <PublishedSource href={href} name={label}>
                              Comparison row
                            </PublishedSource>
                          )
                        }
                        change={{
                          measure: label,
                          kind,
                          current: cell(after),
                          from: cell(before),
                          change: delta && delta !== "—" ? delta : null,
                          direction: "none",
                          tone:
                            kind === "Comparable"
                              ? cardTone(change?.pack?.measures?.[index])
                              : undefined,
                          cause: containsReference(reason) ? "See comparison evidence." : reason,
                          effect: containsReference(analysis) ? "" : analysis,
                          trace: null,
                        }}
                      />
                    );
                  },
                )}
              </ul>
            ) : (
              <section aria-label="Earlier against current">
                <ComparisonTable rows={rows} source={trace.measure} />
              </section>
            )}
          </>
        )}
        {change?.pack && !change.problem && (
          <Button
            href={trace.handoff ?? "#evidence/trace/CP-8"}
            color="link-gray"
            size="sm"
            iconTrailing={ArrowRight}
          >
            Review comparison evidence
          </Button>
        )}
      </section>
      {!change?.problem && change?.pack && (
        <ComparisonMaturities
          profile={change.pack.maturity_profile}
          omitted={change.pack.omitted?.maturity_profile}
          traces={
            change.pack.maturity_profile
              ? maturityTraces(snapshot, run, entries, change)
              : undefined
          }
        />
      )}
      {!change?.problem && change?.pack?.modules?.length && (
        <ComparedModules change={change} source={trace.module} />
      )}
      {entry && (
        <ReportFindings snapshot={snapshot} run={run} entry={entry} entryIndex={entryIndex} />
      )}
    </>
  );
}

function ComparedModules({
  change,
  source,
}: {
  change: PublishedChanges;
  source: (module: string) => string | undefined;
}) {
  const modules = change.pack?.modules ?? [];
  const earlierFormat = change.pack?.prior?.format === "earlier";
  function side(ran: boolean, bottomLine: string | null) {
    if (bottomLine == null) return ran ? "Not stated" : "Did not run";
    const { body } = readParagraph(bottomLine);
    return containsReference(body)
      ? "See the retained handoff in Evidence."
      : readerText(body) || "Not stated";
  }
  return (
    <section className={card}>
      <h2 className={heading}>What changed in the analysis</h2>
      {earlierFormat && (
        <p className="text-sm text-text-secondary">
          The earlier run used an earlier report format.
        </p>
      )}
      <div className="grid gap-2">
        {modules.map((item) => {
          const verdict = change.verdicts?.modules?.[item.module];
          const href = source(item.module);
          const explanation = [verdict?.cause, verdict?.why].filter((value): value is string =>
            Boolean(value && !containsReference(value)),
          );
          return (
            <details key={item.module} className="rounded-lg border border-border-hairline p-3">
              <summary className="cursor-pointer font-medium">
                {item.title} <Badge size="sm">{verdict?.status || "Explanation not stated"}</Badge>
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold">Earlier</h3>
                  <p>{side(item.ran_prior, item.prior_bottom_line)}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Current</h3>
                  <p>{side(item.ran_current, item.current_bottom_line)}</p>
                </div>
              </div>
              {explanation.length > 0 && (
                <p className="mt-2 text-sm text-text-secondary">
                  {readerText(explanation.join(" · "))}
                </p>
              )}
              {href && (
                <PublishedSource href={href} name={item.title}>
                  Analysis comparison row
                </PublishedSource>
              )}
            </details>
          );
        })}
      </div>
    </section>
  );
}

function MaturityGap({ reason }: { reason: string }) {
  return (
    <section className={card}>
      <h2 className={heading}>Debt maturity schedules</h2>
      <p role="note">{reason}</p>
    </section>
  );
}

function ComparisonMaturities({
  profile,
  omitted,
  traces,
}: {
  profile?: MaturityProfile;
  omitted?: string;
  traces?: ReturnType<typeof maturityTraces>;
}) {
  if (!profile)
    return omitted ? (
      <MaturityGap reason={containsReference(omitted) ? "See the comparison evidence." : omitted} />
    ) : null;
  const groups = profile.rows.map((row) => row.period);
  const series = (["prior", "current"] as const).map((key, index) => ({
    name: index === 0 ? "Earlier run" : "Current run",
    values: profile.rows.map((row) => amount(row[key] ?? "")),
    labels: profile.rows.map((row) => (amount(row[key] ?? "") === null ? null : row[key])),
  }));
  const values = series.flatMap((item) => item.values);
  if (
    !profile.unit ||
    !groups.length ||
    !distinct(groups) ||
    values.every((value) => value === null)
  )
    return (
      <MaturityGap reason="The published comparison does not contain a usable maturity schedule." />
    );
  return (
    <section className={card}>
      <ColumnsChart
        title="Debt maturity schedules"
        as="h3"
        note={profile.unit}
        groups={groups}
        series={series}
        yTicks={ticks(values, true)}
        actions={
          <MaturitySources
            name="Debt maturity schedules"
            prior={traces?.prior?.table}
            current={traces?.current.table}
          />
        }
        table={{
          head: ["Period", "Earlier run", "Current run"],
          endHeading: "Sources",
          rows: profile.rows.map((row) => {
            const prior = traces?.prior?.row(row.period, row.prior, profile.unit);
            const current = traces?.current.row(row.period, row.current, profile.unit);
            return {
              label: row.period,
              cells: [row.prior, row.current],
              end:
                prior || current ? (
                  <MaturitySources name={row.period} prior={prior} current={current} />
                ) : undefined,
            };
          }),
        }}
      />
    </section>
  );
}

function MaturitySources({
  name,
  prior,
  current,
}: {
  name: string;
  prior?: string;
  current?: string;
}) {
  if (!prior && !current) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {prior && (
        <PublishedSource
          href={prior}
          name={`${name}, earlier run`}
          linkLabel={`Earlier run source for ${name}`}
        >
          Earlier source
        </PublishedSource>
      )}
      {current && (
        <PublishedSource href={current} name={`${name}, current run`}>
          Current source
        </PublishedSource>
      )}
    </div>
  );
}
