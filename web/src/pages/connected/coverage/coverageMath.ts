/**
 * A written figure as an exact decimal string: optional "-", digits, optional "." digits. No exponent.
 * `compare` and `abs` expect normalised values produced by `dec`, `stats` or `difference`.
 */
export type Dec = string;

export type Stats = { count: number; min: Dec; q1: Dec; median: Dec; q3: Dec; max: Dec };

/** The service's PLAIN_AMOUNT. */
const PLAIN_AMOUNT = /^-?\d[\d,]*(?:\.\d+)?$/;

/** A figure as an integer count of 10^-scale units. */
type Scaled = { n: bigint; scale: number };

function parse(text: string): Scaled {
  const negative = text.startsWith("-");
  const body = negative ? text.slice(1) : text;
  const [whole = "", fraction = ""] = body.split(".");
  const n = BigInt(whole + fraction);
  return { n: negative ? -n : n, scale: fraction.length };
}

function raise(x: Scaled, scale: number): bigint {
  return x.n * 10n ** BigInt(scale - x.scale);
}

function render(n: bigint, scale: number): Dec {
  const negative = n < 0n;
  const digits = (negative ? -n : n).toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, digits.length - scale);
  const fraction = digits.slice(digits.length - scale).replace(/0+$/, "");
  const text = fraction ? `${whole}.${fraction}` : whole;
  return negative && n !== 0n ? `-${text}` : text;
}

function scaleOf(xs: readonly Scaled[]): number {
  return xs.reduce((m, x) => Math.max(m, x.scale), 0);
}

/** Exactly the service's PLAIN_AMOUNT, commas removed; null for anything else. */
export function dec(text: string): Dec | null {
  if (!PLAIN_AMOUNT.test(text)) return null;
  const x = parse(text.replaceAll(",", ""));
  return render(x.n, x.scale);
}

function parseAll(values: readonly string[]): Scaled[] | null {
  const out: Scaled[] = [];
  for (const v of values) {
    const d = dec(v);
    if (d === null) return null;
    out.push(parse(d));
  }
  return out;
}

/** Magnitude of a normalised `Dec` (from `dec`, `stats` or `difference`). */
export function abs(value: Dec): Dec {
  return value.startsWith("-") ? value.slice(1) : value;
}

/** Order of two normalised `Dec` values (from `dec`, `stats` or `difference`). */
export function compare(a: Dec, b: Dec): -1 | 0 | 1 {
  const x = parse(a);
  const y = parse(b);
  const scale = scaleOf([x, y]);
  const l = raise(x, scale);
  const r = raise(y, scale);
  return l < r ? -1 : l > r ? 1 : 0;
}

/** a minus b; null if either is not a figure. */
export function difference(a: string, b: string): Dec | null {
  const xs = parseAll([a, b]);
  if (!xs) return null;
  const [x, y] = xs as [Scaled, Scaled];
  const scale = scaleOf(xs);
  return render(raise(x, scale) - raise(y, scale), scale);
}

/** Null for an empty list or any non-figure. */
export function sum(values: readonly string[]): Dec | null {
  const xs = parseAll(values);
  if (!xs || xs.length === 0) return null;
  const scale = scaleOf(xs);
  return render(
    xs.reduce((t, x) => t + raise(x, scale), 0n),
    scale,
  );
}

/** Median of integers already on one scale; two middle figures are halved by adding a decimal place. */
function median(sorted: readonly bigint[], scale: number): Dec {
  const mid = sorted.length >> 1;
  if (sorted.length % 2 === 1) return render(sorted[mid] as bigint, scale);
  const total = (sorted[mid - 1] as bigint) + (sorted[mid] as bigint);
  return render(total * 5n, scale + 1);
}

/** Null under three figures or any non-figure. Quartiles leave the middle figure out of both halves when the count is odd. */
export function stats(values: readonly string[]): Stats | null {
  const xs = parseAll(values);
  if (!xs || xs.length < 3) return null;
  const scale = scaleOf(xs);
  const sorted = xs.map((x) => raise(x, scale)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const half = sorted.length >> 1;
  const odd = sorted.length % 2;
  return {
    count: sorted.length,
    min: render(sorted[0] as bigint, scale),
    q1: median(sorted.slice(0, half), scale),
    median: median(sorted, scale),
    q3: median(sorted.slice(half + odd), scale),
    max: render(sorted[sorted.length - 1] as bigint, scale),
  };
}

/** <= q1: 0; <= median: 1; <= q3: 2; else 3. A value that is not a figure is a caller error and throws. */
export function band(value: string, of: Stats): 0 | 1 | 2 | 3 {
  const v = dec(value);
  if (v === null) throw new RangeError(`band needs a figure, got "${value}"`);
  if (compare(v, of.q1) <= 0) return 0;
  if (compare(v, of.median) <= 0) return 1;
  if (compare(v, of.q3) <= 0) return 2;
  return 3;
}
