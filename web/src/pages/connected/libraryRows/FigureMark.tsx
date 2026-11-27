import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "@untitledui/icons";
import { Missing } from "@/components/gap/Missing";
import { cx } from "@/utils/cx";
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

/** Better is the accent with its word, worse the signal colour with its word; never colour alone. */
const TONE_TEXT = { better: "text-better-mark", worse: "text-worse-mark", flat: "" } as const;

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
        !showLabel && "xl:absolute xl:top-0 xl:right-0 xl:min-h-0",
      )}
    >
      <span className={cx("text-caption text-text-tertiary", !showLabel && "xl:sr-only")}>
        {label}
      </span>
      {trace}
    </div>
  );
  if (!stated(figure))
    return (
      <div className={cx("relative flex min-w-0 flex-col gap-1 xl:pr-8", className)}>
        {head}
        <span className="font-mono text-body">
          <Missing />
        </span>
        <span className="text-caption text-gap-text">Not shown here</span>
      </div>
    );
  const prior = figure.prior?.value.trim() ? figure.prior : undefined;
  const change = prior && figure.change != null ? figure.change : undefined;
  const kind = change === undefined ? "none" : tone(metricKey, change);
  const sign = change === undefined ? null : changeSign(change);
  return (
    <div className={cx("relative flex min-w-0 flex-col gap-1 xl:pr-8", className)}>
      {head}
      <span className="font-mono text-body font-medium wrap-anywhere text-text-primary tabular-nums">
        {withUnit(figure.value, figure.unit)}
      </span>
      {figure.period && <span className="text-caption text-text-secondary">{figure.period}</span>}
      {change !== undefined && prior ? (
        <>
          <span className="flex min-w-0 flex-wrap items-center gap-x-1 text-caption text-text-secondary tabular-nums">
            {sign === 1 && <ArrowUp aria-hidden className="size-3.5 shrink-0" />}
            {sign === -1 && <ArrowDown aria-hidden className="size-3.5 shrink-0" />}
            <span className="font-mono">{changeText(change, figure.unit)}</span>
            {kind !== "none" && (
              <span className={TONE_TEXT[kind]}>
                <ToneMark tone={kind} />
              </span>
            )}
          </span>
          <span className="text-caption text-text-tertiary">
            from {withUnit(prior.value, figure.unit)} in {prior.period}
          </span>
        </>
      ) : (
        <span className="text-caption text-text-tertiary">No prior period stated</span>
      )}
    </div>
  );
}
