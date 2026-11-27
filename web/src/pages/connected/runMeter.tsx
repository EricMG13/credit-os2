import { cx } from "@/utils/cx";

export type CapBandNumber = 1 | 2 | 3 | 4 | 5;

/** A finite number's shortest decimal as an exact fraction (digits scaled by a power of ten). */
function exactFraction(n: number): { num: bigint; den: bigint } {
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(String(n));
  if (match === null) throw new RangeError(`Not a decimal number: ${String(n)}`);
  const [, sign, whole = "", fraction = "", exponent = "0"] = match;
  const digits = BigInt(`${sign ?? ""}${whole}${fraction}`);
  const power = Number(exponent) - fraction.length;
  return power >= 0
    ? { num: digits * 10n ** BigInt(power), den: 1n }
    : { num: digits, den: 10n ** BigInt(-power) };
}

/**
 * Spend against a cap as a whole percent (rounded down; a negative value counts as 0) and the band
 * it falls in: under 50% is 1, under 70 is 2, under 85 is 3, under 100 is 4, 100 or more is 5.
 * The percent is exact on each number's decimal text, with no cent rounding and no float division.
 * Callers pass the service's amount as `Number(decimalText)` (or exact cents / 100), never a float sum.
 * Throws RangeError when either input is not finite or `max` is not above 0: no cap, no band.
 */
export function capBand(value: number, max: number): { percent: number; band: CapBandNumber } {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    throw new RangeError("A cap band needs a finite value and a cap above 0");
  }
  const v = exactFraction(value);
  const m = exactFraction(max);
  const percent = v.num <= 0n ? 0 : Number((100n * v.num * m.den) / (v.den * m.num));
  const band = percent < 50 ? 1 : percent < 70 ? 2 : percent < 85 ? 3 : percent < 100 ? 4 : 5;
  return { percent, band };
}

const isCap = (value: number, max: number) =>
  Number.isFinite(value) && Number.isFinite(max) && max > 0;

const BAND_FILL: Record<CapBandNumber, string> = {
  1: "bg-cap-band-1",
  2: "bg-cap-band-2",
  3: "bg-cap-band-3",
  4: "bg-cap-band-4",
  5: "bg-cap-band-5",
};

const BAND_WORDS = [
  "Under 50%",
  "50 to under 70%",
  "70 to under 85%",
  "85 to under 100%",
  "100% or more: at the cap",
] as const;

/**
 * The share of a cap in ink, beside its meter: the whole percent, or at band 5 a cross and "At the
 * cap". Draws nothing when there is no cap above 0 to be a share of.
 */
export function CapReading({ value, max }: { value: number; max: number }) {
  if (!isCap(value, max)) return null;
  const { percent, band } = capBand(value, max);
  return (
    <span className="shrink-0 font-mono text-small text-text-primary tabular-nums">
      {band === 5 ? (
        <>
          <span aria-hidden="true">✕ </span>At the cap
        </>
      ) : (
        `${String(percent)}%`
      )}
    </span>
  );
}

/**
 * The five bands in words, each a small bar in a track in its band colour. Hidden from assistive
 * technology: the visible reading and the meter's text carry it. Not a list, and no amounts.
 */
export function CapBandKey() {
  return (
    <p
      aria-hidden="true"
      className="flex flex-wrap gap-x-3 gap-y-1 text-caption text-text-secondary"
    >
      {BAND_WORDS.map((words, index) => (
        <span key={words} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-5 overflow-hidden rounded-ds-full border border-border-container bg-surface-subtle">
            <span className={cx("block h-full w-3/4", BAND_FILL[(index + 1) as CapBandNumber])} />
          </span>
          {words}
        </span>
      ))}
    </p>
  );
}

/**
 * The one meter of the run screens: a value against a total, on a track you can see. `name` is
 * its accessible name; `valueText` says the reading in words; `limit` marks the total as a cap.
 */
export function Meter({
  value,
  max,
  name,
  valueText,
  limit = false,
  className,
}: {
  value: number;
  max: number;
  name: string;
  valueText?: string;
  limit?: boolean;
  className?: string;
}) {
  const fill = limit && isCap(value, max) ? BAND_FILL[capBand(value, max).band] : "bg-chart-1";
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label={name}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={valueText}
      className={cx(
        "relative h-2.5 w-full min-w-0 overflow-hidden rounded-ds-full border border-border-container bg-surface-subtle",
        className,
      )}
    >
      <div className={cx("h-full rounded-ds-full", fill)} style={{ width: `${String(share)}%` }} />
      {limit && (
        <span aria-hidden="true" className="absolute inset-y-0 right-0 w-0.5 bg-text-primary" />
      )}
    </div>
  );
}
