import type { ActivityLine, Figure, ModuleWord } from "../run/slice-activity";
import { moduleName, type Run, type RunEvent } from "./api";

function amount(text: string | null | undefined): number | undefined {
  if (!text || !/^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(text)) return;
  const value = Number(text);
  if (Number.isFinite(value)) return value;
}

const usd = (value: number) => `USD ${value.toFixed(2)}`;

export function spendFigure(run: Run): Figure {
  const spent = amount(run.spent);
  if (spent === undefined)
    return {
      value: null,
      bar: null,
      note: "Cap usage is unavailable; the budget journal could not be read",
    };
  const settled = amount(run.settled_spent);
  const held = amount(run.held);
  const breakdown =
    settled !== undefined && held !== undefined
      ? `; ${usd(settled)} settled, ${usd(held)} reserved or unknown`
      : "";
  const cap = amount(run.cap);
  if (!cap)
    return {
      value: usd(spent),
      bar: null,
      note: `${cap === 0 ? "Configured cap is USD 0.00" : "Cap is unavailable"}${breakdown}`,
    };
  return {
    value: usd(spent),
    bar: {
      value: Math.min(spent, cap),
      max: cap,
      label: `${usd(spent)} of ${usd(cap)} cap usage${breakdown}`,
    },
  };
}

export function finishedFigure(run: Pick<Run, "modules">): Figure {
  const modules = run.modules.filter(([code]) => code !== "Report");
  const max = modules.length;
  if (max === 0) return { value: null, bar: null, note: "No analytical modules listed" };
  const value = modules.filter(([, state]) => state === "done").length;
  const text = `${String(value)} of ${String(max)}`;
  return { value: text, bar: { value, max, label: `${text} modules` } };
}

const STAMP = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const CASE_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** The case date, distinct from the UTC time at which a run event happened. */
export function asOfDate(at: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(at)) return at;
  const date = new Date(`${at}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === at
    ? CASE_DATE.format(date)
    : at;
}

/** "16 Nov 2026, 14:32 UTC" for the service's UTC time; any other text is returned as it is. */
export function stamp(at: string) {
  const time = Date.parse(at);
  return Number.isFinite(time) ? `${STAMP.format(time)} UTC` : at;
}

function clock(timestamp: string) {
  return `${timestamp.slice(11, 19)} UTC`;
}

export function elapsedFigure(run: Run) {
  if (!run.started_at) return { value: null, note: "No start time recorded" };
  const end = run.ended_at || (run.status === "running" ? run.observed_at : "");
  const seconds = Math.floor((Date.parse(end) - Date.parse(run.started_at)) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0)
    return { value: null, note: "Elapsed time is unavailable" };
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const value = [
    hours ? `${String(hours)} h` : "",
    minutes || hours ? `${String(minutes)} min` : "",
    `${String(seconds % 60)} s`,
  ]
    .filter(Boolean)
    .join(" ");
  const note = run.ended_at
    ? `${run.status === "finished" ? "Finished" : "Ended"} at ${clock(run.ended_at)}`
    : `Started at ${clock(run.started_at)}`;
  return { value, note };
}

const MILESTONES = {
  module_started: ["Running", "Module started."],
  module_accepted: ["Finished", "Module output accepted."],
  draft_rejected: ["Rejected", "Module draft rejected."],
  delivery_started: ["Running", "Report delivery started."],
  delivered: ["Finished", "Report delivered."],
  stopped: ["Interrupted", "Run execution stopped."],
  changes_not_produced: ["Not assessable", "Changes were unavailable for this run."],
  model_not_published: ["Not assessable", "The financial model was unavailable for publication."],
} as const satisfies Record<RunEvent["kind"], [ActivityLine["state"], string]>;

export function feedLines(run: Run): ActivityLine[] {
  const lines: ActivityLine[] = [];
  if (run.claimed_at)
    lines.push({
      who: run.submitted_by || "Run",
      time: clock(run.claimed_at),
      state: "Queued",
      text: "Run registered.",
    });
  if (run.started_at)
    lines.push({ who: "Run", time: clock(run.started_at), state: "Running", text: "Run started." });
  for (const event of run.events ?? []) {
    const [state, text] = MILESTONES[event.kind];
    lines.push({
      who: event.module ? moduleName(event.module) : "Run",
      time: clock(event.at),
      state,
      text,
    });
  }
  return lines.reverse();
}

export function moduleWord(state: Run["modules"][number][1], live: boolean): ModuleWord {
  if (state === "done") return "Finished";
  if (state === "stopped") return "Interrupted";
  if (state === "running") return live ? "Running" : "Interrupted";
  return live ? "Queued" : "Not run";
}
