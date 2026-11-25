// The new-stories pill (mock `.pill`, departure 17): white with a hairline edge, a status dot, the
// delivered label and one action. The dot is decoration; the words carry the meaning.
import { FOCUS, TARGET } from "./classes";

export function Pill({
  label,
  action,
  onAction,
}: {
  label: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-ds-full border border-border-hairline bg-surface-card pr-1 pl-3 text-caption text-text-primary">
      <span aria-hidden="true" className="size-2 rounded-ds-full bg-action" />
      <b className="border-r border-border-hairline pr-2 font-medium">{label}</b>
      <button
        type="button"
        aria-label={`${action} ${label}`}
        onClick={onAction}
        // 24px to press, inside the pill's own height.
        className={`cursor-pointer rounded-ds-full px-2 font-medium text-text-link hover:underline ${TARGET} ${FOCUS}`}
      >
        {action}
      </button>
    </span>
  );
}
