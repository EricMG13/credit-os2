import { useState, type ReactNode } from "react";
import {
  blocked,
  containsReference,
  type OutputEntry,
  type Row,
  type Table,
  unitLabel,
} from "../publishedReport";
import { namedTable } from "../reportView";
import { amount, distinct, sharePosition } from "../visuals/visualData";
import { Segmented } from "@/components/kit/Segmented";
import { cx } from "@/utils/cx";
import { Bento } from "./overview/Tile";
import {
  BarRow,
  caseStyle,
  CompactGap,
  GapCell,
  KeyValues,
  LeadFigure,
  statedGap,
  Trace,
} from "./leads/parts";
import { Legend, MarkSwatch } from "./leads/kit/marks/Legend";
import { closed, IN_EVIDENCE, readerCell } from "./leads/read";
import { sourceOf, writtenTable } from "./leads/written";

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
const TYPED_SCENARIOS = [
  "Scenario ID",
  "Period / scope",
  "EBITDA decline fraction s",
  "Cash-interest increase fraction k",
  "Category / confidence",
  "Anchor and omissions",
];
const TYPED_RESULTS = [
  "Scenario",
  "EBITDA (USD million)",
  "Cash interest (USD million)",
  "FCF (USD million)",
  "Total debt / EBITDA (x)",
  "Net debt / EBITDA (x)",
  "EBITDA / cash interest (x)",
  "FCF / debt (fraction)",
  "Calculation status",
];

type Scenario = {
  line: number;
  id: string;
  name: string;
  decline: string;
  interest: string;
  anchor: string;
  scope: string;
  category: string;
  confidence: string;
  anchorLabel?: string;
  scopeLabel?: string;
};

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A register table by its id, in front of its exact title: the one table holding every named header
 * (as written) under a heading that opens with the id ("T2DS.6 — Breakpoints with unchanged cash
 * interest"); when none or several do, the one under the exact `title`.
 */
export function registerOrTitled(
  entry: OutputEntry,
  id: string,
  title: string,
  headers: readonly string[],
) {
  const opens = new RegExp(`^[*\`]*${escaped(id)}(?![\\w.])`, "i");
  const tables = entry.sections
    .filter((section) => opens.test(section.heading.trim()))
    .flatMap(({ blocks }) => blocks)
    .filter((block): block is Table => block.type === "table")
    .filter((table) => headers.every((name) => table.headers.includes(name)));
  return tables.length === 1 ? tables[0] : namedTable(entry, title, headers);
}

function scenario({ line, cells }: Row): Scenario {
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

function typedScenarioCases(entry: OutputEntry, register: Table): Scenario[] {
  if (register.headers.join("|") !== TYPED_SCENARIOS.join("|")) return [];
  const summary = namedTable(entry, "Downside stress", [
    "Case",
    "EBITDA fall / cash-interest increase",
  ]);
  if (!summary) return [];
  const labels = summary.rows.flatMap(({ cells }) => {
    const shock = /^\s*(\d+(?:\.\d+)?)%\s*\/\s*(\d+(?:\.\d+)?)%\s*$/.exec(cells[1] ?? "");
    return shock
      ? [
          {
            name: cells[0] ?? "",
            decline: Number(shock[1]) / 100,
            interest: Number(shock[2]) / 100,
          },
        ]
      : [];
  });
  const at = (header: string) => register.headers.indexOf(header);
  return register.rows.map(({ line, cells }) => {
    const decline = cells[at("EBITDA decline fraction s")] ?? "";
    const interest = cells[at("Cash-interest increase fraction k")] ?? "";
    const declineValue = sharePosition(decline);
    const interestValue = sharePosition(interest);
    const nameMatches = labels.filter(
      (label) =>
        declineValue !== null &&
        interestValue !== null &&
        label.decline === declineValue &&
        label.interest === interestValue,
    );
    const [category = "", confidence = ""] = (cells[at("Category / confidence")] ?? "").split("/");
    return {
      line,
      id: cells[at("Scenario ID")] ?? "",
      name: nameMatches.length === 1 ? (nameMatches[0]?.name ?? "") : "",
      decline,
      interest,
      anchor: cells[at("Period / scope")] ?? "",
      scope: cells[at("Anchor and omissions")] ?? "",
      category: category.trim(),
      confidence: (confidence.split(";")[0] ?? "").trim(),
      anchorLabel: "Period / scope",
      scopeLabel: "Anchor and omissions",
    };
  });
}

function typedMetricMatrix(entry: OutputEntry): Table | undefined {
  const results = registerOrTitled(entry, "T2DS.4", "T2DS.4 Stressed metrics", TYPED_RESULTS);
  if (!results?.rows.length || results.headers.join("|") !== TYPED_RESULTS.join("|")) return;
  const scenarioAt = results.headers.indexOf("Scenario");
  const ids = results.rows.map(({ cells }) => cells[scenarioAt] ?? "");
  if (!distinct(ids)) return;
  const metrics = TYPED_RESULTS.slice(1);
  return {
    ...results,
    headers: ["Metric", ...ids, "Source"],
    rows: metrics.map((metric, index) => ({
      // Each transposed metric now spans every scenario row; trace to the register header.
      line: results.line,
      cells: [metric, ...results.rows.map(({ cells }) => cells[index + 1] ?? ""), ""],
    })),
  };
}

export function canReadDownside(entry: OutputEntry) {
  return (
    entry.output.module === "CP-2A" &&
    entry.output.state?.established !== false &&
    !blocked(entry) &&
    !entry.output.parseError
  );
}

/**
 * The results as the module may write them, one row per case (`Case | <measure> … | Source`), turned
 * into one row per measure (`Metric | <case> … | Source`) with every cell as written.
 */
function perMeasure(table: Table): Table {
  const measures = table.headers.slice(1, -1);
  const rows = table.rows;
  return {
    ...table,
    headers: ["Metric", ...rows.map(({ cells }) => cells[0] ?? ""), "Source"],
    rows: measures.map((measure, at) => ({
      // The row of a measure is the table's first row: every case's cell for it lies in that table.
      line: rows[0]?.line ?? table.line,
      cells: [measure, ...rows.map(({ cells }) => cells[at + 1] ?? ""), ""],
    })),
  };
}

/** The scenario register as the module may write it (`Case` = "<id> <name>", `Classification / confidence`). */
function writtenCases(register: Table) {
  const at = (name: string) => register.headers.indexOf(name);
  const [decline, interest, kind, anchor, scope] = [
    "EBITDA decline fraction s",
    "Cash-interest increase fraction k",
    "Classification / confidence",
    "Anchor and selection rationale",
    "Exclusions",
  ].map(at);
  if (register.headers[0] !== "Case" || [decline, interest, kind, anchor, scope].includes(-1))
    return [];
  return register.rows.map(({ line, cells }) => {
    const [id = "", ...words] = (cells[0] ?? "").trim().split(/\s+/);
    const [category = "", confidence = ""] = (cells[kind ?? 0] ?? "")
      .split(";")
      .map((part) => part.trim());
    return {
      line,
      id,
      name: words.join(" "),
      decline: cells[decline ?? 0] ?? "",
      interest: cells[interest ?? 0] ?? "",
      anchor: cells[anchor ?? 0] ?? "",
      scope: cells[scope ?? 0] ?? "",
      category,
      confidence,
    };
  });
}

export function downsideView(entry: OutputEntry) {
  if (!canReadDownside(entry)) return null;
  const found = registerOrTitled(entry, "T2DS.4", RESULTS, ["Metric", "Source"]);
  const byCase = found ? undefined : registerOrTitled(entry, "T2DS.4", RESULTS, ["Case", "Source"]);
  const typed = !found && !byCase ? typedMetricMatrix(entry) : undefined;
  const matrix = found ?? (byCase?.headers[0] === "Case" ? perMeasure(byCase) : undefined) ?? typed;
  if (!matrix?.rows.length || matrix.headers[0] !== "Metric" || matrix.headers.at(-1) !== "Source")
    return null;
  const names = matrix.headers.slice(1, -1);
  const register = registerOrTitled(entry, "T2DS.1", "T2DS.1 Scenarios", SCENARIOS);
  const written = registerOrTitled(entry, "T2DS.1", "T2DS.1 Scenario assumptions", ["Case"]);
  const typedRegister = !register
    ? registerOrTitled(entry, "T2DS.1", "T2DS.1 Scenarios", TYPED_SCENARIOS)
    : undefined;
  const cases: Scenario[] =
    register?.headers.join("|") === SCENARIOS.join("|")
      ? register.rows.map(scenario)
      : written
        ? writtenCases(written)
        : typedRegister
          ? typedScenarioCases(entry, typedRegister)
          : [];
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

/** A stressed measure's cell as a number on the measure's stated unit; null when it does not read. */
function position(measure: string, cell: string) {
  const unit = /\(([A-Z]{3}) millions?\)$/.exec(measure)?.[1];
  if (!unit && !/\((?:x|%|fraction)\)$/.test(measure)) {
    // A measure with no stated unit: a cell opening with a multiple ("6.53x", "4.88x; pro forma 6.02x") is read as that multiple.
    const multiple = /^(-?\d+(?:\.\d+)?)x(?:;|$)/.exec(cell.trim())?.[1];
    return multiple === undefined ? null : Number(multiple);
  }
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

function readerDetail(value: string) {
  const cell = readerCell(value);
  return cell === IN_EVIDENCE ? "See the scenario evidence." : cell;
}

/** A case's name as a working page draws it: a name carrying a code or a register id is in Evidence. */
const caseName = ({ name }: { name: string }) => readerCell(name) || "Not stated";

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

/** A share of an axis as a CSS length, rounded only past the sixth decimal of a percent. */
export const share = (at: number) => `${String(Number((at * 100).toFixed(6)))}%`;

type CaseRole = "control" | "other";
type MultiplePanel = { measure: string; bars: { text: string; value: number }[] };

/** A figure and nothing else ("10.00", "-5.1250", "3.1x", "12%"): it is never broken across lines. */
const PLAIN_FIGURE = /^[\u2212-]?[\d,]+(?:\.\d+)?[x%]?$/;

function PanelRows({
  panel,
  cases,
}: {
  panel: MultiplePanel;
  cases: readonly { name: string; role: CaseRole }[];
}) {
  const values = panel.bars.map(({ value }) => value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const at = (value: number) => (value - min) / span;
  const zero = at(0);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h4 className="text-caption font-medium wrap-anywhere text-text-secondary">
        {panel.measure}
      </h4>
      <ul className="flex flex-col gap-2">
        {panel.bars.map((bar, index) => {
          const item = cases[index];
          const style = caseStyle(index);
          return (
            <li key={index} className="flex min-w-0 flex-col gap-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-1.5 text-small wrap-anywhere text-text-secondary">
                  <svg
                    viewBox="0 0 12 12"
                    width="12"
                    height="12"
                    aria-hidden="true"
                    className="flex-none translate-y-px overflow-visible"
                  >
                    <MarkSwatch kind={style.shape} tone={style.tone} x={0} y={0} />
                  </svg>
                  <span>
                    {item?.name}
                    {item?.role === "control" && !/control/i.test(item.name) && (
                      <span className="ml-1.5 rounded-ds-xs border border-border-hairline px-1 text-text-tertiary">
                        control
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={cx(
                    "text-right font-mono text-small text-text-primary tabular-nums",
                    // A plain figure never breaks inside itself ("10." / "00"); words may wrap.
                    PLAIN_FIGURE.test(bar.text) ? "whitespace-nowrap" : "wrap-anywhere",
                  )}
                >
                  {bar.text}
                </span>
              </span>
              <BarRow
                start={zero}
                end={at(bar.value)}
                zero={zero}
                tone={style.tone}
                bar={{ "data-bar": bar.text }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Few cases across a few measures: one panel a measure, every case a bar on that measure's own
 * scale from zero, each value as written. Each case has its colour and marker by register order; the control is named in words.
 */
function SmallMultiples({
  label,
  cases,
  panels,
}: {
  label: string;
  cases: readonly { name: string; role: CaseRole }[];
  panels: readonly MultiplePanel[];
}) {
  const reading = panels
    .map(
      (panel) =>
        `${panel.measure}: ${panel.bars
          .map((bar, at) => {
            const item = cases[at];
            return `${item?.name ?? ""}${item?.role === "control" ? " (control)" : ""} ${bar.text}`;
          })
          .join(", ")}`,
    )
    .join(". ");
  return (
    <div role="img" aria-label={closed(`${label}. ${reading}`)} className="@container min-w-0">
      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-x-6 gap-y-5 @lg:grid-cols-2 @3xl:grid-cols-3"
      >
        {panels.map((panel) => (
          <PanelRows key={panel.measure} panel={panel} cases={cases} />
        ))}
      </div>
    </div>
  );
}

type View = NonNullable<ReturnType<typeof downsideView>>;
type Case = View["cases"][number];

const measureName = (measure: string) =>
  measure.replace(
    /\(([A-Z]{3}) millions?\)$/,
    (_, code: string) => `(${unitLabel(`${code} millions`)})`,
  );

const NOT_STATED = /^Not (?:supplied|calculated|calculable|stated)\b/i;

/** A case's stated gap on a measure: its name, and the gap's word and reason as the module writes them. */
function StatedGap({ name, text }: { name: string; text: string }) {
  const cell = readerCell(text);
  const gap = statedGap(cell);
  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-2">
      <span>{name}</span>
      {gap ? <GapCell word={gap.word} reason={gap.reason} /> : <GapCell word={cell} />}
    </span>
  );
}

/** Each measure of the results, placed when every case's cell reads on the measure's own unit. */
function casePanels(matrix: Table, cases: readonly Case[]) {
  const columns = cases.map(({ id }) => matrix.headers.indexOf(id));
  const measures = matrix.rows.map(({ cells }) => cells[0] ?? "");
  const placed: MultiplePanel[] = [];
  const unplaced: ReactNode[] = [];
  if (!distinct(measures)) return { placed, unplaced };
  for (const { cells } of matrix.rows) {
    const measure = cells[0] ?? "";
    if (containsReference(measure)) continue;
    const texts = columns.map((at) => cells[at] ?? "");
    const values = texts.map((text) => position(measure, text));
    const name = readerCell(measure);
    if (values.every((value) => value !== null)) {
      placed.push({
        measure: measureName(name),
        bars: texts.map((text, at) => ({ text: readerCell(text), value: values[at] ?? 0 })),
      });
      continue;
    }
    const stated = texts.flatMap((text, at) =>
      values[at] === null && NOT_STATED.test(text)
        ? [<StatedGap key={at} name={cases[at] ? caseName(cases[at]) : ""} text={text} />]
        : [],
    );
    unplaced.push(
      stated.length ? (
        <span key={name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span>{`${name} is not drawn.`}</span>
          {stated}
        </span>
      ) : (
        `${name} is not drawn; the table has its cells as written.`
      ),
    );
  }
  return { placed, unplaced };
}

/**
 * A case as the module states it, each detail under the module's own header, with its own trace
 * to the scenario's row; the control is named as the control.
 */
function CaseDetails({
  selected,
  control = false,
  href,
}: {
  selected: Case;
  control?: boolean;
  href: (line: number) => string;
}) {
  const items = (
    [
      ["EBITDA decline", scenarioShareLabel(selected.decline)],
      ["Cash-interest increase", scenarioShareLabel(selected.interest)],
      [selected.anchorLabel ?? "Anchor", selected.anchor],
      [selected.scopeLabel ?? "What the assumption leaves out", selected.scope],
      ["Category", selected.category],
      ["Confidence", selected.confidence],
    ] as const
  )
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, value: readerDetail(value) }));
  const name = `${caseName(selected)} scenario`;
  return (
    <div
      role="group"
      aria-label={control ? `${name} (control)` : name}
      className="flex min-w-0 items-start justify-between gap-3"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-small font-medium text-text-secondary">
          {control ? `${caseName(selected)} (control)` : caseName(selected)}
        </span>
        <KeyValues items={items} />
      </span>
      <Trace href={href(selected.line)} name={name} />
    </div>
  );
}

function resultsTable(matrix: Table, cases: readonly Case[], href: (line: number) => string) {
  const columns = cases.map(({ id }) => matrix.headers.indexOf(id));
  return {
    head: ["Measure", ...cases.map(caseName)],
    rows: matrix.rows.map(({ cells, line }) => {
      const label = readerCell(cells[0] ?? "");
      return {
        label,
        cells: columns.map((at) => readerCell(cells[at] ?? "") || null),
        end: <Trace href={href(line)} name={label} />,
      };
    }),
    endHeading: "Source",
  };
}

const RESULTS_NAME = "Stressed flows and credit metrics";
const TITLE = "Downside scenarios";

/** CP-2A's scenario comparison: every case on each stressed measure, the control marked. */
export function DownsideTile({
  data,
  href,
  span,
}: {
  data: View;
  href: (line: number) => string;
  span: 4 | 6 | 8 | 12;
}) {
  const { matrix, control, cases } = data;
  const alternatives = cases.filter(({ id }) => id !== control?.id);
  const [chosen, setChosen] = useState(alternatives[0]?.id);
  const selected = alternatives.find(({ id }) => id === chosen) ?? alternatives[0];
  const trace = <Trace href={href(matrix.line)} name={RESULTS_NAME} />;
  if (!control || !selected)
    return (
      <LeadFigure
        span={span}
        label={TITLE}
        title={TITLE}
        trace={trace}
        className="wrap-anywhere"
        figure={
          <CompactGap>
            This page could not read a unique control and named cases for these results.
          </CompactGap>
        }
        table={writtenTable(sourceOf(matrix), href)}
      />
    );
  const { placed, unplaced } = casePanels(matrix, cases);
  const roles = cases.map((item) => {
    const role: CaseRole = item.id === control.id ? "control" : "other";
    return { name: caseName(item), role };
  });
  const keyed = roles.map(({ name, role }, index) => {
    const { shape, tone } = caseStyle(index);
    const text = role === "control" && !/control/i.test(name) ? `${name} (control)` : name;
    return { kind: shape, tone, text };
  });
  const choice = (
    <Segmented
      label="Stress case to compare with the unstressed control"
      segments={alternatives.map((item) => ({ key: item.id, label: caseName(item) }))}
      current={selected.id}
      onSelect={setChosen}
    />
  );
  return (
    <LeadFigure
      span={span}
      label={TITLE}
      title={TITLE}
      basis={readerDetail(control.anchor)}
      legend={placed.length > 0 ? <Legend items={keyed} /> : undefined}
      trace={trace}
      controls={choice}
      className="wrap-anywhere"
      figure={
        placed.length > 0 ? (
          <SmallMultiples label={RESULTS_NAME} cases={roles} panels={placed} />
        ) : (
          <CompactGap>
            This page could not place any measure of these results on one stated basis.
          </CompactGap>
        )
      }
      table={resultsTable(matrix, cases, href)}
      notes={[
        <CaseDetails key="details" selected={selected} href={href} />,
        <CaseDetails key="control" selected={control} control href={href} />,
        ...unplaced,
      ]}
    />
  );
}

export function Downside({ data, href }: { data: View; href: (line: number) => string }) {
  return (
    <Bento>
      <DownsideTile data={data} href={href} span={12} />
    </Bento>
  );
}
