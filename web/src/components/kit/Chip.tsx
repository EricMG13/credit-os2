import { XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";

const CHIP =
  "inline-flex min-h-8 max-w-full items-center rounded-ds-xs border px-3 py-1 text-left text-small font-medium break-words outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2 max-[480px]:min-h-11 max-[480px]:min-w-11 max-[480px]:justify-center cursor-pointer";
const ON = "border-action-subtle-hover bg-surface-selected text-text-link";
const OFF =
  "border-border-hairline bg-surface-card text-text-secondary hover:border-border-container hover:text-text-primary";

/** One filter chip: a toggle button; the pressed chip carries the accent tint. */
export function Chip({
  pressed,
  onPress,
  children,
  label,
}: {
  pressed: boolean;
  onPress: () => void;
  children: string;
  /** An accessible name where the visible text is not enough. */
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      className={cx(CHIP, pressed ? ON : OFF)}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

/**
 * A labelled group of chips over a list of choices plus All. A chosen value the list no longer
 * holds stays on screen as "(unavailable)" so a copied address never hides its own filter.
 */
export function ChipGroup({
  label,
  choices,
  value,
  onChange,
  all = "All",
}: {
  label: string;
  choices: readonly string[];
  value: string;
  onChange: (value: string) => void;
  all?: string;
}) {
  const missing = value !== "all" && !choices.includes(value);
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-wrap items-center gap-2">
      <span aria-hidden="true" className="text-caption text-text-tertiary">
        {label}
      </span>
      <Chip
        pressed={value === "all"}
        onPress={() => {
          onChange("all");
        }}
      >
        {all}
      </Chip>
      {missing && (
        <Chip
          pressed
          onPress={() => {
            onChange("all");
          }}
        >
          {`${value} (unavailable)`}
        </Chip>
      )}
      {choices.map((choice) => (
        <Chip
          key={choice}
          pressed={value === choice}
          onPress={() => {
            onChange(value === choice ? "all" : choice);
          }}
        >
          {choice}
        </Chip>
      ))}
    </div>
  );
}

/** A chip that stands for a filter in force and removes it when pressed. */
export function RemovableChip({ onRemove, children }: { onRemove: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={`Remove filter ${children}`}
      title={children}
      className={cx(CHIP, ON, "gap-1.5")}
      onClick={onRemove}
    >
      <span className="min-w-0">{children}</span>
      <XClose aria-hidden className="size-3.5 flex-none" />
    </button>
  );
}
