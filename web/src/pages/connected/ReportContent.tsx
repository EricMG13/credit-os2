import { Button } from "@/components/base/buttons/button";
import { ArrowRight } from "@untitledui/icons";
import { GapPanel } from "@/components/gap/GapPanel";
import { sourceCitationNote, sourceFileLinks } from "./sourceFiles";
import { Fragment, useState, type ReactNode } from "react";
import { BottomLine } from "../library/parts/BottomLine";
import { RunContext } from "../library/parts/RunContext";
import { TraceControl, TRACE_HOST } from "../library/parts/TraceControl";
import { TraceDrawer } from "../library/parts/TraceDrawer";
import type { Trace, TreeNode } from "../library/slice";
import { moduleName } from "./api";
import { traceKey } from "./reportView";
import { plainText, richParts } from "./richText";
import { card, heading } from "./layout";
import { drawnQualificationLines } from "./visuals/drawnQualifications";
import { monitoringLabel, typedModuleTable } from "./report/ModuleTable";
import { calculationNodes } from "./report/calculations";
import {
  classifySections,
  containsReference,
  displayColumns,
  evidencePath,
  evidenceHref,
  evidenceToken,
  CONFIDENCE_INPUTS,
  readerText,
  FORECAST_INPUTS,
  methodNote,
  missingPassages,
  passages,
  PASSAGES,
  publishedHref,
  readParagraph,
  type Block,
  plainModuleNames,
  type OutputEntry,
  type PublishedRun,
  type Section,
  type Snapshot,
  type Table,
} from "./publishedReport";

function matchingDownload(run: PublishedRun, entry: OutputEntry) {
  const linked =
    entry.selected && run.evidence.handoffs.find((item) => item.module === entry.output.module);
  if (
    !linked ||
    linked.href !==
      `downloads/${encodeURIComponent(run.folder)}/${encodeURIComponent(entry.output.module)}.md`
  )
    return null;
  return publishedHref(linked.href, run.folder);
}

export function HandoffDownload({ run, entry }: { run: PublishedRun; entry: OutputEntry }) {
  const href = matchingDownload(run, entry);
  return href ? (
    <Button
      href={href}
      download
      color="link-gray"
      size="sm"
      aria-label={`Download ${moduleName(entry.output.module, run.pathway)}`}
    >
      Download
    </Button>
  ) : null;
}

const traceTarget = (entry: OutputEntry, line?: number) => evidenceToken(entry, line);

function tableStatement(table: Table, row: Table["rows"][number]) {
  return displayColumns(table.headers, true, table.rows)
    .map((index) =>
      row.cells[index] ? [table.headers[index], row.cells[index]].filter(Boolean).join(" — ") : "",
    )
    .filter(Boolean)
    .join("\n");
}

export function traceDetails(
  snapshot: Snapshot,
  entry: OutputEntry,
  section: Section,
  block: Block,
  line: number,
) {
  const sourceFree =
    block.type === "table" &&
    !block.headers.some((header) =>
      /source|basis|evidence|citation|page|file|sha|hash|locator/i.test(header),
    );
  const chipsAt = (at: number) =>
    (snapshot.chips[`${entry.output.id}:${String(at)}`] ?? []).filter((chip) => {
      if (!sourceFree || chip.file || chip.sha256 || chip.quote || chip.excerpt) return true;
      return [chip.source, chip.label].some(
        (value) => value && !/^(?:no page|not supplied|n\.a\.?)$/i.test(value.trim()),
      );
    });
  const row = block.type === "table" ? block.rows.find((item) => item.line === line) : null;
  const tableRows = block.type === "table" && block.line === line ? block.rows : [];
  const confidenceLines =
    section.heading === CONFIDENCE_INPUTS
      ? section.blocks.flatMap((item) => [
          item.line,
          ...(item.type === "table" ? item.rows.map((row) => row.line) : []),
        ])
      : [];
  const chips = [
    ...new Map(
      [
        ...chipsAt(line),
        ...tableRows.flatMap((item) => chipsAt(item.line)),
        ...confidenceLines.flatMap(chipsAt),
      ].map((chip) => [JSON.stringify(chip), chip]),
    ).values(),
  ];
  const statement =
    block.type === "text"
      ? readParagraph(block.text).body
      : block.type === "table" && row
        ? tableStatement(block, row)
        : section.heading;
  const readerColumns =
    block.type === "table" ? displayColumns(block.headers, false, block.rows) : [];
  const basisColumns =
    block.type === "table"
      ? displayColumns(block.headers, true, block.rows).filter(
          (index) =>
            !readerColumns.includes(index) || block.headers[index] === "Basis and limitation",
        )
      : [];
  const basis =
    block.type === "text"
      ? readParagraph(block.text).basis
      : [
          ...new Set(
            (row ? [row] : tableRows).flatMap((item) =>
              basisColumns.map((index) => item.cells[index]).filter(Boolean),
            ),
          ),
        ].join("\n") || null;
  const chipGroups = tableRows.length
    ? [
        { label: "Table source", chips: chipsAt(line) },
        ...tableRows.map((item) => ({
          label: plainModuleNames(item.cells[0] || `Row ${String(item.line)}`),
          chips: chipsAt(item.line),
        })),
      ].filter((group) => group.chips.length)
    : [];
  return { chips, statement, basis, chipGroups };
}

function confidenceNodes(entry: OutputEntry, block?: Block): TreeNode[] {
  const recorded = entry.output.confidenceTrace;
  const inputs =
    recorded?.inputs ??
    (block?.type === "table"
      ? block.rows.map(({ cells }) => ({ label: cells[0] ?? "", value: cells[1] ?? "" }))
      : []);
  const group = (label: string, rows: { label: string; value: string }[]): TreeNode => ({
    label,
    value: "",
    note: null,
    children: rows.map((row) => ({ ...row, note: null, children: [] })),
  });
  return [
    group("Recorded confidence inputs", inputs),
    ...(recorded ? [group("Confidence method", recorded.method)] : []),
  ];
}

function confidenceStatement(entry: OutputEntry) {
  const score = entry.output.confidence;
  return score && !("missing" in score)
    ? `${String(score.value)} out of 100 · ${score.band}`
    : "Confidence inputs";
}

type TraceDetails = ReturnType<typeof traceDetails>;
type TraceChips = TraceDetails["chips"];

function isConfidencePlaceholder(chip: TraceChips[number]) {
  const { label, source, reason, file, sha256, quote, excerpt, href, pageHref } = chip;
  return (
    label === "no page" &&
    (source === null || source === "no page") &&
    reason === "the row cites no page or register" &&
    ![file, sha256, quote, excerpt, href, pageHref].some(Boolean)
  );
}

function traceNode(label: string, value: string | null, note: string | null = null): TreeNode {
  return { label, value, note, children: [] };
}

const citationNodes = (items: TraceChips) =>
  items.flatMap((chip) => {
    const source = chip.source ?? chip.label;
    return source ? [traceNode(source, "", sourceCitationNote(chip))] : [];
  });

function traceDerivation({
  entry,
  section,
  block,
  line,
  details,
  chips,
  confidence,
}: {
  entry: OutputEntry;
  section: Section;
  block: Block;
  line: number;
  details: TraceDetails;
  chips: TraceChips;
  confidence: boolean;
}) {
  const { basis, chipGroups } = details;
  return {
    ...traceNode("Evidence retained with this item", ""),
    children: [
      ...(confidence ? confidenceNodes(entry, block) : []),
      ...(basis ? [traceNode("Basis", plainModuleNames(basis))] : []),
      ...calculationNodes(entry, basis ?? "", line),
      ...traceCitations(chipGroups, chips, confidence),
      ...basisFallback(section.heading, confidence, Boolean(basis), chips.length),
    ],
  };
}

function traceCitations(
  groups: TraceDetails["chipGroups"],
  chips: TraceChips,
  confidence: boolean,
) {
  if (confidence || !groups.length) return citationNodes(chips);
  return groups.map((group) => ({
    ...traceNode(group.label, ""),
    children: citationNodes(group.chips),
  }));
}

function basisFallback(heading: string, confidence: boolean, hasBasis: boolean, chipCount: number) {
  if (confidence || hasBasis || chipCount) return [];
  // Recorded inputs are not a gap: only a missing basis carries no value.
  return [
    heading === FORECAST_INPUTS
      ? traceNode("Recorded forecast inputs", "")
      : traceNode("Basis was not recorded for this item", null),
  ];
}

function confidenceQualification(section: Section) {
  const paragraphs = section.blocks.flatMap((item) =>
    item.type === "text" && !item.text.startsWith("```")
      ? [
          item.text
            .split("\n")
            .filter((text) => !text.startsWith("|"))
            .join("\n")
            .trim(),
        ]
      : [],
  );
  return paragraphs.filter(Boolean).join("\n\n") || null;
}

function buildTrace(
  snapshot: Snapshot,
  entry: OutputEntry,
  section: Section,
  block: Block,
  line: number,
  target: string,
  pathway?: string | null,
): Trace {
  const details = traceDetails(snapshot, entry, section, block, line);
  const { statement } = details;
  const confidence = section.heading === CONFIDENCE_INPUTS;
  // These generated placeholders carry no citation. Keep every real citation or qualification.
  const chips = confidence
    ? details.chips.filter((chip) => !isConfidencePlaceholder(chip))
    : details.chips;
  const excerpt = chips.find((chip) => chip.excerpt);
  return {
    title: `Sources for ${section.heading}`,
    heading: section.heading,
    subtitle: `${moduleName(entry.output.module, pathway)} · Handoff line ${String(line)}`,
    statement: confidence
      ? confidenceStatement(entry)
      : section.heading === FORECAST_INPUTS
        ? "The model calculation uses the inputs recorded in this handoff."
        : plainModuleNames(statement.replaceAll("**", "").replaceAll("`", "")),
    derivation: traceDerivation({ entry, section, block, line, details, chips, confidence }),
    excerpt: excerpt
      ? {
          quote: excerpt.excerpt ?? "",
          source: excerpt.source ?? excerpt.label ?? "Source name unavailable",
        }
      : null,
    qualification: confidence ? confidenceQualification(section) : null,
    evidenceItem: target,
    sourceLinks: [
      ...new Map(
        chips
          .flatMap((chip) => sourceFileLinks(entry.output.id.split("/")[0] ?? "", chip))
          .map((link) => [link.href, link]),
      ).values(),
    ],
  };
}

export function handoffBlockAt(entry: OutputEntry, line: number) {
  for (const section of entry.sections) {
    const block = section.blocks.find(
      (item) =>
        item.line === line || (item.type === "table" && item.rows.some((row) => row.line === line)),
    );
    if (block) return { section, block };
  }
  return null;
}

export function traceForLine(
  snapshot: Snapshot,
  entry: OutputEntry,
  _index: number,
  line: number,
  pathway?: string | null,
) {
  const found = handoffBlockAt(entry, line);
  return (
    found &&
    buildTrace(snapshot, entry, found.section, found.block, line, traceTarget(entry, line), pathway)
  );
}

/** A scored handoff may be accepted even when its input rows are not a Markdown table. */
export function traceForConfidence(
  snapshot: Snapshot,
  entry: OutputEntry,
  pathway?: string | null,
): Trace | undefined {
  const section =
    entry.sections.find((item) => item.heading === CONFIDENCE_INPUTS) ??
    entry.output.confidenceTrace?.section;
  const block = section?.blocks[0];
  if (section && block)
    return buildTrace(
      snapshot,
      entry,
      section,
      block,
      block.line,
      traceTarget(entry, block.line),
      pathway,
    );
  if (!entry.output.confidenceTrace) return undefined;
  return {
    title: "Sources for Confidence inputs",
    heading: CONFIDENCE_INPUTS,
    subtitle: `${moduleName(entry.output.module, pathway)} · ${entry.output.label}`,
    statement: confidenceStatement(entry),
    derivation: {
      label: "Evidence retained with this item",
      value: "",
      note: null,
      children: confidenceNodes(entry),
    },
    excerpt: null,
    qualification: null,
    evidenceItem: traceTarget(entry),
  };
}

type Amounts = {
  columns: ReadonlySet<number>;
  /** `line` is the row's line in the handoff, for a row that draws no bar. */
  draw: (column: number, cell: string, line: number) => ReactNode | undefined;
};

/** Opt-in drawing of a records table; a caller that passes none of it gets the table as before. */
type TableForm = {
  /** The columns drawn, in order; every displayed column when not given. */
  columns?: readonly number[];
  /** Columns of numerals: mono, tabular and right-aligned, their header too. */
  numeric?: ReadonlySet<number>;
  /** A named, focusable scroll region at any column count, not only at five or more. */
  region?: boolean;
  /** Room for a bar column's bar beside its figure. */
  wideBars?: boolean;
  /** A cell's own drawing (a stated gap as a chip); undefined falls back to the text. */
  drawCell?: (column: number, cell: string) => ReactNode | undefined;
  /** The records form: tighter rows in the small size; a text cell wraps between 12 and 28
   * characters; a figure or a date stays on one line; the first column keeps its minimum at every
   * width; a bar column's header sits over its figures. */
  records?: boolean;
};

const NUMERALS = " text-right font-mono tabular-nums";
/** A figure is set in mono numerals; a stated gap in the same column keeps the reading face. */
const FIGURE = /^[(+-]?\d[\d,]*(?:\.\d+)?\)?(?:%|x|bps)?$/;

/** A figure, a date or a period label; alone or paired ("FY2023 / 2023-09-30") it is one line. */
const ONE_LINE_PART =
  /(?:[(+\-−]?\$?\d[\d,]*(?:\.\d+)?\)?\s?(?:%|x|bps)?|\d{4}-\d{2}-\d{2}|(?:FY|CY|Q[1-4]|H[12]|LTM)\s?\d{2,4}|[A-Z][a-z]{2,8}\.? \d{4})/
    .source;
const ONE_LINE = new RegExp(`^${ONE_LINE_PART}(?:\\s?[/;–]\\s?${ONE_LINE_PART})*$`);
/** Whether a records cell is a figure, a date or a period label, which is never wrapped. */
export const isOneLine = (cell: string) => ONE_LINE.test(cell.trim());
const WRAP_AT = 28;

/** The records form's hold on a cell's text: a figure or a date on one line (its cell does not
 * wrap); other text wraps at 28 characters, never squeezed below 12, and text that runs past 28
 * never below 20, so a narrow screen scrolls the table rather than setting a word a line. */
function heldText(cell: string) {
  if (isOneLine(cell)) return null;
  return cell.trim().length > WRAP_AT
    ? "block min-w-[20ch] max-w-[28ch]"
    : "block min-w-[12ch] max-w-[28ch]";
}

const amountCell = (amounts: Amounts | undefined, column: number, cell: string, line: number) =>
  amounts?.columns.has(column) ? amounts.draw(column, cell, line) : undefined;

/** A cell as the reader sees it: a reference as an Evidence link, an amount, the text, or blank. */
function cellContent({
  cell,
  column,
  line,
  evidence,
  sourceHref,
  amounts,
  form,
  shown,
  emptyLabel,
}: {
  cell: string;
  column: number;
  line: number;
  evidence: boolean;
  sourceHref: string | undefined;
  amounts: Amounts | undefined;
  form: TableForm;
  shown: (text: string) => string;
  emptyLabel: string;
}) {
  if (!evidence && containsReference(cell))
    return sourceHref ? (
      <Button href={sourceHref} color="link-gray" size="sm">
        In Evidence
      </Button>
    ) : (
      "Source reference unavailable"
    );
  if (!cell.trim()) return <span aria-label={emptyLabel}>—</span>;
  const drawn = amountCell(amounts, column, cell, line) ?? form.drawCell?.(column, cell);
  if (drawn !== undefined && drawn !== null) return drawn;
  const held = form.records ? heldText(cell) : null;
  return held ? <span className={held}>{richParts(cell, shown)}</span> : richParts(cell, shown);
}

export function PublishedTable({
  table,
  evidence = false,
  traceAt,
  rowSource,
  rowHref,
  href,
  heading: tableHeading,
  emptyLabel = "Left blank",
  amounts,
  ...form
}: {
  table: Table;
  /** Amount columns: each figure is drawn by `draw` (a bar behind the text as written); a gap falls back. */
  amounts?: Amounts;
  /** The section heading that names the table's scroll region; "Table" when not given. */
  heading?: string;
  /** The recorded source of an empty field; run-record callers do not read a handoff. */
  emptyLabel?: string;
  evidence?: boolean;
  traceAt?: (line: number) => string;
  rowSource?: (line: number, label: string) => ReactNode;
  rowHref?: (line: number) => string | undefined;
  href?: string;
} & TableForm) {
  // The Evidence page draws text as stored; findings pages name the module.
  const shown = evidence ? plainModuleNames : readerText;
  const columns = form.columns ?? displayColumns(table.headers, evidence, table.rows);
  if (!columns.length || !table.rows.length) return null;
  const pinned = (column: number, background: string) =>
    columns.length >= 5 && column === columns[0]
      ? ` sm:sticky sm:left-0 sm:min-w-56 ${background}`
      : "";
  const numerals = (column: number, cell: string) =>
    form.numeric?.has(column) ? (FIGURE.test(cell.trim()) ? NUMERALS : " text-right") : "";
  const barWidth = form.wideBars ? " min-w-64" : " min-w-40";
  const { records } = form;
  const pad = records ? "py-1.5" : "py-2.5";
  // The records form holds the first column to a minimum at every width, not only where it pins.
  const first = (column: number) => (records && column === columns[0] ? " min-w-[12ch]" : "");
  const oneLine = (cell: string) => (records && isOneLine(cell) ? " whitespace-nowrap" : "");
  // A bar column's header sits over its figures, right-aligned in their slot (BarCell's w-20),
  // wrapping there when longer.
  const header = (column: number) => {
    const text = richParts(table.headers[column] ?? "", shown);
    return records && amounts?.columns.has(column) ? (
      <span className="block w-20 text-right">{text}</span>
    ) : (
      text
    );
  };
  const sources =
    rowSource ??
    (traceAt &&
      ((line: number, name: string) => (
        <TraceControl trace={traceAt(line)} label={`Show sources for ${shown(name)}`} />
      )));
  // A wide table scrolls sideways: it is a named, focusable region so the keyboard can reach it.
  // Bars need room, so a table that draws them scrolls inside its own region at any width.
  const wide = form.region || columns.length >= 5 || Boolean(amounts?.columns.size);
  // A row is named by the first column the reader sees, never by a hidden source column.
  const rowName = (row: Table["rows"][number]) => row.cells[columns[0] ?? 0] ?? "";
  const name = tableHeading || "Table";
  const drawn = (
    <table className={`w-full border-collapse ${records ? "text-small" : "text-sm"}`}>
      {amounts?.columns.size ? (
        <caption className="sr-only">{`${name} · bars on one scale per column`}</caption>
      ) : null}
      <thead className="bg-surface-subtle text-text-secondary">
        <tr>
          {columns.map((column) => (
            <th
              key={column}
              scope="col"
              className={`px-3 ${pad} ${form.numeric?.has(column) ? "text-right" : "text-left"} font-semibold${first(column)}${pinned(column, "bg-surface-subtle")}`}
            >
              {header(column)}
            </th>
          ))}
          {sources && (
            <th scope="col" className={`px-2 ${pad} text-left font-semibold`}>
              <span className="sr-only">Sources</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row.line} className={`${TRACE_HOST} border-t border-border-hairline align-top`}>
            {columns.map((column) => (
              <td
                key={column}
                className={`px-3 ${pad} text-text-secondary${amounts?.columns.has(column) ? barWidth : ""}${numerals(column, row.cells[column] ?? "")}${first(column)}${oneLine(row.cells[column] ?? "")}${pinned(column, "bg-surface-card")}`}
              >
                {cellContent({
                  cell: row.cells[column] ?? "",
                  column,
                  line: row.line,
                  evidence,
                  sourceHref: rowHref?.(row.line) ?? href,
                  amounts,
                  form,
                  shown,
                  emptyLabel,
                })}
              </td>
            ))}
            {sources && (
              <td className={`px-2 ${records ? "py-0.5" : "py-1.5"}`}>
                {sources(row.line, rowName(row) || "this row")}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
  // On a phone the inner room keeps a trace control's touch area inside the scroll box's clip.
  const frame =
    "relative min-w-0 overflow-x-auto rounded-ds-md border border-border-hairline max-[480px]:p-2";
  return wide ? (
    // A table that scrolls sideways is a named region the keyboard can focus to scroll it.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div role="region" aria-label={name} tabIndex={0} className={frame}>
      {drawn}
    </div>
  ) : (
    <div className={frame}>{drawn}</div>
  );
}

function readerBlock(block: Block): boolean {
  return block.type === "table" || (block.type === "text" && !methodNote(block.text));
}

const RECORDS_ID = "statements-and-records";
// One register code (T4.4, P3, T2F.2); the prefix also takes the dash that follows it.
const CODE = String.raw`[TP]\d+[A-Z]?(?:\.\d+)?`;
// A heading's register code is stripped only where it is plainly one: a dotted number (T4.18,
// TDR.3, P2.1) or a code set off by a dash or colon ("T1 - Register"); "T2 Heathrow" keeps its word.
const DOTTED_CODE = String.raw`(?:TL|T|P)[A-Z0-9]{0,5}\.\d+(?:\.\d+)?`;
const SET_OFF_CODE = String.raw`(?:TL|T|P)[A-Z0-9]{0,5}`;
const RECORD_PREFIX = new RegExp(
  String.raw`^(?:${DOTTED_CODE}(?:\s*[-\u2013\u2014:]\s*|\s+)|${SET_OFF_CODE}\s*[-\u2013\u2014:]\s+)`,
);
const RECORD_CODE = new RegExp(String.raw`^${CODE}\s`);

/** The register tables a working page draws; every other register table is held in Evidence. */
export function registerBlocks(section: Section, entry: OutputEntry) {
  if (entry.output.module === "CP-6" && /^T6E\.(?:4|6|7)\b/.test(section.heading))
    return section.blocks.filter(readerBlock);
  if (entry.output.module === "CP-8" && section.heading === "Limitations ledger")
    return section.blocks.filter(readerBlock);
  return section.blocks.filter((block) => {
    if (block.type !== "table") return false;
    if (monitoringLabel(entry.output.module, section.heading, block)) return true;
    const headers = block.headers.map((header) => header.trim().toLowerCase());
    return (
      (headers.includes("probability") && headers.includes("impact")) ||
      headers.some((header) => /leading/.test(header)) ||
      (/date|window/.test(headers[0] ?? "") && headers.some((header) => /^event/.test(header)))
    );
  });
}

// A finding section whose heading starts with a register code: its prose stays on the page,
// its tables go to Evidence unless they are promoted.
const isCoded = (section: Section, role: string) =>
  role === "finding" && RECORD_CODE.test(section.heading);

// Coded sections with a table that the page does not draw; Evidence holds those tables.
export function recordSections(sections: Section[], entry: OutputEntry) {
  return classifySections(sections)
    .filter(({ section, role }) => {
      // Confidence inputs is a register here: the page draws its score, Evidence holds the table.
      if (
        !isCoded(section, role) &&
        !(role === "registers" && section.heading === CONFIDENCE_INPUTS)
      )
        return false;
      const drawn = registerBlocks(section, entry);
      return section.blocks.some((block) => block.type === "table" && !drawn.includes(block));
    })
    .map(({ section }) => section);
}

const NO_QUALIFICATION = "No qualification.";
const DRAWING_PREFIX = /^(?:Chart data|Map|Events): /;
/** A section heading as drawn: without the drawing prefix, the register code and its dash. */
export const drawingTitle = (heading: string) =>
  heading.replace(DRAWING_PREFIX, "").replace(RECORD_PREFIX, "");

// `chartsDrawn` is true on a page that draws this module's charts with their qualifications.
export function drawingLines(entry: OutputEntry, figureTableLines: readonly number[] = []) {
  return new Set(
    [
      ...(entry.output.charts ?? []),
      ...(entry.output.chartGaps ?? []),
      ...(entry.output.maps ?? []),
      ...(entry.output.events ?? []),
    ]
      .map((item) => item.table)
      .concat(figureTableLines),
  );
}

export function findingBlocks(
  sections: Section[],
  entry: OutputEntry,
  figureTableLines: readonly number[] = [],
  chartsDrawn = false,
) {
  const qualified = chartsDrawn
    ? drawnQualificationLines(entry.output, sections)
    : new Set<number>();
  const drawings = drawingLines(entry, figureTableLines);
  const blocksOf = (section: Section, role: string) => {
    if (role === "registers") return registerBlocks(section, entry);
    if (role !== "finding" && role !== "passage" && role !== "drawing") return [];
    const promoted = isCoded(section, role) ? registerBlocks(section, entry) : null;
    return section.blocks.filter(
      (block) =>
        readerBlock(block) &&
        !drawings.has(block.line) &&
        (promoted === null || block.type === "text" || promoted.includes(block)) &&
        // A chart's own qualification, or the empty one, is not drawn a second time.
        (role !== "drawing" ||
          (!qualified.has(block.line) &&
            !(block.type === "text" && block.text.trim() === NO_QUALIFICATION))),
    );
  };
  return classifySections(sections).flatMap(({ section, role }) => {
    const blocks = blocksOf(section, role);
    // A promoted table is typed by its full heading; a section without one drops the code here.
    const plain = isCoded(section, role) && registerBlocks(section, entry).length === 0;
    return blocks.length
      ? [{ ...section, heading: plain ? drawingTitle(section.heading) : section.heading, blocks }]
      : [];
  });
}

export function FindingParagraph({
  block,
  trace,
  href,
}: {
  block: Extract<Block, { type: "text" }>;
  trace: string;
  href: string;
}) {
  const { body } = readParagraph(block.text);
  if (!body) return null;
  return (
    <div className={`${TRACE_HOST} flex items-start justify-start gap-3`}>
      <p className="reading-copy min-w-0 text-body text-text-secondary">
        {containsReference(body) ? (
          <Button href={href} color="link-gray" size="sm" iconTrailing={ArrowRight}>
            Read this passage in Evidence
          </Button>
        ) : (
          richParts(body, readerText)
        )}
      </p>
      <TraceControl trace={trace} label="Show sources for this passage" />
    </div>
  );
}

function RecordsCard({
  run,
  entry,
  records,
}: {
  run: PublishedRun;
  entry: OutputEntry;
  records: Section[];
}) {
  if (!records.length) return null;
  return (
    <section className={card} id={RECORDS_ID} tabIndex={-1}>
      <h2 className={heading}>Statements and records</h2>
      <p className="reading-copy text-body text-text-secondary">
        These tables are part of this module's record and are shown in Evidence.
      </p>
      <ul className="grid gap-1">
        {records.map((section) => (
          <li key={section.line}>
            <Button
              href={evidencePath(run.folder, entry, section.line)}
              color="link-gray"
              size="sm"
            >
              {drawingTitle(section.heading)}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        href={evidencePath(run.folder, entry)}
        color="link-gray"
        size="sm"
        iconTrailing={ArrowRight}
      >
        Open this module in Evidence
      </Button>
    </section>
  );
}

function findingLabel(section: Section, overviewLabel?: string) {
  return section.heading === "Bottom line" ? (overviewLabel ?? section.heading) : section.heading;
}

/** One trace per paragraph and table row of `sections`, keyed by `traceKey`. */
export function sectionTraces(
  snapshot: Snapshot,
  entry: OutputEntry,
  sections: Section[],
  pathway?: string | null,
) {
  const traces: Record<string, Trace> = {};
  const key = (line: number) => traceKey(entry, line);
  for (const section of sections) {
    for (const block of section.blocks) {
      const lines = block.type === "table" ? block.rows.map((row) => row.line) : [block.line];
      for (const line of lines)
        traces[key(line)] = buildTrace(
          snapshot,
          entry,
          section,
          block,
          line,
          traceTarget(entry, line),
          pathway,
        );
    }
  }
  return traces;
}

const CONFIDENCE_MARK_TONES = new Map([
  ["High", "bg-brand-700 text-white"],
  ["Medium", "bg-brand-200 text-text-primary"],
  ["Low", "bg-brand-50 text-text-primary"],
  ["Insufficient Information", "bg-surface-subtle text-text-secondary"],
]);
const CONFIDENCE_MARK_TRACE = "module-confidence";

function ConfidenceMark({ value, band, trace }: { value: number; band: string; trace?: string }) {
  return (
    <div
      className="grid w-24 shrink-0 justify-items-center gap-1"
      role="group"
      aria-label="Confidence score"
    >
      <div
        className={`grid w-full justify-items-center gap-0.5 rounded-ds-sm px-2 py-2 text-center ${CONFIDENCE_MARK_TONES.get(band) ?? "bg-surface-subtle text-text-secondary"}`}
      >
        <span className="text-xs font-medium">Confidence</span>
        <span className="font-display text-h4 tabular-nums">
          {value}
          <span className="text-xs font-normal"> / 100</span>
        </span>
        <span className="text-xs leading-tight">{band}</span>
      </div>
      <TraceControl trace={trace} label="Show sources for the confidence score" />
    </div>
  );
}

function FindingsSummary({
  summary,
  entry,
  summaryTrace,
  marker,
}: {
  summary: Summary;
  entry: OutputEntry;
  summaryTrace: Trace | null | undefined | false;
  marker?: ReactNode;
}) {
  if (!summary || containsReference(summary.bottomLine)) return null;
  return (
    <BottomLine
      level="h3"
      marker={marker}
      text={{
        label: "Bottom line",
        lead: readerText(summary.bottomLine),
        rest: containsReference(summary.limitation) ? "" : readerText(summary.limitation),
        trace: summaryTrace ? traceKey(entry, summary.line) : null,
      }}
    />
  );
}

const MISSING_PASSAGE = "Not established for this run. The module wrote no such passage.";

type FindingGroup = string | [Section, Section?];

function passageGroups(ordered: Map<string, Section>, gaps: string[], overview: boolean) {
  const groups: FindingGroup[] = [];
  const keyFindings = overview ? ordered.get("Key findings") : undefined;
  const contrary = keyFindings && ordered.get("Contrary evidence and what would change the view");
  for (const name of PASSAGES) {
    const section = ordered.get(name);
    if (!section) {
      if (gaps.includes(name)) groups.push(name);
      continue;
    }
    if (section !== contrary) groups.push(groupPassage(section, keyFindings, contrary));
  }
  const limitations = groups.findIndex(
    (group) =>
      group === "Limitations" || (typeof group !== "string" && group[0].heading === "Limitations"),
  );
  return { groups, figuresAt: limitations === -1 ? groups.length : limitations };
}

function groupPassage(
  section: Section,
  keyFindings?: Section,
  contrary?: Section,
): [Section, Section?] {
  return section === keyFindings && contrary ? [section, contrary] : [section];
}

function findingsLayout(
  entry: OutputEntry,
  figureTableLines: readonly number[] | undefined,
  overview: boolean,
  chartsDrawn: boolean,
) {
  const slots = passages(entry.sections);
  const slotLines = new Set(slots.map((section) => section.line));
  // Overview draws the run's limitations once, across modules, excluding the lead's.
  const found = findingBlocks(entry.sections, entry, figureTableLines, chartsDrawn).filter(
    (section) => !overview || (slotLines.has(section.line) && section.heading !== "Limitations"),
  );
  const ordered = new Map<string, Section>();
  for (const name of PASSAGES) {
    const section = found.find((item) => item.heading === name && slotLines.has(item.line));
    if (section) ordered.set(name, section);
  }
  const present = new Set(ordered.values());
  const extra = found.filter((section) => !present.has(section));
  const drawings = drawingLines(entry, figureTableLines);
  const charted = slots
    .filter((section) => section.blocks.some((block) => drawings.has(block.line)))
    .map((section) => section.heading);
  const gaps = overview ? [] : missingPassages(entry, [...ordered.keys(), ...charted]);
  const { groups, figuresAt } = passageGroups(ordered, gaps, overview);
  const extraGroups: FindingGroup[] = extra.map((section) => [section]);
  return {
    sections: [...present, ...extra],
    groups: [...groups, ...extraGroups],
    figuresAt,
    drawnBottomLine: ordered.has("Bottom line"),
  };
}

function followingParagraphs(section: Section, entry: OutputEntry, folder: string) {
  return section.blocks
    .slice(1)
    .map((block) =>
      block.type === "text" ? (
        <FindingParagraph
          key={block.line}
          block={block}
          trace={traceKey(entry, block.line)}
          href={evidencePath(folder, entry, block.line)}
        />
      ) : null,
    );
}

function EmptyFindings({
  run,
  entry,
  records,
  afterBottomLine,
  beforeLimitations,
}: {
  run: PublishedRun;
  entry: OutputEntry;
  records: Section[];
  afterBottomLine?: ReactNode;
  beforeLimitations?: ReactNode;
}) {
  return (
    <>
      <p className="text-text-secondary">
        {entry.output.parseError
          ? "This module's output could not be read into sections."
          : "This module wrote no findings in this report format."}{" "}
        <Button href={evidencePath(run.folder, entry)} color="link-gray" size="sm">
          Open Evidence
        </Button>
      </p>
      {afterBottomLine}
      {beforeLimitations}
      <RecordsCard run={run} entry={entry} records={records} />
    </>
  );
}

type Summary = OutputEntry["output"]["summary"] | false;

function confidencePresentation({
  snapshot,
  entry,
  sections,
  summary,
  traces,
  moduleConfidence,
  afterBottomLine,
  pathway,
}: {
  snapshot: Snapshot;
  entry: OutputEntry;
  sections: Section[];
  summary: Summary;
  traces: Record<string, Trace>;
  pathway?: string | null;
  moduleConfidence?: ReactNode;
  afterBottomLine?: ReactNode;
}) {
  if (moduleConfidence === undefined)
    return { marker: undefined, trailingFigures: afterBottomLine };
  const score = entry.output.confidence;
  if (!score || "missing" in score || !showsBottomLine(sections, summary))
    return {
      marker: null,
      trailingFigures: (
        <>
          {moduleConfidence}
          {afterBottomLine}
        </>
      ),
    };
  const scoreTrace = traceForConfidence(snapshot, entry, pathway);
  if (scoreTrace) traces[CONFIDENCE_MARK_TRACE] = scoreTrace;
  return {
    marker: <ConfidenceMark {...score} trace={scoreTrace ? CONFIDENCE_MARK_TRACE : undefined} />,
    trailingFigures: afterBottomLine,
  };
}

function showsBottomLine(sections: Section[], summary: Summary) {
  return (
    sections.some(
      (section) => section.heading === "Bottom line" && section.blocks[0]?.type === "text",
    ) || Boolean(summary && !containsReference(summary.bottomLine))
  );
}

function renderFindingGroups(
  groups: FindingGroup[],
  drawSection: (section: Section) => ReactNode,
  summary: Summary,
  beforeLimitations: ReactNode,
  figuresAt: number,
) {
  const drawn = groups.map((group) => {
    if (typeof group === "string")
      return group === "Bottom line" && summary && !containsReference(summary.bottomLine) ? null : (
        <section key={group} className={card}>
          <h2 className={heading}>{group}</h2>
          <GapPanel reason={MISSING_PASSAGE} />
        </section>
      );
    const [section, contrary] = group;
    if (!contrary) return drawSection(section);
    return (
      <div key={section.line} className="grid min-w-0 gap-4 lg:grid-cols-12">
        <div className="grid min-w-0 lg:col-span-7">{drawSection(section)}</div>
        <div className="grid min-w-0 lg:col-span-5 [&>*]:border-info-edge [&>*]:bg-info-fill">
          {drawSection(contrary)}
        </div>
      </div>
    );
  });
  return beforeLimitations
    ? [
        ...drawn.slice(0, figuresAt),
        <Fragment key="before-limitations">{beforeLimitations}</Fragment>,
        ...drawn.slice(figuresAt),
      ]
    : drawn;
}

type FindingSectionProps = {
  section: Section;
  run: PublishedRun;
  entry: OutputEntry;
  overview: boolean;
  overviewLabel?: string;
  marker?: ReactNode;
  judgement?: string;
  trailingFigures?: ReactNode;
  beside?: ReactNode;
};

function BottomLinePassage({
  section,
  run,
  entry,
  overview,
  overviewLabel,
  marker,
  judgement,
  trailingFigures,
  beside,
  first,
}: FindingSectionProps & { first: Extract<Block, { type: "text" }> }) {
  const body = readParagraph(first.text).body;
  const referenced = containsReference(body);
  const prose = referenced ? "" : readerText(body.replaceAll("**", "").replaceAll("`", ""));
  return (
    <div
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3"
      key={section.line}
      id={`finding-${String(section.line)}`}
      tabIndex={-1}
    >
      <div className={beside ? "grid min-w-0 gap-4 lg:grid-cols-12" : "grid min-w-0"}>
        <div className={beside ? "min-w-0 lg:col-span-8" : "min-w-0"}>
          <BottomLine
            level="h2"
            marker={marker}
            lead={
              referenced ? (
                <Button
                  href={evidencePath(run.folder, entry, first.line)}
                  color="link-gray"
                  size="sm"
                  iconTrailing={ArrowRight}
                >
                  Read this passage in Evidence
                </Button>
              ) : undefined
            }
            text={{
              label: findingLabel(section, overviewLabel),
              lead: referenced ? "" : (judgement ?? prose),
              rest: judgement ? prose : "",
              trace: traceKey(entry, first.line),
            }}
          />
        </div>
        {beside ? <div className="min-w-0 lg:col-span-4">{beside}</div> : null}
      </div>
      {trailingFigures}
      <BottomLineContinuation
        section={section}
        entry={entry}
        folder={run.folder}
        overview={overview}
        overviewLabel={overviewLabel}
      />
    </div>
  );
}

function BottomLineContinuation({
  section,
  entry,
  folder,
  overview,
  overviewLabel,
}: {
  section: Section;
  entry: OutputEntry;
  folder: string;
  overview: boolean;
  overviewLabel?: string;
}) {
  if (!overview) {
    return section.blocks.slice(1).some((block) => block.type === "text") ? (
      <div className={card}>{followingParagraphs(section, entry, folder)}</div>
    ) : null;
  }
  if (section.blocks.length < 2) return null;
  return (
    <details className="rounded-lg border border-border-hairline bg-surface-card px-5 py-3">
      <summary className="cursor-pointer font-medium">
        {overviewLabel ?? (entry.output.module === "CP-1B" ? "Earnings view" : "Credit view")},
        continued
      </summary>
      <div className="mt-3 grid gap-3">{followingParagraphs(section, entry, folder)}</div>
    </details>
  );
}

function PassageBlock({
  block,
  section,
  overview,
  entry,
  folder,
}: {
  block: Block;
  section: Section;
  overview: boolean;
  entry: OutputEntry;
  folder: string;
}) {
  const key = (line: number) => traceKey(entry, line);
  if (block.type === "text")
    return (
      <FindingParagraph
        block={block}
        trace={key(block.line)}
        href={evidencePath(folder, entry, block.line)}
      />
    );
  if (block.type !== "table") return null;
  return (
    <div className="min-w-0">
      {(!overview && typedModuleTable(entry.output.module, section.heading, block, key)) || (
        <PublishedTable
          table={block}
          heading={plainText(drawingTitle(section.heading))}
          traceAt={key}
          rowHref={(line) => evidencePath(folder, entry, line)}
        />
      )}
    </div>
  );
}

function typedStandaloneTable(
  { section, entry, overview }: FindingSectionProps,
  first: Block | undefined,
) {
  if (overview || section.blocks.length !== 1 || first?.type !== "table") return null;
  return typedModuleTable(entry.output.module, section.heading, first, (line) =>
    traceKey(entry, line),
  );
}

function FindingSection(props: FindingSectionProps) {
  const { section, run, entry, overview, overviewLabel, trailingFigures } = props;
  const first = section.blocks[0];
  if (section.heading === "Bottom line" && first?.type === "text")
    return <BottomLinePassage {...props} first={first} />;
  const typed = typedStandaloneTable(props, first);
  if (typed) {
    return (
      <div className={card} id={`finding-${String(section.line)}`} tabIndex={-1}>
        {typed}
      </div>
    );
  }
  return (
    <Fragment key={section.line}>
      <section className={card} id={`finding-${String(section.line)}`} tabIndex={-1}>
        <h2 className={`${heading} first-letter:uppercase`}>
          {richParts(drawingTitle(findingLabel(section, overviewLabel)), readerText)}
        </h2>
        {section.blocks.map((block) => (
          <PassageBlock
            key={block.line}
            block={block}
            section={section}
            overview={overview}
            entry={entry}
            folder={run.folder}
          />
        ))}
      </section>
      {section.heading === "Bottom line" && trailingFigures}
    </Fragment>
  );
}

function findingsEvidence(
  snapshot: Snapshot,
  entry: OutputEntry,
  entryIndex: number,
  sections: Section[],
  drawnBottomLine: boolean,
  pathway?: string | null,
) {
  const key = (line: number) => traceKey(entry, line);
  const traces = sectionTraces(snapshot, entry, sections, pathway);
  const summary = !drawnBottomLine && entry.output.summary;
  const summaryTrace = summary && traceForLine(snapshot, entry, entryIndex, summary.line, pathway);
  if (summaryTrace) traces[key(summary.line)] = summaryTrace;
  return { traces, summary, summaryTrace };
}

function FindingsTraceDrawer({
  trace,
  folder,
  onClose,
}: {
  trace: Trace | null | undefined;
  folder: string;
  onClose: () => void;
}) {
  if (!trace) return null;
  return (
    <TraceDrawer
      trace={trace}
      evidenceHref={evidenceHref(folder, trace.evidenceItem)}
      isOpen
      onClose={onClose}
    />
  );
}

export function ReportFindings({
  snapshot,
  run,
  entry,
  entryIndex,
  overview = false,
  overviewLabel,
  afterBottomLine,
  besideBottomLine,
  moduleConfidence,
  beforeLimitations,
  judgement,
  figureTableLines,
  chartsDrawn = false,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entry: OutputEntry;
  entryIndex: number;
  overview?: boolean;
  overviewLabel?: string;
  afterBottomLine?: ReactNode;
  /** Overview draws this tile beside the bottom line on a wide screen. */
  besideBottomLine?: ReactNode;
  /** Modules supplies its confidence tile as a fallback for an unscored or absent Bottom line. */
  moduleConfidence?: ReactNode;
  /** Drawn after the prose passages and before Limitations (after the last passage without one). */
  beforeLimitations?: ReactNode;
  judgement?: string;
  figureTableLines?: readonly number[];
  chartsDrawn?: boolean;
}) {
  const [activeTrace, setActiveTrace] = useState<string | null>(null);
  const { sections, groups, figuresAt, drawnBottomLine } = findingsLayout(
    entry,
    figureTableLines,
    overview,
    chartsDrawn,
  );
  const { traces, summary, summaryTrace } = findingsEvidence(
    snapshot,
    entry,
    entryIndex,
    sections,
    drawnBottomLine,
    run.pathway,
  );
  const { marker, trailingFigures } = confidencePresentation({
    snapshot,
    entry,
    sections,
    summary,
    traces,
    moduleConfidence,
    afterBottomLine,
    pathway: run.pathway,
  });
  const active = activeTrace === null ? null : traces[activeTrace];
  const records = overview ? [] : recordSections(entry.sections, entry);
  if (!sections.length && !summary)
    return (
      <EmptyFindings
        run={run}
        entry={entry}
        records={records}
        afterBottomLine={trailingFigures}
        beforeLimitations={beforeLimitations}
      />
    );
  const drawSection = (section: Section) => (
    <FindingSection
      key={section.line}
      section={section}
      run={run}
      entry={entry}
      overview={overview}
      overviewLabel={overviewLabel}
      marker={marker}
      judgement={judgement}
      trailingFigures={trailingFigures}
      beside={besideBottomLine}
    />
  );
  const drawn = renderFindingGroups(groups, drawSection, summary, beforeLimitations, figuresAt);
  return (
    <RunContext.Provider value={{ traces, open: setActiveTrace }}>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
        <FindingsSummary
          summary={summary}
          entry={entry}
          summaryTrace={summaryTrace}
          marker={marker}
        />
        {!drawnBottomLine && trailingFigures}
        {drawn}
        <RecordsCard run={run} entry={entry} records={records} />
      </div>
      <FindingsTraceDrawer
        trace={active}
        folder={run.folder}
        onClose={() => {
          setActiveTrace(null);
        }}
      />
    </RunContext.Provider>
  );
}
