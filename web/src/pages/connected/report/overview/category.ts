import { SECTOR } from "../../visuals/signal/scales";

/** The category slots a named group takes, in order: 1, 3, 4, 5, 6, then 8 (slots 2 and 7 stay
 * unused, so no two neighbours are the orange and green that read as worse and better). */
const SLOTS = [0, 2, 3, 4, 5, 7] as const;

/** The colour of the `k`th group (from 0) in the order it first appears; past the sixth, slot 8. */
export function categoryAt(k: number): string {
  return SECTOR[SLOTS[Math.min(Math.max(0, k), SLOTS.length - 1)] ?? 7];
}
