// The sentence beside a control that cannot write, which the control names as its description. The
// sample has no service; on the service the page says what cannot be written from it yet.
import { useSignalActions } from "../actions";

/** True on a service: a control that would only change the page's memory is drawn unavailable. */
export function useNotWritable(): boolean {
  return useSignalActions() !== null;
}

/** `sample` absent: the control works in memory in the sample, so only the service's page says anything. */
export function WriteReason({
  id,
  className = "mb-3",
  sample,
  live,
}: {
  id: string;
  className?: string;
  sample?: string;
  live: string;
}) {
  const text = useNotWritable() ? live : sample;
  if (text === undefined) return null;
  return (
    <p id={id} className={`${className} text-sm text-text-tertiary`}>
      {text}
    </p>
  );
}
