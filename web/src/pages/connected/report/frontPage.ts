import { moduleName } from "../api";
import { issuerPassageBody, publishedLead, reportDate, scopeLabel } from "../issuerEntry";
import {
  blocked,
  classifySections,
  containsReference,
  methodNote,
  readParagraph,
  readerText,
  runPathway,
  withUnit,
  type Block,
  type OutputEntry,
  type PublishedRun,
  type Section,
  type Table,
} from "../publishedReport";
import { differingAgencies } from "./IdentityBand";
import { plainText } from "../richText";
import { foundationMetrics, namedRow, namedTable, type ReportView } from "../reportView";

type TextBlock = Extract<Block, { type: "text" }>;
type Owner = Pick<OutputEntry["output"], "id" | "sha256" | "module">;
type Passage = { owner: Owner; line: number; body: string | null };
export type SpecialistOverview = {
  title: string;
  findings: (Omit<Passage, "body"> & { body: string })[];
  /** `screenReason` is the reason as it reads on a screen page, where it differs from the PDF's. */
  restriction?: {
    label: string;
    reason: string;
    screenReason?: string;
    source?: Omit<Passage, "body">;
  };
};
type OwnedTable = { owner: Owner; table: Table; title: string; qualification?: Passage };
type Figure = {
  title: string;
  owner?: Owner;
  table?: Table;
  sections?: Section[];
  descriptor?: NonNullable<OutputEntry["output"]["charts"]>[number];
  gap?: string;
};
type Headline = {
  category: string;
  label: string;
  value: string;
  period: string;
  prior?: { value: string; period: string };
  basis?: string;
  owner: Owner;
  line: number;
};
type DecisionStatus = "withheld" | "not shown" | "unavailable";
export type Action = {
  module: "CP-3" | "CP-6";
  label: string;
  reason: string;
  screenReason?: string;
  status: DecisionStatus;
  held: boolean;
  owner?: Owner;
};

export function selectedOutput(view: ReportView, module: string, allowBlocked = false) {
  const matches = view.entries.filter((entry) => entry.selected && entry.output.module === module);
  const [entry] = matches;
  if (matches.length !== 1 || !entry) return undefined;
  return allowBlocked ||
    (!entry.output.parseError && entry.output.state?.declared !== "Blocked" && !blocked(entry))
    ? entry
    : undefined;
}

// A PDF holds no module page, so there the decision is not shown in the report at all.
const NOT_SHOWN_DECISION =
  "This decision is not shown in this report because no clearance for it is recorded.";
export const UNAVAILABLE_DECISION = "A published decision is unavailable for this run.";

type DecisionTreatment = {
  status: DecisionStatus;
  /** The reason as a PDF prints it. */
  reason: string;
  /** The reason as a screen page draws it, where the same report has the module's own page. */
  screenReason?: string;
  /** A hold is recorded for this output, whether or not its reason can be printed. */
  held: boolean;
  entry: OutputEntry;
};

/**
 * How a CP-3 or CP-6 decision is described: a recorded hold with a printable reason is withheld;
 * a readable, unblocked, non-empty output with no recorded hold is not shown; any other selected
 * output (blocked, unparsed, empty, or a hold whose reason cannot be printed) is unavailable.
 */
export function decisionTreatment(
  view: ReportView,
  run: PublishedRun,
  code: "CP-3" | "CP-6",
  scope: "instrument" | "committee",
  printable: (reason: string) => string,
): DecisionTreatment | undefined {
  const entry = selectedOutput(view, code, true);
  if (!entry) return undefined;
  const hold = run.actionTreatment?.[code];
  const held =
    hold?.state === "withheld" &&
    hold.scope === scope &&
    hold.output === entry.output.id &&
    hold.sha256 === entry.output.sha256;
  const reason = held ? printable(hold.reason) : "";
  if (reason) return { status: "withheld", reason, held, entry };
  const readable =
    selectedOutput(view, code) === entry && entry.sections.some(({ blocks }) => blocks.length);
  if (held || !readable)
    return { status: "unavailable", reason: UNAVAILABLE_DECISION, held, entry };
  // Overview lists no bottom line for this module, but an unheld module's limitations stay in its
  // list and can state the decision: the screen sentence names only the passage the page leaves out.
  const name = moduleName(code, run.pathway);
  return {
    status: "not shown",
    reason: NOT_SHOWN_DECISION,
    screenReason: `This page does not show a bottom line for the ${name} module, because no clearance for it is recorded. Its other passages, such as its limitations, may be shown here; the ${name} page shows its findings.`,
    held,
    entry,
  };
}

function ownerOf({ output: { id, sha256, module } }: OutputEntry): Owner {
  return { id, sha256, module };
}

function findingSections(entry: OutputEntry, headings: readonly string[]) {
  return classifySections(entry.sections).flatMap(({ section, role }) =>
    (role === "finding" || role === "passage") &&
    section.level === 3 &&
    headings.includes(section.heading)
      ? [section]
      : [],
  );
}

function frontTable(entry: OutputEntry, heading: string, headers: readonly string[]) {
  let parent: string | undefined;
  const sections = classifySections(entry.sections).flatMap(({ section, role }) => {
    if (section.level <= 2) parent = section.level === 2 ? section.heading : undefined;
    if (section.heading !== heading) return [];
    const summary = heading === "Reader summary" && section.level === 3 && parent === "Findings";
    return role === "finding" || role === "drawing" || summary ? [section] : [];
  });
  const table = namedTable({ ...entry, sections }, heading, headers);
  if (!table) return undefined;
  const owners = entry.sections.flatMap(({ blocks }) =>
    blocks.filter((block) => block.type === "table" && block.line === table.line),
  );
  return owners.length === 1 ? table : undefined;
}

function passage(entry: OutputEntry, block: TextBlock): Passage {
  const text = issuerPassageBody(block.text);
  return {
    owner: ownerOf(entry),
    line: block.line,
    body: containsReference(plainText(text)) ? null : text,
  };
}

export function scopedLead(view: ReportView, run: PublishedRun) {
  if (view.folder !== run.folder) return undefined;
  const lead = publishedLead(run);
  if (!lead) return undefined;
  const entry = selectedOutput(view, lead.module);
  if (!entry || entry.output.id !== lead.output || entry.output.sha256 !== lead.sha256)
    return undefined;
  const sections = classifySections(entry.sections).filter(
    ({ section, role }) => section.level === 3 && (role === "passage" || role === "finding"),
  );
  const exact = sections
    .flatMap(({ section }) => section.blocks)
    .filter(
      (block): block is TextBlock =>
        block.type === "text" && block.line === lead.line && block.text === lead.text,
    );
  return exact.length === 1 && exact[0] ? { entry, passage: passage(entry, exact[0]) } : undefined;
}

function sectionPassages(entry: OutputEntry, headings: readonly string[]) {
  return findingSections(entry, headings).flatMap(({ blocks }) =>
    blocks.flatMap((block) => {
      if (block.type !== "text") return [];
      const { body } = readParagraph(block.text);
      return body && !methodNote(plainText(body)) ? [passage(entry, block)] : [];
    }),
  );
}

function frontLimitations(entry: OutputEntry) {
  const published = sectionPassages(entry, ["Limitations"]);
  if (published.length || !entry.output.summary?.limitation) return published;
  const { limitation, line } = entry.output.summary;
  const table = frontTable(entry, "Reader summary", ["Main limitation"]);
  const column = table?.headers.indexOf("Main limitation") ?? -1;
  const matches = table?.rows.filter(
    (row) => row.line === line && row.cells[column] === limitation,
  );
  return matches?.length === 1
    ? [
        {
          owner: ownerOf(entry),
          line,
          body: containsReference(plainText(limitation)) ? null : limitation,
        },
      ]
    : [];
}

function authoredSummary(entry: OutputEntry) {
  const summary = entry.output.summary;
  if (!summary?.bottomLine) return undefined;
  const body = plainText(summary.bottomLine);
  if (containsReference(body) || methodNote(body)) return undefined;
  const table = frontTable(entry, "Reader summary", ["Bottom line", "Main limitation"]);
  const column = table?.headers.indexOf("Bottom line") ?? -1;
  const row = namedRow(
    table,
    ({ cells, line }) => line === summary.line && cells[column] === summary.bottomLine,
  );
  return row && { owner: ownerOf(entry), line: row.line, body: summary.bottomLine };
}

function readyField(text?: string) {
  return text?.trim() &&
    !/^(?:unknown|not (?:supplied|available|established|disclosed)|n\/a|—)(?:$|[:.\s])/i.test(
      text,
    ) &&
    !containsReference(plainText(text))
    ? text
    : undefined;
}

function companyProfile(entry: OutputEntry | undefined) {
  if (!entry) return {};
  const table = frontTable(entry, "company_description — issuer profile", [
    "Business description",
    "Country",
    "Sector",
  ]);
  const row = table?.rows.length === 1 ? table.rows[0] : undefined;
  const owner = ownerOf(entry);
  if (table && row) {
    const get = (key: string) => readyField(row.cells[table.headers.indexOf(key)]);
    const body = get("Business description");
    return {
      description: body && { owner, line: row.line, body },
      country: get("Country"),
      sector: get("Sector"),
    };
  }
  const old = frontTable(entry, "Company profile", ["Area", "Category", "Located evidence / fact"]);
  const fact = (name: string) =>
    namedRow(old, ({ cells }) => cells[0] === name && cells[1] === "Documentary Fact");
  const business = fact("Business description");
  const sourceText = business?.cells[2] ?? "";
  // The quotation is the filed description. The adjacent page pointer and analyst view stay in Evidence.
  const body = readyField(/^[A-Z] page:? \d+:\s*[“"]([^”"]+)[”"]/.exec(sourceText)?.[1]);
  const place = fact("Country and legal domicile");
  const country = readyField(/^([\p{L} -]+);/u.exec(place?.cells[2] ?? "")?.[1]);
  const sectorFact = namedRow(
    old,
    ({ cells }) => cells[0] === "Sector" && cells[1] === "Analyst Interpretation",
  );
  const sector = readyField(
    /^([\p{L} &/-]+), supported by /u.exec(sectorFact?.cells[2] ?? "")?.[1],
  );
  const equity = fact("Public equity and parent/subsidiary ownership");
  const ownership = readyField(
    /^Public shareholders own the listed parent(?=;|\.)/.exec(equity?.cells[3] ?? "")?.[0],
  );
  return {
    description: business && body ? { owner, line: business.line, body } : undefined,
    country,
    sector,
    countrySource: place && country ? { owner, line: place.line } : undefined,
    sectorSource: sectorFact && sector ? { owner, line: sectorFact.line } : undefined,
    ownership: equity && ownership ? { owner, line: equity.line, body: ownership } : undefined,
  };
}

const chartChoices = [
  ["Chart data: leverage", "Leverage"],
  ["Chart data: debt maturities", "Debt maturities"],
  ["Chart data: liquidity", "Liquidity"],
  ["Chart data: interest cover", "Interest coverage"],
] as const;

function figureFor(
  entry: OutputEntry | undefined,
  [heading, title]: readonly [string, string],
): Figure {
  if (!entry) return { title };
  const tables = classifySections(entry.sections)
    .filter(({ role, section }) => role === "drawing" && section.heading === heading)
    .flatMap(({ section }) =>
      section.blocks.filter((block): block is Table => block.type === "table"),
    );
  const [table] = tables;
  if (!table || tables.length !== 1) return { title };
  const line = table.line;
  const owners = entry.sections.filter(({ blocks }) =>
    blocks.some((block) => block.type === "table" && block.line === line),
  );
  if (owners.length !== 1 || !owners[0]) return { title };
  const fields = [...(entry.output.charts ?? []), ...(entry.output.chartGaps ?? [])];
  const candidates = fields.filter(
    (field) => field.table === line && typeof field.title === "string" && field.title.trim(),
  );
  const chosen = candidates.length === 1 ? candidates[0] : undefined;
  return {
    title,
    owner: ownerOf(entry),
    table,
    sections: owners,
    descriptor: chosen,
    gap: typeof chosen?.gap === "string" ? chosen.gap : undefined,
  };
}

function snapshotFigures(entry?: OutputEntry) {
  const [leverage, maturities, liquidity, coverage] = chartChoices.map((choice) =>
    figureFor(entry, choice),
  );
  const usefulLiquidity = liquidity?.descriptor && !liquidity.gap;
  const usefulCoverage = coverage?.descriptor && !coverage.gap;
  return [leverage, maturities, usefulLiquidity || !usefulCoverage ? liquidity : coverage].filter(
    (chart): chart is Figure => Boolean(chart),
  );
}

const financialRows: readonly [string, RegExp][] = [
  ["Revenue", /^(?:Revenue|Net revenues?|Net sales)$/i],
  ["Adjusted EBITDA", /^(?:Adjusted EBITDA|EBITDA As Defined)$/i],
  ["Free cash flow", /^(?:(?:Levered )?free cash flow|FCF: CFO less capex)(?: \(|$)/i],
  ["Net leverage", /^Net debt \/ (?:(?:adjusted|reported) )?EBITDA$/i],
  [
    "Interest coverage",
    /^(?:Adjusted )?EBITDA \/ cash interest$|^Reported EBITDA \/ net cash interest paid$/i,
  ],
  ["Accessible liquidity", /^Accessible liquidity$/i],
];

const MONEY_UNIT = /^(?:US\$|[A-Z]{3})(?:m| (?:thousands?|millions?|billions?))$/;
const BARE_NUMBER = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
const INLINE_MONEY =
  /^\(?[−-]?(?:US\$|[A-Z]{3} |[£€])\s*(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?(?:\s*(?:m|bn|thousands?|millions?|billions?))?\)?$/;
const INLINE_RATIO = /^[−-]?\d+(?:\.\d+)?x$/;

function displayFinancialAmount(figure: string, unit: string, ratio: boolean) {
  const compatible = ratio ? unit === "x" : MONEY_UNIT.test(unit);
  if (unit && !compatible) return undefined;
  if (BARE_NUMBER.test(figure)) return compatible ? withUnit(figure, unit) : undefined;
  return (ratio ? INLINE_RATIO : INLINE_MONEY).test(figure) ? figure : undefined;
}

function financialProfile(entry: OutputEntry): OwnedTable | undefined {
  const table = frontTable(entry, "Financials and credit metrics", ["Metric"]);
  if (!table) return undefined;
  const metricIndex = table.headers.indexOf("Metric");
  const rows = table.rows.filter(({ cells }) =>
    financialRows.some(([, match]) => match.test(cells[metricIndex] ?? "")),
  );
  if (!rows.length) return undefined;
  return {
    title: "Financial period grid",
    owner: ownerOf(entry),
    table: { ...table, rows },
    qualification: sectionPassages(entry, ["Financials and credit metrics"])[0],
  };
}

function datedColumn(table: Table, date: string | null | undefined) {
  if (!date || !reportDate(date)) return undefined;
  const dated = table.headers.flatMap((header, index) =>
    header === date ||
    header === `FY${date.slice(0, 4)} / ${date}` ||
    header === `Rolling reported periods to ${date}`
      ? [index]
      : [],
  );
  return dated.length === 1 ? dated[0] : undefined;
}

function priorFiscalColumn(table: Table, current: number | undefined) {
  if (current === undefined) return undefined;
  const year = /^FY(\d{4}) \/ \d{4}-\d{2}-\d{2}$/.exec(table.headers[current] ?? "")?.[1];
  if (!year) return undefined;
  const label = `FY${String(Number(year) - 1)}`;
  const matches = table.headers.flatMap((name, at) =>
    name === label || (name.startsWith(`${label} / `) && reportDate(name.slice(-10))) ? [at] : [],
  );
  return matches.length === 1 ? matches[0] : undefined;
}

function matrixFigures(
  profile: OwnedTable | undefined,
  view: ReportView,
  asOf: PublishedRun["asOf"],
): Headline[] {
  if (!profile) return [];
  const { table, owner } = profile;
  const metricIndex = table.headers.indexOf("Metric");
  const periods = table.headers.indexOf("Period");
  const amounts = table.headers.indexOf("Amount / ratio");
  const units = table.headers.indexOf("Unit");
  const basisIndex = table.headers.findIndex(
    (header) =>
      header === "Basis and limitation" ||
      header === "Basis and source" ||
      header === "Status, definition and evidence",
  );
  const observed = view.catalogue?.metrics.cash?.period;
  const dated = datedColumn(table, asOf) ?? datedColumn(table, observed);
  const prior = priorFiscalColumn(table, dated);
  const declaredUSD = profile.qualification?.body?.startsWith(
    "Monetary cells above are USD millions except ratios.",
  );
  return financialRows.flatMap(([label, match]): Headline[] => {
    const rows = table.rows.filter(({ cells }) => match.test(cells[metricIndex] ?? ""));
    const [row] = rows;
    if (rows.length !== 1 || !row) return [];
    const names = row.cells;
    const figure = amounts >= 0 ? names[amounts] : dated === undefined ? undefined : names[dated];
    const period =
      periods >= 0 ? names[periods] : dated === undefined ? undefined : table.headers[dated];
    if (!figure || !period || containsReference(figure)) return [];
    const ratio = label === "Net leverage" || label === "Interest coverage";
    const unit = names[units] ?? (declaredUSD ? (ratio ? "x" : "US$m") : "");
    const value = displayFinancialAmount(figure, unit, ratio);
    if (!value) return [];
    const priorValue =
      prior === undefined ? undefined : displayFinancialAmount(names[prior] ?? "", unit, ratio);
    const priorPeriod = prior === undefined ? undefined : table.headers[prior];
    return [
      {
        category: label,
        label: names[metricIndex] ?? label,
        value,
        period,
        prior: priorValue && priorPeriod ? { value: priorValue, period: priorPeriod } : undefined,
        basis: names[basisIndex],
        owner,
        line: row.line,
      },
    ];
  });
}

const foundationLabels: Readonly<Record<string, string>> = {
  freeCashFlow: "Free cash flow",
  interestCover: "Interest coverage",
};

function headlines(
  entry: OutputEntry,
  profile: OwnedTable | undefined,
  view: ReportView,
  asOf: PublishedRun["asOf"],
) {
  if (!profile) return [];
  const matrix = matrixFigures(profile, view, asOf);
  const existing = foundationMetrics(entry, view.catalogue).flatMap(
    ({ key, metric, line }): Headline[] => {
      const category = foundationLabels[key];
      if (
        !category ||
        line === undefined ||
        matrix.some((item) => item.category === category) ||
        metric.value?.kind !== "value"
      )
        return [];
      return [
        {
          category,
          label: metric.label,
          value: metric.value.text,
          period: metric.note,
          owner: ownerOf(entry),
          line,
        },
      ];
    },
  );
  return [...matrix, ...existing];
}

function instrumentTable(entry?: OutputEntry): OwnedTable | undefined {
  if (!entry) return undefined;
  const headings = [
    "Debt, financing and liquidity foundation",
    "Reported debt and facility register",
    "Chart data: debt stack",
  ];
  for (const heading of headings) {
    const table =
      frontTable(entry, heading, ["Facility", "Ranking"]) ??
      frontTable(entry, heading, ["Debt instrument / component", "Maturity / rate reported"]);
    if (table?.rows.some(({ cells }) => cells[0]?.trim() && !/^Not supplied:/i.test(cells[0]))) {
      // Security facts retain precisely the columns stated per instrument. No cross-register join.
      const facts =
        /^(?:Facility|Ranking|Secured|Reporting unit|Basis and limitation|Debt instrument \/ component|Maturity \/ rate reported)$/;
      const nominal = /^(?:Amount|(?:Gross|Net) amount \d{4}-\d{2}-\d{2})$/;
      const unitIndex = table.headers.indexOf("Reporting unit");
      const columns = table.headers.flatMap((name, at) =>
        facts.test(name) || (unitIndex >= 0 && nominal.test(name)) ? [at] : [],
      );
      return {
        owner: ownerOf(entry),
        title: "Debt instruments",
        table: {
          ...table,
          headers: columns.map((at) => table.headers[at] ?? ""),
          rows: table.rows.map(({ line, cells }) => ({
            line,
            cells: columns.map((at) => {
              const value = cells[at] ?? "";
              const unit = cells[unitIndex] ?? "";
              if (
                !nominal.test(table.headers[at] ?? "") ||
                !value ||
                /^(?:Not (?:supplied|calculable|established):|—)/.test(value) ||
                MONEY_UNIT.test(unit)
              )
                return value;
              return "Reporting unit unavailable";
            }),
          })),
        },
      };
    }
  }
  return undefined;
}

const DEBT_FOUNDATION = "Debt, financing and liquidity foundation";
const LEGACY_TOTAL = "Total funded debt including receivables facility";
const RECEIVABLES = "Short-term borrowings—trade receivable securitization facility";
const FACILITIES = new Set([
  RECEIVABLES,
  "Term loans",
  "Government refundable advances",
  "Finance lease obligations",
]);
const DEBT_INTEGER = /^(?:\d+|\d{1,3}(?:,\d{3})+)$/;
const NOTE_NAME = /^(?:\d+(?:\.\d+)?% \d{4} Notes|\d{4} Secured Notes)$/;
const DEBT_SUBTOTALS = new Set([
  "Long-term-debt block before current classification",
  "Less: current portion",
  "Long-term debt",
]);

function legacyDebtBasis(entry: OutputEntry, issuer: string, total: string) {
  const conventions = classifySections(entry.sections).filter(
    ({ role, section }) =>
      role === "calculations" && section.heading === "Calculation conventions and trace",
  );
  if (conventions.length !== 1) return undefined;
  const [section] = conventions.map((item) => item.section);
  const units = section?.blocks.flatMap((block) =>
    block.type === "text"
      ? [
          ...block.text.matchAll(
            /(?:^|\. )Monetary operands\/results are ([A-Z]{3} millions) for ([^;]+);/g,
          ),
        ]
      : [],
  );
  const bridge =
    section &&
    namedTable({ ...entry, sections: [section] }, section.heading, [
      "Register",
      "Calculated result",
    ]);
  const result =
    bridge &&
    namedRow(
      bridge,
      ({ cells }) => cells[bridge.headers.indexOf("Register")] === "C3 current gross debt",
    );
  return units?.length === 1 &&
    units[0]?.[2] === `${issuer} and its consolidated subsidiaries` &&
    bridge &&
    result?.cells[bridge.headers.indexOf("Calculated result")] === total
    ? units[0][1]
    : undefined;
}

function legacyDebtRow({ line, cells }: Table["rows"][number]) {
  const [name, principal, , terms, evidence] = cells;
  if (
    !name ||
    !principal ||
    !BARE_NUMBER.test(principal) ||
    !terms ||
    !evidence ||
    DEBT_SUBTOTALS.has(name)
  )
    return [];
  const receivables = name === RECEIVABLES;
  const subordinated = /; senior subordinated$/.test(evidence);
  const rank = subordinated
    ? "Senior subordinated"
    : /\bSecured Notes$/.test(name)
      ? "Secured"
      : "";
  const [maturity = "", ...clauses] = terms.split("; ");
  const date = compactDebtDate(maturity);
  const rate = date
    ? clauses.join("; ")
    : name === LEGACY_TOTAL && terms === "Calculated"
      ? ""
      : terms;
  return [
    {
      line,
      cells: [
        receivables ? "Receivables facility" : name === LEGACY_TOTAL ? "Total funded debt" : name,
        rank || (receivables && /fully drawn confirmed/i.test(evidence) ? "Fully drawn" : ""),
        principal,
        rate,
        date ?? "",
      ],
    },
  ];
}

function debtInteger(amount: string) {
  return BigInt(amount.replaceAll(",", ""));
}

function reconcilesGrossDebt(table: Table, total: string) {
  const rows = table.rows.filter(
    ({ cells }) => cells[0] !== LEGACY_TOTAL && !DEBT_SUBTOTALS.has(cells[0] ?? ""),
  );
  const names = rows.map(({ cells }) => cells[0] ?? "");
  if (
    !rows.length ||
    new Set(names).size !== rows.length ||
    rows.some(
      ({ cells }) =>
        !(FACILITIES.has(cells[0] ?? "") || NOTE_NAME.test(cells[0] ?? "")) ||
        !DEBT_INTEGER.test(cells[1] ?? "") ||
        !cells[3] ||
        !cells[4],
    )
  )
    return false;
  return (
    rows.reduce((gross, { cells }) => gross + debtInteger(cells[1] ?? ""), 0n) ===
    debtInteger(total)
  );
}

const TRANCHE_ID = /^(?:[IVXLCDM]+|[A-Z]\d*|\d+)$/;
const TRANCHE_MARGIN = /^(?:Term SOFR|SOFR|EURIBOR|SONIA) \+ \d+(?:\.\d+)?%$/;
const SMALL_COUNTS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function canonicalDebtDate(value: string) {
  if (reportDate(value)) return value;
  const parts = /^(\w+) (\d{1,2}), (\d{4})$/.exec(value);
  const month = MONTHS.indexOf(parts?.[1] ?? "") + 1;
  if (!parts || !month) return undefined;
  return reportDate(
    `${parts[3] ?? ""}-${String(month).padStart(2, "0")}-${(parts[2] ?? "").padStart(2, "0")}`,
  );
}

function compactDebtDate(value: string) {
  const date = canonicalDebtDate(value);
  if (!date) return undefined;
  const month = MONTHS[Number(date.slice(5, 7)) - 1];
  return month && `${String(Number(date.slice(8, 10)))} ${month.slice(0, 3)} ${date.slice(0, 4)}`;
}

function replaceTermLoanTotal(
  rows: Table["rows"],
  tranches: Table | undefined,
  headers: string[],
  parentTerms: string,
) {
  const aggregate = rows.find(({ cells }) => cells[0] === "Term loans");
  const principal = aggregate?.cells[2];
  const count = /^(\w+) tranches?(?:[;.]|$)/i.exec(parentTerms)?.[1]?.toLowerCase() ?? "";
  const expected = /^\d+$/.test(count) ? Number(count) : SMALL_COUNTS.indexOf(count) + 1;
  if (
    !aggregate ||
    !principal ||
    !tranches?.rows.length ||
    tranches.rows.length !== expected ||
    tranches.headers.join("|") !== headers.join("|")
  )
    return rows;
  const seen = new Set<string>();
  const split: Table["rows"] = [];
  let sum = 0n;
  for (const { line, cells } of tranches.rows) {
    const [id = "", amount = "", maturity = "", margin = "", source = ""] = cells;
    const evidence = source.trim();
    const date = compactDebtDate(maturity);
    if (
      !TRANCHE_ID.test(id) ||
      seen.has(id) ||
      !DEBT_INTEGER.test(amount) ||
      !date ||
      !TRANCHE_MARGIN.test(margin) ||
      cells.length !== headers.length ||
      !evidence ||
      /^(?:unknown|unavailable|not|no source|source (?:unavailable|not)|n\/a)\b|^—/i.test(evidence)
    )
      return rows;
    seen.add(id);
    sum += debtInteger(amount);
    split.push({ line, cells: [`Term loan ${id}`, "", amount, margin, date] });
  }
  return sum === debtInteger(principal)
    ? rows.flatMap((row) => (row === aggregate ? split : [row]))
    : rows;
}

function legacyCapital(entry: OutputEntry | undefined, issuer: string, asOf: string | null) {
  if (!entry || !asOf || !reportDate(asOf)) return undefined;
  const table = frontTable(entry, DEBT_FOUNDATION, [
    "Debt instrument / component",
    "Maturity / rate reported",
    "Evidence",
  ]);
  const date = /^Gross amount (\d{4}-\d{2}-\d{2})$/.exec(table?.headers[1] ?? "")?.[1];
  if (
    !table ||
    !date ||
    !reportDate(date) ||
    date > asOf ||
    table.headers.join("|") !==
      `Debt instrument / component|Gross amount ${date}|Net amount ${date}|Maturity / rate reported|Evidence`
  )
    return undefined;
  const total = namedRow(table, ({ cells }) => cells[0] === LEGACY_TOTAL)?.cells[1];
  const unit =
    total &&
    DEBT_INTEGER.test(total) &&
    reconcilesGrossDebt(table, total) &&
    legacyDebtBasis(entry, issuer, total);
  if (!unit) return undefined;
  const rows = table.rows.flatMap(legacyDebtRow);
  if (!rows.length) return undefined;
  const trancheColumns = [
    "Term-loan tranche",
    `Gross principal, ${unit}`,
    "Contractual maturity",
    "Reported floating rate",
    "Source",
  ];
  const candidate = frontTable(entry, DEBT_FOUNDATION, trancheColumns);
  const tranches =
    candidate &&
    entry.sections.some(({ blocks }) => blocks.includes(table) && blocks.includes(candidate))
      ? candidate
      : undefined;
  const loanTerms = namedRow(table, ({ cells }) => cells[0] === "Term loans")?.cells[3] ?? "";
  const owner = ownerOf(entry);
  return {
    table: {
      owner,
      title: "Capital structure",
      table: {
        ...table,
        headers: ["Instrument", "Rank / status", "Principal", "Coupon / margin", "Maturity"],
        rows: replaceTermLoanTotal(rows, tranches, trancheColumns, loanTerms),
      },
    },
    basis: `Gross principal · ${unit} · ${date}`,
    date,
    tranches: tranches && { owner, title: "Term loan tranches", table: tranches },
  };
}

function capitalLiquidity(entry: OutputEntry | undefined, date: string | undefined) {
  if (!entry || !date) return undefined;
  const [period, cash, undrawn, unit, basis] = [
    "Period",
    "Cash",
    "Undrawn committed facilities",
    "Reporting unit",
    "Basis and limitation",
  ] as const;
  const table = frontTable(entry, "Chart data: liquidity", [period, cash, undrawn, unit, basis]);
  if (!table) return undefined;
  const row = namedRow(table, ({ cells }) => cells[table.headers.indexOf(period)] === date);
  if (!row) return undefined;
  const get = (name: string) => row.cells[table.headers.indexOf(name)] ?? "";
  const observedCash = displayFinancialAmount(get(cash), get(unit), false);
  const observedUndrawn = displayFinancialAmount(get(undrawn), get(unit), false);
  return observedCash && observedUndrawn && get(basis)
    ? {
        owner: ownerOf(entry),
        line: row.line,
        cash: observedCash,
        undrawn: observedUndrawn,
        basis: get(basis),
      }
    : undefined;
}

function debtPrincipal(entry: OutputEntry | undefined) {
  if (!entry) return undefined;
  const columns = ["Period", "Contractual principal", "Carrying value", "Reporting unit"];
  const table = frontTable(entry, "Debt principal to carrying value", columns);
  if (table?.rows.length !== 1) return undefined;
  return {
    owner: ownerOf(entry),
    title: "Capital structure",
    table: {
      ...table,
      headers: columns,
      rows: table.rows.map(({ line, cells }) => ({
        line,
        cells: columns.map((column) => cells[table.headers.indexOf(column)] ?? ""),
      })),
    },
  };
}

/** The run's decisions as any summary page treats them: withheld, not shown, or unavailable. */
export function decisionActions(view: ReportView, run: PublishedRun): Action[] {
  const owners = [
    ["CP-3", "instrument", "Instrument preference"],
    ["CP-6", "committee", "Committee action and size"],
  ] as const;
  return owners.flatMap<Action>(([code, scope, label]) => {
    const treatment = decisionTreatment(view, run, code, scope, (reason) =>
      reason.trim() && !containsReference(reason) ? readerText(reason) : "",
    );
    if (treatment) {
      const { entry, ...described } = treatment;
      const owner = described.status === "withheld" ? ownerOf(entry) : undefined;
      return [{ module: code, label, ...described, owner }];
    }
    if (
      (code === "CP-3" && run.pathway === "relative_value") ||
      (code === "CP-6" && run.pathway === "portfolio_decision")
    )
      return [
        { module: code, label, status: "unavailable", reason: UNAVAILABLE_DECISION, held: false },
      ];
    return [];
  });
}

const findingLabel: Record<string, string> = {
  earnings_update: "Earnings view",
  relative_value: "Market-implied view",
  covenant_refinancing: "Covenant and refinancing view",
  distressed_restructuring: "Distress assessment",
  portfolio_decision: "Portfolio decision",
};

function issuerRatings(view: ReportView, run: PublishedRun) {
  const asOf = run.asOf ?? "";
  return (view.catalogue?.ratings ?? []).filter(
    ({ scope, date, label, agency, outlook }) =>
      scope === "issuer" &&
      reportDate(date) &&
      reportDate(asOf) &&
      date <= asOf &&
      readyField(label) &&
      readyField(agency) &&
      (!outlook || readyField(outlook)),
  );
}

function frontChallenge(analysis: OutputEntry | undefined) {
  const combined = analysis
    ? sectionPassages(analysis, ["Contrary evidence and what would change the view"])
    : [];
  if (combined.length || !analysis) return { combined, challenge: combined, triggers: [] };
  return {
    combined,
    challenge: sectionPassages(analysis, ["Contrary evidence", "Strengths and weaknesses"]),
    triggers: sectionPassages(analysis, ["What would change the view"]),
  };
}

function specialistLabel(run: PublishedRun, specialist: boolean) {
  return run.pathway && specialist ? (findingLabel[run.pathway] ?? "Credit view") : "Credit view";
}

function frontHeadline(
  foundation: OutputEntry | undefined,
  profile: ReturnType<typeof financialProfile> | undefined,
  specialist: boolean,
  view: ReportView,
  run: PublishedRun,
) {
  const headline = foundation ? headlines(foundation, profile, view, run.asOf) : [];
  const missing = specialist
    ? []
    : financialRows
        .map(([label]) => label)
        .filter((label) => !headline.some(({ category }) => category === label));
  return { headline, missing };
}

function frontCompany(view: ReportView, ratings: ReturnType<typeof issuerRatings>) {
  const company = companyProfile(selectedOutput(view, "CP-1A"));
  return {
    ...company,
    sector: company.sector ?? readyField(view.catalogue?.sector),
    ratings,
    differing: differingAgencies(view.entries, ratings),
  };
}

function frontCapital(
  instruments: ReturnType<typeof instrumentTable>,
  legacy: ReturnType<typeof legacyCapital>,
  foundation: OutputEntry | undefined,
) {
  return (
    legacy?.table ??
    (instruments && { ...instruments, title: "Capital structure" }) ??
    debtPrincipal(foundation)
  );
}

function frontAnalysis(analysis: OutputEntry | undefined, specialist: boolean) {
  return {
    compactLead: !specialist && analysis ? authoredSummary(analysis) : undefined,
    findings: analysis ? sectionPassages(analysis, ["Key findings"]).slice(0, 2) : [],
    limitations: analysis ? frontLimitations(analysis) : [],
  };
}

export function buildIssuerFrontPage(view: ReportView, run: PublishedRun) {
  if (run.publicationVerified !== true || view.folder !== run.folder) return null;
  const lead = scopedLead(view, run);
  const foundation = selectedOutput(view, "CP-1");
  const profile = foundation && financialProfile(foundation);
  const specialist = Boolean(run.pathway && Object.hasOwn(findingLabel, run.pathway));
  const analysis = lead?.entry;
  const issuer = run.issuerHeading || run.issuer;
  const ratings = issuerRatings(view, run);
  const instruments = instrumentTable(foundation);
  const legacy = legacyCapital(foundation, issuer, run.asOf);
  const { headline, missing } = frontHeadline(foundation, profile, specialist, view, run);
  const { combined, challenge, triggers } = frontChallenge(analysis);
  const { compactLead, findings, limitations } = frontAnalysis(analysis, specialist);
  return {
    folder: run.folder,
    issuer: view.catalogue?.name || run.issuerHeading || run.issuer,
    ticker: view.catalogue?.ticker,
    pathway: runPathway(run, view.catalogue),
    asOf: run.asOf,
    period: view.catalogue?.period,
    scope: scopeLabel(run),
    leadLabel: specialistLabel(run, specialist),
    lead: lead?.passage,
    compactLead,
    actions: decisionActions(view, run),
    figures: specialist ? [] : snapshotFigures(foundation),
    headline,
    missingHeadline: missing,
    findings,
    challenge,
    triggers,
    hasCombinedChallenge: combined.length > 0,
    limitations,
    financials: profile,
    instruments,
    capital: frontCapital(instruments, legacy, foundation),
    capitalBasis: legacy?.basis,
    liquidity: capitalLiquidity(foundation, legacy?.date),
    tranches: legacy?.tranches,
    company: frontCompany(view, ratings),
  };
}

export type IssuerFrontPageData = NonNullable<ReturnType<typeof buildIssuerFrontPage>>;
