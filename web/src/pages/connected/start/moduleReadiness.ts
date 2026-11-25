import { drawnModules, type ReadinessItem } from "../api";
import { byStage } from "../report/stages";
import { needsCheck } from "./limits";
import { scopeText } from "./limitWords";

/** The outcomes a limit can have, most severe first: the "Run limits" status set's own order. */
const LIMITS = ["will_refuse", "gap", "limited", "check"] as const;
type LimitOutcome = (typeof LIMITS)[number];

/**
 * A module's mark. `unchecked`: before any review the page does not know it (the service judges
 * readiness only when it makes the summary). After a review, from the summary's own items only:
 * the most severe limit on the module, or `none` when the summary names no limit for it. The
 * page never calls a module ready on its own.
 */
export type ModuleMark = "unchecked" | "none" | LimitOutcome;

export type ModuleRow = { id: string; name: string; mark: ModuleMark };

type StageGroup = { number?: string; name: string; rows: ModuleRow[] };

export type ModuleReadiness = {
  /** Whether the marks come from a summary. */
  checked: boolean;
  /** Limits on the whole run, not on one module; undefined when the summary has none. */
  run?: ModuleRow;
  /** Limits on something the run does not draw as a module (the cash-flow model, say). */
  other: ModuleRow[];
  groups: StageGroup[];
  /** Modules drawn: the forecast is sent with the run but is not drawn as a module. */
  count: number;
};

// The five stages' numbers, by the names `report/stages.ts` gives them.
const STAGE_NUMBER: Readonly<Record<string, string>> = {
  Sources: "01",
  Financials: "02",
  Credit: "03",
  "Structure and market": "04",
  "Validation and decision": "05",
};

function worst(items: readonly ReadinessItem[]): LimitOutcome | undefined {
  return LIMITS.find((outcome) => items.some((item) => item.outcome === outcome));
}

/**
 * The run's modules by stage, with each one's mark. `planned` is what the form will ask for (in
 * the pathway's order); `checked`, once a summary exists, is the service's module list and items,
 * and then it alone decides which modules are drawn and how they are marked.
 */
export function moduleReadiness(
  planned: readonly string[],
  checked?: { modules: readonly string[]; items: readonly ReadinessItem[] },
): ModuleReadiness {
  const modules = drawnModules(checked ? checked.modules : planned);
  const limits = checked?.items.filter(needsCheck) ?? [];
  const markOf = (scope: string): ModuleMark =>
    checked ? (worst(limits.filter((item) => item.scope === scope)) ?? "none") : "unchecked";
  const rows = modules.map((id) => ({ id, name: scopeText(id), mark: markOf(id) }));
  const drawn = new Set(modules);
  const others = [...new Set(limits.map((item) => item.scope))].filter(
    (scope) => scope !== "run" && !drawn.has(scope),
  );
  const run = markOf("run");
  return {
    checked: checked !== undefined,
    ...(run !== "none" && run !== "unchecked"
      ? { run: { id: "run", name: scopeText("run"), mark: run } }
      : {}),
    other: others.map((scope) => ({ id: scope, name: scopeText(scope), mark: markOf(scope) })),
    groups: byStage(rows).map((group) => ({
      ...(Object.hasOwn(STAGE_NUMBER, group.name) ? { number: STAGE_NUMBER[group.name] } : {}),
      name: group.name,
      rows: group.rows,
    })),
    count: modules.length,
  };
}

/** The rows that carry a limit, in stage order: the whole run first, then modules, then others. */
export function limitedRows(readiness: ModuleReadiness): ModuleRow[] {
  const marked = (row: ModuleRow) => row.mark !== "none" && row.mark !== "unchecked";
  return [
    ...(readiness.run ? [readiness.run] : []),
    ...readiness.groups.flatMap((group) => group.rows.filter(marked)),
    ...readiness.other.filter(marked),
  ];
}
