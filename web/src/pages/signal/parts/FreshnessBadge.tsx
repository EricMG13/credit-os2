// The freshness line as a status badge. Shapes and tones come from the kit's "Freshness" set (and
// the Status set's Warning); the words are the delivered ones, which the kit's StatusBadge cannot
// carry (it draws only the set's own word). Nothing animates, including while checking.
import { Badge } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import { STATUS_SETS, type State, type Tone } from "@/components/status/sets";
import { StatusShape } from "@/components/status/shapes";
import { cx } from "@/utils/cx";
import type { SignalFreshness } from "../slice";

const COLOUR: Record<Tone, BadgeColors> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "sky",
  neutral: "gray",
  action: "brand",
  gap: "gap",
};
const MARK: Partial<Record<Tone, string>> = {
  success: "text-success-mark",
  warning: "text-warning-mark",
};

/** A delivered suffix (failing sources, a check error) is a problem in any state. */
const suffixes = (freshness: SignalFreshness) =>
  [freshness.failing, freshness.error].filter((part) => part !== null);

function look(freshness: SignalFreshness): State {
  const { Checked, "Not checked yet": NotChecked } = STATUS_SETS.Freshness;
  if (freshness.state === "unavailable" || suffixes(freshness).length > 0) {
    return STATUS_SETS.Status.Warning;
  }
  return freshness.state === "checked" ? Checked : NotChecked;
}

function lead(freshness: SignalFreshness): string {
  switch (freshness.state) {
    case "checking":
      return "Checking sources";
    case "not-checked":
      return "Sources not checked yet";
    case "unavailable":
      return "Source status unavailable";
    case "checked":
      if (freshness.checked === null) {
        throw new Error("the slice reader let through checked sources with no time");
      }
      return `Sources checked ${freshness.checked}`;
  }
}

/** The delivered text: the state's words, then each delivered suffix after " · ". */
const words = (freshness: SignalFreshness) => [lead(freshness), ...suffixes(freshness)].join(" · ");

export function FreshnessBadge({ freshness }: { freshness: SignalFreshness }) {
  const { shape, tone } = look(freshness);
  return (
    <Badge
      color={COLOUR[tone]}
      // One line is 24px tall, so a 12px corner draws the kit's pill; where the page is narrower
      // than the words (a failing source's suffix at 320px) they wrap inside it.
      className="max-w-full gap-1.5 rounded-xl pl-2 whitespace-normal"
      icon={
        <span className={cx("inline-flex shrink-0 rounded-ds-full", MARK[tone])}>
          <StatusShape shape={shape} />
        </span>
      }
    >
      {words(freshness)}
    </Badge>
  );
}
