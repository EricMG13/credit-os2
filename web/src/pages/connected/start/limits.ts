import { drawnModules, type ReadinessItem } from "../api";
import { PHASES } from "./customSelection";

type LimitOutcome = "will_refuse" | "gap" | "limited" | "check";
export type LimitGroup = {
  key: string; // id of the first cause
  outcome: LimitOutcome; // most severe member: will_refuse, gap, limited, check
  kind: "check" | "limit";
  causes: ReadinessItem[];
  consequences: ReadinessItem[];
  ids: string[]; // every member id, causes first
};

const SEVERITY: readonly LimitOutcome[] = ["will_refuse", "gap", "limited", "check"];

function severity(item: ReadinessItem): number {
  return SEVERITY.indexOf(item.outcome as LimitOutcome);
}

export function needsCheck(item: ReadinessItem): boolean {
  return severity(item) >= 0;
}

type Draft = { causes: ReadinessItem[]; consequences: ReadinessItem[]; first: number };

const isCause = (item: ReadinessItem) => (item.inherited_from ?? []).length === 0;

function commonFix(item: ReadinessItem): string | null {
  const fix = item.fix ?? "";
  if (!fix.trim()) return null;
  const kind = item.outcome === "check" ? "check" : "limit";
  return `${kind}\u0000${fix}`;
}

function strongestCause(decisions: readonly ReadinessItem[], module: string) {
  const causes = decisions.filter(
    (c) => isCause(c) && c.scope === module && ["will_refuse", "limited"].includes(c.outcome),
  );
  return causes.reduce<ReadinessItem | undefined>(
    (top, c) => (top === undefined || severity(c) < severity(top) ? c : top),
    undefined,
  );
}

export function groupLimits(items: readonly ReadinessItem[]): {
  groups: LimitGroup[];
  passive: ReadinessItem[];
} {
  const passive = items.filter((item) => !needsCheck(item));
  const decisions = items.filter(needsCheck);
  const drafts: Draft[] = [];
  const draftOf = new Map<ReadinessItem, Draft>();
  const byFix = new Map<string, Draft>();

  const open = (item: ReadinessItem, merge: string | null): Draft => {
    const existing = merge === null ? undefined : byFix.get(merge);
    if (existing) {
      existing.causes.push(item);
      draftOf.set(item, existing);
      return existing;
    }
    const draft: Draft = { causes: [item], consequences: [], first: items.indexOf(item) };
    drafts.push(draft);
    draftOf.set(item, draft);
    if (merge !== null) byFix.set(merge, draft);
    return draft;
  };

  for (const item of decisions.filter(isCause)) open(item, commonFix(item));

  // Draft of a producer module: its most severe will_refuse/limited cause, else
  // through the producer's own inherited items, never visiting a module twice.
  const resolve = (module: string, visited: Set<string>): Draft | undefined => {
    if (visited.has(module)) return undefined;
    visited.add(module);
    const best = strongestCause(decisions, module);
    if (best) return draftOf.get(best);
    for (const via of decisions.filter((c) => !isCause(c) && c.scope === module)) {
      for (const next of via.inherited_from ?? []) {
        const found = resolve(next, visited);
        if (found) return found;
      }
    }
    return undefined;
  };

  for (const item of decisions.filter((i) => !isCause(i))) {
    let home: Draft | undefined;
    for (const producer of item.inherited_from ?? []) {
      home = resolve(producer, new Set([item.scope]));
      if (home) break;
    }
    if (home) home.consequences.push(item);
    else open(item, null);
  }

  const groups = drafts.map((draft): LimitGroup => {
    const members = [...draft.causes, ...draft.consequences];
    const worst = members.reduce((top, m) => (severity(m) < severity(top) ? m : top));
    const [firstCause] = draft.causes;
    if (!firstCause) throw new Error("a decision group has no cause");
    return {
      key: firstCause.id,
      outcome: worst.outcome as LimitOutcome,
      kind: firstCause.outcome === "check" ? "check" : "limit",
      causes: draft.causes,
      consequences: draft.consequences,
      ids: members.map((m) => m.id),
    };
  });
  const order = new Map(groups.map((g, i) => [g, drafts[i]?.first ?? 0]));
  groups.sort(
    (a, b) =>
      SEVERITY.indexOf(a.outcome) - SEVERITY.indexOf(b.outcome) ||
      (order.get(a) ?? 0) - (order.get(b) ?? 0),
  );
  return { groups, passive };
}

export function decided(group: LimitGroup, accepted: ReadonlySet<string>): boolean {
  return group.ids.every((id) => accepted.has(id));
}

export function carryAccepted(
  previous: readonly ReadinessItem[],
  accepted: ReadonlySet<string>,
  next: readonly ReadinessItem[],
): Set<string> {
  const kept = new Set(
    previous.filter((p) => accepted.has(p.id)).map((p) => `${p.id}\u0000${p.reason}`),
  );
  return new Set(next.filter((n) => kept.has(`${n.id}\u0000${n.reason}`)).map((n) => n.id));
}

// The modules to keep if this will-refuse group's refusing modules are left out, in
// `requested` order; null when no offer makes sense. `modules` is the current choice
// (empty means every requested module).
export function leaveOut(
  group: LimitGroup,
  requested: readonly string[],
  modules: readonly string[],
): string[] | null {
  const refusingCauses = group.causes.filter((cause) => cause.outcome === "will_refuse");
  if (group.outcome !== "will_refuse" || refusingCauses.some((cause) => cause.scope === "run")) {
    return null;
  }
  const refusing = new Set(
    [...group.causes, ...group.consequences]
      .filter((item) => item.outcome === "will_refuse")
      .map((item) => item.scope),
  );
  const selected = modules.length ? modules : requested;
  const chosen = requested.filter((code) => selected.includes(code));
  const kept = chosen.filter((code) => !refusing.has(code));
  const keptPhases = kept.flatMap((code) =>
    (PHASES[code] ?? []).filter(({ id }) => selected.includes(id)).map(({ id }) => id),
  );
  const result = kept.flatMap((code) => [
    code,
    ...(PHASES[code] ?? []).filter(({ id }) => keptPhases.includes(id)).map(({ id }) => id),
  ]);
  // The forecast is sent but is not a module: a list holding only it is never offered.
  return drawnModules(kept).length > 0 && kept.length < chosen.length ? result : null;
}
