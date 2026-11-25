import { useId, useState } from "react";
import { RadioButton, RadioField, RadioGroup, Text } from "react-aria-components";
import { cx } from "@/utils/cx";
import { Figure } from "../../connected/report/overview/Tile";
import type { StartDraft } from "../slice";

type Step = Extract<StartDraft, { step: "purpose" }>;
/** A card: the static page passes no cap; the connected page passes the service cap text. */
type CardItem = Step["purposes"][number] & { cap?: string };

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
  return (
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
                    {p.cap ? <Figure className="text-caption">{p.cap}</Figure> : null}
                  </span>
                </Text>
              </>
            )}
          </RadioButton>
        </RadioField>
      ))}
    </RadioGroup>
  );
}
