import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { getLatestIssuerRun } from "../api";
import { type Place, type IntakeView, accessibleText, placeOf } from "./intake";
import { focusField } from "./fields";

/**
 * Each step and the review sheet is a history entry, so the browser's Back and Forward move
 * between them with everything typed kept. `show` moves the form to a place and says whether it
 * could; an entry the form cannot show, such as a review it no longer holds, is passed over.
 * "stay" means the form must not leave where it is (a request is outstanding): the entry the
 * browser moved to is replaced by a fresh one for the place still shown, so the URL, the
 * history and the shown step agree.
 */
export function useStepHistory(place: Place, show: (target: Place) => boolean | "stay") {
  const entry = useRef(place);
  const arrive = useEffectEvent((target: Place) => {
    if (target !== place) {
      const shown = show(target);
      if (shown === "stay") {
        window.history.pushState({ startRun: place }, "");
        return;
      }
      if (!shown) {
        window.history.back();
        return;
      }
    }
    entry.current = target;
  });
  useEffect(() => {
    window.history.replaceState({ startRun: entry.current }, "");
    const listen = (event: PopStateEvent) => {
      const target = placeOf(event.state);
      if (target) arrive(target);
    };
    window.addEventListener("popstate", listen);
    return () => {
      window.removeEventListener("popstate", listen);
    };
  }, []);
  useEffect(() => {
    if (entry.current === place) return;
    entry.current = place;
    window.history.pushState({ startRun: place }, "");
  }, [place]);
}

/**
 * While the form holds work, leaving the page (a link, Reload, closing the tab) asks the browser
 * to confirm. Once Submit has started the run the page moves on without asking.
 */
export function useLeaveWarning(holdsWork: boolean, submitted: RefObject<boolean>) {
  useEffect(() => {
    if (!holdsWork) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!submitted.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [holdsWork, submitted]);
}

/** A notice is for the ID still in the field; a late reply for a previous ID is ignored. */
export function useIssuerNotice(issuerId: string, typedName: string) {
  const [notice, setNotice] = useState<{ issuerId: string; text: string }>();
  useEffect(() => {
    if (!issuerId) return;
    let current = true;
    const timer = window.setTimeout(() => {
      void getLatestIssuerRun(issuerId).then(
        (latest) => {
          const named: typeof latest & { issuer_name?: string } = latest;
          const filed =
            named.issuer_name && named.issuer_name !== typedName.trim()
              ? ` Filed name: ${named.issuer_name}.`
              : "";
          if (current)
            setNotice(
              latest.runs > 0
                ? {
                    issuerId,
                    text: `This issuer has ${String(latest.runs)} ${latest.runs === 1 ? "run" : "runs"}; the latest is as of ${latest.latest_as_of}.${filed}`,
                  }
                : undefined,
            );
        },
        () => {
          if (current) setNotice(undefined);
        },
      );
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [issuerId, typedName]);
  return notice?.issuerId === issuerId ? notice.text : "";
}

export function useIntakeFocus(
  fieldError: IntakeView["problem"],
  busy: IntakeView["busy"],
  focusedBeforeRef: RefObject<{ node: HTMLElement; text: string } | null>,
) {
  useEffect(() => {
    if (fieldError?.focus && busy === undefined) focusField(fieldError.field);
  }, [fieldError, busy]);

  useEffect(() => {
    if (busy !== undefined) return;
    const remembered = focusedBeforeRef.current;
    focusedBeforeRef.current = null;
    if (
      remembered?.node.isConnected &&
      document.activeElement === document.body &&
      !remembered.node.matches(":disabled") &&
      accessibleText(remembered.node) === remembered.text
    )
      remembered.node.focus();
  }, [busy, focusedBeforeRef]);
}
