import { AlertTriangle, Check, Minus } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
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

/** The icon drawn with a status word, so the word never rests on colour alone. */
export function StatusIcon({ status }: { status: string }) {
  const Icon = status === "agreed" ? Check : WARNED.includes(status) ? AlertTriangle : Minus;
  return <Icon className="size-3 shrink-0" aria-hidden="true" />;
}

function CheckStatus({ status }: { status: string }) {
  const color = status === "agreed" ? "brand" : WARNED.includes(status) ? "warning" : "gray";
  return (
    <Badge color={color} className="gap-1" icon={<StatusIcon status={status} />}>
      {status}
    </Badge>
  );
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
  const merged = group.length;
  const where =
    merged > 1
      ? `${String(merged)} ${registers.length === merged ? "registers" : "checks"}`
      : registers[0];
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
