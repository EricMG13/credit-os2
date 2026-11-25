import { useEffect, useState, type RefObject } from "react";
import { serviceText } from "../api";
import { outputEntries, type Snapshot } from "../publishedReport";
import { buildCalendar, upcomingCalendarRows } from "../report/Calendar";
import type { LoadSnapshot } from "./rowSnapshot";

export type NextEvent = {
  /** The date as the module wrote it. */
  date: string;
  name: string;
  /** The event's status as written, such as "Scheduled — Contract"; empty when none. */
  status: string;
  /** The recorded period holds the as-of date, so the exact date is unresolved. */
  withinRecordedPeriod: boolean;
  href: string;
  /** Some event row of the report could not be placed on the Calendar, so an earlier date may exist. */
  unplaced: boolean;
};

/**
 * The first dated event after the run's as-of date, by the Calendar's own reader. "none" only when
 * the Calendar read every event table and none is upcoming; "unknown" when it could not say: no
 * readable as-of date, the report is not in the snapshot, or event rows could not be read or placed.
 */
export function nextDatedEvent(snapshot: Snapshot, folder: string): NextEvent | "none" | "unknown" {
  const found = Object.entries(snapshot.workspace.runs).find(([, run]) => run.folder === folder);
  if (!found) return "unknown";
  const [routeKey, run] = found;
  const { rows, gaps } = buildCalendar(outputEntries(snapshot, run, routeKey), folder);
  const upcoming = upcomingCalendarRows(rows, run.asOf);
  if (upcoming === null) return "unknown";
  const first = upcoming[0];
  const date = first?.cells[0];
  const name = first?.cells[3];
  if (first && date && name)
    return {
      date,
      // A module code in the event's words is drawn as the module's name, never as the code.
      name: serviceText(name),
      status: serviceText(first.cells[4] ?? ""),
      withinRecordedPeriod: first.timingWithinRecordedPeriod,
      href: first.href,
      unplaced: gaps.length > 0,
    };
  return gaps.length > 0 ? "unknown" : "none";
}

export type NextEventState =
  | { status: "idle" | "loading" | "none" | "unknown" | "failed" }
  | { status: "found"; event: NextEvent };

/** The run's next dated event, read once the row is in view or has been opened (`enabled`) and kept after. */
export function useNextEvent(
  folder: string | undefined,
  enabled: boolean,
  load: LoadSnapshot,
): NextEventState {
  const [state, setState] = useState<{ folder: string; value: NextEventState } | null>(null);
  useEffect(() => {
    if (!enabled || !folder) return;
    let current = true;
    void load(folder)
      .then((snapshot) => {
        const event = snapshot ? nextDatedEvent(snapshot, folder) : "unknown";
        return typeof event === "string"
          ? ({ status: event } as const)
          : ({ status: "found", event } as const);
      })
      .catch(() => ({ status: "failed" }) as const)
      .then((value) => {
        if (current) setState({ folder, value });
      });
    return () => {
      current = false;
    };
  }, [folder, enabled, load]);
  if (!enabled || !folder) return { status: "idle" };
  return state?.folder === folder ? state.value : { status: "loading" };
}

/**
 * Whether the element has come into view, kept once true. Where the browser cannot say, it stays
 * false and the row reads its dates when it is opened.
 */
export function useSeen(target: RefObject<Element | null>): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = target.current;
    if (seen || !element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
      observer.disconnect();
      setSeen(true);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [target, seen]);
  return seen;
}
