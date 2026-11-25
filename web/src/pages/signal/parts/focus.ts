// Focus behaviour the Signal dialogs and panels share.
import { useEffect, useRef } from "react";

/** Runs once when a dialog's or panel's content goes (after any exit animation), so focus never falls to the page. */
export function useOnGone(then: () => void) {
  const latest = useRef(then);
  useEffect(() => {
    latest.current = then;
  });
  useEffect(
    () => () => {
      latest.current();
    },
    [],
  );
}

/**
 * Focus goes to the target at once and again two frames later if it has fallen to the page: the
 * dialog library restores focus a frame late, and in a browser that restore can leave focus on the body.
 * With `within`, the second look also takes focus back when it has left that element or sits on
 * one that is no longer on the page.
 */
export function focusAgainIfLost(
  target: () => HTMLElement | null | undefined,
  within?: () => Element | null | undefined,
) {
  target()?.focus();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const active = document.activeElement;
      const home = within?.();
      const lost =
        active === null ||
        active === document.body ||
        (home != null && (!active.isConnected || !home.contains(active)));
      if (lost) target()?.focus();
    });
  });
}

/**
 * Remembers the control that opened a dialog, to give focus back to it once the dialog has gone.
 * `otherwise` says where focus goes when what the dialog did took that control off the page.
 */
export function useOpener(
  otherwise?: () => HTMLElement | null | undefined,
  within?: () => Element | null | undefined,
) {
  const opener = useRef<HTMLElement | null>(null);
  return {
    remember: () => {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    },
    /** What the dialog did takes the opener off the page: focus goes `otherwise` when it closes. */
    forget: () => {
      opener.current = null;
    },
    restore: () => {
      focusAgainIfLost(
        () => (opener.current?.isConnected === true ? opener.current : otherwise?.()),
        within,
      );
    },
  };
}
