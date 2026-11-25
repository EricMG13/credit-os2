import { ArrowRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { PublishedSource } from "../PublishedTrace";
import { ToneMark } from "../ToneMark";
import { Figure, GapNote } from "../overview/Tile";
import { Dumbbell } from "./Dumbbell";
import type { Cause, MeasureChange } from "./model";

const TONE = {
  better: "text-success-text",
  worse: "text-warning-text",
  flat: "text-text-secondary",
} as const;

const LINK =
  "inline-flex min-h-8 items-center text-text-link text-small underline underline-offset-2 max-[480px]:min-h-11";

/** The stated cause in words. "Unresolved" is the one word set apart; a long cause is plain text. */
function CauseLine({ cause, href }: { cause: Cause; href: string | undefined }) {
  switch (cause.kind) {
    case "written":
      return cause.text === "Unresolved" ? (
        <span className="justify-self-start rounded-ds-xs border border-warning-edge bg-warning-fill px-1.5 py-0.5 text-caption font-medium text-warning-text">
          Cause: Unresolved
        </span>
      ) : (
        <p className="reading-copy text-small text-text-secondary">Cause: {cause.text}</p>
      );
    case "referenced":
      return (
        <a className={LINK} href={href}>
          Read this cause in Evidence
        </a>
      );
    case "unmatched":
      return (
        <a className={LINK} href={href}>
          The cause is in the comparison, in Evidence
        </a>
      );
    case "absent":
    case "dash":
      return <span className="text-caption text-gap-text">Cause not stated</span>;
  }
}

/** One measure: name, earlier → current as figures and as a dumbbell, the stated cause and effect. */
function MeasureRow({
  item,
  ranked,
  level,
  evidence,
}: {
  item: MeasureChange;
  ranked: boolean;
  level: "h4" | "h5";
  evidence: string | undefined;
}) {
  const {
    label,
    before,
    after,
    beforeValue,
    afterValue,
    delta,
    tone,
    reason,
    cause,
    effect,
    href,
  } = item;
  const Name = level;
  const mark = ranked && beforeValue !== null && afterValue !== null;
  return (
    <li className="grid gap-2 border-t border-border-hairline py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <Name className="min-w-0 text-body font-medium text-text-primary wrap-anywhere">
          {label}
        </Name>
        <div className="flex flex-none items-center gap-2">
          {delta !== null && (
            <span
              data-change
              className={cx(
                "flex items-center gap-1.5 rounded-ds-xs bg-surface-subtle px-1.5 py-1 text-caption font-medium",
                tone && TONE[tone],
              )}
            >
              <Figure className="text-small">{delta}</Figure>
              {tone && <ToneMark tone={tone} />}
            </span>
          )}
          {href && (
            <PublishedSource href={href} name={label}>
              Comparison row
            </PublishedSource>
          )}
        </div>
      </div>
      <div className="grid items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <Figure className="flex min-w-0 flex-wrap items-center gap-x-2 text-small">
          <span className="text-text-secondary">{before}</span>
          <ArrowRight aria-hidden="true" className="size-4 flex-none text-text-tertiary" />
          <span className="font-medium">{after}</span>
        </Figure>
        {mark && (
          <span className="flex w-36">
            <Dumbbell before={beforeValue} after={afterValue} tone={tone} />
          </span>
        )}
      </div>
      <div className="grid gap-1">
        <CauseLine cause={cause} href={href ?? evidence} />
        {reason && <span className="text-caption text-text-secondary">{reason}</span>}
      </div>
      {effect && (
        <p className="reading-copy text-small text-text-secondary">
          {effect.kind === "written" ? (
            effect.text
          ) : effect.kind === "referenced" ? (
            <a className={LINK} href={href ?? evidence}>
              Read the effect in Evidence
            </a>
          ) : effect.kind === "dash" ? (
            <span className="text-text-tertiary">—</span>
          ) : (
            <span className="text-gap-text">Effect not stated</span>
          )}
        </p>
      )}
    </li>
  );
}

export function MeasureList({
  items,
  ranked = true,
  label,
  level = "h4",
  evidence,
}: {
  items: readonly MeasureChange[];
  ranked?: boolean;
  label: string;
  level?: "h4" | "h5";
  evidence?: string;
}) {
  if (items.length === 0) return <GapNote>None recorded</GapNote>;
  return (
    <ul aria-label={label} className="grid">
      {items.map((item) => (
        <MeasureRow key={item.key} item={item} ranked={ranked} level={level} evidence={evidence} />
      ))}
    </ul>
  );
}
