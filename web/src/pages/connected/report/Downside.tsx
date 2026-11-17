import { useState } from "react";
import { ComparisonChart, type ComparisonPanel } from "@/components/chart/ComparisonChart";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import { card, field, heading, label } from "../layout";
import {
  blocked,
  containsReference,
  type OutputEntry,
  type Row,
  unitLabel,
} from "../publishedReport";
import { PublishedTable } from "../ReportContent";
import { namedTable } from "../reportView";
import { amount, distinct, sharePosition } from "../visuals/visualData";
import { PublishedSource } from "./PublishedTrace";

const SCENARIOS = [
  "Scenario ID",
  "Name",
  "EBITDA decline s",
  "Cash-interest increase k",
  "Anchor",
  "What the assumption leaves out",
  "Category",
  "Confidence",
];
const RESULTS = "T2DS.4 Stressed flows and metrics";

function scenario({ line, cells }: Row) {
  const [
    id = "",
    name = "",
    decline = "",
    interest = "",
    anchor = "",
    scope = "",
    category = "",
    confidence = "",
  ] = cells;
  return { line, id, name, decline, interest, anchor, scope, category, confidence };
}

export function canReadDownside(entry: OutputEntry) {
  return (
    entry.output.module === "CP-2A" &&
    entry.output.state?.established !== false &&
    !blocked(entry) &&
    !entry.output.parseError
  );
}

export function downsideView(entry: OutputEntry) {
  if (!canReadDownside(entry)) return null;
  const matrix = namedTable(entry, RESULTS, ["Metric", "Source"]);
  if (!matrix?.rows.length || matrix.headers[0] !== "Metric" || matrix.headers.at(-1) !== "Source")
    return null;
  const names = matrix.headers.slice(1, -1);
  const register = namedTable(entry, "T2DS.1 Scenarios", SCENARIOS);
  const cases =
    register?.headers.join("|") === SCENARIOS.join("|") ? register.rows.map(scenario) : [];
  const control = cases.filter(
    ({ decline, interest }) => sharePosition(decline) === 0 && sharePosition(interest) === 0,
  );
  const consistent =
    cases.length > 1 &&
    distinct(cases.map(({ id }) => id)) &&
    distinct(cases.map(({ name }) => name)) &&
    distinct(names) &&
    names.length === cases.length &&
    cases.every(
      ({ id, name, decline, interest }) =>
        names.includes(id) &&
        !containsReference(name) &&
        sharePosition(decline) !== null &&
        sharePosition(interest) !== null,
    ) &&
    control.length === 1;
  return { matrix, control: consistent ? control[0] : undefined, cases: consistent ? cases : [] };
}

function position(measure: string, cell: string) {
  const unit = /\(([A-Z]{3}) millions\)$/.exec(measure)?.[1];
  if (!unit && !/\((?:x|%)\)$/.test(measure)) return null;
  const numeric = cell.replaceAll("−", "-");
  const direct = amount(numeric);
  if (direct !== null) return direct;
  if (!unit) return null;
  const match = /^(-?\d[\d,]*(?:\.\d+)?) \((-?)([A-Z]{3}) (\d[\d,]*(?:\.\d+)?) million\)$/.exec(
    numeric,
  );
  if (!match || match[3] !== unit) return null;
  const exact = amount(match[1] ?? "");
  const rounded = amount(`${match[2] ?? ""}${match[4] ?? ""}`);
  return exact !== null && rounded !== null && Math.abs(exact - rounded) <= 0.005000001
    ? exact
    : null;
}

function comparison(
  matrix: NonNullable<ReturnType<typeof downsideView>>["matrix"],
  base: string,
  pick: string,
) {
  const baseAt = matrix.headers.indexOf(base);
  const pickAt = matrix.headers.indexOf(pick);
  const measures = matrix.rows.map(({ cells }) => cells[0] ?? "");
  if (!distinct(measures)) return [];
  return matrix.rows.flatMap(({ cells, line }) => {
    const measure = cells[0] ?? "";
    const before = cells[baseAt] ?? "";
    const after = cells[pickAt] ?? "";
    const first = position(measure, before);
    const second = position(measure, after);
    if (containsReference(measure) || first === null || second === null) return [];
    const min = Math.min(0, first, second);
    const max = Math.max(0, first, second) || (min === 0 ? 1 : 0);
    if (!Number.isFinite(max - min)) return [];
    const panel: ComparisonPanel = {
      measure: measure.replace(
        /\(([A-Z]{3}) millions\)$/,
        (_, code: string) => `(${unitLabel(`${code} millions`)})`,
      ),
      min,
      max,
      values: [first, second],
      texts: [before, after],
    };
    return [{ panel, line }];
  });
}

function readerDetail(value: string) {
  return containsReference(value) ? "See the scenario evidence." : value;
}

/** The same recorded share in percent, moving its decimal point without rounding its digits. */
export function scenarioShareLabel(text: string) {
  if (sharePosition(text) === null) return text;
  const stated = /\((\d+(?:\.\d+)?%)\)$/.exec(text)?.[1];
  if (stated) return stated;
  const [whole, fraction = ""] = text.split(".");
  const digits = fraction.padEnd(2, "0");
  const integer = whole === "1" ? "100" : String(Number(digits.slice(0, 2)));
  const remainder = digits.slice(2).replace(/0+$/, "");
  return `${integer}${remainder ? `.${remainder}` : ""}%`;
}

export function Downside({
  data,
  href,
}: {
  data: NonNullable<ReturnType<typeof downsideView>>;
  href: (line: number) => string;
}) {
  const { matrix, control, cases } = data;
  const alternatives = cases.filter(({ id }) => id !== control?.id);
  const [chosen, setChosen] = useState(alternatives[0]?.id);
  const selected = alternatives.find(({ id }) => id === chosen) ?? alternatives[0];
  const records = control && selected ? comparison(matrix, control.id, selected.id) : [];
  return (
    <section aria-label="Downside scenarios" className={`${card} min-w-0`}>
      <h3 className={heading}>Downside scenarios</h3>
      {control && selected ? (
        <>
          <label className={`${label} max-w-sm`}>
            Stress case to compare with the unstressed control
            <select
              className={field}
              value={selected.id}
              onChange={(event) => {
                setChosen(event.target.value);
              }}
            >
              {alternatives.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <div className={`${TRACE_HOST} grid gap-2 text-sm`}>
            <dl className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["EBITDA decline", scenarioShareLabel(selected.decline)],
                  ["Cash-interest increase", scenarioShareLabel(selected.interest)],
                  ["Assumption basis", selected.anchor],
                  ["Scope limits", selected.scope],
                  ["Category", selected.category],
                  ["Confidence", selected.confidence],
                ] as const
              )
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div key={key}>
                    <dt className="font-medium">{key}</dt>
                    <dd>{readerDetail(value)}</dd>
                  </div>
                ))}
            </dl>
            <PublishedSource href={href(selected.line)} name={selected.name}>
              Scenario source
            </PublishedSource>
          </div>
          {records.length > 0 ? (
            <div className={`${TRACE_HOST} min-w-0`}>
              <ComparisonChart
                title="Stressed flows and credit metrics"
                subtitle={readerDetail(control.anchor)}
                note="Each measure uses its own scale."
                cases={[control.name, selected.name]}
                rowLabels={["Control", "Selected"]}
                panels={records.map(({ panel }) => panel)}
                table={{
                  head: ["Measure", control.name, selected.name],
                  rows: records.map(({ panel, line }) => ({
                    label: panel.measure,
                    cells: panel.texts,
                    end: (
                      <PublishedSource href={href(line)} name={panel.measure}>
                        Measure source
                      </PublishedSource>
                    ),
                  })),
                  endHeading: "Sources",
                }}
                actions={
                  <PublishedSource
                    href={href(matrix.line)}
                    name="Stressed flows and credit metrics"
                  >
                    Source table
                  </PublishedSource>
                }
              />
            </div>
          ) : (
            <p role="note">The selected cases have no measures on a common basis.</p>
          )}
          {records.length > 0 && records.length < matrix.rows.length && (
            <p role="note">See full scenario results for measures without comparable values.</p>
          )}
        </>
      ) : (
        <p role="note">
          The handoff does not bind a unique control and named cases to these results.
        </p>
      )}
      <details className="min-w-0">
        <summary className="cursor-pointer font-semibold">Full scenario results</summary>
        <div className={`${TRACE_HOST} mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2`}>
          <PublishedTable
            table={matrix}
            href={href(matrix.line)}
            rowSource={(line, name) => (
              <PublishedSource href={href(line)} name={name}>
                Measure source
              </PublishedSource>
            )}
          />
          <PublishedSource href={href(matrix.line)} name="Full scenario results">
            Source table
          </PublishedSource>
        </div>
      </details>
    </section>
  );
}
