import { useEffect, useRef, useState, type ReactNode } from "react";
import { Printer } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ChartPrintContext } from "@/components/chart/ChartPrintContext";
import { containsReference } from "../publishedReport";
import { asOfDate } from "../runFigures";
import { containsRunIdentifier, exportRoute, type ReportExport } from "./reportExport";
import "./reportExport.css";

function showHash(hash: string) {
  const oldURL = window.location.href;
  window.history.replaceState(null, "", hash);
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL: window.location.href }));
}

function closePreview() {
  const state: unknown = window.history.state;
  if (state && typeof state === "object" && "reportExportFrom" in state) window.history.back();
  else showHash("#overview");
}

/** A state of the preview as a quiet chip. */
const CHIP =
  "flex min-h-6 items-center rounded-ds-xs border border-border-hairline bg-surface-card px-2 text-caption text-text-secondary";
const TOOL = "max-[480px]:min-h-11";

function chartLayoutReady(root: HTMLElement) {
  return [...root.querySelectorAll(".recharts-responsive-container")].every((chart) => {
    const box = chart.querySelector(".recharts-surface")?.getBoundingClientRect();
    return box && box.width > 0 && box.height > 0;
  });
}

const INLINE_TAGS = new Set(
  "a abbr b bdi bdo cite code data dfn em i kbd mark q s samp small span strong sub sup time u var tspan textpath".split(
    " ",
  ),
);

/**
 * The text of each paragraph, cell, heading or chart label on its own. Inline elements stay with
 * the block that holds them, so a reference is read whole inside one block and never across two.
 */
function blockTexts(root: HTMLElement) {
  const blocks = new Map<Element, string>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    let block = node.parentElement;
    while (block && block !== root && INLINE_TAGS.has(block.localName.toLowerCase()))
      block = block.parentElement;
    if (block) blocks.set(block, (blocks.get(block) ?? "") + (node.textContent ?? ""));
  }
  return [...blocks.values()];
}

// The quote is written as \u0022 so the class check's string reader keeps its place in this file.
function cssText(text: string) {
  return `"${text.replace(/\s+/g, " ").replace(/[\u0022\\]/g, "\\$&")}"`;
}

function PrintPaper({
  report,
  autoPrint = false,
}: {
  report: Extract<ReportExport, { state: "ready" }>;
  autoPrint?: boolean;
}) {
  const { id, name, document: paper, qualifiers, previewNote, privateIds } = report;
  const root = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<"waiting" | "ready" | "failed" | "blocked">("waiting");
  const [attempt, setAttempt] = useState(0);
  const printed = useRef(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let active = true;
    let frame = 0;
    const deadline = window.setTimeout(() => {
      active = false;
      cancelAnimationFrame(frame);
      setLayout("failed");
    }, 5000);
    const advance = () => {
      if (!active) return;
      if (!chartLayoutReady(element) || element.querySelector("[role=status]")) {
        frame = requestAnimationFrame(advance);
        return;
      }
      window.clearTimeout(deadline);
      const text = element.innerText || element.textContent || "";
      const unsafe =
        element.querySelector("a[href], svg a") ||
        blockTexts(element).some(containsReference) ||
        containsRunIdentifier(text, privateIds);
      setLayout(unsafe ? "blocked" : "ready");
    };
    const mark = element.querySelector(".report-export-brand img");
    void Promise.all([
      document.fonts.ready,
      mark instanceof HTMLImageElement ? mark.decode() : Promise.reject(new Error("Missing mark")),
    ]).then(
      () => {
        if (active)
          frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(advance);
          });
      },
      () => {
        if (!active) return;
        window.clearTimeout(deadline);
        setLayout("failed");
      },
    );
    return () => {
      active = false;
      window.clearTimeout(deadline);
      cancelAnimationFrame(frame);
    };
  }, [attempt, privateIds]);
  useEffect(() => {
    if (!autoPrint) return;
    const state: unknown = window.history.state;
    if (
      typeof state === "object" &&
      state !== null &&
      "reportPrintOnReady" in state &&
      state.reportPrintOnReady === true
    ) {
      const remaining = { ...state };
      delete remaining.reportPrintOnReady;
      window.history.replaceState(remaining, "");
    }
  }, [autoPrint]);
  useEffect(() => {
    if (!autoPrint || layout !== "ready" || printed.current) return;
    printed.current = true;
    window.print();
  }, [autoPrint, layout]);
  const scope = [paper.scope, ...qualifiers].join(" · ");
  const identity = [
    paper.ticker,
    paper.pathway,
    `As of ${asOfDate(paper.date)}`,
    paper.period && `Financial period ${paper.period}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const footerIdentity = `${paper.issuer} · ${name} · ${identity}`;
  const footerScope = [scope, ...paper.restrictions].join(" · ");
  useEffect(() => {
    const style = document.documentElement.style;
    style.setProperty("--report-export-identity", cssText(footerIdentity));
    style.setProperty("--report-export-scope", cssText(footerScope));
    return () => {
      style.removeProperty("--report-export-identity");
      style.removeProperty("--report-export-scope");
    };
  }, [footerIdentity, footerScope]);
  return (
    <>
      <div className="report-export-controls">
        <div className="grid min-w-0 gap-0.5">
          <p className="text-caption text-text-tertiary">PDF preview</p>
          <p className="font-display text-h4 font-semibold wrap-anywhere text-text-primary">
            {name} · {paper.issuer}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {layout === "waiting" && (
            <p role="status" className={CHIP}>
              Preparing print layout…
            </p>
          )}
          {layout === "blocked" && (
            <p role="alert" className="text-small text-error-text">
              This PDF cannot be printed because its text contains a link, a reference or a run
              identifier.
            </p>
          )}
          {layout === "failed" && (
            <>
              <p role="alert" className="text-small text-error-text">
                The print layout could not be prepared.
              </p>
              <Button
                color="secondary"
                size="sm"
                className={TOOL}
                onPress={() => {
                  setLayout("waiting");
                  setAttempt((count) => count + 1);
                }}
              >
                Try again
              </Button>
            </>
          )}
          <Button color="secondary" size="sm" className={TOOL} onPress={closePreview}>
            Close preview
          </Button>
          <Button
            size="sm"
            iconLeading={Printer}
            className={TOOL}
            isDisabled={layout !== "ready"}
            onPress={() => {
              if (
                layout === "ready" &&
                exportRoute(window.location.hash) === id &&
                root.current?.isConnected
              )
                window.print();
            }}
          >
            Print / Save PDF
          </Button>
        </div>
        <p>
          Turn off <strong>Headers and footers</strong> in the print dialog before saving a PDF for
          sharing. Browser headers can include the local report address.
        </p>
      </div>
      <article
        ref={root}
        className="report-export-paper"
        data-print-ready={layout === "ready" ? "" : undefined}
        aria-labelledby="report-export-title"
      >
        <header className="report-export-masthead">
          <p className="report-export-brand">
            <img alt="" src="/symbol.svg" width={22} height={22} />
            Credit OS <span>{name}</span>
          </p>
          <h1 id="report-export-title">{paper.issuer}</h1>
          <p>
            {identity} · {scope}
          </p>
          {previewNote && <p>{previewNote}</p>}
        </header>
        <ChartPrintContext value>{paper.content}</ChartPrintContext>
      </article>
    </>
  );
}

export function ReportExportPreview({
  report,
  children,
  autoPrint = false,
}: {
  report?: ReportExport;
  children?: ReactNode;
  autoPrint?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section className="report-export-preview" data-report-export>
      <h2 ref={heading} tabIndex={-1} className="sr-only">
        PDF preview
      </h2>
      {report?.state === "ready" ? (
        <PrintPaper report={report} autoPrint={autoPrint} />
      ) : (
        <div className="report-export-controls">
          <p className="text-caption text-text-tertiary">PDF preview</p>
          <Button color="secondary" size="sm" className={TOOL} onPress={closePreview}>
            Close preview
          </Button>
          {report?.state === "unavailable" ? (
            <p role="status" className="basis-full text-small text-text-secondary">
              {report.reason}
            </p>
          ) : (
            <div className="basis-full">{children}</div>
          )}
        </div>
      )}
    </section>
  );
}
