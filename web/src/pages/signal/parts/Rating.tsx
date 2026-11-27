// Three round pips and a word, read-only. `marks` is how many are filled; the word is supplied. The
// name read aloud is the word and "signal": no number is computed.
//
// This departs from the shadcnblocks rating it began as (three stars). Basis: colour-signal-build
// ruling C4 and the PR 7 instruction "three pips filled with AMOUNT steps 1, 3, 5 for marks 1-3, each
// with the --color-scale-amount-edge 1 px edge, and the word". Every filled pip takes the one step the
// mark count names; an empty pip has no fill and the grey hairline, so a pale step-1 pip is told from
// an empty one by its edge. The word carries the meaning; the colour only repeats it.
import { cx } from "@/utils/cx";

const FILLED = {
  1: "fill-scale-amount-1",
  2: "fill-scale-amount-3",
  3: "fill-scale-amount-5",
} as const;

export function Rating({ marks, word }: { marks: 1 | 2 | 3; word: string }) {
  return (
    <span
      role="img"
      aria-label={`${word} signal`}
      className="inline-flex items-center gap-2 text-small font-medium text-text-primary"
    >
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2, 3].map((position) => (
          <svg
            key={position}
            viewBox="0 0 16 16"
            width="16"
            height="16"
            className={cx(
              "size-4 flex-none",
              position <= marks
                ? `${FILLED[marks]} stroke-scale-amount-edge`
                : "fill-none stroke-fg-quaternary",
            )}
          >
            <circle cx="8" cy="8" r="6.5" strokeWidth="1" />
          </svg>
        ))}
      </span>
      <span aria-hidden="true">{word}</span>
    </span>
  );
}
