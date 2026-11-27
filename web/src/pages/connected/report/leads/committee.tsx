import { ChevronDown } from "@untitledui/icons";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/utils/cx";
import { Tile } from "../overview/Tile";
import { TableOrCards } from "./parts";
import { leadHref, registerTable } from "./read";
import { sourceOf, writtenTable } from "./written";
import { FigureTile, GapTile, LeadFrame } from "./kit/LeadFrame";
import { GapChip } from "./kit/marks";
import { ledger, ledgerCells, stance, type Conditions, type LedgerRow } from "./committeeData";
import type { Lead, LeadProps } from "./types";
import { IN_EVIDENCE } from "./kit/reader";
import { saidText, type Said } from "./validationData";

const VISIBLE_ROWS = 8;
/** Roughly how many characters fill one line of a ledger cell. */
const LINE = 56;

/** 32 px targets, 44 px at 480 px and below, the token focus ring (the kit's table button follows these). */
const TARGET =
  "min-h-8 max-[480px]:min-h-11 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2";

/** A disclosure for the rest of a list or text: a marked summary at a real target size. */
function More({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details className={cx("group min-w-0", className)}>
      <summary
        className={cx(
          TARGET,
          "flex w-fit cursor-pointer list-none items-center gap-1 rounded-ds-xs text-caption font-medium text-text-link [&::-webkit-details-marker]:hidden",
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform group-open:rotate-180"
        />
      </summary>
      {children}
    </details>
  );
}

/**
 * Words clamped to `lines`, with the rest on demand when they overflow: measured where the browser
 * lays text out, by length (about `LINE` characters a line) where it does not (no layout).
 */
function ClampedText({
  words,
  lines,
  className,
}: {
  words: string;
  lines: 1 | 2;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [long, setLong] = useState(words.length > LINE * lines);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const measure = () => {
      if (node.clientHeight > 0) setLong(node.scrollHeight > node.clientHeight + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const watcher = new ResizeObserver(measure);
    watcher.observe(node);
    return () => {
      watcher.disconnect();
    };
  }, [words]);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p
        ref={ref}
        className={cx(
          "text-small text-text-primary text-pretty wrap-anywhere",
          lines === 1 ? "line-clamp-1" : "line-clamp-2",
          className,
        )}
      >
        {words}
      </p>
      {long && (
        <More label="Show more" className="text-caption text-text-secondary">
          <p className="text-pretty wrap-anywhere">{words}</p>
        </More>
      )}
    </div>
  );
}

/** A handoff cell as the ledger draws it: clamped words with the rest on demand, or its gap. */
function SaidText({ value, lines, className }: { value: Said; lines: 1 | 2; className?: string }) {
  if (value.kind === "gap") return <GapChip reason={saidText(value)} />;
  if (value.kind === "empty") return <GapChip reason="This page could not read this." />;
  if (value.kind === "evidence")
    return <p className="text-small text-text-secondary">{IN_EVIDENCE}</p>;
  return <ClampedText words={value.text} lines={lines} className={className} />;
}

/** The Conditions cell exactly as written: one paragraph per cell, never split into parts. */
function ConditionList({ conditions }: { conditions: Conditions }) {
  if (conditions === null) return null;
  return (
    <div className="flex flex-col gap-1.5 border-t border-border-hairline pt-3">
      <h4 className="text-small font-medium text-text-primary">Conditions</h4>
      {conditions.kind === "gap" ? (
        <GapChip reason={`Not supplied: ${conditions.reason}`} />
      ) : (
        conditions.items.map((value, at) => (
          <p
            key={`${String(at)}-${saidText(value)}`}
            data-condition
            className="text-small text-text-secondary text-pretty wrap-anywhere"
          >
            {value.kind === "text" ? value.text : IN_EVIDENCE}
          </p>
        ))
      )}
    </div>
  );
}

function StanceTile(props: LeadProps) {
  const found = stance(props.entry);
  const stated = found.state === "stated" ? found : null;
  if (stated === null)
    return (
      <GapTile span={12} label="Committee stance" kicker="Committee stance">
        {found.state === "gap" && found.reason
          ? `This page could not read an action bias: ${found.reason}.`
          : "This page could not read an action bias."}
      </GapTile>
    );
  const conditionRows =
    stated.conditions?.kind === "list"
      ? stated.conditions.items.map((value) => ["Condition", saidText(value)])
      : [];
  return (
    <FigureTile
      props={props}
      span={12}
      label="Committee stance"
      kicker="Committee decision"
      title="Committee stance"
      line={stated.line}
      source="the committee stance"
      table={{
        caption: "Action bias, confidence and conditions",
        headers: ["Item", "Value"],
        rows: [
          ["Action bias", stated.word],
          ["Confidence", stated.confidence ?? "Not stated"],
          ...conditionRows,
        ],
      }}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-h1 text-text-primary wrap-anywhere" data-action-bias={stated.word}>
            {stated.word}
          </p>
          {stated.confidence ? (
            <p className="flex min-w-0 flex-wrap items-center gap-2 text-small text-text-secondary">
              <span data-confidence-word>{`Confidence ${stated.confidence}`}</span>
            </p>
          ) : (
            <GapChip
              reason={
                stated.source === "sentence"
                  ? "The module states no confidence."
                  : "This page could not read a confidence."
              }
            />
          )}
        </div>
        <ConditionList conditions={stated.conditions} />
      </div>
    </FigureTile>
  );
}

const LABEL = "text-caption font-medium text-text-tertiary";

function LedgerItem({ row }: { row: LedgerRow }) {
  return (
    <li className="grid min-w-0 gap-3 border-t border-border-hairline pt-4 first:border-t-0 first:pt-0 sm:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-1 sm:col-span-2" data-cell="point">
        <p className={LABEL}>Challenged point</p>
        <SaidText value={row.point} lines={2} className="font-medium" />
      </div>
      <div className="flex min-w-0 flex-col gap-1 sm:col-span-2" data-cell="counter">
        <p className={LABEL}>Counter-case</p>
        <SaidText value={row.counterCase} lines={2} />
      </div>
      <div className="flex min-w-0 flex-col gap-1" data-cell="for">
        <p className={LABEL}>Evidence for this point</p>
        <SaidText value={row.evidenceFor} lines={2} />
      </div>
      <div className="flex min-w-0 flex-col gap-1" data-cell="against">
        <p className={LABEL}>Evidence against this point</p>
        <SaidText value={row.evidenceAgainst} lines={2} />
      </div>
      <div className="flex min-w-0 flex-col gap-1 sm:col-span-2" data-cell="change">
        <p className={LABEL}>What would change the view</p>
        <SaidText value={row.wouldChange} lines={1} />
      </div>
    </li>
  );
}

function LedgerTile({
  props,
  found,
  written,
}: {
  props: LeadProps;
  found: ReturnType<typeof ledger>;
  written: ReturnType<typeof writtenTable>;
}) {
  if (written)
    return (
      <Tile span={7} label="Challenged points" title="Challenged points" className="self-start">
        <TableOrCards label="Challenged points" table={written} />
      </Tile>
    );
  const rows = found.state === "rows" ? found.rows : [];
  const visible = rows.slice(0, VISIBLE_ROWS);
  const rest = rows.slice(VISIBLE_ROWS);
  const gap =
    found.state === "none"
      ? `This page could not read a cross-examined claim${found.reason ? `: ${found.reason}` : ""}.`
      : found.state === "duplicate"
        ? "This page could not read the cross-examination because it appears more than once."
        : "This page could not read the cross-examination of the credit case.";
  if (found.state !== "rows")
    return (
      <GapTile span={7} label="Challenged points" kicker="Challenged points">
        {gap}
      </GapTile>
    );
  return (
    <FigureTile
      props={props}
      span={7}
      label="Challenged points"
      kicker="Cross-examination"
      title="Challenged points"
      line={found.line}
      source="the cross-examination"
      table={{
        caption: "Cross-examination, one row per challenged point",
        headers: [
          "Challenged point",
          "Evidence for",
          "Counter-case",
          "Evidence against",
          "What would change the view",
        ],
        rows: rows.map(ledgerCells),
      }}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div data-verdict-gap>
          <GapChip reason="This page could not read a verdict for these claims." />
        </div>
        <ol
          className="flex min-w-0 flex-col gap-4"
          aria-label="Challenged points and their cross-examination"
        >
          {visible.map((row) => (
            <LedgerItem key={row.line} row={row} />
          ))}
        </ol>
        {rest.length > 0 && (
          <More
            label={`Show ${String(rest.length)} more ${rest.length === 1 ? "point" : "points"}`}
          >
            <ol
              start={VISIBLE_ROWS + 1}
              className="mt-4 flex min-w-0 flex-col gap-4"
              aria-label="More challenged points and their cross-examination"
            >
              {rest.map((row) => (
                <LedgerItem key={row.line} row={row} />
              ))}
            </ol>
          </More>
        )}
      </div>
    </FigureTile>
  );
}

/**
 * CP-6: the stance as written, with its conditions, and the challenged points. The portfolio limits
 * and the decision-and-watch events are the frame's (gated on the mandate, with their as-of note
 * and every column), so this lead draws neither. A committee decision with neither readable is one
 * gap tile.
 */
function Committee(props: LeadProps) {
  const { entry } = props;
  const found = ledger(entry);
  // The module's own cross-examination register under its own headings, as written.
  const bear =
    found.state === "absent"
      ? registerTable(entry, "T6A.4", ["Bull Claim Attacked", "Bear Counter-Evidence"])
      : undefined;
  const written = bear && writtenTable(sourceOf(bear), leadHref(props));
  const nothing = stance(entry).state === "gap" && found.state !== "rows" && !written;
  return (
    <LeadFrame props={props}>
      {nothing ? (
        <GapTile span={12} label="Committee decision" kicker="Committee decision">
          This page could not read the committee decision.
        </GapTile>
      ) : (
        <>
          <div className="min-w-0 self-start lg:col-span-5">
            <StanceTile {...props} />
          </div>
          <div className="min-w-0 self-start lg:col-span-7">
            <LedgerTile props={props} found={found} written={written} />
          </div>
        </>
      )}
    </LeadFrame>
  );
}

/** This lead draws no typed figure, event lane or map: the frame draws the limits and the events. */
export const CommitteeLead: Lead = Committee;
CommitteeLead.draws = [];
