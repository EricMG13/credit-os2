import { ArrowRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { PublishedSource } from "../PublishedTrace";
import { ToneMark } from "../ToneMark";
import { Figure, GapNote } from "../overview/Tile";
import { Dumbbell } from "./Dumbbell";
import { UNRESOLVED, type Cause, type MeasureChange } from "./model";

const TONE = {
  better: "text-better-mark",
  worse: "text-worse-mark",
  flat: "text-text-secondary",
} as const;

const LINK =
  "inline-flex min-h-8 items-center text-text-link text-small underline underline-offset-2 max-[480px]:min-h-11";

/** The stated cause in words. "Unresolved" is the one word set apart; a long cause is plain text. */
function CauseLine({ cause, href }: { cause: Cause; href: string | undefined }) {
  switch (cause.kind) {
    case "written":
      return cause.text === UNRESOLVED ? (
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

/**
 * The service's plain verdict for a measure it could compare. A row is in the moved or unmoved list
 * only because it is comparable, so the word alone says nothing there; any other verdict is drawn.
 */
const PLAIN_VERDICT = "Comparable";

/** Whether the written effect already opens with the verdict's words ("Same definition: …"). */
function opensWith(effect: MeasureChange["effect"], reason: string) {
  return effect?.kind === "written" && effect.text.toLowerCase().startsWith(reason.toLowerCase());
}

/** One measure: name, earlier → current as figures and as a dumbbell, the stated cause and effect. */
function MeasureRow({
  item,
  ranked,
  level,
  evidence,
  quiet,
}: {
  item: MeasureChange;
  ranked: boolean;
  level: "h4" | "h5";
  evidence: string | undefined;
  quiet: boolean;
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
      <Figure className="flex min-w-0 flex-wrap items-center gap-x-2 text-small">
        <span className="text-text-secondary">{before}</span>
        <ArrowRight aria-hidden="true" className="size-4 flex-none text-text-tertiary" />
        <span className="font-medium">{after}</span>
      </Figure>
      {mark && (
        <span className="flex max-w-xl">
          <Dumbbell
            before={beforeValue}
            after={afterValue}
            tone={tone}
            reading={`${label}, ${before} to ${after}`}
          />
        </span>
      )}
      <div className="grid gap-1">
        {!(quiet && cause.kind !== "written") && (
          <CauseLine cause={cause} href={href ?? evidence} />
        )}
        {reason && reason !== PLAIN_VERDICT && !opensWith(effect, reason) && (
          <span className="text-caption text-text-secondary">{reason}</span>
        )}
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
            // The module's own dash, as written, beside the column it was written in.
            <span className="text-caption text-text-tertiary">Effect on the credit view: —</span>
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
  quiet = false,
}: {
  items: readonly MeasureChange[];
  ranked?: boolean;
  label: string;
  level?: "h4" | "h5";
  evidence?: string;
  /** A list of measures that did not move: a cause is drawn only where one is written. */
  quiet?: boolean;
}) {
  if (items.length === 0) return <GapNote>None recorded</GapNote>;
  return (
    <ul aria-label={label} className="grid">
      {items.map((item) => (
        <MeasureRow
          key={item.key}
          item={item}
          ranked={ranked}
          level={level}
          evidence={evidence}
          quiet={quiet}
        />
      ))}
    </ul>
  );
}
