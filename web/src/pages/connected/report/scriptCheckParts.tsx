import { Check, Minus, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { serviceText } from "../api";
import type { ScriptCheckOutcome } from "../publishedReport";

const meaningful = (value: string | null) => (value === "all" || value === "" ? null : value);

/**
 * Text without the markdown marks the service leaves on a register or a reason (backticks and
 * heading hashes), with each exact module code read as the module's name.
 */
const plain = (text: string) =>
  serviceText(
    text
      .replaceAll("`", "")
      .replace(/(^|\s)#{2,6}\s+/g, "$1")
      .trim(),
  );

const WARNED = ["disagreed", "contradicted", "missing"];

/** Orders status words by a fixed rank; a word without one takes `unknown`, then the alphabet. */
function ranker(ranks: Readonly<Record<string, number>>, unknown: number) {
  const rank = (status: string) =>
    (Object.hasOwn(ranks, status) ? ranks[status] : undefined) ?? unknown;
  return (a: string, b: string) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0);
}

/** Counting order: the known words first, then any other word alphabetically. */
const byCount = ranker(
  { agreed: 0, disagreed: 1, contradicted: 2, missing: 3, "not checked": 4 },
  5,
);

/** Reading order, most attention first: unknown words after missing, not checked last. */
export const byAttention = ranker(
  { disagreed: 0, contradicted: 1, missing: 2, noted: 4, agreed: 5, "not checked": 6 },
  3,
);

/** Each recorded status word with its exact count, in counting order. */
export function tally(outcomes: readonly ScriptCheckOutcome[]) {
  const counts = new Map<string, number>();
  for (const { status } of outcomes) counts.set(status, (counts.get(status) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => byCount(a, b));
}

/** Repeated identical checks of one module, merged; callers never pass two modules' checks. */
export function groupOutcomes(outcomes: readonly ScriptCheckOutcome[]) {
  const groups = new Map<string, ScriptCheckOutcome[]>();
  for (const outcome of outcomes) {
    const key = JSON.stringify([
      outcome.status,
      outcome.reason,
      outcome.script,
      meaningful(outcome.figure),
      meaningful(outcome.row),
      outcome.stated,
      outcome.recomputed,
      outcome.recomputedLabel,
      outcome.tolerance,
      outcome.unit,
    ]);
    const group = groups.get(key) ?? [];
    group.push(outcome);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** How a recorded status word is drawn: pass, fail, not run, or any other word. */
type CheckMark = "pass" | "fail" | "not-run" | "other";

const markOf = (status: string): CheckMark =>
  status === "agreed"
    ? "pass"
    : WARNED.includes(status)
      ? "fail"
      : status === "not checked"
        ? "not-run"
        : "other";

/** The hatch frame of a not-run status: the gap texture with the word on a plain chip. */
const HATCH = "gap-hatch inline-flex rounded-ds-xs border border-dashed border-border-gap p-0.5";

/**
 * A status as an ink mark and its word, never colour alone: agreed a check, a failing word a cross,
 * "not checked" the word on the grey hatch, any
 * other word the neutral dash. The glyph is an `aria-hidden` icon, so the text is the word alone;
 * `glyphOnly` draws the glyph without the word, for a heading that already says it.
 */
export function CheckStatusMark({
  status,
  glyphOnly = false,
}: {
  status: string;
  glyphOnly?: boolean;
}) {
  const mark = markOf(status);
  const glyph = "size-3 shrink-0";
  const icon =
    mark === "pass" ? (
      <Check className={cx(glyph, "text-text-primary")} aria-hidden="true" data-mark={mark} />
    ) : mark === "fail" ? (
      <XClose className={cx(glyph, "text-text-primary")} aria-hidden="true" data-mark={mark} />
    ) : mark === "other" ? (
      <Minus className={cx(glyph, "text-text-primary")} aria-hidden="true" data-mark={mark} />
    ) : null;
  if (mark === "not-run") {
    return glyphOnly ? (
      <span aria-hidden="true" data-mark={mark} className={cx(HATCH, "size-4 shrink-0")} />
    ) : (
      <span data-mark={mark} className={HATCH}>
        <span className="rounded-ds-xs bg-surface-card px-1.5 text-small text-text-primary">
          {status}
        </span>
      </span>
    );
  }
  return glyphOnly ? (
    icon
  ) : (
    <span className="inline-flex items-center gap-1 text-small text-text-primary">
      {icon}
      <span>{status}</span>
    </span>
  );
}

function CheckStatus({ status }: { status: string }) {
  return <CheckStatusMark status={status} />;
}

function CheckField({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === "") return null;
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="text-small text-text-secondary">{label}</dt>
      <dd className="whitespace-pre-wrap wrap-anywhere">{value}</dd>
    </div>
  );
}

/** One check, or one module's repeated identical checks, headed by register and figure. */
export function CheckCard({ group }: { group: ScriptCheckOutcome[] }) {
  const outcome = group[0];
  if (!outcome) return null;
  const registers = group.flatMap(({ register }) => (register ? [plain(register)] : []));
  const named = meaningful(outcome.figure) ?? meaningful(outcome.row);
  // A card is headed by its register and the figure checked: the figure alone is often "columns".
  const where = group.length > 1 ? `${String(registers.length)} registers` : registers[0];
  const title = [where, named && plain(named)].filter(Boolean).join(" · ") || "Check";
  const recomputed = [outcome.recomputed, outcome.recomputedLabel]
    .filter((value) => value !== null)
    .join(" ");
  return (
    <section className="grid min-w-0 gap-3 border-t border-border-hairline pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h6 className="min-w-0 font-semibold wrap-anywhere">{title}</h6>
        <CheckStatus status={outcome.status} />
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <CheckField label="Reason" value={outcome.reason && plain(outcome.reason)} />
        {group.length > 1 && registers.length > 0 ? (
          <div className="grid gap-1">
            <dt className="text-small text-text-secondary">Registers</dt>
            <dd className="flex flex-wrap gap-2">
              {registers.map((register, index) => (
                <Badge key={index}>{register}</Badge>
              ))}
            </dd>
          </div>
        ) : (
          <CheckField label="Register" value={named ? (registers[0] ?? null) : null} />
        )}
        <CheckField
          label="Row"
          value={meaningful(outcome.row) !== named ? meaningful(outcome.row) : null}
        />
        <CheckField label="Stated" value={outcome.stated} />
        <CheckField
          label="Recomputed"
          value={
            recomputed === "" ? null : `${recomputed}${outcome.unit ? ` ${outcome.unit}` : ""}`
          }
        />
        <CheckField label="Tolerance" value={outcome.tolerance} />
        <CheckField label="Script" value={outcome.script} />
      </dl>
    </section>
  );
}
