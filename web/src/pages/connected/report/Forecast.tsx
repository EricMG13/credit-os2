import { Button } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";
import { useState, type ReactNode } from "react";
import { moduleName } from "../api";
import { card, field, heading, label } from "../layout";
import {
  containsReference,
  evidencePath,
  FORECAST_INPUTS,
  type OutputEntry,
  type PublishedRun,
  readerText,
  withUnit,
} from "../publishedReport";
import { namedRow, namedTable, type buildReportView } from "../reportView";
import { PublishedTable } from "../ReportContent";
import { amount, record, stringsIn, word } from "../visuals/visualData";
import { TRACE_HOST } from "@/pages/library/parts/TraceControl";
import {
  CashProxy,
  cashProxyCases,
  forecastCaseOptions,
  ForecastScope,
  gridOf,
  LegacyForecast,
} from "../visuals/LegacyForecast";
import { RunCharts } from "./RunCharts";
import { PublishedSource } from "./PublishedTrace";

type Model = ReturnType<typeof buildReportView>["models"][number];
/** A model's recorded money unit: the currency code and "millions"
 * (docs/rulings/2026-11-16-reporting-currency-from-sources.md). */
const MILLIONS = /^[A-Z]{3} millions$/;

function forecastHandoff(model: Model, entries: OutputEntry[], folder: string) {
  const matches = entries.filter(
    ({ output }) =>
      output.module === "CP-2G" &&
      (model.sources.some(
        (item) => item.sha256 === output.sha256 && (!item.output || item.output === output.id),
      ) ||
        (model.runFolder === folder &&
          model.download.endsWith("/annual.md") &&
          output.href === model.download.replace(/annual\.md$/, "CP-2G.md"))),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

function inputsLine(entry: OutputEntry) {
  const inputs = entry.sections.filter(({ heading }) => heading === FORECAST_INPUTS);
  if (inputs.length !== 1) return;
  const blocks = inputs
    .flatMap(({ blocks }) => blocks)
    .filter((block) => block.type === "text" && block.text.startsWith("```json\n"));
  return blocks.length === 1 ? blocks[0]?.line : undefined;
}

function recordedBridge(
  handoff: OutputEntry | undefined,
  units: unknown,
  fiscal: string | undefined,
  value: number | null | undefined,
) {
  const unit = word(units);
  if (!handoff || !MILLIONS.test(unit) || !fiscal || typeof value !== "number") return null;
  const ledger = namedTable(handoff, "Calculations", [
    "ID",
    "Calculation",
    "Inputs",
    "Result",
    "Source",
  ]);
  const fcf = namedRow(ledger, ({ cells }) => cells[1] === `Base FCF ${fiscal}`);
  const inflow = namedRow(
    ledger,
    ({ cells }) => cells[1] === `Base taxes and working-capital inflow ${fiscal}`,
  );
  if (!fcf || !inflow) return null;
  const original = amount(fcf.cells[3] ?? "");
  const difference = amount(inflow.cells[3] ?? "");
  if (
    original === null ||
    difference === null ||
    !(Math.abs(original - value - difference) < 0.005)
  )
    return null;
  return { value, original, difference, unit, fcfLine: fcf.line, inflowLine: inflow.line };
}

function BasisNote({
  model,
  handoff,
  href,
}: {
  model: Model;
  handoff?: OutputEntry;
  href: (line: number) => string;
}) {
  const raw = record(model.cashflow);
  const limitation = stringsIn(raw.limits).find((line) =>
    /machine input is set to zero/i.test(line),
  );
  if (!limitation) return null;
  const grid = gridOf(raw);
  const cases = grid && cashProxyCases(grid, null);
  const period = cases?.periods[0];
  const value = cases?.series.find(({ name }) => name === "Base case")?.values[0];
  const fiscal = period?.slice(0, -1);
  const bridge = recordedBridge(handoff, raw.units, fiscal, value);
  return (
    <section className={card}>
      <h3 className={heading}>{fiscal ? `${fiscal} base case basis` : "Model basis"}</h3>
      {bridge && (
        <p>
          The calculation gives <strong>{bridge.value.toFixed(2)}</strong> cash proxy. The{" "}
          {moduleName("CP-2G")} gives <strong>{bridge.original.toFixed(2)}</strong> free cash flow.
          The displayed difference is{" "}
          <strong>{withUnit(bridge.difference.toFixed(2), bridge.unit)}</strong>.
        </p>
      )}
      {bridge && (
        <div className="flex flex-wrap gap-3">
          <PublishedSource href={href(bridge.fcfLine)} name="Forward credit model free cash flow">
            Free cash flow basis
          </PublishedSource>
          <PublishedSource href={href(bridge.inflowLine)} name="Recorded difference">
            Difference basis
          </PublishedSource>
        </div>
      )}
      <p>{readerText(limitation)}</p>
    </section>
  );
}

function ForecastCases({
  caseOptions,
  selectedCase,
  setChosenCase,
  source,
}: {
  caseOptions: ReturnType<typeof forecastCaseOptions>;
  selectedCase: string | undefined;
  setChosenCase: (name: string) => void;
  source: ((name: string) => ReactNode) | undefined;
}) {
  return (
    caseOptions.length > 1 && (
      <section
        id="forecast-cases"
        tabIndex={-1}
        className="flex scroll-mt-4 flex-col gap-4 focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        aria-labelledby="forecast-case-heading"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="forecast-case-heading" className="font-display text-h3">
            Forecast cases
          </h3>
          <p className="text-small text-text-tertiary">
            The cash proxy and forecast charts follow the selected case.
          </p>
        </div>
        <div role="radiogroup" aria-label="Forecast case" className="grid gap-4 sm:grid-cols-2">
          {caseOptions.map(({ name, period, value, units, description }) => (
            <div
              key={name}
              className={`relative flex flex-col gap-2 rounded-ds-md border bg-surface-card px-3 py-2.5 ${
                selectedCase === name
                  ? "border-action bg-surface-selected"
                  : "border-border-hairline"
              }`}
            >
              <div className={TRACE_HOST}>
                <label className="block cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
                  <input
                    type="radio"
                    name="forecast-case"
                    checked={selectedCase === name}
                    onChange={() => {
                      setChosenCase(name);
                    }}
                    className="sr-only"
                  />
                  <span className="flex items-baseline gap-2 text-sm font-semibold text-text-primary">
                    {name}
                    <span
                      aria-hidden="true"
                      className={`ml-auto size-4 flex-none self-center rounded-full border ${
                        selectedCase === name ? "border-5 border-action" : "border-border-control"
                      }`}
                    />
                  </span>
                  <span className="mt-0.5 block pr-14 text-sm text-text-secondary sm:pr-7">
                    <span className="font-display text-h3 tabular-nums">
                      {typeof value === "number"
                        ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)
                        : "Not available"}
                    </span>
                    <span className="block text-text-tertiary">
                      Cash proxy {period ? `· ${period}` : ""}
                      {` · ${units}`}
                    </span>
                    <span className="mt-2 block text-small text-text-secondary">
                      {description || "Case description not recorded."}
                    </span>
                  </span>
                </label>
                <div className="absolute right-2.5 bottom-2.5">{source?.(name)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  );
}

function ForecastAssumptions({
  model,
  handoff,
  run,
  href,
}: {
  model: Model;
  handoff: OutputEntry | undefined;
  run: PublishedRun;
  href: (line: number) => string;
}) {
  const register = model.register;
  const assumptions =
    register && handoff && namedTable(handoff, register.heading, register.headers);
  function assumptionHref(cells: string[]) {
    const row = namedRow(
      assumptions || undefined,
      (row) =>
        row.cells.length === cells.length &&
        row.cells.every((cell, index) => cell === cells[index]),
    );
    return row && href(row.line);
  }
  return (
    model.register && (
      <details className={card}>
        <summary className="cursor-pointer font-semibold">Forecast assumptions</summary>
        {model.register.intro && !containsReference(model.register.intro) && (
          <p>{readerText(model.register.intro)}</p>
        )}
        <PublishedTable
          table={{
            type: "table",
            line: 0,
            headers: model.register.headers,
            rows: model.register.rows.map((cells, line) => ({ cells, line })),
          }}
          rowHref={(line) => assumptionHref(model.register?.rows[line] ?? [])}
          rowSource={(line, name) => {
            const link = assumptionHref(model.register?.rows[line] ?? []);
            return (
              link && (
                <PublishedSource name={name} href={link}>
                  Assumption source
                </PublishedSource>
              )
            );
          }}
        />
        <Button
          href={handoff ? evidencePath(run.folder, handoff) : "#evidence/trace/CP-2G"}
          color="link-gray"
          size="sm"
          iconTrailing={ArrowRight}
        >
          Open the model evidence
        </Button>
      </details>
    )
  );
}

type ForecastSection = { id: string; label: string };

function ForecastNavigation({ sections }: { sections: ForecastSection[] }) {
  const [mobileSection, setMobileSection] = useState("");
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const activeSection = sections.some(({ id }) => id === active) ? active : sections[0]?.id;
  function navigate(id: string) {
    const target = document.getElementById(id);
    target?.focus();
    target?.scrollIntoView({ block: "start" });
    setActive(id);
  }
  return (
    <>
      <nav aria-label="Forecast sections" className="hidden flex-wrap items-center gap-3 md:flex">
        <span className="text-caption font-medium text-text-tertiary">On this page</span>
        {sections.map(({ id, label: name }) => (
          <Button
            key={id}
            aria-current={activeSection === id ? "location" : undefined}
            color="link-gray"
            size="sm"
            onPress={() => {
              navigate(id);
            }}
          >
            {name}
          </Button>
        ))}
      </nav>
      <details className="rounded-lg border border-border-hairline bg-surface-card px-3 md:hidden">
        <summary className="cursor-pointer py-2 text-sm font-medium text-action">
          On this page
        </summary>
        <label className="grid gap-1 pb-3 text-sm text-text-secondary">
          Jump to section
          <select
            aria-label="Jump to section"
            className={field}
            value={mobileSection}
            onChange={(event) => {
              const id = event.currentTarget.value;
              setMobileSection("");
              if (id) navigate(id);
            }}
          >
            <option value="">Choose a section</option>
            {sections.map(({ id, label: name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </details>
    </>
  );
}

function forecastSections(model: Model | undefined, hasCases: boolean): ForecastSection[] {
  return [
    ...(hasCases ? [{ id: "forecast-cases", label: "Cases" }] : []),
    ...(model ? [{ id: "forecast-model", label: "Cash flow model" }] : []),
    ...(model?.register ? [{ id: "forecast-assumptions", label: "Assumptions" }] : []),
    { id: "forecast-run-charts", label: "Run charts" },
  ];
}

function ForecastContent({
  model,
  selectedCase,
  source,
  handoff,
  href,
  view,
  run,
}: {
  model?: Model;
  selectedCase?: string;
  source: ((name: string) => ReactNode) | undefined;
  handoff: OutputEntry | undefined;
  href: (line: number) => string;
  view: ReturnType<typeof buildReportView>;
  run: PublishedRun;
}) {
  return (
    <>
      {model && (
        <div
          id="forecast-model"
          tabIndex={-1}
          className="scroll-mt-4 focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          <LegacyForecast
            model={model}
            selectedCase={selectedCase}
            source={source}
            summary={
              <CashProxy
                model={model}
                selectedCase={selectedCase}
                source={source?.("Cash proxy by scenario")}
                note={<BasisNote model={model} handoff={handoff} href={href} />}
              />
            }
          />
        </div>
      )}
      {model?.register && (
        <div
          id="forecast-assumptions"
          tabIndex={-1}
          className="scroll-mt-4 focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          <ForecastAssumptions model={model} handoff={handoff} run={run} href={href} />
        </div>
      )}
      <div
        id="forecast-run-charts"
        tabIndex={-1}
        className="scroll-mt-4 focus:outline-2 focus:outline-offset-2 focus:outline-focus"
      >
        <RunCharts view={view} folder={run.folder} />
      </div>
    </>
  );
}

export function Forecast({
  view,
  run,
}: {
  view: ReturnType<typeof buildReportView>;
  run: PublishedRun;
}) {
  const [selected, setSelected] = useState(0);
  const [chosenCase, setChosenCase] = useState("");
  const { models, entries } = view;
  const model = models[selected] ?? models[0];
  const caseOptions = model ? forecastCaseOptions(model) : [];
  const selectedCase = caseOptions.some(({ name }) => name === chosenCase)
    ? chosenCase
    : caseOptions[0]?.name;
  const handoff = model && forecastHandoff(model, entries, run.folder);
  const href = (line: number) =>
    handoff ? evidencePath(run.folder, handoff, line) : "#evidence/summary";
  const input = handoff && inputsLine(handoff);
  const source =
    input === undefined
      ? undefined
      : (name: string) => (
          <PublishedSource name={name} href={href(input)}>
            Forecast inputs
          </PublishedSource>
        );
  const sections = forecastSections(model, caseOptions.length > 1);
  return (
    <>
      <header className="grid gap-2">
        <h2 className="font-display text-h2">Forecast</h2>
        {model && (
          <Button
            className="w-fit"
            href="#evidence/summary"
            color="link-gray"
            size="sm"
            iconTrailing={ArrowRight}
          >
            Forecast evidence and artifacts
          </Button>
        )}
      </header>
      {!model && <p className={card}>No forecast model was published from this run’s files.</p>}
      {models.length > 1 && (
        <label className={`${label} max-w-xs`}>
          Published model
          <select
            className={field}
            value={selected}
            onChange={(event) => {
              setSelected(Number(event.target.value));
            }}
          >
            {models.map((item, index) => (
              <option value={index} key={item.id}>
                Model {index + 1}
                {item.mode ? ` · ${item.mode}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      {sections.length > 1 && <ForecastNavigation sections={sections} />}
      {model && <ForecastScope model={model} source={source} />}
      <ForecastCases
        caseOptions={caseOptions}
        selectedCase={selectedCase}
        setChosenCase={setChosenCase}
        source={source}
      />
      <ForecastContent
        model={model}
        selectedCase={selectedCase}
        source={source}
        handoff={handoff}
        href={href}
        view={view}
        run={run}
      />
    </>
  );
}
