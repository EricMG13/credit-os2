import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "@untitledui/icons";
import { Missing } from "@/components/gap/Missing";
import { cx } from "@/utils/cx";
import { BETTER, WORSE } from "../visuals/signal/scales";
import { changeSign, changeText, tone } from "../signal";
import { withUnit } from "../publishedReport";
import { ToneMark } from "../report/ToneMark";
import { stated } from "../reportView";

type Figure = {
  value?: number | string | null;
  unit?: string | null;
  period?: string | null;
  basis?: string;
  label?: string;
  prior?: { value: string; period: string };
  change?: string;
};

/** The label a figure carries: coverage read as reported EBITDA over cash interest keeps that name. */
export function figureName(key: string, name: string, figure: Figure | undefined): string {
  const debtCashInterest =
    key === "coverage" &&
    /^LTM reported EBITDA over LTM cash interest for debt(?: [\d.,]+)?(?:;|$)/iu.test(
      figure?.basis ?? "",
    );
  if (debtCashInterest) return "Reported EBITDA / cash interest on debt";
  const stated = figure?.label?.trim();
  return stated && stated !== name ? stated : name;
}

/** The mark colour goes on the glyphs only (the arrow and the ToneMark shape); words stay in ink. */
const ARROW = { better: "text-better-mark", worse: "text-worse-mark" } as const;
const SHAPE_MARK = {
  better: "**:data-shape:text-better-mark",
  worse: "**:data-shape:text-worse-mark",
  flat: "",
} as const;
const TINT = { better: BETTER[1], worse: WORSE[1] } as const;
const CELL = "relative flex min-w-0 flex-col gap-1 rounded-ds-sm p-2 xl:pr-10";

/**
 * What a figure's change draws: its tone (the owner's table, `signal.ts`), and the sign of the
 * change. Undefined when the figure has no prior value to change from.
 */
export function figureChange(metricKey: string, figure: Figure | undefined) {
  if (!stated(figure)) return undefined;
  const prior = figure.prior?.value.trim() ? figure.prior : undefined;
  const change = prior && figure.change != null ? figure.change : undefined;
  if (!prior || change === undefined) return undefined;
  return { kind: tone(metricKey, change), sign: changeSign(change), prior, change };
}

/**
 * One headline figure of a library row: the value in mono with its period, and the change from the
 * prior value, written, with its direction word where the owner's table gives the measure one. No
 * bar is drawn: a bar scaled to each row's own pair would look comparable across rows and is not. A figure the catalogue does not quote is the gap cell ("Not shown here",
 * as the report's own headline tiles say), never zero.
 */
export function FigureMark({
  name,
  metricKey,
  figure,
  className,
  trace,
  showLabel = false,
}: {
  name: string;
  metricKey: string;
  figure: Figure | undefined;
  className?: string;
  /** The figure's single source control; drawn at the cell's top right. */
  trace?: ReactNode;
  /** Draw the label in the cell on a wide screen: its column header does not carry it. */
  showLabel?: boolean;
}) {
  const label = figureName(metricKey, name, figure);
  const head = (
    <div
      className={cx(
        "flex min-h-8 items-start justify-between gap-1 max-[480px]:min-h-11",
        !showLabel && "xl:absolute xl:top-2 xl:right-2 xl:min-h-0",
      )}
    >
      <span className={cx("text-caption text-text-secondary", !showLabel && "xl:sr-only")}>
        {label}
      </span>
      {trace}
    </div>
  );
  if (!stated(figure))
    return (
      <div data-tone="none" className={cx(CELL, className)}>
        {head}
        <span data-line="figure" className="font-mono text-body">
          <Missing />
        </span>
        <span data-line="change" className="text-caption text-gap-text">
          Not shown here
        </span>
      </div>
    );
  const change = figureChange(metricKey, figure);
  const kind = change?.kind ?? "none";
  const Direction = change?.sign === 1 ? ArrowUp : ArrowDown;
  const tinted = kind === "better" || kind === "worse";
  return (
    <div
      data-tone={kind}
      style={tinted ? { backgroundColor: TINT[kind] } : undefined}
      className={cx(CELL, className)}
    >
      {head}
      <span data-line="figure" className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-body font-medium wrap-anywhere text-text-primary tabular-nums">
          {withUnit(figure.value, figure.unit)}
        </span>
        {figure.period && <span className="text-caption text-text-secondary">{figure.period}</span>}
      </span>
      {change ? (
        <span
          data-line="change"
          className="flex min-w-0 flex-wrap items-center gap-x-1 text-caption text-text-secondary tabular-nums"
        >
          {(change.sign === 1 || change.sign === -1) && (
            <Direction
              aria-hidden
              className={cx("size-3.5 shrink-0", tinted ? ARROW[kind] : "text-text-secondary")}
            />
          )}
          <span className="font-mono">{changeText(change.change, figure.unit)}</span>
          {kind !== "none" && (
            <span className={SHAPE_MARK[kind]}>
              <ToneMark tone={kind} />
            </span>
          )}
          <span>
            from {withUnit(change.prior.value, figure.unit)} in {change.prior.period}
          </span>
        </span>
      ) : (
        <span data-line="change" className="text-caption text-text-secondary">
          No prior period stated
        </span>
      )}
    </div>
  );
}
