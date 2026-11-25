import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export const STEPS = [
  { key: "documents", title: "Documents", note: "Add files" },
  { key: "purpose", title: "Purpose", note: "Choose one" },
  { key: "confirm", title: "Confirm", note: "Approve" },
  { key: "context", title: "More context", note: "Optional" },
  { key: "start", title: "Start", note: "Paid step" },
] as const;

/** The steps of a run start. A step before `step` is complete; on any other step key (the
 *  started draft) all are. Each state is said in words as well as drawn. */
type Step = { key: string; title: string; note: string };

/** With `onSelect`, a completed step is a button that returns to it. */
export function Stepper({
  step,
  steps = STEPS,
  onSelect,
}: {
  step: string;
  steps?: readonly Step[];
  onSelect?: (key: string) => void;
}) {
  const at = steps.findIndex((s) => s.key === step);
  const current = at === -1 ? steps.length : at;
  return (
    <div className="@container">
      <ol
        aria-label="Steps in this run"
        className={cx(
          "grid items-center gap-1 @[620px]:flex @[620px]:gap-3",
          steps.length === 4 ? "grid-cols-4" : "grid-cols-5",
        )}
      >
        {steps.map((s, i) => {
          const done = i < current;
          const marker = (
            <span
              aria-hidden="true"
              className={cx(
                "flex size-7 shrink-0 items-center justify-center rounded-ds-full border font-mono text-small tabular-nums",
                i <= current
                  ? "border-action bg-action text-text-on-action"
                  : "border-border-hairline bg-surface-card text-text-tertiary",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
          );
          const label = (
            <span
              className={cx(
                "sr-only @[620px]:not-sr-only @[620px]:flex @[620px]:flex-col @[620px]:whitespace-nowrap",
                i === current && "@[620px]:border-b-2 @[620px]:border-action @[620px]:pb-1",
              )}
            >
              <span
                className={cx(
                  "text-small font-medium",
                  i > current ? "text-text-tertiary" : "text-text-primary",
                )}
              >
                {s.title}
              </span>
              <span className="text-caption text-text-tertiary">{s.note}</span>
              <span className="sr-only">
                {done ? "Complete" : i === current ? "Current step" : "Not started"}
              </span>
            </span>
          );
          return (
            <li
              key={s.key}
              aria-current={i === current ? "step" : undefined}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 last:flex-none"
            >
              {done && onSelect ? (
                <button
                  type="button"
                  aria-label={`Go back to ${s.title}`}
                  onClick={() => {
                    onSelect(s.key);
                  }}
                  className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-2 rounded-ds-sm max-sm:min-h-11 max-sm:min-w-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {marker}
                  {label}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2">
                  {marker}
                  {label}
                </span>
              )}
              {i < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cx(
                    "hidden h-px min-w-1 flex-1 @[620px]:block",
                    done ? "bg-action" : "bg-border-hairline",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
