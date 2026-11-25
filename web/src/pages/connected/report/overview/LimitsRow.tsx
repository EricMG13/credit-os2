import { SlashCircle01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import {
  containsReference,
  evidencePath,
  readerText,
  type PublishedRun,
  type Snapshot,
} from "../../publishedReport";
import { moduleBottomLines, moduleState, runLimitations, type ReportView } from "../../reportView";
import { heldModules } from "./decision";
import { moduleName } from "../../api";
import { richParts } from "../../richText";
import { PublishedSource } from "../PublishedTrace";
import { Tile } from "./Tile";

type Limitation = ReturnType<typeof runLimitations>[number];
type RowProps = { snapshot: Snapshot; run: PublishedRun; view: ReportView };

const BLOCKED = "Not assessable";
const WELL = "flex min-w-0 flex-col gap-2.5 rounded-ds-sm border border-dashed px-4 pt-3.5 pb-4";
/** A module link inside a well: 32 px, 44 px on a phone. */
const MODULE_LINK =
  "inline-flex min-h-8 items-center rounded-ds-xs outline-focus-ring hover:underline max-[480px]:min-h-11";

/** Modules that could not assess: the lead first, then the others, each with what it wrote. */
function blockedModules(view: ReportView, run: PublishedRun) {
  const lead =
    view.lead && moduleState(view.lead) === BLOCKED
      ? [{ id: view.lead.output.module, name: moduleName(view.lead.output.module), text: null }]
      : [];
  const others = moduleBottomLines(view, run)
    .filter((row) => row.state === BLOCKED)
    .map(({ id, name, text }) => ({ id, name, text }));
  return [...lead, ...others];
}

function grouped(rows: readonly Limitation[]) {
  const groups = new Map<string, Limitation[]>();
  for (const row of rows) groups.set(row.id, [...(groups.get(row.id) ?? []), row]);
  return [...groups.values()];
}

function BlockedWell({ id, name, text }: { id: string; name: string; text: string | null }) {
  return (
    <li className={cx(WELL, "gap-hatch border-warning-mark")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-small font-medium text-text-primary">
          <a href={`#modules/${id}`} className={MODULE_LINK}>
            {name}
          </a>
        </h4>
        <span className="flex h-[22px] items-center gap-1.5 rounded-ds-xs border border-dashed border-warning-mark bg-surface-card px-2 text-caption text-warning-text">
          <SlashCircle01 aria-hidden="true" className="size-3.5" />
          {BLOCKED}
        </span>
      </div>
      {text !== null && (
        <p className="w-fit rounded-ds-xs bg-surface-card px-1.5 py-0.5 text-small text-text-primary">
          {text}
        </p>
      )}
    </li>
  );
}

/** One limitation in the module's words with its trace; `small` inside a well's narrow column. */
function LimitationLine({
  run,
  row,
  small = false,
}: {
  run: PublishedRun;
  row: Limitation;
  small?: boolean;
}) {
  const href = evidencePath(run.folder, row.entry, row.line);
  return (
    <li className="flex items-start justify-between gap-2">
      <p className={cx("reading-copy text-text-primary", small ? "text-small" : "text-body")}>
        {containsReference(row.text) ? (
          <Button color="link-gray" size="sm" href={href}>
            Read this limitation in Evidence
          </Button>
        ) : (
          richParts(row.text, readerText)
        )}
      </p>
      <PublishedSource
        href={href}
        name={`this limitation from ${row.name}`}
        linkLabel={`Source for this limitation from ${row.name}`}
      >
        View source
      </PublishedSource>
    </li>
  );
}

function LimitationWell({ run, rows }: { run: PublishedRun; rows: Limitation[] }) {
  const [first, ...rest] = rows;
  if (!first) return null;
  return (
    // A dashed edge and the tile's hatched mark say "gap"; the sentences read on a plain surface.
    <li className={cx(WELL, "border-border-gap")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-small font-medium text-text-primary">
          <a href={`#modules/${first.id}`} className={MODULE_LINK}>
            {first.name}
          </a>
        </h4>
        <span className="flex h-[22px] items-center rounded-ds-xs border border-border-container bg-surface-card px-2 font-mono text-caption text-text-secondary tabular-nums">
          {rows.length} recorded
        </span>
      </div>
      <ul className="grid gap-2">
        <LimitationLine run={run} row={first} small />
      </ul>
      {rest.length > 0 && (
        // The first limitation stands for the module; the others are one press away, counted.
        <details>
          <summary className="flex min-h-8 w-fit cursor-pointer items-center rounded-ds-xs text-small font-medium text-text-secondary outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
            {`${String(rest.length)} more from ${first.name}`}
          </summary>
          <ul className="mt-1 grid gap-2">
            {rest.map((row) => (
              <LimitationLine
                key={`${row.entry.output.id}:${String(row.line)}`}
                run={run}
                row={row}
                small
              />
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}

/** One module's single limitation as a row of the compact list: the module, its words, its trace. */
function ListRow({ run, row }: { run: PublishedRun; row: Limitation }) {
  return (
    <li className="flex min-w-0 flex-col gap-1 border-t border-border-hairline py-2.5">
      <a
        href={`#modules/${row.id}`}
        className={cx(MODULE_LINK, "w-fit text-small font-medium text-text-primary")}
      >
        {row.name}
      </a>
      <ul>
        <LimitationLine run={run} row={row} />
      </ul>
    </li>
  );
}

/**
 * The limitations of the modules that are not blocked: one hatched well per module where a module
 * recorded several, or, when every module recorded one, a single compact list in two columns.
 */
function Recorded({ run, groups }: { run: PublishedRun; groups: Limitation[][] }) {
  if (groups.length === 0) return null;
  const single = groups.every((rows) => rows.length === 1);
  if (single)
    return (
      <ul aria-label="Limitations by module" className="grid gap-x-8 md:grid-cols-2">
        {groups.map(([row]) => row && <ListRow key={row.id} run={run} row={row} />)}
      </ul>
    );
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
      {groups.map((rows) => (
        <LimitationWell key={rows[0]?.id} run={run} rows={rows} />
      ))}
    </ul>
  );
}

/** What this run could not do, as a first-class tile: blocked modules first, then what the others recorded. */
export function LimitsRow({ run, view }: RowProps) {
  const blocked = blockedModules(view, run);
  // A held decision's limitations can restate it, so they stay on that module's page. One it
  // shares with another module stays listed under that module, so nothing of it is missing.
  const held = heldModules(view, run);
  const listed = runLimitations(view, run, held);
  const leftOut = runLimitations(view, run).filter(
    ({ id, text }) => held.includes(id) && !listed.some((row) => row.text === text),
  );
  const elsewhere = [...new Set(leftOut.map(({ name }) => name))];
  const groups = grouped(listed);
  return (
    <Tile span={12} label="What this run could not do">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3
          id="overview-limitations"
          tabIndex={-1}
          className="flex items-center gap-2.5 text-small font-medium text-text-primary"
        >
          <span
            aria-hidden="true"
            className="gap-hatch size-4 flex-none rounded-ds-xs border border-dashed border-border-gap"
          />
          What this run could not do
        </h3>
      </div>
      {blocked.length + groups.length === 0 ? (
        <p className="text-body text-text-secondary">
          No limitation is listed on this page for this run. Each module's page shows what it
          recorded.
        </p>
      ) : (
        <>
          {blocked.length > 0 && (
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
              {blocked.map((module) => (
                <BlockedWell key={module.id} {...module} />
              ))}
            </ul>
          )}
          <Recorded run={run} groups={groups} />
        </>
      )}
      {elsewhere.map((name) => (
        <p key={name} className="text-small text-text-secondary">
          {`Limitations recorded by ${name} are not in this list. That module's page shows what it recorded.`}
        </p>
      ))}
    </Tile>
  );
}
