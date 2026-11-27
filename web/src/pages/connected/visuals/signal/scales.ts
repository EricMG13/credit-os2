/** Four sequential blue steps for a position in a range, lightest first. */
export const POSITION = [
  "var(--color-scale-position-1)",
  "var(--color-scale-position-2)",
  "var(--color-scale-position-3)",
  "var(--color-scale-position-4)",
] as const;

/** Three green steps for the better side of a comparison. */
export const BETTER = [
  "var(--color-scale-better-1)",
  "var(--color-scale-better-2)",
  "var(--color-scale-better-3)",
] as const;

/** Three orange steps for the worse side of a comparison. */
export const WORSE = [
  "var(--color-scale-worse-1)",
  "var(--color-scale-worse-2)",
  "var(--color-scale-worse-3)",
] as const;

/** Three gray steps for a comparison with no direction. */
export const NEUTRAL = [
  "var(--color-scale-neutral-1)",
  "var(--color-scale-neutral-2)",
  "var(--color-scale-neutral-3)",
] as const;

/** Five sequential amber steps for an amount, smallest first. */
export const AMOUNT = [
  "var(--color-scale-amount-1)",
  "var(--color-scale-amount-2)",
  "var(--color-scale-amount-3)",
  "var(--color-scale-amount-4)",
  "var(--color-scale-amount-5)",
] as const;

/** The eight category colours, in the order DESIGN.md gives them. */
export const SECTOR = [
  "var(--color-category-1)",
  "var(--color-category-2)",
  "var(--color-category-3)",
  "var(--color-category-4)",
  "var(--color-category-5)",
  "var(--color-category-6)",
  "var(--color-category-7)",
  "var(--color-category-8)",
] as const;

/** The colour of a share (clamped to 0..1) on a scale of equal-width bins; a NaN share or an empty scale throws. */
export function step(share: number, of: readonly string[]): string {
  if (Number.isNaN(share)) throw new RangeError("step: share is NaN");
  const last = of.length - 1;
  if (last < 0) throw new RangeError("step: scale is empty");
  const clamped = Math.min(1, Math.max(0, share));
  const colour = of[Math.min(last, Math.floor(clamped * of.length))];
  if (colour === undefined) throw new RangeError("step: no colour at index");
  return colour;
}
