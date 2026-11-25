import { ArrowRight, Dataflow03 } from "@untitledui/icons";
import type { CSSProperties } from "react";
import { Button } from "@/components/base/buttons/button";
import { GapPanel } from "@/components/gap/GapPanel";
import { Pipeline, type PipelineNode } from "@/components/pipeline";
import { moduleName } from "../../api";
import { evidencePath, type PublishedRun, type Snapshot } from "../../publishedReport";
import { moduleBottomLines, moduleState, type ReportView } from "../../reportView";
import { TextLink } from "../../../run/TextLink";
import { PublishedSource } from "../PublishedTrace";
import { byStage } from "../stages";
import { Tile, Well } from "./Tile";

type RowProps = { snapshot: Snapshot; run: PublishedRun; view: ReportView };
type Line = ReturnType<typeof moduleBottomLines>[number];

const DELIVERED = "Delivered";
const BLOCKED = "Not assessable";
/** Every module of the run as a node: the lead, which the bottom lines leave out, and the rest. */
function nodes(view: ReportView, lines: readonly Line[]): PipelineNode[] {
  const lead = view.lead
    ? [
        {
          id: view.lead.output.module,
          name: moduleName(view.lead.output.module),
          state: moduleState(view.lead),
        },
      ]
    : [];
  return [...lead, ...lines.map(({ id, name, state }) => ({ id, name, state }))].map((node) => ({
    id: node.id,
    name: node.name,
    state: node.state === DELIVERED ? "delivered" : node.state === BLOCKED ? "blocked" : "queued",
    word: node.state,
    href: `#modules/${node.id}`,
  }));
}

/** Where item `index` of `count` goes when they fill `columns` columns top to bottom, the first
 *  columns taking the extra: thirteen items in three columns are 5, 4 and 4. */
function cell(index: number, count: number, columns: number) {
  const base = Math.floor(count / columns);
  const extra = count % columns;
  let column = 0;
  let start = 0;
  for (; column < columns; column += 1) {
    const size = base + (column < extra ? 1 : 0);
    if (index < start + size) return { column: column + 1, row: index - start + 1 };
    start += size;
  }
  return { column: columns, row: 1 };
}

function LineText({
  run,
  line,
  index,
  count,
}: {
  run: PublishedRun;
  line: Line;
  index: number;
  count: number;
}) {
  const two = cell(index, count, 2);
  const three = cell(index, count, 3);
  const source = evidencePath(run.folder, line.entry, line.line ?? undefined);
  return (
    <li
      style={
        {
          "--c2": two.column,
          "--r2": two.row,
          "--c3": three.column,
          "--r3": three.row,
        } as CSSProperties
      }
      className="flex items-start justify-between gap-2 border-t border-border-hairline pt-3 md:col-(--c2) md:row-(--r2) xl:col-(--c3) xl:row-(--r3)"
    >
      <div className="grid min-w-0 gap-1">
        <h3 className="text-small font-medium text-text-primary">{line.name}</h3>
        {line.withheld ? (
          <WithheldLine id={line.id} name={line.name} />
        ) : line.text !== null ? (
          <p className="reading-copy text-small text-text-secondary">{line.text}</p>
        ) : line.referenced ? (
          <Button color="link-gray" size="sm" href={source}>
            Read this bottom line in Evidence
          </Button>
        ) : (
          <GapPanel reason="This module wrote no bottom line; its output is in Evidence." />
        )}
      </div>
      {!line.withheld && (
        <PublishedSource href={source} name={line.name} linkLabel={`Source for ${line.name}`}>
          View source
        </PublishedSource>
      )}
    </li>
  );
}

/**
 * A decision module's bottom line is not shown on a summary page, and neither is its source: no
 * clearance is recorded for it. Its own page shows it. The line claims only what the page leaves
 * out: an unheld module's limitations stay listed here and may state the decision.
 */
function WithheldLine({ id, name }: { id: string; name: string }) {
  return (
    <p className="text-small text-text-secondary">
      This page does not show its bottom line: no clearance for it is recorded.{" "}
      <TextLink
        href={`#modules/${id}`}
        className="inline-flex min-h-8 items-center max-[480px]:min-h-11"
      >
        {`Open ${name}`}
      </TextLink>
    </p>
  );
}

function OpenModules() {
  return (
    <Button
      color="secondary"
      size="sm"
      href="#modules"
      iconTrailing={ArrowRight}
      className="max-md:min-h-11"
    >
      Open Modules
    </Button>
  );
}

/** The run as a staged node graph, then each module's bottom line in three balanced columns. */
export function PipelineRow({ run, view }: RowProps) {
  // The graph's stage order, whatever order the service listed the lines in.
  const lines = byStage(moduleBottomLines(view, run)).flatMap((stage) => stage.rows);
  const all = nodes(view, lines);
  if (!all.length) return null;
  const stages = byStage(all).map(({ name, rows }) => ({ name, nodes: rows }));
  return (
    <Tile span={12} label="Bottom line by module">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h3 className="flex items-center gap-2.5 text-small font-medium text-text-primary">
            <Dataflow03 aria-hidden="true" className="size-4 text-text-secondary" />
            Bottom line by module
          </h3>
          <p className="text-caption text-text-tertiary">
            <span className="font-mono tabular-nums">{all.length}</span>{" "}
            {all.length === 1 ? "module" : "modules"} in{" "}
            <span className="font-mono tabular-nums">{stages.length}</span>{" "}
            {stages.length === 1 ? "stage" : "stages"}
          </p>
        </div>
        <OpenModules />
      </div>
      <Well className="border border-border-hairline p-4 sm:p-6">
        <Pipeline label="Stages" stages={stages} flow="delivered" />
      </Well>
      {lines.length > 0 && (
        <ul
          aria-label="Bottom lines"
          className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {lines.map((line, index) => (
            <LineText key={line.id} run={run} line={line} index={index} count={lines.length} />
          ))}
        </ul>
      )}
    </Tile>
  );
}
