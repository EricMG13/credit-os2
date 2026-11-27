// The kind dot on a story's badge and the one key above a list (colour-signal-build ruling C6): the
// kind takes a category slot (3, 4, 5, 6 or 8; the card already has a status badge, so no slot 1, 2
// or 7). The dot is decorative: the kind word is the carrier. A market post has no slot and no dot.
// This is the only place the kind-to-slot table lives.
import {
  Legend,
  MarkSwatch,
  type LegendEntry,
} from "@/pages/connected/report/leads/kit/marks/Legend";
import { KIND_TABS } from "../FeedControls";
import type { SignalStory } from "../slice";

type Kind = SignalStory["kind"];
type Dotted = Exclude<Kind, "market">;
type Slot = `category-${3 | 4 | 5 | 6 | 8}`;

const SLOT: Record<Dotted, Slot> = {
  regulator: "category-3",
  news: "category-4",
  ratings: "category-5",
  research: "category-6",
  filing: "category-8",
};

// A kind the table lacks is a fault in the slice reader, not a kind to draw in a default colour.
function slotOf(kind: Kind): Slot | null {
  if (kind === "market") return null;
  const slot = (SLOT as Partial<Record<string, Slot>>)[kind];
  if (slot === undefined) throw new Error(`the slice reader let through an unknown kind "${kind}"`);
  return slot;
}

// Compile-time check: the kinds with a slot and the key's tab kinds are the same set.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
true satisfies Same<Dotted, (typeof KIND_TABS)[number][0]>;

/** The dot as the legend draws it, so the card and the key show the same mark. Nothing for a market post. */
export function KindDot({ kind }: { kind: Kind }) {
  const tone = slotOf(kind);
  if (tone === null) return null;
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="size-2.5 flex-none overflow-visible">
      <MarkSwatch kind="dot" tone={tone} x={0} y={0} />
    </svg>
  );
}

/**
 * The key above a list: one entry per kind the list draws with a dot, in the feed's tab order, with
 * the tab's own word; when any story has a strength, a last entry says what its pips' darkness means.
 * Nothing is drawn when the list has no dotted story.
 */
export function KindKey({ stories }: { stories: readonly SignalStory[] }) {
  const items: LegendEntry[] = KIND_TABS.filter(([kind]) =>
    stories.some((story) => story.kind === kind),
  ).map(([kind, text]) => ({ kind: "dot", tone: SLOT[kind], text }));
  if (items.length === 0) return null;
  if (stories.some((story) => story.strength !== null)) {
    items.push({ kind: "dot", tone: "amount-5", text: "Signal strength: darker is stronger" });
  }
  return (
    <div role="group" aria-label="Key" className="mt-4">
      <Legend items={items} />
    </div>
  );
}
