import { Button } from "@/components/base/buttons/button";
import {
  CitedSources,
  TraceBasis,
  TraceClaim,
  TraceSourcePassage,
  withoutBasis,
  type SourcedTrace,
} from "@/pages/library/parts/TraceParts";
import { DerivationTree } from "@/pages/library/parts/DerivationTree";
import type { TreeNode } from "@/pages/library/slice";
import { ArrowRight } from "@untitledui/icons";
import { traceForLine } from "../ReportContent";
import type { OutputEntry, PublishedRun, Snapshot } from "../publishedReport";
import { Tile } from "./overview/Tile";
import { citationsAt } from "./traceCitations";

function referencedText(node: TreeNode): string {
  return [node.label, node.value, node.note, ...node.children.map(referencedText)]
    .filter(Boolean)
    .join("\n");
}

function namesSource(references: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    Boolean(name) &&
    new RegExp(`(?:^|[^\\p{L}\\p{N}._/-])${escaped}(?![\\p{L}\\p{N}._/-])`, "u").test(references)
  );
}

/**
 * The trace asked for, at the top of Evidence: the claim on the left, the passage it rests on with
 * its location on the right, then how it was derived and the supplied files the derivation names.
 * It draws the same `Trace` the drawer draws, so the two cannot disagree.
 */
export function TraceSplit({
  snapshot,
  run,
  entry,
  index,
  line,
}: {
  snapshot: Snapshot;
  run: PublishedRun;
  entry: OutputEntry;
  index: number;
  line: number;
}) {
  const base = traceForLine(snapshot, entry, index, line, run.pathway);
  if (!base) return null;
  const sourced: SourcedTrace = { ...base, citations: citationsAt(snapshot, entry, line) };
  const references = referencedText(base.derivation);
  const sources = [
    ...run.evidence.sources,
    ...run.evidence.unused,
    ...run.evidence.unrecorded,
  ].filter((source) => namesSource(references, source.name));
  return (
    <>
      <Tile span={7} label="The claim" kicker={base.subtitle} title={base.heading}>
        <TraceClaim trace={base} />
        <TraceBasis trace={base} />
      </Tile>
      <Tile span={5} label="The source" kicker="What it rests on">
        <TraceSourcePassage trace={sourced} />
        <CitedSources links={base.sourceLinks ?? []} />
      </Tile>
      <Tile span={12} label="How it was derived" kicker="Derivation" title="How it was derived">
        <div className={`grid min-w-0 gap-6 ${sources.length ? "lg:grid-cols-[3fr_2fr]" : ""}`}>
          <DerivationTree node={withoutBasis(base.derivation)} />
          {sources.length > 0 && (
            <div className="grid min-w-0 content-start gap-3">
              <h4 className="text-small font-medium text-text-primary">Source records</h4>
              <ul className="divide-y divide-border-hairline">
                {sources.map(({ name, documentDate, type, sha256 }) => (
                  <li key={name} className="grid gap-1 py-2">
                    <strong className="text-small wrap-anywhere">{name}</strong>
                    <p className="text-small text-text-secondary">{type || "Document type n.a."}</p>
                    <p className="text-small text-text-secondary">
                      {documentDate || "Document date n.a."}
                    </p>
                    {sha256 && (
                      <code className="font-mono text-mono wrap-anywhere text-text-tertiary">
                        {sha256}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
              <Button
                className="w-fit min-h-8 max-[480px]:min-h-11"
                href={`#evidence/sources/${encodeURIComponent(entry.output.module)}`}
                color="link-gray"
                size="sm"
                iconTrailing={ArrowRight}
              >
                Open Sources
              </Button>
            </div>
          )}
        </div>
      </Tile>
    </>
  );
}
