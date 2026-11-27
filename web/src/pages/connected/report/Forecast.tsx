import { orderPeriods } from "@/utils/periodOrder";
import { Button } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";
import { useState, type ReactNode } from "react";
import { moduleName } from "../api";
import { asOfDate } from "../runFigures";
import { field, label } from "../layout";
import {
  evidencePath,
  type OutputEntry,
  type PublishedRun,
  readerText,
  unitLabel,
  withUnit,
} from "../publishedReport";
import { namedRow, namedTable, type buildReportView } from "../reportView";
import { amount, items, record, stringsIn, word } from "../visuals/visualData";
import {
  baseQualifications,
  cashProxyCases,
  forecastCaseOptions,
  forecastCaseNames,
  gridOf,
} from "../visuals/LegacyForecast";
import { LeveragePath } from "../visuals/ForecastPath";
import { RunCharts } from "./RunCharts";
import { ForecastStatement } from "../visuals/ForecastStatement";
import { PublishedSource } from "./PublishedTrace";
import {
  forecastHandoff,
  forecastInput,
  forecastTraceContext,
  type ForecastSource,
} from "./ForecastRecord";
import {
  caseYears,
  cellsOf,
  cites,
  COVER_ON_EBITDA,
  earningsBasis,
  forecastMeasure,
  maturitySchedule,
  modelCases,
  modelLimitations,
  ON_EBITDA,
  readMeasure,
  absentText,
  type MeasureRead,
} from "./forecastData";
import { CaseFigure, ForecastHeader, ForecastStats, type CaseChoice } from "./ForecastHeader";
import { ModuleGap } from "./ForecastGaps";
import { WhatBreaks } from "./ForecastBreaks";
import { AssumptionsByCase } from "./ForecastAssumptions";
import { UsesOfCash } from "./ForecastCash";
import { PublishedModelTile, ScopeTile } from "./ForecastScopeTile";
import { Bento, GapNote, Tile } from "./overview/Tile";

type Model = ReturnType<typeof buildReportView>["models"][number];
type Replay = NonNullable<ReturnType<typeof buildReportView>["previewForecast"]>;
/** A model's recorded money unit: the currency code and "millions"
 * (docs/rulings/2026-11-16-reporting-currency-from-sources.md). */
const MILLIONS = /^[A-Z]{3} millions$/;

function recordedBridge(
  handoff: OutputEntry | undefined,
  units: unknown,
  fiscal: string | undefined,
  value: number | null | undefined,
  recordedValue: string,
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
  // Parsed numbers only check the arithmetic; the page draws the recorded strings as written.
  return {
    value: recordedValue,
    original: fcf.cells[3] ?? "",
    difference: inflow.cells[3] ?? "",
    unit,
    fcfLine: fcf.line,
    inflowLine: inflow.line,
  };
}

const LIMIT_IN_EVIDENCE = "This limit carries a reference; read it in Evidence.";

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
  const cases = grid && cashProxyCases(grid, null, forecastCaseNames(raw));
  const [baseObservation] = orderPeriods(
    (cases?.observations ?? []).filter(({ group }) => group === "Base case"),
    ({ period }) => period,
  ).ordered;
  const period = baseObservation?.period;
  const recordedValue =
    baseObservation?.cell?.status === "value" ? word(baseObservation.cell.exact) : "";
  const value = recordedValue ? amount(recordedValue) : null;
  const fiscal = period?.slice(0, -1);
  const bridge = recordedBridge(handoff, raw.units, fiscal, value, recordedValue);
  const words = readerText(limitation);
  return (
    <section className="grid min-w-0 gap-2 border-t border-border-hairline pt-3">
      <h4 className="text-small font-medium text-text-primary">
        {fiscal ? `${fiscal} base case basis` : "Model basis"}
      </h4>
      {bridge && (
        <p className="reading-copy text-body">
          The calculation gives <strong>{withUnit(bridge.value, bridge.unit)}</strong> cash proxy.
          The {moduleName("CP-2G")} gives <strong>{withUnit(bridge.original, bridge.unit)}</strong>{" "}
          free cash flow. The displayed difference is{" "}
          <strong>{withUnit(bridge.difference, bridge.unit)}</strong>.
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
      <p className="reading-copy text-body">{cites(words) ? LIMIT_IN_EVIDENCE : words}</p>
    </section>
  );
}

function PublishedModelSelect({
  models,
  selected,
  setSelected,
  asOf,
}: {
  models: Model[];
  selected: number;
  setSelected: (index: number) => void;
  asOf: PublishedRun["asOf"];
}) {
  if (models.length < 2) return null;
  // As written when it is not a real YYYY-MM-DD date (`asOfDate`).
  const date = asOf ? asOfDate(asOf) : "";
  return (
    <label className={`${label} max-w-xs`}>
      Published model
      <select
        className={`${field} min-h-8 max-[480px]:min-h-11`}
        value={selected}
        onChange={(event) => {
          setSelected(Number(event.target.value));
        }}
      >
        {models.map((item, index) => (
          <option value={index} key={item.id}>
            Model {index + 1}
            {` · ${
              forecastCaseOptions(item)
                .map(({ name }) => name)
                .join(", ") || "Cases not recorded"
            }`}
            {date && ` · ${date}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function forecastSources(
  model: Model | undefined,
  input: ReturnType<typeof forecastInput>,
  href: (line: number) => string,
  selectedCase: string | undefined,
): ForecastSource {
  const inputLimits = new Set(items(input?.value.scope_limits));
  return (name, selection = {}) => {
    const qualification = selection.recordedQualification;
    if (qualification !== undefined && !inputLimits.has(qualification)) {
      return (
        <PublishedSource
          name={name}
          href="#evidence/record/notes"
          linkLabel={`Read ${name} in Evidence Record`}
        >
          Read in Evidence Record
        </PublishedSource>
      );
    }
    if (!input || !model) return undefined;
    return (
      <PublishedSource
        name={name}
        href={href(input.line)}
        context={forecastTraceContext(model, input.value, name, {
          case: selectedCase,
          ...selection,
        })}
      >
        Forecast inputs
      </PublishedSource>
    );
  };
}

type View = ReturnType<typeof buildReportView>;
type Ready = { state: "ready"; entry: OutputEntry; descriptor: Record<string, unknown> };

/** A trace to one module's chart table, for a figure drawn from another module. */
function tableTrace(folder: string, source: Ready | { state: "gap" }, name: string) {
  if (source.state !== "ready") return undefined;
  const line = typeof source.descriptor.table === "number" ? source.descriptor.table : undefined;
  return (
    <PublishedSource
      href={evidencePath(folder, source.entry, line)}
      name={name}
      linkLabel={`Source for ${name}`}
    >
      View source
    </PublishedSource>
  );
}

const NET_LEVERAGE = /^Net leverage\b/u;
const LIQUIDITY = /^Accessible liquidity\b/u;
const CASH_PROXY_ROW = /^Cash proxy \(not issuer free cash flow\)$/u;
const COVER = /^Interest coverage\b/u;

/** The page's one reading of net leverage: the row on net debt over EBITDA. */
const readLeverage = (model: unknown) =>
  readMeasure(model, "net leverage", NET_LEVERAGE, {
    pattern: ON_EBITDA,
    basis: "net debt over EBITDA",
  });

/**
 * The cases the switch offers. A case is hatched only where the page reads a net leverage row and
 * the case has no figure on it, in the words the lead uses; where the page reads no row at all,
 * the lead says why and no case is hatched.
 */
function caseChoices(
  model: Model,
  options: ReturnType<typeof forecastCaseOptions>,
  read: MeasureRead,
): CaseChoice[] {
  const { measure } = read;
  const drawn = (group: string) =>
    measure?.cases.some(
      (item) => item.group === group && [...item.own.values()].some(({ value }) => value !== null),
    ) ?? false;
  const choice = (name: string, rawGroup: string): CaseChoice => {
    const hatched = measure !== null && !drawn(rawGroup);
    return hatched
      ? { name, rawGroup, hatched, absent: absentText(read, "this case") }
      : { name, rawGroup, hatched };
  };
  if (options.length) return options.map(({ name, rawGroup }) => choice(name, rawGroup));
  // Without a cash proxy row, the cases are the model's forecast column groups.
  return modelCases(model).map(({ name, group }) => choice(name, group));
}

function basisItems(model: Model, group?: string) {
  const units = word(record(model.cashflow).units);
  // The selected case's own forecast columns, whatever rows the model publishes.
  const { first, last } = caseYears(model, group);
  return [
    { label: "Earnings basis", value: earningsBasis(model) ?? "Not recorded" },
    { label: "Units", value: unitLabel(units) || "Units not recorded" },
    {
      label: "Forecast years",
      value:
        first && last
          ? `${first.label}${first.start ? ` (from ${first.start})` : ""} to ${last.label}${last.end ? ` (to ${last.end})` : ""}`
          : "Not recorded",
    },
  ];
}

function ModelTiles({
  model,
  view,
  run,
  group,
  caseName,
  selectedCase,
  input,
  handoff,
  href,
  source,
  select,
}: {
  model: Model;
  view: View;
  run: PublishedRun;
  group: string | undefined;
  caseName: string;
  selectedCase: string | undefined;
  input: ReturnType<typeof forecastInput>;
  handoff: OutputEntry | undefined;
  href: (line: number) => string;
  source: ForecastSource;
  select: ReactNode;
}) {
  const cashflow = record(model.cashflow);
  const leverage = readLeverage(model);
  const cover = readMeasure(model, "interest cover", COVER, {
    pattern: COVER_ON_EBITDA,
    basis: "EBITDA over interest",
  });
  const liquidity = readMeasure(model, "accessible liquidity", LIQUIDITY);
  const schedule = maturitySchedule(view);
  const scheduleTrace = tableTrace(run.folder, schedule.source, "the maturity schedule");
  const scheduleGap =
    schedule.reason && !schedule.years.length ? (
      <ModuleGap entry={schedule.source.entry}>{schedule.reason}</ModuleGap>
    ) : undefined;
  return (
    <>
      <ForecastStats
        view={view}
        folder={run.folder}
        leverage={leverage}
        cover={cover}
        group={group}
        caseName={caseName}
        source={source}
        basis={`${caseName} · ${earningsBasis(model) ?? "earnings basis not recorded"}`}
      />
      {/* The lead, assumptions, scope and published model beside what breaks and uses of cash,
          in a grid of their own: its last row takes any height the right column needs, so the
          left tiles sit one under another with no band between them. */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:col-span-12 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto_1fr]">
        <LeveragePath
          measure={leverage.measure}
          rows={leverage.rows}
          group={group}
          caseName={caseName}
          schedule={{ ...schedule, gap: scheduleGap, trace: scheduleTrace }}
          trace={
            leverage.measure
              ? source("Net leverage path", { row: leverage.measure.label, case: "" })
              : undefined
          }
        />

        {/* Beside the lead, the assumptions, the scope and the published model: what breaks
          and uses of cash. The page reads in this order at every width. */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-4 lg:row-span-4">
          <WhatBreaks
            view={view}
            folder={run.folder}
            liquidity={liquidity}
            group={group}
            caseName={caseName}
            source={source}
            schedule={{ ...schedule, entry: schedule.source.entry, trace: scheduleTrace }}
          />
          <UsesOfCash
            model={model}
            group={group}
            caseName={caseName}
            units={unitLabel(word(cashflow.units))}
            source={source}
          />
        </div>
        <AssumptionsByCase
          document={input?.value ?? null}
          source={source}
          caseNames={forecastCaseNames(cashflow)}
          downsideNote={stringsIn(cashflow.notes).find((note) =>
            note.startsWith("Downside case is"),
          )}
        />
        <ScopeTile
          model={model}
          source={source}
          note={<BasisNote model={model} handoff={handoff} href={href} />}
          register={Boolean(model.register)}
          limitations={modelLimitations(handoff)}
          limitationHref={href}
        />
        <PublishedModelTile model={model} folder={run.folder} select={select} />
      </div>
      <Tile
        span={12}
        label="Forecast grid"
        title="Forecast grid"
        kicker="Rows by measure, columns by year · only cells the model wrote; the others are the gap cell"
        className="lg:self-start"
        trace={
          <Button
            href="#evidence/record/notes"
            color="secondary"
            size="sm"
            iconTrailing={ArrowRight}
            className="min-h-8 flex-none max-[480px]:min-h-11"
          >
            Model notes and limitations
          </Button>
        }
      >
        <div
          id="forecast-model"
          tabIndex={-1}
          className="grid min-w-0 scroll-mt-4 gap-4 focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        >
          <ForecastStatement
            model={model}
            selectedCase={selectedCase}
            selectedRawGroup={group}
            source={source}
            chartedRows={[leverage.measure, cover.measure, liquidity.measure].flatMap((measure) =>
              measure ? [measure.label] : [],
            )}
          />
        </div>
      </Tile>
    </>
  );
}

/** The selected case's cash proxy cell for its period, as the model displays it. */
function caseDisplay(model: Model, group: string | undefined, period: string | undefined) {
  const measure = forecastMeasure(model, CASH_PROXY_ROW);
  return period && measure
    ? cellsOf(measure, group).find((cell) => cell.period === period)?.display
    : undefined;
}

const BASE_GROUP = "Base case";

function ForecastReplayTile({ folder, replay }: { folder: string; replay: Replay }) {
  const input = forecastInput(replay.handoff);
  const source: ForecastSource = (name) =>
    input && (
      <PublishedSource
        href={evidencePath(folder, replay.handoff, input.line)}
        name={`Retained inputs for ${name}`}
      >
        Retained forecast inputs
      </PublishedSource>
    );
  return (
    <Tile
      span={12}
      label="Forecast calculation replay"
      title="Forecast calculation replay"
      kicker="Test preview from the retained financial and forecast handoffs"
      trace={
        <PublishedSource
          href={evidencePath(folder, replay.handoff, replay.calculationLine)}
          name="Forecast handoff calculation"
        >
          Forecast handoff calculation
        </PublishedSource>
      }
    >
      <GapNote>{replay.reconciliation}</GapNote>
      <ForecastStatement model={{ cashflow: replay.cashflow }} source={source} />
    </Tile>
  );
}

export function Forecast({
  view,
  run,
  preview = false,
}: {
  view: View;
  run: PublishedRun;
  /** The deep-linked part of the page; the report shell focuses it. */
  section?: string;
  preview?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [chosenCase, setChosenCase] = useState("");
  const { models, entries } = view;
  const model = models[selected] ?? models[0];
  const replay = preview && !model ? view.previewForecast : undefined;
  const caseOptions = model ? forecastCaseOptions(model) : [];
  const leverage = model ? readLeverage(model) : null;
  const cases = model && leverage ? caseChoices(model, caseOptions, leverage) : [];
  // The case the reader chose; else the one the model marks as its base case; else the first listed.
  const current =
    cases.find(({ name }) => name === chosenCase) ??
    cases.find(({ rawGroup }) => rawGroup === BASE_GROUP) ??
    cases[0];
  const option = caseOptions.find(({ name }) => name === current?.name);
  const selectedCase = option?.name;
  // The selected case's raw group, resolved once here: two raw groups can share one label.
  const group = current?.rawGroup;
  const handoff = model && forecastHandoff(model, entries, run.folder);
  const href = (line: number) =>
    handoff ? evidencePath(run.folder, handoff, line) : "#evidence/summary";
  const input = forecastInput(handoff);
  const source = forecastSources(model, input, href, selectedCase);
  return (
    <Bento>
      <ForecastHeader
        run={run}
        view={view}
        preview={preview}
        handoff={handoff}
        cases={cases}
        current={current?.name}
        onSelect={setChosenCase}
        basis={model ? basisItems(model, group) : []}
        hasModel={Boolean(model)}
        caseFigure={
          model && caseOptions.length > 1 ? (
            <CaseFigure
              option={option}
              display={caseDisplay(model, group, option?.period)}
              notice={caseOptions[0]?.comparisonNotice}
              shownQualifications={baseQualifications(model)}
              source={source}
              handoff={handoff}
            />
          ) : undefined
        }
      >
        {!model && !replay && <GapNote>No forecast model was published for this run.</GapNote>}
        {model && !input && (
          <GapNote>
            The model could not be matched to a single readable record of its inputs. Check Evidence
            for the model and its sources.
          </GapNote>
        )}
      </ForecastHeader>
      {replay && <ForecastReplayTile folder={run.folder} replay={replay} />}
      {model && (
        <ModelTiles
          model={model}
          view={view}
          run={run}
          group={group}
          caseName={current?.name ?? "the published model"}
          selectedCase={selectedCase}
          input={input}
          handoff={handoff}
          href={href}
          source={source}
          select={
            <PublishedModelSelect
              models={models}
              selected={selected}
              setSelected={setSelected}
              asOf={run.asOf}
            />
          }
        />
      )}
      <div
        id="forecast-run-charts"
        tabIndex={-1}
        className="min-w-0 scroll-mt-4 rounded-ds-lg border border-border-subtle bg-surface-card p-5 focus:outline-2 focus:outline-offset-2 focus:outline-focus sm:p-6 lg:col-span-12"
      >
        <RunCharts view={view} folder={run.folder} />
      </div>
    </Bento>
  );
}
