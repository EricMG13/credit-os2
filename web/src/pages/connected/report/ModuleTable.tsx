import { MatrixBlock } from "@/pages/library/parts/MatrixBlock";
import { QuestionsBlock } from "@/pages/library/parts/QuestionsBlock";
import { StatementBlock } from "@/pages/library/parts/StatementBlock";
import { WatchBlock } from "@/pages/library/parts/WatchBlock";
import type { AnswerState, Cell } from "@/pages/library/slice";
import { TRACE_HOST, TraceControl } from "@/pages/library/parts/TraceControl";
import { SECTION_HEADING, SUBSECTION_HEADING } from "@/pages/library/parts/heading";
import {
  containsReference,
  displayColumns,
  readerText,
  unitLabel,
  withoutReferences,
  type Table,
} from "../publishedReport";
import { plainText, richParts } from "../richText";

/** A register code at the start of a heading (T4.18, T2B.7 -, TL10.2), with its dash. */
const REGISTER_CODE =
  /^(?:(?:TL|T|P)[A-Z0-9]{0,5}\.\d+(?:\.\d+)?\s+(?:[-–—:]\s*)?|(?:TL|T|P)[A-Z0-9]{0,5}\s*[-–—:]\s+)/;

/** A heading as a typed table draws it: no register code, module names for codes. */
const shownTitle = (title: string) => readerText(plainText(title).replace(REGISTER_CODE, ""));

function visible(table: Table) {
  const indexes = displayColumns(table.headers, false, table.rows);
  const headers = indexes.map((index) => table.headers[index] ?? "");
  return {
    headers,
    rows: table.rows.map(({ cells, line }) => ({
      line,
      cells: indexes.map((index) => cells[index] ?? ""),
    })),
  };
}

function cellText(text: string | undefined) {
  if (!text || !containsReference(text)) return readerText(text ?? "");
  // The cell's own words stay; a cell that only cites a source reads "In Evidence".
  return readerText(withoutReferences(text)) || "In Evidence";
}

const LEDGER_ORDER = ["Closed", "Remaining", "New", "No longer stated"];

// CP-8's limitations ledger: one group per status; the two reference columns stay in Evidence.
function limitations(data: ReturnType<typeof visible>, traceAt: (line: number) => string) {
  const at = (name: string) => data.headers.findIndex((header) => header.trim() === name);
  const [limitation, status, closed] = [at("Limitation"), at("Status"), at("What closed it")];
  if (limitation < 0 || status < 0 || closed < 0) return null;
  const groups = new Map<string, { text: string; closed: string; line: number }[]>();
  for (const { cells, line } of data.rows) {
    const label = readerText(plainText(cells[status] ?? "")).trim();
    const note = cells[closed]?.trim() ?? "";
    groups.set(label, [
      ...(groups.get(label) ?? []),
      { text: cells[limitation] ?? "", closed: note === "\u2014" ? "" : note, line },
    ]);
  }
  const labels = [...groups.keys()];
  const ordered = [
    ...LEDGER_ORDER.filter((label) => groups.has(label)),
    ...labels.filter((label) => !LEDGER_ORDER.includes(label)),
  ];
  const Heading = SUBSECTION_HEADING;
  const Title = SECTION_HEADING;
  return (
    <section aria-label="Limitations" className="flex flex-col gap-4">
      <Title className="font-display text-h3 text-text-primary">Limitations ledger</Title>
      {ordered.map((label) => {
        const items = groups.get(label) ?? [];
        return (
          <div key={label} className="flex flex-col gap-2">
            <Heading className="font-semibold">{`${label} (${String(items.length)})`}</Heading>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.line}
                  className={`${TRACE_HOST} flex flex-wrap items-start gap-2 rounded-lg border border-border-hairline bg-surface-card p-2 text-sm`}
                >
                  <span className="min-w-0 flex-1 wrap-anywhere">
                    {richParts(item.text, readerText)}
                  </span>
                  <TraceControl
                    trace={traceAt(item.line)}
                    label={`Show sources for ${readerText(plainText(item.text))}`}
                  />
                  {item.closed && (
                    <p className="basis-full text-caption text-text-secondary">
                      {richParts(item.closed, readerText)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function monitoringShape(title: string, data: ReturnType<typeof visible>) {
  const signature = data.headers.join("|");
  return (
    /^T2\.12(?:\s|$)/.test(title) &&
    (signature === "Trigger|Threshold|Signal|Why It Matters|Credit Impact|Limitation" ||
      signature === "Trigger|Threshold|Signal|Why It Matters|Credit Impact" ||
      signature === "Trigger|Threshold / Signal|Why It Matters|Credit Impact")
  );
}

function monitoringTitle(module: string, title: string, data: ReturnType<typeof visible>) {
  if (module === "CP-2" && monitoringShape(title, data)) return "Monitoring triggers";
  if (
    module === "CP-2A" &&
    /^T2B\.7 Monitoring sensitivity flags$/i.test(title) &&
    data.headers.join("|") ===
      "Indicator|Leading / Lagging|Threshold or Qualitative Signal|Limitation" &&
    data.rows.every(({ cells }) => /^(?:Leading|Lagging)$/i.test(cells[1] ?? ""))
  )
    return "Monitoring sensitivities";
  return null;
}

export function monitoringLabel(module: string, title: string, table: Table) {
  if (module !== "CP-2" && module !== "CP-2A") return null;
  return monitoringTitle(module, title, visible(table));
}

/** The monitoring table's own column headings as the page draws them: sentence case, like every label. */
const WATCH_LABELS: Readonly<Record<string, string | undefined>> = {
  "Why It Matters": "Why it matters",
  "Credit Impact": "Credit impact",
};

function monitoring(
  title: string,
  data: ReturnType<typeof visible>,
  traceAt: (line: number) => string,
) {
  const timed = data.headers[1] === "Leading / Lagging";
  const thresholdAt = timed ? 2 : 1;
  const detailAt = thresholdAt + 1;
  return (
    <WatchBlock
      block={{
        kind: "watch",
        title,
        items: data.rows.map(({ cells, line }) => ({
          indicator: cellText(cells[0]),
          threshold: cellText(cells[thresholdAt]),
          timing: timed ? (cells[1]?.toLowerCase() === "leading" ? "leading" : "lagging") : null,
          detail: data.headers.slice(detailAt).flatMap((label, index) => {
            const text = cellText(cells[index + detailAt]);
            return text ? [{ label: WATCH_LABELS[label] ?? label, text }] : [];
          }),
          trace: traceAt(line),
        })),
      }}
    />
  );
}

function readingCell(text: string): Cell {
  if (!text) return null;
  if (/^withheld(?:[:\s]|$)/i.test(text)) return { kind: "withheld", reason: readerText(text) };
  if (/^not (?:supplied|stated|calculable|modelled)(?:[:\s]|$)/i.test(text))
    return { kind: "gap", reason: readerText(text) };
  return { kind: "value", text: readerText(text), at: null };
}

function statement(
  title: string,
  data: ReturnType<typeof visible>,
  traceAt: (line: number) => string,
) {
  const unit = data.headers.indexOf("Unit");
  if (data.headers[0] !== "Line item" || unit < 2) return null;
  const periods = data.headers.slice(1, unit);
  if (!periods.every((period) => /^(?:FY|H[12] |Q[1-4] |LTM |20\d\d-)/.test(period))) return null;
  if (data.headers.slice(unit + 1).some((name) => name !== "Basis")) return null;
  const rows = data.rows.map(({ cells, line }) => ({
    label: readerText(
      [cells[0], unitLabel((cells[unit] ?? "").trim()), cells[unit + 1]]
        .filter(Boolean)
        .join(" · "),
    ),
    cells: cells.slice(1, unit).map(readingCell),
    emphasis: false,
    line,
  }));
  if (new Set(rows.map(({ label }) => label)).size !== rows.length) return null;
  return (
    <StatementBlock
      block={{
        kind: "statement",
        title: shownTitle(title),
        nav: null,
        trace: null,
        periods,
        basis: null,
        rows,
        stub: data.headers[0],
      }}
      traceForRow={(index) => {
        const row = rows[index];
        return row ? traceAt(row.line) : null;
      }}
    />
  );
}

function research(
  title: string,
  data: ReturnType<typeof visible>,
  traceAt: (line: number) => string,
) {
  if (
    data.headers.join("|") !== "Question|Status|Answer in brief|Evidence families|What stays open"
  )
    return null;
  const options = new Set(["Answered", "Partly answered", "Not answered"]);
  if (data.rows.some(({ cells }) => !options.has(cells[1] ?? ""))) return null;
  return (
    <QuestionsBlock
      block={{
        kind: "questions",
        title: shownTitle(title),
        items: data.rows.map(({ cells, line }) => ({
          question: readerText(cells[0] ?? ""),
          state: cells[1] as AnswerState,
          answer:
            readerText(
              [cells[2], cells[4] && `Open question · ${cells[4]}`].filter(Boolean).join("\n"),
            ) || null,
          trace: traceAt(line),
        })),
      }}
    />
  );
}

export function typedModuleTable(
  module: string,
  title: string,
  table: Table,
  traceAt: (line: number) => string,
) {
  const data = visible(table);
  if (!data.rows.length) return null;
  // Source readiness is drawn by its lead (leads/sourceReadiness); the table itself is in records.
  if (module === "CP-0" && title === "Source-readiness summary") return null;
  const watchTitle = monitoringTitle(module, title, data);
  if (watchTitle) return monitoring(watchTitle, data, traceAt);
  const signature = data.headers.join("|");
  if (
    data.rows.some(({ cells }) =>
      cells.some((cell, i) => data.headers[i] !== "Evidence families" && containsReference(cell)),
    )
  )
    return null;
  if (module === "CP-8" && title === "Limitations ledger") return limitations(data, traceAt);
  if (signature === "Risk|Probability|Impact")
    return (
      <MatrixBlock
        block={{
          kind: "matrix",
          title: shownTitle(title),
          columns: data.headers,
          note: null,
          trace: null,
          rows: data.rows.map(({ cells, line }) => ({
            risk: readerText(cells[0] ?? ""),
            probability: cells[1] ? readerText(cells[1]) : null,
            impact: cells[2] ? readerText(cells[2]) : null,
            trace: traceAt(line),
          })),
        }}
      />
    );
  if (
    signature === "Indicator|Timing|Threshold" &&
    data.rows.every(({ cells }) => /^(?:Leading|Lagging)$/i.test(cells[1] ?? ""))
  )
    return (
      <WatchBlock
        block={{
          kind: "watch",
          title: shownTitle(title),
          items: data.rows.map(({ cells, line }) => ({
            indicator: readerText(cells[0] ?? ""),
            timing: cells[1]?.toLowerCase() === "leading" ? "leading" : "lagging",
            threshold: readerText(cells[2] ?? ""),
            trace: traceAt(line),
          })),
        }}
      />
    );
  return research(title, data, traceAt) ?? statement(title, data, traceAt);
}
