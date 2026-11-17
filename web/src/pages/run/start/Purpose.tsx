import { useId, useState } from "react";
import { RadioButton, RadioField, RadioGroup, Text } from "react-aria-components";
import { cx } from "@/utils/cx";
import type { StartDraft } from "../slice";

type Step = Extract<StartDraft, { step: "purpose" }>;

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
        <p className="text-sm text-text-secondary">
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
}: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  purposes: Step["purposes"];
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onChange={onChange}
      className="flex flex-col gap-3"
    >
      {purposes.map((p) => (
        <RadioField key={p.id} value={p.id} aria-label={p.title}>
          <RadioButton
            className={({ isSelected, isFocusVisible }) =>
              cx(
                "block cursor-pointer rounded-xl bg-primary ring-1 ring-secondary ring-inset outline-none",
                isSelected && "ring-2 ring-brand",
                isFocusVisible && "outline-2 outline-solid outline-offset-2 outline-brand",
              )
            }
          >
            {({ isSelected }) => (
              <>
                <div className="flex items-center gap-3 rounded-t-xl border-b border-border-hairline py-3 pr-5 pl-3">
                  <span className="text-md font-semibold text-secondary">{p.title}</span>
                  <span
                    aria-hidden="true"
                    className={cx(
                      "ml-auto flex size-4 flex-none items-center justify-center rounded-full ring-1 ring-primary ring-inset",
                      isSelected && "ring-2 ring-brand",
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
                  className="flex items-start justify-between gap-4 p-4"
                >
                  <p className="min-w-0 text-sm text-tertiary">{p.description}</p>
                  <span className="max-w-1/3 shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium text-secondary ring-1 ring-primary ring-inset">
                    {p.modules}
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
