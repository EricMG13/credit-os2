/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role -- explicit table roles keep the table semantics when the parts are drawn as stacked blocks on a phone */
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { StatsStrip } from "@/components/kit/StatsStrip";
import { StatusBadge } from "@/components/status/StatusBadge";
import { FileSearch02 } from "@untitledui/icons";
import { moduleName } from "../api";
import {
  classifySections,
  evidencePath,
  plainModuleNames,
  type OutputEntry,
  type PublishedRun,
  type Section,
  type Table,
} from "../publishedReport";
import { richParts } from "../richText";
import { Tile } from "./overview/Tile";
import { STACK } from "./evidenceKit";
import { handoffName } from "./evidenceLabels";

export type GapRecord = { line: number; title: string; severity: string | null; details: string };
type GapItem = { entry: OutputEntry; section: Section; gap: GapRecord };

function noGap(value: string | undefined) {
  return /^(?:none|no|nil|n\/a|n\.a\.)\.?$/i.test((value ?? "").trim());
}

function gapTitleIndex(headers: string[]) {
  const titleHeader = (header: string) =>
    !/severity/i.test(header) && !/^(?:id|gap id|reference|ref)$/i.test(header.trim());
  const titled = headers.findIndex(
    (header) => titleHeader(header) && /gap|missing|issue|item|shortfall|risk/i.test(header),
  );
  return titled >= 0 ? titled : Math.max(0, headers.findIndex(titleHeader));
}

function tableGapRecords(block: Table): GapRecord[] {
  const severityIndex = block.headers.findIndex((header) => /severity/i.test(header));
  const titleIndex = gapTitleIndex(block.headers);
  return block.rows.flatMap((row) => {
    const title = row.cells[titleIndex]?.trim() ?? "";
    if (!title || noGap(title)) return [];
    return [
      {
        line: row.line,
        title,
        severity: severityIndex < 0 ? null : row.cells[severityIndex]?.trim() || null,
        details: block.headers
          .map((header, index) => ({ header, value: row.cells[index]?.trim() ?? "" }))
          .filter(({ value }, index) => value && index !== titleIndex && index !== severityIndex)
          .map(({ header, value }) => `${header}: ${value}`)
          .join("\n"),
      },
    ];
  });
}

function gapRecords(blocks: Section["blocks"]): GapRecord[] {
  const records: GapRecord[] = [];
  for (const block of blocks) {
    if (block.type === "text") {
      const text = block.text.trim();
      if (text && !noGap(text))
        records.push({
          line: block.line,
          title: "Gap recorded as text",
          severity: null,
          details: text,
        });
      continue;
    }
    if (
      block.type !== "table" ||
      (block.headers.includes("Earlier ref") && block.headers.includes("Current ref"))
    )
      continue;
    for (const record of tableGapRecords(block)) records.push(record);
  }
  return records;
}

export function hasRecordedGap(blocks: Section["blocks"]) {
  return gapRecords(blocks).length > 0;
}

/** Every gap row the handoffs wrote, for one module or all. */
export function collectGaps(entries: OutputEntry[], module?: string): GapItem[] {
  return entries.flatMap((entry) => {
    if (module && entry.output.module !== module) return [];
    return classifySections(entry.sections)
      .filter(({ role }) => role === "gaps")
      .flatMap(({ section }) => gapRecords(section.blocks).map((gap) => ({ entry, section, gap })));
  });
}

const RANKED = ["High", "Medium", "Low"] as const;
type Ranked = (typeof RANKED)[number];
const NONE = "No severity stated";
const NONE_KEY = "\u0000none";

/** The severity that IS one of the three words: case and surrounding space ignored, a parenthetical allowed. */
function rankOf(severity: string | null): Ranked | null {
  const word = /^([A-Za-z]+)(?:\s*\([^)]*\))?$/.exec((severity ?? "").trim())?.[1]?.toLowerCase();
  return RANKED.find((ranked) => ranked.toLowerCase() === word) ?? null;
}

type SeverityGroup = { key: string; label: string; rank: number; items: GapItem[] };

/**
 * Gaps by the severity they state. Words the page does not rank come first, each under its own
 * words in the order written; then High, Medium and Low; then gaps with no severity stated.
 */
function severityGroups(items: GapItem[]) {
  const groups = new Map<string, SeverityGroup>();
  for (const item of items) {
    const raw = item.gap.severity?.trim() || null;
    const ranked = rankOf(raw);
    const key = ranked ?? raw?.toLowerCase() ?? NONE_KEY;
    const group = groups.get(key) ?? {
      key,
      label: ranked ?? raw ?? NONE,
      rank: ranked ? 1 + RANKED.indexOf(ranked) : raw ? 0 : RANKED.length + 1,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group, order) => ({ group, order }))
    .sort((a, b) => a.group.rank - b.group.rank || a.order - b.order)
    .map(({ group }) => group);
}

function SeverityLabel({ label }: { label: string }) {
  if (RANKED.includes(label as Ranked))
    return <StatusBadge set="Gap severity" state={label as Ranked} />;
  return label === NONE ? <span className="text-text-tertiary">{label}</span> : label;
}

/**
 * One count per severity word the gaps carry: High, Medium and Low when any gap states one of
 * those, every other word as written, and the gaps that state none. A word no gap carries is not drawn.
 */
export function GapCounts({ items }: { items: GapItem[] }) {
  const groups = severityGroups(items);
  const anyRanked = groups.some(({ rank }) => rank >= 1 && rank <= RANKED.length);
  const counts = new Map(groups.map(({ label, items: rows }) => [label, rows.length]));
  return (
    <StatsStrip
      label="Gaps by severity"
      stats={[
        ...groups
          .filter(({ rank }) => rank === 0)
          .map(({ label, items: rows }) => ({ label, value: String(rows.length) })),
        ...(anyRanked
          ? RANKED.map((severity) => ({
              label: severity,
              value: String(counts.get(severity) ?? 0),
            }))
          : []),
        ...groups
          .filter(({ rank }) => rank > RANKED.length)
          .map(({ label, items: rows }) => ({ label, value: String(rows.length) })),
      ]}
    />
  );
}

function NoGaps({ module, compact = false }: { module?: string; compact?: boolean }) {
  const words = module
    ? `No module-written gaps for ${moduleName(module)}.`
    : "The module handoffs list no gaps.";
  if (compact)
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <FileSearch02 aria-hidden="true" className="size-5 flex-none text-text-tertiary" />
        <h4 className="text-small font-medium text-text-primary">No gaps recorded</h4>
        <p className="text-small text-text-secondary">{words}</p>
      </div>
    );
  return (
    <EmptyState className="py-5">
      <EmptyState.Header>
        <EmptyState.FeaturedIcon icon={FileSearch02} />
      </EmptyState.Header>
      <EmptyState.Content>
        <EmptyState.Title as="h3">No gaps recorded</EmptyState.Title>
        <EmptyState.Description>{words}</EmptyState.Description>
      </EmptyState.Content>
    </EmptyState>
  );
}

function GapLedger({
  run,
  items,
  detail,
}: {
  run: PublishedRun;
  items: GapItem[];
  detail: boolean;
}) {
  const headings = detail
    ? ["Gap", "Recorded detail", "Module", "Trace"]
    : ["Gap", "Module", "Trace"];
  return (
    <div
      role="region"
      aria-label="Gaps by severity group"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="min-w-0 overflow-x-auto rounded-ds-md border border-border-hairline"
    >
      <table role="table" className={STACK.table}>
        <caption className="sr-only">
          Gaps ordered by the severity words the page does not rank, as written, then High, Medium,
          Low, then those with none stated
        </caption>
        <thead role="rowgroup" className={STACK.head}>
          <tr role="row">
            {headings.map((heading) => (
              <th key={heading} role="columnheader" scope="col" className="px-4 py-3 font-medium">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        {severityGroups(items).map(({ key, label, items: rows }) => (
          <tbody role="rowgroup" key={key} className={STACK.body}>
            <tr role="row" className="border-t border-border-hairline bg-surface-subtle">
              <th
                role="rowheader"
                scope="rowgroup"
                colSpan={headings.length}
                className="px-4 py-2 text-left font-semibold max-md:block"
              >
                <span className="flex items-center gap-2">
                  <SeverityLabel label={label} />
                  <Badge size="sm" color="gray">
                    {String(rows.length)}
                  </Badge>
                </span>
              </th>
            </tr>
            {rows.map(({ entry, section, gap }) => (
              <tr role="row" key={`${entry.output.id}-${String(gap.line)}`} className={STACK.row}>
                <th
                  role="rowheader"
                  scope="row"
                  data-label={headings[0]}
                  className={`${STACK.cell} min-w-40 font-medium text-text-primary`}
                >
                  {plainModuleNames(gap.title || section.heading)}
                </th>
                {detail && (
                  <td
                    role="cell"
                    data-label="Recorded detail"
                    className={`${STACK.cell} min-w-56 whitespace-pre-wrap text-text-secondary`}
                  >
                    {richParts(gap.details || "No additional detail recorded.")}
                  </td>
                )}
                <td role="cell" data-label="Module" className={`${STACK.cell} text-text-secondary`}>
                  {handoffName(entry)}
                  {gap.severity && gap.severity.trim() !== label && (
                    <span className="mt-1 block text-text-tertiary">
                      Severity as written: {gap.severity.trim()}
                    </span>
                  )}
                </td>
                <td role="cell" data-label="Trace" className={`${STACK.cell} py-2`}>
                  <Button
                    href={evidencePath(run.folder, entry, gap.line)}
                    color="link-gray"
                    size="sm"
                    className="min-h-8 max-[480px]:min-h-11"
                  >
                    Open handoff line
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/** The Summary's gaps: the counts, then the list in severity order. */
export function GapSummary({
  run,
  entries,
  module,
}: {
  run: PublishedRun;
  entries: OutputEntry[];
  module?: string;
}) {
  const items = collectGaps(entries, module);
  return (
    <Tile
      span={12}
      label="Gaps summary"
      className={items.length === 0 ? "gap-2 p-4 sm:p-4" : undefined}
      kicker="What this run could not establish. Severity words the page does not rank come first, as written; then High, Medium, Low; then none stated"
      title={
        <>
          Gaps{" "}
          <span className="ml-1 text-small font-normal text-text-secondary">{items.length}</span>
        </>
      }
    >
      {items.length === 0 ? (
        <NoGaps module={module} compact />
      ) : (
        <>
          <GapCounts items={items} />
          <GapLedger run={run} items={items} detail={false} />
        </>
      )}
    </Tile>
  );
}

/** The Gaps tab: the same counts and list with the detail each handoff recorded. */
export function EvidenceGaps({
  run,
  entries,
  module,
}: {
  run: PublishedRun;
  entries: OutputEntry[];
  module?: string;
}) {
  const items = collectGaps(entries, module);
  return (
    <Tile
      span={12}
      label="Gaps"
      kicker="What this run could not establish, with the detail each handoff records"
      title={
        <>
          Gaps{" "}
          <span className="ml-1 text-small font-normal text-text-secondary">{items.length}</span>
        </>
      }
    >
      {items.length === 0 ? (
        <NoGaps module={module} />
      ) : (
        <>
          <GapCounts items={items} />
          <GapLedger run={run} items={items} detail />
        </>
      )}
    </Tile>
  );
}
