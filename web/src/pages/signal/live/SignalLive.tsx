// Signal in the connected app: the Signal screens on the service's snapshot. The page sits at the
// path /signal, edge to edge in the shell, and moves between its screens on the URL hash. Only the
// connected app mounts it; the design-reference app has no service and never asks for one.
import { useLayoutEffect, useMemo } from "react";
import { Button } from "@/components/base/buttons/button";
import { useHashRoute } from "../../../route";
import { PageHeader } from "../../../shell/PageHeader";
import { SourceContext } from "../../source";
import { SignalActionsContext } from "../actions";
import { FeedSkeleton } from "../FeedStates";
import { HOME_HREF, placeOf } from "./place";
import type { Failure } from "./service";
import { useLiveSignal } from "./useLiveSignal";

/** A full-bleed page restores the shell's padding around what is not the Signal frame. */
const PADDED = "p-4 sm:p-8";

function NotFound() {
  return (
    <div className={PADDED}>
      <PageHeader
        title="Page not found"
        actions={<Button href={HOME_HREF}>Back to For you</Button>}
      />
      <p className="mt-6 text-text-secondary">No Signal page has this address.</p>
    </div>
  );
}

/** Before the first snapshot: who is reading and what they follow is not known yet, so no frame is drawn. */
function Loading() {
  return (
    <div className={PADDED}>
      <PageHeader title="Signal" />
      <FeedSkeleton />
    </div>
  );
}

/** No snapshot could be read: the sentence, the reader's reason for a slice it refused, and Retry. */
function Unread({ failure, onRetry }: { failure: Failure; onRetry: () => void }) {
  return (
    <div className={PADDED}>
      <PageHeader
        title="Signal"
        actions={
          <Button color="secondary" onPress={onRetry}>
            Retry
          </Button>
        }
      />
      <p role="alert" className="mt-6 text-text-secondary">
        {failure.text}
      </p>
      {failure.reason === null ? null : (
        <p className="mt-2 wrap-anywhere text-text-secondary">{failure.reason}</p>
      )}
    </div>
  );
}

/**
 * A page load would start at the top. A hash route keeps the frame, whose content region is the one
 * scroller, so another screen would open at the offset the last one was left at.
 */
function useTopOnRoute(route: string) {
  useLayoutEffect(() => {
    const content = document.getElementById("signal-content");
    if (content !== null) content.scrollTop = 0;
  }, [route]);
}

export function SignalLive() {
  const route = useHashRoute();
  useTopOnRoute(route);
  const place = useMemo(() => placeOf(route), [route]);
  const { source, failure, actions } = useLiveSignal(place.at, route);
  if (place.matched === null) return <NotFound />;
  if (source === null) {
    return failure === null ? <Loading /> : <Unread failure={failure} onRetry={actions.refresh} />;
  }
  return (
    <SignalActionsContext value={actions}>
      <SourceContext value={source}>
        {place.matched.route.render(place.matched.params)}
      </SourceContext>
    </SignalActionsContext>
  );
}
