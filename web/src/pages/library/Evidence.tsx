import { useState } from "react";
import { EvidenceGaps } from "./EvidenceGaps";
import { EvidenceRecord } from "./EvidenceRecord";
import { EvidenceSources } from "./EvidenceSources";
import { EvidenceSummary } from "./EvidenceSummary";
import { EvidenceTrace } from "./EvidenceTrace";
import type { Evidence as EvidenceData, LoadedRun, Metric, Reader, SourceFile } from "./slice";
import { EvidenceFrame, type EvidenceTab } from "./parts/EvidenceFrame";
import { useModuleFilter } from "./parts/ModuleFilter";
import { RunFrame } from "./parts/RunFrame";

/** Whether the module read the file: ids only are compared, across the avatars drawn and the "+N". */
const reads = (file: SourceFile, module: Reader) =>
  file.readers.shown.some((reader) => reader.id === module.id) ||
  file.readers.more?.ids.includes(module.id) === true;

/** A count of the chosen module's rows: a real zero is "0", and it carries no trace. */
const count = (label: string, rows: number, note: string): Metric => ({
  label,
  value: { kind: "value", text: String(rows), at: null },
  note,
  trace: null,
});

/**
 * The Summary's three count tiles are the run's; with a module chosen they are instead the rows the
 * Sources, Trace and Gaps tabs draw for it, counted from those rows. The delivered notes under the
 * run's tiles are the run's too, so they are not drawn. A run that delivers `trace.emptyText` was not
 * traced item by item: its middle tile says so, and counting no Trace row for a module would turn that
 * into a measured zero, so the middle tile stays as delivered and nothing is counted for it.
 */
function summaryFor(evidence: EvidenceData, module: Reader): EvidenceData {
  const gaps = evidence.gaps.groups.flatMap((group) => group.rows);
  const files = evidence.sources.files.filter((file) => reads(file, module));
  const items = evidence.trace.rows.filter((row) => row.moduleId === module.id);
  const traced =
    evidence.trace.emptyText === null
      ? [count("Traced items", items.length, `In ${module.name}`)]
      : evidence.summary.counts.filter((metric) => metric.label === "Calculations");
  return {
    ...evidence,
    summary: {
      ...evidence.summary,
      counts: [
        count("Source files read", files.length, `By ${module.name}`),
        ...traced,
        count("Gaps", gaps.filter((row) => row.moduleId === module.id).length, `In ${module.name}`),
      ],
    },
  };
}

/**
 * One run's Evidence pages inside the run's frame. The module filter is held here, above the five
 * tabs: this component stays while the tab changes, so the choice stays, and each tab applies it
 * to what it holds per module. The run's frame keys this by the run, so a run starts at "All".
 */
function EvidencePages({
  run,
  issuer,
  page,
  item,
  restarts,
  onSameAddress,
}: {
  run: LoadedRun;
  issuer: string;
  page: Extract<EvidenceTab, "summary" | "sources" | "trace" | "gaps" | "record">;
  item: string | undefined;
  /** Counts picks of the address already shown; with `item` it names the page afresh. */
  restarts: number;
  onSameAddress: () => void;
}) {
  const { evidence } = run;
  // The tab is part of the address: Trace and Gaps can both carry the same id, and each is its own row.
  const address = `${page}/${item ?? ""}/${String(restarts)}`;
  const { chosen, clear, control } = useModuleFilter(
    evidence.moduleFilter,
    item === undefined ? null : address,
  );
  const body = () => {
    switch (page) {
      case "sources":
        return <EvidenceSources sources={evidence.sources} module={chosen} onClear={clear} />;
      case "trace":
        return (
          <EvidenceTrace
            key={address}
            table={evidence.trace}
            count={evidence.tabs.trace}
            module={chosen}
            onClear={clear}
            item={item ?? null}
          />
        );
      case "gaps":
        return (
          <EvidenceGaps
            key={address}
            table={evidence.gaps}
            count={evidence.tabs.gaps}
            module={chosen}
            onClear={clear}
            issuer={issuer}
            run={run.id}
            item={item ?? null}
          />
        );
      case "record":
        return (
          <EvidenceRecord
            record={evidence.record}
            modules={run.modules.length}
            module={chosen}
            onClear={clear}
          />
        );
      case "summary":
        return (
          <EvidenceSummary
            evidence={chosen === null ? evidence : summaryFor(evidence, chosen)}
            issuer={issuer}
            run={run.id}
          />
        );
    }
  };
  return (
    <EvidenceFrame
      issuer={issuer}
      run={run.id}
      evidence={evidence}
      current={page}
      filter={control}
      onSameAddress={onSameAddress}
    >
      {body()}
    </EvidenceFrame>
  );
}

/** An Evidence page of a run: the run's frame, the Evidence frame with its tabs, then the page. */
export function Evidence({
  issuer,
  run,
  page,
  item,
}: {
  issuer: string | undefined;
  run: string | undefined;
  page: Extract<EvidenceTab, "summary" | "sources" | "trace" | "gaps" | "record">;
  /** The row the address names, on the Trace and Gaps pages only. */
  item?: string | undefined;
}) {
  /** Counts picks of the address already shown: the hash will not change, so one restarts the page. */
  const [restarts, setRestarts] = useState(0);
  return (
    <RunFrame issuer={issuer} run={run} tab="evidence">
      {(loaded, issuerId) => (
        <EvidencePages
          run={loaded}
          issuer={issuerId}
          page={page}
          item={item}
          restarts={restarts}
          onSameAddress={() => {
            setRestarts((n) => n + 1);
          }}
        />
      )}
    </RunFrame>
  );
}
