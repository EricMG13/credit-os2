// A control that writes has no service to write to in the sample, so it is drawn disabled with its
// reason in view, which it names as its description. On a service the control works and nothing is
// said.
import type { ReactNode } from "react";
import { useSignalActions } from "../actions";

/** What a writing control takes in the sample (disabled, described by its reason) and on a service (neither). */
export function useSampleOff(reasonId: string) {
  const sample = useSignalActions() === null;
  return { isDisabled: sample, "aria-describedby": sample ? reasonId : undefined };
}

export function SampleReason({
  id,
  className = "mb-3",
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  if (useSignalActions() !== null) return null;
  return (
    <p id={id} className={`${className} text-sm text-text-tertiary`}>
      {children}
    </p>
  );
}
