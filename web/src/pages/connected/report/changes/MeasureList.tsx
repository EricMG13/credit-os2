import { ArrowDown, ArrowRight, ArrowUp } from "@untitledui/icons";
import { StatusShape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import { PublishedSource } from "../PublishedTrace";
import { ToneMark } from "../ToneMark";
import { Figure, GapNote } from "../overview/Tile";
import { BETTER, WORSE } from "../../visuals/signal/scales";
import { Dumbbell } from "./Dumbbell";
import { UNRESOLVED, type Cause, type MeasureChange } from "./model";

/** The row tint (colour-signal-build ruling C2): only a better or a worse row is tinted. */
const TINT = { better: BETTER[1], worse: WORSE[1] } as const;

/** The mark colour goes on the arrow and on the shape inside the tone mark, never on the words. */
const ARROW = {
  better: "text-better-mark",
  worse: "text-worse-mark",
  flat: "text-text-tertiary",
} as const;
const SHAPE_INK = {
  better: "**:data-shape:text-better-mark",
  worse: "**:data-shape:text-worse-mark",
  flat: "",
} as const;

const LINK =
  "inline-flex min-h-8 items-center text-text-link text-small underline underline-offset-2 max-[480px]:min-h-11";

/** The stated cause in words. "Unresolved" is the one word set apart; a long cause is plain text. */
function CauseLine({ cause, href }: { cause: Cause; href: string | undefined }) {
  switch (cause.kind) {
    case "written":
      return cause.text === UNRESOLVED ? (
        <span className="inline-flex items-center gap-1.5 justify-self-start text-caption font-medium text-text-secondary">
          <StatusShape shape="triangle" />
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
    sign,
    tone,
    reason,
    cause,
    effect,
    href,
  } = item;
  const Name = level;
  const Way = sign === 1 ? ArrowUp : ArrowDown;
  const mark = ranked && beforeValue !== null && afterValue !== null;
  return (
    <li
      data-tone={tone ?? "none"}
      className="grid gap-2 rounded-ds-sm border-t border-border-hairline px-3 py-4 first:border-t-0"
      style={tone === "better" || tone === "worse" ? { background: TINT[tone] } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <Name className="min-w-0 text-body font-medium text-text-primary wrap-anywhere">
          {label}
        </Name>
        <div className="flex flex-none items-center gap-2">
          {delta !== null && (
            <span
              data-change
              className={cx(
                "flex items-center gap-1.5 rounded-ds-xs px-1.5 py-1 text-caption font-medium text-text-primary",
                tone === null && "bg-surface-subtle",
              )}
            >
              {(sign === 1 || sign === -1) && (
                <Way aria-hidden="true" className={cx("size-4 flex-none", ARROW[tone ?? "flat"])} />
              )}
              <Figure className="text-small">{delta}</Figure>
              {tone && (
                <span className={cx("inline-flex", SHAPE_INK[tone])}>
                  <ToneMark tone={tone} />
                </span>
              )}
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
        <ArrowRight aria-hidden="true" className="size-4 flex-none text-text-secondary" />
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
            <span className="text-caption text-text-secondary">Effect on the credit view: —</span>
          ) : (
            <span className="text-gap-text">Effect not stated</span>
          )}
        </p>
      )}
    </li>
  );
}

const SWATCH = "size-3 flex-none rounded-ds-xs border border-border-hairline";

/** The row tints and the grey arrow in words, drawn once under a list that uses them. */
function TintLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className={SWATCH} style={{ background: BETTER[1] }} />
        Green: better
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className={SWATCH} style={{ background: WORSE[1] }} />
        Orange: worse
      </span>
      <span className="flex items-center gap-1.5">
        <ArrowUp aria-hidden="true" className="size-3 flex-none text-text-tertiary" />
        Grey arrow: no better or worse is drawn; the owner's table gives this measure none, or the
        comparison left its cause unresolved
      </span>
    </p>
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
  const coloured = items.some(
    ({ tone, sign }) =>
      tone === "better" || tone === "worse" || (tone === null && (sign === 1 || sign === -1)),
  );
  return (
    <div className="grid gap-3">
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
      {coloured && <TintLegend />}
    </div>
  );
}
