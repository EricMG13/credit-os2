/**
 * A custom selection's rules and arithmetic as the Start run page shows them before a summary: which
 * modules the rules add and why, what each costs, and the sum, the hold and the cap. It is a copy
 * of `deploy_workflow.owners.cpos_custom` and the registry, held to them by
 * `tests/test_custom_selection_web.py` (the data) and by `customSelection.test.ts` (the answer key
 * and the launcher's own cases). The summary's `estimate` replaces every figure here: this is the
 * page's estimate from earlier runs, never a quote.
 */
import { moduleName } from "../api";
import data from "./customSelection.data.json";

/** The pathway id of a custom selection. */
export const CUSTOM = "custom";

export type CustomEffort = "fast" | "balanced" | "high";

/** The efforts a custom run is estimated at: the GPT runs the figures were measured on. */
export const CUSTOM_EFFORTS: readonly CustomEffort[] = ["fast", "balanced", "high"];

type Row = (typeof data.modules)[number];
export type OfferedModule = {
  id: string;
  required: readonly string[];
  /** The first sentence of the module's purpose, verbatim. */
  answers: string;
  /** The module owns no report block of a custom run: it shows on the Modules page only. */
  modulesPageOnly: boolean;
};

const TABLE = new Map<string, Row>(data.modules.map((row) => [row.id, row]));
const cents = (text: string) => Math.round(Number(text) * 100);

/** The offered modules, in the registry's order (the planner's tie-break). */
export const OFFERED: readonly OfferedModule[] = data.modules
  .filter((row) => row.offered)
  .map((row) => ({
    id: row.id,
    required: row.required,
    answers: row.answers,
    modulesPageOnly: row.modules_page_only,
  }));
const OFFERED_IDS: ReadonlySet<string> = new Set(OFFERED.map(({ id }) => id));

export const PRESETS: readonly { id: string; name: string; modules: readonly string[] }[] =
  data.presets;

/** What every run holds back while one call is in flight: the Copilot Sol hold, always. */
const HOLD_CENTS = cents(data.hold);

/** The label the estimate carries wherever it is drawn. */
export const ESTIMATE_LABEL = "Estimated from earlier runs";

export type Completion = {
  /** The chosen modules and those the rules add, in planned order; never CP-8 or the forecast. */
  modules: readonly string[];
  /** Why each module the rules added is in the run; a chosen module has none. */
  reasons: Readonly<Record<string, string>>;
  modulesPageOnly: ReadonlySet<string>;
};

/**
 * Each planned module's producers within the plan: its required ones, its optional ones that are
 * planned, and the fan-in of the evidence check (every module but itself and the decision) and of
 * the comparison with the earlier run (every other module).
 */
function dependencies(planned: ReadonlySet<string>) {
  const result = new Map<string, Set<string>>();
  for (const id of planned) {
    const row = TABLE.get(id);
    const needs = new Set(row?.required ?? []);
    for (const optional of row?.optional ?? []) if (planned.has(optional)) needs.add(optional);
    if (id === "CP-5")
      for (const other of planned) if (!data.not_cp5_fan_in.includes(other)) needs.add(other);
    if (id === "CP-8")
      for (const other of planned) if (!data.not_cp8_fan_in.includes(other)) needs.add(other);
    result.set(id, needs);
  }
  return result;
}

/** The planner's order: waves of modules whose producers are done, each wave in registry order. */
function planned(selected: ReadonlySet<string>) {
  const remaining = dependencies(selected);
  const ordered: string[] = [];
  while (remaining.size) {
    const ready = data.modules
      .map(({ id }) => id)
      .filter((id) => remaining.has(id) && remaining.get(id)?.size === 0);
    if (!ready.length) throw new Error("The selected modules depend on each other.");
    for (const id of ready) {
      ordered.push(id);
      remaining.delete(id);
      for (const needs of remaining.values()) needs.delete(id);
    }
  }
  return ordered;
}

function names(ids: readonly string[]) {
  const named = ids.map((id) => moduleName(id, "custom"));
  const last = named.at(-1) ?? "";
  return named.length === 1 ? last : `${named.slice(0, -1).join(", ")} and ${last}`;
}

/**
 * The chosen modules completed by the registry's rules, as `cpos_custom.complete`: CP-0 and CP-1
 * are always in, any other module only as a required producer of a module in the run. An entry that
 * is not offered (the forecast, CP-8, an unknown name) is left out: the page never offers one.
 */
export function complete(chosen: readonly string[]): Completion {
  const picked = [...new Set(chosen.filter((id) => OFFERED_IDS.has(id)))];
  const closure = new Set<string>([...data.always, ...picked]);
  for (const id of closure) for (const needed of TABLE.get(id)?.required ?? []) closure.add(needed);
  const modules = planned(closure);
  const reasons: Record<string, string> = {};
  for (const id of modules) {
    if (picked.includes(id)) continue;
    reasons[id] = data.always.includes(id)
      ? data.reasons.source
      : `Needed by ${names(modules.filter((other) => TABLE.get(other)?.required.includes(id)))}.`;
  }
  return {
    modules,
    reasons,
    modulesPageOnly: new Set(modules.filter((id) => TABLE.get(id)?.modules_page_only)),
  };
}

type EstimateRow = {
  module: string;
  name: string;
  cents: number;
  measured: boolean;
  /** The figure is the high-effort one: the module is sent at high effort. */
  high: boolean;
  /** Why the rules added the module; null for a chosen one. */
  added: string | null;
  modulesPageOnly: boolean;
};

export type Estimate = {
  rows: readonly EstimateRow[];
  sumCents: number;
  holdCents: number;
  /** Whole USD: the sum and the hold rounded up, at most the ceiling. */
  cap: number;
};

/** The modules sent at high effort: none at fast, the launcher's own set at balanced, all at high. */
const sentAtHigh = (effort: CustomEffort, module: string) =>
  effort === "high" || (effort === "balanced" && data.balanced_high.includes(module));

/** `numerator / denominator` rounded half up to a whole number. */
const halfUp = (numerator: number, denominator: number) =>
  Math.floor((2 * numerator + denominator) / (2 * denominator));

/** The handoffs CP-5 and CP-8 read in the measured runs, which their figures are for. */
const MEASURED_HANDOFFS: Readonly<Record<string, number>> = { "CP-5": 10, "CP-8": 12 };

/**
 * What the completed selection is expected to cost, as `cpos_custom.estimate`: each module's
 * figure at the effort (CP-5 and CP-8 scaled by the handoffs they read), rounded to the cent before
 * the sum; the hold; and the cap, `min(ceiling, ceiling(sum + hold))`. `compared` adds CP-8, which
 * only a summary that names an earlier run can say.
 */
export function estimate(
  done: Completion,
  { compared, effort, ceiling }: { compared: boolean; effort: CustomEffort; ceiling: number },
): Estimate {
  const all = [...done.modules, ...(compared ? ["CP-8"] : [])];
  const fanIn = dependencies(new Set(all));
  const rows = all.map((module): EstimateRow => {
    const row = TABLE.get(module);
    const high = sentAtHigh(effort, module);
    const base = cents(high ? (row?.high ?? "0") : (row?.medium ?? "0"));
    const measured = MEASURED_HANDOFFS[module];
    return {
      module,
      name: moduleName(module, "custom"),
      cents: measured ? halfUp(base * (fanIn.get(module)?.size ?? 0), measured) : base,
      measured: row?.measured ?? false,
      high,
      added: module === "CP-8" ? data.reasons.cp8 : (done.reasons[module] ?? null),
      modulesPageOnly: done.modulesPageOnly.has(module),
    };
  });
  const sumCents = rows.reduce((sum, row) => sum + row.cents, 0);
  return {
    rows,
    sumCents,
    holdCents: HOLD_CENTS,
    cap: Math.min(ceiling, Math.ceil((sumCents + HOLD_CENTS) / 100)),
  };
}

/** Money as the page writes it: "USD 7.17". */
export const usd = (amountCents: number) => `USD ${(amountCents / 100).toFixed(2)}`;

/** The efforts the page offers a custom run: only those the figures were measured at. */
export const customEffort = (effort: string): CustomEffort =>
  CUSTOM_EFFORTS.find((item) => item === effort) ?? "balanced";
