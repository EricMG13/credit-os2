import { FileSearch02 } from "@untitledui/icons";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { TraceButton } from "@/pages/library/parts/TraceControl";
import { TraceCitations } from "@/pages/library/parts/TraceCitations";
import { TraceDrawer } from "@/pages/library/parts/TraceDrawer";
import type { SourcedTrace } from "@/pages/library/parts/TraceParts";
import type { Trace } from "@/pages/library/slice";
import { handoffBlockAt, traceForLine } from "../ReportContent";
import { citationsAt } from "./traceCitations";
import type { TreeNode } from "@/pages/library/slice";
import {
  evidenceHref,
  readerText,
  resolveEvidenceLocation,
  type OutputEntry,
  type Snapshot,
} from "../publishedReport";

export type PublishedTraceContext = {
  heading: string;
  statement: string;
  details: { label: string; value: string | null }[];
  qualification?: string | null;
};

const readerNode = (node: TreeNode): TreeNode => ({
  label: readerText(node.label),
  value: node.value === null ? null : readerText(node.value),
  note: node.note === null ? null : readerText(node.note),
  children: node.children.map(readerNode),
});

/**
 * The drawer's words as the reader sees them: a module is named, never shown by its code. A code
 * inside a stored file name stays, and so do citations, hashes and the Evidence address.
 */
export function readerTrace<T extends Trace>(trace: T): T {
  return {
    ...trace,
    title: readerText(trace.title),
    heading: readerText(trace.heading),
    subtitle: readerText(trace.subtitle),
    statement: readerText(trace.statement),
    qualification: trace.qualification === null ? null : readerText(trace.qualification),
    derivation: readerNode(trace.derivation),
  };
}

type OpenTrace = (href: string, context?: PublishedTraceContext) => (() => void) | null;
const TraceContext = createContext<OpenTrace | null>(null);

export function PublishedTraceProvider({
  snapshot,
  folder,
  entries,
  route,
  children,
}: {
  snapshot: Snapshot;
  folder: string;
  entries: OutputEntry[];
  route: string;
  children: ReactNode;
}) {
  const [selection, setSelection] = useState<{ route: string; trace: SourcedTrace | null }>({
    route,
    trace: null,
  });
  if (selection.route !== route) setSelection({ route, trace: null });
  const active = selection.route === route ? selection.trace : null;
  const open = useCallback<OpenTrace>(
    (href, context) => {
      const prefix = evidenceHref(folder, "");
      if (!href.startsWith(prefix)) return null;
      const location = resolveEvidenceLocation(entries, href.slice(prefix.length));
      const line = location?.line;
      if (!location || line === undefined || !handoffBlockAt(location.entry, line)) return null;
      return () => {
        const base = traceForLine(snapshot, location.entry, location.index, line);
        const trace = base && { ...base, citations: citationsAt(snapshot, location.entry, line) };
        if (trace)
          setSelection({
            route,
            trace: context
              ? {
                  ...trace,
                  title: `Sources for ${context.heading}`,
                  heading: context.heading,
                  statement: context.statement,
                  derivation: {
                    ...trace.derivation,
                    children: [
                      ...context.details.map(({ label, value }) => ({
                        label,
                        value,
                        note: null,
                        children: [],
                      })),
                      ...trace.derivation.children,
                    ],
                  },
                  qualification:
                    [...new Set([trace.qualification, context.qualification].filter(Boolean))].join(
                      " ",
                    ) || null,
                }
              : trace,
          });
      };
    },
    [snapshot, folder, entries, route],
  );
  const citationsFor = useCallback(
    (item: string) => {
      const prefix = evidenceHref(folder, "");
      const location = resolveEvidenceLocation(
        entries,
        item.startsWith(prefix) ? item.slice(prefix.length) : item,
      );
      return location?.line === undefined
        ? undefined
        : citationsAt(snapshot, location.entry, location.line);
    },
    [snapshot, folder, entries],
  );
  return (
    <TraceContext.Provider value={open}>
      <TraceCitations.Provider value={citationsFor}>
        {children}
        {active && (
          <TraceDrawer
            trace={readerTrace(active)}
            evidenceHref={evidenceHref(folder, active.evidenceItem)}
            isOpen
            onClose={() => {
              setSelection({ route, trace: null });
            }}
          />
        )}
      </TraceCitations.Provider>
    </TraceContext.Provider>
  );
}

export function PublishedSource({
  href,
  name,
  linkLabel,
  children,
  context,
}: {
  href: string;
  name: string;
  linkLabel?: string;
  children: string;
  context?: PublishedTraceContext;
}) {
  const open = useContext(TraceContext)?.(href, context);
  return open ? (
    <TraceButton label={`Show sources for ${name}`} open={open} />
  ) : (
    <a
      href={href}
      aria-label={linkLabel ?? children}
      className="inline-flex size-8 flex-none items-center justify-center rounded-ds-sm border border-transparent text-text-tertiary transition-colors duration-150 hover:border-border-control hover:bg-action-subtle hover:text-action focus-visible:border-border-control focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 motion-reduce:transition-none max-[480px]:size-11"
    >
      <FileSearch02 aria-hidden="true" className="size-4" />
    </a>
  );
}
