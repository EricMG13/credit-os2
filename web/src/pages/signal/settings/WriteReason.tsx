// The sentence beside a control that cannot write, which the control names as its description. The
// sample has no service; on the service the page says what the service cannot yet take.
import { useSignalActions } from "../actions";

export function WriteReason({
  id,
  className = "mb-3",
  sample,
  live,
}: {
  id: string;
  className?: string;
  sample: string;
  live: string;
}) {
  const actions = useSignalActions();
  return (
    <p id={id} className={`${className} text-sm text-text-tertiary`}>
      {actions === null ? sample : live}
    </p>
  );
}
