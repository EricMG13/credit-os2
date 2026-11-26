import { createContext, useContext, useEffect } from "react";

/** The one condition for offering a run: never read-only, never on a retained test preview. */
export const canStartRun = (readOnly: boolean, preview: boolean) => !readOnly && !preview;

/** How a page tells the app that what it shows is a test preview; it does nothing outside the app. */
export const PreviewReport = createContext<(preview: boolean) => void>(() => undefined);

/**
 * Whether this page may offer a run. The page also tells the app whether it shows a test preview,
 * so the top bar's Start run follows the same answer.
 */
export function useCanStart(readOnly: boolean, preview: boolean) {
  const report = useContext(PreviewReport);
  useEffect(() => {
    report(preview);
    return () => {
      report(false);
    };
  }, [report, preview]);
  return canStartRun(readOnly, preview);
}
