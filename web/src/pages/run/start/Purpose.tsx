import { useId, useState } from "react";
import { RadioButton, RadioField, RadioGroup, Text } from "react-aria-components";
import { cx } from "@/utils/cx";
import { Figure } from "../../connected/report/overview/Tile";
import { Legend } from "../../connected/report/leads/kit/marks/Legend";
import { AMOUNT, step } from "../../connected/visuals/signal/scales";
import type { StartDraft } from "../slice";

type Step = Extract<StartDraft, { step: "purpose" }>;
/** A card: the static page passes no cap; the connected page passes the service cap text. */
type CardItem = Step["purposes"][number] & {
  cap?: string;
  /** The cap in USD, drawn as a bar against the largest cap shown. */
  capAmount?: number;
};

const CAP_LEGEND = [
  {
    kind: "bar",
    tone: "amount-4",
    text: "Bar length and shade: the cap against the largest cap shown",
  },
] as const;

/** The cap's size against the largest shown (C4): a bar in a track; the figure beside it says the value. */
function CapBar({ amount, largest }: { amount: number; largest: number }) {
  const share = largest > 0 ? amount / largest : 0;
  return (
    <span
      aria-hidden="true"
      data-part="cap-track"
      className="h-2 w-24 flex-none overflow-hidden rounded-full border border-border-container bg-surface-subtle"
    >
      {largest > 0 && (
        <span
          data-part="cap-fill"
          className="block h-full"
          style={{ width: `${String(share * 100)}%`, background: step(share, AMOUNT) }}
        />
      )}
    </span>
  );
}

// Kit candidate: radio cards (header strip with icon, title and a check control; body with the
// description and a small label).
/** The Purpose step: one card per purpose; the choice lives in memory only. */
export function Purpose({
  chosen,
  purposes,
}: {
  chosen: Step["chosen"];
  purposes: Step["purposes"];
}) {
  const headingId = useId();
  const [selected, setSelected] = useState<string | null>(chosen);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="font-display text-h3 text-text-primary">
          Purpose
        </h2>
        <p className="reading-copy text-body text-text-secondary">
          The purpose decides which modules run, and so how much of the cap the run can use.
        </p>
      </div>
      <PurposeCards label="Purpose" value={selected} onChange={setSelected} purposes={purposes} />
    </div>
  );
}

export function PurposeCards({
  label,
  value,
  onChange,
  purposes,
  className,
}: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  purposes: readonly CardItem[];
  className?: string;
}) {
  const amounts = purposes.flatMap((p) => (p.capAmount === undefined ? [] : [p.capAmount]));
  const largest = Math.max(0, ...amounts);
  return (
    <div className="flex flex-col gap-3">
      {amounts.length > 0 && (
        <div aria-hidden="true">
          <Legend items={CAP_LEGEND} />
        </div>
      )}
      <RadioGroup
        aria-label={label}
        value={value}
        onChange={onChange}
        className={cx("grid grid-cols-1 gap-3", className)}
      >
        {purposes.map((p) => (
          <RadioField key={p.id} value={p.id} aria-label={p.title}>
            <RadioButton
              className={({ isSelected, isFocusVisible }) =>
                cx(
                  "flex h-full min-h-8 cursor-pointer flex-col gap-3 rounded-ds-md border bg-surface-card p-4 outline-none",
                  isSelected
                    ? "border-action bg-surface-selected"
                    : "border-border-hairline hover:border-border-container",
                  isFocusVisible && "outline-2 outline-solid outline-offset-2 outline-focus",
                )
              }
            >
              {({ isSelected }) => (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-h4 font-medium text-text-primary">{p.title}</span>
                    <span
                      aria-hidden="true"
                      className={cx(
                        "ml-auto flex size-4 flex-none items-center justify-center rounded-full border",
                        isSelected ? "border-action" : "border-border-container",
                      )}
                    >
                      {isSelected ? (
                        <svg viewBox="0 0 8 8" className="size-2 fill-action">
                          <circle cx="4" cy="4" r="4" />
                        </svg>
                      ) : null}
                    </span>
                  </div>
                  <Text
                    slot="description"
                    elementType="div"
                    className="flex min-w-0 flex-1 flex-col justify-between gap-3"
                  >
                    <p className="text-small text-text-secondary">{p.description}</p>
                    <span className="flex flex-wrap items-center justify-between gap-2 border-t border-border-hairline pt-3">
                      <span className="rounded-ds-xs border border-border-hairline px-1.5 py-0.5 font-mono text-caption text-text-secondary">
                        {p.modules}
                      </span>
                      <span className="flex items-center gap-2">
                        {p.capAmount === undefined ? null : (
                          <CapBar amount={p.capAmount} largest={largest} />
                        )}
                        {p.cap ? <Figure className="text-caption">{p.cap}</Figure> : null}
                      </span>
                    </span>
                  </Text>
                </>
              )}
            </RadioButton>
          </RadioField>
        ))}
      </RadioGroup>
    </div>
  );
}
