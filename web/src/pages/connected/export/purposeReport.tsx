import type { ReactElement } from "react";
import { ScatterPlot } from "@/components/chart/ScatterPlot";
import { reportDate, scopeLabel } from "../issuerEntry";
import {
  classifySections,
  methodNote,
  readParagraph,
  readerText,
  runPathway,
  type Block,
  type OutputEntry,
  type PublishedRun,
  type Table,
} from "../publishedReport";
import { PublishedTable } from "../ReportContent";
import { unitCells } from "../report/moduleRecordsModel";
import {
  decisionTreatment,
  scopedLead,
  selectedOutput,
  UNAVAILABLE_DECISION,
  type SpecialistOverview,
} from "../report/frontPage";
import {
  PortfolioBasisProvider,
  usePortfolioBasis,
  usePortfolioBasisLoading,
} from "../report/PortfolioBasis";
import { namedTable, type ReportView } from "../reportView";
import { plainText, richParts } from "../richText";
import { LegacyVisuals } from "../visuals";
import { qualificationBlocks } from "../visuals/drawnQualifications";
import { portfolioLimits } from "../visuals/PortfolioLimits";
import { amount, distinct, rangeTicks } from "../visuals/visualData";
import { printableTable } from "./printTable";

type SafeText = (text: string) => string;
type PurposePassage = SpecialistOverview["findings"][number];
type Exhibit = { title: string; table: Table; notes: string[] };
/** `withheld` counts the module passages of this section that the reference check left out. */
type PurposeSection = { title: string; bodies: string[]; withheld?: number };
/** `withheld` is the same count for the decision's passages that no section below it counts. */
type Purpose = {
  title: string;
  decision: string[];
  withheld?: number;
  restrictions?: string[];
  charts?: ReactElement[];
  gap?: string;
  exhibits?: Exhibit[];
  passages?: PurposeSection[];
  overview?: SpecialistOverview;
};

type PurposeContents = (view: ReportView, run: PublishedRun, safe: SafeText) => Purpose | null;

function designatedPurposeView(view: ReportView, run: PublishedRun) {
  if (run.publicationVerified !== true || view.folder !== run.folder) return null;
  const entries = view.entries.filter(
    ({ output }) =>
      run.modules[output.module]?.default === output.id && /^[a-f0-9]{64}$/.test(output.sha256),
  );
  return { ...view, entries };
}

export function specialistOverview(
  view: ReportView,
  run: PublishedRun,
  safe: SafeText,
): SpecialistOverview | null {
  const selected = designatedPurposeView(view, run);
  if (!selected || !run.asOf || !reportDate(run.asOf)) return null;
  if (run.pathway === "relative_value") return relativeValue(selected, run, safe)?.overview ?? null;
  if (run.pathway === "portfolio_decision")
    return portfolioDecision(selected, run, safe)?.overview ?? null;
  return null;
}

export function purposeDocument(
  compose: PurposeContents,
  view: ReportView,
  run: PublishedRun,
  safe: SafeText,
) {
  const issuer = safe(view.catalogue?.name || run.issuerHeading || run.issuer);
  const date = run.asOf && reportDate(run.asOf);
  const selected = designatedPurposeView(view, run);
  if (!issuer || !date || !selected) return null;
  const purpose = compose(selected, run, safe);
  if (!purpose) return null;
  const period = safe(view.catalogue?.period || run.period);
  return {
    issuer,
    ticker: safe(view.catalogue?.ticker ?? ""),
    date,
    period: period === date || /^As of\s/i.test(period) ? "" : period,
    pathway: runPathway(run, view.catalogue),
    scope: scopeLabel(run),
    restrictions: purpose.restrictions ?? [],
    content: <PurposeReport purpose={purpose} />,
  };
}

function PurposeReport({ purpose }: { purpose: Purpose }) {
  const { title, decision, withheld = 0, restrictions, charts, gap, passages, exhibits } = purpose;
  return (
    <div className="issuer-front-page grid min-w-0 gap-5">
      <section className="issuer-front-page-decision grid gap-2 border-b border-border-hairline pb-4">
        <h2 className="font-display text-h2">{title}</h2>
        {restrictions
          ?.filter((label) => label !== title)
          .map((label) => (
            <p key={label} className="font-semibold">
              {label}
            </p>
          ))}
        {decision.map((body) => (
          <p key={body}>{richParts(body, readerText)}</p>
        ))}
        {withheld > 0 && <p>{withheldLine(withheld)}</p>}
      </section>
      {charts}
      {gap && <p>{gap}</p>}
      {exhibits?.map(({ title, table, notes }) => (
        <section key={title} className="grid min-w-0 gap-2">
          <h3 className="font-display text-h4">{title}</h3>
          {notes.map((note, at) => (
            // A table's section can hold the same paragraph twice; each is printed.
            <p key={at}>{richParts(note, readerText)}</p>
          ))}
          <PublishedTable table={table} heading={title} drawCell={unitCells(table)} />
        </section>
      ))}
      {passages?.map(
        ({ title, bodies, withheld = 0 }) =>
          (bodies.length > 0 || withheld > 0) && (
            <section key={title} className="issuer-front-page-passages grid gap-2">
              <h3 className="font-display text-h4">{title}</h3>
              {bodies.map((body) => (
                <p key={body}>{richParts(body, readerText)}</p>
              ))}
              {withheld > 0 && <p>{withheldLine(withheld)}</p>}
            </section>
          ),
      )}
    </div>
  );
}

function withheldLine(count: number) {
  const passages = count === 1 ? "passage in this section is" : "passages in this section are";
  return `${String(count)} ${passages} not shown in this report.`;
}

function locatedPassage(entry: OutputEntry, line: number, body: string): PurposePassage {
  const { id, module, sha256 } = entry.output;
  return { owner: { id, module, sha256 }, line, body };
}

/** The module's passages under the headings as written, method notes left out. */
function writtenPassages(entry: OutputEntry, headings: readonly string[]) {
  return classifySections(entry.sections)
    .filter(
      ({ role, section }) =>
        (role === "finding" || role === "passage") && headings.includes(section.heading),
    )
    .flatMap(({ section }) =>
      section.blocks.flatMap((block) => {
        if (block.type !== "text") return [];
        const { body } = readParagraph(block.text);
        return body && !methodNote(plainText(body))
          ? [locatedPassage(entry, block.line, body)]
          : [];
      }),
    );
}

/** The passages under the headings that pass the reference check, and how many it left out. */
function readPassages(entry: OutputEntry, headings: readonly string[], safe: SafeText) {
  const written = writtenPassages(entry, headings);
  const passages = written.filter(({ body }) => Boolean(safe(body)));
  return { passages, withheld: written.length - passages.length };
}

function sectionPassages(entry: OutputEntry, headings: readonly string[], safe: SafeText) {
  return readPassages(entry, headings, safe).passages;
}

/** A printed section of every passage under the headings, with the count that was left out. */
function passageSection(
  title: string,
  entry: OutputEntry | undefined,
  headings: readonly string[],
  safe: SafeText,
): PurposeSection {
  if (!entry) return { title, bodies: [] };
  const { passages, withheld } = readPassages(entry, headings, safe);
  return { title, bodies: passages.map(({ body }) => body), withheld };
}

type ChosenPassage = { body?: string; withheld: number };

/**
 * The one passage a module gives the lead or a one-passage section, and how many of its candidates
 * the reference check left out. The candidates are the run's published lead when it is this
 * module's, then the passages under each heading in the order the headings are given; the first
 * that passes the check is chosen. Both answers are read from this one list, so the count holds
 * neither a method note nor the passage that is printed.
 */
function chosenPassage(
  view: ReportView,
  run: PublishedRun,
  entry: OutputEntry | undefined,
  headings: readonly string[],
  safe: SafeText,
): ChosenPassage {
  if (!entry) return { withheld: 0 };
  const lead = scopedLead(view, run);
  const published =
    lead?.entry === entry && lead.passage.body !== null
      ? [{ line: lead.passage.line, body: lead.passage.body }]
      : [];
  const candidates = [
    ...published,
    ...headings
      .flatMap((heading) => writtenPassages(entry, [heading]))
      .filter(({ line }) => !published.some((passage) => passage.line === line)),
  ];
  const allowed = candidates.filter(({ body }) => Boolean(safe(body)));
  return { body: allowed[0]?.body, withheld: candidates.length - allowed.length };
}

/**
 * A module's one-passage section. The passage is printed here unless it is the report's lead, and
 * the count of the module's candidates that the check left out is printed here either way.
 */
function chosenSection(title: string, chosen: ChosenPassage, lead: string): PurposeSection {
  const { body, withheld } = chosen;
  return { title, bodies: body && body !== lead ? [body] : [], withheld };
}

function findingTable(
  entry: OutputEntry | undefined,
  heading: string,
  headers: readonly string[],
  assessment: "reader" | "legacy-comparator" | "legacy-rv" = "reader",
) {
  if (!entry) return undefined;
  let main = "";
  const sections = classifySections(entry.sections).flatMap(({ role, section }) => {
    if (section.level <= 2) main = section.level === 2 ? section.heading : "";
    if (role === "finding" || role === "drawing") return [section];
    if (
      assessment === "legacy-comparator" &&
      main === "Findings" &&
      entry.output.module === "CP-1B" &&
      section.level === 3 &&
      section.heading === "Financial performance / comparator register"
    )
      return [section];
    if (
      assessment === "legacy-rv" &&
      main === "Calculations" &&
      entry.output.module === "CP-3" &&
      section.level === 3 &&
      section.heading === "Conditional yield observations"
    )
      return [section];
    return [];
  });
  const table = namedTable({ ...entry, sections }, heading, headers);
  if (
    !table ||
    (assessment !== "reader" && table.headers.join("|") !== headers.join("|")) ||
    !table.rows.every((row) => row.cells.length === table.headers.length)
  )
    return undefined;
  const addresses = entry.sections
    .flatMap(({ blocks }) => blocks)
    .filter(({ type, line }) => type === "table" && line === table.line);
  return addresses.length === 1 ? table : undefined;
}

function exhibit(
  table: Table | undefined,
  title: string,
  safe: SafeText,
  note?: string,
  qualifications: readonly string[] = [],
  withhold = false,
): Exhibit[] {
  if (!table?.rows.length || table.headers.some((header) => !safe(header)) || (note && !safe(note)))
    return [];
  const released = qualifications.filter((body) => Boolean(safe(body)));
  const unresolved = withhold || released.length !== qualifications.length;
  const data = printableTable(table, unresolved).table;
  const rows = data.rows.map((row) =>
    row.cells.every((cell) => !cell.trim() || safe(cell))
      ? row
      : {
          ...row,
          cells: row.cells.map((cell, at) => (at === 0 && safe(cell) ? cell : "Withheld")),
        },
  );
  const notes = [...(note ? [note] : []), ...released];
  // Each sentence speaks only of what the page lacks. With no note printed over the table, that is
  // its basis; under a printed note it is the cells, which read "Withheld", and nothing is said of
  // the note.
  if (withhold)
    notes.push(
      notes.length
        ? 'This report does not show what the module wrote in the cells of this table that read "Withheld".'
        : "The observation basis for this table is not shown in this report.",
    );
  else if (unresolved)
    notes.push("Some observation qualifications are only available in Evidence.");
  return [{ title, table: { ...data, rows }, notes }];
}

function safeTable(table: Table, safe: SafeText) {
  return (
    table.headers.every((cell) => Boolean(safe(cell))) &&
    table.rows.every(({ cells }) => cells.every((cell) => !cell || Boolean(safe(cell))))
  );
}

function chartNotes(entry: OutputEntry, table: Table) {
  return qualificationBlocks(entry.sections, table.line)
    .map(({ text }) => readParagraph(typeof text === "string" ? text : "").body)
    .filter(Boolean);
}

function chartExhibit(
  entry: OutputEntry | undefined,
  heading: string,
  title: string,
  safe: SafeText,
) {
  const table = findingTable(entry, heading, []);
  return table && entry ? exhibit(table, title, safe, undefined, chartNotes(entry, table)) : [];
}

function ownerChart(entry: OutputEntry | undefined, heading: string, safe: SafeText) {
  const table = findingTable(entry, heading, []);
  if (!entry || !table) return [];
  const matches = [...(entry.output.charts ?? []), ...(entry.output.chartGaps ?? [])].filter(
    ({ table: line }) => line === table.line,
  );
  const [descriptor] = matches;
  if (
    matches.length !== 1 ||
    !descriptor ||
    typeof descriptor.title !== "string" ||
    !safe(descriptor.title) ||
    descriptor.kind === "limits"
  )
    return [];
  const clean = printableTable(table);
  const notes = chartNotes(entry, table);
  if (
    clean.withheld ||
    !safeTable(clean.table, safe) ||
    (typeof descriptor.unit === "string" && !safe(descriptor.unit)) ||
    (typeof descriptor.gap === "string" && !safe(descriptor.gap)) ||
    notes.some((body) => !safe(body))
  )
    return [];
  const sections = entry.sections
    .filter(({ heading: title }) => title === heading)
    .map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => (block === table ? clean.table : block)),
    }));
  return [
    <div key={heading} className="grid min-w-0 gap-2 break-inside-avoid">
      <LegacyVisuals
        output={{ charts: [descriptor] }}
        sections={sections}
        headingLevel="h3"
        print
      />
      {notes.filter(Boolean).map((body) => (
        <p key={body}>{richParts(body, readerText)}</p>
      ))}
    </div>,
  ];
}

function earlierScope(run: PublishedRun) {
  return (
    run.assessmentScope === "unverified" &&
    Boolean(run.history?.earlierFormat || run.history?.earlierMethods || run.methodChanges?.length)
  );
}

function legacyComparisonBasis(entry: OutputEntry) {
  const [request] = entry.sections.filter(
    ({ level, heading }) => level === 2 && heading === "Request",
  );
  // Only the archived owner’s period metadata belongs here. Its request and discussion are not drawn.
  const block = request?.blocks.find(
    (item): item is Extract<Block, { type: "text" }> =>
      item.type === "text" &&
      item.text.startsWith(
        "Compare the issuer's first fiscal-quarter results, preserving exact periods:",
      ),
  );
  return /current ([\s\S]+?\(\d+ inclusive days\)), prior ([\s\S]+?\(\d+ inclusive days\))\. Both are labelled thirteen weeks by the issuer\./.exec(
    block?.text ?? "",
  );
}

function legacyEarnings(entry: OutputEntry, safe: SafeText): Purpose | null {
  const table = findingTable(
    entry,
    "Financial performance / comparator register",
    ["Metric", "Prior", "Current", "Absolute change", "Change %", "Definition / source"],
    "legacy-comparator",
  );
  const basis = legacyComparisonBasis(entry);
  const basisNotes = readPassages(entry, ["Definition lock and top sheet"], safe);
  const definitions = basisNotes.passages
    .map(({ body }) => body)
    .find((body) => body.startsWith("Amounts are USD millions except reported percentages."));
  const locator = / \(H4 table \d+\)| \(text \d+\)/g;
  const mechanics = readPassages(
    entry,
    ["Variance mechanics and comparative credit evaluation"],
    (body) => safe(body.replace(locator, "")),
  );
  const variance = mechanics.passages.map(({ body }) => body.replace(locator, ""));
  const lead = variance.find((body) => body.startsWith("OCF increased"));
  const challenge = variance.find((body) => body.startsWith("The cash buffer nevertheless fell:"));
  if (!table || !basis?.[1] || !basis[2] || !definitions || !lead || !challenge) return null;
  const note =
    `USD millions except reported percentages. Prior ${basis[2]}. Current ${basis[1]}. Both are labelled thirteen weeks by the issuer.`.replace(
      /\s+/g,
      " ",
    );
  const headers = table.headers.map((name) =>
    name === "Definition / source" ? "Definition" : name,
  );
  const drivers = variance.filter((body) => body !== lead && body !== challenge);
  const monitoring = readPassages(
    entry,
    ["Monitoring and method changes justified by observed output"],
    safe,
  );
  return {
    title: "Earnings view",
    decision: [lead, challenge],
    gap: "No results chart is shown in this report.",
    exhibits: exhibit({ ...table, headers }, "Prior and current results", safe, note),
    passages: [
      { title: "Variance drivers and guidance", bodies: drivers, withheld: mechanics.withheld },
      {
        title: "Reporting basis and limitations",
        bodies: [definitions],
        withheld: basisNotes.withheld,
      },
      {
        title: "What to watch",
        bodies: monitoring.passages
          .map(({ body }) => body)
          .filter((body) => body.startsWith("Track dated cash after distributions")),
        withheld: monitoring.withheld,
      },
    ],
  };
}

export function earningsUpdate(
  view: ReportView,
  run: PublishedRun,
  safe: SafeText,
): Purpose | null {
  const entry = selectedOutput(view, "CP-1B");
  if (!entry) return null;
  const legacy = earlierScope(run) && legacyEarnings(entry, safe);
  if (legacy) return legacy;
  // This format has no bottom-line section, so the lead's own section carries the count.
  const { body: lead, withheld } = chosenPassage(view, run, entry, ["Bottom line"], safe);
  if (!lead) return null;
  const headings = ["Chart data: prior and current results", "Chart data: margin and KPI changes"];
  const charts = headings.flatMap((heading) => ownerChart(entry, heading, safe));
  return {
    title: "Earnings view",
    decision: [lead],
    withheld,
    charts,
    gap: charts.length ? undefined : "No results chart is shown in this report.",
    passages: [
      passageSection("Variance drivers and key findings", entry, ["Key findings"], safe),
      passageSection(
        "Contrary evidence and change triggers",
        entry,
        ["Contrary evidence and what would change the view"],
        safe,
      ),
      passageSection("Limitations", entry, ["Limitations"], safe),
    ],
    exhibits: headings.flatMap((heading) =>
      chartExhibit(entry, heading, heading.replace("Chart data: ", ""), safe),
    ),
  };
}

const ARCHIVED_RV_CLEAN =
  /^(Both securities: Requires More Work; RV Unclear\. Positive comparative work now establishes what the apparent compensation difference actually depends on\. If both annual equivalents are clean, July's maturity yield exceeds March's by \d+\.\d+bp, but the same-date Treasury-tenor adjustment leaves only \d+\.\d+bp of simple residual difference\. Source fair values are rounded to USDm: an analyst nearest-million display-precision sensitivity, varying each value independently by±\d+\.\d+USDm, makes the yield gap range from [−-]\d+\.\d+ to\d+\.\d+bp\. A precise ordering is not supported in that case\.)/;
const ARCHIVED_RV_DIRTY =
  /^(If both equivalents are dirty, July's extra yield is\d+\.\d+bp and simple residual difference\d+\.\d+bp; rounding alone leaves that yield ordering positive\. That is the strongest compensation countercase for July, but neither price basis nor executable depth is established\.)/;

function archivedPriceTrigger(entry: OutputEntry) {
  const table = findingTable(entry, "T3.9 — Observable monitoring triggers", [
    "Trigger",
    "Threshold / Signal",
    "Why It Matters",
    "Credit / RV Impact",
    "Evidence ID",
  ]);
  const signal = "Explicit accrued/clean/dirty convention plus unrounded same-time two-way levels";
  return table?.rows.some(
    ({ cells }) =>
      cells[0] === "RV01 Both actual price bases and precise values resolved" &&
      cells[1] === signal,
  )
    ? [signal]
    : [];
}

function archivedRelativeValue(
  view: ReportView,
  entry: OutputEntry,
  run: PublishedRun,
  safe: SafeText,
): Purpose | null {
  const table = findingTable(
    entry,
    "Conditional yield observations",
    ["Instrument", "Maturity", "Price basis", "Yield, %"],
    "legacy-rv",
  );
  const disposition = "Both securities: Requires More Work; RV Unclear.";
  const written = readPassages(entry, ["Security-selection view"], safe);
  const selection = written.passages.map((passage) => ({
    ...passage,
    body: plainText(passage.body),
  }));
  const held = selection.find(({ body }) => body.startsWith(disposition));
  if (!held || !table?.rows.length || !run.asOf) return null;
  const terms = findingTable(entry, "T3.5 — Relative value table", [
    "Security",
    "Market Level",
    "Market Date",
    "Quote Quality",
    "Seniority / Security",
  ]);
  const marks = archivedEvaluatedMarks(terms, run.asOf);
  if (
    !marks?.rows.length ||
    !table.rows.every(
      ({ cells: [instrument, maturity, basis, yieldValue] }) =>
        instrument &&
        maturity &&
        reportDate(maturity) &&
        (basis === "Assume clean" || basis === "Assume dirty") &&
        yieldValue &&
        amount(yieldValue) !== null &&
        marks.rows.some(({ cells }) => cells[0]?.split(" ").at(-1) === instrument),
    )
  )
    return null;
  const charts = archivedYieldFigures(table, safe);
  if (!charts.length) return null;
  const findings = [{ ...held, body: held.body.match(ARCHIVED_RV_CLEAN)?.[1] ?? disposition }];
  for (const passage of selection) {
    const body = passage.body.match(ARCHIVED_RV_DIRTY)?.[1];
    if (body && !findings.some(({ line }) => passage.line === line))
      findings.push({ ...passage, body });
  }
  const treatment = decisionTreatment(view, run, "CP-3", "instrument", safe);
  const status = treatment?.status ?? "unavailable";
  // The module's disposition is printed. With no recorded hold, no label says it is not shown.
  const label = status === "not shown" ? undefined : `Instrument preference ${status}`;
  const gap = "The entry level and executable yield curve are not shown in this report.";
  const hold = treatment?.status === "withheld" ? treatment.reason : "";
  return {
    title: label ?? "Market-implied view",
    decision: [...findings.map(({ body }) => body), ...(hold ? [hold] : [])],
    withheld: written.withheld,
    passages: [{ title: "What would change the view", bodies: archivedPriceTrigger(entry) }],
    restrictions: label ? [label] : [],
    overview: {
      title: "Published market comparison",
      findings,
      restriction: label ? { label, reason: hold || gap } : undefined,
    },
    charts,
    gap,
    exhibits: [
      ...exhibit(table, "Conditional yield observations", safe),
      ...exhibit(
        marks,
        "Issuer evaluated marks and security terms",
        safe,
        "Quote basis and executable depth are not shown in this report.",
      ),
    ],
  };
}

function maturityTicks(values: number[]) {
  const dates = [...new Set(values)].sort((a, b) => a - b);
  const first = dates[0];
  const last = dates.at(-1);
  if (first === undefined || last === undefined || !Number.isFinite(first + last)) return [];
  const pad = (last - first) / 6 || 86_400_000;
  return [
    { value: first - pad, label: "" },
    ...dates.map((value) => ({ value, label: new Date(value).toISOString().slice(0, 10) })),
    { value: last + pad, label: "" },
  ];
}

function archivedYieldFigures(table: Table, safe: SafeText) {
  if (!safeTable(table, safe)) return [];
  const points = table.rows.map(
    ({ cells: [instrument = "", maturity = "", basis = "", value = ""] }) => ({
      name: instrument,
      x: Date.parse(maturity),
      y: amount(value),
      xText: maturity,
      yText: value,
      basis,
    }),
  );
  const dates = [...new Set(points.map(({ x }) => x))].sort((a, b) => a - b);
  const cases = ["Assume clean", "Assume dirty"].map((basis) => ({
    basis,
    pair: points.filter((point) => point.basis === basis),
  }));
  const first = dates[0];
  const last = dates.at(-1);
  if (
    first === undefined ||
    last === undefined ||
    !Number.isFinite(first + last) ||
    dates.length !== 2 ||
    new Set(points.map(({ name, x }) => JSON.stringify([name, x]))).size !== 2 ||
    cases.some(
      ({ pair }) =>
        pair.length !== 2 ||
        !distinct(pair.map(({ name }) => name)) ||
        new Set(pair.map(({ x }) => x)).size !== 2 ||
        pair.some(({ y }) => y === null),
    )
  )
    return [];
  const xTicks = maturityTicks(dates);
  const yTicks = rangeTicks(points.map(({ y }) => y)).map(({ value }) => ({
    value,
    label: value.toFixed(2),
  }));
  return [
    <section key="conditional-maturity" className="grid min-w-0 gap-2">
      <h3 className="font-display text-h4">Conditional yield against maturity</h3>
      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        {cases.map(({ basis, pair }) => (
          <ScatterPlot
            key={basis}
            title={basis}
            othersName="Notes"
            x={{ title: "Maturity", short: "maturity", ticks: xTicks }}
            y={{ title: "Yield, %", short: "yield", ticks: yTicks }}
            points={pair}
            table={{
              head: ["Instrument", "Maturity", "Yield, %"],
              rows: pair.map(({ name, xText, yText }) => ({ label: name, cells: [xText, yText] })),
            }}
          />
        ))}
      </div>
    </section>,
  ];
}

function archivedEvaluatedMarks(table: Table | undefined, date: string): Table | undefined {
  if (!table) return undefined;
  const columns = ["Security", "Market Level", "Market Date", "Seniority / Security"].map((name) =>
    table.headers.indexOf(name),
  );
  const [security = -1, level = -1, observed = -1, rank = -1] = columns;
  const rows = table.rows.flatMap((row) => {
    const price = /^Evaluated(\d+\.\d+) per100;/.exec(row.cells[level] ?? "")?.[1];
    const instrument = row.cells[security] ?? "";
    const ranking = (row.cells[rank] ?? "").replace(/ per A\d+$/, "");
    if (
      !price ||
      row.cells[observed] !== date ||
      !/^[A-Z][a-z]+\d{4} [A-Z]{2}[A-Z0-9]{9}\d$/.test(instrument) ||
      ![
        "Parent senior unsecured; effective/structural subordination",
        "Parent senior unsecured; no equal-covenant/guarantee assumption",
      ].includes(ranking)
    )
      return [];
    return [{ line: row.line, cells: [instrument, price, date, ranking] }];
  });
  return {
    ...table,
    headers: ["Security", "Evaluated mark per 100", "Observation date", "Rank"],
    rows,
  };
}

const YIELD_HEADING = "Chart data: yield against maturity";
const YIELD_HEADERS = [
  "Instrument",
  "Maturity date",
  "Yield",
  "Spread",
  "Quote date",
  "Source class",
  "Reporting unit",
  "Basis and limitation",
];
// Only affirmative quote classes and standalone yield definitions are display fields.
const QUOTE_CLASSES = [
  "Issuer reported quote",
  "Dealer quote",
  "Exchange quote",
  "Evaluated quote",
];
const YIELD_BASES = ["Yield to maturity", "YTM", "Yield to worst", "YTW"];

function marketObservations(entry: OutputEntry, date: string, safe: SafeText) {
  const table = findingTable(entry, YIELD_HEADING, YIELD_HEADERS);
  if (!table || table.headers.join("|") !== YIELD_HEADERS.join("|")) return undefined;
  const section = entry.sections.find(({ blocks }) => blocks.includes(table));
  // The row basis is usable only when there is no additional qualification to interpret.
  if (
    !section ||
    section.blocks.some((block) => block.type === "text" && readParagraph(block.text).body)
  )
    return undefined;
  const rows = table.rows.flatMap(
    ({ line, cells: [instrument, maturity, value, , quote, source, unit, basis] }) => {
      if (
        !instrument ||
        !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(instrument) ||
        !maturity ||
        !reportDate(maturity) ||
        !quote ||
        !reportDate(quote) ||
        quote > date ||
        maturity < quote ||
        !value ||
        !/^-?\d+(?:\.\d+)?$/.test(value) ||
        amount(value) === null ||
        !source ||
        !QUOTE_CLASSES.includes(source) ||
        unit !== "%" ||
        !basis ||
        !YIELD_BASES.includes(basis)
      )
        return [];
      return [{ line, cells: [instrument, maturity, value, quote, source, unit, basis] }];
    },
  );
  const observations = {
    ...table,
    headers: YIELD_HEADERS.filter((header) => header !== "Spread"),
    rows,
  };
  return rows.length && safeTable(observations, safe)
    ? { table: observations, omitted: rows.length !== table.rows.length }
    : undefined;
}

function marketYieldChart(entry: OutputEntry, table: Table) {
  const [first] = table.rows;
  if (
    !first ||
    !table.rows.every(
      ({ cells }) =>
        cells[3] === first.cells[3] && cells[4] === first.cells[4] && cells[6] === first.cells[6],
    )
  )
    return [];
  const descriptors = [...(entry.output.charts ?? []), ...(entry.output.chartGaps ?? [])].filter(
    (descriptor) => descriptor.table === table.line,
  );
  const [descriptor] = descriptors;
  if (
    descriptors.length !== 1 ||
    descriptor?.kind !== "scatter" ||
    descriptor.gap ||
    descriptor.label !== 0 ||
    descriptor.date !== 1 ||
    descriptor.yield !== 2 ||
    descriptor.quoted !== 4 ||
    descriptor.source !== 5 ||
    descriptor.unit !== "%"
  )
    return [];
  const points = table.rows.map(({ cells: [name = "", xText = "", yText = ""] }) => ({
    name,
    x: Date.parse(xText),
    y: amount(yText),
    xText,
    yText,
  }));
  if (!distinct(points.map(({ name }) => name))) return [];
  const xTicks = maturityTicks(points.map(({ x }) => x));
  if (xTicks.length > 8) return [];
  return [
    <ScatterPlot
      key="dated-yield"
      as="h3"
      title="Dated yields against maturity"
      note={[first.cells[6], first.cells[3], first.cells[4]].join(" · ")}
      othersName="Notes"
      x={{ title: "Maturity date", short: "maturity", ticks: xTicks }}
      y={{ title: "Yield, %", short: "yield", ticks: rangeTicks(points.map(({ y }) => y)) }}
      points={points}
      table={{
        head: ["Instrument", "Maturity date", "Yield, %"],
        rows: points.map(({ name, xText, yText }) => ({ label: name, cells: [xText, yText] })),
      }}
    />,
  ];
}

export function relativeValue(view: ReportView, run: PublishedRun, safe: SafeText): Purpose | null {
  const market = selectedOutput(view, "CP-3D");
  const comparison = selectedOutput(view, "CP-3");
  if (!comparison) return null;
  const legacy = earlierScope(run) && archivedRelativeValue(view, comparison, run, safe);
  if (legacy) return legacy;
  if (!market || !run.asOf) return null;
  const observations = marketObservations(market, run.asOf, safe);
  if (!observations) return null;
  const treatment = decisionTreatment(view, run, "CP-3", "instrument", safe);
  const status = treatment?.status ?? "unavailable";
  const label = `Instrument preference ${status}`;
  const reason = treatment?.reason ?? UNAVAILABLE_DECISION;
  const findings = observations.table.rows
    .slice(0, 2)
    .flatMap(({ line, cells: [instrument, maturity, yieldValue, quoteDate, source, , basis] }) => {
      const body = [
        instrument,
        [yieldValue, "%"].join(""),
        basis,
        quoteDate,
        maturity && `Matures ${maturity}`,
        source,
      ]
        .filter(Boolean)
        .join(" · ");
      return safe(body) ? [locatedPassage(market, line, body)] : [];
    });
  return {
    title: status === "withheld" ? label : "Market-implied view",
    decision: [reason],
    restrictions: [label],
    overview: {
      title: "Dated market observations",
      findings,
      restriction: { label, reason, screenReason: treatment?.screenReason },
    },
    charts: marketYieldChart(market, observations.table),
    gap: observations.omitted
      ? "Other rows of the module's yield table are not shown in this report."
      : undefined,
    exhibits: exhibit(observations.table, "Dated market observations", safe),
  };
}

function publishedCharts(
  view: ReportView,
  choices: readonly (readonly [string, string])[],
  safe: SafeText,
) {
  return choices.flatMap(([module, heading]) =>
    ownerChart(selectedOutput(view, module), heading, safe),
  );
}

// The sentence a table note opens with when it states the reporting unit of the table's amounts.
const UNIT_NOTE = /^Amounts are .+? unless stated otherwise\./;

/**
 * The notes of a table and whether they release its amounts. The notes are every text block of the
 * table's own section that is not a method note, before and after the table, in published order.
 * They are printed all or none: none when one of them fails the reference check. A section that
 * holds a second table gives its text to neither, since nothing says which table a paragraph
 * qualifies. The amounts are released only with the notes, and only when the first of them opens
 * with the unit sentence.
 */
function tableNotes(entry: OutputEntry | undefined, table: Table | undefined, safe: SafeText) {
  const section = table && entry?.sections.find(({ blocks }) => blocks.includes(table));
  if (!section || section.blocks.filter(({ type }) => type === "table").length !== 1)
    return { notes: [], released: false };
  const notes = section.blocks.flatMap((block) => {
    if (block.type !== "text") return [];
    const { body } = readParagraph(block.text);
    return body && !methodNote(plainText(body)) ? [body] : [];
  });
  if (!notes.every((body) => Boolean(safe(body)))) return { notes: [], released: false };
  return { notes, released: UNIT_NOTE.test(plainText(notes[0] ?? "")) };
}

export function covenantRefinancing(
  view: ReportView,
  run: PublishedRun,
  safe: SafeText,
): Purpose | null {
  const cash = selectedOutput(view, "CP-2D");
  const funding = selectedOutput(view, "CP-3C");
  const legal = selectedOutput(view, "CP-4");
  const opening = chosenPassage(view, run, cash, ["Bottom line", "Liquidity view"], safe);
  const refinancing = chosenPassage(view, run, funding, ["Bottom line", "Funding gap view"], safe);
  const covenant = chosenPassage(view, run, legal, ["Bottom line"], safe);
  const lead = opening.body ?? refinancing.body ?? covenant.body;
  if (!lead) return null;
  const maturities = findingTable(funding, "Refinancing need by maturity", [
    "Local facility label",
    "June principal, USD m",
    "Inside 18-month horizon",
  ]);
  const runway = findingTable(cash, "Liquidity and cash runway", [
    "Decision driver",
    "Evidence-supported base",
  ]);
  // The runway table prints its notes only with its amounts. The funding-gap table prints notes
  // that pass the check even while its amounts are withheld for want of the unit sentence.
  const runwayNotes = tableNotes(cash, runway, safe);
  const scenarios = findingTable(cash, "Funding gap", [
    "Case / horizon",
    "Floor-preserving revolver requirement",
  ]);
  const scenarioNotes = tableNotes(cash, scenarios, safe);
  // The not-shown sentence is decided by the same lookups that draw the headroom chart and table.
  const headroomHeading = "Chart data: covenant headroom";
  const headroomChart = ownerChart(legal, headroomHeading, safe);
  const headroomTable = chartExhibit(legal, headroomHeading, "Covenant headroom", safe);
  const charts = [
    ...headroomChart,
    ...publishedCharts(
      view,
      [
        ["CP-3C", "Chart data: refinancing need"],
        ["CP-2D", "Chart data: liquidity bridge"],
      ],
      safe,
    ),
  ];
  return {
    title: "Funding and lender implications",
    decision: [lead],
    restrictions:
      headroomChart.length || headroomTable.length
        ? []
        : ["No covenant headroom table is shown in this report."],
    charts,
    gap: charts.length
      ? undefined
      : "No maturity, covenant headroom or liquidity chart is shown in this report.",
    exhibits: [
      ...exhibit(maturities, "Refinancing need by maturity", safe),
      ...exhibit(
        runway,
        "Liquidity and cash runway",
        safe,
        undefined,
        runwayNotes.released ? runwayNotes.notes : [],
        !runwayNotes.released,
      ),
      ...exhibit(
        scenarios,
        "Funding gap illustrations",
        safe,
        undefined,
        scenarioNotes.notes,
        !scenarioNotes.released,
      ),
      ...headroomTable,
    ],
    passages: [
      chosenSection("Liquidity view", opening, lead),
      chosenSection("Refinancing need", refinancing, lead),
      chosenSection("Covenant view", covenant, lead),
      passageSection(
        "Contrary evidence and funding risks",
        cash,
        [
          "Contrary evidence and what would change the view",
          "Assessment, pinch point and contrary case",
        ],
        safe,
      ),
      passageSection("Limitations", funding, ["Limitations"], safe),
    ],
  };
}

export function distressedRestructuring(
  view: ReportView,
  run: PublishedRun,
  safe: SafeText,
): Purpose | null {
  const downside = selectedOutput(view, "CP-2A");
  const workout = selectedOutput(view, "CP-4C");
  const opening = chosenPassage(view, run, downside, ["Bottom line", "Distress gate"], safe);
  const path = chosenPassage(view, run, workout, ["Bottom line"], safe);
  const lead = opening.body ?? path.body;
  if (!lead) return null;
  const stress = findingTable(downside, "Downside stress", [
    "Scenario and assumption",
    "FCF, USD thousand",
  ]);
  const breaks = findingTable(downside, "Break points", [
    "Rank / break",
    "EBITDA decline required",
  ]);
  // The not-shown sentence is decided by the same lookups that draw the recovery chart and table.
  const recoveryHeading = "Chart data: recovery by class";
  const recoveryChart = ownerChart(workout, recoveryHeading, safe);
  const recoveryTable = chartExhibit(workout, recoveryHeading, "Recovery by class", safe);
  const contrary = passageSection(
    "Contrary evidence and change triggers",
    downside,
    [
      "Contrary evidence and what would change the view",
      "Interpretation, causal sequence and strongest challenge",
    ],
    safe,
  );
  const charts = [
    ...recoveryChart,
    ...publishedCharts(
      view,
      [
        ["CP-4C", "Chart data: value allocation — scenario 1"],
        ["CP-4C", "Chart data: value allocation — scenario 2"],
        ["CP-4C", "Chart data: value allocation — scenario 3"],
        ["CP-2D", "Chart data: liquidity bridge"],
      ],
      safe,
    ),
  ];
  return {
    title: "Distress assessment",
    decision: [lead],
    restrictions: !workout
      ? ["No restructuring path section or class recovery table is shown in this report."]
      : recoveryChart.length || recoveryTable.length
        ? []
        : ["No class recovery table is shown in this report."],
    charts,
    gap: charts.length ? undefined : "A runway or recovery chart is not shown in this report.",
    exhibits: [
      ...exhibit(stress, "Historical downside stress", safe),
      ...exhibit(breaks, "Break points", safe),
      ...recoveryTable,
    ],
    passages: [
      chosenSection("Distress gate", opening, lead),
      chosenSection("Restructuring path", path, lead),
      passageSection("Downside view", downside, ["Downside view", "Key findings"], safe),
      {
        ...contrary,
        bodies: contrary.bodies.map((body) =>
          body.replace(/ The forward path belongs to the forecast consumer\.$/, ""),
        ),
      },
      passageSection("Limitations", downside, ["Limitations"], safe),
    ],
  };
}

function PortfolioExhibit({
  entry,
  run,
  table,
  notes,
}: {
  entry: OutputEntry;
  run: PublishedRun;
  table: Table;
  notes: string[];
}) {
  const basis = usePortfolioBasis();
  const waiting = usePortfolioBasisLoading();
  const observed =
    basis?.folder === run.folder &&
    basis.asOf === run.asOf &&
    basis.output === entry.output.id &&
    basis.sha256 === entry.output.sha256 &&
    Array.isArray(basis.tableLines) &&
    basis.tableLines.includes(table.line);
  const chart = observed
    ? portfolioLimits(
        {
          line: table.line,
          headers: table.headers,
          rows: table.rows.map(({ cells }) => cells),
          evidenceInDrawer: true,
        },
        basis,
        { title: "Portfolio exposure and limits", as: "h3" },
      )
    : null;
  if (waiting) return <p role="status">Checking portfolio evidence…</p>;
  if (!chart) return <p>The portfolio exposure and limits chart is not shown in this report.</p>;
  return (
    <section className="grid min-w-0 gap-2">
      {chart}
      {notes.map((body) => (
        <p key={body}>{richParts(body, readerText)}</p>
      ))}
    </section>
  );
}

// The historical fixture has a published, standalone current-exposure qualification.
// A free-form combined proposal/limit qualification has no verified way to separate the scopes.
function separableLimitBasis(text: string, date: string | null) {
  const known =
    /^Synthetic Compliance_Monitor snapshot as of (\d{4}-\d{2}-\d{2})\.(?: Proposal is illustrative\.)?$/.exec(
      text,
    );
  return known?.[1] === date;
}

function portfolioFigure(entry: OutputEntry, run: PublishedRun, safe: SafeText) {
  const heading = "Chart data: portfolio limits";
  const table = findingTable(entry, heading, [
    "Limit",
    "Current exposure",
    "Proposed exposure",
    "Limit value",
  ]);
  if (
    !table ||
    entry.output.charts?.filter(
      ({ table: line, kind, gap }) => line === table.line && kind === "limits" && !gap,
    ).length !== 1
  )
    return [];
  const clean = printableTable(table);
  const notes = chartNotes(entry, table);
  const basis = clean.table.headers.indexOf("Basis and limitation");
  if (
    clean.withheld ||
    !safeTable(clean.table, safe) ||
    !clean.table.rows.every(
      ({ cells }) =>
        ["Max single issuer exposure", "Max unrated exposure", "Single issuer", "Unrated"].includes(
          cells[0] ?? "",
        ) && separableLimitBasis(cells[basis] ?? "", run.asOf),
    ) ||
    notes.some((note) => !safe(note) || !separableLimitBasis(note, run.asOf))
  )
    return [];
  const proposal = clean.table.headers.indexOf("Proposed exposure");
  const rows = clean.table.rows.map((row) => ({
    ...row,
    cells: row.cells.map((cell, at) =>
      at === proposal
        ? "Withheld"
        : at === basis
          ? cell.replace(/ Proposal is illustrative\.$/, "")
          : cell,
    ),
  }));
  return [
    <PortfolioBasisProvider key={heading} folder={run.folder} enabled>
      <PortfolioExhibit entry={entry} run={run} table={{ ...clean.table, rows }} notes={notes} />
    </PortfolioBasisProvider>,
  ];
}

const PORTFOLIO_EXPOSURE =
  /^(LQD reported [\d,]+ USD par of five ARCC notes at a combined [\d,]+\.\d+ USD value, \d+\.\d+% of matching fund NAV\. This measures the named issuer's held exposure; a small NAV share alone does not prove unused capacity, diversification compliance or easy exit\. Two notes maturing in\d{4} account for [\d,]+\.\d+ USD, \d+\.\d+% of this issuer holding's value; this is the fund's ARCC maturity grouping, not ARCC's total refinancing wall\.)/;

const PORTFOLIO_STRESS =
  /^(A purely conditional\d+%-of-par recovery assumption implies a[\d,]+\.\d+ USD loss against the held market value, \d+\.\d+ fund-NAV basis points\. No fund loss budget is supplied, so this is loss transmission, not risk-budget utilization or an actual recovery forecast\.)/;

function selectedPortfolioPassage(position: OutputEntry, pattern: RegExp, safe: SafeText) {
  return sectionPassages(position, ["Portfolio view"], safe).flatMap((passage) => {
    const body = plainText(passage.body).match(pattern)?.[1];
    return body ? [{ ...passage, body }] : [];
  })[0];
}

const HOLDING_HEADERS = [
  "XML ordinal / CUSIP",
  "ISIN",
  "Maturity",
  "Reported coupon %",
  "Par USD",
  "Value USD",
  "Reported %NAV",
  "Value on loan USD",
];

function portfolioHoldings(position: OutputEntry, safe: SafeText) {
  const holdings = findingTable(
    position,
    "T3C.0 — Actual held-instrument evidence",
    HOLDING_HEADERS,
  );
  if (!holdings || holdings.headers.join("|") !== HOLDING_HEADERS.join("|")) return [];
  const rows = holdings.rows.flatMap(
    ({
      line,
      cells: [
        ,
        isin = "",
        maturity = "",
        coupon = "",
        par = "",
        value = "",
        exposure = "",
        loan = "",
      ],
    }) => {
      if (
        !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin) ||
        !reportDate(maturity) ||
        ![coupon, par, value, exposure].every((cell) => /^\d+(?:\.\d+)?$/.test(cell)) ||
        (!/^\d+(?:\.\d+)?$/.test(loan) && loan !== "0; source reports not on loan")
      )
        return [];
      return [{ line, cells: [isin, maturity, coupon, par, value, exposure, loan] }];
    },
  );
  return rows.length === holdings.rows.length
    ? exhibit(
        { ...holdings, headers: HOLDING_HEADERS.slice(1), rows },
        "Reported held positions",
        safe,
      )
    : [];
}

function hasDatedPortfolioEvidence(position: OutputEntry, date: string) {
  const inputs = findingTable(position, "T3C.1 — Portfolio Input Gate", [
    "Input",
    "Available / Missing",
    "Source",
    "Limitation",
    "Portfolio Impact",
  ]);
  if (inputs?.headers.join("|") !== "Input|Available / Missing|Source|Limitation|Portfolio Impact")
    return false;
  return (
    inputs.rows.filter(
      ({ cells }) =>
        cells[0] === "Holdings and denominator" &&
        cells[1] === `Available for${date}` &&
        cells[3] === "Historical fund report, not current trade inventory",
    ).length === 1
  );
}

function portfolioExposure(view: ReportView, safe: SafeText, requiredObservation?: string) {
  const position = selectedOutput(view, "CP-3");
  if (
    !position ||
    (requiredObservation && !hasDatedPortfolioEvidence(position, requiredObservation))
  )
    return null;
  const observed = selectedPortfolioPassage(position, PORTFOLIO_EXPOSURE, safe);
  const stress = selectedPortfolioPassage(position, PORTFOLIO_STRESS, safe);
  return {
    observed,
    exhibits: observed ? portfolioHoldings(position, safe) : [],
    conditions: stress ? [stress.body] : [],
    withheld: readPassages(position, ["Portfolio view"], safe).withheld,
  };
}

const COMMITTEE_CHALLENGES: Readonly<Record<string, string>> = {
  "Winner / why":
    "Neither wins: measured footprint/loss supports analysis, but no supported RV inclusion case or proved binding breach",
  "Most important Compliance evidence":
    "No dated governing cap/budget or executable evidence supports turning those measurements into permissible capacity",
  "Sizing constraint":
    "Exact Portfolio Constraint [Insufficient Information]; no fabricated hard cap or compliance state",
  "Follow-up before conviction":
    "First obtain matching compensation/basis and actual mandate/budget; then matching issuer downside/terms/funding and executable depth/operations.",
};

function archivedCommitteeChallenge(committee: OutputEntry, safe: SafeText) {
  const memo = findingTable(committee, "CIO Final Memo", [
    "Required element",
    "Terminal portfolio view for separate delivery",
  ]);
  if (memo?.headers.length !== 2) return [];
  return memo.rows.flatMap(({ line, cells: [label = "", body = ""] }) => {
    const challenge = Object.hasOwn(COMMITTEE_CHALLENGES, label)
      ? COMMITTEE_CHALLENGES[label]
      : undefined;
    if (!challenge || !safe(body)) return [];
    const trusted =
      body === challenge || body.startsWith(challenge + (challenge.endsWith(".") ? " " : "."));
    return trusted ? [locatedPassage(committee, line, challenge)] : [];
  });
}

const PORTFOLIO_DISPOSITION = "Final Sizing Posture: Requires More Work.";
const PORTFOLIO_EXPLANATION =
  "The decision is driven by real held exposure and conditional losses alongside missing same-date compensation, mandate, loss-budget and execution evidence, because known marked value and small NAV share do not establish permissible risk capacity or executable proceeds, which implies no supported portfolio implementation or new size.";

function archivedPortfolioDecision(entry: OutputEntry, safe: SafeText) {
  return sectionPassages(entry, ["Final Sizing Posture"], safe).flatMap((passage) => {
    const body = plainText(passage.body);
    if (body !== PORTFOLIO_DISPOSITION && !body.startsWith(PORTFOLIO_DISPOSITION + " ")) return [];
    const supported = PORTFOLIO_DISPOSITION + " " + PORTFOLIO_EXPLANATION;
    return [{ ...passage, body: body.startsWith(supported) ? supported : PORTFOLIO_DISPOSITION }];
  })[0];
}

type PortfolioChallenge = ReturnType<typeof archivedCommitteeChallenge>[number];

function portfolioRestriction(
  label: string | undefined,
  hold: string,
  constraint: PortfolioChallenge | undefined,
) {
  const source = constraint && { owner: constraint.owner, line: constraint.line };
  if (!label) {
    return constraint && { label: "Sizing constraint", reason: constraint.body, source };
  }
  if (hold) return { label, reason: hold };
  if (constraint) return { label, reason: constraint.body, source };
  return { label, reason: UNAVAILABLE_DECISION };
}

interface PortfolioParts {
  committee: OutputEntry;
  run: PublishedRun;
  safe: SafeText;
  archived: boolean;
  archive: ReturnType<typeof archivedPortfolioDecision>;
  position: ReturnType<typeof portfolioExposure>;
  hold: string;
  status: string;
}

function portfolioPurpose(parts: PortfolioParts): Purpose {
  const { committee, run, safe, archived, archive, position, hold, status } = parts;
  const challenge = archive ? archivedCommitteeChallenge(committee, safe) : [];
  const charts = portfolioFigure(committee, run, safe);
  const constraint = challenge.find(
    ({ body }) => body === COMMITTEE_CHALLENGES["Sizing constraint"],
  );
  const findings = [
    ...(archive ? [archive] : []),
    ...(position?.observed ? [position.observed] : []),
  ];
  // Only an archived disposition is printed with no recorded hold. Beside it, no label or reason
  // says the decision is not shown; the module's sizing-constraint row keeps its own label.
  const label = status === "not shown" ? undefined : `Portfolio action and size ${status}`;
  const restriction = portfolioRestriction(label, hold, constraint);
  const gap = "No portfolio limits chart is shown in this report.";
  const title = "Portfolio decision and sizing";
  // The decision is chosen from the archived posture passages and the exposure passages: those the
  // check left out are counted once, here, although the stress section reads the exposure passages
  // too.
  const posture = archived ? readPassages(committee, ["Final Sizing Posture"], safe).withheld : 0;
  return {
    title,
    decision: [...findings.map(({ body }) => body), ...(hold ? [hold] : [])],
    withheld: posture + (position?.withheld ?? 0),
    restrictions: label ? [label] : [],
    overview: { title, findings, restriction },
    charts,
    gap: charts.length ? undefined : gap,
    exhibits: position?.exhibits,
    passages: [
      {
        title: "Committee challenge and binding limits",
        bodies: challenge.map(({ body }) => body),
      },
      { title: "Conditional stress on reported exposure", bodies: position?.conditions ?? [] },
    ],
  };
}

export function portfolioDecision(
  view: ReportView,
  run: PublishedRun,
  safe: SafeText,
): Purpose | null {
  const committee = selectedOutput(view, "CP-6");
  if (!committee) return null;
  const archived = earlierScope(run);
  const archive = archived ? archivedPortfolioDecision(committee, safe) : undefined;
  const treatment = decisionTreatment(view, run, "CP-6", "committee", safe);
  const hold = treatment?.status === "withheld" ? treatment.reason : "";
  if (!archive && !hold) return null;
  const position = portfolioExposure(view, safe, archive ? undefined : (run.asOf ?? ""));
  const historicalFinding = archive?.body === PORTFOLIO_DISPOSITION + " " + PORTFOLIO_EXPLANATION;
  if (!historicalFinding && !position?.observed) return null;
  const status = treatment?.status ?? "unavailable";
  return portfolioPurpose({ committee, run, safe, archived, archive, position, hold, status });
}
